import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { JobCategory, JobStatus, PropertyType } from '../libs/enums/common.enums';

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
