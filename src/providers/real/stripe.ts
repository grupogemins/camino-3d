/** Provedor REAL de pagamentos: Stripe Checkout via REST (sem SDK). Requer STRIPE_SECRET_KEY e preços. */
import { ProviderNotConfiguredError, type BillingProvider } from '../types';

export function createStripeProvider(secretKey = process.env.STRIPE_SECRET_KEY): BillingProvider {
  return {
    id: 'stripe',
    async createCheckout({ planId, customerEmail, successUrl, cancelUrl }) {
      if (!secretKey) throw new ProviderNotConfiguredError('Stripe', 'STRIPE_SECRET_KEY');
      const price = planId === 'pass' ? process.env.STRIPE_PRICE_PASS : process.env.STRIPE_PRICE_MONTHLY;
      if (!price) throw new ProviderNotConfiguredError('Stripe', planId === 'pass' ? 'STRIPE_PRICE_PASS' : 'STRIPE_PRICE_MONTHLY');
      const body = new URLSearchParams({
        mode: planId === 'pass' ? 'payment' : 'subscription',
        'line_items[0][price]': price,
        'line_items[0][quantity]': '1',
        success_url: successUrl,
        cancel_url: cancelUrl,
        'metadata[plan]': planId,
        allow_promotion_codes: 'true',
        'automatic_tax[enabled]': 'true',
      });
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
