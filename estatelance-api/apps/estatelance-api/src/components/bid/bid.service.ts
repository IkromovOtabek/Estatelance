import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bid } from '../../schemas/Bid.model';
import { Job } from '../../schemas/Job.model';
import { User } from '../../schemas/User.model';
import { CreateBidInput } from '../../libs/dto/bid.dto';
import { BidStatus, FreelancerAvailability, JobStatus, NotificationType, UserType } from '../../libs/enums/common.enums';
import { JobService } from '../job/job.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BidService {
  constructor(
    @InjectModel('Bid') private readonly bidModel: Model<Bid>,
    @InjectModel('Job') private readonly jobModel: Model<Job>,
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly jobService: JobService,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Submit a Bid ─────────────────────────────────────────────────────────
  async createBid(freelancerId: string, input: CreateBidInput): Promise<Bid> {
    const freelancer = await this.userModel.findById(freelancerId);
    if (!freelancer || freelancer.userType !== UserType.FREELANCER) {
      throw new BadRequestException('Only freelancers can submit bids.');
    }

    const job = await this.jobModel.findById(input.jobId);
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('This job is not accepting bids anymore.');
    }

    // Check if this freelancer already bid on this job
    const existingBid = await this.bidModel.findOne({ jobId: input.jobId, freelancerId });
    if (existingBid) {
      throw new BadRequestException('You have already submitted a bid for this job.');
    }

    const newBid = await this.bidModel.create({
      ...input,
      freelancerId,
      freelancerName: freelancer.fullName ?? freelancer.username,
      freelancerTitle: freelancer.bio ?? 'Professional Freelancer',
      status: BidStatus.PENDING,
    });

    // Increase the bid count on the job
    await this.jobModel.findByIdAndUpdate(input.jobId, { $inc: { bidCount: 1 } });

    // Notify the job owner about the new bid
    await this.notificationService.createNotification(
      String(job.agentId),
      NotificationType.BID,
      'Yangi taklif keldi',
      `${newBid.freelancerName} sizning "${job.title}" ishingizga taklif yubordi`,
      String(job._id),
    );

    return newBid;
  }

  // ─── Get All Bids for a Job ───────────────────────────────────────────────
  async getBidsForJob(jobId: string): Promise<Bid[]> {
    return this.bidModel.find({ jobId }).sort({ createdAt: -1 });
  }

  // ─── Get All Bids by a Freelancer ─────────────────────────────────────────
  async getMyBids(freelancerId: string): Promise<Bid[]> {
    return this.bidModel.find({ freelancerId }).sort({ createdAt: -1 });
  }

  // ─── Accept a Bid ─────────────────────────────────────────────────────────
  // When an agent accepts a bid:
  // 1. Mark that bid as accepted
  // 2. Decline all other bids on the same job
  // 3. Move the job to ACTIVE status
  // 4. Mark the freelancer as BUSY
  async acceptBid(agentId: string, bidId: string): Promise<Bid> {
    const bid = await this.bidModel.findById(bidId);
    if (!bid) throw new NotFoundException('Bid not found');

    const job = await this.jobModel.findOne({ _id: bid.jobId, agentId });
    if (!job) throw new NotFoundException('Job not found or you do not own it');

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('This job has already been assigned.');
    }

    // Accept this bid
    bid.status = BidStatus.ACCEPTED;
    await bid.save();

    // Decline all other bids on this job
    await this.bidModel.updateMany(
      { jobId: bid.jobId, _id: { $ne: bidId } },
      { status: BidStatus.DECLINED },
    );

    // Activate the job and record who was hired
    await this.jobService.activateJob(String(bid.jobId), String(bid.freelancerId));

    // Mark the freelancer as busy so they don't get more bids
    await this.userModel.findByIdAndUpdate(bid.freelancerId, {
      availability: FreelancerAvailability.BUSY,
    });

    // Notify the accepted freelancer
    await this.notificationService.createNotification(
      String(bid.freelancerId),
      NotificationType.BID,
      'Taklifingiz qabul qilindi! 🎉',
      `"${job.title}" ishiga taklifingiz qabul qilindi. Ish boshlandi!`,
      String(job._id),
    );

    // Notify the declined freelancers
    const declinedBids = await this.bidModel.find({
      jobId: bid.jobId,
      _id: { $ne: bidId },
      status: BidStatus.DECLINED,
    });
    await Promise.all(
      declinedBids.map((b) =>
        this.notificationService.createNotification(
          String(b.freelancerId),
          NotificationType.BID,
          'Taklifingiz rad etildi',
          `"${job.title}" ishiga taklifingiz rad etildi. Boshqa imkoniyatlarni ko'rib chiqing.`,
          String(job._id),
        ),
      ),
    );

    return bid;
  }
}
