// ═══════════════════════════════════════════════════════════════════════════
//  RedisModule — global modul
//  ───────────────────────────────────────────────────────────────────────────
//  @Global() — RedisService'ni har bir modulda alohida import qilmasdan,
//  butun ilova bo'ylab ishlatish imkonini beradi. Har bir servisda shunchaki
//  konstruktorga `private redis: RedisService` qo'shsangiz yetarli.
// ═══════════════════════════════════════════════════════════════════════════
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
