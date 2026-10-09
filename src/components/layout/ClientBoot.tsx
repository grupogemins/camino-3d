'use client';
import { useEffect } from 'react';
import { captureReferral } from '@/lib/billing/referral';
import { addAnalyticsSink, retentionEventsDue, track, type AnalyticsEvent } from '@/lib/analytics/events';
import { useAppStore } from '@/store/useAppStore';

let queue: AnalyticsEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

/** Aplica tema, escala de texto e movimento; registra o service worker; envia analytics consentido. */
export function ClientBoot() {
  const theme = useAppStore((s) => s.theme);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const textScale = useAppStore((s) => s.textScale);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
      root.dataset.theme = resolved;
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
    document.documentElement.style.fontSize = `${textScale * 100}%`;
  }, [reducedMotion, textScale]);

  useEffect(() => captureReferral(window.location.search), []);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
    addAnalyticsSink((e) => {
      queue.push(e);
      if (timer) return;
      timer = setTimeout(() => {
        const events = queue;
        queue = [];
        timer = null;
        const body = JSON.stringify({ anonymousId: useAppStore.getState().anonymousId, events });
        if (navigator.sendBeacon) navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }));
        else void fetch('/api/analytics', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
      }, 2000);
    });
    // Retenção D7/D30
    const s = useAppStore.getState();
    if (s.user) {
      const sentKey = 'camino-retention-sent';
      const sent = JSON.parse(localStorage.getItem(sentKey) ?? '[]');
      for (const e of retentionEventsDue(s.user.createdAt, new Date(), sent)) {
        if (track(e)) sent.push(e);
      }
      localStorage.setItem(sentKey, JSON.stringify(sent));
    }
  }, []);

  return null;
}
