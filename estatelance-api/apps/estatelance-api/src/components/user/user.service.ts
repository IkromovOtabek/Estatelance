import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/User.model';
import { Follow } from '../../schemas/Follow.model';
import { ProfileView } from '../../schemas/ProfileView.model';
import { Bid } from '../../schemas/Bid.model';
import { Job } from '../../schemas/Job.model';
import { AuthService, TelegramAuthData } from '../auth/auth.service';
import { SignupInput, LoginInput, TelegramLoginInput, UpdateProfileInput, GetFreelancersInput, FreelancerAnalytics } from '../../libs/dto/user.dto';
import {
  AuthProvider,
  BidStatus,
  BoostPaymentStatus,
  NotificationType,
  UserStatus,
  UserType,
} from '../../libs/enums/common.enums';
import { DEFAULT_AVATAR_URL } from '../../libs/config';
import { AdminLinkPaths } from '../../libs/constants/admin-link-paths';
import {
  compareBoostListing,
  isBoostActive as computeBoostActive,
} from '../../libs/utils/boost.util';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Follow') private readonly followModel: Model<Follow>,
    @InjectModel('ProfileView') private readonly profileViewModel: Model<ProfileView>,
    @InjectModel('Bid') private readonly bidModel: Model<Bid>,
    @InjectModel('Job') private readonly jobModel: Model<Job>,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Sign Up ───────────────────────────────────────────────────────────────
  async signup(input: SignupInput): Promise<User> {
    const exists = await this.userModel.findOne({ username: input.username.toLowerCase() });
    if (exists) {
      throw new BadRequestException('This username is already taken. Please choose another one.');
    }

    const hashedPassword = await this.authService.hashPassword(input.password);

    const newUser = await this.userModel.create({
      username:    input.username.toLowerCase(),
      password:    hashedPassword,
      userType:    input.userType,
      fullName:    input.fullName ?? input.username,
      location:    input.location ?? 'Toshkent, UZ',
      authProvider: AuthProvider.EMAIL,
      ...(input.profileImage?.trim() ? { profileImage:  input.profileImage.trim()  } : {}),
      ...(input.phoneNumber?.trim()  ? { phoneNumber:   input.phoneNumber.trim()   } : {}),
      ...(input.cardNumber?.trim()   ? { cardNumber:    input.cardNumber.trim()    } : {}),
      ...(input.bio?.trim()          ? { bio:           input.bio.trim()           } : {}),
      ...(input.skills?.length       ? { skills:        input.skills               } : {}),
      ...(input.resumeUrl?.trim()    ? { resumeUrl:     input.resumeUrl.trim()     } : {}),
      ...(input.address              ? { address:       input.address               } : {}),
      ...(input.companyImage?.trim() ? { companyImage:  input.companyImage.trim()   } : {}),
    });

    // Attach the JWT token to the response
    newUser.accessToken = await this.authService.createToken(newUser);
    return newUser;
  }

  // ─── Log In ────────────────────────────────────────────────────────────────
  async login(input: LoginInput): Promise<User> {
    const user = await this.userModel.findOne({ username: input.username.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException("Foydalanuvchi nomi noto'g'ri yozilgan.");
    }

    // NOTE: spammed users CAN log in — ActiveUserGuard blocks their mutations instead.
    if (!user.password) {
      throw new UnauthorizedException('This account uses Telegram login. Please use the Telegram button.');
    }

    const isCorrect = await this.authService.isPasswordCorrect(input.password, user.password);
    if (!isCorrect) {
      throw new UnauthorizedException("Parol noto'g'ri yozilgan.");
    }

    user.accessToken = await this.authService.createToken(user);
    return user;
  }

  // ─── Telegram Login ───────────────────────────────────────────────────────
  // 1. Verify the data from Telegram's login widget
  // 2. Find or create a user account linked to this Telegram account
  // 3. Return a JWT token
  async loginWithTelegram(input: TelegramLoginInput): Promise<User> {
    // Build the TelegramAuthData object — only include fields that have real values.
    // Telegram's hash is computed only from fields that exist, so including
    // undefined fields (like last_name when the user has none) breaks verification.
    const telegramData: TelegramAuthData = {
      id: input.id,
      first_name: input.first_name,
      auth_date: input.auth_date,
      hash: input.hash,
      ...(input.last_name && { last_name: input.last_name }),
      ...(input.username && { username: input.username }),
      ...(input.photo_url && { photo_url: input.photo_url }),
    };

    // This will throw if the data is fake or expired
    this.authService.verifyTelegramAuth(telegramData);

    // Try to find an existing account linked to this Telegram ID
    let user = await this.userModel.findOne({ telegramId: String(input.id) });

    if (!user) {
      // First time logging in with Telegram — create a new account
      // Generate a unique username from the Telegram username or name
      const baseUsername = input.username ?? `${input.first_name}${input.id}`.toLowerCase().replace(/\s+/g, '');
      const username = await this.getUniqueUsername(baseUsername);

      user = await this.userModel.create({
        username,
        userType: UserType.AGENT,
        fullName: `${input.first_name} ${input.last_name ?? ''}`.trim(),
        profileImage: input.photo_url ?? DEFAULT_AVATAR_URL,
        location: 'Toshkent, UZ',
        authProvider: AuthProvider.TELEGRAM,
        telegramId: String(input.id),
        telegramUsername: input.username,
        needsOnboarding: true,
      });
    }

    // NOTE: spammed users CAN log in — ActiveUserGuard blocks their mutations instead.
    user.accessToken = await this.authService.createToken(user);
    return user;
  }

  // ─── Telegram Bot Auth (polling token tizimi) ─────────────────────────────
  // Bot foydalanuvchi ma'lumotlarini tasdiqlagan vaqt chaqiriladi
  async loginWithTelegramBotUser(tgUser: {
    id: number; first_name: string; last_name?: string;
    username?: string; photo_url?: string;
  }): Promise<User> {
    let user = await this.userModel.findOne({ telegramId: String(tgUser.id) });

    if (!user) {
      const baseUsername = tgUser.username
        ?? `${tgUser.first_name}${tgUser.id}`.toLowerCase().replace(/\s+/g, '');
      const username = await this.getUniqueUsername(baseUsername);

      user = await this.userModel.create({
        username,
        userType:         UserType.AGENT,
        fullName:         `${tgUser.first_name} ${tgUser.last_name ?? ''}`.trim(),
        profileImage:     tgUser.photo_url ?? DEFAULT_AVATAR_URL,
        location:         'Toshkent, UZ',
        authProvider:     AuthProvider.TELEGRAM,
        telegramId:       String(tgUser.id),
        telegramUsername: tgUser.username,
        needsOnboarding:  true,
      });
    }

    user.accessToken = await this.authService.createToken(user);
    return user;
  }

  // ─── Get Current User ─────────────────────────────────────────────────────
  async checkUsername(username: string): Promise<boolean> {
    const exists = await this.userModel.findOne({ username: username.toLowerCase().trim() });
    return !exists; // true = available, false = taken
  }

  async getMyProfile(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ─── Get Any User by ID ───────────────────────────────────────────────────
  // viewerId is the logged-in user who is viewing this profile.
  // Each (viewerId, profileId) pair is tracked in ProfileView with a unique index.
  // Only the FIRST view from a given user increments the counter.
  async getUserById(userId: string, viewerId?: string | null): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Only count unique views from logged-in users viewing someone else's profile
    if (viewerId && String(viewerId) !== String(userId)) {
      try {
        await this.profileViewModel.create({ viewerId, profileId: userId });
        // create() succeeded → first time this viewer sees this profile → +1
        const updated = await this.userModel.findByIdAndUpdate(
          userId,
          { $inc: { profileViewCount: 1 } },
          { new: true },
        );
        if (updated) return updated;
      } catch (err: any) {
        // Duplicate key error (code 11000) = already viewed → skip increment
        if (err?.code !== 11000) throw err;
      }
    }

    return user;
  }

  // ─── Update Profile ───────────────────────────────────────────────────────
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
    const updateData: any = { ...input };
    if (input.userType) updateData.needsOnboarding = false;
    const updated = await this.userModel.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
    if (!updated) throw new NotFoundException('User not found');
    if (input.userType) {
      updated.accessToken = await this.authService.createToken(updated);
    }
    return updated;
  }

  // ─── Get Freelancers List ────────────────────────────────────────────────
  async getFreelancers(input: GetFreelancersInput): Promise<User[]> {
    const filter: any = { userType: UserType.FREELANCER, userStatus: UserStatus.ACTIVE };

    if (input.category) filter.freelancerCategory = input.category;
    if (input.availability) filter.availability = input.availability;
    if (input.location) filter.location = { $regex: input.location, $options: 'i' };
    if (input.minRating) filter.averageRating = { $gte: input.minRating };

    if (input.hourlyRateMin !== undefined || input.hourlyRateMax !== undefined) {
      filter.hourlyRate = {};
      if (input.hourlyRateMin !== undefined) filter.hourlyRate.$gte = input.hourlyRateMin;
      if (input.hourlyRateMax !== undefined) filter.hourlyRate.$lte = input.hourlyRateMax;
    }

    if (input.searchText) {
      filter.$or = [
        { username: { $regex: input.searchText, $options: 'i' } },
        { fullName: { $regex: input.searchText, $options: 'i' } },
        { bio: { $regex: input.searchText, $options: 'i' } },
        { skills: { $in: [new RegExp(input.searchText, 'i')] } },
      ];
    }

    const skip = (input.page - 1) * input.limit;
    const users = await this.userModel
      .find(filter)
      .sort({ bumpedAt: -1, averageRating: -1 })
      .skip(skip)
      .limit(input.limit)
      .exec();

    return [...users].sort((a, b) => {
      const boostCmp = compareBoostListing(a, b);
      if (boostCmp !== 0) return boostCmp;
      return (b.averageRating ?? 0) - (a.averageRating ?? 0);
    });
  }

  // ─── Check if current user follows target ─────────────────────────────────
  async checkIsFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    const existing = await this.followModel.findOne({
      followerId: currentUserId,
      followedId: targetUserId,
    });
    return !!existing;
  }

  // ─── Follow / Unfollow Toggle ─────────────────────────────────────────────
  async toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself.');
    }

    const existingFollow = await this.followModel.findOne({
      followerId: currentUserId,
      followedId: targetUserId,
    });

    if (existingFollow) {
      // Already following — unfollow
      await this.followModel.deleteOne({ _id: existingFollow._id });
      await this.userModel.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } });
      await this.userModel.findByIdAndUpdate(targetUserId, { $inc: { followerCount: -1 } });
      return false; // Now unfollowed
    } else {
      // Not following — follow
      await this.followModel.create({ followerId: currentUserId, followedId: targetUserId });
      await this.userModel.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } });
      await this.userModel.findByIdAndUpdate(targetUserId, { $inc: { followerCount: 1 } });

      const follower = await this.userModel.findById(currentUserId).select('fullName username');
      const followerName = follower?.fullName ?? follower?.username ?? 'Kimdir';
      await this.notificationService.createNotification(
        targetUserId,
        NotificationType.FOLLOW,
        'Yangi obunachiingiz bor',
        `${followerName} sizga obuna bo'ldi`,
        currentUserId,
      );

      return true; // Now following
    }
  }

  // ─── Google OAuth — Find or Create User ───────────────────────────────────
  async findOrCreateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    profileImage: string;
  }): Promise<User> {
    // Check if user already exists by googleId
    let user = await this.userModel.findOne({ googleId: googleUser.googleId });

    if (!user) {
      // Check by email (user may have signed up with email before)
      user = await this.userModel.findOne({ email: googleUser.email });

      if (user) {
        // Link Google to existing account
        user.googleId = googleUser.googleId;
        if (!user.profileImage && googleUser.profileImage) {
          user.profileImage = googleUser.profileImage;
        }
        await user.save();
      } else {
        // Create brand new Google user
        const fullName = googleUser.displayName ||
          `${googleUser.firstName} ${googleUser.lastName}`.trim();
        const baseUsername = googleUser.email.split('@')[0];
        const username = await this.getUniqueUsername(baseUsername);

        user = await this.userModel.create({
          googleId:     googleUser.googleId,
          email:        googleUser.email,
          username,
          fullName,
          profileImage: googleUser.profileImage ?? '',
          userType:     UserType.AGENT,
          userStatus:   UserStatus.ACTIVE,
          authProvider: AuthProvider.GOOGLE,
          needsOnboarding: true,
          location: 'Toshkent, UZ',
        });
      }
    }

    user.accessToken = await this.authService.createToken(user);
    return user;
  }

  // ─── Freelancer Analytics ─────────────────────────────────────────────────
  async getFreelancerAnalytics(userId: string): Promise<FreelancerAnalytics> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const [totalBids, acceptedBids, profileViews, completedJobs] = await Promise.all([
      this.bidModel.countDocuments({ freelancerId: userId }),
      this.bidModel.countDocuments({ freelancerId: userId, status: BidStatus.ACCEPTED }),
      this.profileViewModel.countDocuments({ profileId: userId }),
      this.jobModel.find({ hiredFreelancerId: userId, status: 'COMPLETED' }).select('agentRating escrowAmount'),
    ]);

    const totalEarned = completedJobs.reduce((sum, j) => sum + (j.escrowAmount ?? 0), 0);

    return {
      totalBids,
      acceptedBids,
      completedJobs: user.completedJobCount ?? 0,
      totalEarned,
      averageRating: user.averageRating ?? 5.0,
      profileViews,
      followerCount: user.followerCount ?? 0,
    };
  }

  // ─── Profil boost (frilanser va agent) ────────────────────────────────────

  isProfileBoostActive(user: Pick<User, 'boostExpiresAt' | 'boostPausedByAdmin'>): boolean {
    return computeBoostActive(user);
  }

  private applyProfileBoostPlan(user: User, plan: string): void {
    const validPlans = ['BASIC', 'PRO', 'VIP'];
    const boostPlan = validPlans.includes(plan) ? plan : 'BASIC';
    const PLAN_DAYS: Record<string, number> = { BASIC: 3, PRO: 7, VIP: 30 };
    const days = PLAN_DAYS[boostPlan] ?? 3;
    const now = new Date();
    user.bumpedAt = now;
    user.boostExpiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    user.boostPlan = boostPlan;
    user.boostPaidAt = now;
    user.boostViewsAtStart = user.profileViewCount ?? 0;
    user.boostFollowersAtStart = user.followerCount ?? 0;
    user.boostPausedByAdmin = false;
  }

  async submitProfileBoostPayment(
    userId: string,
    plan: string,
    receiptUrl: string,
  ): Promise<User> {
    const trimmedReceipt = receiptUrl?.trim();
    if (!trimmedReceipt) {
      throw new BadRequestException('To\'lov cheki rasmi majburiy');
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.userType !== UserType.FREELANCER && user.userType !== UserType.AGENT) {
      throw new BadRequestException('Faqat frilanser yoki agent profilini boost qila oladi');
    }
    if (user.userStatus !== UserStatus.ACTIVE) {
      throw new BadRequestException('Faol profil boost qilish uchun hisob faol bo\'lishi kerak');
    }
    if (user.boostPaymentStatus === BoostPaymentStatus.PENDING) {
      throw new BadRequestException('To\'lov cheki allaqachon yuborilgan — admin tasdiqlashini kuting');
    }
    if (this.isProfileBoostActive(user)) {
      throw new BadRequestException('Boost allaqachon faol — muddati tugagach qayta yuborishingiz mumkin');
    }

    const validPlans = ['BASIC', 'PRO', 'VIP'];
    const boostPlan = validPlans.includes(plan) ? plan : 'BASIC';
    const now = new Date();

    user.boostPaymentStatus = BoostPaymentStatus.PENDING;
    user.boostRequestedPlan = boostPlan;
    user.boostReceiptUrl = trimmedReceipt;
    user.boostPaymentSubmittedAt = now;
    user.boostPaymentReviewedAt = null;
    user.boostPaymentRejectReason = null;
    await user.save();

    const label = user.fullName ?? user.username ?? 'Foydalanuvchi';
    const role =
      user.userType === UserType.FREELANCER ? 'Frilanser' : 'Agent';
    await this.notificationService.notifyAllAdmins(
      'Profil boost cheki',
      `${label} (${role}) ${boostPlan} profil boost chekini yubordi.`,
      String(user._id),
      AdminLinkPaths.payments({ userId: String(user._id) }),
    );

    return user;
  }

  async getPendingProfileBoostPayments(): Promise<
    { profile: User; agentName: string; agentUsername?: string }[]
  > {
    const users = await this.userModel
      .find({ boostPaymentStatus: BoostPaymentStatus.PENDING })
      .sort({ boostPaymentSubmittedAt: -1 })
      .exec();

    return users.map((profile) => ({
      profile,
      agentName: profile.fullName ?? profile.username ?? 'Foydalanuvchi',
      agentUsername: profile.username,
    }));
  }

  async getProfileBoostPaymentHistory(limit: number = 50): Promise<
    { profile: User; agentName: string; agentUsername?: string }[]
  > {
    const users = await this.userModel
      .find({
        boostPaymentStatus: {
          $in: [BoostPaymentStatus.APPROVED, BoostPaymentStatus.REJECTED],
        },
      })
      .sort({ boostPaymentReviewedAt: -1, updatedAt: -1 })
      .limit(limit)
      .exec();

    return users.map((profile) => ({
      profile,
      agentName: profile.fullName ?? profile.username ?? 'Foydalanuvchi',
      agentUsername: profile.username,
    }));
  }

  async approveProfileBoostPayment(adminId: string, userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.boostPaymentStatus !== BoostPaymentStatus.PENDING) {
      throw new BadRequestException('Kutilayotgan profil boost to\'lovi yo\'q');
    }

    const plan = user.boostRequestedPlan ?? 'BASIC';
    this.applyProfileBoostPlan(user, plan);
    user.boostPaymentStatus = BoostPaymentStatus.APPROVED;
    user.boostPaymentReviewedAt = new Date();
    user.boostPaymentRejectReason = null;
    user.markModified('bumpedAt');
    user.markModified('boostExpiresAt');
    await user.save();

    const browseHint =
      user.userType === UserType.FREELANCER
        ? 'Frilanserlar ro\'yxatida tepada ko\'rinasiz.'
        : 'Profilingiz ajratilgan ko\'rinishda bo\'ladi.';

    await this.notificationService.createNotification(
      String(user._id),
      NotificationType.SYSTEM,
      'Profil boost tasdiqlandi',
      `${user.boostPlan} profil boost yoqildi. ${browseHint}`,
      `/profile/${user._id}`,
    );

    return user;
  }

  async rejectProfileBoostPayment(
    adminId: string,
    userId: string,
    reason: string,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.boostPaymentStatus !== BoostPaymentStatus.PENDING) {
      throw new BadRequestException('Kutilayotgan profil boost to\'lovi yo\'q');
    }

    const trimmed = reason?.trim() || 'To\'lov cheki tasdiqlanmadi';
    user.boostPaymentStatus = BoostPaymentStatus.REJECTED;
    user.boostPaymentReviewedAt = new Date();
    user.boostPaymentRejectReason = trimmed;
    await user.save();

    await this.notificationService.createNotification(
      String(user._id),
      NotificationType.SYSTEM,
      'Profil boost rad etildi',
      `${trimmed}. Yangi chek yuklashingiz mumkin.`,
      `/profile/${user._id}`,
    );

    return user;
  }

  async adminCancelProfileBoost(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const hadBoost =
      !!user.boostExpiresAt ||
      !!user.boostPaidAt ||
      (user.boostPaymentStatus != null &&
        user.boostPaymentStatus !== BoostPaymentStatus.NONE);

    if (!hadBoost) {
      throw new BadRequestException('Bu profilda boost yo\'q');
    }

    user.bumpedAt = null;
    user.boostExpiresAt = null;
    user.boostPlan = null;
    user.boostPaidAt = null;
    user.boostPaymentStatus = BoostPaymentStatus.NONE;
    user.boostRequestedPlan = null;
    user.boostReceiptUrl = null;
    user.boostPaymentSubmittedAt = null;
    user.boostPaymentReviewedAt = null;
    user.boostPaymentRejectReason = null;
    user.boostViewsAtStart = null;
    user.boostFollowersAtStart = null;
    user.boostPausedByAdmin = false;
    await user.save();

    await this.notificationService.createNotification(
      String(user._id),
      NotificationType.SYSTEM,
      'Profil boost bekor qilindi',
      'Profilingiz boosti admin tomonidan o\'chirildi.',
      `/profile/${user._id}`,
    );

    return user;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────
  private async getUniqueUsername(base: string): Promise<string> {
    let username = base.toLowerCase().replace(/[^a-z0-9_]/g, '');
    let count = 0;

    while (await this.userModel.exists({ username })) {
      count++;
      username = `${base}${count}`;
    }

    return username;
  }
}
