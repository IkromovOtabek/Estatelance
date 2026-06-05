import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobResolver } from './job.resolver';
import { JobService } from './job.service';
import { Job, JobSchema } from '../../schemas/Job.model';
import { User, UserSchema } from '../../schemas/User.model';
import { Bid, BidSchema } from '../../schemas/Bid.model';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: User.name, schema: UserSchema },
      { name: Bid.name, schema: BidSchema },
    ]),
    AuthModule,
    NotificationModule,
  ],
  providers: [JobResolver, JobService],
  exports: [JobService],
})
export class JobModule {}
