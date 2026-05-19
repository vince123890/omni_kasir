import { Controller, Get, Post, Patch, Body, UseGuards, HttpCode } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { GetUser } from '../../common/decorators/get-user.decorator'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login semua role' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil user yang sedang login (nama, tenant, store, plan)' })
  me(@GetUser('id') userId: number) {
    return this.authService.me(userId)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout' })
  logout() {
    return { message: 'Logout berhasil' }
  }

  @Post('refresh-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refreshToken(token)
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ganti password' })
  changePassword(@GetUser('id') userId: number, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto)
  }
}
