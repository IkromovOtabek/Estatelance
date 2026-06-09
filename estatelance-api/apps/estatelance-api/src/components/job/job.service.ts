import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from '../../schemas/Job.model';
import { User } from '../../schemas/User.model';
import { Bid } from '../../schemas/Bid.model';
import { CreateJobInput, GetJobsInput, LeaveReviewInput, UpdateJobInput } from '../../libs/dto/job.dto';
import {
  BidStatus,
  BoostPaymentStatus,
  EscrowStatus,
  FreelancerAvailability,
  JobStatus,
  NotificationType,
  UserType,
} from '../../libs/enums/common.enums';
import { NotificationService } from '../notification/notification.service';
import { RedisService } from '../../libs/redis/redis.service';
import { AdminLinkPaths } from '../../libs/constants/admin-link-paths';
import {
  compareBoostListing,
  isBoostActive as computeBoostActive,
} from '../../libs/utils/boost.util';

@Injectable()
export class JobService {
  constructor(
    @InjectModel('Job') private readonly jobModel: Model<Job>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Bid') private readonly bidModel: Model<Bid>,
    private readonly notificationService: NotificationService,
    private readonly redis: RedisService,   // ishlar ro'yxati keshi
  ) {}

  // ─── Post a New Job ───────────────────────────────────────────────────────
  async createJob(agentId: string, input: CreateJobInput): Promise<Job> {
    const agent = await this.userModel.findById(agentId);
    if (!agent) throw new NotFoundException('Agent not found');

    const job = await this.jobModel.create({
      ...input,
      agentId,
      agentName: agent.fullName ?? agent.username,
      status: JobStatus.OPEN,
    });
    await this.redis.delByPattern('jobs:list:*');  // yangi ish → ro'yxat keshi eskirdi
    return job;
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
  // KESH: bosh sahifa va Ishlar sahifasining asosiy so'rovi. Filtr/sahifaga qarab
  // alohida kalit (JSON.stringify(input)) bilan 30 soniyaga keshlanadi.
  // Yangi ish qo'shilsa yoki status o'zgarsa — "jobs:list:*" tozalanadi.
  async getJobs(input: GetJobsInput): Promise<Job[]> {
    const cacheKey = `jobs:list:${JSON.stringify(input)}`;
    return this.redis.remember(cacheKey, 30, () => this.queryJobs(input));
  }

  // Asosiy MongoDB so'rovi (kesh ichida chaqiriladi)
  private async queryJobs(input: GetJobsInput): Promise<Job[]> {
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
    const jobs = await this.jobModel
      .find(filter)
      .sort({ bumpedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(input.limit)
      .lean()       // kesh uchun toza JS obyektlar (Mongoose hujjati emas)
      .exec() as any;

    // Faol boostlar har doim tepada (bumpedAt null bo'lsa ham)
    return [...jobs].sort((a, b) => {
      const boostCmp = compareBoostListing(a, b);
      if (boostCmp !== 0) return boostCmp;
      const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return cb - ca;
    });
  }

  // ─── Get All Jobs by a Specific Agent ─────────────────────────────────────
  async getJobsByAgent(agentId: string): Promise<Job[]> {
    return this.jobModel.find({ agentId }).sort({ createdAt: -1 });
  }

  // ─── Complete a Job ───────────────────────────────────────────────────────
  // Agent marks the job done. Optionally chooses which freelancer was hired
  // (e.g. from the bidders). If the job already had a hired freelancer, that
  // one is kept unless a new one is provided.
  async completeJob(agentId: string, jobId: string, hiredFreelancerId?: string): Promise<Job> {
    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Job not found or you do not own it');

    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
      throw new BadRequestException('Yakunlangan yoki bekor qilingan ishni o\'zgartirib bo\'lmaydi');
    }

    // Determine the hired freelancer: newly chosen one wins, else the existing one
    const finalHiredId = hiredFreelancerId || (job.hiredFreelancerId ? String(job.hiredFreelancerId) : '');
    if (!finalHiredId) {
      throw new BadRequestException('Ishni bajargan frilanserni tanlang');
    }

    const freelancer = await this.userModel.findById(finalHiredId);
    if (!freelancer) throw new NotFoundException('Tanlangan frilanser topilmadi');

    job.hiredFreelancerId = finalHiredId;
    job.status = JobStatus.COMPLETED;
    await job.save();

    // Update the hired freelancer's completed job count and mark them available again
    await this.userModel.findByIdAndUpdate(finalHiredId, {
      $inc: { completedJobCount: 1 },
      availability: FreelancerAvailability.AVAILABLE,
    });

    await this.notificationService.createNotification(
      String(finalHiredId),
      NotificationType.SYSTEM,
      'Ish yakunlandi',
      `"${job.title}" ishi agent tomonidan yakunlandi deb belgilandi. Tabriklaymiz!`,
      String(job._id),
    );

    return job;
  }

  // ─── Cancel a Job ─────────────────────────────────────────────────────────
  // Agent cancels with a reason. The reason is stored on the job and all admins
  // are notified so they can review it on the moderation page.
  async cancelJob(agentId: string, jobId: string, reason: string): Promise<Job> {
    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Job not found or you do not own it');
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
      throw new BadRequestException('Yakunlangan yoki allaqachon bekor qilingan ishni bekor qilib bo\'lmaydi');
    }
    const trimmed = (reason ?? '').trim();
    if (trimmed.length < 5) {
      throw new BadRequestException('Bekor qilish sababini kiriting (kamida 5 belgi)');
    }

    job.status = JobStatus.CANCELLED;
    job.cancelReason = trimmed;
    job.cancelledAt = new Date();
    await job.save();

    // Decline all pending bids on this job
    await this.bidModel.updateMany(
      { jobId: job._id, status: BidStatus.PENDING },
      { status: BidStatus.DECLINED },
    );

    // Free up the hired freelancer (if any) and notify them
    if (job.hiredFreelancerId) {
      await this.userModel.findByIdAndUpdate(job.hiredFreelancerId, {
        availability: FreelancerAvailability.AVAILABLE,
      });
      await this.notificationService.createNotification(
        String(job.hiredFreelancerId),
        NotificationType.SYSTEM,
        'Ish bekor qilindi',
        `"${job.title}" ishi agent tomonidan bekor qilindi. Sabab: ${trimmed}`,
        String(job._id),
      );
    }

    const agent = await this.userModel.findById(agentId).select('fullName username');
    await this.notificationService.notifyAllAdmins(
      'Ish bekor qilindi (tekshiruv)',
      `${agent?.fullName ?? agent?.username ?? 'Agent'} "${job.title}" ishini bekor qildi. Sabab: ${trimmed}`,
      String(job._id),
      AdminLinkPaths.targetsModeration({ jobId: String(job._id) }),
    );

    return job;
  }

  // ─── Mark a Job Active (manual) ───────────────────────────────────────────
  // Agent manually moves an open job into the "in progress" state.
  async markJobActive(agentId: string, jobId: string): Promise<Job> {
    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Job not found or you do not own it');
    if (job.status === JobStatus.ACTIVE) return job;
    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Faqat ochiq (kutilayotgan) ishni faol qilish mumkin');
    }
    job.status = JobStatus.ACTIVE;
    return job.save();
  }

