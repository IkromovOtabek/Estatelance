import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CaretLeft,
  CaretRight,
  ChatCircle,
  Eye,
  Heart,
  Article as ArticleIcon,
} from '@phosphor-icons/react';
import { Post } from '../../types';

const AUTO_INTERVAL_MS = 6200;
const SWIPE_EASE = 'cubic-bezier(0.12, 1, 0.32, 1)';
const SWIPE_DURATION = '1.35s';

type Props = {
  posts: Post[];
  loading: boolean;
};

type SwipeDirection = 1 | -1;

type CardSlot = 'center' | 'left' | 'right' | 'hidden';

type SlotMetrics = {
  xPct: number;
  z: number;
  scale: number;
  rotateY: number;
  opacity: number;
  filter: string;
  parallax: number;
};

const GRADIENTS = [
  'linear-gradient(135deg,#6366F1 0%,#818CF8 100%)',
  'linear-gradient(135deg,#0891B2 0%,#22D3EE 100%)',
  'linear-gradient(135deg,#7C3AED 0%,#C084FC 100%)',
  'linear-gradient(135deg,#16A34A 0%,#4ADE80 100%)',
  'linear-gradient(135deg,#D97706 0%,#FBBF24 100%)',
];

const SWIPE_THRESHOLD = 48;

const SLOT_STYLE: Record<Exclude<CardSlot, 'hidden'>, SlotMetrics> = {
  center: {
    xPct: 0,
    z: 36,
    scale: 1,
    rotateY: 0,
    opacity: 1,
    filter: 'none',
    parallax: 0.22,
  },
  left: {
    xPct: -46,
    z: -52,
    scale: 0.8,
    rotateY: 12,
    opacity: 0.42,
    filter: 'saturate(0.85) brightness(0.88)',
    parallax: 0.14,
  },
  right: {
    xPct: 46,
    z: -52,
    scale: 0.8,
    rotateY: -12,
    opacity: 0.42,
    filter: 'saturate(0.85) brightness(0.88)',
    parallax: 0.14,
  },
};

function fixImgUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/uploads/${url}`;
}

const FALLBACK_COVERS = [
  '/hero/card-design.jpg',
  '/hero/card-photo.jpg',
  '/hero/card-laptop.jpg',
  '/hero/bg-soft.jpg',
];

function getCoverUrl(post: Post, offset: number): string {
  return fixImgUrl(post.imageUrl) ?? FALLBACK_COVERS[offset % FALLBACK_COVERS.length];
}

function excerpt(body?: string, max = 100): string {
  if (!body) return '';
  const plain = body.replace(/\s+/g, ' ').trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).trim()}…`;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'hozirgina';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'hozirgina';
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

function getCardSlot(index: number, active: number, count: number): CardSlot {
  if (count <= 1) return index === active ? 'center' : 'hidden';
  const forward = (index - active + count) % count;
  if (forward === 0) return 'center';
  if (forward === 1) return 'right';
  if (forward === count - 1) return 'left';
  return 'hidden';
}

function getSwipeDirection(from: number, to: number, count: number): SwipeDirection {
  if (from === to || count <= 1) return 1;
  const forward = (to - from + count) % count;
  const backward = (from - to + count) % count;
  return forward <= backward ? 1 : -1;
}

function getHiddenMetrics(direction: SwipeDirection): SlotMetrics {
  return {
    xPct: direction === 1 ? 58 : -58,
    z: -80,
    scale: 0.72,
    rotateY: direction === 1 ? -14 : 14,
    opacity: 0,
    filter: 'saturate(0.75) brightness(0.85)',
    parallax: 0,
  };
}

function getSlotMetrics(slot: CardSlot, direction: SwipeDirection): SlotMetrics {
  if (slot === 'hidden') return getHiddenMetrics(direction);
  return SLOT_STYLE[slot];
}

