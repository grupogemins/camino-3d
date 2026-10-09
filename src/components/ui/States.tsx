import { AlertTriangle, CloudOff, Inbox, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export function LoadingState({ label = 'Carregando…', rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-20 rounded-2xl" aria-hidden />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line p-6 text-center">
      {icon ?? <Inbox aria-hidden className="text-muted" size={32} />}
      <p className="font-bold">{title}</p>
      {description && <p className="text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Não foi possível carregar', description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-2xl bg-danger-soft p-6 text-center">
      <AlertTriangle aria-hidden className="text-danger" size={32} />
      <p className="font-bold text-danger">{title}</p>
      {description && <p className="text-sm">{description}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} icon={<RotateCcw aria-hidden size={18} />}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function OfflineState({ description = 'Você está sem conexão. Mostrando o que foi salvo neste aparelho.' }: { description?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 rounded-2xl bg-warning-soft p-4 text-warning">
      <CloudOff aria-hidden size={24} />
      <p className="text-sm font-semibold">{description}</p>
    </div>
  );
}

export function Notice({ tone = 'info', children, icon }: { tone?: 'info' | 'warning' | 'danger' | 'success'; children: ReactNode; icon?: ReactNode }) {
  const cls = {
    info: 'bg-blue-soft text-blue',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    success: 'bg-primary-soft text-primary',
  }[tone];
  return (
    <div className={`flex gap-3 rounded-2xl p-3 text-sm font-medium ${cls}`} role={tone === 'danger' ? 'alert' : undefined}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}
