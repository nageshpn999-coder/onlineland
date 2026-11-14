'use client';

/**
 * Favorites saved on this device (localStorage). Works without login.
 * When login arrives, these are merged into users/{uid}/favorites.
 * Each item keeps a small snapshot so the favorites page renders without a server call.
 */
import { useSyncExternalStore } from 'react';
import type { LocalizedText, PropertyCategory, PropertyPurpose } from '@onlineland/shared';

export interface FavoriteItem {
  id: string;
  code: string;
  category: PropertyCategory;
  purpose: PropertyPurpose;
  title: LocalizedText;
  district: string;
  mandal: string;
  village: string;
  total: number;
  savedAt: number;
}

const KEY = 'onlineland:favorites:v1';
const EMPTY: FavoriteItem[] = [];
const listeners = new Set<() => void>();
let cache: FavoriteItem[] | null = null;

function read(): FavoriteItem[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    cache = Array.isArray(parsed) ? (parsed as FavoriteItem[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: FavoriteItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage full or blocked (private mode): keep in memory for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useFavorites() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items,
    has: (id: string) => items.some((f) => f.id === id),
    toggle: (item: Omit<FavoriteItem, 'savedAt'>) => {
      const current = read();
      write(
        current.some((f) => f.id === item.id)
          ? current.filter((f) => f.id !== item.id)
          : [{ ...item, savedAt: Date.now() }, ...current].slice(0, 200),
      );
    },
    remove: (id: string) => write(read().filter((f) => f.id !== id)),
  };
}
