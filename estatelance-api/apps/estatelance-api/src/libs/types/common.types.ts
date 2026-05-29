import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

// Reusable pagination input — used across all list queries
@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  page: number;

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
