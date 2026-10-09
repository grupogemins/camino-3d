'use client';
import { Badge } from '@/components/ui/Badge';
import { Card, SectionTitle } from '@/components/ui/Card';
import { demoAffiliates, demoCreatorRoutes } from '@/data/demo/affiliates';
import { getPlan } from '@/lib/billing/plans';
import { unitEconomics } from '@/lib/billing/economics';
import { formatEur } from '@/lib/format';

const pct = (n: number) => `${(n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const PROMO = 9.99;

const SCENARIOS = [
  { label: 'Web, preço cheio', input: { priceEur: getPlan('pass').priceEur } },
  { label: 'Web, cupom de lançamento', input: { priceEur: PROMO } },
  { label: 'Web, cupom de criador (25%)', input: { priceEur: PROMO, affiliateRate: 0.25 } },
  { label: 'App iOS/Android (loja 15%)', input: { priceEur: getPlan('pass').priceEur, storeFeeRate: 0.15 } },
  { label: 'Grupo/Família (4 pessoas)', input: { priceEur: getPlan('group').priceEur, variableCostEur: 2 } },
];

/** Economia por venda e cenários de mercado. Todos os números são hipóteses de planejamento. */
export function Economics() {
  const rows = SCENARIOS.map((s) => ({ ...s, r: unitEconomics(s.input) }));
  const market = 540_000;
  const blended = unitEconomics({ priceEur: 12.4, affiliateRate: 0.1 });
  return (
    <div className="mt-4 flex flex-col gap-4">
      <Card>
        <h2 className="font-bold">Quanto sobra de cada venda</h2>
        <p className="text-sm text-muted">Hipóteses: IVA médio de 21%, cartão europeu (1,5% + EUR 0,25), EUR 0,60 de APIs por jornada. Ajuste em src/lib/billing/economics.ts.</p>
        <div className="mt-2 overflow-x-auto" role="region" aria-label="Economia por venda" tabIndex={0}>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th scope="col" className="py-1.5">Cenário</th>
                <th scope="col" className="text-right">Preço</th>
                <th scope="col" className="text-right">IVA</th>
                <th scope="col" className="text-right">Tarifas/loja</th>
                <th scope="col" className="text-right">Criador</th>
                <th scope="col" className="text-right">APIs</th>
                <th scope="col" className="text-right">Sobra</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, r }) => (
                <tr key={label} className="border-t border-line">
                  <th scope="row" className="py-1.5 text-left font-semibold">{label}</th>
                  <td className="text-right">{formatEur(r.gross)}</td>
                  <td className="text-right">{formatEur(r.vat)}</td>
                  <td className="text-right">{formatEur(r.processing + r.storeFee)}</td>
                  <td className="text-right">{formatEur(r.affiliate)}</td>
                  <td className="text-right">{formatEur(r.variableCost)}</td>
                  <td className="text-right font-bold">{formatEur(r.contribution)} <span className="font-normal text-muted">({pct(r.contributionPct / 100)})</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">&quot;Sobra&quot; ainda não desconta suporte, moderação, infraestrutura fixa, reembolsos e aquisição paga.</p>
      </Card>
      <Card>
        <h2 className="font-bold">Cenários de mercado</h2>
        <p className="text-sm text-muted">Base de planejamento: {market.toLocaleString('pt-BR')} peregrinos por ano (estimativa do plano de negócios; confira com as estatísticas oficiais da Oficina do Peregrino). Ticket médio hipotético de {formatEur(12.4)} com 10% de comissão média.</p>
        <table className="mt-2 w-full text-sm">
          <thead><tr className="text-left text-muted"><th scope="col" className="py-1.5">Fatia do mercado</th><th scope="col" className="text-right">Passes/ano</th><th scope="col" className="text-right">Receita bruta</th><th scope="col" className="text-right">Sobra estimada</th></tr></thead>
          <tbody>
            {[0.01, 0.025, 0.05, 0.1].map((share) => {
              const n = Math.round(market * share);
              return (
                <tr key={share} className="border-t border-line">
                  <th scope="row" className="py-1.5 text-left font-semibold">{pct(share)}</th>
                  <td className="text-right">{n.toLocaleString('pt-BR')}</td>
                  <td className="text-right">{formatEur(n * 12.4)}</td>
                  <td className="text-right">{formatEur(n * blended.contribution)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">Converter 10% de quem chega a uma página qualificada é diferente de alcançar 10% de todo o mercado. Meça o funil por etapa: alcance × visitas qualificadas × início da compra × pagamento aprovado.</p>
      </Card>
    </div>
  );
}

/** Criadores e afiliados: links, cupons, desempenho e comissão. */
export function Affiliates() {
  const commission = unitEconomics({ priceEur: PROMO, affiliateRate: 1 }).affiliate;
  return (
    <div className="mt-4 flex flex-col gap-4">
      <Card>
        <h2 className="font-bold">Criadores e afiliados</h2>
        <p className="text-sm text-muted">Link de indicação: <code>/?ref=CODIGO</code> (válido por 30 dias). O mesmo código funciona como cupom de {formatEur(PROMO)} para a audiência.</p>
        <div className="mt-2 overflow-x-auto" role="region" aria-label="Desempenho dos criadores" tabIndex={0}>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th scope="col" className="py-1.5">Criador</th>
                <th scope="col">Código</th>
                <th scope="col" className="text-right">Cliques</th>
                <th scope="col" className="text-right">Checkouts</th>
                <th scope="col" className="text-right">Vendas</th>
                <th scope="col" className="text-right">Conversão</th>
                <th scope="col" className="text-right">Comissão a pagar</th>
              </tr>
            </thead>
            <tbody>
              {demoAffiliates.map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <th scope="row" className="py-1.5 text-left font-semibold">
                    {a.name}
                    <span className="ml-1 inline-flex gap-1 align-middle">
                      <Badge tone={a.status === 'active' ? 'green' : a.status === 'pending' ? 'blue' : 'neutral'}>{a.status === 'active' ? 'Ativo' : a.status === 'pending' ? 'Pendente' : 'Pausado'}</Badge>
                      {a.nameUseAuthorized && <Badge tone="gold">Nome autorizado</Badge>}
                    </span>
                  </th>
                  <td><code>{a.code}</code></td>
                  <td className="text-right">{a.stats.clicks.toLocaleString('pt-BR')}</td>
                  <td className="text-right">{a.stats.checkouts.toLocaleString('pt-BR')}</td>
                  <td className="text-right">{a.stats.sales.toLocaleString('pt-BR')}</td>
                  <td className="text-right">{a.stats.clicks ? pct(a.stats.sales / a.stats.clicks) : '—'}</td>
                  <td className="text-right font-bold">{formatEur(a.stats.sales * commission * a.commissionRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">Dados simulados. Comissão sobre a receita líquida (sem IVA e tarifas) de vendas confirmadas, após o prazo de reembolso.</p>
      </Card>
      <Card>
        <h2 className="font-bold">Rotas de criadores ({demoCreatorRoutes.length})</h2>
        <ul className="mt-2 divide-y divide-line text-sm">
          {demoCreatorRoutes.map((r) => (
            <li key={r.id} className="flex justify-between py-1.5"><span>{r.title}</span><span className="text-muted">{r.tips.length} dicas · base {r.baseRouteId}</span></li>
          ))}
        </ul>
        <SectionTitle>Regras para criadores</SectionTitle>
        <ul className="list-disc pl-5 text-sm">
          <li>&quot;O Caminho de [criador]&quot; só com autorização de uso do nome por escrito.</li>
          <li>Conteúdo patrocinado sinalizado conforme as regras de publicidade de cada país.</li>
          <li>Dicas de criadores nunca substituem alertas de segurança.</li>
        </ul>
      </Card>
    </div>
  );
}
