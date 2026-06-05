/** Target havola ko‘rinishi (API dan kelgan URL) */

export function targetPathForLink(url: string): string {
  if (url.startsWith('/')) return url;
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

/** Tashqi sayt (masalan uzdev.uz); platforma /jobs havolasi ichki */
export function isExternalTargetUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  return !/\/jobs\/[^/]+/.test(url);
}

export function formatTargetUrlDisplay(url: string): string {
  if (url.startsWith('/')) return url;
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}
