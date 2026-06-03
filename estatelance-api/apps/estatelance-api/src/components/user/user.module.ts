import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { User, UserSchema } from '../../schemas/User.model';
import { Follow, FollowSchema } from '../../schemas/Follow.model';
import { ProfileView, ProfileViewSchema } from '../../schemas/ProfileView.model';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { TelegramBotModule } from '../telegram-bot/telegram-bot.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: ProfileView.name, schema: ProfileViewSchema },
    ]),
    AuthModule,
    NotificationModule,
    TelegramBotModule,
  ],
  providers: [UserResolver, UserService],
  exports: [UserService],
})
export class UserModule {}
