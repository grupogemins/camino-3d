import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className, children, as: Tag = 'section', ...rest }: HTMLAttributes<HTMLElement> & { as?: 'section' | 'article' | 'div' | 'li'; children: ReactNode }) {
  return (
    <Tag className={clsx('rounded-[var(--radius-card)] border border-line/70 bg-surface p-4 shadow-[var(--shadow-card)]', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionTitle({ children, action, id }: { children: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 mt-6 flex items-end justify-between gap-2">
      <h2 id={id} className="text-[1.35rem] leading-tight">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-xl font-bold leading-tight">{value}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}
