import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../../../entities/user.entity'

export interface JwtPayload {
  sub: number
  role: string
  tenantId: number | null
  storeId: number | null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } })
    if (!user || !user.isActive) throw new UnauthorizedException('Token tidak valid')
    return { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId, storeId: user.storeId }
  }
}
