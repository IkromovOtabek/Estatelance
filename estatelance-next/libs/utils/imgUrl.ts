/**
 * Normalize image URL — some old DB records stored only filename without /uploads/ prefix.
 * This ensures all images display correctly regardless of how they were stored.
 */
export function fixImgUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
  return `/uploads/${url}`;
}
