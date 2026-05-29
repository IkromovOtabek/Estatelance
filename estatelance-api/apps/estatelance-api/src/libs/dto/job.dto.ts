import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { JobCategory, JobStatus, PropertyType } from '../enums/common.enums';
import { PaginationInput, PaginationInfo } from '../types/common.types';
import { Job } from '../../schemas/Job.model';

// ─── Input: Post a new Job ────────────────────────────────────────────────────
@InputType()
export class CreateJobInput {
  @IsNotEmpty()
  @Field(() => String)
  title: string;

  @IsNotEmpty()
  @Field(() => String)
  description: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  propertyAddress?: string;

  @IsEnum(PropertyType)
  @Field(() => String)
  propertyType: PropertyType;

  @IsEnum(JobCategory)
  @Field(() => String)
  category: JobCategory;

  @Min(10)
  @Field(() => Float)
  budget: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  experienceLevel?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  jobType?: string;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  workFormat?: string[];

  @IsOptional()
  @Field(() => String, { nullable: true })
  workSchedule?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  hoursPerDay?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  location?: string;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  salaryFrom?: number;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  salaryTo?: number;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  requiredSkills?: string[];
}

// ─── Input: Filter and search jobs ───────────────────────────────────────────
@InputType()
export class GetJobsInput extends PaginationInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  category?: JobCategory;

  @IsOptional()
  @Field(() => String, { nullable: true })
  status?: JobStatus;

  @IsOptional()
  @Field(() => String, { nullable: true })
  searchText?: string;
}

// ─── Response: Paginated job list ────────────────────────────────────────────
@ObjectType()
export class JobsListResponse {
  @Field(() => [Job])
  list: Job[];

  @Field(() => PaginationInfo)
  metaCounter: PaginationInfo;
}
