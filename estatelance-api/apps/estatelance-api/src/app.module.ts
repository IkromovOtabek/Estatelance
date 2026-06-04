import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { GqlThrottlerGuard } from './libs/guards/gql-throttler.guard';
import { AllExceptionsFilter } from './libs/filters/all-exceptions.filter';
import { HealthController } from './components/health/health.controller';
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
import { DisputeModule } from './components/dispute/dispute.module';
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
      // Throttler guard req/res ni context'dan olishi uchun kerak
      context: ({ req, res }) => ({ req, res }),
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
    DisputeModule,
  ],
  controllers: [GoogleController, HealthController],
  providers: [
    // Global rate-limiting (GraphQL + REST), brute-force himoyasi
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
    // Markaziy xato logging
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
