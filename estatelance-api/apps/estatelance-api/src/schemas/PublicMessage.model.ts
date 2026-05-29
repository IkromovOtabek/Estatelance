import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Field, ObjectType } from '@nestjs/graphql';

@Schema({ timestamps: true })
@ObjectType()
export class PublicMessage extends Document {
  @Field(() => String)
  _id: any;

  @Prop({ required: true })
  @Field(() => String)
  senderName: string;

  @Prop({ required: true })
  @Field(() => String)
  senderId: string;

  @Prop({ default: false })
  @Field(() => Boolean)
  isGuest: boolean;

  @Prop({ required: true })
  @Field(() => String)
  text: string;

  @Prop()
  @Field(() => String)
  color: string;

  @Field(() => String, { nullable: true })
  createdAt?: Date;
}

export const PublicMessageSchema = SchemaFactory.createForClass(PublicMessage);
PublicMessageSchema.index({ createdAt: -1 });
// Auto-delete public messages after 30 days
PublicMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
