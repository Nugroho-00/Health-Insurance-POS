import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class OrderDto {
  @ApiProperty({ example: 'wix-order-778899' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ example: 'Monthly Health Premium' })
  @IsString()
  description: string;
}

export class CustomerDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class PayloadDto {
  @ApiProperty({ example: 'health-assurance-001' })
  @IsString()
  @IsNotEmpty()
  merchantId: string;

  @ApiProperty({ type: OrderDto })
  @ValidateNested()
  @Type(() => OrderDto)
  order: OrderDto;

  @ApiProperty({ type: CustomerDto })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;
}

export class CreateOrderDto {
  @ApiProperty({ type: PayloadDto })
  @ValidateNested()
  @Type(() => PayloadDto)
  payload: PayloadDto;

  @ApiProperty({
    example: 'hmac_sha256_signature_here',
    description: 'HMAC-SHA256 signature of the payload using the shared secret',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
