import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminStoreController } from './admin-store.controller'
import { AdminStoreService } from './admin-store.service'
import { Product } from '../../entities/product.entity'
import { StockMovement } from '../../entities/stock-movement.entity'
import { StockOpname } from '../../entities/stock-opname.entity'
import { StockOpnameItem } from '../../entities/stock-opname-item.entity'
import { Transaction } from '../../entities/transaction.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Product, StockMovement, StockOpname, StockOpnameItem, Transaction])],
  controllers: [AdminStoreController],
  providers: [AdminStoreService],
  exports: [AdminStoreService],
})
export class AdminStoreModule {}
