import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JobService } from './job.service';
import { Job } from '../../schemas/Job.model';
import { ActiveUserGuard, AuthGuard, OptionalAuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { CreateJobInput, GetJobsInput, UpdateJobInput } from '../../libs/dto/job.dto';

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

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async boostJob(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
  ): Promise<Job> {
    return this.jobService.boostJob(agentId, jobId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Job)
  async completeJob(
    @AuthUser('_id') agentId: string,
    @Args('jobId') jobId: string,
  ): Promise<Job> {
    return this.jobService.completeJob(agentId, jobId);
  }
}
