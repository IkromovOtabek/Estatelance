import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { User, UserSchema } from '../../schemas/User.model';
import { Follow, FollowSchema } from '../../schemas/Follow.model';
import { ProfileView, ProfileViewSchema } from '../../schemas/ProfileView.model';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: ProfileView.name, schema: ProfileViewSchema },
    ]),
    forwardRef(() => AuthModule),
    NotificationModule,
  ],
  providers: [UserResolver, UserService],
  exports: [UserService, MongooseModule],
})
export class UserModule {}
