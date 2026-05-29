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

// ─── Object: Daily visitor statistics ────────────────────────────────────────
@ObjectType()
export class DailyVisitorStat {
  @Field(() => String) date: string;
  @Field(() => Int) visits: number;
  @Field(() => Int) registrations: number;
  @Field(() => Int) logins: number;
}

// ─── Object: Page visit inside a session ─────────────────────────────────────
@ObjectType()
export class PageVisitObject {
  @Field(() => String) path: string;
  @Field(() => String) visitedAt: string;
}

// ─── Object: Visitor session detail ──────────────────────────────────────────
@ObjectType()
export class VisitorSessionObject {
  @Field(() => String) sessionId: string;
  @Field(() => String) visitorId: string;
  @Field(() => String) device: string;
  @Field(() => String) os: string;
  @Field(() => String) browser: string;
  @Field(() => [PageVisitObject]) pages: PageVisitObject[];
  @Field(() => String) startedAt: string;
  @Field(() => String) lastSeenAt: string;
  @Field(() => String, { nullable: true }) endedAt?: string;
  @Field(() => Boolean) isOnline: boolean;
  @Field(() => String, { nullable: true }) userName?: string;
}

// ─── Input: Start visitor session ────────────────────────────────────────────
@InputType()
export class StartSessionInput {
  @IsNotEmpty() @IsString() @Field(() => String) sessionId: string;
  @IsNotEmpty() @IsString() @Field(() => String) visitorId: string;
  @IsNotEmpty() @IsString() @Field(() => String) device: string;
  @IsNotEmpty() @IsString() @Field(() => String) os: string;
  @IsNotEmpty() @IsString() @Field(() => String) browser: string;
  @IsNotEmpty() @IsString() @Field(() => String) firstPage: string;
}

// ─── Input: Track page view within session ────────────────────────────────────
@InputType()
export class TrackPageInput {
  @IsNotEmpty() @IsString() @Field(() => String) sessionId: string;
  @IsNotEmpty() @IsString() @Field(() => String) path: string;
}

// ─── Input: End session ───────────────────────────────────────────────────────
@InputType()
export class EndSessionInput {
  @IsNotEmpty() @IsString() @Field(() => String) sessionId: string;
}

// ─── Input: Track a site visit event ─────────────────────────────────────────
@InputType()
export class TrackVisitInput {
  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  visitorId: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  event: string; // 'visit' | 'register' | 'login'

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  userId?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  sessionId?: string;
}

// ─── Object: User detail for visitor stats drill-down ────────────────────────
@ObjectType()
export class VisitorUserDetail {
  @Field(() => String) userId: string;
  @Field(() => String) username: string;
  @Field(() => String, { nullable: true }) fullName?: string;
  @Field(() => String, { nullable: true }) profileImage?: string;
  @Field(() => String) userType: string;
  @Field(() => String) event: string;
  @Field(() => String) createdAt: string;
}
