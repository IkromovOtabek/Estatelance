import React from 'react';
import Link from 'next/link';
import { CaretRight } from '@phosphor-icons/react';
import type { AdminBreadcrumbItem } from '../../admin/admin-config';

interface AdminAdsBreadcrumbProps {
  items: AdminBreadcrumbItem[];
}

/** Asosiy kontent ustidagi gorizontal yo‘l (sidebar bilan takrorlanmaydi) */
export default function AdminAdsBreadcrumb({ items }: AdminAdsBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
        {items.map((crumb, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {i > 0 && <CaretRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />}
              {isLast ? (
                <span className="font-semibold text-slate-800 dark:text-slate-100">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