function getCardMotionStyle(
  slot: CardSlot,
  dragX: number,
  isDragging: boolean,
  direction: SwipeDirection,
): React.CSSProperties {
  const m = getSlotMetrics(slot, direction);
  const shift = dragX * m.parallax;
  const dragScale = slot === 'center'
    ? Math.max(0.94, m.scale - Math.abs(dragX) * 0.00007)
    : m.scale;
  const dragOpacity = slot === 'center'
    ? Math.max(0.82, m.opacity - Math.abs(dragX) * 0.00014)
    : slot === 'hidden'
      ? m.opacity
      : Math.min(0.66, m.opacity + Math.abs(dragX) * 0.0001);

  return {
    transform: `translate3d(calc(${m.xPct}% + ${shift}px), 0, ${m.z}px) scale(${dragScale}) rotateY(${m.rotateY + dragX * -0.005}deg)`,
    opacity: dragOpacity,
    filter: m.filter,
    transition: isDragging
      ? 'none'
      : `transform ${SWIPE_DURATION} ${SWIPE_EASE}, opacity ${SWIPE_DURATION} ${SWIPE_EASE}, filter ${SWIPE_DURATION} ${SWIPE_EASE}`,
  };
}

function StackSkeleton() {
  return (
    <div className="hero-art-stack" aria-hidden="true">
      {(['left', 'center', 'right'] as const).map((slot) => (
        <div key={slot} className={`hero-art-card hero-art-card--skeleton hero-art-card--slot-${slot}`} />
      ))}
    </div>
  );
}

function ArticleCardContent({
  post,
  index,
}: {
  post: Post;
  index: number;
}) {
  const grad = GRADIENTS[index % GRADIENTS.length];
  const cover = getCoverUrl(post, index);
  const initial = post.authorName?.[0]?.toUpperCase() ?? 'A';
  const avatar = fixImgUrl(post.authorAvatar);
  const commentCount = post.comments?.length ?? 0;

  return (
    <>
      <div className="hero-art-cover">
        <img src={cover} alt="" className="hero-art-cover-img" />
        <div className="hero-art-cover-shade" aria-hidden="true" />
        <span className="hero-art-badge">Maqola</span>
      </div>

      <div className="hero-art-body">
        <h3 className="hero-art-title">{post.title}</h3>
        <p className="hero-art-excerpt">{excerpt(post.body)}</p>

        <div className="hero-art-author">
          {avatar ? (
            <img src={avatar} alt="" className="hero-art-author-avatar" />
          ) : (
            <span className="hero-art-author-avatar hero-art-author-avatar--fallback" style={{ background: grad }}>
              {initial}
            </span>
          )}
          <div className="hero-art-author-meta">
            <span className="hero-art-author-name">{post.authorName}</span>
            <span className="hero-art-date">{timeAgo(post.createdAt)}</span>
          </div>
        </div>

        <div className="hero-art-stats">
          <span><Eye size={14} weight="bold" /> {post.viewCount ?? 0}</span>
          <span><Heart size={14} weight="fill" /> {post.likeCount ?? 0}</span>
          <span><ChatCircle size={14} weight="fill" /> {commentCount}</span>
        </div>

        <span className="hero-art-read">
          O&apos;qish
          <ArrowUpRight size={15} weight="bold" />
        </span>
      </div>
    </>
  );
}

function ArticleStackCard({
  post,
  slot,
  index,
  direction,
  onSelect,
  dragX,
  isDragging,
  preventNavClick,
}: {
  post: Post;
  slot: CardSlot;
  index: number;
  direction: SwipeDirection;
  onSelect: () => void;
  dragX: number;
  isDragging: boolean;
  preventNavClick: React.MutableRefObject<boolean>;
}) {
  const isCenter = slot === 'center';
  const isHidden = slot === 'hidden';
  const motionStyle = getCardMotionStyle(slot, dragX, isDragging, direction);

  return (
    <article
      className={[
        'hero-art-card',
        `hero-art-card--slot-${slot}`,
        isCenter ? 'hero-art-card--active' : isHidden ? 'hero-art-card--hidden' : 'hero-art-card--side',
        isDragging ? 'hero-art-card--dragging' : '',
      ].filter(Boolean).join(' ')}
      style={motionStyle}
      aria-hidden={!isCenter}
    >
      <div className="hero-art-card-link">
        <ArticleCardContent post={post} index={index} />
        {isCenter ? (
          <Link
            href={`/articles/${post._id}`}
            className="hero-art-card-link-overlay no-underline"
            aria-label={`${post.title} — o'qish`}
            onClick={(e) => {
              if (preventNavClick.current) {
                e.preventDefault();
                preventNavClick.current = false;
              }
            }}
          />
        ) : (
          !isHidden && (
            <button
              type="button"
              className="hero-art-select-hit"
              onClick={onSelect}
              aria-label={`${post.title} — ko'rish`}
            />
          )
        )}
      </div>
    </article>
  );
}

