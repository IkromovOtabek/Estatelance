import { Field, InputType, ObjectType, Int, Float } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserStatus, UserType, AnnouncementType } from '../enums/common.enums';

// ─── Input: Admin username + password login ───────────────────────────────────
@InputType()
export class AdminLoginInput {
  @IsNotEmpty()
  @Field(() => String)
  username: string;

  @IsNotEmpty()
  @Field(() => String)
  password: string;
}

// ─── Input: Block, spam, or unblock a user ────────────────────────────────────
@InputType()
export class ChangeUserStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  userId: string;

  @IsEnum(UserStatus)
  @Field(() => String)
  newStatus: UserStatus;

  // Reason is required when setting status to SPAM so the user knows why
  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  spamReason?: string;
}

// ─── Input: Change a user's role ─────────────────────────────────────────────
@InputType()
export class ChangeUserRoleInput {
  @IsNotEmpty()
  @Field(() => String)
  userId: string;

  @IsEnum(UserType)
  @Field(() => String)
  newRole: UserType;
}

// ─── Input: Create a site-wide announcement or advertisement ─────────────────
@InputType()
export class CreateAnnouncementInput {
  @IsNotEmpty()
  @Field(() => String)
  title: string;

  @IsNotEmpty()
  @Field(() => String)
  body: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  imageUrl?: string;

  @IsEnum(AnnouncementType)
  @Field(() => String)
  announcementType: AnnouncementType;
}

// ─── Object: Dashboard statistics summary ────────────────────────────────────
@ObjectType()
export class DashboardStats {
  @Field(() => Int) totalUsers: number;
  @Field(() => Int) totalAgents: number;
  @Field(() => Int) totalFreelancers: number;
  @Field(() => Int) totalJobs: number;
  @Field(() => Int) totalPosts: number;
  @Field(() => Int) totalAnnouncements: number;
  @Field(() => Int) spammedUsers: number;
  @Field(() => Int) activeJobs: number;
  @Field(() => Float) totalBudgetPosted: number;
}
