import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { UserType } from '../enums/common.enums';
import { PaginationInput } from '../types/common.types';

// ─── Input: Sign Up with email/password ──────────────────────────────────────
@InputType()
export class SignupInput {
  @IsNotEmpty()
  @Length(3, 20)
  @Field(() => String)
  username: string;

  @IsNotEmpty()
  @Length(5, 30)
  @Field(() => String)
  password: string;

  @IsEnum(UserType)
  @Field(() => String)
  userType: UserType;

  @IsOptional()
  @Field(() => String, { nullable: true })
  fullName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  location?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  profileImage?: string;
}

// ─── Input: Log In with email/password ───────────────────────────────────────
@InputType()
export class LoginInput {
  @IsNotEmpty()
  @Field(() => String)
  username: string;

  @IsNotEmpty()
  @Field(() => String)
  password: string;
}

// ─── Input: Log In via Telegram ───────────────────────────────────────────────
// This data comes directly from the Telegram Login Widget callback.
// Note: Telegram user IDs can exceed 32-bit Int range, so we use String for id
// and Float for auth_date (Unix timestamp).
@InputType()
export class TelegramLoginInput {
  @Field(() => String)
  id: string; // Telegram user ID — stored as string to support 64-bit IDs

  @Field(() => String)
  first_name: string;

  @Field(() => String, { nullable: true })
  last_name?: string;

  @Field(() => String, { nullable: true })
  username?: string;

  @Field(() => String, { nullable: true })
  photo_url?: string;

  @Field(() => Float)
  auth_date: number; // Unix timestamp — Float handles numbers beyond 32-bit range

  @Field(() => String)
  hash: string; // Telegram's security hash — we verify this on the backend
}

// ─── Input: Single Portfolio Item ────────────────────────────────────────────
@InputType()
export class PortfolioItemInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  imageUrl: string;

  @Field(() => String)
  description: string;
}

// ─── Input: Update Profile ────────────────────────────────────────────────────
@InputType()
export class UpdateProfileInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  fullName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  bio?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  location?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  profileImage?: string;

  // Freelancer-specific updates
  @IsOptional()
  @Field(() => String, { nullable: true })
  freelancerCategory?: string;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  hourlyRate?: number;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  skills?: string[];

  @IsOptional()
  @Field(() => String, { nullable: true })
  availability?: string;

  @IsOptional()
  @Field(() => [PortfolioItemInput], { nullable: true })
  portfolio?: PortfolioItemInput[];

  @IsOptional()
  @IsEnum(UserType)
  @Field(() => String, { nullable: true })
  userType?: UserType;

  @IsOptional()
  @Field(() => String, { nullable: true })
  resumeUrl?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  phoneNumber?: string;
}

// ─── Input: Get List of Users / Freelancers ───────────────────────────────────
@InputType()
export class GetFreelancersInput extends PaginationInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  category?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  searchText?: string;
}
