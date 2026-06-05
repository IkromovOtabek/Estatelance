import React from 'react';
import Link from 'next/link';
import {
  formatTargetUrlDisplay,
  isExternalTargetUrl,
  targetPathForLink,
} from '../../admin/format-target-url';

interface TargetHrefLinkProps {
  targetUrl?: string | null;
  className?: string;
}

export default function TargetHrefLink({ targetUrl, className = '' }: TargetHrefLinkProps) {
  if (!targetUrl) {
    return (
      <span
        className={`text-xs text-slate-400 inline-flex items-center gap-1 ${className}`}
      >
        <span className="material-symbols-outlined text-[14px]">notifications</span>
        Banner
      </span>
    );
  }

  if (isExternalTargetUrl(targetUrl)) {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={targetUrl}
        className={`inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline max-w-[160px] ${className}`}
      >
        <span className="truncate">{formatTargetUrlDisplay(targetUrl)}</span>
        <span className="material-symbols-outlined text-[14px] shrink-0">open_in_new</span>
      </a>
    );
  }

  const href = targetPathForLink(targetUrl);
  return (
    <Link
      href={href}
      title={targetUrl}
      className={`inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline ${className}`}
    >
      <span className="material-symbols-outlined text-[14px]">link</span>
      <span className="truncate max-w-[120px]">{formatTargetUrlDisplay(href)}</span>
    </Link>
  );
}
