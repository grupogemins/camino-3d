'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

/** true depois que o estado persistido foi carregado do armazenamento local (evita divergência SSR). */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAppStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
