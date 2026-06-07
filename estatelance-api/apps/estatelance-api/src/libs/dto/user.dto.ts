import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

import { IsEnum, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { UserType } from '../enums/common.enums';
import { PaginationInput } from '../types/common.types';

@InputType()
export class AddressInput {
  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  name?: string;
}

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

  @IsOptional()
  @Field(() => String, { nullable: true })
  phoneNumber?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  cardNumber?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  bio?: string;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  skills?: string[];

  @IsOptional()
  @Field(() => String, { nullable: true })
  resumeUrl?: string;

  @IsOptional()
  @Field(() => AddressInput, { nullable: true })
  address?: AddressInput;

  @IsOptional()
  @Field(() => String, { nullable: true })
  companyImage?: string;
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
  @IsNotEmpty()
  @Field(() => String)
  id: string;

  @IsNotEmpty()
  @Field(() => String)
  first_name: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  last_name?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  username?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  photo_url?: string;

  @IsNotEmpty()
  @Field(() => Float)
  auth_date: number;

  @IsNotEmpty()
  @Field(() => String)
  hash: string;
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

  @IsOptional()
  @Field(() => String, { nullable: true })
  expoPushToken?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  cardNumber?: string;

  @IsOptional()
  @Field(() => Boolean, { nullable: true })
  needsOnboarding?: boolean;

  @IsOptional()
  @Field(() => AddressInput, { nullable: true })
  address?: AddressInput;

  @IsOptional()
  @Field(() => String, { nullable: true })
  companyImage?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  githubUrl?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  behanceUrl?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  linkedinUrl?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  videoPortfolioUrl?: string;
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

  @IsOptional()
  @Field(() => Float, { nullable: true })
  hourlyRateMin?: number;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  hourlyRateMax?: number;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  minRating?: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  availability?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  location?: string;
}

@ObjectType()
export class FreelancerAnalytics {
  @Field(() => Int)
  totalBids: number;

  @Field(() => Int)
  acceptedBids: number;

  @Field(() => Int)
  completedJobs: number;

  @Field(() => Float)
  totalEarned: number;

  @Field(() => Float)
  averageRating: number;

  @Field(() => Int)
  profileViews: number;

  @Field(() => Int)
  followerCount: number;
}
