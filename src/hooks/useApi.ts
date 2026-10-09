'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiResponse, ResponseMeta } from '@/providers/types';
import { useOnline } from './useOnline';

export type ApiState<T> =
  | { status: 'loading'; data?: undefined; meta?: undefined; error?: undefined }
  | { status: 'success'; data: T; meta: ResponseMeta; error?: undefined }
  | { status: 'error'; data?: undefined; meta?: undefined; error: string }
  | { status: 'offline'; data?: T; meta?: ResponseMeta; error?: undefined };

/** Busca em /api com estados loading/error/offline e cache local para uso sem conexão. */
export function useApi<T>(url: string | null) {
  const online = useOnline();
  const [state, setState] = useState<ApiState<T>>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const lastUrl = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!url) return;
    lastUrl.current = url;
    setState({ status: 'loading' });
    const cacheKey = `api-cache:${url}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(body?.error?.message ?? `Erro ${res.status}`);
      }
      const json = (await res.json()) as ApiResponse<T>;
      if (lastUrl.current !== url) return;
      setState({ status: 'success', data: json.data, meta: json.meta });
      try {
        localStorage.setItem(cacheKey, JSON.stringify(json));
      } catch {
        /* armazenamento cheio: segue sem cache */
      }
    } catch (e) {
      if (lastUrl.current !== url) return;
      let cached: ApiResponse<T> | null = null;
      try {
        cached = JSON.parse(localStorage.getItem(cacheKey) ?? 'null');
      } catch {
        cached = null;
      }
      if (!navigator.onLine) setState({ status: 'offline', data: cached?.data, meta: cached?.meta });
      else if (cached) setState({ status: 'offline', data: cached.data, meta: cached.meta });
      else setState({ status: 'error', error: e instanceof Error ? e.message : 'Erro desconhecido' });
    }
  }, [url]);

  useEffect(() => {
    void load();
  }, [load, nonce, online]);

  return { ...state, reload: () => setNonce((n) => n + 1) } as ApiState<T> & { reload: () => void };
}
