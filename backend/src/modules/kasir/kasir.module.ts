import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { KasirController } from './kasir.controller'
import { KasirService } from './kasir.service'
import { AdminStoreModule } from '../admin-store/admin-store.module'
import { Transaction } from '../../entities/transaction.entity'
import { TransactionItem } from '../../entities/transaction-item.entity'
import { Product } from '../../entities/product.entity'
import { StockMovement } from '../../entities/stock-movement.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionItem, Product, StockMovement]),
    AdminStoreModule,
  ],
  controllers: [KasirController],
  providers: [KasirService],
})
export class KasirModule {}
