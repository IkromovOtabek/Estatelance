import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostResolver } from './post.resolver';
import { PostService } from './post.service';
import { Post, PostSchema } from '../../schemas/Post.model';
import { User, UserSchema } from '../../schemas/User.model';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    NotificationModule,
  ],
  providers: [PostResolver, PostService],
})
export class PostModule {}
