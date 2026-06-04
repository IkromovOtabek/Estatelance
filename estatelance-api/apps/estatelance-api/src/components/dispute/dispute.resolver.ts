import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { Dispute } from '../../schemas/Dispute.model';
import { CreateDisputeInput, ResolveDisputeInput } from '../../libs/dto/dispute.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/auth-user.decorator';
import { UserType, DisputeStatus } from '../../libs/enums/common.enums';

@Resolver()
export class DisputeResolver {
  constructor(private readonly disputeService: DisputeService) {}

  @Mutation(() => Dispute)
  @UseGuards(AuthGuard)
  async createDispute(
    @AuthUser() userId: string,
    @Args('input') input: CreateDisputeInput,
  ): Promise<Dispute> {
    return this.disputeService.createDispute(userId, input);
  }

  @Query(() => [Dispute])
  @UseGuards(AuthGuard)
  async getMyDisputes(@AuthUser() userId: string): Promise<Dispute[]> {
    return this.disputeService.getMyDisputes(userId);
  }

  @Query(() => [Dispute])
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  async getAllDisputes(
    @Args('status', { nullable: true }) status?: DisputeStatus,
  ): Promise<Dispute[]> {
    return this.disputeService.getAllDisputes(status);
  }

  @Mutation(() => Dispute)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  async resolveDispute(
    @AuthUser() adminId: string,
    @Args('input') input: ResolveDisputeInput,
  ): Promise<Dispute> {
    return this.disputeService.resolveDispute(adminId, input);
  }
}
