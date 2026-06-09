import React, { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { GET_MY_NOTIFICATIONS, GET_UNREAD_NOTIFICATION_COUNT } from '../../../apollo/user/query';
import { MARK_ALL_NOTIFICATIONS_READ, MARK_NOTIFICATION_READ } from '../../../apollo/user/mutation';
import { resolveAdminNotificationHref } from '../../admin/admin-notification';
import type { Notification } from '../../types';

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'hozir';
  if (m < 60) return `${m} daq`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat`;
  return `${Math.floor(h / 24)} kun`;
}

export default function AdminNotificationsDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, refetch } = useQuery(GET_MY_NOTIFICATIONS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 20000,
  });
  const { data: countData, refetch: refetchCount } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 20000,
  });

  const [markAll] = useMutation(MARK_ALL_NOTIFICATIONS_READ);
  const [markOne] = useMutation(MARK_NOTIFICATION_READ);

  const notifications: Notification[] = data?.getMyNotifications ?? [];
  const unread = countData?.getUnreadNotificationCount ?? 0;

  const handleClick = async (n: Notification) => {
    const href = resolveAdminNotificationHref(n);
    if (!n.isRead) {
      try {
        await markOne({ variables: { notificationId: n._id } });
        refetch();
        refetchCount();
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#16161F] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#27272F] transition-colors"
        aria-label="Bildirishnomalar"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[420px] overflow-hidden z-50 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#16161F] rounded-2xl shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#16161F]">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Bildirishnomalar</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    await markAll();
                    refetch();
                    refetchCount();
                  }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Barchasini o&apos;qilgan
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10">Bildirishnoma yo&apos;q</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-[#16161F] hover:bg-slate-50 dark:hover:bg-[#16161F]/60 transition-colors ${
                      !n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
