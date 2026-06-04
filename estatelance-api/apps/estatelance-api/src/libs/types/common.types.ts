import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

// Reusable pagination input — used across all list queries
// MUHIM: ValidationPipe({ whitelist: true }) dekoratorsiz maydonlarni o'chiradi.
// Shuning uchun page/limit da class-validator dekoratorlari BO'LISHI shart,
// aks holda ular stripped bo'lib, .limit()/.skip() ishlamaydi (butun kolleksiya qaytadi).
@InputType()
export class PaginationInput {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Field(() => Int, { defaultValue: 1 })
  page: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  @Field(() => Int, { defaultValue: 10 })
  limit: number;
}

// Generic paginated list response — wrap any data type with this
@ObjectType()
export class PaginationInfo {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  totalPages: number;
}

// Used by the sorting options on list queries
export type SortOrder = 'asc' | 'desc';
