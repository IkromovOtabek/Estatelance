import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Eye,
  MegaphoneSimple,
  Gear,
  ArrowLeft,
  House,
} from '@phosphor-icons/react';
import { TARGETS_TABS, adminTargetsHref } from '../../admin/admin-config';

const NAV_ICONS: Record<string, React.ReactElement> = {
  track_changes: <MegaphoneSimple size={20} weight="duotone" />,
  campaign: <MegaphoneSimple size={20} weight="duotone" />,
  visibility: <Eye size={20} weight="duotone" />,
};

interface AdminSubSidebarProps {
  activeNavId?: string;
  backHref: string;
}

export default function AdminSubSidebar({
  activeNavId = 'ads',
  backHref,
}: AdminSubSidebarProps) {
  const router = useRouter();

  return (
    <aside className="w-64 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-[#16161F] fixed top-0 left-0 h-full flex flex-col py-6 px-3 z-30">
      <div className="px-3 mb-8">
        <h1 className="text-xl font-black text-indigo-700 dark:text-indigo-400">BuFu Admin</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Marketplace Controller</p>
      </div>

      <nav className="flex-1 space-y-1">
        {TARGETS_TABS.map((item) => {
          const active = item.id === activeNavId;
          return (
            <Link
              key={item.id}
              href={adminTargetsHref(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border-r-4 border-indigo-600'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#16161F] hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {NAV_ICONS[item.icon] ?? <MegaphoneSimple size={20} />}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pt-4 border-t border-slate-100 dark:border-[#16161F] space-y-1">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-xl transition-colors text-left"
        >
          <ArrowLeft size={20} />
          Ortga qaytish
        </button>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#16161F] rounded-xl transition-colors"
        >
          <House size={20} />
          Bosh sahifaga
        </Link>
      </div>
    </aside>
  );
}
