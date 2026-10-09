import { clsx } from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'green' | 'blue' | 'terracotta' | 'gold' | 'danger' | 'warning';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink border-line',
  green: 'bg-primary-soft text-primary border-transparent',
  blue: 'bg-blue-soft text-blue border-transparent',
  terracotta: 'bg-terracotta-soft text-terracotta border-transparent',
  gold: 'bg-gold-soft text-warning border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
};

export function Badge({ tone = 'neutral', children, icon, className }: { tone?: Tone; children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-semibold', tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
