'use client';
import { Ban, Coffee, Construction, Droplet, Footprints, Lightbulb, Radio, Users, UtensilsCrossed, Waves, CalendarHeart, Clock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PremiumHint } from '@/components/places/PremiumGate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { ChipGroup, Field, SelectField, Switch } from '@/components/ui/Controls';
import { DemoBadge } from '@/components/ui/DataSource';
import { Notice } from '@/components/ui/States';
import { displayCount } from '@/data/demo/live';
import { getStop } from '@/data/demo/stops';
import { useLive } from '@/hooks/useLive';
import { usePlan } from '@/hooks/usePlan';
import { useTripContext } from '@/hooks/useTripContext';
import type { LiveInvite, LiveReport } from '@/lib/domain/types';
import { moderateMessage } from '@/lib/moderation';
import { useAppStore } from '@/store/useAppStore';

const LANG: Record<string, string> = { pt: 'Português', es: 'Espanhol', en: 'Inglês', de: 'Alemão', it: 'Italiano', fr: 'Francês', ko: 'Coreano', pl: 'Polonês' };

export const REPORT_KIND: Record<LiveReport['kind'], { label: string; icon: typeof Ban }> = {
  mud: { label: 'Lama', icon: Waves },
  no_water: { label: 'Sem água', icon: Droplet },
  works: { label: 'Obras', icon: Construction },
  closed: { label: 'Fechado', icon: Ban },
  queue: { label: 'Fila', icon: Clock },
  crowded: { label: 'Lotado', icon: Users },
  tip: { label: 'Dica', icon: Lightbulb },
};

const INVITE_KIND: Record<LiveInvite['kind'], { label: string; icon: typeof Ban }> = {
  walk: { label: 'Caminhar junto', icon: Footprints },
  coffee: { label: 'Café', icon: Coffee },
  dinner: { label: 'Jantar', icon: UtensilsCrossed },
  event: { label: 'Evento', icon: CalendarHeart },
};

function ago(iso: string, now = Date.now()) {
  const min = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60000));
  return min < 60 ? `há ${min} min` : `há ${Math.round(min / 60)} h`;
}

const time = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

