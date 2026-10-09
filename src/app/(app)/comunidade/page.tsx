'use client';
import { Flag, MessageCircle, ShieldBan, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { Avatar2D } from '@/components/avatar/Avatar2D';
import { LivePanel } from '@/components/community/LivePanel';
import { PrivacyControls } from '@/components/community/PrivacyControls';
import { TopBar } from '@/components/layout/TopBar';
import { SchematicMap } from '@/components/map/SchematicMap';
import { PremiumHint } from '@/components/places/PremiumGate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { ChipGroup, Segmented } from '@/components/ui/Controls';
import { DemoBadge } from '@/components/ui/DataSource';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState, Notice } from '@/components/ui/States';
import { demoGroups, demoPilgrims } from '@/data/demo/pilgrims';
import { getStop } from '@/data/demo/stops';
import { usePlan } from '@/hooks/usePlan';
import { useTripContext } from '@/hooks/useTripContext';
import { flag } from '@/lib/i18n/countries';
import type { PublicPilgrim } from '@/lib/domain/types';
import { useAppStore } from '@/store/useAppStore';

const PACE = { slow: 'Ritmo tranquilo', medium: 'Ritmo médio', fast: 'Ritmo rápido' };
const GRAN = { city: 'Somente cidade', approximate: 'Posição aproximada (~2 km)', precise_temporary: 'Posição precisa temporária' };
const REASONS = [
  { id: 'spam', label: 'Spam ou propaganda' },
  { id: 'harassment', label: 'Assédio ou ofensa' },
  { id: 'unsafe_meeting', label: 'Pressão para encontro inseguro' },
  { id: 'fake_profile', label: 'Perfil falso' },
  { id: 'other', label: 'Outro motivo' },
] as const;

export default function ComunidadePage() {
  return (
    <Suspense>
      <Comunidade />
    </Suspense>
  );
}

