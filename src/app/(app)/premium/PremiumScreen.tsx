'use client';
import { Check, Copy, Crown, Minus, Ticket } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Field } from '@/components/ui/Controls';
import { Dialog } from '@/components/ui/Dialog';
import { Notice } from '@/components/ui/States';
import { usePlan } from '@/hooks/usePlan';
import { applyCoupon, type CouponResult } from '@/lib/billing/coupons';
import { FAIR_USE, PLANS, REFUND_WINDOW_DAYS, getPlan } from '@/lib/billing/plans';
import { storedReferral } from '@/lib/billing/referral';
import type { PlanId } from '@/lib/domain/types';
import { formatDate, formatEur } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

type PaidPlan = Exclude<PlanId, 'free'>;

const ROWS: { label: string; free: string | boolean; pass: string | boolean }[] = [
  { label: 'Explorar rotas e planejar a viagem', free: true, pass: true },
  { label: 'Criar e personalizar o peregrino 3D', free: 'Básico', pass: 'Completo' },
  { label: 'Copiloto (sugestões do dia)', free: '1 por dia', pass: 'Todas' },
  { label: 'Rotas alternativas e replanejamento', free: false, pass: true },
  { label: 'Navegação e mapas offline', free: false, pass: true },
  { label: 'Clima por etapa e alertas', free: 'Local atual', pass: true },
  { label: 'Camino Live: relatos e grupos', free: 'Só leitura', pass: true },
  { label: 'Tradutor por voz', free: '3 testes', pass: `Até ${FAIR_USE.machineTranslationsPerJourney} por jornada` },
  { label: 'Frases essenciais offline', free: true, pass: true },
  { label: 'Estabelecimentos por parada', free: 'Até 3', pass: 'Todos' },
  { label: 'Diário completo com fotos', free: '3 notas', pass: true },
  { label: 'Cartões de etapa', free: 'Com marca d\'água', pass: true },
  { label: 'Retrospectiva final', free: false, pass: true },
  { label: 'Acesso à jornada e às memórias', free: true, pass: 'Para sempre' },
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
  const refund = useAppStore((s) => s.cancelSubscription);
  const email = useAppStore((s) => s.user?.email);
  const [selected, setSelected] = useState<PaidPlan>('pass');
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Cupom vindo do link do afiliado (?ref=) ou da URL (?cupom=).
  useEffect(() => {
    const fromUrl = params.get('cupom') ?? storedReferral();
    if (fromUrl) {
      setCode(fromUrl);
      setCoupon(applyCoupon('pass', fromUrl));
    }
  }, [params]);

  useEffect(() => {
    const status = params.get('status');
    const p = params.get('plan') as PaidPlan | null;
    if (status === 'success' && p) {
      // Em produção a ativação vem do webhook do Stripe (checkout.session.completed), não da URL.
      const c = params.get('coupon');
      const applied = c ? applyCoupon(p, c) : null;
      subscribe(p, 'stripe', { couponCode: applied?.ok ? applied.code : undefined, amountPaidEur: applied?.ok ? applied.priceEur : undefined, affiliateId: applied?.ok ? applied.affiliate?.id : undefined });
      setMsg(`Pagamento confirmado pelo Stripe. Seu ${getPlan(p).name} está ativo. Bom Caminho!`);
      router.replace('/premium');
    } else if (status === 'cancelled') setMsg('Pagamento cancelado. Nada foi cobrado.');
  }, [params, subscribe, router]);

  const current = coupon?.ok ? applyCoupon(selected, coupon.code) : null;
  const price = current?.ok ? current.priceEur : getPlan(selected).priceEur;

  function onApply() {
    const r = applyCoupon(selected, code);
    setCoupon(r);
  }

  async function checkout(trial = false) {
    setBusy(true);
    setMsg(null);
    try {
      if (trial) {
        subscribe('pass', 'demo', { trial: true });
        setMsg('Teste gratuito de 7 dias do Camino Pass iniciado (demonstração). Nada será cobrado.');
        return;
      }
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selected, email, coupon: current?.ok ? current.code : undefined }),
      });
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

  const purchasedAt = subscription?.createdAt ? new Date(subscription.createdAt) : null;
  const canRefund = subscription?.status === 'active' && purchasedAt && Date.now() - purchasedAt.getTime() < REFUND_WINDOW_DAYS * 86_400_000;

  return (
    <>
      <TopBar title="Camino Pass" back="/eu" />
      <Card className="flex items-center gap-3">
        <Crown aria-hidden className="text-gold" />
        <div className="flex-1">
          <p className="text-sm text-muted">Seu plano atual</p>
          <p className="text-lg font-extrabold">{getPlan(plan).name}</p>
          {subscription && plan !== 'free' && (
            <p className="text-sm text-muted">
              {subscription.status === 'trialing' && subscription.currentPeriodEnd
                ? `Teste até ${formatDate(subscription.currentPeriodEnd)}`
                : `Jornada liberada para sempre${subscription.amountPaidEur ? ` · pago ${formatEur(subscription.amountPaidEur)}` : ''}${subscription.couponCode ? ` com o cupom ${subscription.couponCode}` : ''}`}
              {subscription.provider === 'demo' ? ' (demonstração)' : ''}
            </p>
          )}
        </div>
        {canRefund && <Button variant="outline" onClick={refund}>Pedir reembolso</Button>}
      </Card>
      {subscription?.plan === 'group' && subscription.status === 'active' && subscription.inviteCodes && (
        <Card className="mt-3">
          <h2 className="font-bold">Convites do seu grupo</h2>
          <p className="text-sm text-muted">Envie um código para cada pessoa que caminha com você. Cada uma cria o próprio peregrino.</p>
          <ul className="mt-2 flex flex-col gap-1">
            {subscription.inviteCodes.map((c) => (
              <li key={c} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 font-mono">
                {c}
                <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface" aria-label={`Copiar convite ${c}`} onClick={() => navigator.clipboard?.writeText(c)}>
                  <Copy aria-hidden size={18} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {msg && <div className="mt-3"><Notice tone="success">{msg}</Notice></div>}

      <p className="mt-4 text-muted">Sem assinatura. Você paga uma vez por jornada e o app acompanha o planejamento, a caminhada e as memórias depois da chegada.</p>

      <fieldset className="mt-3">
        <legend className="mb-2 text-lg font-bold">Escolha</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((p) => {
            const isSel = p.id !== 'free' && selected === p.id;
            const promo = p.id !== 'free' && coupon?.ok ? applyCoupon(p.id, coupon.code) : null;
            return (
              <label
                key={p.id}
                className={`relative flex flex-col gap-2 overflow-hidden rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)] ${
                  p.highlight ? 'topo bg-primary text-on-primary' : 'border border-line/70 bg-surface'
                } ${isSel ? 'ring-[3px] ring-[var(--gold)] ring-offset-2 ring-offset-[var(--bg)]' : ''} ${p.id === 'free' ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {p.highlight && (
                  <>
                    <span aria-hidden className="absolute -left-3 top-[5.6rem] h-6 w-6 rounded-full bg-bg" />
                    <span aria-hidden className="absolute -right-3 top-[5.6rem] h-6 w-6 rounded-full bg-bg" />
                  </>
                )}
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-xl">{p.name}</span>
                  {p.highlight && <span className="rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-xs font-bold text-ink">Mais indicado</span>}
                </span>
                <span className={p.highlight ? 'border-b border-dashed border-white/30 pb-3' : ''}>
                  {promo?.ok ? (
                    <>
                      <s className="opacity-60">{formatEur(p.priceEur)}</s> <b className="font-display text-3xl font-semibold">{formatEur(promo.priceEur)}</b>
                    </>
                  ) : (
                    <b className="font-display text-3xl font-semibold">{p.priceEur ? formatEur(p.priceEur) : 'Grátis'}</b>
                  )}{' '}
                  <span className="text-sm opacity-75">{p.billing}</span>
                </span>
                <ul className="flex flex-col gap-1 text-sm">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex gap-1.5">
                      <Check aria-hidden size={16} className={`mt-0.5 shrink-0 ${p.highlight ? 'text-[var(--gold)]' : 'text-primary'}`} />
                      {b}
                    </li>
                  ))}
                </ul>
                {p.id !== 'free' ? (
                  <span className="mt-auto flex items-center gap-2 pt-1 font-semibold">
                    <input type="radio" name="plan" className="h-5 w-5 accent-[var(--gold)]" checked={isSel} onChange={() => setSelected(p.id as PaidPlan)} />
                    Selecionar
                  </span>
                ) : (
                  <span className="mt-auto text-sm text-muted">{plan === 'free' ? 'Seu plano atual' : 'Sempre disponível'}</span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <Card className="mt-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="Cupom de lançamento ou de criador" value={code} onChange={(e) => { setCode(e.target.value); setCoupon(null); }} placeholder="Ex.: LANCAMENTO" autoCapitalize="characters" />
          </div>
          <Button variant="outline" onClick={onApply} icon={<Ticket aria-hidden size={18} />}>Aplicar</Button>
        </div>
        {coupon && (
          <p role="status" className={`mt-2 text-sm font-semibold ${coupon.ok ? 'text-primary' : 'text-danger'}`}>
            {coupon.ok
              ? coupon.kind === 'affiliate'
                ? `Cupom de ${coupon.affiliate?.name}: ${formatEur(current?.ok ? current.priceEur : coupon.priceEur)} em vez de ${formatEur(getPlan(selected).priceEur)}.`
                : `Oferta de lançamento: ${formatEur(current?.ok ? current.priceEur : coupon.priceEur)} em vez de ${formatEur(getPlan(selected).priceEur)}.`
              : coupon.message}
          </p>
        )}
        <p className="mt-1 text-xs text-muted">Cupons de demonstração: LANCAMENTO, ANACAMINHA, TRILHASPAO.</p>
      </Card>

      <div className="mt-4 flex flex-col gap-2">
        <Button size="lg" block onClick={() => checkout(false)} disabled={busy}>
          {busy ? 'Abrindo pagamento…' : `Comprar ${getPlan(selected).name} · ${formatEur(price)}`}
        </Button>
        {plan === 'free' && !subscription && <Button variant="outline" block onClick={() => checkout(true)}>Testar o Camino Pass grátis por 7 dias</Button>}
        <p className="text-xs text-muted">
          Pagamento único processado pelo Stripe quando configurado, com IVA incluído onde aplicável. Reembolso em até {REFUND_WINDOW_DAYS} dias conforme a lei europeia de consumo. Recursos com custo por uso (tradução automática) têm limite de uso justo. Nos apps iOS/Android, a compra seguirá as regras das lojas.
        </p>
      </div>

      <SectionTitle>Comparação</SectionTitle>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface" role="region" aria-label="Tabela comparativa" tabIndex={0}>
        <table className="w-full text-left">
          <thead className="bg-surface-2 text-sm">
            <tr><th scope="col" className="p-3">Recurso</th><th scope="col" className="p-3 text-center">Gratuito</th><th scope="col" className="p-3 text-center">Camino Pass</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="border-t border-line">
                <th scope="row" className="p-3 text-sm font-semibold">{r.label}</th>
                <td className="p-3 text-center"><Cell v={r.free} /></td>
                <td className="p-3 text-center"><Cell v={r.pass} /></td>
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
            <Button
              block
              onClick={() => {
                subscribe(selected, 'demo', { couponCode: current?.ok ? current.code : undefined, amountPaidEur: price, affiliateId: current?.ok ? current.affiliate?.id : undefined });
                setDemoOpen(false);
                setMsg(`${getPlan(selected).name} ativado em modo demonstração. Nenhuma cobrança foi feita.`);
              }}
            >
              Simular compra
            </Button>
          </>
        }
      >
        <p>O Stripe ainda não está configurado neste ambiente (falta a chave secreta no servidor). Para demonstrar o fluxo, você pode simular a compra de {formatEur(price)}.</p>
        <p className="mt-2 font-semibold">Nenhum dado de cartão é solicitado e nada será cobrado.</p>
      </Dialog>
    </>
  );
}
