import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Store } from './store.entity'
import { Tenant } from './tenant.entity'

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store

  @Column()
  storeId: number

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column()
  tenantId: number

  @Column({ length: 20, nullable: true })
  sku: string

  @Column({ length: 100 })
  name: string

  @Column({ length: 50 })
  category: string

  @Column({ length: 20 })
  unit: string

  @Column({ length: 20, nullable: true })
  conversionUnit: string

  @Column({ type: 'int', nullable: true })
  conversionRate: number

  @Column({ type: 'int' })
  buyPrice: number

  @Column({ type: 'int' })
  sellPrice: number

  @Column({ type: 'int', default: 0 })
  stock: number

  @Column({ type: 'int' })
  minStock: number

  @Column({ nullable: true, length: 100 })
  barcode: string

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date
}
