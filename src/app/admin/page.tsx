'use client';
import { useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, SectionTitle, Stat } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { DemoBadge } from '@/components/ui/DataSource';
import { accommodations } from '@/data/demo/accommodations';
import { demoFunnel, demoKpis, demoReports } from '@/data/demo/moderation';
import { restaurants } from '@/data/demo/restaurants';
import { sponsors } from '@/data/demo/sponsors';
import { getLocalAnalyticsLog } from '@/lib/analytics/events';
import type { ModerationAction } from '@/lib/domain/types';
import { formatEur } from '@/lib/format';

const pct = (n: number) => `${(n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/** Funil em barras horizontais: uma série (sem legenda), rótulos diretos, tooltip nativo e tabela alternativa. */
function Funnel() {
  const max = demoFunnel[0].value;
  const [table, setTable] = useState(false);
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">Funil de conversão semanal</h2>
        <Button variant="ghost" onClick={() => setTable((t) => !t)} aria-pressed={table}>{table ? 'Ver gráfico' : 'Ver tabela'}</Button>
      </div>
      {table ? (
        <table className="mt-2 w-full text-sm">
          <thead><tr className="text-left text-muted"><th scope="col">Etapa</th><th scope="col" className="text-right">Usuários</th><th scope="col" className="text-right">da etapa anterior</th><th scope="col" className="text-right">do topo</th></tr></thead>
          <tbody>
            {demoFunnel.map((s, i) => (
              <tr key={s.step} className="border-t border-line">
                <th scope="row" className="py-1.5 text-left font-semibold">{s.step}</th>
                <td className="text-right">{s.value.toLocaleString('pt-BR')}</td>
                <td className="text-right">{i ? pct(s.value / demoFunnel[i - 1].value) : '—'}</td>
                <td className="text-right">{pct(s.value / max)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ol className="mt-3 flex flex-col gap-2.5" aria-label="Funil de conversão">
          {demoFunnel.map((s, i) => (
            <li key={s.step} title={`${s.step}: ${s.value.toLocaleString('pt-BR')} (${pct(s.value / max)} do topo)`}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{s.step}</span>
                <span className="text-muted">
                  <b className="text-ink">{s.value.toLocaleString('pt-BR')}</b>
                  {i > 0 && <> · {pct(s.value / demoFunnel[i - 1].value)} da etapa anterior</>}
                </span>
              </div>
              <div className="mt-1 h-3 rounded-r bg-surface-2">
                <div className="h-3 rounded-r-[4px] bg-primary" style={{ width: `${Math.max(1, (s.value / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-xs text-muted">Dados simulados. Em produção, vêm da tabela analytics_events (somente usuários com consentimento).</p>
    </Card>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'partners' | 'moderation'>('overview');
  const [actions, setActions] = useState<Record<string, ModerationAction['action']>>({});
  const localEvents = typeof window !== 'undefined' ? getLocalAnalyticsLog() : [];
  const placements = [...accommodations, ...restaurants].filter((p) => p.sponsored);

  return (
    <div>
      <DemoBanner />
      <main id="conteudo" className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-2"><DemoBadge /><ButtonLink href="/eu" variant="outline">Voltar ao app</ButtonLink></div>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold">Painel administrativo</h1>
        <p className="text-muted">Parceiros, patrocínios, moderação e métricas. Acesso real exigirá papel de administrador (RLS).</p>
        <div className="mt-4"><Segmented label="Seção" hideLabel value={tab} onChange={setTab} options={[{ id: 'overview', label: 'Métricas' }, { id: 'partners', label: 'Parceiros' }, { id: 'moderation', label: 'Moderação' }]} /></div>

        {tab === 'overview' && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Conversão visitante → assinante" value={pct(demoKpis.conversion)} hint="demo" />
              <Stat label="Receita mensal (MRR)" value={formatEur(demoKpis.mrrEur)} hint="demo, antes de taxas" />
              <Stat label="Retenção D7" value={pct(demoKpis.retentionD7)} hint="demo" />
              <Stat label="Retenção D30" value={pct(demoKpis.retentionD30)} hint="demo" />
              <Stat label="Cancelamento mensal" value={pct(demoKpis.churnMonthly)} hint="demo" />
              <Stat label="Cliques para reserva" value={demoKpis.bookingClicks.toLocaleString('pt-BR')} hint="demo" />
              <Stat label="Traduções" value={demoKpis.translationsUsed.toLocaleString('pt-BR')} hint="demo" />
              <Stat label="Conexões entre peregrinos" value={demoKpis.connections} hint="demo" />
            </div>
            <Funnel />
            <Card>
              <h2 className="font-bold">Eventos desta sessão (reais, locais)</h2>
              <p className="text-sm text-muted">{localEvents.length ? `${localEvents.length} evento(s) registrados com consentimento.` : 'Nenhum evento: ative as estatísticas anônimas em Perfil para registrar.'}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">{localEvents.slice(-20).map((e, i) => <li key={i}><Badge>{e.name}</Badge></li>)}</ul>
            </Card>
          </div>
        )}

        {tab === 'partners' && (
          <div className="mt-4 flex flex-col gap-4">
            <Card>
              <h2 className="font-bold">Patrocinadores</h2>
              <ul className="mt-2 divide-y divide-line">
                {sponsors.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2">
                    <span><b>{s.name}</b> <span className="text-sm text-muted">· {s.category}</span></span>
                    <Badge tone={s.status === 'active' ? 'green' : s.status === 'lead' ? 'blue' : 'neutral'}>{s.status === 'active' ? 'Ativo' : s.status === 'lead' ? 'Negociação' : 'Pausado'}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="font-bold">Destaques patrocinados ativos ({placements.length})</h2>
              <ul className="mt-2 divide-y divide-line text-sm">
                {placements.map((p) => (
                  <li key={p.id} className="flex justify-between py-1.5"><span>{p.name} · {p.town}</span><span className="text-muted">boost {p.sponsored!.boost}</span></li>
                ))}
              </ul>
              <SectionTitle>Regras</SectionTitle>
              <ul className="list-disc pl-5 text-sm">
                <li>Todo destaque exibe o rótulo &quot;Patrocinado&quot;.</li>
                <li>O patrocínio só ajusta a ordem (teto de 0,5) e nunca altera alertas, filtros ou o modo &quot;Mais segura&quot;.</li>
                <li>Logotipos de terceiros só com autorização por escrito.</li>
              </ul>
            </Card>
          </div>
        )}

        {tab === 'moderation' && (
          <ul className="mt-4 flex flex-col gap-3">
            {demoReports.map((r) => (
              <li key={r.id}>
                <Card>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="danger">{r.reason}</Badge>
                    <Badge>{actions[r.id] ? 'Resolvido' : r.status === 'open' ? 'Aberto' : 'Em análise'}</Badge>
                  </div>
                  <p className="mt-2 font-bold">{r.targetName}</p>
                  <p className="text-sm">{r.details}</p>
                  <blockquote className="mt-1 border-l-4 border-line pl-3 text-sm text-muted">{r.excerpt}</blockquote>
                  {actions[r.id] ? (
                    <p className="mt-2 text-sm font-semibold text-primary">Ação aplicada: {actions[r.id]}</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(['dismiss', 'warn', 'mute_24h', 'suspend', 'ban'] as const).map((a) => (
                        <Button key={a} variant={a === 'ban' ? 'danger' : 'outline'} onClick={() => setActions((x) => ({ ...x, [r.id]: a }))}>
                          {{ dismiss: 'Arquivar', warn: 'Advertir', mute_24h: 'Silenciar 24h', suspend: 'Suspender', ban: 'Banir' }[a]}
                        </Button>
                      ))}
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
