'use client';
import { AlarmClock, CheckCircle2, HeartPulse, MessageSquareWarning, Phone, PhoneCall, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { useEffect, useReducer, useState, type FormEvent } from 'react';
import { WaypointIcon } from '@/components/common/WaypointIcon';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Field } from '@/components/ui/Controls';
import { Dialog } from '@/components/ui/Dialog';
import { Notice } from '@/components/ui/States';
import { weatherUrl } from '@/components/weather/WeatherMini';
import { getStop } from '@/data/demo/stops';
import { useApi } from '@/hooks/useApi';
import { useTripContext } from '@/hooks/useTripContext';
import type { WeatherSnapshot } from '@/lib/domain/types';
import { EU_EMERGENCY_NUMBER, SOS_COUNTDOWN_SECONDS, sosReducer } from '@/lib/safety/sos';
import { coordAtRouteKm } from '@/lib/navigation';
import { useAppStore } from '@/store/useAppStore';

const GUIDES = [
  { title: 'Acidente ou queda', steps: ['Proteja: afaste-se de estradas e perigos.', 'Alerte: ligue 112 e diga onde está (km, vila, marco mais próximo).', 'Socorra: não mova quem possa ter lesão na coluna; mantenha a pessoa aquecida.'] },
  { title: 'Calor e insolação', steps: ['Procure sombra e beba água aos poucos.', 'Molhe nuca e pulsos.', 'Confusão, vômitos ou desmaio: ligue 112.'] },
  { title: 'Frio e chuva forte', steps: ['Troque roupas molhadas e coma algo.', 'Evite trilhas de montanha e beira de rios cheios.', 'Procure abrigo e avise seus contatos.'] },
  { title: 'Bolhas e tendinite', steps: ['Não estoure bolhas grandes; use penso próprio.', 'Reduza a etapa ou use transporte de apoio.', 'Dor que piora ao caminhar: procure uma farmácia ou centro de saúde.'] },
];

