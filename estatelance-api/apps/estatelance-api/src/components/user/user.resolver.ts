import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './user.service';
import { User } from '../../schemas/User.model';
import { ActiveUserGuard, AuthGuard, OptionalAuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';
import {
  SignupInput,
  LoginInput,
  TelegramLoginInput,
  UpdateProfileInput,
  GetFreelancersInput,
  FreelancerAnalytics,
} from '../../libs/dto/user.dto';

@Resolver()
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly botService: TelegramBotService,
  ) {}

  // ─── Sign Up ───────────────────────────────────────────────────────────────
  // Brute-force / spam himoyasi: daqiqasiga 10 ta
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Mutation(() => User)
  async signup(@Args('input') input: SignupInput): Promise<User> {
    return this.userService.signup(input);
  }

  // ─── Log In with username + password ──────────────────────────────────────
  // Brute-force himoyasi: daqiqasiga 5 ta urinish
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Mutation(() => User)
  async login(@Args('input') input: LoginInput): Promise<User> {
    return this.userService.login(input);
  }

  // ─── Log In with Telegram (widget) ───────────────────────────────────────
  @Mutation(() => User)
  async loginWithTelegram(@Args('input') input: TelegramLoginInput): Promise<User> {
    return this.userService.loginWithTelegram(input);
  }

  // ─── Google Auth — 1-qadam: token yaratish ───────────────────────────────
  @Mutation(() => String)
  createGoogleAuthToken(): string {
    return this.botService.createGoogleAuthToken();
  }

  // ─── Google Auth — 2-qadam: polling ──────────────────────────────────────
  @Query(() => User, { nullable: true })
  async checkGoogleAuthToken(@Args('token') token: string): Promise<User | null> {
    const googleUser = this.botService.consumeGoogleToken(token);
    if (!googleUser) return null;
    return this.userService.findOrCreateGoogleUser(googleUser);
  }

  // ─── Telegram Bot Auth — 1-qadam: token yaratish ─────────────────────────
  // App shu tokenni botga /start tgauth_TOKEN ko'rinishida yuboradi
  @Mutation(() => String)
  createTelegramAuthToken(): string {
    return this.botService.createAuthToken();
  }

  // ─── Telegram Bot Auth — 2-qadam: token natijasini tekshirish (polling) ──
  // Bot /start tgauth_TOKEN olgandan keyin token tasdiqlanadi
  // App har 2 soniyada so'raydi — tayyor bo'lsa User qaytaradi
  @Query(() => User, { nullable: true })
  async checkTelegramAuthToken(@Args('token') token: string): Promise<User | null> {
    const tgUser = this.botService.consumeToken(token);
    if (!tgUser) return null;
    return this.userService.loginWithTelegramBotUser(tgUser);
  }

  // ─── Get My Own Profile ────────────────────────────────────────────────────
  @Query(() => Boolean)
  async checkUsername(@Args('username') username: string): Promise<boolean> {
    return this.userService.checkUsername(username);
  }

  @UseGuards(AuthGuard)
  @Query(() => User)
  async getMyProfile(@AuthUser('_id') userId: string): Promise<User> {
    return this.userService.getMyProfile(userId);
  }

  // ─── Get Any User Profile ─────────────────────────────────────────────────
  // Uses OptionalAuthGuard — logged-in users get view tracked uniquely,
  // anonymous visitors don't increment the counter.
  @UseGuards(OptionalAuthGuard)
  @Query(() => User)
  async getUserById(
    @Args('userId') userId: string,
    @Context() context: any,
  ): Promise<User> {
    const viewer = context?.req?.user ?? null;
    const viewerId: string | null = viewer?._id ?? null;
    const isAdmin = viewer?.userType === 'ADMIN';
    const user = await this.userService.getUserById(userId, viewerId);

    // Mask phone: show only last 4 digits unless viewer is admin or own profile
    if (user.phoneNumber && !isAdmin && viewerId !== userId) {
      user.phoneNumber = `***-***-${user.phoneNumber.slice(-4)}`;
    }
    return user;
  }

  // ─── Update My Profile ────────────────────────────────────────────────────
  @UseGuards(ActiveUserGuard)
  @Mutation(() => User)
  async updateProfile(
    @AuthUser('_id') userId: string,
    @Args('input') input: UpdateProfileInput,
  ): Promise<User> {
    return this.userService.updateProfile(userId, input);
  }

  // ─── Browse Freelancers ───────────────────────────────────────────────────
  @UseGuards(OptionalAuthGuard)
  @Query(() => [User])
  async getFreelancers(@Args('input') input: GetFreelancersInput): Promise<User[]> {
    return this.userService.getFreelancers(input);
  }

  // ─── Check if current user follows target ────────────────────────────────
  @UseGuards(AuthGuard)
  @Query(() => Boolean)
  async checkIsFollowing(
    @AuthUser('_id') currentUserId: string,
    @Args('targetUserId') targetUserId: string,
  ): Promise<boolean> {
    return this.userService.checkIsFollowing(currentUserId, targetUserId);
  }

  // ─── Follow / Unfollow ────────────────────────────────────────────────────
  @UseGuards(ActiveUserGuard)
  @Mutation(() => Boolean)
  async toggleFollow(
    @AuthUser('_id') currentUserId: string,
    @Args('targetUserId') targetUserId: string,
  ): Promise<boolean> {
    return this.userService.toggleFollow(currentUserId, targetUserId);
  }

  // ─── Freelancer Analytics ─────────────────────────────────────────────────
  @UseGuards(AuthGuard)
  @Query(() => FreelancerAnalytics)
  async getMyAnalytics(@AuthUser('_id') userId: string): Promise<FreelancerAnalytics> {
    return this.userService.getFreelancerAnalytics(userId);
  }

  // ─── Delete own account ───────────────────────────────────────────────────
  @UseGuards(AuthGuard)
  @Mutation(() => Boolean)
  async deleteMyAccount(@AuthUser('_id') userId: string): Promise<boolean> {
    return this.userService.deleteMyAccount(userId);
  }

  // ─── Profil boost (frilanser va agent) ──────────────────────────────────────
  @UseGuards(ActiveUserGuard)
  @Mutation(() => User)
  async submitProfileBoostPayment(
    @AuthUser('_id') userId: string,
    @Args('plan') plan: string,
    @Args('receiptUrl') receiptUrl: string,
  ): Promise<User> {
    return this.userService.submitProfileBoostPayment(userId, plan, receiptUrl);
  }
}
