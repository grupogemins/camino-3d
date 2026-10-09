'use client';
import { effectivePlan, hasFeature, type Feature } from '@/lib/billing/plans';
import { useAppStore } from '@/store/useAppStore';

export function usePlan() {
  const sub = useAppStore((s) => s.subscription);
  const plan = effectivePlan(sub);
  return { plan, isPremium: plan !== 'free', can: (f: Feature) => hasFeature(plan, f) };
}
