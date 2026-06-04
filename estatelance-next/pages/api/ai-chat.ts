import type { NextApiRequest, NextApiResponse } from 'next';

// ─── AI Assistant API (multi-provider proxy) ──────────────────────────────────
// Accepts: POST { messages: { role: 'user' | 'assistant', content: string }[] }
// Returns: { reply: string, provider, model }
//
// Provayderlar navbati (qaysi kalit bo'lsa, o'sha ishlatiladi):
//   1) Groq      — GROQ_API_KEY        (eng ishonchli bepul, tavsiya)
//   2) OpenRouter— OPENROUTER_API_KEY  (bepul modellar avtomatik aniqlanadi)
//   3) Gemini    — GEMINI_API_KEY / NEXT_PUBLIC_GEMINI_API_KEY
//
// API kalitlar faqat serverda ishlatiladi (oshkor bo'lmaydi).

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

// OpenRouter free modellar tez-tez o'zgaradi — avval API'dan aniqlaymiz, bo'lmasa shu zaxira:
const OPENROUTER_FALLBACK = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-r1:free',
  'google/gemma-2-9b-it:free',
];

const SYSTEM_PROMPT = `Sen "BuFu" platformasining rasmiy AI yordamchisisan.

BuFu — O'zbekistondagi frilanserlar va mijozlarni bog'laydigan platforma. Asosiy imkoniyatlar:
- Frilanserlar ish topadi, mijozlar (ish beruvchilar) ish e'lon qiladi.
- Yo'nalishlar: Foto & Dron, 3D Vizualizatsiya, Interyer dizayn, Yuridik & Kadastr, SMM & Kontent, IT & Dasturlash va boshqalar.
- Ro'yxatdan o'tish: foydalanuvchi "ish izlovchi (frilanser)" yoki "ish beruvchi (agent)" sifatida ro'yxatdan o'tadi.
- To'lovlar Escrow (kafolatlangan) tizimi orqali himoyalanadi.
- Top frilanserlar, reytinglar, portfolio va verifikatsiya mavjud.

Vazifang: foydalanuvchilarning platforma, frilanserlik, ish topish/joylash, to'lov, ro'yxatdan o'tish va shunga o'xshash savollariga aniq, qisqa va do'stona javob ber.

Muhim qoidalar:
- Foydalanuvchi qaysi tilda yozsa, SHU tilda javob ber (o'zbek, rus, ingliz va h.k.).
- Javoblar qisqa va amaliy bo'lsin (kerak bo'lsa qadamlar bilan).
- Platformaga aloqasi yo'q savollarga ham yordam berishga harakat qil, lekin imkon bo'lsa BuFu kontekstiga bog'la.
- Hech qachon yolg'on ma'lumot (narx, kafolat) o'ylab topma; bilmasang, qo'llab-quvvatlash bilan bog'lanishni taklif qil (@bufu_uz, info@bufu.uz).`;

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

type Trimmed = { role: 'user' | 'assistant'; content: string }[];

// OpenAI-mos (Groq / OpenRouter) chat completions chaqiruvi
async function callOpenAICompat(
  url: string,
  apiKey: string,
  model: string,
  messages: Trimmed,
  extraHeaders: Record<string, string> = {},
): Promise<{ ok: boolean; status: number; reply?: string; err?: string }> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...extraHeaders },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.6,
        max_tokens: 800,
      }),
    });
    if (r.ok) {
      const data = await r.json();
      const reply: string = data?.choices?.[0]?.message?.content?.trim() || '';
      return { ok: true, status: 200, reply };
    }
    return { ok: false, status: r.status, err: await r.text().catch(() => '') };
  } catch (e: any) {
    return { ok: false, status: 0, err: String(e?.message ?? e) };
  }
}

// OpenRouter'dan hozir mavjud bepul modellarni aniqlash
async function fetchOpenRouterFreeModels(apiKey: string): Promise<string[]> {
  try {
    const r = await fetch(OPENROUTER_MODELS_URL, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!r.ok) return OPENROUTER_FALLBACK;
    const data = await r.json();
    const free = (data?.data ?? [])
      .filter((m: any) => {
        const p = m?.pricing ?? {};
        const isFree = (p.prompt === '0' || p.prompt === 0) && (p.completion === '0' || p.completion === 0);
        return isFree || String(m?.id ?? '').endsWith(':free');
      })
      .map((m: any) => m.id as string)
      .filter(Boolean);
    return free.length ? free.slice(0, 8) : OPENROUTER_FALLBACK;
  } catch {
    return OPENROUTER_FALLBACK;
  }
}

// Gemini'ga to'g'ridan-to'g'ri murojaat (eng oxirgi zaxira)
async function tryGemini(messages: Trimmed): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) return null;
  const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const gm of geminiModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${gm}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
        }),
      });
      if (!res.ok) {
        console.error(`Gemini error [${gm}]:`, res.status, (await res.text().catch(() => '')).slice(0, 300));
        continue;
      }
      const data = await res.json();
      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text?.trim()) return text.trim();
    } catch (e) {
      console.error(`Gemini exception [${gm}]:`, e);
    }
  }
  return null;
}

export default async function aiChatHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const groqKey = process.env.GROQ_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!groqKey && !orKey && !geminiKey) {
    return res.status(500).json({
      error: "AI yordamchi sozlanmagan. .env.local ga GROQ_API_KEY (yoki OPENROUTER_API_KEY) qo'shing.",
    });
  }

  try {
    const { messages } = req.body as { messages: ChatMsg[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages talab qilinadi' });
    }

    const trimmed: Trimmed = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    let lastStatus = 0;

    // 1) Groq — eng ishonchli bepul
    if (groqKey) {
      for (const model of GROQ_MODELS) {
        const out = await callOpenAICompat(GROQ_URL, groqKey, model, trimmed);
        if (out.ok && out.reply) return res.status(200).json({ reply: out.reply, provider: 'groq', model });
        lastStatus = out.status || lastStatus;
        console.error(`Groq error [${model}]:`, out.status, (out.err ?? '').slice(0, 300));
      }
    }

    // 2) OpenRouter — bepul modellar
    if (orKey) {
      const envModel = process.env.OPENROUTER_MODEL;
      const models = envModel ? [envModel] : await fetchOpenRouterFreeModels(orKey);
      const orHeaders = {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://bufu.uz',
        'X-Title': 'BuFu',
      };
      for (const model of models) {
        const out = await callOpenAICompat(OPENROUTER_URL, orKey, model, trimmed, orHeaders);
        if (out.ok && out.reply) return res.status(200).json({ reply: out.reply, provider: 'openrouter', model });
        lastStatus = out.status || lastStatus;
        console.error(`OpenRouter error [${model}]:`, out.status, (out.err ?? '').slice(0, 200));
      }
    }

    // 3) Gemini — oxirgi zaxira
    const geminiReply = await tryGemini(trimmed);
    if (geminiReply) return res.status(200).json({ reply: geminiReply, provider: 'gemini', model: 'gemini' });

    return res.status(502).json({
      error:
        lastStatus === 429
          ? "Hozir bepul AI modellar band. Bir necha soniyadan so'ng qayta urinib ko'ring."
          : "AI javob bera olmadi. Birozdan so'ng qayta urinib ko'ring.",
    });
  } catch (err) {
    console.error('ai-chat handler error:', err);
    return res.status(500).json({ error: "Server xatosi. Qayta urinib ko'ring." });
  }
}
