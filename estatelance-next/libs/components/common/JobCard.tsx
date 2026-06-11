import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import {
  Fire, Clock, MapPin, SealCheck, BookmarkSimple, TrendUp,
} from '@phosphor-icons/react';
import { Job } from '../../types';
import { useFavorites } from '../../hooks/useFavorites';
import { userVar } from '../../../apollo/store';

// ─── Tajriba / format label'lari ──────────────────────────────────────────────
const EXP_LABELS: Record<string, string> = {
  NONE:   'Tajriba shart emas',
  JUNIOR: 'Tajriba: 1–3 yil',
  MIDDLE: 'Tajriba: 3–6 yil',
  SENIOR: 'Tajriba: 6+ yil',
  ANY:    'Istalgan daraja',
};
const FORMAT_LABELS: Record<string, string> = {
  ONSITE: 'Ish joyida', REMOTE: 'Masofaviy', HYBRID: 'Gibrid',
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'hozirgina';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'hozirgina';
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

function formatSalary(job: Job): { amount: string; period: string } {
  if (job.salaryFrom && job.salaryTo)
    return { amount: `$${job.salaryFrom.toLocaleString()} – $${job.salaryTo.toLocaleString()}`, period: '/ oy' };
  if (job.salaryFrom) return { amount: `$${job.salaryFrom.toLocaleString()}+`, period: '/ oy' };
  if (job.budget) return { amount: `$${job.budget.toLocaleString()}`, period: '/ loyiha' };
  return { amount: 'Kelishilgan', period: '' };
}

interface Props {
  job: Job;
  hot?: boolean;
  isDark?: boolean;
  /** Favorit holatda saqlash tugmasi o'rniga "o'chirish" qiladi (Sevimlilar sahifasi) */
  removeMode?: boolean;
}

const JobCard = ({ job, hot, isDark, removeMode }: Props) => {
  const router = useRouter();
  const user = useReactiveVar(userVar);
  const isLoggedIn = !!user._id;
  const { isFavorite, toggle, remove } = useFavorites();
  const saved = isFavorite(job._id);
  const sal = formatSalary(job);
  const viewers = job.viewCount && job.viewCount > 0 ? job.viewCount : null;
  const isHot = hot || (job.bidCount ?? 0) >= 4;

  // Token-driven ranglar — endi isDark ternary'lari yo'q, CSS o'zgaruvchilari
  // (app.scss `.dark` bloki) light/dark'ni avtomatik almashtiradi.
  const c = {
    card:   'var(--surface)',
    border: 'var(--border)',
    title:  'var(--text-1)',
    body:   'var(--text-2)',
    muted:  'var(--text-3)',
    faint:  'var(--text-4)',
    chip:   'var(--surface-3)',
    chipTx: 'var(--text-2)',
    verify: 'var(--info)',
    danger: 'var(--danger)',
  };

  // Saqlash: sevimlilarga qo'shadi va Sevimlilar sahifasiga o'tadi.
  // removeMode (Sevimlilar sahifasida): o'chiradi.
  // Guest bo'lsa — auth modal ochiladi va amal bekor qilinadi.
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (removeMode) { remove(job._id); return; }
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent('bufu-auth-required'));
      return; // amal bekor qilindi
    }
    if (!saved) toggle(job);
    router.push('/favorites');
  };

  return (
    <Link href={`/jobs/${job._id}`} className="no-underline block group h-full">
      <div
        className="job-card card-base cursor-pointer h-full flex flex-col"
        style={{ padding: '22px 24px' }}
      >
        {/* 1. Jonli ko'ruvchilar / sana */}
        <div className="flex items-center gap-2 mb-3" style={{ fontSize: 13, color: c.faint, fontWeight: 500 }}>
          {viewers ? (
            <>
              <span style={{ position: 'relative', width: 7, height: 7 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22C55E' }} />
                <span className="live-ping" style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: 'rgba(34,197,94,0.3)' }} />
              </span>
              Hozir {viewers} kishi ko'rmoqda
            </>
          ) : (
            <><Clock size={13} /> {timeAgo(job.createdAt)}</>
          )}
        </div>

        {/* 2. Sarlavha + hot */}
        <h3 className="leading-snug mb-3" style={{ fontSize: 19, fontWeight: 700, color: c.title, letterSpacing: '-0.01em', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span className="line-clamp-2">{job.title}</span>
          {isHot && <Fire size={18} weight="fill" style={{ color: '#EF5A3C', flexShrink: 0, marginTop: 2 }} />}
        </h3>

        {/* 3. Maosh + badge'lar */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span style={{ fontSize: 19, fontWeight: 700, color: c.title, letterSpacing: '-0.01em' }}>
            {sal.amount}{sal.period && <span style={{ fontSize: 14, fontWeight: 500, color: c.muted }}> {sal.period}</span>}
          </span>
          {job.experienceLevel && EXP_LABELS[job.experienceLevel] && (
            <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12.5, fontWeight: 500, background: c.chip, color: c.chipTx, padding: '6px 12px', borderRadius: 9 }}>
              <TrendUp size={13} /> {EXP_LABELS[job.experienceLevel]}
            </span>
          )}
          {job.workFormat?.[0] && FORMAT_LABELS[job.workFormat[0]] && (
            <span style={{ fontSize: 12.5, fontWeight: 500, background: c.chip, color: c.chipTx, padding: '6px 12px', borderRadius: 9 }}>
              {FORMAT_LABELS[job.workFormat[0]]}
            </span>
          )}
        </div>

        {/* 4. Kompaniya + verified */}
        {job.agentName && (
          <div className="flex items-center gap-1.5 mb-2" style={{ fontSize: 14.5, color: c.body, fontWeight: 500 }}>
            {job.agentName}
            <SealCheck size={16} weight="fill" style={{ color: c.verify }} />
          </div>
        )}

        {/* 5. Manzil */}
        {job.location && (
          <div className="flex items-center gap-1.5 mb-5" style={{ fontSize: 13.5, color: c.muted }}>
            <MapPin size={15} style={{ color: c.faint, flexShrink: 0 }} />
            <span className="line-clamp-1">{job.location}</span>
          </div>
        )}

        {/* 6. Amallar — kartaning eng pastida (mt-auto bilan bir xil balandlik) */}
        <div className="flex items-center gap-2.5 mt-auto pt-3">
          <span className="btn-primary flex-1 justify-center whitespace-nowrap" style={{ pointerEvents: 'none' }}>
            Ariza yuborish
          </span>
          <button
            onClick={handleSave}
            aria-label={removeMode ? 'O\'chirish' : 'Sevimlilarga saqlash'}
            className="inline-flex items-center justify-center transition-all shrink-0"
            style={{
              width: 44, height: 44, borderRadius: 11,
              border: `1px solid ${removeMode ? c.danger : (saved ? c.verify : c.border)}`,
              background: !removeMode && saved ? 'var(--primary-bg)' : 'transparent',
              color: removeMode ? c.danger : (saved ? c.verify : c.muted),
              cursor: 'pointer',
            }}
          >
            <BookmarkSimple size={18} weight={removeMode || saved ? 'fill' : 'regular'} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
