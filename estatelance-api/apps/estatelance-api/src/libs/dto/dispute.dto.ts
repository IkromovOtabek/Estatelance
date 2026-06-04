import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { DisputeDecision } from '../enums/common.enums';

@InputType()
export class CreateDisputeInput {
  @IsNotEmpty()
  @Field(() => String)
  jobId: string;

  @IsNotEmpty()
  @Field(() => String)
  reason: string;
}

@InputType()
export class ResolveDisputeInput {
  @IsNotEmpty()
  @Field(() => String)
  disputeId: string;

  @IsEnum(DisputeDecision)
  @Field(() => String)
  decision: DisputeDecision;

  @IsOptional()
  @Field(() => String, { nullable: true })
  adminNote?: string;
}
