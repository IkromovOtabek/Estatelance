import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '../types';

const KEY = 'favorite_jobs';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Job[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v) setFavorites(JSON.parse(v));
    });
  }, []);

  const save = useCallback(async (updated: Job[]) => {
    setFavorites(updated);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  }, []);

  const toggle = useCallback(async (job: Job) => {
    const exists = favorites.some(f => f._id === job._id);
    const updated = exists
      ? favorites.filter(f => f._id !== job._id)
      : [job, ...favorites];
    await save(updated);
    return !exists; // true = qo'shildi, false = o'chirildi
  }, [favorites, save]);

  const isFavorite = useCallback((jobId: string) => {
    return favorites.some(f => f._id === jobId);
  }, [favorites]);

  return { favorites, toggle, isFavorite };
}
