import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async assist(action: string, context: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = this.buildPrompt(action, context);
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Strip markdown code blocks if present
      return text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    } catch (err: any) {
      console.error('[AiService] Gemini error:', err?.message ?? err);
      throw new InternalServerErrorException('AI xizmati vaqtinchalik ishlamayapti');
    }
  }

  private buildPrompt(action: string, context: string): string {
    const PROMPTS: Record<string, string> = {
      // ─── Job actions ──────────────────────────────────────────────────────────
      job_title: `
Sen O'zbekistondagi ish e'lonlari platformasi uchun professional sarlavhalar yozuvchi yordamchisan.
Foydalanuvchi quyidagi kalit so'zlarni berdi: "${context}"
Shu ma'lumotga asoslanib 3 ta professional va qisqa ish sarlavhasi taklif qil (har biri yangi qatorda, faqat sarlavha, boshqa hech narsa yozma).
Sarlavhalar o'zbek tilida bo'lsin.`,

      job_description: `
Sen O'zbekistondagi professional ish e'lonlari yozuvchi yordamchisan.
Quyidagi ma'lumotlarga asoslanib professional ish tavsifi yoz:
${context}

Tavsif tuzilishi:
- Kompaniya/loyiha haqida qisqa ma'lumot
- Asosiy vazifalar (bullet list)
- Talablar (bullet list)
- Ish sharoitlari

O'zbek tilida yoz. Tavsif 200-300 so'z bo'lsin. Faqat tavsif matni yoz.`,

      job_improve: `
Sen professional matn muharriri va HR mutaxassissan.
Quyidagi ish tavsifini professional, aniq va qiziqarli qilib qayta yoz:
"${context}"

Grammatik xatolarni tuzat, professional uslubda yoz, o'zbek tilida bo'lsin. Faqat yaxshilangan matnni qaytarish.`,

      job_budget: `
Sen O'zbekistondagi IT va ko'chmas mulk bozori mutaxassissan.
Quyidagi ish ma'lumotlariga asoslanib:
${context}

Dollar ($) hisobida oylik maosh diapazonini taklif qil.
Faqat quyidagi formatda javob ber (boshqa hech narsa yozma):
MIN: [raqam]
MAX: [raqam]`,

      // ─── Post actions ─────────────────────────────────────────────────────────
      post_title: `
Sen O'zbekistondagi frilanserlar platformasi uchun maqola sarlavhalari yozuvchi yordamchisan.
Mavzu: "${context}"
Shu mavzuga oid 3 ta qiziqarli va jozibali maqola sarlavhasi taklif qil (har biri yangi qatorda, faqat sarlavha).
O'zbek tilida yoz.`,

      post_body: `
Sen O'zbekistondagi professional va foydali maqolalar yozuvchi yordamchisan.
Sarlavha: "${context}"

Shu sarlavhaga mos 300-400 so'zlik informativ maqola yoz.
Tuzilishi: kirish, asosiy qism (subtitlelar bilan), xulosa.
O'zbek tilida, professional va qiziqarli uslubda yoz. Faqat maqola matni.`,

      post_improve: `
Sen professional matn muharriri va kontent yaratuvchisan.
Quyidagi maqola matnini qiziqarli, professional va aniq qilib qayta yoz:
"${context}"

O'zbek tilida, muallifning g'oyasini saqlab qolib, yaxshilangan matnni qaytarish.`,

      post_summarize: `
Quyidagi matnning qisqa xulosasini yoz (2-3 jumlada):
"${context}"
O'zbek tilida yoz. Faqat xulosa matni.`,

      // ─── Profile/Bio actions ──────────────────────────────────────────────────
      bio: `
Sen O'zbekistondagi frilanserlar platformasi uchun professional bio yozuvchi yordamchisan.
Foydalanuvchi ma'lumotlari:
${context}

Shu ma'lumotlarga asoslanib 2-3 jumlali professional bio yoz.
Bio qisqa, jozibali va professional bo'lsin. O'zbek yoki ingliz tilida (berilgan ma'lumotga qarab).
Faqat bio matni.`,
    };

    return PROMPTS[action] ?? `Quyidagi so'rovga professional javob ber: ${context}`;
  }
}
