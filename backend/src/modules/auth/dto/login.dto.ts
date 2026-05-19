import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'admin@omnikasir.com' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MinLength(1)
  password: string
}
