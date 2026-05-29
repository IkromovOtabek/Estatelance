import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../schemas/User.model';
import { ActiveUserGuard, AuthGuard, OptionalAuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import {
  SignupInput,
  LoginInput,
  TelegramLoginInput,
  UpdateProfileInput,
  GetFreelancersInput,
} from '../../libs/dto/user.dto';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  // ─── Sign Up ───────────────────────────────────────────────────────────────
  @Mutation(() => User)
  async signup(@Args('input') input: SignupInput): Promise<User> {
    return this.userService.signup(input);
  }

  // ─── Log In with username + password ──────────────────────────────────────
  @Mutation(() => User)
  async login(@Args('input') input: LoginInput): Promise<User> {
    return this.userService.login(input);
  }

  // ─── Log In with Telegram ─────────────────────────────────────────────────
  // The frontend sends the data from the Telegram Login Widget callback here.
  // The backend verifies it is genuine before creating a session.
  @Mutation(() => User)
  async loginWithTelegram(@Args('input') input: TelegramLoginInput): Promise<User> {
    return this.userService.loginWithTelegram(input);
  }

  // ─── Get My Own Profile ────────────────────────────────────────────────────
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
}
