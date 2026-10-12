import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ProductIdDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  id!: number;
}
