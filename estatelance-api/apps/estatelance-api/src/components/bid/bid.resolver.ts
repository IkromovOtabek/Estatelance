import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BidService } from './bid.service';
import { Bid } from '../../schemas/Bid.model';
import { ActiveUserGuard, AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { CreateBidInput } from '../../libs/dto/bid.dto';

@Resolver()
export class BidResolver {
  constructor(private readonly bidService: BidService) {}

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Bid)
  async createBid(
    @AuthUser('_id') freelancerId: string,
    @Args('input') input: CreateBidInput,
  ): Promise<Bid> {
    return this.bidService.createBid(freelancerId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => [Bid])
  async getBidsForJob(@Args('jobId') jobId: string): Promise<Bid[]> {
    return this.bidService.getBidsForJob(jobId);
  }

  @UseGuards(AuthGuard)
  @Query(() => [Bid])
  async getMyBids(@AuthUser('_id') freelancerId: string): Promise<Bid[]> {
    return this.bidService.getMyBids(freelancerId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Bid)
  async acceptBid(
    @AuthUser('_id') agentId: string,
    @Args('bidId') bidId: string,
  ): Promise<Bid> {
    return this.bidService.acceptBid(agentId, bidId);
  }
}