export default function HeroLatestArticles({ posts, loading }: Props) {
  const [active, setActive] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragMoved = useRef(false);
  const preventNavClick = useRef(false);
  const pausedRef = useRef(false);
  const directionRef = useRef<SwipeDirection>(1);
  const count = posts.length;

  const go = useCallback(
    (dir: SwipeDirection) => {
      if (count <= 1) return;
      directionRef.current = dir;
      setActive((i) => (i + dir + count) % count);
    },
    [count],
  );

  const selectActive = useCallback(
    (index: number) => {
      if (count <= 1) return;
      setActive((current) => {
        directionRef.current = getSwipeDirection(current, index, count);
        return index;
      });
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => {
      if (!pausedRef.current && !isDragging) go(1);
    }, AUTO_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [count, go, isDragging]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  const finishDrag = useCallback((clientX: number) => {
    const diff = clientX - dragStartX.current;
    setIsDragging(false);

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      preventNavClick.current = true;
      go(diff < 0 ? 1 : -1);
    }

    setDragX(0);
    dragMoved.current = false;
    window.setTimeout(resume, AUTO_INTERVAL_MS);
  }, [go]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (count <= 1) return;
    pause();
    dragMoved.current = false;
    preventNavClick.current = false;
    dragStartX.current = e.clientX;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartX.current;
    if (Math.abs(diff) > 6) {
      dragMoved.current = true;
      preventNavClick.current = true;
    }
    setDragX(diff);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    finishDrag(e.clientX);
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    finishDrag(e.clientX);
  };

  if (loading) {
    return (
      <div className="hero-art-carousel">
        <StackSkeleton />
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="hero-art-carousel">
        <div className="hero-art-empty">
          <ArticleIcon size={40} weight="duotone" />
          <p>Tez orada maqolalar paydo bo&apos;ladi</p>
          <Link href="/articles" className="hero-art-read-link no-underline">
            Maqolalar bo&apos;limiga o&apos;tish
            <ArrowUpRight size={16} weight="bold" />
          </Link>
        </div>
      </div>
    );
  }

  const safeActive = active >= count ? 0 : active;
  const direction = directionRef.current;

  return (
    <div
      className="hero-art-carousel"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <div className="hero-art-stack-row">
        <div
          className={`hero-art-stack${isDragging ? ' hero-art-stack--dragging' : ''}`}
          role="region"
          aria-label="So'nggi maqolalar"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {posts.map((post, i) => (
            <ArticleStackCard
              key={post._id}
              post={post}
              slot={getCardSlot(i, safeActive, count)}
              index={i}
              direction={direction}
              dragX={dragX}
              isDragging={isDragging}
              preventNavClick={preventNavClick}
              onSelect={() => selectActive(i)}
            />
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              className="hero-art-nav hero-art-nav--prev"
              onClick={() => go(-1)}
              aria-label="Oldingi maqola"
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <button
              type="button"
              className="hero-art-nav hero-art-nav--next"
              onClick={() => go(1)}
              aria-label="Keyingi maqola"
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="hero-art-footer">
          <div className="hero-art-dots" role="tablist" aria-label="Maqola tanlash">
            {posts.map((post, i) => (
              <button
                key={post._id}
                type="button"
                role="tab"
                aria-selected={i === safeActive}
                className={i === safeActive ? 'is-active' : ''}
                onClick={() => selectActive(i)}
                aria-label={`${post.title} — ${i + 1}/${count}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
