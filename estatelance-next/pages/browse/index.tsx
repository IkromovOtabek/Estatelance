import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { MagnifyingGlass as SearchIcon, Star as StarIcon, MapPin as LocationOnIcon, User as UserIcon, CaretRight } from '@phosphor-icons/react';
import { GET_FREELANCERS } from '../../apollo/user/query';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { User } from '../../libs/types';
import { JobCategory, JOB_CATEGORY_LABELS } from '../../libs/enums';
import { getCatIcon } from '../../libs/utils/jobCategoryIcons';

// ─── Category sidebar item ────────────────────────────────────────────────────
const CatItem = ({
  icon, label, active, onClick,
}: { icon?: React.ReactElement; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
      active
        ? 'bg-indigo-50 text-indigo-600 font-semibold'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {icon && <span className="flex-shrink-0 flex items-center">{icon}</span>}
    <span className="truncate">{label}</span>
  </button>
);

// ─── Freelancer Card ──────────────────────────────────────────────────────────
const FreelancerListCard = ({ freelancer }: { freelancer: User }) => {
  const catKey = freelancer.freelancerCategory ?? 'OTHER';
  const catLabel = freelancer.freelancerCategory
    ? JOB_CATEGORY_LABELS[freelancer.freelancerCategory as JobCategory]
    : 'Boshqa';
  const isAvailable = freelancer.availability === 'AVAILABLE';
  const displayName = freelancer.fullName ?? freelancer.username ?? '';

  return (
    <Link href={`/profile/${freelancer._id}`} className="block no-underline group">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-4 items-start cursor-pointer transition-all duration-200 hover:border-indigo-200 hover:shadow-lg hover:-translate-y-0.5">

        {/* Avatar with online indicator */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-100 bg-indigo-50 flex items-center justify-center overflow-hidden text-indigo-600 font-bold text-xl">
            {freelancer.profileImage ? (
              <img src={freelancer.profileImage} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{displayName[0]?.toUpperCase() ?? 'F'}</span>
            )}
          </div>
          <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isAvailable ? 'bg-green-500' : 'bg-amber-400'}`} />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">

          {/* Name + rating */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-base text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                {displayName}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">@{freelancer.username}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <StarIcon size={14} color="#f59e0b" weight="fill" />
              <span className="text-sm font-bold text-slate-900">
                {freelancer.averageRating?.toFixed(1) ?? '5.0'}
              </span>
              <span className="text-xs text-slate-400">({freelancer.completedJobCount ?? 0})</span>
            </div>
          </div>

          {/* Category + rate + availability chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-md">
              {catLabel}
            </span>
            {freelancer.hourlyRate && (
              <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md">
                ${freelancer.hourlyRate}/soat
              </span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {isAvailable ? "Bo'sh" : 'Band'}
            </span>
          </div>

          {/* Bio */}
          {freelancer.bio && (
            <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
              {freelancer.bio}
            </p>
          )}

          {/* Skills + location + button row */}
          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <div className="flex flex-wrap gap-1">
              {freelancer.skills?.slice(0, 4).map(skill => (
                <span key={skill} className="text-xs px-2 py-0.5 rounded border border-slate-200 text-slate-500 bg-white">
                  {skill}
                </span>
              ))}
              {(freelancer.skills?.length ?? 0) > 4 && (
                <span className="text-xs text-slate-400 self-center">+{freelancer.skills!.length - 4}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {freelancer.location && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <LocationOnIcon size={12} color="#94a3b8" />
                  <span className="text-xs text-slate-400">{freelancer.location}</span>
                </div>
              )}
              <Link
                href={`/profile/${freelancer._id}`}
                className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                onClick={e => e.stopPropagation()}
              >
                Profilni ko'rish
                <CaretRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ─── Browse Page ──────────────────────────────────────────────────────────────
const BrowsePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data, loading } = useQuery(GET_FREELANCERS, {
    variables: {
      input: {
        page: 1,
        limit: 30,
        category: selectedCategory || undefined,
        searchText: searchText || undefined,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const allFreelancers: User[] = data?.getFreelancers ?? [];

  // Client-side filter by rate & availability
  const freelancers = allFreelancers.filter(f => {
    if (availableOnly && f.availability !== 'AVAILABLE') return false;
    if (minRate && (f.hourlyRate ?? 0) < Number(minRate)) return false;
    if (maxRate && (f.hourlyRate ?? 0) > Number(maxRate)) return false;
    return true;
  });

  return (
    <>
      <Head>
        <title>Frilanserlar — BuFu | O'zbekiston mutaxassislari</title>
        <meta name="description" content="O'zbekistondagi eng yaxshi frilanserlar. IT dasturchilar, dizaynerlar, fotosuratchilar va boshqa mutaxassislarni toping." />
        <link rel="canonical" href="https://bufu.uz/browse" />
      </Head>

      {/* ── Search bar (full width, top) ── */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <SearchIcon size={18} color="#94a3b8" />
          </span>
          <input
            type="text"
            placeholder="Mutaxassis, ko'nikma yoki lavozim bo'yicha qidirish..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setSearchText(searchInput); }}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm"
          />
          <button
            onClick={() => setSearchText(searchInput)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Qidirish
          </button>
        </div>
      </div>

      {/* ── Mobile filter toggle ── */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filtr
        </button>
      </div>

      <div className="flex gap-6 items-start">

        {/* ════ LEFT SIDEBAR ════ */}
        <aside className={`w-60 flex-shrink-0 sticky top-20 space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>

          {/* Categories */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 overflow-hidden">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-1 pb-1">
              Kategoriyalar
            </p>
            <CatItem label="Hammasi" active={!selectedCategory} onClick={() => setSelectedCategory('')} />
            <hr className="my-1 border-slate-100 mx-2" />
            {Object.values(JobCategory).map(cat => (
              <CatItem
                key={cat}
                icon={getCatIcon(cat, 16)}
                label={JOB_CATEGORY_LABELS[cat]}
                active={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              />
            ))}
          </div>

          {/* Hourly rate filter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-700 mb-3">Soatlik narx ($)</p>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={minRate}
                onChange={e => setMinRate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                min={0}
              />
              <span className="text-slate-400 text-sm flex-shrink-0">—</span>
              <input
                type="number"
                placeholder="Max"
                value={maxRate}
                onChange={e => setMaxRate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                min={0}
              />
            </div>
          </div>

          {/* Availability filter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-700 mb-3">Mavjudlik</p>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={e => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                Faqat bo'sh mutaxassislar
              </span>
            </label>
          </div>

          {/* Rating filter placeholder */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-700 mb-3">Reyting</p>
            {[5, 4, 3].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer py-1 group">
                <input type="checkbox" className="w-4 h-4 rounded accent-indigo-600" />
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon key={i} size={12} color={i < r ? '#f59e0b' : '#e2e8f0'} weight={i < r ? 'fill' : 'regular'} />
                  ))}
                  <span className="text-xs text-slate-500 ml-1 group-hover:text-slate-800 transition-colors">{r}+ yulduz</span>
                </div>
              </label>
            ))}
          </div>
        </aside>

        {/* ════ MAIN CONTENT ════ */}
        <div className="flex-1 min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">
                {selectedCategory ? JOB_CATEGORY_LABELS[selectedCategory as JobCategory] : 'Barcha frilanserlar'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {loading ? 'Yuklanmoqda...' : `${freelancers.length} ta mutaxassis topildi`}
              </p>
            </div>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory('')}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                Tozalash
              </button>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Yuklanmoqda...</p>
            </div>
          ) : freelancers.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
              <UserIcon size={48} color="#94a3b8" className="mx-auto mb-3" />
              <p className="font-semibold text-slate-700 mb-1">Frilanser topilmadi</p>
              <p className="text-sm text-slate-400">Boshqa kategoriya yoki qidiruv so'zini sinab ko'ring</p>
            </div>
          ) : (
            <div className="space-y-3">
              {freelancers.map(f => (
                <FreelancerListCard key={f._id} freelancer={f} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default withLayoutBasic(BrowsePage);
