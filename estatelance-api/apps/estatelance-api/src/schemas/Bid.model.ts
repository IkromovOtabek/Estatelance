import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Field, Float, ObjectType } from '@nestjs/graphql';
import { BidStatus } from '../libs/enums/common.enums';

@Schema({ timestamps: true })
@ObjectType()
export class Bid extends Document {
  @Field(() => String)
  _id: any;

  // Which job this bid belongs to
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Job', required: true })
  @Field(() => String)
  jobId: string;

  // The freelancer who submitted this bid
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  @Field(() => String)
  freelancerId: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  freelancerName?: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  freelancerTitle?: string;

  // The price the freelancer is offering to do the job for
  @Prop({ required: true })
  @Field(() => Float)
  bidAmount: number;

  // A short message explaining why they're the right person for the job
  @Prop({ required: true })
  @Field(() => String)
  coverLetter: string;

  @Prop({ required: true, enum: BidStatus, default: BidStatus.PENDING })
  @Field(() => String)
  status: BidStatus;

  @Field(() => String, { nullable: true })
  createdAt?: Date;
}

export const BidSchema = SchemaFactory.createForClass(Bid);

BidSchema.index({ jobId: 1 });
BidSchema.index({ freelancerId: 1 });
