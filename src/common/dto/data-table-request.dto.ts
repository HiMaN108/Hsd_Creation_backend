import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/* ── Column-level search ─────────────────────────────────── */
export class DtSearchDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsBoolean()
  regex?: boolean;
}

/* ── Single column descriptor ────────────────────────────── */
export class DtColumnDto {
  @IsString()
  data!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  searchable?: boolean;

  @IsOptional()
  @IsBoolean()
  orderable?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => DtSearchDto)
  search?: DtSearchDto;
}

/* ── Ordering instruction ────────────────────────────────── */
export class DtOrderDto {
  @IsInt()
  @Min(0)
  column!: number;

  @IsIn(['asc', 'desc'])
  dir!: 'asc' | 'desc';
}

/* ── Top-level DataTable request body ────────────────────── */
export class DataTableRequestDto {
  @IsInt()
  @Min(1)
  draw!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DtColumnDto)
  columns!: DtColumnDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DtOrderDto)
  order?: DtOrderDto[];

  @IsInt()
  @Min(0)
  start!: number;

  @IsInt()
  @Min(1)
  @Max(50)
  length!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DtSearchDto)
  search?: DtSearchDto;
}
