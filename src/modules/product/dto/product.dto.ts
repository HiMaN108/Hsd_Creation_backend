import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'iphone-15' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Latest Apple smartphone' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 79999.99 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 69999.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount_price?: number;

  @ApiPropertyOptional({ example: 'SKU-IPHONE15-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'https://example.com/iphone.jpg' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsNotEmpty()
  @IsUUID()
  category_id: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'iphone-15-pro' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Latest Apple smartphone pro version' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 89999.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 79999.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount_price?: number;

  @ApiPropertyOptional({ example: 'SKU-IPHONE15PRO-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 'https://example.com/iphone-pro.jpg' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
