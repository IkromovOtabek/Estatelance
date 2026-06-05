/** Boost foydalanuvchilarga ko'rinadi (admin pauzada emas) */

export function parseBoostMs(value?: string | number | null): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

export function isJobBoostActive(entity: {
  boostExpiresAt?: string | number | null;
  boostPausedByAdmin?: boolean | null;
}): boolean {
  if (entity.boostPausedByAdmin) return false;
  const exp = parseBoostMs(entity.boostExpiresAt);
  return exp != null && exp > Date.now();
}

function boostSortMs(entity: {
  boostExpiresAt?: string | number | null;
  boostPausedByAdmin?: boolean | null;
  bumpedAt?: string | number | null;
  boostPaidAt?: string | number | null;
  boostPaymentReviewedAt?: string | number | null;
}): number {
  if (!isJobBoostActive(entity)) return 0;
  return (
    parseBoostMs(entity.bumpedAt) ??
    parseBoostMs(entity.boostPaidAt) ??
    parseBoostMs(entity.boostPaymentReviewedAt) ??
    Date.now()
  );
}

/** Faol boostli yozuvlar ro'yxat tepasida */
export function compareBoostFirst<T extends {
  boostExpiresAt?: string | number | null;
  boostPausedByAdmin?: boolean | null;
  bumpedAt?: string | number | null;
  boostPaidAt?: string | number | null;
  boostPaymentReviewedAt?: string | number | null;
}>(a: T, b: T, thenCompare: (x: T, y: T) => number): number {
  const aMs = boostSortMs(a);
  const bMs = boostSortMs(b);
  if (aMs !== bMs) return bMs - aMs;
  return thenCompare(a, b);
}

/** @deprecated compareBoostFirst ishlating */
export function compareJobsBoostFirst<T extends {
  boostExpiresAt?: string | number | null;
  boostPausedByAdmin?: boolean | null;
  bumpedAt?: string | number | null;
  boostPaidAt?: string | number | null;
  boostPaymentReviewedAt?: string | number | null;
}>(a: T, b: T, thenCompare: (x: T, y: T) => number): number {
  return compareBoostFirst(a, b, thenCompare);
}
