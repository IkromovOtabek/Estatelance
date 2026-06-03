import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './components/auth/auth.module';
import { UserModule } from './components/user/user.module';
import { JobModule } from './components/job/job.module';
import { BidModule } from './components/bid/bid.module';
import { PostModule } from './components/post/post.module';
import { MessageModule } from './components/message/message.module';
import { NotificationModule } from './components/notification/notification.module';
import { AdminModule } from './components/admin/admin.module';
import { TelegramBotModule } from './components/telegram-bot/telegram-bot.module';
import { GoogleController } from './components/auth/google.controller';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([{
      ttl:   60_000,
      limit: 120,
    }]),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground:     !isProd,
      introspection:  !isProd,
      autoSchemaFile: true,
      formatError: (error) => ({
        message: error?.message,
        extensions: { code: error?.extensions?.code },
      }),
    }),

    DatabaseModule,
    AuthModule,
    UserModule,
    JobModule,
    BidModule,
    PostModule,
    MessageModule,
    NotificationModule,
    AdminModule,
    TelegramBotModule,
  ],
  controllers: [GoogleController],
  // GoogleController ga TelegramBotService inject bo'lishi uchun
  providers: [],
})
export class AppModule {}
