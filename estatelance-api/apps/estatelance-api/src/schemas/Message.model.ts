import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Field, ObjectType } from '@nestjs/graphql';

// A direct message sent between two users
@Schema({ timestamps: true })
@ObjectType()
export class Message extends Document {
  @Field(() => String)
  _id: any;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  @Field(() => String)
  senderId: string;

  @Prop({ trim: true })
  @Field(() => String)
  senderName: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  senderUsername?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  senderAvatar?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  @Field(() => String)
  receiverId: string;

  @Prop({ trim: true })
  @Field(() => String)
  receiverName: string;

  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  receiverUsername?: string;

  @Prop()
  @Field(() => String, { nullable: true })
  receiverAvatar?: string;

  @Prop({ required: true })
  @Field(() => String)
  text: string;

  @Prop({ default: false })
  @Field(() => Boolean)
  isRead: boolean;

  @Field(() => String, { nullable: true })
  createdAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ senderId: 1, receiverId: 1 });
