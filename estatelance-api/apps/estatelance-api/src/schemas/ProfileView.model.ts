import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

// Tracks which user viewed which profile — ensures each viewer is counted only once
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ProfileView extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  viewerId: string; // who viewed

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  profileId: string; // whose profile was viewed
}

export const ProfileViewSchema = SchemaFactory.createForClass(ProfileView);

// Unique index: one view record per (viewer, profile) pair
// Duplicate insert throws error code 11000 — used to detect "already viewed"
ProfileViewSchema.index({ viewerId: 1, profileId: 1 }, { unique: true });
