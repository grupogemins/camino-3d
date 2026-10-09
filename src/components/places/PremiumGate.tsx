import { Crown } from 'lucide-react';
import Link from 'next/link';

export function PremiumHint({ children }: { children: React.ReactNode }) {
  return (
    <Link href="/premium" className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-gold bg-gold-soft p-3 text-sm font-semibold text-warning">
      <Crown aria-hidden className="shrink-0" />
      <span>{children}</span>
    </Link>
  );
}