export default function SegurancaPage() {
  const { trip, route, currentSegment } = useTripContext();
  const contacts = useAppStore((s) => s.emergencyContacts);
  const addContact = useAppStore((s) => s.addContact);
  const removeContact = useAppStore((s) => s.removeContact);
  const checkIns = useAppStore((s) => s.checkIns);
  const scheduleCheckIn = useAppStore((s) => s.scheduleCheckIn);
  const resolveCheckIn = useAppStore((s) => s.resolveCheckIn);
  const simulatedKm = useAppStore((s) => s.simulatedKm);
  const [sos, dispatch] = useReducer((s: Parameters<typeof sosReducer>[0], a: Parameters<typeof sosReducer>[1]) => sosReducer(s, a), { step: 'idle' });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const dest = currentSegment ? getStop(currentSegment.toStopId) : route.stops[route.stops.length - 1];
  const weather = useApi<WeatherSnapshot>(dest ? weatherUrl(dest.coord, dest.name) : null);
  const position = coordAtRouteKm(route, simulatedKm);

  useEffect(() => {
    if (sos.step !== 'countdown') return;
    const id = setTimeout(() => dispatch({ type: 'tick' }), 1000);
    return () => clearTimeout(id);
  }, [sos]);

  useEffect(() => {
    if (sos.step === 'activated') window.location.href = `tel:${EU_EMERGENCY_NUMBER}`;
  }, [sos.step]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const smsBody = encodeURIComponent(`SOS Camino 3D: preciso de ajuda. Posição aproximada: https://www.openstreetmap.org/?mlat=${position[1].toFixed(5)}&mlon=${position[0].toFixed(5)}#map=15/${position[1].toFixed(5)}/${position[0].toFixed(5)}`);

  function onAddContact(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, '').length < 8) return;
    addContact({ name: name.trim(), phone: phone.trim(), relation: relation.trim() || 'Contato' });
    setName('');
    setPhone('');
    setRelation('');
  }

  const healthPoints = (currentSegment?.waypoints ?? route.waypoints).filter((w) => w.kind === 'pharmacy' || w.kind === 'health');

  return (
    <>
      <TopBar title="Central de Segurança" back />
      <Notice tone="warning">O Camino 3D não substitui os serviços oficiais de emergência. Em perigo, ligue {EU_EMERGENCY_NUMBER}.</Notice>

      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'press' })}
          className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-danger text-2xl font-extrabold text-white shadow-xl ring-8 ring-danger-soft [[data-theme=contrast]_&]:text-black"
          aria-describedby="sos-help"
        >
          <ShieldAlert aria-hidden size={44} />
          SOS
        </button>
        <p id="sos-help" className="text-center text-sm text-muted">
          Toque e confirme. Haverá {SOS_COUNTDOWN_SECONDS} segundos para cancelar antes de ligar para o {EU_EMERGENCY_NUMBER}.
        </p>
        <a href={`tel:${EU_EMERGENCY_NUMBER}`} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-danger font-bold text-danger">
          <PhoneCall aria-hidden /> Ligar diretamente para o {EU_EMERGENCY_NUMBER} (número europeu)
        </a>
      </div>

      <Dialog
        open={sos.step === 'confirming' || sos.step === 'countdown' || sos.step === 'activated'}
        onClose={() => dispatch({ type: sos.step === 'activated' ? 'reset' : 'cancel' })}
        title={sos.step === 'activated' ? 'SOS ativado' : 'Confirmar SOS?'}
        footer={
          sos.step === 'confirming' ? (
            <>
              <Button variant="outline" block onClick={() => dispatch({ type: 'cancel' })}>Cancelar</Button>
              <Button variant="danger" block onClick={() => dispatch({ type: 'confirm' })}>Sim, preciso de ajuda</Button>
            </>
          ) : sos.step === 'countdown' ? (
            <Button variant="outline" size="lg" block onClick={() => dispatch({ type: 'cancel' })}>Cancelar ({sos.secondsLeft})</Button>
          ) : (
            <Button block onClick={() => dispatch({ type: 'reset' })}>Fechar</Button>
          )
        }
      >
        {sos.step === 'confirming' && <p>Vamos ligar para o {EU_EMERGENCY_NUMBER} e preparar uma mensagem com sua posição aproximada para seus contatos de emergência.</p>}
        {sos.step === 'countdown' && (
          <p className="text-center text-5xl font-extrabold text-danger" role="timer" aria-live="assertive">
            {sos.secondsLeft}
          </p>
        )}
        {sos.step === 'activated' && (
          <div className="flex flex-col gap-3">
            <p>Abrindo a chamada para o {EU_EMERGENCY_NUMBER}. Se não abrir, toque no botão abaixo.</p>
            <a href={`tel:${EU_EMERGENCY_NUMBER}`} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-danger font-bold text-white"><Phone aria-hidden /> Ligar {EU_EMERGENCY_NUMBER}</a>
            {contacts.map((c) => (
              <a key={c.id} href={`sms:${c.phone}?body=${smsBody}`} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-line font-bold">
                <MessageSquareWarning aria-hidden /> Enviar posição para {c.name}
              </a>
            ))}
            {contacts.length === 0 && <p className="text-sm text-muted">Cadastre contatos de emergência para enviar sua posição.</p>}
            <p className="text-xs text-muted">Posição {trip ? 'da navegação (simulada no MVP)' : 'indisponível'}; compartilhada só com quem você escolher.</p>
          </div>
        )}
      </Dialog>

      {weather.data?.alerts.length ? (
        <section aria-labelledby="clima-severo">
          <SectionTitle id="clima-severo">Alertas de clima severo</SectionTitle>
          {weather.data.alerts.map((a) => (
            <Notice key={a.id} tone="danger">{a.title}: {a.description} ({a.issuer})</Notice>
          ))}
        </section>
      ) : null}

      <SectionTitle id="contatos">Contatos de emergência</SectionTitle>
      <Card>
        <ul className="flex flex-col gap-2">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <div className="flex-1">
                <p className="font-semibold">{c.name} <span className="text-sm font-normal text-muted">· {c.relation}</span></p>
                <p className="text-sm">{c.phone}</p>
              </div>
              <a href={`tel:${c.phone}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary" aria-label={`Ligar para ${c.name}`}><Phone aria-hidden /></a>
              <button type="button" onClick={() => removeContact(c.id)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label={`Remover ${c.name}`}><Trash2 aria-hidden /></button>
            </li>
          ))}
        </ul>
        <form onSubmit={onAddContact} className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Nome" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          <Field label="Telefone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 11 9…" />
          <Field label="Relação" value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Ex.: irmã" />
          <Button type="submit" variant="secondary" className="sm:col-span-3" icon={<Plus aria-hidden />}>Adicionar contato</Button>
        </form>
      </Card>

      <SectionTitle>Check-in de segurança</SectionTitle>
      <Card>
        <p className="text-sm">Agende um check-in. Se você não confirmar até o horário, o app sugere avisar seus contatos.</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[2, 4, 8].map((h) => (
            <Button key={h} variant="outline" onClick={() => scheduleCheckIn(h * 60)} icon={<AlarmClock aria-hidden size={18} />}>{h} h</Button>
          ))}
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {checkIns.slice(0, 4).map((c) => {
            const overdue = c.status === 'scheduled' && new Date(c.dueAt).getTime() < now;
            return (
              <li key={c.id} className={`flex items-center gap-2 rounded-xl p-2 ${overdue ? 'bg-danger-soft' : 'bg-surface-2'}`}>
                <span className="flex-1 text-sm">
                  {c.status === 'ok' ? 'Confirmado' : overdue ? 'Atrasado! Avise seus contatos.' : 'Agendado para'} {new Date(c.dueAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {c.status === 'scheduled' && <Button variant="secondary" onClick={() => resolveCheckIn(c.id, 'ok')} icon={<CheckCircle2 aria-hidden size={18} />}>Estou bem</Button>}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-muted">No MVP o aviso aparece no app. Notificações push e SMS automáticos entram com o backend.</p>
      </Card>

      <SectionTitle>Saúde e farmácias na etapa</SectionTitle>
      <ul className="flex flex-col gap-2">
        {healthPoints.map((w) => (
          <li key={w.id} className="flex items-center gap-2 rounded-xl bg-surface p-3"><WaypointIcon kind={w.kind} /> {w.name} <span className="text-sm text-muted">· km {w.km}</span></li>
        ))}
        {healthPoints.length === 0 && <li className="text-sm text-muted">Sem farmácia cadastrada nesta etapa. Veja a próxima vila no mapa.</li>}
      </ul>

      <SectionTitle>O que fazer em caso de…</SectionTitle>
      <div className="flex flex-col gap-2">
        {GUIDES.map((g) => (
          <details key={g.title} className="rounded-2xl bg-surface p-3">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold"><HeartPulse aria-hidden size={18} className="text-danger" />{g.title}</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm">
              {g.steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </details>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Orientações gerais, não substituem atendimento médico.</p>
    </>
  );
}
