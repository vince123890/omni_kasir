import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { User } from '../../entities/user.entity'
import { Subscription } from '../../entities/subscription.entity'
import { SubscriptionPlan } from '../../entities/subscription-plan.entity'
import { Tenant } from '../../entities/tenant.entity'
import { Store } from '../../entities/store.entity'

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, Subscription, SubscriptionPlan, Tenant, Store]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRY', '8h') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
