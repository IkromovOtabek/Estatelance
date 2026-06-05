import React from 'react';
import type { Job } from '../../types';
import { isJobBoostActive } from '../../utils/boost';

function daysLeft(expiresAt?: string): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

interface BoostAgentStatsProps {
  job: Job;
}

export default function BoostAgentStats({ job }: BoostAgentStatsProps) {
  const status = job.boostPaymentStatus ?? 'NONE';
  const isBoosted = isJobBoostActive(job);
  const isPausedByAdmin =
    !!job.boostExpiresAt &&
    new Date(job.boostExpiresAt).getTime() > Date.now() &&
    !!job.boostPausedByAdmin;
  const views = job.viewCount ?? 0;
  const bids = job.bidCount ?? 0;
  const viewsSince = Math.max(0, views - (job.boostViewsAtStart ?? 0));
  const bidsSince = Math.max(0, bids - (job.boostBidsAtStart ?? 0));
  const left = daysLeft(job.boostExpiresAt);

  if (status === 'PENDING') {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-xs text-amber-900 dark:text-amber-200">
        <p className="font-bold">Boost to&apos;lovi — admin tekshiruvida</p>
        <p className="mt-0.5 text-amber-800 dark:text-amber-300/90">
          {job.boostRequestedPlan ?? '—'} tarifi · chek yuborildi{' '}
          {job.boostPaymentSubmittedAt
            ? new Date(job.boostPaymentSubmittedAt).toLocaleString('uz-UZ')
            : ''}
        </p>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="mt-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2.5 text-xs text-red-800 dark:text-red-300">
        <p className="font-bold">Boost to&apos;lovi rad etildi</p>
        {job.boostPaymentRejectReason && (
          <p className="mt-0.5">{job.boostPaymentRejectReason}</p>
        )}
        <p className="mt-1 text-red-700 dark:text-red-400">Yangi chek yuklab qayta yuborishingiz mumkin.</p>
      </div>
    );
  }

  if (isPausedByAdmin) {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/35 px-3 py-2.5">
        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
          Boost pauzada (admin) · {job.boostPlan ?? '—'} · {left} kun qoldi
        </p>
        <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400">
          Target vaqtincha o&apos;chirilgan. Admin Start qilgach qayta ko&apos;rinadi.
        </p>
      </div>
    );
  }

  if (!isBoosted && status !== 'APPROVED') return null;

  return (
    <div className="mt-3 rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/80 dark:bg-violet-950/35 px-3 py-2.5">
      <p className="text-xs font-bold text-violet-900 dark:text-violet-200">
        Boost faol · {job.boostPlan ?? '—'} · {left} kun qoldi
      </p>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-violet-800 dark:text-violet-300">
        <span>
          <strong className="text-violet-950 dark:text-violet-100">{viewsSince}</strong> ko&apos;rinish (boostdan keyin)
        </span>
        <span>
          <strong className="text-violet-950 dark:text-violet-100">{bidsSince}</strong> yangi taklif
        </span>
        <span className="text-violet-600 dark:text-violet-400">
          Jami: {views} ko&apos;r. · {bids} taklif
        </span>
      </div>
      {job.boostPaidAt && (
        <p className="mt-1 text-[10px] text-violet-600 dark:text-violet-500">
          Tasdiq: {new Date(job.boostPaidAt).toLocaleDateString('uz-UZ')}
        </p>
      )}
    </div>
  );
}
