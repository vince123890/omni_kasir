import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 100 })
  name: string

  @Column({ type: 'int' })
  price: number

  @Column({ type: 'int' })
  durationDays: number

  @Column({ type: 'int' })
  maxStores: number

  @Column({ type: 'int' })
  maxCashiersPerStore: number

  @Column({ default: true })
  isActive: boolean

  @Column({ default: false })
  isPopular: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
