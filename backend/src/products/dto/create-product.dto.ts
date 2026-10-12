import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsString, Matches, Max, Min, ValidateIf } from 'class-validator';

export class CreateProductDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  quantity?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  minStock?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined && value !== null)
  @IsString()
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  expirationDate?: string | null;
}
