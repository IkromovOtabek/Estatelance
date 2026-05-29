import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

// ─── Input: Send a direct message ────────────────────────────────────────────
@InputType()
export class SendMessageInput {
  @IsNotEmpty()
  @Field(() => String)
  receiverId: string;

  @IsNotEmpty()
  @Field(() => String)
  text: string;
}
