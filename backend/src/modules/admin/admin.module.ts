import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { SubscriptionPlan } from '../../entities/subscription-plan.entity'
import { Tenant } from '../../entities/tenant.entity'
import { Subscription } from '../../entities/subscription.entity'
import { User } from '../../entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, Tenant, Subscription, User])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
