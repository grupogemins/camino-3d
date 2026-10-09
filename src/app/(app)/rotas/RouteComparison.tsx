'use client';
import { AlertTriangle, Check, Crown, ShieldAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChipGroup } from '@/components/ui/Controls';
import { DemoBadge, SourceLine } from '@/components/ui/DataSource';
import { Notice } from '@/components/ui/States';
import { demoAffiliates, demoCreatorRoutes } from '@/data/demo/affiliates';
import { routes } from '@/data/demo/routes';
import { usePlan } from '@/hooks/usePlan';
import type { RouteMode } from '@/lib/domain/types';
import { formatEur, formatKm } from '@/lib/format';
import { planStages, rankRoutes, ROUTE_MODES } from '@/lib/planner/planner';
import { useAppStore } from '@/store/useAppStore';

export function RouteComparison() {
  const params = useSearchParams();
  const router = useRouter();
  const createTrip = useAppStore((s) => s.createTrip);
  const fitness = useAppStore((s) => s.profile?.fitness ?? 'intermediate');
  const { can } = usePlan();
  const origin = params.get('origin') ?? 'porto';
  const days = Number(params.get('days') ?? 12);
  const km = Number(params.get('km') ?? 20);
  const start = params.get('start') ?? new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState<RouteMode>((params.get('mode') as RouteMode) ?? 'easiest');

  const ranking = useMemo(() => rankRoutes(routes, mode, origin), [mode, origin]);
  const plans = useMemo(
    () => Object.fromEntries(routes.map((r) => [r.id, planStages({ route: r, originId: origin, days, dailyKm: km, fitness })])),
    [origin, days, km, fitness],
  );

  function choose(routeId: string) {
    const t = createTrip({ routeId, originId: origin, mode, days, dailyKm: km, startDate: start });
    if (t) router.push('/inicio');
  }

  return (
    <>
      <TopBar title="Comparar rotas" subtitle={`${days} dias · ${km} km/dia`} back="/planejar" />
      <ChipGroup label="Ordenar por" single value={[mode]} onChange={(v) => setMode(v[0])} options={ROUTE_MODES.map((m) => ({ id: m.id, label: m.label }))} />
      {mode === 'safest' && (
        <div className="mt-3">
          <Notice tone="warning" icon={<ShieldAlert aria-hidden size={18} />}>
            &quot;Mais segura&quot; é uma comparação relativa entre as opções (serviços, trânsito, trechos sem sinal). Nenhuma rota é totalmente segura. Patrocínios não influenciam esta ordem.
          </Notice>
        </div>
      )}
      <ol className="mt-4 flex flex-col gap-4">
        {ranking.map((score, idx) => {
          const route = routes.find((r) => r.id === score.routeId)!;
          const plan = plans[route.id];
          const advancedLocked = idx > 0 && !can('advanced_routes');
          const dangers = route.waypoints.filter((w) => w.kind === 'danger').length;
          const noSignal = route.waypoints.filter((w) => w.kind === 'no_signal').length;
          return (
            <li key={route.id}>
              <Card as="article" className={idx === 0 ? 'border-2 border-primary' : ''} aria-labelledby={`r-${route.id}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {idx === 0 && <Badge tone="green" icon={<Check aria-hidden size={14} />}>Recomendada</Badge>}
                  <Badge tone="neutral">Pontuação {score.score}/100</Badge>
                  <DemoBadge compact />
                </div>
                <h2 id={`r-${route.id}`} className="mt-2 text-xl font-extrabold">
                  {route.name}
                </h2>
                <p className="text-sm text-muted">{route.description}</p>
                <p className="mt-1 text-sm font-semibold text-primary">{score.reasons[0]}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  {[
                    ['Distância', formatKm(plan.totalKm)],
                    ['Etapas', `${plan.segments.length} (${formatKm(plan.totalKm / Math.max(1, plan.segments.length))}/dia)`],
                    ['Subida total', `~${plan.totalAscentM.toLocaleString('pt-BR')} m`],
                    ['Hospedagem média', `${formatEur(route.attributes.avgLodgingEur)}/noite`],
                    ['Movimento', route.attributes.crowd > 0.7 ? 'Alto' : route.attributes.crowd > 0.4 ? 'Médio' : 'Baixo'],
                    ['Inclinação máx.', `~${route.attributes.maxSlopePct}%`],
                    ['Trechos de atenção', String(dangers)],
                    ['Trechos sem sinal', String(noSignal)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-surface-2 p-2">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>
                {plan.warnings.map((w) => (
                  <p key={w.code + w.message} className="mt-2 flex items-start gap-2 text-sm text-warning">
                    <AlertTriangle aria-hidden size={16} className="mt-0.5 shrink-0" />
                    {w.message}
                  </p>
                ))}
                <SourceLine className="mt-3" source={route.source} fetchedAt={route.fetchedAt} isDemo={route.isDemo} />
                <div className="mt-3">
                  {advancedLocked ? (
                    <ButtonLink href="/premium" variant="secondary" block icon={<Crown aria-hidden size={18} />}>
                      Rotas alternativas no Camino Pass
                    </ButtonLink>
                  ) : (
                    <Button block variant={idx === 0 ? 'primary' : 'outline'} onClick={() => choose(route.id)} disabled={!plan.segments.length}>
                      {plan.segments.length ? 'Escolher esta rota' : 'Indisponível a partir desta origem'}
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
      <h2 className="mt-6 text-xl font-extrabold">Rotas de criadores</h2>
      <p className="text-sm text-muted">Versões comentadas por criadores de conteúdo parceiros, com dicas e lugares favoritos por parada.</p>
      <ul className="mt-3 flex flex-col gap-3">
        {demoCreatorRoutes.map((cr) => {
          const author = demoAffiliates.find((a) => a.id === cr.affiliateId);
          if (!author?.nameUseAuthorized) return null;
          return (
            <li key={cr.id}>
              <Card as="article" className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{cr.title}</h3>
                  <Badge tone="terracotta">Rota de criador</Badge>
                  {cr.isDemo && <DemoBadge compact />}
                </div>
                <p className="text-sm text-muted">Por {author.name} · base: {routes.find((r) => r.id === cr.baseRouteId)?.name}</p>
                <p>{cr.summary}</p>
                <ButtonLink href={`/rotas/criadores/${cr.id}?origin=${origin}&days=${days}&km=${km}&start=${start}`} variant="outline">Ver dicas da rota</ButtonLink>
              </Card>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-muted">Traçados simplificados para demonstração. No Caminho, siga sempre as setas amarelas e a sinalização oficial.</p>
    </>
  );
}
