import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from '../../schemas/Notification.model';
import { ActiveUserGuard, AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth-user.decorator';

@Resolver()
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(AuthGuard)
  @Query(() => [Notification])
  async getMyNotifications(@AuthUser('_id') userId: string): Promise<Notification[]> {
    return this.notificationService.getMyNotifications(userId);
  }

  @UseGuards(ActiveUserGuard)
  @Mutation(() => Boolean)
  async markAllNotificationsRead(@AuthUser('_id') userId: string): Promise<boolean> {
    return this.notificationService.markAllAsRead(userId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Boolean)
  async markNotificationRead(
    @AuthUser('_id') userId: string,
    @Args('notificationId') notificationId: string,
  ): Promise<boolean> {
    return this.notificationService.markAsRead(userId, notificationId);
  }

  @UseGuards(AuthGuard)
  @Query(() => Int)
  async getUnreadNotificationCount(@AuthUser('_id') userId: string): Promise<number> {
    return this.notificationService.getUnreadCount(userId);
  }
}
