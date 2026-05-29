import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Field, ObjectType } from '@nestjs/graphql';

// Records a "follow" relationship between two users
@Schema({ timestamps: true })
@ObjectType()
export class Follow extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  @Field(() => String)
  followerId: string; // The user who clicked "Follow"

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  @Field(() => String)
  followedId: string; // The user being followed

  @Field(() => String, { nullable: true })
  createdAt?: Date;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

// Prevent duplicate follow entries
FollowSchema.index({ followerId: 1, followedId: 1 }, { unique: true });
