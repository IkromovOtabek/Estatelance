import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Field, ObjectType } from '@nestjs/graphql';
import { DisputeDecision, DisputeStatus } from '../libs/enums/common.enums';

@Schema({ timestamps: true })
@ObjectType()
export class Dispute extends Document {
  @Field(() => String)
  _id: any;

  // The job this dispute is about
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Job', required: true })
  @Field(() => String)
  jobId: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  jobTitle?: string;

  // Who filed the dispute
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  @Field(() => String)
  filedById: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  filedByName?: string;

  // The other party
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  @Field(() => String)
  againstId: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  againstName?: string;

  @Prop({ required: true })
  @Field(() => String)
  reason: string;

  @Prop({ required: true, enum: DisputeStatus, default: DisputeStatus.OPEN })
  @Field(() => String)
  status: DisputeStatus;

  // Admin resolution
  @Prop({ enum: DisputeDecision })
  @Field(() => String, { nullable: true })
  decision?: DisputeDecision;

  @Prop()
  @Field(() => String, { nullable: true })
  adminNote?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  @Field(() => String, { nullable: true })
  resolvedById?: string;

  @Field(() => String, { nullable: true })
  createdAt?: Date;

  @Field(() => String, { nullable: true })
  updatedAt?: Date;
}

export const DisputeSchema = SchemaFactory.createForClass(Dispute);

DisputeSchema.index({ jobId: 1 });
DisputeSchema.index({ filedById: 1 });
DisputeSchema.index({ status: 1 });
