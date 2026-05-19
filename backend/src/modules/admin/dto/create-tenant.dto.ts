import { IsString, IsEmail, IsInt, MinLength, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateTenantDto {
  @ApiProperty({ example: 'PT', enum: ['PT', 'CV', 'UD'] })
  @IsIn(['PT', 'CV', 'UD'])
  entityType: string

  @ApiProperty({ example: 'Maju Jaya Sejahtera' })
  @IsString() @MinLength(2)
  name: string

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString() @MinLength(2)
  ownerName: string

  @ApiProperty({ example: 'budi@majujaya.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123' })
  @IsString() @MinLength(8)
  password: string

  @ApiProperty({ example: 1 })
  @IsInt()
  planId: number

  @ApiProperty({ example: '2026-05-19' })
  @IsString()
  startDate: string
}
