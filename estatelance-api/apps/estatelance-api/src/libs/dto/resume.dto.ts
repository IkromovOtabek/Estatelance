import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional, MaxLength } from 'class-validator';

// ─────────────────────────────────────────────────────────────────────────────
// INPUT — Generate Resume
// Barcha maydonlar ixtiyoriy: bo'sh qolsa, foydalanuvchining profilidan
// (skills, bio, freelancerCategory, hourlyRate, ...) avtomatik to'ldiriladi.
// Foydalanuvchi forma orqali qo'shimcha/aniqroq ma'lumot bersa, shu ustun turadi.
// ─────────────────────────────────────────────────────────────────────────────

@InputType()
export class ResumeExperienceInput {
  @IsOptional() @Field(() => String, { nullable: true })
  role?: string;

  @IsOptional() @Field(() => String, { nullable: true })
  company?: string;

  @IsOptional() @Field(() => String, { nullable: true })
  period?: string; // masalan "2023 – hozir"

  @IsOptional() @Field(() => String, { nullable: true })
  description?: string;
}

@InputType()
export class ResumeEducationInput {
  // Daraja: Kollej | Bakalavr | Magistr | PHD
  @IsOptional() @Field(() => String, { nullable: true })
  level?: string;

  // Yo'nalish / soha (masalan "Kompyuter injiniringi")
  @IsOptional() @Field(() => String, { nullable: true })
  field?: string;

  @IsOptional() @Field(() => String, { nullable: true })
  institution?: string;

  // Holati: "studying" (o'qiyapman) | "graduated" (tugatganman)
  @IsOptional() @Field(() => String, { nullable: true })
  status?: string;

  // Tugatgan yoki tugatadigan yil
  @IsOptional() @Field(() => String, { nullable: true })
  year?: string;
}

@InputType()
export class ResumeLanguageInput {
  @IsOptional() @Field(() => String, { nullable: true })
  name?: string;

  // Daraja: Boshlang'ich | O'rta | Yaxshi | Erkin | Ona tili
  @IsOptional() @Field(() => String, { nullable: true })
  level?: string;
}

@InputType()
export class GenerateResumeInput {
  // To'liq ism (override) — bo'sh bo'lsa profildan olinadi
  @IsOptional() @Field(() => String, { nullable: true })
  fullName?: string;

  // Resume mo'ljallangan lavozim, masalan "UI/UX Designer"
  @IsOptional() @Field(() => String, { nullable: true })
  targetRole?: string;

  // Soha — loyihadagi kategoriya kaliti yoki qo'lda kiritilgan ("Boshqa")
  @IsOptional() @Field(() => String, { nullable: true })
  category?: string;

  // Profil rasmi (URL) — faqat foydalanuvchi "rasm qo'shish" ni yoqsa keladi
  @IsOptional() @Field(() => String, { nullable: true })
  profileImage?: string;

  @IsOptional() @Field(() => String, { nullable: true })
  phone?: string;

  @IsOptional() @Field(() => String, { nullable: true })
  email?: string;

  @IsOptional() @Field(() => Int, { nullable: true })
  yearsExperience?: number;

  @IsOptional() @Field(() => [ResumeExperienceInput], { nullable: true })
  experiences?: ResumeExperienceInput[];

  @IsOptional() @Field(() => [ResumeEducationInput], { nullable: true })
  education?: ResumeEducationInput[];

  @IsOptional() @Field(() => [ResumeLanguageInput], { nullable: true })
  languages?: ResumeLanguageInput[];

  // Qo'shimcha eslatma / yo'naltirish (AI shuni hisobga oladi)
  @IsOptional() @MaxLength(1000) @Field(() => String, { nullable: true })
  extraNotes?: string;

  // Til: "uz" (default) | "ru" | "en"
  @IsOptional() @Field(() => String, { nullable: true })
  language?: string;

  // Ohang: "professional" (default) | "creative" | "concise"
  @IsOptional() @Field(() => String, { nullable: true })
  tone?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT — Structured Resume
// AI strukturalangan JSON qaytaradi → frontend chiroyli template'ga joylaydi.
// ─────────────────────────────────────────────────────────────────────────────

@ObjectType()
export class ResumeExperience {
  @Field(() => String) role: string;
  @Field(() => String, { nullable: true }) company?: string;
  @Field(() => String, { nullable: true }) period?: string;
  @Field(() => [String]) bullets: string[];
}

@ObjectType()
export class ResumeEducation {
  @Field(() => String) degree: string;
  @Field(() => String, { nullable: true }) institution?: string;
  @Field(() => String, { nullable: true }) period?: string;
}

@ObjectType()
export class Resume {
  @Field(() => String) fullName: string;
  @Field(() => String) headline: string;          // professional sarlavha
  @Field(() => String, { nullable: true }) profileImage?: string;
  @Field(() => String, { nullable: true }) location?: string;
  @Field(() => String, { nullable: true }) email?: string;
  @Field(() => String, { nullable: true }) phone?: string;

  @Field(() => String) summary: string;           // professional ta'rif paragrafi
  @Field(() => [String]) skills: string[];
  @Field(() => [String]) highlights: string[];     // asosiy yutuqlar (bullet)
  @Field(() => [ResumeExperience]) experience: ResumeExperience[];
  @Field(() => [ResumeEducation]) education: ResumeEducation[];
  @Field(() => [String]) languages: string[];

  // Havolalar
  @Field(() => String, { nullable: true }) githubUrl?: string;
  @Field(() => String, { nullable: true }) linkedinUrl?: string;
  @Field(() => String, { nullable: true }) behanceUrl?: string;

  // Model qaytargan til (debug / UI uchun)
  @Field(() => String, { nullable: true }) language?: string;
}
