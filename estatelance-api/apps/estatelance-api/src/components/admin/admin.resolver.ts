import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JobService } from '../job/job.service';
import { UserService } from '../user/user.service';
import { BoostPaymentPendingItem } from '../../libs/dto/job.dto';
import { User } from '../../schemas/User.model';
import { Job } from '../../schemas/Job.model';
import { Post } from '../../schemas/Post.model';
import { Announcement } from '../../schemas/Announcement.model';
import { RolesGuard } from '../auth/roles.guard';
import { AuthGuard, OptionalAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/auth-user.decorator';
import { UserType } from '../../libs/enums/common.enums';
import {
  AdminLoginInput,
  ChangeUserStatusInput,
  ChangeUserRoleInput,
  CreateAnnouncementInput,
  DashboardStats,
  DailyVisitorStat,
  TrackVisitInput,
  VisitorUserDetail,
  StartSessionInput,
  TrackPageInput,
  EndSessionInput,
  VisitorSessionObject,
  AdminAdTargetItem,
} from '../../libs/dto/admin.dto';

@Resolver()
export class AdminResolver {
  constructor(
    private readonly adminService: AdminService,
    private readonly jobService: JobService,
    private readonly userService: UserService,
  ) {}

  private submittedAtMs(item: BoostPaymentPendingItem): number {
    const raw =
      item.job?.boostPaymentSubmittedAt ?? item.profile?.boostPaymentSubmittedAt;
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  private reviewedAtMs(item: BoostPaymentPendingItem): number {
    const raw =
      item.job?.boostPaymentReviewedAt ?? item.profile?.boostPaymentReviewedAt;
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  // ─── Admin Login ──────────────────────────────────────────────────────────────
  // Public endpoint — no guard needed. The service checks userType === ADMIN.
  @Mutation(() => User)
  async adminLogin(@Args('input') input: AdminLoginInput): Promise<User> {
    return this.adminService.adminLogin(input);
  }

  // ─── Seed Admin Account (one-time setup) ──────────────────────────────────────
  // Call this once to create the first admin. Will throw if admin already exists.
  @Mutation(() => User)
  async seedAdminAccount(
    @Args('username') username: string,
    @Args('password') password: string,
  ): Promise<User> {
    return this.adminService.seedAdminAccount(username, password);
  }

  // ─── All mutations below require ADMIN role ───────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => User)
  async adminChangeUserStatus(
    @Args('input') input: ChangeUserStatusInput,
  ): Promise<User> {
    return this.adminService.changeUserStatus(input);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => User)
  async adminChangeUserRole(
    @Args('input') input: ChangeUserRoleInput,
  ): Promise<User> {
    return this.adminService.changeUserRole(input);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => Boolean)
  async adminDeleteUser(@Args('userId') userId: string): Promise<boolean> {
    return this.adminService.deleteUser(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => Boolean)
  async adminDeleteJob(@Args('jobId') jobId: string): Promise<boolean> {
    return this.adminService.deleteJob(jobId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => Boolean)
  async adminDeletePost(@Args('postId') postId: string): Promise<boolean> {
    return this.adminService.deletePost(postId);
  }

  // ─── Announcements ────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => Announcement)
  async adminCreateAnnouncement(
    @AuthUser('_id') adminId: string,
    @Args('input') input: CreateAnnouncementInput,
  ): Promise<Announcement> {
    return this.adminService.createAnnouncement(adminId, input);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => Announcement)
  async adminToggleAnnouncement(
    @Args('announcementId') announcementId: string,
  ): Promise<Announcement> {
    return this.adminService.toggleAnnouncement(announcementId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => Boolean)
  async adminDeleteAnnouncement(
    @Args('announcementId') announcementId: string,
  ): Promise<boolean> {
    return this.adminService.deleteAnnouncement(announcementId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => [Announcement])
  async adminGetAllAnnouncements(): Promise<Announcement[]> {
    return this.adminService.getAllAnnouncements();
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => [AdminAdTargetItem])
  async adminGetAdTargets(): Promise<AdminAdTargetItem[]> {
    return this.adminService.getAdTargets();
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => AdminAdTargetItem)
  async adminSetAdTargetStatus(
    @Args('sourceKind') sourceKind: string,
    @Args('sourceId') sourceId: string,
    @Args('active') active: boolean,
  ): Promise<AdminAdTargetItem> {
    return this.adminService.setAdTargetStatus(sourceKind, sourceId, active);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => Boolean)
  async adminRemoveAdTarget(
    @Args('sourceKind') sourceKind: string,
    @Args('sourceId') sourceId: string,
  ): Promise<boolean> {
    return this.adminService.removeAdTarget(sourceKind, sourceId);
  }

  // ─── Boost to'lov cheklari ───────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => [BoostPaymentPendingItem])
  async adminGetPendingBoostPayments(): Promise<BoostPaymentPendingItem[]> {
    const [jobs, profiles] = await Promise.all([
      this.jobService.getPendingBoostPayments(),
      this.userService.getPendingProfileBoostPayments(),
    ]);
    const rows: BoostPaymentPendingItem[] = [
      ...jobs.map((r) => ({
        boostKind: 'JOB',
        job: r.job,
        agentName: r.agentName,
        agentUsername: r.agentUsername,
      })),
      ...profiles.map((r) => ({
        boostKind: 'PROFILE',
        profile: r.profile,
        agentName: r.agentName,
        agentUsername: r.agentUsername,
      })),
    ];
    return rows.sort((a, b) => this.submittedAtMs(b) - this.submittedAtMs(a));
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => [BoostPaymentPendingItem])
  async adminGetBoostPaymentHistory(
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
  ): Promise<BoostPaymentPendingItem[]> {
    const [jobs, profiles] = await Promise.all([
      this.jobService.getBoostPaymentHistory(limit),
      this.userService.getProfileBoostPaymentHistory(limit),
    ]);
    const rows: BoostPaymentPendingItem[] = [
      ...jobs.map((r) => ({
        boostKind: 'JOB',
        job: r.job,
        agentName: r.agentName,
        agentUsername: r.agentUsername,
      })),
      ...profiles.map((r) => ({
        boostKind: 'PROFILE',
        profile: r.profile,
        agentName: r.agentName,
        agentUsername: r.agentUsername,
      })),
    ];
    return rows
      .sort((a, b) => this.reviewedAtMs(b) - this.reviewedAtMs(a))
      .slice(0, limit);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => Job)
  async adminApproveBoostPayment(
    @AuthUser('_id') adminId: string,
    @Args('jobId') jobId: string,
  ): Promise<Job> {
    return this.jobService.approveBoostPayment(adminId, jobId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => User)
  async adminApproveProfileBoostPayment(
    @AuthUser('_id') adminId: string,
    @Args('userId') userId: string,
  ): Promise<User> {
    return this.userService.approveProfileBoostPayment(adminId, userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => Job)
  async adminRejectBoostPayment(
    @AuthUser('_id') adminId: string,
    @Args('jobId') jobId: string,
    @Args('reason') reason: string,
  ): Promise<Job> {
    return this.jobService.rejectBoostPayment(adminId, jobId, reason);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => User)
  async adminRejectProfileBoostPayment(
    @AuthUser('_id') adminId: string,
    @Args('userId') userId: string,
    @Args('reason') reason: string,
  ): Promise<User> {
    return this.userService.rejectProfileBoostPayment(adminId, userId, reason);
  }

  // ─── Custom Notifications ─────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => Boolean)
  async adminSendNotificationToUser(
    @Args('userId') userId: string,
    @Args('title') title: string,
    @Args('description') description: string,
  ): Promise<boolean> {
    return this.adminService.sendNotificationToUser(userId, title, description);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Mutation(() => Boolean)
  async adminSendBroadcastNotification(
    @Args('title') title: string,
    @Args('description') description: string,
  ): Promise<boolean> {
    return this.adminService.sendBroadcastNotification(title, description);
  }

  // ─── Queries ──────────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => [User])
  async adminGetAllUsers(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
  ): Promise<User[]> {
    return this.adminService.getAllUsers(page, limit);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => [Job])
  async adminGetAllJobs(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
  ): Promise<Job[]> {
    return this.adminService.getAllJobs(page, limit);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => [Job])
  async adminGetModerationCancelledJobs(
    @Args('limit', { type: () => Int, defaultValue: 100 }) limit: number,
  ): Promise<Job[]> {
    return this.adminService.getModerationCancelledJobs(limit);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => [Post])
  async adminGetAllPosts(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
  ): Promise<Post[]> {
    return this.adminService.getAllPosts(page, limit);
  }

  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => DashboardStats)
  async adminGetDashboardStats(): Promise<DashboardStats> {
    return this.adminService.getDashboardStats();
  }

  // ─── Public: Get Active Announcements (visible to all logged-in users) ────────
  @UseGuards(OptionalAuthGuard)
  @Query(() => [Announcement])
  async getActiveAnnouncements(): Promise<Announcement[]> {
    return this.adminService.getActiveAnnouncements();
  }

  // ─── Public: Track visit event (no auth required) ────────────────────────────
  @Mutation(() => Boolean)
  async trackVisit(@Args('input') input: TrackVisitInput): Promise<boolean> {
    return this.adminService.trackVisit(input);
  }

  // ─── Admin: Daily visitor stats ──────────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => [DailyVisitorStat])
  async adminGetVisitorStats(
    @Args('days', { type: () => Int, defaultValue: 14 }) days: number,
  ): Promise<DailyVisitorStat[]> {
    return this.adminService.getDailyVisitorStats(days);
  }

  // ─── Public: Session tracking mutations ──────────────────────────────────────
  @Mutation(() => Boolean)
  async startVisitorSession(@Args('input') input: StartSessionInput): Promise<boolean> {
    return this.adminService.startSession(input);
  }

  @Mutation(() => Boolean)
  async trackPageView(@Args('input') input: TrackPageInput): Promise<boolean> {
    return this.adminService.trackPage(input);
  }

  @Mutation(() => Boolean)
  async pingVisitorSession(@Args('sessionId') sessionId: string): Promise<boolean> {
    return this.adminService.pingSession(sessionId);
  }

  @Mutation(() => Boolean)
  async endVisitorSession(@Args('input') input: EndSessionInput): Promise<boolean> {
    return this.adminService.endSession(input);
  }

  // ─── Admin: Sessions by date (defaults to today) ─────────────────────────────
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => [VisitorSessionObject])
  async adminGetTodaySessions(
    @Args('date', { type: () => String, nullable: true, defaultValue: null }) date?: string,
  ): Promise<VisitorSessionObject[]> {
    return this.adminService.getTodaySessions(date ?? undefined);
  }

  // ─── Admin: User details for a day + event ───────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @Query(() => [VisitorUserDetail])
  async adminGetDailyUserDetails(
    @Args('date') date: string,
    @Args('event') event: string,
  ): Promise<VisitorUserDetail[]> {
    return this.adminService.getDailyUserDetails(date, event);
  }
}
