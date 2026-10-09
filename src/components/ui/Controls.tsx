'use client';
import { clsx } from 'clsx';
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

export function Field({ label, hint, error, className, ...rest }: { label: string; hint?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint || error ? `${id}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        className="min-h-12 rounded-xl border-2 border-line bg-surface px-3 text-base text-ink placeholder:text-muted focus:border-primary"
        {...rest}
      />
      {(hint || error) && (
        <p id={`${id}-hint`} className={clsx('text-sm', error ? 'font-semibold text-danger' : 'text-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function SelectField({ label, children, hint, ...rest }: { label: string; hint?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <select id={id} className="min-h-12 rounded-xl border-2 border-line bg-surface px-3 text-base text-ink" aria-describedby={hint ? `${id}-hint` : undefined} {...rest}>
        {children}
      </select>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Interruptor acessível (role="switch"). */
export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div id={`${id}-l`} className="font-semibold">
          {label}
        </div>
        {description && (
          <div id={`${id}-d`} className="text-sm text-muted">
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        aria-describedby={description ? `${id}-d` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx('relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors disabled:opacity-50', checked ? 'border-primary bg-primary' : 'border-line bg-surface-2')}
      >
        <span className={clsx('absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-0.5')} />
        <span className="sr-only">{checked ? 'Ligado' : 'Desligado'}</span>
      </button>
    </div>
  );
}

/** Grupo de chips de seleção múltipla (aria-pressed). */
export function ChipGroup<T extends string>({ label, options, value, onChange, single }: { label: string; options: { id: T; label: string; icon?: ReactNode }[]; value: T[]; onChange: (v: T[]) => void; single?: boolean }) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(single ? [o.id] : active ? value.filter((v) => v !== o.id) : [...value, o.id])}
              className={clsx(
                'inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold transition-colors',
                active ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:border-primary',
              )}
            >
              {o.icon}
              {o.label}
              {active && <span className="sr-only"> (selecionado)</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Controle segmentado acessível como grupo de rádio. */
export function Segmented<T extends string>({ label, options, value, onChange, hideLabel }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; hideLabel?: boolean }) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className={hideLabel ? 'sr-only' : 'mb-2 font-semibold'}>{label}</legend>
      <div className="flex overflow-x-auto rounded-2xl border-2 border-line bg-surface-2 p-1">
        {options.map((o) => (
          <label key={o.id} className={clsx('flex min-h-11 flex-1 shrink-0 cursor-pointer whitespace-nowrap items-center justify-center rounded-xl px-2 text-center text-sm font-semibold', value === o.id ? 'bg-surface text-primary shadow' : 'text-muted')}>
            <input type="radio" className="sr-only" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function RangeField({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <output htmlFor={id} className="rounded-lg bg-primary-soft px-2 font-bold text-primary">
          {value} {unit}
        </output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-11 w-full accent-[var(--primary)]" />
    </div>
  );
}
