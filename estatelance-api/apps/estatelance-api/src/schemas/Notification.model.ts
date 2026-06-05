import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Field, ObjectType } from '@nestjs/graphql';
import { NotificationType } from '../libs/enums/common.enums';

@Schema({ timestamps: true })
@ObjectType()
export class Notification extends Document {
  @Field(() => String)
  _id: any;

  // The user who should receive this notification
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  @Field(() => String)
  recipientId: string;

  @Prop({ required: true, enum: NotificationType })
  @Field(() => String)
  notificationType: NotificationType;

  @Prop({ required: true, trim: true })
  @Field(() => String)
  title: string;

  @Prop({ required: true })
  @Field(() => String)
  description: string;

  @Prop({ default: false })
  @Field(() => Boolean)
  isRead: boolean;

  // Optional: link to the related item (e.g., a job ID, post ID)
  @Prop()
  @Field(() => String, { nullable: true })
  relatedItemId?: string;

  /** Admin yoki maxsus yo‘naltirish (masalan /_admin?section=targets&tab=moderation) */
  @Prop({ trim: true })
  @Field(() => String, { nullable: true })
  linkPath?: string;

  @Field(() => String, { nullable: true })
  createdAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipientId: 1, isRead: 1 });
// Auto-delete notifications after 7 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });
