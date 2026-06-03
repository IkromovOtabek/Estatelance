/**
 * BuFu Telegram Auth Bot  (local polling)
 * Ishga tushirish: node bot.js
 */

const BOT_TOKEN  = '8501731906:AAEQqij5P6hYcddmWxJf7YkNOtDWTvqRzYw';
const API        = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEBHOOK    = 'https://api.bufu.uz/telegram/webhook';
const APP_SCHEME = 'bufu'; // standalone APK/IPA da ishlaydi

let offset = 0;

async function tg(method, body = {}) {
  const res = await fetch(`${API}/${method}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return res.json();
}

// ─── /start tgauth_TOKEN ─────────────────────────────────────────────────────
async function handleTgAuth(from, token) {
  // VPS backend ga tokenni tasdiqlash uchun POST qilamiz
  const res = await fetch(WEBHOOK, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      update_id: Date.now(),
      message: {
        from,
        chat: { id: from.id },
        text: `/start tgauth_${token}`,
      },
    }),
  });

  const ok = res.ok;
  console.log(`Token confirm → ${ok ? '✅' : '❌'} @${from.username || from.id}`);

  if (ok) {
    // Ilovaga qaytish uchun deep link tugmasi
    const deepLink = `${APP_SCHEME}://`;

    await tg('sendMessage', {
      chat_id: from.id,
      text:    `✅ Salom, ${from.first_name}! BuFu ga muvaffaqiyatli kirdingiz.`,
      reply_markup: {
        inline_keyboard: [[
          {
            text: '📱 BuFu ilovaga qaytish',
            url:  deepLink,
          },
        ]],
      },
    });
  } else {
    await tg('sendMessage', {
      chat_id: from.id,
      text: '❌ Xatolik yuz berdi. Ilovadan qayta urinib ko\'ring.',
    });
  }
}

// ─── Polling ──────────────────────────────────────────────────────────────────
async function poll() {
  try {
    const res = await tg('getUpdates', {
      offset,
      timeout:         30,
      allowed_updates: ['message'],
    });

    if (!res.ok) { await sleep(3000); return poll(); }

    for (const upd of res.result || []) {
      offset = upd.update_id + 1;
      const text = upd.message?.text?.trim() || '';
      const from = upd.message?.from;
      if (!from) continue;

      if (text.startsWith('/start tgauth_')) {
        const token = text.replace('/start tgauth_', '').trim();
        await handleTgAuth(from, token);
      } else if (text.startsWith('/start')) {
        await tg('sendMessage', {
          chat_id: from.id,
          text:    '👋 BuFu ga xush kelibsiz!\nMobil ilovada "Telegram orqali kirish" tugmasini bosing.',
        });
      }
    }
  } catch (e) {
    console.error('Xato:', e.message);
    await sleep(3000);
  }

  poll();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

console.log('🤖 BuFu bot ishga tushdi...');
tg('deleteWebhook').then(() => poll());
