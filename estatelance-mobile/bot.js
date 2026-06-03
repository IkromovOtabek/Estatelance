/**
 * BuFu Telegram Auth Bot  (local polling)
 * Ishga tushirish: node bot.js
 */

const BOT_TOKEN = '8501731906:AAEQqij5P6hYcddmWxJf7YkNOtDWTvqRzYw';
const API       = `https://api.telegram.org/bot${BOT_TOKEN}`;

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
// Backend da token ni tasdiqlaymiz (GraphQL checkTelegramAuthToken orqali emas,
// lekin bot service consumeToken ni backenddan chaqiramiz — bu yerda webhook
// endpoint ga POST qilamiz)
async function handleTgAuth(from, token) {
  const params = new URLSearchParams({
    id:         String(from.id),
    first_name: from.first_name || '',
    auth_date:  String(Math.floor(Date.now() / 1000)),
    token,
    ...(from.last_name  ? { last_name:  from.last_name  } : {}),
    ...(from.username   ? { username:   from.username   } : {}),
    ...(from.photo_url  ? { photo_url:  from.photo_url  } : {}),
  });

  // Backend webhook endpointiga POST qilamiz — bot service tokenni tasdiqlaydi
  const res = await fetch('https://api.bufu.uz/telegram/webhook', {
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

  await tg('sendMessage', {
    chat_id: from.id,
    text: ok
      ? `✅ Tabriklaymiz, ${from.first_name}!\n\nSiz BuFu ilovaga muvaffaqiyatli kirdingiz.\nIlovaga qaytib kiring 📱`
      : '❌ Xatolik yuz berdi. Ilovadan qayta urinib ko\'ring.',
  });
}

// ─── Polling ──────────────────────────────────────────────────────────────────
async function poll() {
  try {
    const res = await tg('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] });
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
          text: '👋 BuFu ga xush kelibsiz!\nMobil ilovada "Telegram orqali kirish" tugmasini bosing.',
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
