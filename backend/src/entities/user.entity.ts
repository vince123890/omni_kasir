import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from './tenant.entity'

export type UserRole = 'admin' | 'owner' | 'admin_store' | 'kasir'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 100 })
  name: string

  @Column({ unique: true, length: 100 })
  email: string

  @Column({ select: false })
  password: string

  @Column({ type: 'enum', enum: ['admin', 'owner', 'admin_store', 'kasir'] })
  role: UserRole

  @Column({ nullable: true })
  tenantId: number

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ nullable: true })
  storeId: number

  @Column({ default: true })
  isActive: boolean

  @Column({ nullable: true, type: 'datetime' })
  passwordChangedAt: Date

  @Column({ nullable: true, type: 'datetime' })
  lastLogin: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date
}
