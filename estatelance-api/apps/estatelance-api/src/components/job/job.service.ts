import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from '../../schemas/Job.model';
import { User } from '../../schemas/User.model';
import { CreateJobInput, GetJobsInput, LeaveReviewInput, UpdateJobInput } from '../../libs/dto/job.dto';
import { EscrowStatus, FreelancerAvailability, JobStatus, NotificationType, UserType } from '../../libs/enums/common.enums';
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
    if (input.experienceLevel) filter.experienceLevel = input.experienceLevel;
    if (input.jobType) filter.jobType = input.jobType;
    if (input.location) filter.location = { $regex: input.location, $options: 'i' };
    if (input.workFormat) filter.workFormat = { $in: [input.workFormat] };

    if (input.budgetMin !== undefined || input.budgetMax !== undefined) {
      filter.budget = {};
      if (input.budgetMin !== undefined) filter.budget.$gte = input.budgetMin;
      if (input.budgetMax !== undefined) filter.budget.$lte = input.budgetMax;
    }

    if (input.searchText) {
      filter.$or = [
        { title: { $regex: input.searchText, $options: 'i' } },
        { description: { $regex: input.searchText, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(input.searchText, 'i')] } },
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

  // ─── Repeat Hire ─────────────────────────────────────────────────────────
  // Agent can re-hire the same freelancer from a completed job with one click
  async repeatHire(agentId: string, jobId: string): Promise<Job> {
    const oldJob = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!oldJob) throw new NotFoundException('Ish topilmadi yoki siz egasi emassiz');
    if (oldJob.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('Faqat yakunlangan ishlardan takror yollash mumkin');
    }
    if (!oldJob.hiredFreelancerId) {
      throw new BadRequestException('Bu ish uchun frilanser topilmadi');
    }

    const agent = await this.userModel.findById(agentId);
    const newJob = await this.jobModel.create({
      title: oldJob.title,
      description: oldJob.description,
      propertyAddress: oldJob.propertyAddress,
      propertyType: oldJob.propertyType,
      category: oldJob.category,
      budget: oldJob.budget,
      status: JobStatus.OPEN,
      agentId,
      agentName: agent?.fullName ?? agent?.username,
      experienceLevel: oldJob.experienceLevel,
      jobType: oldJob.jobType,
      workFormat: oldJob.workFormat,
      location: oldJob.location,
      requiredSkills: oldJob.requiredSkills,
    });

    await this.notificationService.createNotification(
      String(oldJob.hiredFreelancerId),
      NotificationType.SYSTEM,
      'Qayta yollash taklifiga taklif',
      `"${oldJob.title}" ishi uchun agent sizi qayta yollashni so'ramoqda`,
      String(newJob._id),
    );

    return newJob;
  }

  // ─── Leave Review (after job completion) ─────────────────────────────────
  async leaveReview(userId: string, input: LeaveReviewInput): Promise<Job> {
    const job = await this.jobModel.findById(input.jobId);
    if (!job) throw new NotFoundException('Ish topilmadi');
    if (job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('Faqat yakunlangan ishlarga sharh qoldirish mumkin');
    }

    const isAgent = String(job.agentId) === userId;
    const isFreelancer = String(job.hiredFreelancerId) === userId;

    if (!isAgent && !isFreelancer) {
      throw new ForbiddenException('Siz bu ishga tegishli emassiz');
    }

    if (input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Reyting 1 dan 5 gacha bo\'lishi kerak');
    }

    if (isAgent) {
      // Agent reviews freelancer → saved to job, then reflected on user's averageRating
      if (job.agentRating !== null && job.agentRating !== undefined) {
        throw new BadRequestException('Siz allaqachon sharh qoldirdingiz');
      }
      job.agentRating = input.rating;
      job.agentReviewText = input.reviewText;
      await job.save();

      // Update freelancer's averageRating and add embedded review to their profile
      const freelancer = await this.userModel.findById(job.hiredFreelancerId);
      if (freelancer) {
        const agent = await this.userModel.findById(userId).select('fullName username');
        const reviews = freelancer.reviews ?? [];
        reviews.push({
          authorName: agent?.fullName ?? agent?.username ?? 'Agent',
          rating: input.rating,
          reviewText: input.reviewText,
          createdAt: new Date().toISOString(),
        });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await this.userModel.findByIdAndUpdate(job.hiredFreelancerId, {
          reviews,
          averageRating: Math.round(avgRating * 10) / 10,
        });

        await this.notificationService.createNotification(
          String(job.hiredFreelancerId),
          NotificationType.SYSTEM,
          'Yangi sharh qoldirildi',
          `"${job.title}" ishi uchun ${input.rating} yulduz sharh oldingiz`,
          String(job._id),
        );
      }
    } else {
      // Freelancer reviews agent → saved to job
      if (job.freelancerRating !== null && job.freelancerRating !== undefined) {
        throw new BadRequestException('Siz allaqachon sharh qoldirdingiz');
      }
      job.freelancerRating = input.rating;
      job.freelancerReviewText = input.reviewText;
      await job.save();
    }

    return job;
  }

  // ─── Deposit Escrow ───────────────────────────────────────────────────────
  async depositEscrow(agentId: string, jobId: string, amount: number): Promise<Job> {
    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Ish topilmadi yoki siz egasi emassiz');
    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException('Escrow faqat faol ishlarda to\'ldiriladi');
    }

    job.escrowAmount = amount;
    job.escrowStatus = EscrowStatus.HELD;
    return job.save();
  }

  // ─── Release Escrow ───────────────────────────────────────────────────────
  async releaseEscrow(agentId: string, jobId: string): Promise<Job> {
    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Ish topilmadi yoki siz egasi emassiz');
    if (job.escrowStatus !== EscrowStatus.HELD) {
      throw new BadRequestException('Escrow ushlab turilmagan yoki nizo ostida');
    }

    job.escrowStatus = EscrowStatus.RELEASED;
    await job.save();

    if (job.hiredFreelancerId) {
      await this.notificationService.createNotification(
        String(job.hiredFreelancerId),
        NotificationType.SYSTEM,
        'To\'lov chiqarildi',
        `"${job.title}" ishi uchun escrow to'lovi sizga chiqarildi`,
        String(job._id),
      );
    }

    return job;
  }

  // Used internally by BidService when a bid is accepted
  async activateJob(jobId: string, hiredFreelancerId: string): Promise<void> {
    await this.jobModel.findByIdAndUpdate(jobId, {
      status: JobStatus.ACTIVE,
      hiredFreelancerId,
    });
  }
}
