'use client';
import { Flag, Send, ShieldBan } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { PremiumHint } from '@/components/places/PremiumGate';
import { Button } from '@/components/ui/Button';
import { EmptyState, Notice } from '@/components/ui/States';
import { DEMO_REPLIES, demoPilgrims } from '@/data/demo/pilgrims';
import { usePlan } from '@/hooks/usePlan';
import { FREE_LIMITS } from '@/lib/billing/plans';
import { moderateMessage } from '@/lib/moderation';
import { SlidingWindowLimiter } from '@/lib/server/rateLimit';
import { useAppStore } from '@/store/useAppStore';

// Anti-spam no cliente: até 5 mensagens a cada 30 s (o servidor repete a regra em produção).
const limiter = new SlidingWindowLimiter(5, 30_000);

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const chat = useAppStore((s) => s.chats[id]);
  const userId = useAppStore((s) => s.user?.id ?? 'me');
  const appendMessage = useAppStore((s) => s.appendMessage);
  const countMessageSent = useAppStore((s) => s.countMessageSent);
  const sentToday = useAppStore((s) => s.messagesSentToday);
  const block = useAppStore((s) => s.block);
  const report = useAppStore((s) => s.report);
  const { isPremium } = usePlan();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [chat?.messages.length]);

  if (!chat) {
    return (
      <>
        <TopBar title="Conversa" back="/comunidade" />
        <EmptyState title="Conversa não encontrada" description="Conecte-se a um peregrino para iniciar uma conversa." />
      </>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const usedToday = sentToday.date === today ? sentToday.count : 0;
  const limitReached = !isPremium && usedToday >= FREE_LIMITS.messagesPerDay;
  const peer = demoPilgrims.find((p) => p.id === chat.peerId);

  function send(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (limitReached) return;
    const recent = chat.messages.filter((m) => m.senderId === userId).slice(-5).map((m) => m.body);
    const mod = moderateMessage(text, recent);
    if (!mod.ok) return setError(mod.message ?? 'Mensagem bloqueada.');
    if (!limiter.check(`${userId}:${id}`).allowed) return setError('Você está enviando mensagens rápido demais. Aguarde alguns segundos.');
    appendMessage(id, userId, text.trim());
    countMessageSent();
    setText('');
    // resposta simulada para demonstração
    setTimeout(() => {
      appendMessage(id, chat.peerId ?? 'group-demo', `${DEMO_REPLIES[chat.messages.length % DEMO_REPLIES.length]} (resposta simulada)`);
    }, 1200);
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <TopBar
        title={chat.title}
        subtitle={chat.kind === 'group' ? 'Grupo de demonstração' : 'Peregrino fictício (demonstração)'}
        back="/comunidade"
        actions={
          peer && (
            <div className="flex">
              <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label={`Denunciar ${peer.displayName}`} onClick={() => { report(peer.id); block(peer.id); router.push('/comunidade'); }}>
                <Flag aria-hidden />
              </button>
              <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label={`Bloquear ${peer.displayName}`} onClick={() => { block(peer.id); router.push('/comunidade'); }}>
                <ShieldBan aria-hidden />
              </button>
            </div>
          )
        }
      />
      <Notice tone="info">Combine encontros só em locais públicos. Não compartilhe endereço de hospedagem nem telefone.</Notice>
      <ol className="mt-3 flex flex-1 flex-col gap-2" aria-live="polite" aria-label="Mensagens">
        {chat.messages.length === 0 && <li className="text-center text-sm text-muted">Diga olá! Ex.: &quot;Bom Caminho! Em que etapa você está?&quot;</li>}
        {chat.messages.map((m) => {
          const mine = m.senderId === userId;
          return (
            <li key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? 'self-end bg-primary text-on-primary' : 'self-start bg-surface'}`}>
              <span className="sr-only">{mine ? 'Você: ' : `${chat.title}: `}</span>
              {m.body}
              <span className="mt-0.5 block text-right text-[11px] opacity-75">{new Date(m.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </li>
          );
        })}
        <div ref={endRef} />
      </ol>
      <div className="sticky bottom-20 mt-3 bg-bg pb-2 md:bottom-0">
        {error && <Notice tone="danger">{error}</Notice>}
        {limitReached ? (
          <PremiumHint>Você atingiu o limite de {FREE_LIMITS.messagesPerDay} mensagens por dia do plano gratuito.</PremiumHint>
        ) : (
          <form onSubmit={send} className="mt-2 flex gap-2">
            <label htmlFor="msg" className="sr-only">Mensagem</label>
            <input id="msg" value={text} onChange={(e) => setText(e.target.value)} maxLength={600} className="min-h-12 flex-1 rounded-2xl border-2 border-line bg-surface px-3" placeholder="Escreva uma mensagem" autoComplete="off" />
            <Button type="submit" aria-label="Enviar" icon={<Send aria-hidden />}>
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        )}
        {!isPremium && !limitReached && <p className="mt-1 text-xs text-muted">{FREE_LIMITS.messagesPerDay - usedToday} mensagem(ns) restante(s) hoje no plano gratuito.</p>}
      </div>
    </div>
  );
}
