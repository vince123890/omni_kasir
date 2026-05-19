import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Store } from './store.entity'
import { Tenant } from './tenant.entity'
import { User } from './user.entity'
import { TransactionItem } from './transaction-item.entity'

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 25 })
  transactionCode: string

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cashier_id' })
  cashier: User

  @Column()
  cashierId: number

  @Column({ type: 'int' })
  totalAmount: number

  @Column({ type: 'int' })
  paidAmount: number

  @Column({ type: 'int' })
  changeAmount: number

  @Column({ type: 'enum', enum: ['CASH'], default: 'CASH' })
  paymentMethod: string

  @Column({ type: 'enum', enum: ['COMPLETED', 'VOIDED'], default: 'COMPLETED' })
  status: string

  @Column({ nullable: true, type: 'text' })
  note: string

  @OneToMany(() => TransactionItem, (item) => item.transaction, { cascade: true })
  items: TransactionItem[]

  @CreateDateColumn()
  createdAt: Date
}
