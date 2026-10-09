/**
 * Economia por venda do Camino Pass. Valores padrão são HIPÓTESES para planejamento:
 * IVA médio de 21% (o real depende do país do comprador, regime OSS),
 * tarifa Stripe de cartão europeu (1,5% + EUR 0,25) e custo variável de APIs por jornada.
 */
export interface EconomicsInput {
  priceEur: number;
  vatRate?: number;
  processorPct?: number;
  processorFixedEur?: number;
  affiliateRate?: number;
  variableCostEur?: number;
  /** Comissão da loja (IAP) quando a venda acontece dentro do app iOS/Android. */
  storeFeeRate?: number;
}

export interface EconomicsResult {
  gross: number;
  vat: number;
  processing: number;
  storeFee: number;
  affiliate: number;
  variableCost: number;
  contribution: number;
  contributionPct: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function unitEconomics(i: EconomicsInput): EconomicsResult {
  const vatRate = i.vatRate ?? 0.21;
  const net = i.priceEur / (1 + vatRate);
  const vat = i.priceEur - net;
  const storeFee = net * (i.storeFeeRate ?? 0);
  const processing = i.storeFeeRate ? 0 : i.priceEur * (i.processorPct ?? 0.015) + (i.processorFixedEur ?? 0.25);
  // Comissão calculada sobre a receita líquida de impostos e tarifas.
  const affiliate = Math.max(0, net - storeFee - processing) * (i.affiliateRate ?? 0);
  const variableCost = i.variableCostEur ?? 0.6;
  const contribution = net - storeFee - processing - affiliate - variableCost;
  return {
    gross: r2(i.priceEur),
    vat: r2(vat),
    processing: r2(processing),
    storeFee: r2(storeFee),
    affiliate: r2(affiliate),
    variableCost: r2(variableCost),
    contribution: r2(contribution),
    contributionPct: Math.round((contribution / i.priceEur) * 1000) / 10,
  };
}
