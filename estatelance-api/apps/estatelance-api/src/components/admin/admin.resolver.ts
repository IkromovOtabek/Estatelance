import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
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
} from '../../libs/dto/admin.dto';

@Resolver()
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

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
