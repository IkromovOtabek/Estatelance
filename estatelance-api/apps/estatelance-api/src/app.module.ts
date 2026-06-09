// ═══════════════════════════════════════════════════════════════════════════
//  AppModule — BuFu backend'ining ILDIZ moduli (NestJS)
//  ───────────────────────────────────────────────────────────────────────────
//  NestJS modulli arxitekturada ishlaydi: har bir biznes-soha alohida modul
//  (job, bid, user, message...). Bu fayl ularning HAMMASINI bir joyga ulaydi.
//
//  Bu yerda nima sodir bo'ladi:
//   1. ConfigModule  → .env o'qiydi (global, hamma joyda process.env ishlaydi)
//   2. ThrottlerModule → rate-limit (60s ichida 120 so'rov) — DDoS/brute-force himoyasi
//   3. GraphQLModule → code-first GraphQL API (schema kod'dan avtomatik yaraladi)
//   4. Database + barcha biznes modullar
//   5. Global guard (rate-limit) va global filter (xato logging)
// ═══════════════════════════════════════════════════════════════════════════
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
import { RedisModule } from './libs/redis/redis.module';
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
import { ResumeModule } from './components/resume/resume.module';
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
    RedisModule,        // Global tezkor kesh (Redis) — chidamli, bo'lmasa ilova baribir ishlaydi
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
    ResumeModule,
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
