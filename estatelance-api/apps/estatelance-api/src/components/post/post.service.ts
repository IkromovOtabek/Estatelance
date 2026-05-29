import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from '../../schemas/Post.model';
import { User } from '../../schemas/User.model';
import { AddCommentInput, CreatePostInput } from '../../libs/dto/post.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../libs/enums/common.enums';

@Injectable()
export class PostService {
  constructor(
    @InjectModel('Post') private readonly postModel: Model<Post>,
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async createPost(authorId: string, input: CreatePostInput): Promise<Post> {
    const author = await this.userModel.findById(authorId);
    if (!author) throw new NotFoundException('User not found');

    return this.postModel.create({
      ...input,
      authorId,
      authorName: author.fullName ?? author.username,
      authorAvatar: author.profileImage,
    });
  }

  async getPosts(page: number = 1, limit: number = 20): Promise<Post[]> {
    const skip = (page - 1) * limit;
    return this.postModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
  }

  async getPostById(postId: string): Promise<Post> {
    const post = await this.postModel.findByIdAndUpdate(
      postId,
      { $inc: { viewCount: 1 } },
      { new: true },
    );
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async toggleLikePost(userId: string, postId: string): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const alreadyLiked = post.likedByUserIds.map(String).includes(userId);

    if (alreadyLiked) {
      post.likedByUserIds = post.likedByUserIds.filter((id) => String(id) !== userId);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      post.likedByUserIds.push(userId as any);
      post.likeCount += 1;

      // Notify the post author (not if they liked their own post)
      if (String(post.authorId) !== userId) {
        const liker = await this.userModel.findById(userId).select('fullName username');
        const likerName = liker?.fullName ?? liker?.username ?? 'Kimdir';
        await this.notificationService.createNotification(
          String(post.authorId),
          NotificationType.LIKE,
          'Postingizga layk bosildi',
          `${likerName} sizning "${post.title}" postingizni yoqtirdi`,
          String(post._id),
        );
      }
    }

    return post.save();
  }

  async addComment(userId: string, input: AddCommentInput): Promise<Post> {
    const post = await this.postModel.findById(input.postId);
    if (!post) throw new NotFoundException('Post not found');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const newComment = {
      _id: String(Date.now()),
      authorId: userId,
      authorName: user.fullName ?? user.username,
      authorAvatar: user.profileImage,
      text: input.text,
      createdAt: new Date().toISOString(),
    };

    post.comments.push(newComment as any);
    return post.save();
  }
}
