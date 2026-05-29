import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VisitorSessionDocument = VisitorSession & Document;

@Schema()
export class PageVisit {
  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  visitedAt: Date;
}

@Schema({ timestamps: { createdAt: 'startedAt', updatedAt: false } })
export class VisitorSession {
  @Prop({ required: true, index: true })
  sessionId: string;

  @Prop({ required: true })
  visitorId: string;

  // Date string YYYY-MM-DD for filtering
  @Prop({ required: true, index: true })
  date: string;

  // Device info parsed from User-Agent
  @Prop({ default: 'Unknown' })
  device: string; // Mobile | Desktop | Tablet

  @Prop({ default: 'Unknown' })
  os: string; // Windows | macOS | iOS | Android | Linux

  @Prop({ default: 'Unknown' })
  browser: string; // Chrome | Safari | Firefox | Edge | Opera

  // Pages visited during this session
  @Prop({ type: [{ path: String, visitedAt: Date }], default: [] })
  pages: PageVisit[];

  // Last activity time (updated on each ping)
  @Prop({ type: Date, default: Date.now })
  lastSeenAt: Date;

  // Set when user closes the tab/browser
  @Prop({ type: Date, default: null })
  endedAt: Date | null;

  @Prop({ type: Date, default: Date.now })
  startedAt: Date;

  // Auto-expire after 30 days
  @Prop({ type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 })
  expireAt: Date;
}

export const VisitorSessionSchema = SchemaFactory.createForClass(VisitorSession);