  // ─── Assign hired freelancer (bevosita to'lov / faol ish uchun) ───────────
  async assignHiredFreelancer(
    agentId: string,
    jobId: string,
    hiredFreelancerId: string,
  ): Promise<Job> {
    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Job not found or you do not own it');
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
      throw new BadRequestException('Tugagan yoki bekor qilingan ishga frilanser tayinlab bo\'lmaydi');
    }

    const freelancer = await this.userModel.findById(hiredFreelancerId);
    if (!freelancer || freelancer.userType !== UserType.FREELANCER) {
      throw new BadRequestException('Frilanser topilmadi');
    }

    job.hiredFreelancerId = hiredFreelancerId;
    if (job.status === JobStatus.OPEN) {
      job.status = JobStatus.ACTIVE;
    }
    await job.save();

    await this.userModel.findByIdAndUpdate(hiredFreelancerId, {
      availability: FreelancerAvailability.BUSY,
    });

    await this.notificationService.createNotification(
      hiredFreelancerId,
      NotificationType.SYSTEM,
      'Ishga tayinlandingiz',
      `"${job.title}" ishiga agent sizni tanladi. To'lov kutilmoqda.`,
      String(job._id),
    );

    return job;
  }

  // ─── Mark Direct Payment Done (bevosita to'lov) ───────────────────────────
  // Agent confirms that money was paid directly to the hired freelancer.
  async markJobPaid(agentId: string, jobId: string): Promise<Job> {
    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Job not found or you do not own it');
    if (!job.hiredFreelancerId) {
      throw new BadRequestException('Avval ishga frilanser tayinlang');
    }
    if (job.paymentDone) return job;

    job.paymentDone = true;
    job.paymentDoneAt = new Date();
    await job.save();

    await this.notificationService.createNotification(
      String(job.hiredFreelancerId),
      NotificationType.SYSTEM,
      "To'lov qilindi",
      `"${job.title}" ishi uchun agent to'lovni amalga oshirdi`,
      String(job._id),
    );

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

  // ─── Platform rekvizitlari (boost bevosita to'lov) ─────────────────────────
  getBoostPaymentInfo(): {
    cardNumber: string;
    phoneNumber: string;
    holderName: string;
    paymentNote: string;
  } {
    return {
      cardNumber: process.env.PLATFORM_PAYMENT_CARD?.trim() || '',
      phoneNumber: process.env.PLATFORM_PAYMENT_PHONE?.trim() || '',
      holderName: process.env.PLATFORM_PAYMENT_HOLDER?.trim() || 'BuFu',
      paymentNote:
        process.env.PLATFORM_PAYMENT_NOTE?.trim() ||
        "To'lovdan keyin chek rasmini yuklang — admin tasdiqlagach boost yoqiladi.",
    };
  }

  /** Admin: boostni butunlay bekor qiladi — ish oddiy ro'yxat tartibiga qaytadi */
  async adminCancelBoost(jobId: string): Promise<Job> {
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException('Ish topilmadi');

    const hadBoost =
      !!job.boostExpiresAt ||
      !!job.boostPaidAt ||
      (job.boostPaymentStatus != null &&
        job.boostPaymentStatus !== BoostPaymentStatus.NONE);

    if (!hadBoost) {
      throw new BadRequestException('Bu ishda boost yo\'q');
    }

    job.bumpedAt = null;
    job.boostExpiresAt = null;
    job.boostPlan = null;
    job.boostPaidAt = null;
    job.boostPaymentStatus = BoostPaymentStatus.NONE;
    job.boostRequestedPlan = null;
    job.boostReceiptUrl = null;
    job.boostPaymentSubmittedAt = null;
    job.boostPaymentReviewedAt = null;
    job.boostPaymentRejectReason = null;
    job.boostViewsAtStart = null;
    job.boostBidsAtStart = null;
    job.boostPausedByAdmin = false;
    await job.save();

    await this.notificationService.createNotification(
      String(job.agentId),
      NotificationType.SYSTEM,
      'Boost bekor qilindi',
      `"${job.title}" uchun boost admin tomonidan o\'chirildi. E\'lon oddiy ro\'yxatda.`,
      String(job._id),
    );

    return job;
  }

  /** Boost ro'yxatda ko'rinadi va agent yangi chek yubora olmaydi */
  isBoostActive(job: Pick<Job, 'boostExpiresAt' | 'boostPausedByAdmin'>): boolean {
    return computeBoostActive(job);
  }

  private applyBoostPlan(job: Job, plan: string): void {
    const validPlans = ['BASIC', 'PRO', 'VIP'];
    const boostPlan = validPlans.includes(plan) ? plan : 'BASIC';
    const PLAN_DAYS: Record<string, number> = { BASIC: 3, PRO: 7, VIP: 30 };
    const days = PLAN_DAYS[boostPlan] ?? 3;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    job.bumpedAt = now;
    job.boostExpiresAt = expiresAt;
    job.boostPlan = boostPlan;
    job.boostPaidAt = now;
    job.boostViewsAtStart = job.viewCount ?? 0;
    job.boostBidsAtStart = job.bidCount ?? 0;
    job.boostPausedByAdmin = false;
  }

  // ─── Agent: chek yuklash → admin tasdiqlashi kutiladi ─────────────────────
  async submitBoostPayment(
    agentId: string,
    jobId: string,
    plan: string,
    receiptUrl: string,
  ): Promise<Job> {
    const trimmedReceipt = receiptUrl?.trim();
    if (!trimmedReceipt) {
      throw new BadRequestException('To\'lov cheki rasmi majburiy');
    }

    const job = await this.jobModel.findOne({ _id: jobId, agentId });
    if (!job) throw new NotFoundException('Job not found or you do not own it');
    if (job.status !== JobStatus.OPEN && job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException('Faqat ochiq yoki faol ishlar boost qilinishi mumkin');
    }
    if (job.boostPaymentStatus === BoostPaymentStatus.PENDING) {
      throw new BadRequestException('To\'lov cheki allaqachon yuborilgan — admin tasdiqlashini kuting');
    }
    const boostStillActive = this.isBoostActive(job);
    if (boostStillActive) {
      throw new BadRequestException('Boost allaqachon faol — muddati tugagach qayta yuborishingiz mumkin');
    }

    const validPlans = ['BASIC', 'PRO', 'VIP'];
    const boostPlan = validPlans.includes(plan) ? plan : 'BASIC';
    const now = new Date();

    job.boostPaymentStatus = BoostPaymentStatus.PENDING;
    job.boostRequestedPlan = boostPlan;
    job.boostReceiptUrl = trimmedReceipt;
    job.boostPaymentSubmittedAt = now;
    job.boostPaymentReviewedAt = null;
    job.boostPaymentRejectReason = null;
    await job.save();

    const agent = await this.userModel.findById(agentId).select('fullName username');
    const agentLabel = agent?.fullName ?? agent?.username ?? 'Agent';
    await this.notificationService.notifyAllAdmins(
      'Boost to\'lov cheki',
      `${agentLabel} "${job.title}" uchun ${boostPlan} boost chekini yubordi.`,
      String(job._id),
      AdminLinkPaths.payments({ jobId: String(job._id) }),
    );

    return job;
  }

  async getPendingBoostPayments(): Promise<
    { job: Job; agentName: string; agentUsername?: string }[]
  > {
    const jobs = await this.jobModel
      .find({ boostPaymentStatus: BoostPaymentStatus.PENDING })
      .sort({ boostPaymentSubmittedAt: -1 })
      .exec();

    const results: { job: Job; agentName: string; agentUsername?: string }[] = [];
    for (const job of jobs) {
      const agent = await this.userModel
        .findById(job.agentId)
        .select('fullName username');
      results.push({
        job,
        agentName: agent?.fullName ?? agent?.username ?? 'Agent',
        agentUsername: agent?.username,
      });
    }
    return results;
  }

  /** Tasdiqlangan va rad etilgan boost to'lovlari (tarix) */
  async getBoostPaymentHistory(limit: number = 50): Promise<
    { job: Job; agentName: string; agentUsername?: string }[]
  > {
    const jobs = await this.jobModel
      .find({
        boostPaymentStatus: {
          $in: [BoostPaymentStatus.APPROVED, BoostPaymentStatus.REJECTED],
        },
      })
      .sort({ boostPaymentReviewedAt: -1, updatedAt: -1 })
      .limit(limit)
      .exec();

    const results: { job: Job; agentName: string; agentUsername?: string }[] = [];
    for (const job of jobs) {
      const agent = await this.userModel
        .findById(job.agentId)
        .select('fullName username');
      results.push({
        job,
        agentName: agent?.fullName ?? agent?.username ?? 'Agent',
        agentUsername: agent?.username,
      });
    }
    return results;
  }

  async approveBoostPayment(adminId: string, jobId: string): Promise<Job> {
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException('Ish topilmadi');
    if (job.boostPaymentStatus !== BoostPaymentStatus.PENDING) {
      throw new BadRequestException('Kutilayotgan boost to\'lovi yo\'q');
    }
    if (job.status !== JobStatus.OPEN && job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException('Faqat ochiq yoki faol ishlar boost qilinishi mumkin');
    }

    const plan = job.boostRequestedPlan ?? 'BASIC';
    this.applyBoostPlan(job, plan);
    job.boostPaymentStatus = BoostPaymentStatus.APPROVED;
    job.boostPaymentReviewedAt = new Date();
    job.boostPaymentRejectReason = null;
    job.markModified('bumpedAt');
    job.markModified('boostExpiresAt');
    await job.save();

    await this.notificationService.createNotification(
      String(job.agentId),
      NotificationType.SYSTEM,
      'Boost tasdiqlandi',
      `"${job.title}" uchun ${job.boostPlan} boost yoqildi. E\'lon ro\'yxat tepasida.`,
      String(job._id),
    );

    return job;
  }

  async rejectBoostPayment(
    adminId: string,
    jobId: string,
    reason: string,
  ): Promise<Job> {
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException('Ish topilmadi');
    if (job.boostPaymentStatus !== BoostPaymentStatus.PENDING) {
      throw new BadRequestException('Kutilayotgan boost to\'lovi yo\'q');
    }

    const trimmed = reason?.trim() || 'To\'lov cheki tasdiqlanmadi';
    job.boostPaymentStatus = BoostPaymentStatus.REJECTED;
    job.boostPaymentReviewedAt = new Date();
    job.boostPaymentRejectReason = trimmed;
    await job.save();

    await this.notificationService.createNotification(
      String(job.agentId),
      NotificationType.SYSTEM,
      'Boost to\'lovi rad etildi',
      `"${job.title}": ${trimmed}. Yangi chek yuklashingiz mumkin.`,
      String(job._id),
    );

    return job;
  }

  // Eski API — endi agent to\'g\'ridan chaqirmaydi (faqat ichki / legacy)
  async boostJob(
    agentId: string,
    jobId: string,
    plan: string,
    paymentConfirmed: boolean,
  ): Promise<Job> {
    if (!paymentConfirmed) {
      throw new BadRequestException("Avval to'lovni amalga oshirib, chek yuklang");
    }
    throw new BadRequestException(
      "Boost uchun chek rasmini yuklang — admin tasdiqlagach avtomatik yoqiladi",
    );
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
