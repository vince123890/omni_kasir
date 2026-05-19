import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from './tenant.entity'

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 20 })
  storeCode: string

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column()
  tenantId: number

  @Column({ length: 100 })
  name: string

  @Column({ type: 'text' })
  address: string

  @Column({ length: 20, nullable: true })
  phone: string

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date
}
