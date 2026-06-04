import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DisputeService } from './dispute.service';
import { DisputeResolver } from './dispute.resolver';
import { Dispute, DisputeSchema } from '../../schemas/Dispute.model';
import { Job, JobSchema } from '../../schemas/Job.model';
import { User, UserSchema } from '../../schemas/User.model';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Dispute.name, schema: DisputeSchema },
      { name: Job.name, schema: JobSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    NotificationModule,
  ],
  providers: [DisputeService, DisputeResolver],
  exports: [DisputeService],
})
export class DisputeModule {}
