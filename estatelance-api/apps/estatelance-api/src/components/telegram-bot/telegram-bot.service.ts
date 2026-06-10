import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface TgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TgDocument {
  file_id: string;
  file_unique_id?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

interface TgUpdate {
  update_id: number;
  message?: {
    from: TgUser;
    chat: { id: number };
    text?: string;
    document?: TgDocument;
  };
  callback_query?: {
    id: string;
    from: TgUser;
    data?: string;
    message?: { chat: { id: number } };
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

  // APK file_id — Telegram serverida saqlangan fayl identifikatori.
  // Bu usul hajm cheklovini chetlab o'tadi (URL=20MB, multipart=50MB cheklovlari tegmaydi).
  private apkFileId: string | null = process.env.APK_FILE_ID || null;
  private readonly apkStorePath = path.join(process.cwd(), 'apk-file-id.json');

  // Telegram tokens
  private readonly pending = new Map<string, PendingToken>();

  // Google tokens → confirmed User data
  private readonly googlePending = new Map<string, { googleUser: any; createdAt: number }>();

  onModuleInit() {
    if (!this.token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set');
      return;
    }

    // Diskdan saqlangan APK file_id ni yuklaymiz (restartdan keyin ham ishlaydi)
    this.loadApkFileId();

    const webhookUrl = `${process.env.API_BASE_URL || 'https://api.bufu.uz'}/telegram/webhook`;
    this.tg('setWebhook', { url: webhookUrl })
      .then((r: any) => {
        if (r.ok) this.logger.log(`Webhook: ${webhookUrl}`);
        else      this.logger.error(`Webhook fail: ${r.description}`);
      })
      .catch((e: any) => this.logger.error(e.message));

    // Telegram menyu komandalari (foydalanuvchi "/" bosganda ko'rinadi)
    this.tg('setMyCommands', {
      commands: [
        { command: 'start',    description: 'Botni ishga tushirish' },
        { command: 'download', description: '📥 BuFu ilovasini yuklab olish' },
        { command: 'help',     description: 'ℹ️ Yordam va imkoniyatlar' },
      ],
    }).catch(() => {});

    // Har 60 soniyada eskirgan tokenlarni tozalaymiz
    setInterval(() => this.cleanExpired(), 60_000);
  }

  // ─── Webhook update ──────────────────────────────────────────────────────
  async handleUpdate(update: TgUpdate) {
    // Inline tugma bosilganda (callback_query)
    if (update.callback_query) {
      const cq     = update.callback_query;
      const chatId = cq.message?.chat.id ?? cq.from.id;
      // "Yuklanmoqda..." holatini yopish
      await this.tg('answerCallbackQuery', { callback_query_id: cq.id }).catch(() => {});
      if (cq.data === 'download') {
        await this.sendAppDownload(chatId);
      }
      return;
    }

    const msg  = update.message;
    if (!msg?.from) return;

    // Admin botga APK fayl yuborsa — uning file_id sini ushlab saqlaymiz.
    // Shu file_id orqali bot keyin istalgan hajmdagi APK ni qayta yubora oladi.
    if (msg.document) {
      await this.registerApk(msg.from, msg.document);
      return;
    }

    if (!msg.text) return;

    const text = msg.text.trim();
    const from = msg.from;

    if (text.startsWith('/start tgauth_')) {
      // App tomonidan yuborilgan token
      const token = text.replace('/start tgauth_', '').trim();
      await this.confirmToken(token, from);
    } else if (text.startsWith('/start download') || text === '/download' || text === '/yuklab') {
      // Android ilovani yuklab olish
      await this.sendAppDownload(from.id);
    } else if (text.startsWith('/start')) {
      await this.sendWelcome(from);
    } else if (text === '/help' || text === '/yordam') {
      await this.sendWelcome(from);
    }
  }

  // ─── Xush kelibsiz xabari (salomlashish + tanishtiruv + tugmalar) ──────────
  private async sendWelcome(from: TgUser) {
    const name = from.first_name || 'do\'st';
    await this.tg('sendMessage', {
      chat_id: from.id,
      text:
        `👋 Assalomu alaykum, <b>${name}</b>!\n\n` +
        '🚀 <b>BuFu</b> — O\'zbekistondagi #1 frilanser platformasiga xush kelibsiz!\n\n' +
        'Bu yerda nima qila olasiz:\n' +
        '💼 <b>Ish topish</b> — frilanser bo\'lib daromad qiling\n' +
        '🔍 <b>Mutaxassis topish</b> — foto, 3D, dizayn, IT, yuridik va boshqa sohalarda\n' +
        '📢 <b>Ish e\'lon qilish</b> — bir necha daqiqada\n' +
        '✨ <b>AI Resume</b> — sun\'iy intellekt bilan rezyume yarating\n\n' +
        '📲 Boshlash uchun Android ilovani yuklab oling yoki veb-saytga kiring 👇',
      parse_mode: 'HTML',
      reply_markup: this.mainKeyboard(),
    });
  }

  // ─── Android ilovani yuborish ─────────────────────────────────────────────
  private async sendAppDownload(chatId: number) {
    const caption =
      '📥 <b>BuFu — Android ilova</b>\n\n' +
      '1️⃣ Faylni yuklab oling\n' +
      '2️⃣ Oching va o\'rnating\n' +
      '3️⃣ "Noma\'lum manbalar"ga ruxsat bering (so\'rasa)\n\n' +
      '✅ Tayyor! Endi BuFu\'dan to\'liq foydalaning.';

    // 1) ENG ISHONCHLI: file_id orqali yuborish.
    //    Fayl allaqachon Telegram serverida — hajm cheklovi (20/50MB) tegmaydi.
    if (this.apkFileId) {
      const res = await this.tg('sendDocument', {
        chat_id:    chatId,
        document:   this.apkFileId,
        caption,
        parse_mode: 'HTML',
      });
      if (res?.ok) return;

      // file_id eskirgan/yaroqsiz bo'lsa — tozalab, keyingi usulga o'tamiz
      this.logger.warn(`sendDocument by file_id failed: ${res?.description}`);
      this.apkFileId = null;
      this.saveApkFileId(null);
    }

    const apkUrl = process.env.APK_DOWNLOAD_URL;

    if (!apkUrl) {
      await this.tg('sendMessage', {
        chat_id: chatId,
        text: '⏳ Ilova hozircha tayyorlanmoqda. Tez orada shu yerdan yuklab olishingiz mumkin bo\'ladi.',
      });
      return;
    }

    // 2) URL orqali (Telegram faylni o'zi yuklaydi — faqat ≤20MB ishlaydi)
    const res = await this.tg('sendDocument', {
      chat_id:  chatId,
      document: apkUrl,
      caption,
      parse_mode: 'HTML',
    });
    if (res?.ok) return;

    // 3) Yuborilmasa (hajm katta/URL muammosi) — to'g'ridan-to'g'ri havola tugmasi
    await this.tg('sendMessage', {
      chat_id: chatId,
      text:
        '📥 Android ilovani yuklab olish uchun quyidagi tugmani bosing 👇\n\n' +
        'Yuklab olgach: oching → o\'rnating → "Noma\'lum manbalar"ga ruxsat bering.',
      reply_markup: {
        inline_keyboard: [[{ text: '⬇️ BuFu.apk yuklab olish', url: apkUrl }]],
      },
    });
  }

  // ─── Admin yuborgan APK file_id ni ro'yxatga olish ────────────────────────
  private async registerApk(from: TgUser, doc: TgDocument) {
    const adminId = process.env.TELEGRAM_ADMIN_ID;

    // TELEGRAM_ADMIN_ID o'rnatilgan bo'lsa — faqat admin APK yangilay oladi
    if (adminId && String(from.id) !== String(adminId)) {
      return;
    }

    const isApk =
      doc.mime_type === 'application/vnd.android.package-archive' ||
      (doc.file_name || '').toLowerCase().endsWith('.apk');

    if (!isApk) return;

    this.apkFileId = doc.file_id;
    this.saveApkFileId(doc.file_id);

    const sizeMb = doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) : '?';
    this.logger.log(`APK registered: ${doc.file_name} (${sizeMb} MB) file_id=${doc.file_id}`);

    await this.tg('sendMessage', {
      chat_id: from.id,
      text:
        '✅ <b>APK qabul qilindi va saqlandi!</b>\n\n' +
        `📦 Fayl: <code>${doc.file_name || 'bufu.apk'}</code>\n` +
        `📊 Hajm: ${sizeMb} MB\n\n` +
        'Endi foydalanuvchilar /download orqali shu ilovani to\'g\'ridan-to\'g\'ri yuklab oladi ' +
        '(hajm cheklovisiz).\n\n' +
        '💡 Doimiy saqlash uchun <code>.env</code> ga qo\'ying:\n' +
        `<code>APK_FILE_ID=${doc.file_id}</code>`,
      parse_mode: 'HTML',
    });
  }

  // ─── APK file_id ni diskka saqlash / o'qish ──────────────────────────────
  private saveApkFileId(fileId: string | null) {
    try {
      if (fileId) {
        fs.writeFileSync(this.apkStorePath, JSON.stringify({ fileId, updatedAt: Date.now() }));
      } else if (fs.existsSync(this.apkStorePath)) {
        fs.unlinkSync(this.apkStorePath);
      }
    } catch (e: any) {
      this.logger.warn(`APK file_id saqlanmadi: ${e.message}`);
    }
  }

  private loadApkFileId() {
    // Env ustuvor — qo'lda o'rnatilgan bo'lsa o'shani ishlatamiz
    if (process.env.APK_FILE_ID) {
      this.apkFileId = process.env.APK_FILE_ID;
      return;
    }
    try {
      if (fs.existsSync(this.apkStorePath)) {
        const data = JSON.parse(fs.readFileSync(this.apkStorePath, 'utf8'));
        if (data?.fileId) {
          this.apkFileId = data.fileId;
          this.logger.log('APK file_id diskdan yuklandi');
        }
      }
    } catch {
      /* ignore */
    }
  }

  // ─── Asosiy menyu tugmalari ───────────────────────────────────────────────
  private mainKeyboard() {
    const webUrl = process.env.FRONTEND_URL || 'https://bufu.uz';
    return {
      inline_keyboard: [
        [{ text: '📥 BuFu ilovasini yuklab olish', callback_data: 'download' }],
        [
          { text: '💼 Ishlar', url: `${webUrl}/jobs` },
          { text: '🔍 Frilanserlar', url: `${webUrl}/browse` },
        ],
        [
          { text: '✨ AI Resume', url: `${webUrl}/resume` },
          { text: '🌐 Veb-sayt', url: webUrl },
        ],
      ],
    };
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

  // ─── Google Auth token tizimi ────────────────────────────────────────────
  createGoogleAuthToken(): string {
    const tok = crypto.randomBytes(14).toString('hex');
    this.googlePending.set(tok, { googleUser: null, createdAt: Date.now() });
    return tok;
  }

  confirmGoogleToken(token: string, googleUser: any): boolean {
    const entry = this.googlePending.get(token);
    if (!entry) return false;
    entry.googleUser = googleUser;
    this.googlePending.set(token, entry);
    return true;
  }

  consumeGoogleToken(token: string): any | null {
    const entry = this.googlePending.get(token);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > 5 * 60 * 1000) {
      this.googlePending.delete(token);
      return null;
    }
    if (!entry.googleUser) return null;
    this.googlePending.delete(token);
    return entry.googleUser;
  }

  // ─── Eskirganlarni tozalash ───────────────────────────────────────────────
  private cleanExpired() {
    const now = Date.now();
    for (const [key, val] of this.pending) {
      if (now - val.createdAt > 5 * 60 * 1000) this.pending.delete(key);
    }
    for (const [key, val] of this.googlePending) {
      if (now - val.createdAt > 5 * 60 * 1000) this.googlePending.delete(key);
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
