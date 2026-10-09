'use client';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

/** Diálogo modal acessível baseado no elemento nativo <dialog> (foco preso e Esc nativos). */
export function Dialog({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
      className="m-auto w-[min(92vw,30rem)] rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl"
    >
      <div className="flex items-start justify-between gap-2 border-b border-line p-4">
        <h2 id="dialog-title" className="text-lg font-bold">
          {title}
        </h2>
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label="Fechar">
          <X aria-hidden />
        </button>
      </div>
      <div className="max-h-[65vh] overflow-y-auto p-4">{children}</div>
      {footer && <div className="flex gap-2 border-t border-line p-4">{footer}</div>}
    </dialog>
  );
}
