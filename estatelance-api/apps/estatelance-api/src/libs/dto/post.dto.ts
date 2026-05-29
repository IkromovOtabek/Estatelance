import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

// ─── Input: Write a new article/post ─────────────────────────────────────────
@InputType()
export class CreatePostInput {
  @IsNotEmpty()
  @Field(() => String)
  title: string;

  @IsNotEmpty()
  @Field(() => String)
  body: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  imageUrl?: string;
}

// ─── Input: Add a comment to a post ──────────────────────────────────────────
@InputType()
export class AddCommentInput {
  @IsNotEmpty()
  @Field(() => String)
  postId: string;

  @IsNotEmpty()
  @Field(() => String)
  text: string;
}
