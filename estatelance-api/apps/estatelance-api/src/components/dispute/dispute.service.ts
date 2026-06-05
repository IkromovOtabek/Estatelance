import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dispute } from '../../schemas/Dispute.model';
import { Job } from '../../schemas/Job.model';
import { User } from '../../schemas/User.model';
import { CreateDisputeInput, ResolveDisputeInput } from '../../libs/dto/dispute.dto';
import { DisputeDecision, DisputeStatus, EscrowStatus, JobStatus, NotificationType } from '../../libs/enums/common.enums';
import { NotificationService } from '../notification/notification.service';
import { AdminLinkPaths } from '../../libs/constants/admin-link-paths';

@Injectable()
export class DisputeService {
  constructor(
    @InjectModel('Dispute') private readonly disputeModel: Model<Dispute>,
    @InjectModel('Job') private readonly jobModel: Model<Job>,
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── File a Dispute ───────────────────────────────────────────────────────
  async createDispute(userId: string, input: CreateDisputeInput): Promise<Dispute> {
    const job = await this.jobModel.findById(input.jobId);
    if (!job) throw new NotFoundException('Ish topilmadi');

    if (job.status !== JobStatus.ACTIVE && job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('Nizo faqat faol yoki yakunlangan ishlarda ochilishi mumkin');
    }

    const agentId = String(job.agentId);
    const freelancerId = String(job.hiredFreelancerId);

    const isAgent = agentId === userId;
    const isFreelancer = freelancerId === userId;
    if (!isAgent && !isFreelancer) {
      throw new ForbiddenException('Siz bu ish bilan bog\'liq emassiz');
    }

    // Prevent duplicate open disputes for the same job
    const existing = await this.disputeModel.findOne({ jobId: input.jobId, status: DisputeStatus.OPEN });
    if (existing) {
      throw new BadRequestException('Bu ish uchun allaqachon ochiq nizo mavjud');
    }

    const filer = await this.userModel.findById(userId).select('fullName username');
    const againstId = isAgent ? freelancerId : agentId;
    const against = await this.userModel.findById(againstId).select('fullName username');

    const dispute = await this.disputeModel.create({
      jobId: input.jobId,
      jobTitle: job.title,
      filedById: userId,
      filedByName: filer?.fullName ?? filer?.username,
      againstId,
      againstName: against?.fullName ?? against?.username,
      reason: input.reason,
      status: DisputeStatus.OPEN,
    });

    // Freeze escrow
    await this.jobModel.findByIdAndUpdate(input.jobId, { escrowStatus: EscrowStatus.DISPUTED });

    await this.notificationService.createNotification(
      againstId,
      NotificationType.SYSTEM,
      'Yangi nizo ochildi',
      `"${job.title}" ishi bo'yicha siz haqingizda nizo ochildi`,
      String(job._id),
    );

    await this.notificationService.notifyAllAdmins(
      'Yangi nizo',
      `${filer?.fullName ?? filer?.username ?? 'Foydalanuvchi'} "${job.title}" bo'yicha nizo ochdi.`,
      String(dispute._id),
      AdminLinkPaths.targetsModeration({ disputeId: String(dispute._id) }),
    );

    return dispute;
  }

  // ─── Get My Disputes ──────────────────────────────────────────────────────
  async getMyDisputes(userId: string): Promise<Dispute[]> {
    return this.disputeModel
      .find({ $or: [{ filedById: userId }, { againstId: userId }] })
      .sort({ createdAt: -1 });
  }

  // ─── Admin: Get All Disputes ──────────────────────────────────────────────
  async getAllDisputes(status?: DisputeStatus): Promise<Dispute[]> {
    const filter: any = {};
    if (status) filter.status = status;
    return this.disputeModel.find(filter).sort({ createdAt: -1 });
  }

  // ─── Admin: Resolve Dispute ───────────────────────────────────────────────
  async resolveDispute(adminId: string, input: ResolveDisputeInput): Promise<Dispute> {
    const dispute = await this.disputeModel.findById(input.disputeId);
    if (!dispute) throw new NotFoundException('Nizo topilmadi');
    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException('Bu nizo allaqachon hal qilingan');
    }

    const job = await this.jobModel.findById(dispute.jobId);
    if (!job) throw new NotFoundException('Ish topilmadi');

    dispute.status = DisputeStatus.RESOLVED;
    dispute.decision = input.decision;
    dispute.adminNote = input.adminNote;
    dispute.resolvedById = adminId;
    await dispute.save();

    // Update escrow based on decision
    let newEscrowStatus = EscrowStatus.HELD;
    if (input.decision === DisputeDecision.FAVOR_FREELANCER) {
      newEscrowStatus = EscrowStatus.RELEASED;
    } else if (input.decision === DisputeDecision.FAVOR_AGENT) {
      newEscrowStatus = EscrowStatus.REFUNDED;
    } else if (input.decision === DisputeDecision.SPLIT) {
      newEscrowStatus = EscrowStatus.RELEASED;
    }
    await this.jobModel.findByIdAndUpdate(dispute.jobId, { escrowStatus: newEscrowStatus });

    const decisionLabel = {
      [DisputeDecision.FAVOR_AGENT]: 'Agent foydasiga hal qilindi',
      [DisputeDecision.FAVOR_FREELANCER]: 'Frilanser foydasiga hal qilindi',
      [DisputeDecision.SPLIT]: 'Ikki tomon o\'rtasida taqsimlandi',
    }[input.decision];

    // Notify both parties
    await Promise.all([
      this.notificationService.createNotification(
        String(dispute.filedById),
        NotificationType.SYSTEM,
        'Nizo hal qilindi',
        `"${dispute.jobTitle}" bo'yicha nizo: ${decisionLabel}`,
        String(job._id),
      ),
      this.notificationService.createNotification(
        String(dispute.againstId),
        NotificationType.SYSTEM,
        'Nizo hal qilindi',
        `"${dispute.jobTitle}" bo'yicha nizo: ${decisionLabel}`,
        String(job._id),
      ),
    ]);

    return dispute;
  }
}
