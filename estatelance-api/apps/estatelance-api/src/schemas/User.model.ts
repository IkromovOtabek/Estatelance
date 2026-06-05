import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import {
  AuthProvider,
  BoostPaymentStatus,
  FreelancerAvailability,
  UserStatus,
  UserType,
} from '../libs/enums/common.enums';
import { JobCategory } from '../libs/enums/common.enums';

// ─── Address ──────────────────────────────────────────────────────────────────
@ObjectType()
export class Address {
  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field(() => String, { nullable: true })
  name?: string;
}

// ─── Portfolio Item ───────────────────────────────────────────────────────────
@ObjectType()
export class PortfolioItem {
  @Field(() => String)
  title: string;

  @Field(() => String)
  imageUrl: string;

  @Field(() => String)
  description: string;
}

// ─── Freelancer Profile Review ────────────────────────────────────────────────
@ObjectType()
export class FreelancerReview {
  @Field(() => String)
  authorName: string;

  @Field(() => Float)
  rating: number;

  @Field(() => String)
  reviewText: string;

  @Field(() => String)
  createdAt: string;
}

// ─── Main User Document ───────────────────────────────────────────────────────
@Schema({ timestamps: true })
@ObjectType()
export class User extends Document {
  @Field(() => String)
  _id: any;

  @Field(() => String, { nullable: true })
  createdAt?: any;

  @Prop({ required: true, unique: true, trim: true })
  @Field(() => String)
  username: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  password?: string; // Optional because Telegram users may not have a password

  @Prop({ required: true, enum: UserType, default: UserType.AGENT })
  @Field(() => String)
  userType: UserType;

  @Prop({ required: true, enum: UserStatus, default: UserStatus.ACTIVE })
  @Field(() => String)
  userStatus: UserStatus;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  fullName?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  profileImage?: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  bio?: string;

  @Prop({ trim: true, default: 'Toshkent, UZ' })
  @Field(() => String)
  location: string;

  @Prop({ type: Object })
  @Field(() => Address, { nullable: true })
  address?: Address;

  @Prop()
  @Field(() => String, { nullable: true })
  companyImage?: string;

  // Social stats
  @Prop({ default: 0 })
  @Field(() => Int)
  followerCount: number;

  @Prop({ default: 0 })
  @Field(() => Int)
  followingCount: number;

  @Prop({ default: 0 })
  @Field(() => Int)
  profileViewCount: number;

  // Profil boost — frilanser/agent ro'yxat tepasida
  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  bumpedAt?: Date;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  boostExpiresAt?: Date;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  boostPlan?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  boostPaidAt?: Date;

  @Prop({ type: String, enum: BoostPaymentStatus, default: BoostPaymentStatus.NONE })
  @Field(() => BoostPaymentStatus, { nullable: true })
  boostPaymentStatus?: BoostPaymentStatus;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  boostRequestedPlan?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  boostReceiptUrl?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  boostPaymentSubmittedAt?: Date;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  boostPaymentReviewedAt?: Date;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  boostPaymentRejectReason?: string;

  @Prop({ default: null })
  @Field(() => Number, { nullable: true })
  boostViewsAtStart?: number;

  @Prop({ default: null })
  @Field(() => Number, { nullable: true })
  boostFollowersAtStart?: number;

  @Prop({ default: false })
  @Field(() => Boolean, { nullable: true })
  boostPausedByAdmin?: boolean;

  @Prop({ default: 0 })
  @Field(() => Int)
  likeCount: number;

  // Freelancer-specific fields (only filled when userType === FREELANCER)
  @Prop({ enum: JobCategory })
  @Field(() => String, { nullable: true })
  freelancerCategory?: JobCategory;

  @Prop({ default: 0 })
  @Field(() => Float, { nullable: true })
  hourlyRate?: number;

  @Prop({ default: 5.0 })
  @Field(() => Float, { nullable: true })
  averageRating?: number;

  @Prop({ default: 0 })
  @Field(() => Int, { nullable: true })
  completedJobCount?: number;

  @Prop({ type: [String], default: [] })
  @Field(() => [String], { nullable: true })
  skills?: string[];

  @Prop({ type: Object, default: [] })
  @Field(() => [FreelancerReview], { nullable: true })
  reviews?: FreelancerReview[];

  @Prop({ type: Object, default: [] })
  @Field(() => [PortfolioItem], { nullable: true })
  portfolio?: PortfolioItem[];

  @Prop({ enum: FreelancerAvailability, default: FreelancerAvailability.AVAILABLE })
  @Field(() => String, { nullable: true })
  availability?: FreelancerAvailability;

  @Prop()
  @Field(() => String, { nullable: true })
  resumeUrl?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  githubUrl?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  behanceUrl?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  linkedinUrl?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  videoPortfolioUrl?: string;

  @Prop({ type: [String], default: [] })
  @Field(() => [String], { nullable: true })
  verifiedSkills?: string[];

  @Prop()
  @Field(() => String, { nullable: true })
  phoneNumber?: string;

  // Card / wallet number used for direct (bevosita) payments between agent and freelancer
  @Prop()
  @Field(() => String, { nullable: true })
  cardNumber?: string;

  // Spam / block reason (filled by admin when blocking a user)
  @Prop({ default: '' })
  @Field(() => String, { nullable: true })
  spamReason?: string;

  // Auth provider — how did this user sign up?
  @Prop({ enum: AuthProvider, default: AuthProvider.EMAIL })
  @Field(() => String)
  authProvider: AuthProvider;

  // Set to true for new Telegram users until they complete onboarding
  @Prop({ default: false })
  @Field(() => Boolean, { nullable: true })
  needsOnboarding?: boolean;

  // Telegram-specific data (only filled when authProvider === TELEGRAM)
  @Prop()
  @Field(() => String, { nullable: true })
  telegramId?: string;

  // Email (used for Google OAuth matching)
  @Prop({ trim: true, lowercase: true })
  @Field(() => String, { nullable: true })
  email?: string;

  // Google-specific data (only filled when authProvider === GOOGLE)
  @Prop()
  @Field(() => String, { nullable: true })
  googleId?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  telegramUsername?: string;

  // JWT access token — populated after login, not stored in DB
  @Field(() => String, { nullable: true })
  accessToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create a text index on username and bio for search
UserSchema.index({ username: 'text', bio: 'text' });

// Tez-tez ishlatiladigan filtr/sort/auth-lookup uchun indekslar
UserSchema.index({ userType: 1, bumpedAt: -1, averageRating: -1 }); // getFreelancers + boost
UserSchema.index({ userType: 1, freelancerCategory: 1 });
UserSchema.index({ userStatus: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ telegramId: 1 });
