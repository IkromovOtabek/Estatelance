// ═══════════════════════════════════════════════════════════════════════════
//  RedisService — tezkor kesh qatlami (chidamli / xavfsiz)
//  ───────────────────────────────────────────────────────────────────────────
//  MUHIM: bu servis "graceful degradation" tamoyilida ishlaydi.
//   • REDIS_HOST yo'q bo'lsa  → kesh o'chiriladi, ilova MongoDB bilan normal ishlaydi
//   • ioredis o'rnatilmagan   → kesh o'chiriladi (npm install kerak)
//   • Redis ulanmasa/xato     → har bir metod jim qaytadi, ilova qulamaydi
//
//  Ya'ni Redis "bonus tezlik" — u bo'lmasa ham hech narsa buzilmaydi.
// ═══════════════════════════════════════════════════════════════════════════
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger('Redis');
  private client: any = null;       // ioredis klienti (any — ioredis hali o'rnatilmagan bo'lishi mumkin)
  private enabled = false;          // faqat ulanib bo'lgach true

  constructor() {
    const host = process.env.REDIS_HOST;
    if (!host) {
      this.logger.warn("REDIS_HOST yo'q — kesh o'chirilgan (ilova MongoDB bilan ishlaydi)");
      return;
    }
    try {
      // Dinamik require — ioredis o'rnatilmagan bo'lsa ham fayl kompilyatsiya bo'ladi
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Redis = require('ioredis');
      this.client = new Redis({
        host,
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 2,
        // 5 martadan keyin urinishni to'xtatadi (cheksiz qayta urinmaslik uchun)
        retryStrategy: (times: number) => (times > 5 ? null : Math.min(times * 300, 2000)),
      });
      this.client.on('connect', () => { this.enabled = true; this.logger.log('ulandi ✅'); });
      this.client.on('error', (e: any) => {
        if (this.enabled) this.logger.error('xato: ' + e?.message);
        this.enabled = false;
      });
    } catch {
      this.logger.warn("ioredis o'rnatilmagan — kesh o'chirilgan. `npm install` qiling.");
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // ── Kalit bo'yicha o'qish (JSON avtomatik parse) ──
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.enabled) return null;
    try {
      const v = await this.client.get(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  }

  // ── Saqlash (TTL — necha soniyadan keyin o'chadi) ──
  async set(key: string, value: any, ttlSeconds = 60): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch { /* jim */ }
  }

  // ── O'chirish ──
  async del(...keys: string[]): Promise<void> {
    if (!this.enabled || keys.length === 0) return;
    try { await this.client.del(...keys); } catch { /* jim */ }
  }

  // ── Naqsh bo'yicha o'chirish (invalidatsiya), masalan "jobs:*" ──
  async delByPattern(pattern: string): Promise<void> {
    if (!this.enabled) return;
    try {
      const keys: string[] = await this.client.keys(pattern);
      if (keys.length) await this.client.del(...keys);
    } catch { /* jim */ }
  }

  // ── Counter (masalan viewCount, rate-limit) ──
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.enabled) return 0;
    try {
      const n = await this.client.incr(key);
      if (ttlSeconds && n === 1) await this.client.expire(key, ttlSeconds);
      return n;
    } catch {
      return 0;
    }
  }

  // ── Eng foydali yordamchi: keshda bor bo'lsa qaytaradi, yo'q bo'lsa fn() dan
  //    oladi va keshlab qaytaradi. (cache-aside pattern) ──
  async remember<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await fn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  onModuleDestroy() {
    try { this.client?.quit(); } catch { /* jim */ }
  }
}
