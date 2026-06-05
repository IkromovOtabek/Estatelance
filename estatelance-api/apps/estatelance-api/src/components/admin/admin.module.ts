import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminResolver } from './admin.resolver';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../../schemas/User.model';
import { Job, JobSchema } from '../../schemas/Job.model';
import { Post, PostSchema } from '../../schemas/Post.model';
import { Announcement, AnnouncementSchema } from '../../schemas/Announcement.model';
import { Notification, NotificationSchema } from '../../schemas/Notification.model';
import { SiteVisit, SiteVisitSchema } from '../../schemas/SiteVisit.model';
import { VisitorSession, VisitorSessionSchema } from '../../schemas/VisitorSession.model';
import { AuthModule } from '../auth/auth.module';
import { JobModule } from '../job/job.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JobModule,
    UserModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Job.name, schema: JobSchema },
      { name: Post.name, schema: PostSchema },
      { name: Announcement.name, schema: AnnouncementSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: SiteVisit.name, schema: SiteVisitSchema },
      { name: VisitorSession.name, schema: VisitorSessionSchema },
    ]),
    AuthModule,
  ],
  providers: [AdminResolver, AdminService],
})
export class AdminModule {}
