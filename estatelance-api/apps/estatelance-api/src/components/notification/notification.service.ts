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
    const notification = await this.notificationModel.create({
      recipientId,
      notificationType,
      title,
      description,
      relatedItemId,
      linkPath,
    });

    // Expo Push Notification yuborish (background/killed app uchun)
    this.sendPushNotification(recipientId, title, description, { linkPath, relatedItemId }).catch(() => {});

    return notification;
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

  // ─── Expo Push yuborish ───────────────────────────────────────────────────
  private async sendPushNotification(
    recipientId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const user = await this.userModel.findById(recipientId).select('expoPushToken').lean();
    const token = (user as any)?.expoPushToken;
    if (!token || !token.startsWith('ExponentPushToken')) return;

    // O'qilmagan bildirishnomalar soni (iOS badge uchun)
    const unread = await this.notificationModel.countDocuments({
      recipientId,
      isRead: false,
    });

    const message = {
      to:           token,
      // iOS: custom ovoz fayli; Android: 'bufu-default' kanalining ovozi ishlatiladi
      sound:        'notification.wav',
      title,
      body,
      data:         data ?? {},
      channelId:    'bufu-default',
      priority:     'high',           // Android: telefon uxlab yotsa ham darhol yetkazadi
      // iOS: bloklangan ekranda ham banner + ovoz
      _displayInForeground: true,
      interruptionLevel:    'active',
      badge:        unread > 0 ? unread : 1,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method:  'POST',
      headers: {
        'Accept':         'application/json',
        'Content-Type':   'application/json',
        'Accept-Encoding':'gzip, deflate',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    if (result?.data?.status === 'error') {
      console.error('[Push] Error:', result.data.message, result.data.details ?? '');
    }
  }
}
