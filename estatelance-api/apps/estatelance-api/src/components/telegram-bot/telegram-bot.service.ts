import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

interface TgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TgUpdate {
  update_id: number;
  message?: {
    from: TgUser;
    chat: { id: number };
    text?: string;
  };
}

// ─── In-memory token store ────────────────────────────────────────────────────
// token → { user, createdAt }
interface PendingToken {
  telegramUser: TgUser;
  createdAt:    number;
}

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger  = new Logger(TelegramBotService.name);
  private readonly token   = process.env.TELEGRAM_BOT_TOKEN || '';
  private readonly apiBase = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  private readonly APP_SCHEME = 'bufu';

  // Token → TelegramUser  (60 soniya ömür)
  private readonly pending = new Map<string, PendingToken>();

  onModuleInit() {
    if (!this.token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set');
      return;
    }

    const webhookUrl = `${process.env.API_BASE_URL || 'https://api.bufu.uz'}/telegram/webhook`;
    this.tg('setWebhook', { url: webhookUrl })
      .then((r: any) => {
        if (r.ok) this.logger.log(`Webhook: ${webhookUrl}`);
        else      this.logger.error(`Webhook fail: ${r.description}`);
      })
      .catch((e: any) => this.logger.error(e.message));

    // Har 60 soniyada eskirgan tokenlarni tozalaymiz
    setInterval(() => this.cleanExpired(), 60_000);
  }

  // ─── Webhook update ──────────────────────────────────────────────────────
  async handleUpdate(update: TgUpdate) {
    const msg  = update.message;
    if (!msg?.text || !msg.from) return;

    const text = msg.text.trim();
    const from = msg.from;

    if (text.startsWith('/start tgauth_')) {
      // App tomonidan yuborilgan token
      const token = text.replace('/start tgauth_', '').trim();
      await this.confirmToken(token, from);
    } else if (text.startsWith('/start')) {
      await this.tg('sendMessage', {
        chat_id: from.id,
        text: '👋 BuFu ga xush kelibsiz!\n\nMobil ilovada "Telegram orqali kirish" tugmasini bosing.',
      });
    }
  }

  // ─── 1. App token yaratadi ────────────────────────────────────────────────
  createAuthToken(): string {
    const tok = crypto.randomBytes(12).toString('hex'); // 24 char
    // Hali foydalanuvchi ma'lumoti yo'q — bot /start olganda to'ldiradi
    this.pending.set(tok, { telegramUser: null as any, createdAt: Date.now() });
    return tok;
  }

  // ─── 2. Bot tokenni tasdiqlaydi ───────────────────────────────────────────
  private async confirmToken(token: string, from: TgUser) {
    const entry = this.pending.get(token);

    if (!entry) {
      await this.tg('sendMessage', {
        chat_id: from.id,
        text: '❌ Token topilmadi yoki muddati o\'tgan. Iltimos, ilovadan qayta urinib ko\'ring.',
      });
      return;
    }

    // Foydalanuvchi ma'lumotini saqlaydi
    entry.telegramUser = from;
    this.pending.set(token, entry);

    await this.tg('sendMessage', {
      chat_id: from.id,
      text: `✅ Muvaffaqiyatli!\n\nSalom, ${from.first_name}! BuFu ilovaga qaytib kiring.`,
    });

    this.logger.log(`Token confirmed: @${from.username || from.id}`);
  }

  // ─── 3. App so'rovda tokenni tekshiradi ──────────────────────────────────
  consumeToken(token: string): TgUser | null {
    const entry = this.pending.get(token);
    if (!entry) return null;

    // Muddati: 5 daqiqa
    if (Date.now() - entry.createdAt > 5 * 60 * 1000) {
      this.pending.delete(token);
      return null;
    }

    if (!entry.telegramUser?.id) return null; // hali botda tasdiqlanmagan

    this.pending.delete(token);
    return entry.telegramUser;
  }

  // ─── Eskirganlarni tozalash ───────────────────────────────────────────────
  private cleanExpired() {
    const now = Date.now();
    for (const [key, val] of this.pending) {
      if (now - val.createdAt > 5 * 60 * 1000) this.pending.delete(key);
    }
  }

  // ─── Telegram API yordamchi ───────────────────────────────────────────────
  async tg(method: string, body: Record<string, any> = {}): Promise<any> {
    const res = await fetch(`${this.apiBase}/${method}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    return res.json();
  }
}
