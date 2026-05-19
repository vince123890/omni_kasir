import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OwnerController } from './owner.controller'
import { OwnerService } from './owner.service'
import { Store } from '../../entities/store.entity'
import { User } from '../../entities/user.entity'
import { Transaction } from '../../entities/transaction.entity'
import { Subscription } from '../../entities/subscription.entity'
import { SubscriptionPlan } from '../../entities/subscription-plan.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Store, User, Transaction, Subscription, SubscriptionPlan])],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}
