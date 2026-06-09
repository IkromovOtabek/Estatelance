import { useEffect, useState, useCallback } from 'react';
import { Job } from '../types';

// ─── Sevimli ishlar — localStorage (web) ──────────────────────────────────────
// To'liq Job obyektini saqlaymiz → Sevimlilar sahifasi qayta so'rovsiz ko'rsatadi.
const KEY = 'bufu_favorites';
const EVT = 'bufu-favorites-changed';

function read(): Job[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: Job[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT)); // bir sahifadagi boshqa komponentlarni xabardor qiladi
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Job[]>([]);

  useEffect(() => {
    setFavorites(read());
    const handler = () => setFavorites(read());
    window.addEventListener(EVT, handler);
    window.addEventListener('storage', handler); // boshqa tab'lar bilan sinxron
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((j) => j._id === id),
    [favorites],
  );

  // Saqlash/o'chirish (toggle). Saqlangan bo'lsa — qaytaradi: false, aks holda true.
  const toggle = useCallback((job: Job): boolean => {
    const list = read();
    const exists = list.some((j) => j._id === job._id);
    const next = exists ? list.filter((j) => j._id !== job._id) : [job, ...list];
    write(next);
    return !exists;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((j) => j._id !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { favorites, isFavorite, toggle, remove, clear, count: favorites.length };
}
