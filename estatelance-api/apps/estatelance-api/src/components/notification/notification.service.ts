import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../../schemas/Notification.model';
import { NotificationType } from '../../libs/enums/common.enums';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel('Notification') private readonly notificationModel: Model<Notification>,
  ) {}

  // Send a notification to a user (called internally by other services)
  async createNotification(
    recipientId: string,
    notificationType: NotificationType,
    title: string,
    description: string,
    relatedItemId?: string,
  ): Promise<Notification> {
    return this.notificationModel.create({
      recipientId,
      notificationType,
      title,
      description,
      relatedItemId,
    });
  }

  // Get all notifications for the current user
  async getMyNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  // Mark all of the user's notifications as read
  async markAllAsRead(userId: string): Promise<boolean> {
    await this.notificationModel.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
    return true;
  }

  // Count how many unread notifications the user has
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ recipientId: userId, isRead: false });
  }
}
