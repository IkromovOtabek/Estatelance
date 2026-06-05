/** Ish yoki profil boost — ro'yxat tartibi va faollik */

export type Boostable = {
  boostExpiresAt?: Date | string | null;
  boostPausedByAdmin?: boolean | null;
  bumpedAt?: Date | string | null;
  boostPaidAt?: Date | string | null;
  boostPaymentReviewedAt?: Date | string | null;
};

export function parseBoostMs(value?: Date | string | null): number | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

export function isBoostActive(entity: Boostable): boolean {
  if (entity.boostPausedByAdmin) return false;
  const exp = parseBoostMs(entity.boostExpiresAt);
  return exp != null && exp > Date.now();
}

/** Ro'yxatda tepaga chiqish uchun vaqt (bumpedAt bo'lmasa paid/reviewed) */
export function boostSortMs(entity: Boostable): number {
  if (!isBoostActive(entity)) return 0;
  return (
    parseBoostMs(entity.bumpedAt) ??
    parseBoostMs(entity.boostPaidAt) ??
    parseBoostMs(entity.boostPaymentReviewedAt) ??
    Date.now()
  );
}

export function compareBoostListing<T extends Boostable>(a: T, b: T): number {
  const aMs = boostSortMs(a);
  const bMs = boostSortMs(b);
  if (aMs !== bMs) return bMs - aMs;
  return 0;
}
