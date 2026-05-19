import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Product } from './product.entity'
import { Store } from './store.entity'
import { Tenant } from './tenant.entity'
import { User } from './user.entity'

export type MovementType = 'IN' | 'OUT' | 'CONVERT' | 'OPNAME'

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 30 })
  movementCode: string

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product

  @Column()
  productId: number

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

  @Column({ type: 'enum', enum: ['IN', 'OUT', 'CONVERT', 'OPNAME'] })
  type: MovementType

  @Column({ type: 'int' })
  qty: number

  @Column({ type: 'int' })
  qtyBefore: number

  @Column({ type: 'int' })
  qtyAfter: number

  @Column({ nullable: true, length: 100 })
  referenceId: string

  @Column({ nullable: true, type: 'text' })
  note: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User

  @Column()
  createdBy: number

  @CreateDateColumn()
  createdAt: Date
}
