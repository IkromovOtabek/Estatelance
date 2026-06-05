import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { BoostPaymentStatus, EscrowStatus, JobCategory, JobStatus, PropertyType } from '../libs/enums/common.enums';

@Schema({ timestamps: true })
@ObjectType()
export class Job extends Document {
  @Field(() => String)
  _id: any;

  @Prop({ required: true, trim: true })
  @Field(() => String)
  title: string;

  @Prop({ required: true })
  @Field(() => String)
  description: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  propertyAddress?: string;

  @Prop({ enum: PropertyType, default: PropertyType.APARTMENT })
  @Field(() => String)
  propertyType: PropertyType;

  @Prop({ required: true, enum: JobCategory })
  @Field(() => String)
  category: JobCategory;

  @Prop({ required: true, default: 100 })
  @Field(() => Float)
  budget: number;

  @Prop({ required: true, enum: JobStatus, default: JobStatus.OPEN })
  @Field(() => String)
  status: JobStatus;

  // The agent (user) who posted this job
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  @Field(() => String)
  agentId: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  agentName?: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  agentAvatar?: string;

  // Count of bids received (denormalized for quick display)
  @Prop({ default: 0 })
  @Field(() => Int)
  bidCount: number;

  // Extended job fields
  @Prop()
  @Field(() => String, { nullable: true })
  experienceLevel?: string; // NONE | JUNIOR | MIDDLE | SENIOR

  @Prop()
  @Field(() => String, { nullable: true })
  jobType?: string; // PERMANENT | TEMPORARY

  @Prop({ type: [String], default: [] })
  @Field(() => [String], { nullable: true })
  workFormat?: string[]; // ONSITE | REMOTE | HYBRID | TRAVELING

  @Prop()
  @Field(() => String, { nullable: true })
  workSchedule?: string; // 5/2 | 6/1 | FLEXIBLE | WEEKEND | OTHER

  @Prop()
  @Field(() => String, { nullable: true })
  hoursPerDay?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  location?: string;

  @Prop()
  @Field(() => Float, { nullable: true })
  salaryFrom?: number;

  @Prop()
  @Field(() => Float, { nullable: true })
  salaryTo?: number;

  @Prop({ type: [String], default: [] })
  @Field(() => [String], { nullable: true })
  requiredSkills?: string[];

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  contactPhone?: string;

  @Prop({ default: 0 })
  @Field(() => Int)
  viewCount: number;

  // Stores IDs of users who already viewed (deduplication)
  @Prop({ type: [SchemaTypes.ObjectId], default: [] })
  viewedBy: string[];

  // The freelancer who was hired (set when a bid is accepted)
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @Field(() => String, { nullable: true })
  hiredFreelancerId?: string;

  // Escrow payment tracking
  @Prop({ enum: EscrowStatus, default: EscrowStatus.NONE })
  @Field(() => String, { nullable: true })
  escrowStatus?: EscrowStatus;

  @Prop({ default: 0 })
  @Field(() => Float, { nullable: true })
  escrowAmount?: number;

  // Agent's review of the freelancer (set after job is completed)
  @Prop({ default: null })
  @Field(() => Float, { nullable: true })
  agentRating?: number;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  agentReviewText?: string;

  // Freelancer's review of the agent (set after job is completed)
  @Prop({ default: null })
  @Field(() => Float, { nullable: true })
  freelancerRating?: number;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  freelancerReviewText?: string;

  // Set when owner boosts the job to top
  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  bumpedAt?: Date;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  boostExpiresAt?: Date;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  boostPlan?: string; // BASIC | PRO | VIP

  // Bevosita to'lov: agent boost uchun platformaga pul o'tkazganini tasdiqlaydi
  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  boostPaidAt?: Date;

  // Boost to'lov cheki — admin tasdiqlaguncha
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

  // Boost boshlanganda snapshot (statistika uchun)
  @Prop({ default: null })
  @Field(() => Number, { nullable: true })
  boostViewsAtStart?: number;

  @Prop({ default: null })
  @Field(() => Number, { nullable: true })
  boostBidsAtStart?: number;

  /** Admin Targetlar bo'limida boost vaqtincha to'xtatilgan */
  @Prop({ default: false })
  @Field(() => Boolean, { nullable: true })
  boostPausedByAdmin?: boolean;

  // Set by agent when job is cancelled — reason is visible to admin
  @Prop({ trim: true, default: null })
  @Field(() => String, { nullable: true })
  cancelReason?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  cancelledAt?: Date;

  // Bevosita (direct) payment: agent marks that money was sent directly to the freelancer
  @Prop({ default: false })
  @Field(() => Boolean, { nullable: true })
  paymentDone?: boolean;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  paymentDoneAt?: Date;

  // Auto-set by Mongoose timestamps
  @Field(() => String, { nullable: true })
  createdAt?: Date;

  @Field(() => String, { nullable: true })
  updatedAt?: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);

// Index for fast filtering by category and status
JobSchema.index({ category: 1, status: 1 });
JobSchema.index({ agentId: 1 });
// Asosiy ro'yxat so'rovi: status bo'yicha filtr + bumpedAt/createdAt bo'yicha sort
JobSchema.index({ status: 1, bumpedAt: -1, createdAt: -1 });
JobSchema.index({ hiredFreelancerId: 1 });
