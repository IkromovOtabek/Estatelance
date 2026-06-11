import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CaretLeft,
  CaretRight,
  Lightning,
  Star,
  User as UserIcon,
} from '@phosphor-icons/react';
import { User } from '../../types';
import { isJobBoostActive } from '../../utils/boost';
import { JOB_CATEGORY_LABELS, JobCategory } from '../../enums';

const AUTO_INTERVAL_MS = 5000;

type Props = {
  freelancers: User[];
  loading: boolean;
  showHeadline?: boolean;
};

const GRADIENTS = [
  'linear-gradient(135deg,#6366F1,#818CF8)',
  'linear-gradient(135deg,#0891B2,#22D3EE)',
  'linear-gradient(135deg,#7C3AED,#C084FC)',
  'linear-gradient(135deg,#16A34A,#4ADE80)',
  'linear-gradient(135deg,#D97706,#FBBF24)',
];

function getCategoryLabel(category?: string | null): string {
  if (!category) return 'Frilanser';
  return JOB_CATEGORY_LABELS[category as JobCategory] ?? category;
}

function StackSkeleton() {
  return (
    <div className="hero-freelancer-stack" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="hero-fc-card hero-fc-card--skeleton"
          style={{
            zIndex: 3 - i,
            transform: `translateX(${i * 28}px) scale(${1 - i * 0.06})`,
            opacity: 1 - i * 0.25,
          }}
        />
      ))}
    </div>
  );
}

function FreelancerStackCard({
  freelancer,
  offset,
  total,
  onSelect,
}: {
  freelancer: User;
  offset: number;
  total: number;
  onSelect: () => void;
}) {
  const displayName = freelancer.fullName ?? freelancer.username ?? 'Frilanser';
  const category = getCategoryLabel(freelancer.freelancerCategory);
  const rating = freelancer.averageRating?.toFixed(1) ?? '5.0';
  const isBoosted = isJobBoostActive(freelancer);
  const isActive = offset === 0;
  const grad = GRADIENTS[offset % GRADIENTS.length];
  const initial = displayName[0]?.toUpperCase() ?? 'U';

  const tx = offset * 36;
  const scale = 1 - offset * 0.055;
  const opacity = offset > 3 ? 0 : 1 - offset * 0.22;

  return (
    <article
      className={`hero-fc-card${isActive ? ' hero-fc-card--active' : ' hero-fc-card--back'}`}
      style={{
        zIndex: total - offset,
        transform: `translateX(${tx}px) scale(${scale})`,
        opacity,
        pointerEvents: isActive ? 'auto' : 'none',
      }}
      aria-hidden={!isActive}
    >
      <div className="hero-fc-visual">
        {isBoosted && (
          <span className="hero-fc-top">
            <Lightning size={12} weight="fill" /> TOP
          </span>
        )}
        <div className="hero-fc-avatar-lg-wrap">
          {freelancer.profileImage ? (
            <img src={freelancer.profileImage} alt={displayName} className="hero-fc-avatar-lg" />
          ) : (
            <div className="hero-fc-avatar-lg hero-fc-avatar-lg--fallback" style={{ background: grad }}>
              <span>{initial}</span>
            </div>
          )}
        </div>
        <div className="hero-fc-profile-pill">
          {freelancer.profileImage ? (
            <img src={freelancer.profileImage} alt="" className="hero-fc-avatar-sm" />
          ) : (
            <span className="hero-fc-avatar-sm hero-fc-avatar-sm--fallback" style={{ background: grad }}>
              {initial}
            </span>
          )}
          <div className="hero-fc-profile-meta">
            <span className="hero-fc-name">{displayName}</span>
            <span className="hero-fc-cat">{category}</span>
          </div>
        </div>
        <div className="hero-fc-rating-row">
          <Star size={14} weight="fill" color="#F59E0B" />
          <span>{rating}</span>
          <span className="hero-fc-rating-sep">·</span>
          <span
            className="hero-fc-avail"
            data-status={freelancer.availability === 'AVAILABLE' ? 'on' : 'off'}
          >
            {freelancer.availability === 'AVAILABLE' ? 'Online' : 'Band'}
          </span>
        </div>
      </div>

      <div className="hero-fc-body">
        <div className="hero-fc-stats">
          <div>
            <span className="hero-fc-stat-val">{freelancer.completedJobCount ?? 0}</span>
            <span className="hero-fc-stat-lbl">Ishlar</span>
          </div>
          <div>
            <span className="hero-fc-stat-val">
              {freelancer.hourlyRate ? `$${freelancer.hourlyRate}` : '—'}
            </span>
            <span className="hero-fc-stat-lbl">Soatlik</span>
          </div>
          <div>
            <span className="hero-fc-stat-val">{rating}</span>
            <span className="hero-fc-stat-lbl">Reyting</span>
          </div>
        </div>
        <Link
          href={`/profile/${freelancer._id}`}
          className="hero-fc-cta"
          onClick={(e) => { if (!isActive) e.preventDefault(); }}
        >
          Profilni ko&apos;rish
          <ArrowUpRight size={16} weight="bold" />
        </Link>
      </div>

      {!isActive && (
        <button type="button" className="hero-fc-select-hit" onClick={onSelect} aria-label={`${displayName} profilini ko'rish`} />
      )}
    </article>
  );
}

