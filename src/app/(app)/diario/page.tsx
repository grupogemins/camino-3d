'use client';
import { Award, Camera, Flag, Footprints, Globe, Languages, NotebookPen, Route as RouteIcon, Share2, Sparkles, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { PremiumHint } from '@/components/places/PremiumGate';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle, Stat } from '@/components/ui/Card';
import { ChipGroup, Field, SelectField } from '@/components/ui/Controls';
import { EmptyState, Notice } from '@/components/ui/States';
import { ACHIEVEMENTS } from '@/data/demo/achievements';
import { usePlan } from '@/hooks/usePlan';
import { useTripContext } from '@/hooks/useTripContext';
import type { JournalEntry } from '@/lib/domain/types';
import { addDays, formatDate, formatKm } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

const ICONS = { footprints: Footprints, flag: Flag, route: RouteIcon, award: Award, globe: Globe, languages: Languages, 'notebook-pen': NotebookPen, sparkles: Sparkles } as const;
const MOODS = [{ id: 'great', label: '😄 Ótimo' }, { id: 'good', label: '🙂 Bem' }, { id: 'tired', label: '😮‍💨 Cansado' }, { id: 'hard', label: '😣 Difícil' }] as const;
const FREE_ENTRIES = 3;

/** Reduz a foto para caber no armazenamento local (máx. 640 px, JPEG). */
async function downscale(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 640 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.72);
}

function Stamp({ town, date, index }: { town: string; date: string; index: number }) {
  const rot = ((index * 37) % 20) - 10;
  return (
    <div className="flex aspect-square items-center justify-center" style={{ transform: `rotate(${rot}deg)` }}>
      <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label={`Carimbo simbólico de ${town}`}>
        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--terracotta)" strokeWidth="4" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="var(--terracotta)" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M50 66 C 36 56, 36 42, 50 34 C 64 42, 64 56, 50 66 Z" fill="var(--terracotta)" opacity="0.85" />
        <text x="50" y="26" fontSize="9" textAnchor="middle" fill="var(--terracotta)" fontWeight="bold">{town.slice(0, 14).toUpperCase()}</text>
        <text x="50" y="82" fontSize="8" textAnchor="middle" fill="var(--terracotta)">{date}</text>
      </svg>
    </div>
  );
}

