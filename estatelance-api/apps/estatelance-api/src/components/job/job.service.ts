import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from '../../schemas/Job.model';
import { User } from '../../schemas/User.model';
import { CreateJobInput, GetJobsInput, UpdateJobInput } from '../../libs/dto/job.dto';
import { JobStatus, NotificationType } from '../../libs/enums/common.enums';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class JobService {
  constructor(
    @InjectModel('Job') private readonly jobModel: Model<Job>,
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Post a New Job ───────────────────────────────────────────────────────
  async createJob(agentId: string, input: CreateJobInput): Promise<Job> {
    const agent = await this.userModel.findById(agentId);
    if (!agent) throw new NotFoundException('Agent not found');

    return this.jobModel.create({
      ...input,
      agentId,
      agentName: agent.fullName ?? agent.username,
      status: JobStatus.OPEN,
    });
  }

  // ─── Get a Single Job ─────────────────────────────────────────────────────
  async getJobById(jobId: string): Promise<Job> {
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  // ─── Increment View Count (once per user) ─────────────────────────────────
  async incrementJobView(jobId: string, userId: string): Promise<Job> {
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException('Job not found');

    const alreadyViewed = job.viewedBy?.some(id => String(id) === String(userId));
    if (alreadyViewed) return job;

    return this.jobModel.findByIdAndUpdate(
      jobId,
      { $inc: { viewCount: 1 }, $addToSet: { viewedBy: userId } },
      { new: true },
    );
  }

  // ─── Get All Jobs (with filter + pagination) ──────────────────────────────
  async getJobs(input: GetJobsInput): Promise<Job[]> {
    const filter: any = {};

    if (input.category) filter.category = input.category;
    if (input.status) filter.status = input.status;

    if (input.searchText) {
      filter.$or = [
        { title: { $regex: input.searchText, $options: 'i' } },
        { description: { $regex: input.searchText, $options: 'i' } },
      ];
    }

    const skip = (input.page - 1) * input.limit;
    return this.jobModel.find(filter).sort({ bumpedAt: -1, createdAt: -1 }).skip(skip).limit(input.limit);
  }

  // ─── Get All Jobs by a Specific Agent ─────────────────────────────────────
  async getJobsByAgent(agentId: string): Promise<Job[]> {
    return this.jobModel.find({ agentId }).sort({ createdAt: -1 });
  }

  // ─── Complete a Job ───────────────────────────────────────────────────────
  async completeJob(agentId: string, jobId: string): Promise<Job> {
    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Job not found or you do not own it');

    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException('Only active jobs can be marked as completed');
    }

    job.status = JobStatus.COMPLETED;
    await job.save();

    // Update the hired freelancer's completed job count and mark them available again
    if (job.hiredFreelancerId) {
      await this.userModel.findByIdAndUpdate(job.hiredFreelancerId, {
        $inc: { completedJobCount: 1 },
        availability: 'AVAILABLE',
      });

      await this.notificationService.createNotification(
        String(job.hiredFreelancerId),
        NotificationType.SYSTEM,
        'Ish yakunlandi',
        `"${job.title}" ishi agent tomonidan yakunlandi deb belgilandi. Tabriklaymiz!`,
        String(job._id),
      );
    }

    return job;
  }

  // ─── Update a Job ─────────────────────────────────────────────────────────
  async updateJob(agentId: string, jobId: string, input: UpdateJobInput): Promise<Job> {
    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Job not found or you do not own it');
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
      throw new BadRequestException('Completed or cancelled jobs cannot be edited');
    }
    Object.assign(job, input);
    return job.save();
  }

  // ─── Delete a Job ─────────────────────────────────────────────────────────
  async deleteJob(agentId: string, jobId: string): Promise<boolean> {
    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Job not found or you do not own it');
    if (job.status === JobStatus.ACTIVE) {
      throw new BadRequestException('Active jobs cannot be deleted. Complete or cancel first.');
    }
    await this.jobModel.deleteOne({ _id: jobId });
    return true;
  }

  // ─── Boost (bump) a Job to top ────────────────────────────────────────────
  async boostJob(agentId: string, jobId: string, plan: string): Promise<Job> {
    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Job not found or you do not own it');
    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Only open jobs can be boosted');
    }

    const PLAN_DAYS: Record<string, number> = { BASIC: 3, PRO: 7, VIP: 30 };
    const days = PLAN_DAYS[plan] ?? 3;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    job.bumpedAt = now;
    job.boostExpiresAt = expiresAt;
    job.boostPlan = plan;
    return job.save();
  }

  // Used internally by BidService when a bid is accepted
  async activateJob(jobId: string, hiredFreelancerId: string): Promise<void> {
    await this.jobModel.findByIdAndUpdate(jobId, {
      status: JobStatus.ACTIVE,
      hiredFreelancerId,
    });
  }
}
