import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JobService } from './job.service';
import { Job } from '../../schemas/Job.model';
import { ActiveUserGuard, AuthGuard, OptionalAuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { BoostPaymentInfo, CreateJobInput, GetJobsInput, LeaveReviewInput, UpdateJobInput } from '../../libs/dto/job.dto';
import { Float } from '@nestjs/graphql';

@Resolver()
export class JobResolver {
  constructor(private readonly jobService: JobService) {}

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async createJob(
    @AuthUser('_id') agentId: string,
    @Args('input') input: CreateJobInput,
  ): Promise<Job> {
    return this.jobService.createJob(agentId, input);
  }

  @UseGuards(OptionalAuthGuard)
  @Query(() => Job)
  async getJobById(@Args('jobId') jobId: string): Promise<Job> {
    return this.jobService.getJobById(jobId);
  }

  @UseGuards(OptionalAuthGuard)
  @Query(() => [Job])
  async getJobs(@Args('input') input: GetJobsInput): Promise<Job[]> {
    return this.jobService.getJobs(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => [Job])
  async getMyJobs(@AuthUser('_id') agentId: string): Promise<Job[]> {
    return this.jobService.getJobsByAgent(agentId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async updateJob(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
    @Args('input') input: UpdateJobInput,
  ): Promise<Job> {
    return this.jobService.updateJob(agentId, jobId, input);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Boolean)
  async deleteJob(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
  ): Promise<boolean> {
    return this.jobService.deleteJob(agentId, jobId);
  }

  @UseGuards(AuthGuard)
  @Query(() => BoostPaymentInfo)
  getBoostPaymentInfo(): BoostPaymentInfo {
    return this.jobService.getBoostPaymentInfo();
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async submitBoostPayment(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
    @Args('plan') plan: string,
    @Args('receiptUrl') receiptUrl: string,
  ): Promise<Job> {
    return this.jobService.submitBoostPayment(agentId, jobId, plan, receiptUrl);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async boostJob(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
    @Args('plan') plan: string,
    @Args('paymentConfirmed') paymentConfirmed: boolean,
  ): Promise<Job> {
    return this.jobService.boostJob(agentId, jobId, plan, paymentConfirmed);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Job)
  async incrementJobView(
    @AuthUser('_id') userId: string,
    @Args('jobId') jobId: string,
  ): Promise<Job> {
    return this.jobService.incrementJobView(jobId, userId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async completeJob(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
    @Args('hiredFreelancerId', { nullable: true }) hiredFreelancerId?: string,
  ): Promise<Job> {
    return this.jobService.completeJob(agentId, jobId, hiredFreelancerId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async cancelJob(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
    @Args('reason') reason: string,
  ): Promise<Job> {
    return this.jobService.cancelJob(agentId, jobId, reason);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async markJobActive(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
  ): Promise<Job> {
    return this.jobService.markJobActive(agentId, jobId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async markJobPaid(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
  ): Promise<Job> {
    return this.jobService.markJobPaid(agentId, jobId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async assignHiredFreelancer(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
    @Args('hiredFreelancerId') hiredFreelancerId: string,
  ): Promise<Job> {
    return this.jobService.assignHiredFreelancer(agentId, jobId, hiredFreelancerId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async leaveReview(
    @AuthUser('_id') userId: string,
    @Args('input') input: LeaveReviewInput,
  ): Promise<Job> {
    return this.jobService.leaveReview(userId, input);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async repeatHire(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
  ): Promise<Job> {
    return this.jobService.repeatHire(agentId, jobId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async depositEscrow(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
    @Args('amount', { type: () => Float }) amount: number,
  ): Promise<Job> {
    return this.jobService.depositEscrow(agentId, jobId, amount);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async releaseEscrow(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
  ): Promise<Job> {
    return this.jobService.releaseEscrow(agentId, jobId);
  }
}
