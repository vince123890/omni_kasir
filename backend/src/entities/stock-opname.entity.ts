import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Store } from './store.entity'
import { Tenant } from './tenant.entity'
import { User } from './user.entity'
import { StockOpnameItem } from './stock-opname-item.entity'

@Entity('stock_opnames')
export class StockOpname {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 20 })
  opnameCode: string

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

  @Column({ type: 'date' })
  opnameDate: Date

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User

  @Column()
  createdBy: number

  @Column({ type: 'enum', enum: ['DRAFT', 'COMPLETED'], default: 'COMPLETED' })
  status: string

  @OneToMany(() => StockOpnameItem, (item) => item.opname, { cascade: true })
  items: StockOpnameItem[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
