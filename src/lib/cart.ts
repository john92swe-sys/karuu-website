'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'karuu-bag-v1';
const CHANGE_EVENT = 'karuu-bag-change';

function readBag(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.length <= 120))).slice(0, 30) : [];
  } catch { return []; }
}
function saveBag(ids: string[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* The bag remains in memory when storage is unavailable. */ }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: ids }));
}
export function addToBag(skuId: string) {
  saveBag(Array.from(new Set([...readBag(), skuId])).slice(0, 30));
}
export function useBag() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setIds(readBag()); setReady(true);
    const update = (event: Event) => { setIds(event instanceof CustomEvent && Array.isArray(event.detail) ? event.detail : readBag()); };
    window.addEventListener(CHANGE_EVENT, update); window.addEventListener('storage', update);
    return () => { window.removeEventListener(CHANGE_EVENT, update); window.removeEventListener('storage', update); };
  }, []);
  return { ids, ready, remove: (id: string) => saveBag(ids.filter((item) => item !== id)), clear: () => saveBag([]) };
}
