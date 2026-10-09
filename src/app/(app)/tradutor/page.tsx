'use client';
import { ArrowLeftRight, Heart, Languages, Mic, MicOff, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { PremiumHint } from '@/components/places/PremiumGate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { ChipGroup, SelectField } from '@/components/ui/Controls';
import { DemoBadge } from '@/components/ui/DataSource';
import { Dialog } from '@/components/ui/Dialog';
import { Notice } from '@/components/ui/States';
import { LANGUAGES, PHRASE_CATEGORIES, PHRASES, type LangCode, type PhraseCategory } from '@/data/demo/phrases';
import { usePlan } from '@/hooks/usePlan';
import type { TranslationResult } from '@/providers/types';
import { useAppStore } from '@/store/useAppStore';

const FREE_DEMO_TRANSLATIONS = 3;
const bcp = (c: LangCode) => LANGUAGES.find((l) => l.code === c)?.bcp47 ?? 'pt-PT';

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function speak(text: string, lang: LangCode) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = bcp(lang);
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
  return true;
}

export default function TradutorPage() {
  const { isPremium } = usePlan();
  const consentVoice = useAppStore((s) => s.privacy.consentVoiceProcessing);
  const updatePrivacy = useAppStore((s) => s.updatePrivacy);
  const used = useAppStore((s) => s.translationsUsed);
  const countTranslation = useAppStore((s) => s.countTranslation);
  const favorites = useAppStore((s) => s.phraseFavorites);
  const toggleFav = useAppStore((s) => s.togglePhraseFavorite);

  const [from, setFrom] = useState<LangCode>('pt');
  const [to, setTo] = useState<LangCode>('es');
  const [text, setText] = useState('');
  const [result, setResult] = useState<(TranslationResult & { isDemo: boolean; notice?: string }) | null>(null);
  const [listening, setListening] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<PhraseCategory | 'fav'>('emergencia');
  const [speechSupported, setSpeechSupported] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => setSpeechSupported(Boolean(getRecognition())), []);

  const limitReached = !isPremium && used >= FREE_DEMO_TRANSLATIONS;

  function startListening() {
    setError(null);
    if (!consentVoice) return setConsentOpen(true);
    const Rec = getRecognition();
    if (!Rec) return setError('Seu navegador não oferece reconhecimento de voz. Digite o texto abaixo.');
    const rec = new Rec();
    rec.lang = bcp(from);
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => setText(Array.from(e.results).map((r) => r[0].transcript).join(' '));
    rec.onerror = (e) => setError(e.error === 'not-allowed' ? 'Permissão de microfone negada.' : 'Não entendi. Tente de novo ou digite.');
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stopListening() {
    recRef.current?.stop();
    setListening(false);
  }

  async function translate() {
    if (!text.trim()) return setError('Fale ou digite algo para traduzir.');
    if (limitReached) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.trim(), from, to }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? 'Erro');
      setResult({ ...json.data, isDemo: json.meta.isDemo, notice: json.meta.notice });
      countTranslation();
    } catch (e) {
      setError(navigator.onLine ? (e instanceof Error ? e.message : 'Erro') : 'Sem conexão: use as frases essenciais offline abaixo.');
    } finally {
      setBusy(false);
    }
  }

  const phrases = category === 'fav' ? PHRASES.filter((p) => favorites.includes(p.id)) : PHRASES.filter((p) => p.category === category);

  return (
    <>
      <TopBar title="Tradutor" back="/explorar" actions={<DemoBadge compact />} />
      <Card className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <SelectField label="De" value={from} onChange={(e) => setFrom(e.target.value as LangCode)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </SelectField>
          </div>
          <Button variant="ghost" aria-label="Inverter idiomas" onClick={() => { setFrom(to); setTo(from); setResult(null); }}>
            <ArrowLeftRight aria-hidden />
          </Button>
          <div className="flex-1">
            <SelectField label="Para" value={to} onChange={(e) => setTo(e.target.value as LangCode)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </SelectField>
          </div>
        </div>

        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); if (!listening) startListening(); }}
          onPointerUp={() => listening && stopListening()}
          onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !listening) { e.preventDefault(); startListening(); } }}
          onKeyUp={(e) => { if ((e.key === ' ' || e.key === 'Enter') && listening) stopListening(); }}
          aria-pressed={listening}
          disabled={!speechSupported}
          className={`mx-auto flex h-28 w-28 flex-col items-center justify-center rounded-full text-sm font-bold shadow-lg transition-transform disabled:opacity-40 ${listening ? 'scale-110 bg-danger text-white' : 'bg-primary text-on-primary'}`}
        >
          {listening ? <MicOff aria-hidden size={36} /> : <Mic aria-hidden size={36} />}
          {listening ? 'Solte para parar' : 'Segure para falar'}
        </button>
        {!speechSupported && <p className="text-center text-sm text-muted">Reconhecimento de voz indisponível neste navegador. Digite abaixo.</p>}
        <p className="text-center text-xs text-muted">
          A transcrição usa o reconhecimento de voz do seu navegador, que pode enviar o áudio ao fornecedor do navegador. O texto é traduzido no servidor do Camino 3D{isPremium ? '' : ' (modo demonstração)'}.
        </p>

        <label htmlFor="src-text" className="font-semibold">Texto</label>
        <textarea id="src-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} className="rounded-xl border-2 border-line bg-surface p-3 text-lg" placeholder="Ex.: Onde fica a farmácia?" />
        {limitReached ? (
          <PremiumHint>Você usou as {FREE_DEMO_TRANSLATIONS} traduções de demonstração. O tradutor por voz completo está no Camino Pass; as frases essenciais seguem grátis e offline.</PremiumHint>
        ) : (
          <Button size="lg" block onClick={translate} disabled={busy} icon={<Languages aria-hidden />}>
            {busy ? 'Traduzindo…' : 'Traduzir'}
          </Button>
        )}
        {!isPremium && !limitReached && <p className="text-xs text-muted">Plano gratuito: {FREE_DEMO_TRANSLATIONS - used} tradução(ões) de demonstração restante(s).</p>}
        {error && <Notice tone="danger">{error}</Notice>}
        {result && (
          <div className="rounded-2xl bg-primary-soft p-4" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={result.method === 'phrasebook' ? 'green' : result.method === 'machine' ? 'blue' : 'gold'}>
                {result.method === 'phrasebook' ? 'Frase revisada' : result.method === 'machine' ? 'Tradução automática' : 'Tradução simulada'}
              </Badge>
              {result.isDemo && <DemoBadge compact />}
            </div>
            <p className="mt-2 text-2xl font-bold" lang={bcp(result.to)}>{result.text}</p>
            {result.notice && <p className="text-xs text-warning">{result.notice}</p>}
            <Button className="mt-2" variant="outline" onClick={() => speak(result.text, result.to)} icon={<Volume2 aria-hidden />}>
              Ouvir em {LANGUAGES.find((l) => l.code === result.to)?.label}
            </Button>
          </div>
        )}
      </Card>

      <SectionTitle>Frases essenciais (offline)</SectionTitle>
      <ChipGroup
        label="Categoria"
        single
        value={[category]}
        onChange={(v) => setCategory(v[0])}
        options={[{ id: 'fav' as const, label: 'Favoritas' }, ...PHRASE_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))]}
      />
      <ul className="mt-3 flex flex-col gap-2">
        {phrases.length === 0 && <li className="text-sm text-muted">Nenhuma frase favorita ainda. Toque no coração para salvar.</li>}
        {phrases.map((p) => {
          const target = p.text[to] ?? p.text.en;
          const fav = favorites.includes(p.id);
          return (
            <li key={p.id} className="flex items-center gap-2 rounded-2xl bg-surface p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">{p.text[from] ?? p.text.pt}</p>
                <p className="text-lg font-bold" lang={bcp(to)}>{target}</p>
              </div>
              <button type="button" onClick={() => speak(target, to)} className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary" aria-label={`Ouvir: ${target}`}>
                <Volume2 aria-hidden />
              </button>
              <button type="button" onClick={() => toggleFav(p.id)} aria-pressed={fav} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label={fav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}>
                <Heart aria-hidden className={fav ? 'fill-[var(--terracotta)] text-terracotta' : 'text-muted'} />
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        title="Permitir uso do microfone?"
        footer={
          <>
            <Button variant="outline" block onClick={() => setConsentOpen(false)}>Agora não</Button>
            <Button block onClick={() => { updatePrivacy({ consentVoiceProcessing: true }); setConsentOpen(false); }}>Permitir</Button>
          </>
        }
      >
        <p>Para transcrever sua fala, o app usa o reconhecimento de voz do navegador. Em alguns navegadores (como o Chrome), o áudio é enviado ao serviço do fornecedor do navegador para ser transcrito.</p>
        <ul className="mt-2 list-disc pl-5 text-sm">
          <li>Só gravamos enquanto você segura o botão.</li>
          <li>O Camino 3D não guarda o áudio.</li>
          <li>Você pode revogar em Perfil &gt; Privacidade.</li>
        </ul>
      </Dialog>
    </>
  );
}