export default function DiarioPage() {
  const { trip } = useTripContext();
  const journal = useAppStore((s) => s.journal);
  const addJournal = useAppStore((s) => s.addJournal);
  const removeJournal = useAppStore((s) => s.removeJournal);
  const unlocked = useAppStore((s) => s.achievementsUnlocked);
  const { can } = usePlan();
  const full = can('full_journal');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood'][]>(['good']);
  const [segmentId, setSegmentId] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const done = trip ? trip.segments.filter((s) => trip.completedSegmentIds.includes(s.id)) : [];
  const walked = done.reduce((a, s) => a + s.distanceKm, 0);
  const places = [...new Set(done.map((s) => s.toName))];
  const canAdd = full || journal.length < FREE_ENTRIES;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setMsg('Dê um título para a nota.');
    const seg = trip?.segments.find((s) => s.id === segmentId);
    addJournal({ title: title.trim(), body: body.trim(), photos, mood: mood[0], tripId: trip?.id, segmentId: seg?.id, distanceKm: seg?.distanceKm, placesVisited: seg ? [seg.toName] : [] });
    setTitle('');
    setBody('');
    setPhotos([]);
    setMsg('Nota salva no seu diário (neste aparelho).');
  }

  async function onPhotos(files: FileList | null) {
    if (!files) return;
    const list = await Promise.all([...files].slice(0, 3 - photos.length).map(downscale));
    setPhotos((p) => [...p, ...list].slice(0, 3));
  }

  async function share() {
    const text = `Meu Caminho com o Camino 3D: ${formatKm(walked)} caminhados, ${done.length} etapa(s) concluída(s)${places.length ? `, passando por ${places.join(', ')}` : ''}. Bom Caminho!`;
    try {
      if (navigator.share) await navigator.share({ title: 'Meu Caminho', text });
      else {
        await navigator.clipboard.writeText(text);
        setMsg('Resumo copiado para a área de transferência.');
      }
    } catch {
      /* compartilhamento cancelado */
    }
  }

  return (
    <>
      <TopBar title="Diário e conquistas" back="/eu" />
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Caminhados" value={formatKm(walked)} />
        <Stat label="Etapas" value={`${done.length}/${trip?.segments.length ?? 0}`} />
        <Stat label="Lugares" value={places.length} />
      </div>
      <Button className="mt-3" variant="outline" block onClick={share} icon={<Share2 aria-hidden />}>Compartilhar resumo</Button>

      <SectionTitle>Carimbos digitais</SectionTitle>
      <Notice tone="info">Carimbos simbólicos do app. Não substituem a credencial oficial do peregrino nem os carimbos físicos exigidos para a Compostela.</Notice>
      {done.length ? (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {done.map((s, i) => (
            <li key={s.id}><Stamp town={s.toName} date={formatDate(addDays(trip!.startDate, s.day - 1))} index={i} /></li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">Conclua uma etapa (em Detalhes da etapa) para ganhar o primeiro carimbo.</p>
      )}

      <SectionTitle>Conquistas</SectionTitle>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const Icon = ICONS[a.icon as keyof typeof ICONS] ?? Award;
          const on = Boolean(unlocked[a.code]);
          return (
            <li key={a.id} className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-center ${on ? 'bg-gold-soft' : 'bg-surface-2 opacity-60'}`}>
              <Icon aria-hidden className={on ? 'text-warning' : 'text-muted'} />
              <p className="text-sm font-bold">{a.title}</p>
              <p className="text-xs text-muted">{a.description}</p>
              <span className="sr-only">{on ? 'Conquistada' : 'Ainda não conquistada'}</span>
            </li>
          );
        })}
      </ul>

      <SectionTitle>Nova nota</SectionTitle>
      {canAdd ? (
        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Field label="Título" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: A ponte de Ponte de Lima" />
            <div className="flex flex-col gap-1">
              <label htmlFor="j-body" className="font-semibold">Como foi o dia?</label>
              <textarea id="j-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} className="rounded-xl border-2 border-line bg-surface p-3" />
            </div>
            {trip && (
              <SelectField label="Etapa" value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
                <option value="">Sem etapa</option>
                {trip.segments.map((s) => <option key={s.id} value={s.id}>Dia {s.day}: {s.toName}</option>)}
              </SelectField>
            )}
            <ChipGroup label="Humor" single value={mood as string[]} onChange={(v) => setMood(v as JournalEntry['mood'][])} options={MOODS.map((m) => ({ id: m.id, label: m.label }))} />
            {full ? (
              <div>
                <label htmlFor="j-photos" className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line font-semibold">
                  <Camera aria-hidden /> Adicionar fotos ({photos.length}/3)
                </label>
                <input id="j-photos" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onPhotos(e.target.files)} />
                {photos.length > 0 && <div className="mt-2 flex gap-2">{photos.map((p, i) => <img key={i} src={p} alt={`Foto ${i + 1} da nota`} className="h-20 w-20 rounded-xl object-cover" />)}</div>}
              </div>
            ) : (
              <PremiumHint>Fotos no diário fazem parte do diário completo (Camino Pass).</PremiumHint>
            )}
            <Button type="submit" icon={<NotebookPen aria-hidden />}>Salvar nota</Button>
            {msg && <p className="text-sm font-semibold text-primary" role="status">{msg}</p>}
          </form>
        </Card>
      ) : (
        <PremiumHint>O plano gratuito guarda até {FREE_ENTRIES} notas. O diário completo, com fotos, está no Camino Pass.</PremiumHint>
      )}

      <SectionTitle>Minhas notas</SectionTitle>
      {journal.length === 0 ? (
        <EmptyState title="Seu diário está vazio" description="Registre o que viu, quem conheceu e como se sentiu." />
      ) : (
        <ul className="flex flex-col gap-3">
          {journal.map((j) => (
            <li key={j.id}>
              <Card as="article">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold">{j.title}</h3>
                    <p className="text-sm text-muted">{new Date(j.createdAt).toLocaleDateString('pt-BR')} {j.placesVisited[0] ? `· ${j.placesVisited[0]}` : ''} {j.distanceKm ? `· ${formatKm(j.distanceKm)}` : ''} · {MOODS.find((m) => m.id === j.mood)?.label}</p>
                  </div>
                  <button type="button" onClick={() => removeJournal(j.id)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label={`Apagar nota ${j.title}`}><Trash2 aria-hidden /></button>
                </div>
                {j.body && <p className="mt-2 whitespace-pre-line">{j.body}</p>}
                {j.photos.length > 0 && <div className="mt-2 flex gap-2">{j.photos.map((p, i) => <img key={i} src={p} alt={`Foto ${i + 1} de ${j.title}`} className="h-24 w-24 rounded-xl object-cover" />)}</div>}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
