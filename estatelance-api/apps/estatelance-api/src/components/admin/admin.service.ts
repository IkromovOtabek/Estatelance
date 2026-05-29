import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/User.model';
import { Job } from '../../schemas/Job.model';
import { Post } from '../../schemas/Post.model';
import { Announcement } from '../../schemas/Announcement.model';
import { Notification } from '../../schemas/Notification.model';
import { SiteVisit } from '../../schemas/SiteVisit.model';
import { AuthService } from '../auth/auth.service';
import {
  AdminLoginInput,
  ChangeUserStatusInput,
  ChangeUserRoleInput,
  CreateAnnouncementInput,
  DashboardStats,
  DailyVisitorStat,
  TrackVisitInput,
} from '../../libs/dto/admin.dto';
import { NotificationType, UserStatus, UserType } from '../../libs/enums/common.enums';
import { DEFAULT_AVATAR_URL } from '../../libs/config';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Job') private readonly jobModel: Model<Job>,
    @InjectModel('Post') private readonly postModel: Model<Post>,
    @InjectModel('Announcement') private readonly announcementModel: Model<Announcement>,
    @InjectModel('Notification') private readonly notificationModel: Model<Notification>,
    @InjectModel('SiteVisit') private readonly siteVisitModel: Model<SiteVisit>,
    private readonly authService: AuthService,
  ) {}

  // ─── Admin Login (username + password) ───────────────────────────────────────
  // This is separate from the regular login — it only allows ADMIN accounts in.
  // Admins can be created via the seedAdminAccount mutation below.
  async adminLogin(input: AdminLoginInput): Promise<User> {
    const user = await this.userModel.findOne({ username: input.username.toLowerCase() });

    if (!user) {
      throw new UnauthorizedException('Username or password is incorrect.');
    }

    if (user.userType !== UserType.ADMIN) {
      throw new UnauthorizedException('Access denied. Admin accounts only.');
    }

    if (!user.password) {
      throw new UnauthorizedException('This account does not have a password set.');
    }

    const isCorrect = await this.authService.isPasswordCorrect(input.password, user.password);
    if (!isCorrect) {
      throw new UnauthorizedException('Username or password is incorrect.');
    }

    user.accessToken = await this.authService.createToken(user);
    return user;
  }

  // ─── Seed Admin Account ──────────────────────────────────────────────────────
  // Call this once to create the first admin account.
  // It will throw if an admin already exists, preventing duplicate admins.
  async seedAdminAccount(username: string, password: string): Promise<User> {
    const existingAdmin = await this.userModel.findOne({ userType: UserType.ADMIN });
    if (existingAdmin) {
      throw new BadRequestException('An admin account already exists. Seed is disabled.');
    }

    const hashedPassword = await this.authService.hashPassword(password);

    const admin = await this.userModel.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      userType: UserType.ADMIN,
      userStatus: UserStatus.ACTIVE,
      fullName: 'EstateLance Admin',
      location: 'Toshkent, UZ',
      profileImage: DEFAULT_AVATAR_URL,
    });

    admin.accessToken = await this.authService.createToken(admin);
    return admin;
  }

  // ─── Block / Spam / Unblock a User ───────────────────────────────────────────
  // When the admin sets a user to SPAM, a notification is sent to that user
  // explaining why their account was restricted.
  async changeUserStatus(input: ChangeUserStatusInput): Promise<User> {
    const user = await this.userModel.findById(input.userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.userType === UserType.ADMIN) {
      throw new BadRequestException('Admin accounts cannot be blocked.');
    }

    const previousStatus = user.userStatus;
    user.userStatus = input.newStatus;

    if (input.newStatus === UserStatus.SPAM) {
      user.spamReason = input.spamReason ?? 'Your account was flagged by the platform administrator.';
    } else {
      user.spamReason = '';
    }

    await user.save();

    // Send a notification to the affected user when they are spammed
    if (input.newStatus === UserStatus.SPAM && previousStatus !== UserStatus.SPAM) {
      const reason = user.spamReason;
      await this.notificationModel.create({
        recipientId: user._id.toString(),
        notificationType: NotificationType.SYSTEM,
        title: 'Your account has been restricted',
        description: `Reason: ${reason}. If you believe this is a mistake, please contact support.`,
      });
    }

    // Send a notification when the user is restored (un-spammed)
    if (input.newStatus === UserStatus.ACTIVE && previousStatus === UserStatus.SPAM) {
      await this.notificationModel.create({
        recipientId: user._id.toString(),
        notificationType: NotificationType.SYSTEM,
        title: 'Your account has been restored',
        description: 'Your account is active again. Welcome back to EstateLance!',
      });
    }

    return user;
  }

  // ─── Change a User's Role ─────────────────────────────────────────────────────
  async changeUserRole(input: ChangeUserRoleInput): Promise<User> {
    const user = await this.userModel.findById(input.userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.userType === UserType.ADMIN) {
      throw new BadRequestException('Admin role cannot be changed.');
    }

    user.userType = input.newRole;
    await user.save();

    // Notify the user that their role has changed
    await this.notificationModel.create({
      recipientId: user._id.toString(),
      notificationType: NotificationType.SYSTEM,
      title: 'Your account role has changed',
      description: `Your role has been updated to: ${input.newRole}. You may now access different features.`,
    });

    return user;
  }

  // ─── Delete a User (soft delete) ─────────────────────────────────────────────
  async deleteUser(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.userType === UserType.ADMIN) {
      throw new BadRequestException('Admin accounts cannot be deleted.');
    }

    await this.userModel.findByIdAndDelete(userId);
    return true;
  }

  // ─── Delete a Job Posting ─────────────────────────────────────────────────────
  async deleteJob(jobId: string): Promise<boolean> {
    const job = await this.jobModel.findById(jobId);
    if (!job) throw new NotFoundException('Job not found');
    await job.deleteOne();
    return true;
  }

  // ─── Delete a Post / Article ──────────────────────────────────────────────────
  async deletePost(postId: string): Promise<boolean> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    await post.deleteOne();
    return true;
  }

  // ─── Create an Announcement ───────────────────────────────────────────────────
  // Announcements are site-wide messages shown to all users on the platform.
  async createAnnouncement(adminId: string, input: CreateAnnouncementInput): Promise<Announcement> {
    const announcement = await this.announcementModel.create({
      ...input,
      authorId: adminId,
      isActive: true,
    });

    // Notify ALL active users about the new announcement
    const activeUsers = await this.userModel.find(
      { userStatus: UserStatus.ACTIVE, userType: { $ne: UserType.ADMIN } },
      { _id: 1 },
    ).lean();

    const notifications = activeUsers.map((u) => ({
      recipientId: u._id.toString(),
      notificationType: NotificationType.SYSTEM,
      title: `📢 ${input.title}`,
      description: input.body.slice(0, 200) + (input.body.length > 200 ? '...' : ''),
      relatedItemId: announcement._id.toString(),
    }));

    if (notifications.length > 0) {
      await this.notificationModel.insertMany(notifications);
    }

    return announcement;
  }

  // ─── Toggle Announcement Active/Inactive ──────────────────────────────────────
  async toggleAnnouncement(announcementId: string): Promise<Announcement> {
    const announcement = await this.announcementModel.findById(announcementId);
    if (!announcement) throw new NotFoundException('Announcement not found');

    announcement.isActive = !announcement.isActive;
    return announcement.save();
  }

  // ─── Delete an Announcement ───────────────────────────────────────────────────
  async deleteAnnouncement(announcementId: string): Promise<boolean> {
    const announcement = await this.announcementModel.findById(announcementId);
    if (!announcement) throw new NotFoundException('Announcement not found');
    await announcement.deleteOne();
    return true;
  }

  // ─── Get All Announcements (admin view) ───────────────────────────────────────
  async getAllAnnouncements(): Promise<Announcement[]> {
    return this.announcementModel.find().sort({ createdAt: -1 }).limit(100);
  }

  // ─── Get Active Announcements (public) ───────────────────────────────────────
  async getActiveAnnouncements(): Promise<Announcement[]> {
    return this.announcementModel.find({ isActive: true }).sort({ createdAt: -1 }).limit(20);
  }

  // ─── Get All Users (paginated) ────────────────────────────────────────────────
  async getAllUsers(page: number = 1, limit: number = 20): Promise<User[]> {
    const skip = (page - 1) * limit;
    return this.userModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
  }

  // ─── Get All Jobs (admin view) ────────────────────────────────────────────────
  async getAllJobs(page: number = 1, limit: number = 20): Promise<Job[]> {
    const skip = (page - 1) * limit;
    return this.jobModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
  }

  // ─── Get All Posts (admin view) ───────────────────────────────────────────────
  async getAllPosts(page: number = 1, limit: number = 20): Promise<Post[]> {
    const skip = (page - 1) * limit;
    return this.postModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
  }

  // ─── Dashboard Statistics ─────────────────────────────────────────────────────
  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalUsers,
      totalAgents,
      totalFreelancers,
      totalJobs,
      activeJobs,
      totalPosts,
      totalAnnouncements,
      spammedUsers,
      budgetResult,
    ] = await Promise.all([
      this.userModel.countDocuments({ userStatus: { $ne: UserStatus.DELETED } }),
      this.userModel.countDocuments({ userType: UserType.AGENT }),
      this.userModel.countDocuments({ userType: UserType.FREELANCER }),
      this.jobModel.countDocuments(),
      this.jobModel.countDocuments({ status: 'OPEN' }),
      this.postModel.countDocuments(),
      this.announcementModel.countDocuments({ isActive: true }),
      this.userModel.countDocuments({ userStatus: UserStatus.SPAM }),
      this.jobModel.aggregate([{ $group: { _id: null, total: { $sum: '$budget' } } }]),
    ]);

    const totalBudgetPosted = budgetResult[0]?.total ?? 0;

    return {
      totalUsers,
      totalAgents,
      totalFreelancers,
      totalJobs,
      activeJobs,
      totalPosts,
      totalAnnouncements,
      spammedUsers,
      totalBudgetPosted,
    };
  }

  // ─── Send Custom Notification to a Specific User ─────────────────────────────
  async sendNotificationToUser(
    userId: string,
    title: string,
    description: string,
  ): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.notificationModel.create({
      recipientId: userId,
      notificationType: NotificationType.SYSTEM,
      title,
      description,
    });

    return true;
  }

  // ─── Send Broadcast Notification to All Users ─────────────────────────────────
  // ─── Track Site Visit ─────────────────────────────────────────────────────────
  async trackVisit(input: TrackVisitInput): Promise<boolean> {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    await this.siteVisitModel.create({
      visitorId: input.visitorId,
      event: input.event,
      date: today,
    });
    return true;
  }

  // ─── Get Daily Visitor Stats (last N days) ────────────────────────────────────
  async getDailyVisitorStats(days = 14): Promise<DailyVisitorStat[]> {
    const result: DailyVisitorStat[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const [allVisits, registrations, logins] = await Promise.all([
        this.siteVisitModel.find({ date: dateStr, event: 'visit' }).lean(),
        this.siteVisitModel.countDocuments({ date: dateStr, event: 'register' }),
        this.siteVisitModel.countDocuments({ date: dateStr, event: 'login' }),
      ]);

      const uniqueVisitors = new Set(allVisits.map((v) => v.visitorId)).size;

      result.push({
        date: dateStr,
        visits: allVisits.length,
        uniqueVisitors,
        registrations,
        logins,
      });
    }

    return result;
  }

  async sendBroadcastNotification(title: string, description: string): Promise<boolean> {
    const activeUsers = await this.userModel.find(
      { userStatus: UserStatus.ACTIVE, userType: { $ne: UserType.ADMIN } },
      { _id: 1 },
    ).lean();

    const notifications = activeUsers.map((u) => ({
      recipientId: u._id.toString(),
      notificationType: NotificationType.SYSTEM,
      title,
      description,
    }));

    if (notifications.length > 0) {
      await this.notificationModel.insertMany(notifications);
    }

    return true;
  }
}