export default function HeroTopFreelancers({ freelancers, loading, showHeadline = true }: Props) {
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const count = freelancers.length;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (count <= 1) return;
      setActive((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => {
      if (!pausedRef.current) go(1);
    }, AUTO_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [count, go]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  const onTouchStart = (e: React.TouchEvent) => {
    pause();
    touchStart.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null || count <= 1) {
      resume();
      return;
    }
    const end = e.changedTouches[0]?.clientX ?? touchStart.current;
    const diff = end - touchStart.current;
    if (Math.abs(diff) > 40) go(diff < 0 ? 1 : -1);
    touchStart.current = null;
    window.setTimeout(resume, AUTO_INTERVAL_MS);
  };

  if (loading) {
    return (
      <div className="hero-freelancers-hero">
        {showHeadline && (
          <div className="hero-freelancers-head">
            <span className="hero-eyebrow">✦ Top 5 Frilanserlar</span>
          </div>
        )}
        <StackSkeleton />
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="hero-freelancers-hero">
        <div className="hero-fc-empty">
          <UserIcon size={40} weight="duotone" />
          <p>Tez orada frilanserlar qo&apos;shiladi</p>
          <Link href="/browse" className="hero-fc-cta hero-fc-cta--ghost">
            Barcha mutaxassislarni ko&apos;rish
            <ArrowUpRight size={16} weight="bold" />
          </Link>
        </div>
      </div>
    );
  }

  const safeActive = active >= count ? 0 : active;

  return (
    <div
      className="hero-freelancers-hero"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {showHeadline && (
        <div className="hero-freelancers-head">
          <span className="hero-eyebrow">✦ Top 5 Frilanserlar</span>
        </div>
      )}

      <div className="hero-freelancer-stack-wrap">
        {count > 1 && (
          <button
            type="button"
            className="hero-fc-nav hero-fc-nav--prev"
            onClick={() => go(-1)}
            aria-label="Oldingi frilanser"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
        )}

        <div className="hero-freelancer-stack" role="region" aria-label="Top frilanserlar">
          {freelancers.map((f, i) => {
            const offset = (i - safeActive + count) % count;
            return (
              <FreelancerStackCard
                key={f._id}
                freelancer={f}
                offset={offset}
                total={count}
                onSelect={() => setActive(i)}
              />
            );
          })}
        </div>

        {count > 1 && (
          <button
            type="button"
            className="hero-fc-nav hero-fc-nav--next"
            onClick={() => go(1)}
            aria-label="Keyingi frilanser"
          >
            <CaretRight size={18} weight="bold" />
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="hero-fc-dots" role="tablist" aria-label="Frilanser tanlash">
          {freelancers.map((f, i) => (
            <button
              key={f._id}
              type="button"
              role="tab"
              aria-selected={i === safeActive}
              className={i === safeActive ? 'is-active' : ''}
              onClick={() => setActive(i)}
              aria-label={`${f.fullName ?? f.username ?? 'Frilanser'} — ${i + 1}/${count}`}
            />
          ))}
        </div>
      )}

      <Link href="/browse" className="hero-fc-browse-link no-underline">
        Barcha frilanserlarni ko&apos;rish
        <ArrowUpRight size={16} weight="bold" />
      </Link>
    </div>
  );
}
