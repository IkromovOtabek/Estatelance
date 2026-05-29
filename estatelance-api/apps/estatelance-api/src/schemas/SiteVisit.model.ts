import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SiteVisitDocument = SiteVisit & Document;

@Schema({ timestamps: true })
export class SiteVisit {
  // Unique visitor identifier (stored in browser cookie/localStorage)
  @Prop({ required: true })
  visitorId: string;

  // Actual user ID (set for login/register events)
  @Prop({ default: null })
  userId: string | null;

  // Event type: 'visit' | 'register' | 'login'
  @Prop({ required: true })
  event: string;

  // Date string in YYYY-MM-DD format for easy daily grouping
  @Prop({ required: true, index: true })
  date: string;

  // Auto-expire after 90 days
  @Prop({ type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 })
  createdAt: Date;
}

export const SiteVisitSchema = SchemaFactory.createForClass(SiteVisit);
