import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../../schemas/Message.model';
import { User } from '../../schemas/User.model';
import { SendMessageInput } from '../../libs/dto/message.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../libs/enums/common.enums';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async sendMessage(senderId: string, input: SendMessageInput): Promise<Message> {
    const sender = await this.userModel.findById(senderId);
    const receiver = await this.userModel.findById(input.receiverId);

    if (!sender || !receiver) {
      throw new NotFoundException('Sender or receiver not found');
    }

    const message = await this.messageModel.create({
      senderId,
      senderName:     sender.fullName ?? sender.username,
      senderUsername: sender.username,
      senderAvatar:   sender.profileImage,
      receiverId:     input.receiverId,
      receiverName:   receiver.fullName ?? receiver.username,
      receiverUsername: receiver.username,
      receiverAvatar:   receiver.profileImage,
      text: input.text,
    });

    const senderName = sender.fullName ?? sender.username;
    const preview = input.text.length > 60 ? `${input.text.slice(0, 60)}...` : input.text;
    await this.notificationService.createNotification(
      input.receiverId,
      NotificationType.MESSAGE,
      'Yangi xabar',
      `${senderName}: ${preview}`,
      senderId,
    );

    return message;
  }

  // Get all messages in a conversation between two users
  async getConversation(userId: string, otherUserId: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 });
  }

  // Get a list of unique conversations the user is part of
  async getMyConversations(userId: string): Promise<Message[]> {
    // IMPORTANT: aggregation pipelines don't auto-convert string → ObjectId,
    // so we must cast manually. Without this, $match finds nothing.
    const userObjId = new Types.ObjectId(userId);

    return this.messageModel
      .aggregate([
        {
          $match: {
            $or: [{ senderId: userObjId }, { receiverId: userObjId }],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$senderId', userObjId] },
                '$receiverId',
                '$senderId',
              ],
            },
            lastMessage: { $first: '$$ROOT' },
          },
        },
        { $replaceRoot: { newRoot: '$lastMessage' } },
        { $sort: { createdAt: -1 } },
      ]);
  }

  async markMessagesAsRead(userId: string, otherUserId: string): Promise<boolean> {
    await this.messageModel.updateMany(
      { senderId: otherUserId, receiverId: userId, isRead: false },
      { isRead: true },
    );
    return true;
  }

  // Count how many conversations have unread messages for this user
  async getUnreadMessageCount(userId: string): Promise<number> {
    const userObjId = new Types.ObjectId(userId);
    const result = await this.messageModel.aggregate([
      {
        $match: {
          receiverId: userObjId,
          isRead: false,
        },
      },
      {
        $group: { _id: '$senderId' },
      },
      {
        $count: 'total',
      },
    ]);
    return result[0]?.total ?? 0;
  }
}
