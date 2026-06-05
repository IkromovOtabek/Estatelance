/**
 * Rasm URL — DB dagi yo‘lni brauzerda ochiladigan manzilga aylantiradi.
 * Yuklangan fayllar: estatelance-next/public/uploads (Next static)
 */

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

/** Server yoki client — uploads bazasi (kelajakda CDN/API uchun) */
export function getUploadsOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_UPLOADS_ORIGIN?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') return '';
  return '';
}

export function fixImgUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;

  const trimmed = url.trim();
  if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed;

  const origin = getUploadsOrigin();
  if (trimmed.startsWith('/uploads/')) {
    return origin ? `${origin}${trimmed}` : trimmed;
  }
  if (trimmed.startsWith('/')) {
    return origin ? `${origin}${trimmed}` : trimmed;
  }

  const path = `/uploads/${trimmed}`;
  return origin ? `${origin}${path}` : path;
}

/** Avatar uchun — yo‘q yoki noto‘g‘ri bo‘lsa default */
export function fixAvatarUrl(url?: string | null): string {
  return fixImgUrl(url) ?? DEFAULT_AVATAR;
}

export { DEFAULT_AVATAR };
