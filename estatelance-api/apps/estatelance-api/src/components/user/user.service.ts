import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { User } from '../../schemas/User.model';
import { Follow } from '../../schemas/Follow.model';
import { ProfileView } from '../../schemas/ProfileView.model';
import { AuthService, TelegramAuthData } from '../auth/auth.service';
import { SignupInput, LoginInput, TelegramLoginInput, UpdateProfileInput, GetFreelancersInput } from '../../libs/dto/user.dto';
import { AuthProvider, NotificationType, UserStatus, UserType } from '../../libs/enums/common.enums';
import { DEFAULT_AVATAR_URL } from '../../libs/config';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Follow') private readonly followModel: Model<Follow>,
    @InjectModel('ProfileView') private readonly profileViewModel: Model<ProfileView>,
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
      username: input.username.toLowerCase(),
      password: hashedPassword,
      userType: input.userType,
      fullName: input.fullName ?? input.username,
      location: input.location ?? 'Toshkent, UZ',
      ...(input.profileImage?.trim() ? { profileImage: input.profileImage.trim() } : {}),
      authProvider: AuthProvider.EMAIL,
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

  // ─── Get Current User ─────────────────────────────────────────────────────
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

    if (input.category) {
      filter.freelancerCategory = input.category;
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
    return this.userModel.find(filter).sort({ averageRating: -1 }).skip(skip).limit(input.limit);
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
