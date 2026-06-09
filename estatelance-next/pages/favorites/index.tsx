import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { BookmarkSimple, ArrowRight, Trash } from '@phosphor-icons/react';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import JobCard from '../../libs/components/common/JobCard';
import { useFavorites } from '../../libs/hooks/useFavorites';

const FavoritesPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === 'dark';

  const { favorites, count, clear } = useFavorites();

  return (
    <>
      <Head><title>Sevimlilar — BuFu</title></Head>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex items-center justify-center"
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: isDark ? 'rgba(99,102,241,0.14)' : '#EEF2FF',
                  color: isDark ? '#818CF8' : '#4F46E5',
                }}
              >
                <BookmarkSimple size={22} weight="fill" />
              </span>
              <h1 className="text-2xl font-black" style={{ color: isDark ? '#F4F4F5' : '#0F172A', letterSpacing: '-0.02em' }}>
                Sevimlilar
              </h1>
            </div>
            <p className="mt-1.5 text-sm" style={{ color: isDark ? '#A1A1AA' : '#64748B' }}>
              {count > 0 ? `${count} ta saqlangan ish` : 'Saqlangan ishlaringiz shu yerda ko\'rinadi'}
            </p>
          </div>

          {count > 0 && (
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: isDark ? '#A1A1AA' : '#64748B' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? '#F87171' : '#DC2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? '#A1A1AA' : '#64748B')}
            >
              <Trash size={16} /> Tozalash
            </button>
          )}
        </div>

        {/* List / empty */}
        {count === 0 ? (
          <div
            className="text-center py-20 rounded-3xl border"
            style={{
              backgroundColor: isDark ? '#16161F' : '#FFFFFF',
              borderColor: isDark ? '#27272F' : '#E2E8F0',
            }}
          >
            <span
              className="inline-flex items-center justify-center mb-5"
              style={{
                width: 72, height: 72, borderRadius: 20,
                background: isDark ? 'rgba(99,102,241,0.1)' : '#F1F5F9',
                color: isDark ? '#71717A' : '#94A3B8',
              }}
            >
              <BookmarkSimple size={34} />
            </span>
            <h3 className="text-lg font-bold mb-2" style={{ color: isDark ? '#F4F4F5' : '#0F172A' }}>
              Hozircha sevimlilar yo'q
            </h3>
            <p className="text-sm mb-7 max-w-sm mx-auto" style={{ color: isDark ? '#A1A1AA' : '#64748B' }}>
              Yoqqan ishlarni saqlash uchun karta ustidagi <b>saqlash</b> (zakladka) tugmasini bosing.
            </p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 no-underline font-semibold text-sm"
              style={{
                background: isDark ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#4F46E5',
                color: '#fff', padding: '12px 24px', borderRadius: 12,
                boxShadow: isDark ? '0 4px 16px rgba(99,102,241,0.35)' : '0 4px 14px rgba(79,70,229,0.28)',
              }}
            >
              Ishlarni ko'rish <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {favorites.map((job) => (
              <JobCard key={job._id} job={job} isDark={isDark} removeMode />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default withLayoutBasic(FavoritesPage);
