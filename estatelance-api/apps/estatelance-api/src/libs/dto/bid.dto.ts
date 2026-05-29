import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNotEmpty, Min } from 'class-validator';

// ─── Input: Submit a bid on a job ────────────────────────────────────────────
@InputType()
export class CreateBidInput {
  @IsNotEmpty()
  @Field(() => String)
  jobId: string;

  @Min(1)
  @Field(() => Float)
  bidAmount: number;

  @IsNotEmpty()
  @Field(() => String)
  coverLetter: string;
}
