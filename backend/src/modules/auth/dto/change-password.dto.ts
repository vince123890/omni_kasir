import { IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  oldPassword: string

  @ApiProperty()
  @IsString()
  @MinLength(8, { message: 'Password baru min 8 karakter' })
  newPassword: string

  @ApiProperty()
  @IsString()
  confirmPassword: string
}
