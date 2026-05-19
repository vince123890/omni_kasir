import { IsString, IsEmail, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateAdminUserDto {
  @ApiProperty({ example: 'Admin Dua' })
  @IsString() @MinLength(2)
  name: string

  @ApiProperty({ example: 'admin2@omnikasir.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123' })
  @IsString() @MinLength(8)
  password: string
}
