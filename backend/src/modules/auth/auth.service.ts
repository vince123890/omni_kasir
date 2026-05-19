import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../../entities/user.entity'
import { Subscription } from '../../entities/subscription.entity'
import { SubscriptionPlan } from '../../entities/subscription-plan.entity'
import { Tenant } from '../../entities/tenant.entity'
import { Store } from '../../entities/store.entity'
import { LoginDto } from './dto/login.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Subscription) private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(SubscriptionPlan) private planRepo: Repository<SubscriptionPlan>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'name', 'email', 'password', 'role', 'tenantId', 'storeId', 'isActive'],
    })

    if (!user) throw new UnauthorizedException('Email atau password salah')
    if (!user.isActive) throw new UnauthorizedException('Akun Anda dinonaktifkan, hubungi admin')

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) throw new UnauthorizedException('Email atau password salah')

    // Cek subscription untuk owner/admin_store/kasir (BL-002)
    if (user.tenantId) {
      const sub = await this.subscriptionRepo.findOne({
        where: { tenantId: user.tenantId, isActive: true },
      })
      if (!sub || new Date(sub.expiredAt) < new Date()) {
        throw new UnauthorizedException('Subscription Anda telah berakhir')
      }
    }

    const payload = { sub: user.id, role: user.role, tenantId: user.tenantId, storeId: user.storeId }
    const accessToken = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRY', '7d'),
    })

    // Update lastLogin
    await this.userRepo.update(user.id, { lastLogin: new Date() })

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId, storeId: user.storeId },
    }
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      })
      const user = await this.userRepo.findOne({ where: { id: payload.sub } })
      if (!user || !user.isActive) throw new UnauthorizedException()

      const newPayload = { sub: user.id, role: user.role, tenantId: user.tenantId, storeId: user.storeId }
      return {
        accessToken: this.jwtService.sign(newPayload),
        refreshToken: this.jwtService.sign(newPayload, {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRY', '7d'),
        }),
      }
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid atau sudah expired')
    }
  }

  async me(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException()

    let tenantName: string | null = null
    let tenantEntityType: string | null = null
    let storeName: string | null = null
    let planName: string | null = null
    let expiredAt: string | null = null

    if (user.tenantId) {
      const tenant = await this.tenantRepo.findOne({ where: { id: user.tenantId } })
      tenantName = tenant?.name ?? null
      tenantEntityType = tenant?.entityType ?? null

      const sub = await this.subscriptionRepo.findOne({ where: { tenantId: user.tenantId, isActive: true } })
      if (sub) {
        const plan = await this.planRepo.findOne({ where: { id: sub.planId } })
        planName = plan?.name ?? null
      }
      expiredAt = sub?.expiredAt ? new Date(sub.expiredAt).toISOString().slice(0, 10) : null
    }

    if (user.storeId) {
      const store = await this.storeRepo.findOne({ where: { id: user.storeId } })
      storeName = store?.name ?? null
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      storeId: user.storeId,
      tenantName,
      tenantEntityType,
      storeName,
      planName,
      expiredAt,
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Konfirmasi password tidak sesuai')
    }
    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'password'] })
    if (!user) throw new UnauthorizedException()

    const valid = await bcrypt.compare(dto.oldPassword, user.password)
    if (!valid) throw new BadRequestException('Password lama tidak sesuai')
    if (dto.oldPassword === dto.newPassword) throw new BadRequestException('Password baru harus berbeda dari password lama')

    const rounds = this.config.get<number>('BCRYPT_ROUNDS', 10)
    const hashed = await bcrypt.hash(dto.newPassword, rounds)
    await this.userRepo.update(userId, { password: hashed, passwordChangedAt: new Date() })
    return { message: 'Password berhasil diubah' }
  }
}
