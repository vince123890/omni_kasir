import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { KasirService } from './kasir.service'
import { AdminStoreService } from '../admin-store/admin-store.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { GetUser } from '../../common/decorators/get-user.decorator'

@ApiTags('Kasir')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('kasir')
@Controller('kasir')
export class KasirController {
  constructor(
    private readonly kasirService: KasirService,
    private readonly adminStoreService: AdminStoreService,
  ) {}

  @Get('products')
  @ApiOperation({ summary: 'List produk untuk POS (kasir)' })
  getProducts(@GetUser('storeId') storeId: number, @GetUser('tenantId') tenantId: number, @Query() query: any) {
    return this.adminStoreService.getProducts(storeId, tenantId, query)
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Proses transaksi POS' })
  createTransaction(
    @GetUser('storeId') storeId: number,
    @GetUser('tenantId') tenantId: number,
    @GetUser('id') cashierId: number,
    @Body() dto: any,
  ) {
    return this.kasirService.createTransaction(storeId, tenantId, cashierId, dto)
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Riwayat transaksi' })
  getTransactions(@GetUser('storeId') storeId: number, @Query() query: any) {
    return this.kasirService.getTransactions(storeId, query)
  }

  @Post('stocks/opname')
  @ApiOperation({ summary: 'Simpan opname' })
  createOpname(@GetUser('storeId') storeId: number, @GetUser('tenantId') tenantId: number, @GetUser('id') userId: number, @Body('items') items: any[]) {
    return this.adminStoreService.createOpname(storeId, tenantId, userId, items)
  }

  @Get('stocks/opname')
  @ApiOperation({ summary: 'Riwayat opname' })
  getOpnames(@GetUser('storeId') storeId: number, @Query() query: any) {
    return this.adminStoreService.getOpnames(storeId, query)
  }

  @Get('stocks/opname/:id/items')
  @ApiOperation({ summary: 'Detail item opname' })
  getOpnameItems(@Param('id', ParseIntPipe) id: number, @GetUser('storeId') storeId: number) {
    return this.adminStoreService.getOpnameItems(id, storeId)
  }

  @Post('stocks/convert')
  @ApiOperation({ summary: 'Konversi satuan stok' })
  convertStock(@GetUser('storeId') storeId: number, @GetUser('tenantId') tenantId: number, @GetUser('id') userId: number, @Body() dto: any) {
    return this.adminStoreService.convertStock(storeId, tenantId, userId, dto)
  }

  @Get('stocks/convert')
  @ApiOperation({ summary: 'Riwayat konversi' })
  getConversions(@GetUser('storeId') storeId: number, @Query() query: any) {
    return this.adminStoreService.getConversions(storeId, query)
  }
}
