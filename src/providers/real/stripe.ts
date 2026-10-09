/**
 * Provedor REAL de pagamentos: Stripe Checkout via REST (sem SDK), pagamento único.
 * Requer STRIPE_SECRET_KEY, STRIPE_PRICE_PASS e STRIPE_PRICE_GROUP.
 * Cupons: crie no Stripe um cupom com id = STRIPE_COUPON_PROMO (EUR 5 de desconto);
 * o código usado (lançamento ou afiliado) vai em metadata para atribuir a comissão.
 */
import { ProviderNotConfiguredError, type BillingProvider } from '../types';

const PRICE_ENV = { pass: 'STRIPE_PRICE_PASS', group: 'STRIPE_PRICE_GROUP' } as const;

export function createStripeProvider(secretKey = process.env.STRIPE_SECRET_KEY): BillingProvider {
  return {
    id: 'stripe',
    async createCheckout({ planId, customerEmail, successUrl, cancelUrl, couponCode, affiliateId }) {
      if (!secretKey) throw new ProviderNotConfiguredError('Stripe', 'STRIPE_SECRET_KEY');
      const price = process.env[PRICE_ENV[planId]];
      if (!price) throw new ProviderNotConfiguredError('Stripe', PRICE_ENV[planId]);
      const body = new URLSearchParams({
        mode: 'payment',
        'line_items[0][price]': price,
        'line_items[0][quantity]': '1',
        success_url: successUrl,
        cancel_url: cancelUrl,
        'metadata[plan]': planId,
        'automatic_tax[enabled]': 'true',
      });
      if (couponCode) {
        const promo = process.env.STRIPE_COUPON_PROMO;
        if (!promo) throw new ProviderNotConfiguredError('Stripe', 'STRIPE_COUPON_PROMO');
        body.set('discounts[0][coupon]', promo);
        body.set('metadata[coupon]', couponCode);
      } else {
        body.set('allow_promotion_codes', 'true');
      }
      if (affiliateId) body.set('metadata[affiliate]', affiliateId);
      if (customerEmail) body.set('customer_email', customerEmail);
      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error(`Stripe HTTP ${res.status}`);
      const j = (await res.json()) as { id: string; url: string };
      return { mode: 'stripe', sessionId: j.id, url: j.url };
    },
  };
}
