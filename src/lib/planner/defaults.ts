import type { Profile, RouteMode } from '@/lib/domain/types';

/** Modo sugerido a partir do perfil (onboarding). */
export function suggestedMode(p: Pick<Profile, 'accessibility' | 'dailyBudgetEur' | 'walkingStyle' | 'fitness'> | null | undefined): RouteMode {
  if (!p) return 'easiest';
  if (p.accessibility.length) return 'accessible';
  if (p.dailyBudgetEur <= 40) return 'cheapest';
  if (p.walkingStyle === 'meet') return 'social';
  if (p.fitness === 'beginner') return 'easiest';
  return 'scenic';
}
