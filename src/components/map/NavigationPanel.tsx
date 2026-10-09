'use client';
import { AlertTriangle, Flag, ListOrdered, MapPin, Timer } from 'lucide-react';
import { useState } from 'react';
import { WaypointIcon } from '@/components/common/WaypointIcon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Instruction, NavState } from '@/lib/navigation';
import { formatKm } from '@/lib/format';

export function NavigationPanel({ nav, instructions }: { nav: NavState; instructions: Instruction[] }) {
  const [showSteps, setShowSteps] = useState(false);
  const nextInstr = instructions.find((i) => i.km > nav.km + 0.05);
  return (
    <section aria-label="Navegação" className="flex flex-col gap-3 rounded-2xl border-2 border-primary bg-surface p-4">
      {nav.offRoute && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 font-bold text-danger">
          <AlertTriangle aria-hidden className="shrink-0" />
          Você está a {Math.round(nav.distanceToRouteKm * 1000)} m do traçado. Volte ao caminho sinalizado.
        </div>
      )}
      {nav.arrived ? (
        <p className="flex items-center gap-2 text-xl font-extrabold text-primary" role="status">
          <Flag aria-hidden /> Etapa concluída! Bom descanso.
        </p>
      ) : (
        <div aria-live="polite">
          <p className="text-sm text-muted">Próxima instrução</p>
          <p className="text-xl font-extrabold leading-tight">{nextInstr?.text ?? 'Siga as setas amarelas'}</p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-surface-2 p-2">
          <MapPin aria-hidden className="mx-auto text-primary" size={18} />
          <p className="text-xs text-muted">Falta na etapa</p>
          <p className="font-bold">{formatKm(nav.remainingStageKm)}</p>
        </div>
        <div className="rounded-xl bg-surface-2 p-2">
          <Timer aria-hidden className="mx-auto text-primary" size={18} />
          <p className="text-xs text-muted">Chegada em</p>
          <p className="font-bold">{Math.floor(nav.etaMinutes / 60)}h{String(nav.etaMinutes % 60).padStart(2, '0')}</p>
        </div>
        <div className="rounded-xl bg-surface-2 p-2">
          <Flag aria-hidden className="mx-auto text-primary" size={18} />
          <p className="text-xs text-muted">Até Santiago</p>
          <p className="font-bold">{formatKm(nav.remainingTotalKm)}</p>
        </div>
      </div>
      <ProgressBar value={nav.stageProgress} label="Progresso da etapa" />
      {nav.nextWaypoint && (
        <p className="flex items-center gap-2 text-sm">
          <WaypointIcon kind={nav.nextWaypoint.kind} />
          Próximo ponto: <b>{nav.nextWaypoint.name}</b> em {formatKm(Math.max(0, nav.nextWaypoint.km - nav.km))}
        </p>
      )}
      {nav.nextStop && (
        <p className="text-sm">
          Próxima vila: <b>{nav.nextStop.name}</b> em {formatKm(Math.max(0, nav.nextStop.km - nav.km))}
        </p>
      )}
      <button type="button" onClick={() => setShowSteps((v) => !v)} aria-expanded={showSteps} className="flex min-h-11 items-center gap-2 text-sm font-bold text-primary">
        <ListOrdered aria-hidden size={18} /> {showSteps ? 'Ocultar' : 'Ver'} passo a passo
      </button>
      {showSteps && (
        <ol className="flex flex-col gap-1.5 text-sm">
          {instructions.map((i, idx) => (
            <li key={idx} className={`rounded-lg px-2 py-1 ${i.km <= nav.km ? 'text-muted line-through' : ''}`}>
              <span className="font-semibold">km {i.km.toFixed(1)}</span> · {i.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