/** Camino Live: experiência coletiva por etapa, sem expor posições individuais. */
export function LivePanel() {
  const { trip, currentSegment } = useTripContext();
  const { snapshot, reports, invites } = useLive();
  const { can } = usePlan();
  const canPost = can('live_reports');
  const privacy = useAppStore((s) => s.privacy);
  const updatePrivacy = useAppStore((s) => s.updatePrivacy);
  const openToWalk = useAppStore((s) => s.openToWalkTogether);
  const setOpenToWalk = useAppStore((s) => s.setOpenToWalkTogether);
  const votes = useAppStore((s) => s.liveVotes);
  const vote = useAppStore((s) => s.voteLiveReport);
  const addReport = useAppStore((s) => s.addLiveReport);
  const addInvite = useAppStore((s) => s.addLiveInvite);
  const going = useAppStore((s) => s.liveGoing);
  const toggleGoing = useAppStore((s) => s.toggleGoing);

  const tripStops = trip ? [...new Set(trip.segments.flatMap((s) => [s.fromStopId, s.toStopId]))] : snapshot.stages.map((s) => s.stopId);
  const stages = snapshot.stages.filter((s) => tripStops.includes(s.stopId));
  const here = stages.find((s) => s.stopId === currentSegment?.fromStopId) ?? stages[0];
  const presence = privacy.communityPresence && !privacy.invisibleMode;

  const [form, setForm] = useState<'report' | 'invite' | null>(null);
  const [stopId, setStopId] = useState(currentSegment?.fromStopId ?? tripStops[0]);
  const [kind, setKind] = useState<LiveReport['kind'][]>(['mud']);
  const [note, setNote] = useState('');
  const [ikind, setIkind] = useState<LiveInvite['kind'][]>(['coffee']);
  const [ititle, setItitle] = useState('');
  const [place, setPlace] = useState('');
  const [hour, setHour] = useState('17:00');
  const [msg, setMsg] = useState<string | null>(null);

  function submitReport(e: FormEvent) {
    e.preventDefault();
    const mod = moderateMessage(note);
    if (!mod.ok) return setMsg(mod.message ?? 'Relato bloqueado pela moderação.');
    addReport({ stopId, kind: kind[0], note: note.trim() });
    setNote('');
    setForm(null);
    setMsg('Relato publicado. Ele expira em 12 horas.');
  }

  function submitInvite(e: FormEvent) {
    e.preventDefault();
    const mod = moderateMessage(`${ititle} ${place}`);
    if (!mod.ok) return setMsg(mod.message ?? 'Convite bloqueado pela moderação.');
    if (!ititle.trim() || !place.trim()) return setMsg('Preencha o título e o local público.');
    const day = new Date().toISOString().slice(0, 10);
    addInvite({ stopId, kind: ikind[0], title: ititle.trim(), placeName: place.trim(), startsAt: new Date(`${day}T${hour}:00`).toISOString() });
    setItitle('');
    setPlace('');
    setForm(null);
    setMsg('Convite publicado para quem está nesta parada.');
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-bold"><Radio aria-hidden className="text-danger" size={18} /> Camino Live</p>
        <DemoBadge compact />
      </div>
      <p className="text-sm text-muted">Mostramos contagens por etapa, nunca posições. Abaixo de 3 pessoas aparece &quot;menos de 3&quot;.</p>
      {msg && <Notice tone="success">{msg}</Notice>}

      {here && (
        <Card>
          <h2 className="text-lg font-bold">Saindo de {getStop(here.stopId)?.name} hoje</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 p-2"><p className="text-2xl font-extrabold">{displayCount(here.pilgrims)}</p><p className="text-sm text-muted">peregrinos</p></div>
            <div className="rounded-xl bg-surface-2 p-2"><p className="text-2xl font-extrabold">{displayCount(here.openToWalk)}</p><p className="text-sm text-muted">abertos a caminhar junto</p></div>
          </div>
          <p className="mt-3 text-sm font-semibold">Idiomas</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(here.languages).sort((a, b) => b[1] - a[1]).map(([l, n]) => <Badge key={l}>{LANG[l] ?? l} · {displayCount(n)}</Badge>)}
          </div>
          {here.departures.length > 0 && (
            <>
              <p className="mt-3 text-sm font-semibold">Grupos saindo</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {here.departures.map((d) => <li key={d.time}><Badge tone="blue">{d.time} · {d.people} pessoas</Badge></li>)}
              </ul>
            </>
          )}
          <div className="mt-2 border-t border-line pt-2">
            {presence ? (
              <Switch checked={openToWalk} onChange={setOpenToWalk} label="Estou aberto(a) a caminhar junto" description="Entra só na contagem desta etapa. Ninguém vê sua posição." />
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted">Para entrar na contagem e nos grupos, ative sua presença na comunidade. Sua localização continua oculta.</p>
                <Button variant="outline" size="sm" onClick={() => updatePrivacy({ communityPresence: true, invisibleMode: false })}>Ativar presença</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      <SectionTitle>Condições do caminho</SectionTitle>
      {reports.length === 0 && <p className="text-muted">Nenhum relato ativo nas últimas 12 horas.</p>}
      <ul className="flex flex-col gap-2">
        {reports.filter((r) => tripStops.includes(r.stopId)).map((r) => {
          const K = REPORT_KIND[r.kind];
          return (
            <li key={r.id}>
              <Card as="article" className="flex gap-3">
                <K.icon aria-hidden className="mt-1 shrink-0 text-terracotta" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{K.label} · {getStop(r.stopId)?.name}</p>
                  <p>{r.note}</p>
                  <p className="text-sm text-muted">{ago(r.createdAt)} · {r.confirmations} confirmação(ões){r.authorIsMe ? ' · seu relato' : ''}{r.isDemo ? ' · demonstração' : ''}</p>
                  {!r.authorIsMe && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant={votes[r.id] === 'confirm' ? 'secondary' : 'outline'} onClick={() => vote(r.id, 'confirm')} aria-pressed={votes[r.id] === 'confirm'}>Ainda está assim</Button>
                      <Button size="sm" variant="ghost" onClick={() => vote(r.id, 'gone')}>Já não está</Button>
                    </div>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <SectionTitle>Convites abertos</SectionTitle>
      <ul className="flex flex-col gap-2">
        {invites.filter((i) => tripStops.includes(i.stopId)).map((i) => {
          const K = INVITE_KIND[i.kind];
          const isGoing = going.includes(i.id);
          return (
            <li key={i.id}>
              <Card as="article" className="flex items-center gap-3">
                <K.icon aria-hidden className="shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{i.title}</p>
                  <p className="text-sm text-muted">{getStop(i.stopId)?.name} · {i.placeName} · {time(i.startsAt)} · {i.going + (isGoing && !i.hostIsMe ? 1 : 0)} vão · por {i.hostName}{i.isDemo ? ' (fictício)' : ''}</p>
                </div>
                {!i.hostIsMe && <Button size="sm" variant={isGoing ? 'secondary' : 'outline'} aria-pressed={isGoing} onClick={() => toggleGoing(i.id)}>{isGoing ? 'Vou' : 'Participar'}</Button>}
              </Card>
            </li>
          );
        })}
      </ul>

      {canPost ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant={form === 'report' ? 'secondary' : 'outline'} onClick={() => setForm(form === 'report' ? null : 'report')}>Relatar condição</Button>
          <Button variant={form === 'invite' ? 'secondary' : 'outline'} onClick={() => setForm(form === 'invite' ? null : 'invite')}>Criar convite</Button>
        </div>
      ) : (
        <PremiumHint>Relatar condições e criar convites fazem parte do Camino Pass. Ver relatos e participar é grátis.</PremiumHint>
      )}

      {form && (
        <Card>
          <form onSubmit={form === 'report' ? submitReport : submitInvite} className="flex flex-col gap-3">
            <SelectField label="Parada" value={stopId} onChange={(e) => setStopId(e.target.value)}>
              {tripStops.map((id) => <option key={id} value={id}>{getStop(id)?.name}</option>)}
            </SelectField>
            {form === 'report' ? (
              <>
                <ChipGroup label="O que está acontecendo" single value={kind} onChange={setKind} options={(Object.keys(REPORT_KIND) as LiveReport['kind'][]).map((id) => ({ id, label: REPORT_KIND[id].label }))} />
                <Field label="Detalhe (sem nomes ou dados pessoais)" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: fonte seca junto à capela" />
                <Button type="submit" disabled={note.trim().length < 5}>Publicar relato</Button>
              </>
            ) : (
              <>
                <ChipGroup label="Tipo" single value={ikind} onChange={setIkind} options={(Object.keys(INVITE_KIND) as LiveInvite['kind'][]).map((id) => ({ id, label: INVITE_KIND[id].label }))} />
                <Field label="Título" maxLength={60} value={ititle} onChange={(e) => setItitle(e.target.value)} placeholder="Ex.: Café antes da missa" />
                <Field label="Local público" hint="Praça, café, igreja. Nunca o endereço da sua hospedagem." maxLength={60} value={place} onChange={(e) => setPlace(e.target.value)} />
                <Field label="Horário" type="time" value={hour} onChange={(e) => setHour(e.target.value)} />
                <Button type="submit">Publicar convite</Button>
              </>
            )}
          </form>
        </Card>
      )}

      <SectionTitle>Etapas da sua viagem</SectionTitle>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Peregrinos e relatos por parada</caption>
          <thead className="bg-surface-2"><tr><th scope="col" className="p-3">Parada</th><th scope="col" className="p-3">Peregrinos</th><th scope="col" className="p-3">Relatos</th></tr></thead>
          <tbody>
            {stages.map((s) => (
              <tr key={s.stopId} className="border-t border-line">
                <th scope="row" className="p-3 font-semibold">{getStop(s.stopId)?.name}</th>
                <td className="p-3">{displayCount(s.pilgrims)}</td>
                <td className="p-3">{reports.filter((r) => r.stopId === s.stopId).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
