import React from 'react';
import Link from 'next/link';
import { ADMIN_TARGET_QUICK_LINKS } from '../../admin/admin-config';

interface AdminTargetQuickLinksProps {
  className?: string;
}

export default function AdminTargetQuickLinks({ className = '' }: AdminTargetQuickLinksProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {ADMIN_TARGET_QUICK_LINKS.map((link) =>
        link.variant === 'primary' ? (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
            {link.label}
          </Link>
        ) : (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <span className="material-symbols-outlined text-[16px]">{link.icon}</span>
            {link.label}
          </Link>
        ),
      )}
    </div>
  );
}
