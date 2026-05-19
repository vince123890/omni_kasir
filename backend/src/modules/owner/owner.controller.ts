import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { OwnerService } from './owner.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { GetUser } from '../../common/decorators/get-user.decorator'

@ApiTags('Owner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
@Controller('owner')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get('stores')
  @ApiOperation({ summary: 'List store milik tenant' })
  getStores(@GetUser('tenantId') tenantId: number) { return this.ownerService.getStores(tenantId) }

  @Post('stores')
  @ApiOperation({ summary: 'Tambah store baru' })
  createStore(@GetUser('tenantId') tenantId: number, @Body() dto: any) {
    return this.ownerService.createStore(tenantId, dto)
  }

  @Patch('stores/:id')
  @ApiOperation({ summary: 'Update store' })
  updateStore(@Param('id', ParseIntPipe) id: number, @GetUser('tenantId') tenantId: number, @Body() dto: any) {
    return this.ownerService.updateStore(id, tenantId, dto)
  }

  @Delete('stores/:id')
  @ApiOperation({ summary: 'Hapus store (soft delete)' })
  deleteStore(@Param('id', ParseIntPipe) id: number, @GetUser('tenantId') tenantId: number) {
    return this.ownerService.deleteStore(id, tenantId)
  }

  @Patch('stores/:id/status')
  @ApiOperation({ summary: 'Aktifkan/nonaktifkan store' })
  setStoreStatus(@Param('id', ParseIntPipe) id: number, @GetUser('tenantId') tenantId: number, @Body('isActive') isActive: boolean) {
    return this.ownerService.setStoreStatus(id, tenantId, isActive)
  }

  @Get('users')
  @ApiOperation({ summary: 'List semua user tenant' })
  getUsers(@GetUser('tenantId') tenantId: number, @Query() query: any) {
    return this.ownerService.getUsers(tenantId, query)
  }

  @Get('stores/:storeId/users')
  @ApiOperation({ summary: 'List user per store' })
  getUsersByStore(@Param('storeId', ParseIntPipe) storeId: number, @GetUser('tenantId') tenantId: number) {
    return this.ownerService.getUsers(tenantId, { storeId })
  }

  @Post('stores/:storeId/users')
  @ApiOperation({ summary: 'Tambah kasir atau admin store' })
  createUser(@Param('storeId', ParseIntPipe) storeId: number, @GetUser('tenantId') tenantId: number, @Body() dto: any) {
    return this.ownerService.createUser(storeId, tenantId, dto)
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update data user' })
  updateUser(@Param('id', ParseIntPipe) id: number, @GetUser('tenantId') tenantId: number, @Body() dto: any) {
    return this.ownerService.updateUser(id, tenantId, dto)
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Aktifkan/nonaktifkan user' })
  setUserStatus(@Param('id', ParseIntPipe) id: number, @GetUser('tenantId') tenantId: number, @Body('isActive') isActive: boolean) {
    return this.ownerService.setUserStatus(id, tenantId, isActive)
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Riwayat transaksi semua store' })
  getTransactions(@GetUser('tenantId') tenantId: number, @Query() query: any) {
    return this.ownerService.getTransactions(tenantId, query)
  }

  @Get('transactions/summary')
  @ApiOperation({ summary: 'Ringkasan omzet per store' })
  getSummary(@GetUser('tenantId') tenantId: number, @Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string) {
    return this.ownerService.getTransactionSummary(tenantId, dateFrom, dateTo)
  }
}
