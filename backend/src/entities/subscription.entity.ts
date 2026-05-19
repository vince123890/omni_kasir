import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from './tenant.entity'
import { SubscriptionPlan } from './subscription-plan.entity'

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column()
  tenantId: number

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan

  @Column()
  planId: number

  @Column({ type: 'date' })
  startAt: Date

  @Column({ type: 'date' })
  expiredAt: Date

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
