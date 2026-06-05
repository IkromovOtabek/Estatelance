import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/User.model';
import { GenerateResumeInput, Resume } from '../../libs/dto/resume.dto';

// Groq — bepul tier, juda tez. Model: Llama 3.3 70B (versatile).
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async generateResume(userId: string, input: GenerateResumeInput): Promise<Resume> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'AI xizmati sozlanmagan: GROQ_API_KEY .env faylga qo\'shilmagan.',
      );
    }

    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi.');

    const lang = (input.language || 'uz').toLowerCase();
    const langName = lang === 'ru' ? 'Russian' : lang === 'en' ? 'English' : 'Uzbek';

    const profile = this.buildProfileContext(user, input);
    const { system, prompt } = this.buildPrompt(profile, input, langName);

    let raw: string;
    try {
      raw = await this.callGroq(apiKey, system, prompt);
    } catch (err: any) {
      this.logger.error(`Groq so'rovi muvaffaqiyatsiz: ${err?.message}`);
      throw new InternalServerErrorException('AI xizmatidan javob olishda xatolik. Birozdan keyin urinib ko\'ring.');
    }

    const parsed = this.safeParse(raw);
    if (!parsed) throw new InternalServerErrorException('AI javobini o\'qib bo\'lmadi. Qayta urinib ko\'ring.');

    return this.normalize(parsed, user, lang, input);
  }

  // ── Profil + input dan kontekst tuzish ──────────────────────────────────────
  private buildProfileContext(user: any, input: GenerateResumeInput) {
    return {
      fullName: input.fullName || user.fullName || user.username,
      headline: input.targetRole || input.category || user.freelancerCategory || 'Freelancer',
      location: user.location,
      email: input.email || user.email || null,
      phone: input.phone || user.phoneNumber || null,
      bio: user.bio || '',
      skills: Array.isArray(user.skills) ? user.skills : [],
      category: input.category || user.freelancerCategory || null,
      hourlyRate: user.hourlyRate || null,
      completedJobs: user.completedJobCount || 0,
      rating: user.averageRating || null,
      portfolio: Array.isArray(user.portfolio)
        ? user.portfolio.map((p: any) => ({ title: p.title, description: p.description }))
        : [],
      githubUrl: user.githubUrl || null,
      linkedinUrl: user.linkedinUrl || null,
      behanceUrl: user.behanceUrl || null,
      // foydalanuvchi forma orqali bergan override'lar
      yearsExperience: input.yearsExperience ?? null,
      experiences: input.experiences || [],
      // ta'lim: {level, field, institution, status, year}
      education: (input.education || []).map((e) => ({
        level: e.level || null,
        field: e.field || null,
        institution: e.institution || null,
        status: e.status === 'studying' ? 'hozir o\'qiyapti' : e.status === 'graduated' ? 'tugatgan' : null,
        year: e.year || null,
      })),
      // tillar: {name, level}
      languages: (input.languages || []).map((l) => ({ name: l.name || '', level: l.level || null })).filter((l) => l.name),
      extraNotes: input.extraNotes || '',
    };
  }

  private buildPrompt(profile: any, input: GenerateResumeInput, langName: string) {
    const tone = input.tone || 'professional';
    const system =
      `You are an expert career writer that creates polished, ATS-friendly resumes for freelancers. ` +
      `Write everything in ${langName}. Tone: ${tone}. ` +
      `Return ONLY a valid JSON object, no markdown, matching exactly this shape:\n` +
      `{"fullName":string,"headline":string,"location":string,"email":string,"phone":string,` +
      `"summary":string,"skills":string[],"highlights":string[],` +
      `"experience":[{"role":string,"company":string,"period":string,"bullets":string[]}],` +
      `"education":[{"degree":string,"institution":string,"period":string}],"languages":string[]}.\n` +
      `Rules: summary = 2-3 sentences. highlights = 3-5 concrete achievement bullets. ` +
      `If experience data is missing, infer 1-2 realistic freelance-style entries from the skills/category, ` +
      `but never invent fake company names — use generic labels like "Freelance / mustaqil loyihalar". ` +
      `Keep skills to the most relevant 8-12. ` +
      `For education: build "degree" from the level + field (e.g. "Bakalavr — Kompyuter injiniringi"), ` +
      `set "institution" from the institution, and "period" from the year + status ` +
      `(e.g. "2025 (tugatadi)" if still studying, or "2021–2025" if graduated). Use ALL education entries provided. ` +
      `For languages: format each as "Name (Level)" e.g. "Ingliz (B2)" or "O'zbek (Ona tili)". Use ALL languages provided. ` +
      `Do not include any field not in the schema.`;

    const prompt =
      `Create a resume from this freelancer profile (JSON):\n` +
      JSON.stringify(profile, null, 2) +
      `\n\nGenerate the resume JSON now.`;

    return { system, prompt };
  }

  // ── Groq chat completions (OpenAI-mos format) ───────────────────────────────
  private async callGroq(apiKey: string, system: string, prompt: string): Promise<string> {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.6,
        max_tokens: 1800,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Groq ${res.status}: ${text.slice(0, 300)}`);
    }
    const data: any = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq bo\'sh javob qaytardi.');
    return content;
  }

  private safeParse(raw: string): any | null {
    try {
      return JSON.parse(raw);
    } catch {
      // ehtimol ```json ... ``` ichida — birinchi { dan oxirgi } gacha kesib olamiz
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }

  // ── Modeldan kelgan ma'lumotni qat'iy Resume tipiga keltirish ────────────────
  private normalize(p: any, user: any, lang: string, input: GenerateResumeInput): Resume {
    const arr = (v: any): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : []);
    return {
      fullName: p.fullName || input.fullName || user.fullName || user.username,
      headline: p.headline || input.targetRole || user.freelancerCategory || 'Freelancer',
      profileImage: input.profileImage || undefined,
      location: p.location || user.location || undefined,
      email: p.email || input.email || user.email || undefined,
      phone: p.phone || input.phone || user.phoneNumber || undefined,
      summary: typeof p.summary === 'string' ? p.summary : '',
      skills: arr(p.skills).length ? arr(p.skills) : arr(user.skills),
      highlights: arr(p.highlights),
      experience: Array.isArray(p.experience)
        ? p.experience.map((e: any) => ({
            role: e?.role || '',
            company: e?.company || undefined,
            period: e?.period || undefined,
            bullets: arr(e?.bullets),
          })).filter((e: any) => e.role)
        : [],
      education: Array.isArray(p.education)
        ? p.education.map((e: any) => ({
            degree: e?.degree || '',
            institution: e?.institution || undefined,
            period: e?.period || undefined,
          })).filter((e: any) => e.degree)
        : [],
      languages: arr(p.languages),
      githubUrl: user.githubUrl || undefined,
      linkedinUrl: user.linkedinUrl || undefined,
      behanceUrl: user.behanceUrl || undefined,
      language: lang,
    };
  }
}
