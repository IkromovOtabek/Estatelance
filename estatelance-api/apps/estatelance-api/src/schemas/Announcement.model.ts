import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Field, ObjectType } from '@nestjs/graphql';
import { AnnouncementType } from '../libs/enums/common.enums';

// An Announcement is a site-wide message posted by the admin.
// It can be a news/update (ANNOUNCEMENT) or a paid promotion (ADVERTISEMENT).
@Schema({ timestamps: true })
@ObjectType()
export class Announcement extends Document {
  @Field(() => String)
  _id: any;

  @Field(() => String, { nullable: true })
  createdAt?: any;

  // Short headline shown in the notification bell and announcement card
  @Prop({ required: true, trim: true })
  @Field(() => String)
  title: string;

  // Full text of the announcement
  @Prop({ required: true })
  @Field(() => String)
  body: string;

  // Optional banner image
  @Prop()
  @Field(() => String, { nullable: true })
  imageUrl?: string;

  // ANNOUNCEMENT = platform news | ADVERTISEMENT = paid promo
  @Prop({ required: true, enum: AnnouncementType, default: AnnouncementType.ANNOUNCEMENT })
  @Field(() => String)
  announcementType: AnnouncementType;

  // Admin can deactivate old announcements without deleting them
  @Prop({ default: true })
  @Field(() => Boolean)
  isActive: boolean;

  // Which admin created this announcement
  @Prop({ required: true })
  @Field(() => String)
  authorId: string;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

AnnouncementSchema.index({ isActive: 1, createdAt: -1 });
