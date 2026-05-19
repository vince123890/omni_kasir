import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { StockOpname } from './stock-opname.entity'
import { Product } from './product.entity'

@Entity('stock_opname_items')
export class StockOpnameItem {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => StockOpname, (opname) => opname.items)
  @JoinColumn({ name: 'opname_id' })
  opname: StockOpname

  @Column()
  opnameId: number

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product

  @Column()
  productId: number

  @Column({ type: 'int' })
  qtySystem: number

  @Column({ type: 'int' })
  qtyActual: number

  @Column({ type: 'int' })
  difference: number

  // Wajib diisi jika difference !== 0 (BL-020)
  @Column({ nullable: true, type: 'text' })
  reason: string
}
