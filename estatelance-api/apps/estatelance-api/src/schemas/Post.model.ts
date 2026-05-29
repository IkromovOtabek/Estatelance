import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PostComment {
  @Field(() => String)
  _id: any;

  @Field(() => String)
  authorId: string;

  @Field(() => String)
  authorName: string;

  @Field(() => String, { nullable: true })
  authorAvatar?: string;

  @Field(() => String)
  text: string;

  @Field(() => String)
  createdAt: string;
}

// A social article or tip written by freelancers to attract agents
@Schema({ timestamps: true })
@ObjectType()
export class Post extends Document {
  @Field(() => String)
  _id: any;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  @Field(() => String)
  authorId: string;

  @Prop({ trim: true })
  @Field(() => String)
  authorName: string;

  @Prop()
  @Field(() => String, { nullable: true })
  authorAvatar?: string;

  @Prop({ required: true, trim: true })
  @Field(() => String)
  title: string;

  @Prop({ required: true })
  @Field(() => String)
  body: string;

  @Prop()
  @Field(() => String, { nullable: true })
  imageUrl?: string;

  // List of user IDs who liked this post
  @Prop({ type: [SchemaTypes.ObjectId], default: [] })
  @Field(() => [String])
  likedByUserIds: string[];

  @Prop({ default: 0 })
  @Field(() => Int)
  likeCount: number;

  @Prop({ default: 0 })
  @Field(() => Int)
  viewCount: number;

  @Prop({ type: Object, default: [] })
  @Field(() => [PostComment])
  comments: PostComment[];

  @Field(() => String, { nullable: true })
  createdAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ authorId: 1 });
PostSchema.index({ createdAt: -1 });
