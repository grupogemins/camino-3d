'use client';
import { Check, Crown, Minus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Notice } from '@/components/ui/States';
import { usePlan } from '@/hooks/usePlan';
import { PLANS, getPlan, type Feature } from '@/lib/billing/plans';
import type { PlanId } from '@/lib/domain/types';
import { formatDate, formatEur } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

const ROWS: { label: string; free: string | boolean; premium: string | boolean; feature?: Feature }[] = [
  { label: 'Planejamento de rota e etapas', free: 'Básico', premium: 'Completo' },
  { label: 'Viagens ativas', free: '1', premium: 'Ilimitadas' },
  { label: 'Rotas alternativas avançadas', free: false, premium: true },
  { label: 'Navegação e mapas offline', free: false, premium: true },
  { label: 'Clima por etapa e alertas', free: 'Local atual', premium: true },
  { label: 'Tradutor por voz', free: '3 testes', premium: true },
  { label: 'Frases essenciais offline', free: true, premium: true },
  { label: 'Estabelecimentos por parada', free: 'Até 3', premium: 'Todos' },
  { label: 'Filtros avançados', free: false, premium: true },
  { label: 'Diário completo com fotos', free: '3 notas', premium: true },
  { label: 'Personalização ampliada do avatar', free: false, premium: true },
  { label: 'Comunidade', free: '5 mensagens/dia', premium: 'Grupos e mensagens ilimitadas' },
];

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <><Check aria-hidden className="mx-auto text-primary" /><span className="sr-only">Incluído</span></>;
  if (v === false) return <><Minus aria-hidden className="mx-auto text-muted" /><span className="sr-only">Não incluído</span></>;
  return <span className="text-sm">{v}</span>;
}

export function PremiumScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { plan } = usePlan();
  const subscription = useAppStore((s) => s.subscription);
  const subscribe = useAppStore((s) => s.subscribe);
  const cancel = useAppStore((s) => s.cancelSubscription);
  const email = useAppStore((s) => s.user?.email);
  const [selected, setSelected] = useState<Exclude<PlanId, 'free'>>('pass');
  const [demoOpen, setDemoOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const status = params.get('status');
    const p = params.get('plan') as Exclude<PlanId, 'free'> | null;
    if (status === 'success' && p) {
      // Em produção a ativação vem do webhook do Stripe (checkout.session.completed), não da URL.
      subscribe(p, 'stripe');
      setMsg('Pagamento confirmado pelo Stripe. Bem-vindo ao Premium!');
      router.replace('/premium');
    } else if (status === 'cancelled') setMsg('Pagamento cancelado. Nada foi cobrado.');
  }, [params, subscribe, router]);

  async function checkout(trial = false) {
    setBusy(true);
    setMsg(null);
    try {
      if (trial) {
        subscribe('monthly', 'demo', true);
        setMsg('Teste gratuito de 7 dias iniciado (demonstração).');
        return;
      }
      const res = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: selected, email }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? 'Erro');
      if (json.data.mode === 'stripe' && json.data.url) window.location.href = json.data.url;
      else setDemoOpen(true);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Não foi possível iniciar o pagamento.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar title="Planos" back="/eu" />
      <Card className="flex items-center gap-3">
        <Crown aria-hidden className="text-gold" />
        <div className="flex-1">
          <p className="text-sm text-muted">Seu plano atual</p>
          <p className="text-lg font-extrabold">{getPlan(plan).name}</p>
          {subscription && plan !== 'free' && subscription.currentPeriodEnd && (
            <p className="text-sm text-muted">{subscription.status === 'trialing' ? 'Teste até' : subscription.plan === 'pass' ? 'Válido até' : 'Renova em'} {formatDate(subscription.currentPeriodEnd)} {subscription.provider === 'demo' ? '(demonstração)' : ''}</p>
          )}
        </div>
        {plan !== 'free' && subscription?.status !== 'cancelled' && <Button variant="outline" onClick={cancel}>Cancelar</Button>}
      </Card>
      {msg && <div className="mt-3"><Notice tone="success">{msg}</Notice></div>}

      <fieldset className="mt-4">
        <legend className="mb-2 text-lg font-bold">Escolha seu plano</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((p) => {
            const isSel = p.id !== 'free' && selected === p.id;
            return (
              <label key={p.id} className={`flex cursor-pointer flex-col gap-2 rounded-2xl border-2 bg-surface p-4 ${isSel ? 'border-primary' : 'border-line'} ${p.id === 'free' ? 'cursor-default' : ''}`}>
                <span className="flex items-center justify-between">
                  <span className="font-extrabold">{p.name}</span>
                  {p.highlight && <Badge tone="gold">Mais indicado</Badge>}
                </span>
                <span><b className="text-2xl">{p.priceEur ? formatEur(p.priceEur) : 'Grátis'}</b> <span className="text-sm text-muted">{p.billing}</span></span>
                <ul className="flex flex-col gap-1 text-sm">
                  {p.bullets.map((b) => <li key={b} className="flex gap-1.5"><Check aria-hidden size={16} className="mt-0.5 shrink-0 text-primary" />{b}</li>)}
                </ul>
                {p.id !== 'free' ? (
                  <span className="mt-auto flex items-center gap-2 font-semibold">
                    <input type="radio" name="plan" className="h-5 w-5 accent-[var(--primary)]" checked={isSel} onChange={() => setSelected(p.id as Exclude<PlanId, 'free'>)} />
                    Selecionar
                  </span>
                ) : (
                  <span className="mt-auto text-sm text-muted">{plan === 'free' ? 'Seu plano atual' : 'Disponível ao cancelar'}</span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-4 flex flex-col gap-2">
        <Button size="lg" block onClick={() => checkout(false)} disabled={busy}>
          {busy ? 'Abrindo pagamento…' : `Assinar ${getPlan(selected).name} · ${formatEur(getPlan(selected).priceEur)}`}
        </Button>
        {plan === 'free' && <Button variant="outline" block onClick={() => checkout(true)}>Testar Premium grátis por 7 dias</Button>}
        <p className="text-xs text-muted">Pagamento processado pelo Stripe quando configurado. Preços com IVA incluído onde aplicável. Nos apps iOS/Android, a assinatura seguirá as regras de compra das lojas.</p>
      </div>

      <SectionTitle>Comparação</SectionTitle>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface" role="region" aria-label="Tabela comparativa de planos" tabIndex={0}>
        <table className="w-full text-left">
          <thead className="bg-surface-2 text-sm">
            <tr><th scope="col" className="p-3">Recurso</th><th scope="col" className="p-3 text-center">Gratuito</th><th scope="col" className="p-3 text-center">Premium / Passe</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="border-t border-line">
                <th scope="row" className="p-3 text-sm font-semibold">{r.label}</th>
                <td className="p-3 text-center"><Cell v={r.free} /></td>
                <td className="p-3 text-center"><Cell v={r.premium} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        title="Pagamento de demonstração"
        footer={
          <>
            <Button variant="outline" block onClick={() => setDemoOpen(false)}>Voltar</Button>
            <Button block onClick={() => { subscribe(selected, 'demo'); setDemoOpen(false); setMsg(`${getPlan(selected).name} ativado em modo demonstração. Nenhuma cobrança foi feita.`); }}>
              Simular assinatura
            </Button>
          </>
        }
      >
        <p>O Stripe ainda não está configurado neste ambiente (falta a chave secreta no servidor). Para demonstrar o fluxo, você pode simular a assinatura.</p>
        <p className="mt-2 font-semibold">Nenhum dado de cartão é solicitado e nada será cobrado.</p>
      </Dialog>
    </>
  );
}
