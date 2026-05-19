import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AdminStoreService } from './admin-store.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { GetUser } from '../../common/decorators/get-user.decorator'

@ApiTags('Admin Store')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_store')
@Controller('admin-store')
export class AdminStoreController {
  constructor(private readonly service: AdminStoreService) {}

  @Get('products')
  @ApiOperation({ summary: 'List produk store' })
  getProducts(@GetUser('storeId') storeId: number, @GetUser('tenantId') tenantId: number, @Query() query: any) {
    return this.service.getProducts(storeId, tenantId, query)
  }

  @Post('products')
  @ApiOperation({ summary: 'Tambah produk' })
  createProduct(@GetUser('storeId') storeId: number, @GetUser('tenantId') tenantId: number, @GetUser('id') userId: number, @Body() dto: any) {
    return this.service.createProduct(storeId, tenantId, userId, dto)
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update produk' })
  updateProduct(@Param('id', ParseIntPipe) id: number, @GetUser('storeId') storeId: number, @Body() dto: any) {
    return this.service.updateProduct(id, storeId, dto)
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Hapus produk (soft delete)' })
  deleteProduct(@Param('id', ParseIntPipe) id: number, @GetUser('storeId') storeId: number) {
    return this.service.deleteProduct(id, storeId)
  }

  @Post('stocks/in')
  @ApiOperation({ summary: 'Input stok masuk dari supplier' })
  stockIn(@GetUser('storeId') storeId: number, @GetUser('tenantId') tenantId: number, @GetUser('id') userId: number, @Body() dto: any) {
    return this.service.stockIn(storeId, tenantId, userId, dto)
  }

  @Post('stocks/opname')
  @ApiOperation({ summary: 'Simpan opname' })
  createOpname(@GetUser('storeId') storeId: number, @GetUser('tenantId') tenantId: number, @GetUser('id') userId: number, @Body('items') items: any[]) {
    return this.service.createOpname(storeId, tenantId, userId, items)
  }

  @Get('stocks/opname')
  @ApiOperation({ summary: 'Riwayat opname' })
  getOpnames(@GetUser('storeId') storeId: number, @Query() query: any) {
    return this.service.getOpnames(storeId, query)
  }

  @Get('stocks/opname/:id/items')
  @ApiOperation({ summary: 'Detail item opname' })
  getOpnameItems(@Param('id', ParseIntPipe) id: number, @GetUser('storeId') storeId: number) {
    return this.service.getOpnameItems(id, storeId)
  }

  @Post('stocks/convert')
  @ApiOperation({ summary: 'Konversi satuan stok' })
  convertStock(@GetUser('storeId') storeId: number, @GetUser('tenantId') tenantId: number, @GetUser('id') userId: number, @Body() dto: any) {
    return this.service.convertStock(storeId, tenantId, userId, dto)
  }

  @Get('stocks/convert')
  @ApiOperation({ summary: 'Riwayat konversi' })
  getConversions(@GetUser('storeId') storeId: number, @Query() query: any) {
    return this.service.getConversions(storeId, query)
  }

  @Get('stocks/movements')
  @ApiOperation({ summary: 'Riwayat semua pergerakan stok' })
  getMovements(@GetUser('storeId') storeId: number, @Query() query: any) {
    return this.service.getMovements(storeId, query)
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Riwayat transaksi store' })
  getTransactions(@GetUser('storeId') storeId: number, @Query() query: any) {
    return this.service.getTransactions(storeId, query)
  }
}
