// Image source uchun xavfsiz URI.
// iOS (new arch) bo'sh yoki noto'g'ri URI'da "URI parsing error" bilan qulaydi.
// Bu yordamchi faqat yaroqli http(s) URL qaytaradi, aks holda undefined.
const API_BASE = 'https://bufu.uz';

export function safeImageUri(value?: string | null): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const v = value.trim();
  if (!v) return undefined;

  // To'liq URL
  if (/^https?:\/\//i.test(v)) return v;
  // data URI (base64)
  if (/^data:image\//i.test(v)) return v;
  // Lokal fayl (rasm tanlash preview'i)
  if (/^(file|content|ph|assets-library):\/\//i.test(v)) return v;
  // Nisbiy yo'l (/uploads/...) → API bazasi bilan to'ldiramiz
  if (v.startsWith('/')) return `${API_BASE}${v}`;

  // Boshqa noma'lum format — xavfsizlik uchun ko'rsatmaymiz
  return undefined;
}
