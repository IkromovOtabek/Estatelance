import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../../schemas/Notification.model';
import { User } from '../../schemas/User.model';
import { NotificationType, UserStatus, UserType } from '../../libs/enums/common.enums';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel('Notification') private readonly notificationModel: Model<Notification>,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  async createNotification(
    recipientId: string,
    notificationType: NotificationType,
    title: string,
    description: string,
    relatedItemId?: string,
    linkPath?: string,
  ): Promise<Notification> {
    return this.notificationModel.create({
      recipientId,
      notificationType,
      title,
      description,
      relatedItemId,
      linkPath,
    });
  }

  async notifyAllAdmins(
    title: string,
    description: string,
    relatedItemId?: string,
    linkPath?: string,
  ): Promise<void> {
    const admins = await this.userModel
      .find({ userType: UserType.ADMIN, userStatus: { $ne: UserStatus.DELETED } })
      .select('_id')
      .lean();

    if (admins.length === 0) return;

    await this.notificationModel.insertMany(
      admins.map((admin) => ({
        recipientId: admin._id.toString(),
        notificationType: NotificationType.SYSTEM,
        title,
        description,
        relatedItemId,
        linkPath,
      })),
    );
  }

  async getMyNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    await this.notificationModel.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
    return true;
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    await this.notificationModel.updateOne(
      { _id: notificationId, recipientId: userId },
      { isRead: true },
    );
    return true;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ recipientId: userId, isRead: false });
  }
}
