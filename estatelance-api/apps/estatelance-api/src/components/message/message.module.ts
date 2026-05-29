import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';
import { ChatGateway } from './chat.gateway';
import { Message, MessageSchema } from '../../schemas/Message.model';
import { User, UserSchema } from '../../schemas/User.model';
import { PublicMessage, PublicMessageSchema } from '../../schemas/PublicMessage.model';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: PublicMessage.name, schema: PublicMessageSchema },
    ]),
    AuthModule,
    NotificationModule,
  ],
  providers: [MessageResolver, MessageService, ChatGateway],
  exports: [ChatGateway],
})
export class MessageModule {}