function Comunidade() {
  const router = useRouter();
  const params = useSearchParams();
  const { route } = useTripContext();
  const { can } = usePlan();
  const connections = useAppStore((s) => s.connections);
  const blocked = useAppStore((s) => s.blocked);
  const reported = useAppStore((s) => s.reported);
  const requestConnection = useAppStore((s) => s.requestConnection);
  const acceptConnection = useAppStore((s) => s.acceptConnection);
  const block = useAppStore((s) => s.block);
  const unblock = useAppStore((s) => s.unblock);
  const report = useAppStore((s) => s.report);
  const ensureChat = useAppStore((s) => s.ensureChat);
  const [tab, setTab] = useState<'live' | 'people' | 'groups' | 'privacy'>(() => {
    const aba = params.get('aba');
    return aba === 'peregrinos' ? 'people' : aba === 'grupos' ? 'groups' : aba === 'visibilidade' ? 'privacy' : 'live';
  });
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [langs, setLangs] = useState<string[]>([]);
  const [reportTarget, setReportTarget] = useState<PublicPilgrim | null>(null);
  const [reason, setReason] = useState<string[]>(['spam']);
  const [toast, setToast] = useState<string | null>(null);

  const visible = useMemo(
    () => demoPilgrims.filter((p) => !blocked.includes(p.id) && (!onlyAvailable || p.availableToChat) && (!langs.length || p.languages.some((l) => langs.includes(l)))),
    [blocked, onlyAvailable, langs],
  );

  function connect(p: PublicPilgrim) {
    requestConnection(p.id);
    setToast(`Pedido enviado para ${p.displayName}.`);
    // demonstração: aceite automático simulado
    setTimeout(() => {
      acceptConnection(p.id);
      setToast(`${p.displayName} aceitou sua conexão (resposta simulada).`);
    }, 1500);
  }

  function openChat(p: PublicPilgrim) {
    const id = `dm-${p.id}`;
    ensureChat(id, p.displayName, 'direct', p.id);
    router.push(`/comunidade/chat/${id}`);
  }

  return (
    <>
      <TopBar title="Comunidade" actions={<DemoBadge compact />} />
      <Segmented label="Seção" hideLabel value={tab} onChange={setTab} options={[{ id: 'live', label: 'Ao vivo' }, { id: 'people', label: 'Peregrinos' }, { id: 'groups', label: 'Grupos' }, { id: 'privacy', label: 'Privacidade' }]} />
      {toast && <div className="mt-3"><Notice tone="success">{toast}</Notice></div>}

      {tab === 'live' && <div className="mt-3"><LivePanel /></div>}
      {tab === 'privacy' && <div className="mt-3"><PrivacyControls /></div>}

      {tab === 'people' && (
        <div className="mt-3 flex flex-col gap-3">
          <Notice tone="info">Peregrinos fictícios para demonstração. Encontros apenas em locais públicos; nunca compartilhe onde vai dormir.</Notice>
          <SchematicMap
            height={260}
            data={{
              routeLine: route.geometry,
              markers: visible.filter((p) => p.location?.coord).map((p) => ({ id: p.id, coord: p.location!.coord!, kind: 'pilgrim' as const, label: `${p.displayName} · ${GRAN[p.location!.granularity]}`, color: '#a8492a', glyph: p.displayName[0] })),
              focus: visible.filter((p) => p.location?.coord).map((p) => p.location!.coord!),
            }}
          />
          <ChipGroup label="Filtrar" options={[{ id: 'available', label: 'Disponível para conversar' }]} value={onlyAvailable ? ['available'] : []} onChange={(v) => setOnlyAvailable(v.includes('available'))} />
          <ChipGroup label="Idiomas" options={[{ id: 'pt', label: 'Português' }, { id: 'es', label: 'Espanhol' }, { id: 'en', label: 'Inglês' }, { id: 'fr', label: 'Francês' }, { id: 'de', label: 'Alemão' }, { id: 'it', label: 'Italiano' }]} value={langs} onChange={setLangs} />
          {visible.length === 0 && <EmptyState title="Ninguém por perto com esses filtros" />}
          <ul className="flex flex-col gap-3">
            {visible.map((p) => {
              const status = connections[p.id];
              return (
                <li key={p.id}>
                  <Card as="article" aria-labelledby={`p-${p.id}`}>
                    <div className="flex gap-3">
                      <div className="shrink-0 rounded-2xl bg-surface-2">
                        <Avatar2D config={p.avatar} size={72} label={`Avatar de ${p.displayName}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 id={`p-${p.id}`} className="text-lg font-bold">
                          <span aria-hidden>{flag(p.countryCode)} </span>
                          {p.displayName}
                        </h2>
                        <p className="text-sm text-muted">
                          {p.location ? (p.location.granularity === 'city' ? `Em ${p.location.cityName}` : `Perto de ${p.location.cityName}`) : 'Localização oculta'} · {PACE[p.pace]}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.availableToChat && <Badge tone="green">Disponível para conversar</Badge>}
                          <Badge>Fala: {p.languages.join(', ').toUpperCase()}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {status === 'accepted' ? (
                        <Button onClick={() => openChat(p)} icon={<MessageCircle aria-hidden size={18} />}>Conversar</Button>
                      ) : (
                        <Button variant="secondary" onClick={() => connect(p)} disabled={status === 'pending' || !p.availableToChat} icon={<UserPlus aria-hidden size={18} />}>
                          {status === 'pending' ? 'Pedido enviado' : 'Conectar'}
                        </Button>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => block(p.id)} aria-label={`Bloquear ${p.displayName}`} icon={<ShieldBan aria-hidden size={18} />}>
                          <span className="sr-only sm:not-sr-only">Bloquear</span>
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => setReportTarget(p)} disabled={reported.includes(p.id)} aria-label={`Denunciar ${p.displayName}`} icon={<Flag aria-hidden size={18} />}>
                          <span className="sr-only sm:not-sr-only">{reported.includes(p.id) ? 'Denunciado' : 'Denunciar'}</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
          {blocked.length > 0 && (
            <Card>
              <h2 className="font-bold">Bloqueados ({blocked.length})</h2>
              <ul className="mt-2 flex flex-col gap-1">
                {blocked.map((id) => (
                  <li key={id} className="flex items-center justify-between">
                    {demoPilgrims.find((p) => p.id === id)?.displayName}
                    <Button variant="ghost" onClick={() => unblock(id)}>Desbloquear</Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {tab === 'groups' && (
        <div className="mt-3 flex flex-col gap-3">
          {!can('community_advanced') && <PremiumHint>Grupos por etapa e cidade fazem parte da comunidade avançada (Camino Pass). No gratuito você conversa com conexões individuais.</PremiumHint>}
          <ul className="flex flex-col gap-2">
            {demoGroups.map((g) => (
              <li key={g.id}>
                <Card className="flex items-center gap-3">
                  <Users aria-hidden className="shrink-0 text-primary" />
                  <div className="flex-1">
                    <p className="font-bold">{g.title}</p>
                    <p className="text-sm text-muted">{g.members} membros (fictícios) · {getStop(g.stopId)?.name}</p>
                  </div>
                  {can('community_advanced') ? (
                    <Button variant="secondary" onClick={() => { ensureChat(g.id, g.title, 'group'); router.push(`/comunidade/chat/${g.id}`); }}>Entrar</Button>
                  ) : (
                    <Link href="/premium" className="text-sm font-bold text-primary">Camino Pass</Link>
                  )}
                </Card>
              </li>
            ))}
          </ul>
          <SectionTitle>Regras da comunidade</SectionTitle>
          <Card>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Encontros somente em locais públicos (cafés, praças, igrejas).</li>
              <li>Sem assédio, spam ou venda de serviços.</li>
              <li>Denúncias são revisadas pela moderação; bloqueios são imediatos.</li>
            </ul>
          </Card>
        </div>
      )}

      <Dialog
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        title={`Denunciar ${reportTarget?.displayName ?? ''}`}
        footer={
          <>
            <Button variant="outline" block onClick={() => setReportTarget(null)}>Cancelar</Button>
            <Button variant="danger" block onClick={() => { if (reportTarget) { report(reportTarget.id); block(reportTarget.id); setToast('Denúncia enviada à moderação e perfil bloqueado.'); } setReportTarget(null); }}>
              Enviar denúncia
            </Button>
          </>
        }
      >
        <ChipGroup label="Motivo" single options={REASONS.map((r) => ({ id: r.id, label: r.label }))} value={reason} onChange={setReason} />
        <p className="mt-3 text-sm text-muted">A pessoa não será avisada de quem denunciou. Se houver risco imediato, ligue 112.</p>
      </Dialog>
    </>
  );
}
