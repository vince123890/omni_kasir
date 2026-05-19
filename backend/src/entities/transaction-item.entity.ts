import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Transaction } from './transaction.entity'
import { Product } from './product.entity'

@Entity('transaction_items')
export class TransactionItem {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Transaction, (tx) => tx.items)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction

  @Column()
  transactionId: number

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product

  @Column()
  productId: number

  // Snapshot nama produk saat transaksi (BL-007)
  @Column({ length: 100 })
  productName: string

  @Column({ type: 'int' })
  qty: number

  // Snapshot harga saat transaksi (BL-007)
  @Column({ type: 'int' })
  price: number

  @Column({ type: 'int' })
  subtotal: number
}
