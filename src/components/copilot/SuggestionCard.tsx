'use client';
import { BedDouble, CloudRain, Droplets, Info, Mountain, Sparkles, Sunset, Users, UtensilsCrossed, Footprints, X } from 'lucide-react';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBadge } from '@/components/ui/DataSource';
import type { Suggestion, SuggestionKind } from '@/lib/copilot/copilot';
import { useAppStore } from '@/store/useAppStore';

const ICON: Record<SuggestionKind, typeof Info> = {
  weather: CloudRain,
  pace: Footprints,
  lodging: BedDouble,
  elevation: Mountain,
  water: Droplets,
  food: UtensilsCrossed,
  daylight: Sunset,
  community: Users,
  creator: Sparkles,
};

export function SuggestionCard({ s }: { s: Suggestion }) {
  const shorten = useAppStore((st) => st.shortenSegment);
  const dismiss = useAppStore((st) => st.dismissCopilot);
  const [done, setDone] = useState<string | null>(null);
  const [why, setWhy] = useState(false);
  const Icon = ICON[s.kind];
  const urgent = s.priority === 0;
  return (
    <Card as="article" aria-labelledby={`sg-${s.id}`} className={urgent ? 'border-warning' : ''}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${urgent ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary'}`}>
          <Icon aria-hidden size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 id={`sg-${s.id}`} className="font-bold">{s.title}</h3>
            <button type="button" onClick={() => dismiss(s.id)} className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-2" aria-label={`Dispensar sugestão: ${s.title}`}>
              <X aria-hidden size={18} />
            </button>
          </div>
          <p className="mt-1">{s.body}</p>
          {done ? (
            <p role="status" className="mt-2 font-semibold text-primary">{done}</p>
          ) : (
            s.actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {s.actions.map((a, i) =>
                  a.shorten ? (
                    <Button key={a.label} size="sm" onClick={() => setDone(shorten(a.shorten!.segmentId, a.shorten!.stopId) ? 'Etapa encurtada e viagem replanejada. Confira as novas etapas no Início.' : 'Não foi possível replanejar esta etapa.')}>
                      {a.label}
                    </Button>
                  ) : (
                    <ButtonLink key={a.label} href={a.href!} size="sm" variant={i === 0 ? 'secondary' : 'outline'}>{a.label}</ButtonLink>
                  ),
                )}
              </div>
            )
          )}
          <button type="button" onClick={() => setWhy((v) => !v)} aria-expanded={why} className="mt-2 flex min-h-11 items-center gap-1 text-sm font-semibold text-muted">
            <Info aria-hidden size={14} /> Por que esta sugestão?
          </button>
          {why && (
            <div className="text-sm text-muted">
              <ul className="list-disc pl-5">{s.basedOn.map((b) => <li key={b}>{b}</li>)}</ul>
              {s.usesDemoData && <div className="mt-1"><DemoBadge compact /></div>}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
