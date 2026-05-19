import { IsString, IsInt, IsBoolean, IsOptional, Min, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Pro' })
  @IsString() @MinLength(2)
  name: string

  @ApiProperty({ example: 299000 })
  @IsInt() @Min(0)
  price: number

  @ApiProperty({ example: 30 })
  @IsInt() @Min(1)
  durationDays: number

  @ApiProperty({ example: 5 })
  @IsInt() @Min(1)
  maxStores: number

  @ApiProperty({ example: 5 })
  @IsInt() @Min(1)
  maxCashiersPerStore: number
}
