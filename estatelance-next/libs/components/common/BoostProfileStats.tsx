import React from 'react';
import type { User } from '../../types';
import { isJobBoostActive } from '../../utils/boost';
import { UserType } from '../../enums';

function daysLeft(expiresAt?: string): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

interface BoostProfileStatsProps {
  user: User;
}

export default function BoostProfileStats({ user }: BoostProfileStatsProps) {
  const status = user.boostPaymentStatus ?? 'NONE';
  const isBoosted = isJobBoostActive(user);
  const isPausedByAdmin =
    !!user.boostExpiresAt &&
    new Date(user.boostExpiresAt).getTime() > Date.now() &&
    !!user.boostPausedByAdmin;
  const views = user.profileViewCount ?? 0;
  const followers = user.followerCount ?? 0;
  const viewsSince = Math.max(0, views - (user.boostViewsAtStart ?? 0));
  const followersSince = Math.max(0, followers - (user.boostFollowersAtStart ?? 0));
  const left = daysLeft(user.boostExpiresAt);
  const listHint =
    user.userType === UserType.FREELANCER
      ? "Frilanserlar ro'yxatida tepada ko'rinasiz."
      : "Profilingiz ajratilgan ko'rinishda.";

  if (status === 'PENDING') {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-xs text-amber-900 dark:text-amber-200">
        <p className="font-bold">Profil boost — admin tekshiruvida</p>
        <p className="mt-0.5 text-amber-800 dark:text-amber-300/90">
          {user.boostRequestedPlan ?? '—'} tarifi · chek yuborildi{' '}
          {user.boostPaymentSubmittedAt
            ? new Date(user.boostPaymentSubmittedAt).toLocaleString('uz-UZ')
            : ''}
        </p>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="mt-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2.5 text-xs text-red-800 dark:text-red-300">
        <p className="font-bold">Profil boost rad etildi</p>
        {user.boostPaymentRejectReason && <p className="mt-0.5">{user.boostPaymentRejectReason}</p>}
        <p className="mt-1 text-red-700 dark:text-red-400">Yangi chek yuklab qayta yuborishingiz mumkin.</p>
      </div>
    );
  }

  if (isPausedByAdmin) {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/35 px-3 py-2.5">
        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
          Profil boost pauzada (admin) · {user.boostPlan ?? '—'} · {left} kun qoldi
        </p>
      </div>
    );
  }

  if (!isBoosted && status !== 'APPROVED') return null;

  return (
    <div className="mt-3 rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/80 dark:bg-violet-950/35 px-3 py-2.5">
      <p className="text-xs font-bold text-violet-900 dark:text-violet-200">
        Profil boost faol · {user.boostPlan ?? '—'} · {left} kun qoldi
      </p>
      <p className="mt-1 text-[10px] text-violet-700 dark:text-violet-400">{listHint}</p>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-violet-800 dark:text-violet-300">
        <span>
          <strong className="text-violet-950 dark:text-violet-100">{viewsSince}</strong> profil ko&apos;rinishi
        </span>
        <span>
          <strong className="text-violet-950 dark:text-violet-100">{followersSince}</strong> yangi obunachi
        </span>
        <span className="text-violet-600 dark:text-violet-400">
          Jami: {views} ko&apos;r. · {followers} obuna
        </span>
      </div>
      {user.boostPaidAt && (
        <p className="mt-1 text-[10px] text-violet-600 dark:text-violet-500">
          Tasdiq: {new Date(user.boostPaidAt).toLocaleDateString('uz-UZ')}
        </p>
      )}
    </div>
  );
}
