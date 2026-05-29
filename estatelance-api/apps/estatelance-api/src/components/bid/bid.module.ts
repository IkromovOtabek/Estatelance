import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BidResolver } from './bid.resolver';
import { BidService } from './bid.service';
import { Bid, BidSchema } from '../../schemas/Bid.model';
import { Job, JobSchema } from '../../schemas/Job.model';
import { User, UserSchema } from '../../schemas/User.model';
import { AuthModule } from '../auth/auth.module';
import { JobModule } from '../job/job.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bid.name, schema: BidSchema },
      { name: Job.name, schema: JobSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    JobModule,
    NotificationModule,
  ],
  providers: [BidResolver, BidService],
})
export class BidModule {}
