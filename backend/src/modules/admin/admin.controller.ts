import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, HttpCode } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto'
import { CreateTenantDto } from './dto/create-tenant.dto'
import { CreateAdminUserDto } from './dto/create-admin-user.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Admin Users ──────────────────────────────────────────────────────────
  @Get('admin/users')
  @ApiOperation({ summary: 'List semua admin platform' })
  getAdminUsers() { return this.adminService.getAdminUsers() }

  @Post('admin/users')
  @ApiOperation({ summary: 'Tambah admin baru' })
  createAdminUser(@Body() dto: CreateAdminUserDto) { return this.adminService.createAdminUser(dto) }

  @Patch('admin/users/:id/status')
  @ApiOperation({ summary: 'Aktifkan/nonaktifkan admin' })
  setAdminStatus(@Param('id', ParseIntPipe) id: number, @Body('isActive') isActive: boolean) {
    return this.adminService.setAdminUserStatus(id, isActive)
  }

  // ── Subscription Plans ───────────────────────────────────────────────────
  @Get('admin/subscription-plans')
  @ApiOperation({ summary: 'List semua subscription plan' })
  getPlans() { return this.adminService.getPlans() }

  @Post('admin/subscription-plans')
  @ApiOperation({ summary: 'Buat subscription plan baru' })
  createPlan(@Body() dto: CreateSubscriptionPlanDto) { return this.adminService.createPlan(dto) }

  @Patch('admin/subscription-plans/:id')
  @ApiOperation({ summary: 'Update subscription plan' })
  updatePlan(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.adminService.updatePlan(id, dto)
  }

  @Delete('admin/subscription-plans/:id')
  @ApiOperation({ summary: 'Hapus subscription plan' })
  deletePlan(@Param('id', ParseIntPipe) id: number) { return this.adminService.deletePlan(id) }

  // ── Tenants ──────────────────────────────────────────────────────────────
  @Get('admin/tenants')
  @ApiOperation({ summary: 'List tenant dengan filter' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'plan', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getTenants(@Query() query: any) { return this.adminService.getTenants(query) }

  @Get('admin/tenants/:id')
  @ApiOperation({ summary: 'Detail tenant' })
  getTenantDetail(@Param('id', ParseIntPipe) id: number) { return this.adminService.getTenantDetail(id) }

  @Post('admin/tenants')
  @ApiOperation({ summary: 'Buat tenant baru + owner + subscription' })
  createTenant(@Body() dto: CreateTenantDto) { return this.adminService.createTenant(dto) }

  @Patch('admin/tenants/:id')
  @ApiOperation({ summary: 'Update info tenant' })
  updateTenant(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.adminService.updateTenant(id, dto)
  }

  @Patch('admin/tenants/:id/status')
  @ApiOperation({ summary: 'Aktifkan/nonaktifkan tenant' })
  setTenantStatus(@Param('id', ParseIntPipe) id: number, @Body('isActive') isActive: boolean) {
    return this.adminService.setTenantStatus(id, isActive)
  }

  @Patch('admin/tenants/:id/subscription')
  @ApiOperation({ summary: 'Perpanjang subscription tenant' })
  renewSubscription(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.adminService.renewSubscription(id, dto)
  }
}
