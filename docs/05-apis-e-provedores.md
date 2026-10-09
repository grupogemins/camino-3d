# 05. Contratos de API e camada de provedores

## Princípios

- O navegador só fala com `/api/*` do próprio app. Chaves ficam no servidor (`src/providers/registry.ts` importa `server-only`).
- Toda resposta tem o mesmo envelope, e o cliente usa `meta` para exibir o selo "Dados de demonstração", a fonte e a data:

```ts
{ data: T, meta: { provider, isDemo, source, fetchedAt, cached, fallback, notice? } }
// erro
{ error: { code: 'bad_request' | 'not_found' | 'rate_limited' | 'server_error', message } }
```

- Entrada validada com zod; limite de requisições por IP com janela deslizante (`429` + `Retry-After`).
- `runProvider` aplica cache TTL, timeout, *stale-if-error* e, se o provedor real falhar sem cache, volta ao mock com `fallback: true` e um `notice` visível. Nunca se apresenta mock como dado real.

## Endpoints

| Método | Rota | Entrada | Saída | Limite/min |
|---|---|---|---|---|
| GET | `/api/routes` | – | `Route[]` | 30 |
| GET | `/api/routes/:id` | id | `Route` | 30 |
| GET | `/api/weather` | `lat`, `lng`, `name` | `WeatherSnapshot` | 60 |
| GET | `/api/places/accommodations` | `stopIds` (csv, até 30), `maxDistanceKm` (0–20) | `Accommodation[]` | 90 |
| GET | `/api/places/accommodations/:id` | id | `Accommodation` | 90 |
| GET | `/api/places/restaurants` | idem | `Restaurant[]` | 90 |
| GET | `/api/places/pois` | idem | `PointOfInterest[]` | 90 |
| GET | `/api/events` | `start` (AAAA-MM-DD), `stopIds` | `Event[]` | 60 |
| POST | `/api/translate` | `{ text ≤500, from, to }` (pt/es/en/fr/de/it) | `TranslationResult` | 30 |
| POST | `/api/billing/checkout` | `{ planId: 'pass'|'group', email?, coupon? }` (cupom validado no servidor) | `{ mode: 'demo'|'stripe', url?, priceEur, couponCode?, affiliateId? }` | 10 |
| POST | `/api/analytics` | `{ anonymousId, events[≤50] }` | `202` | 120 |
| GET | `/api/health` | – | estado de cada provedor (real, mock ou não configurado) | – |

Eventos de analytics só são enviados com consentimento (`src/lib/analytics/events.ts`), sem dados pessoais.

## Interfaces de provedor (`src/providers/types.ts`)

| Interface | Mock (padrão) | Real já escrito | Variável que ativa |
|---|---|---|---|
| `RoutingProvider` | rotas demo do Caminho Português | OpenRouteService (perfil foot-hiking) | `ROUTING_PROVIDER=openrouteservice`, `ORS_API_KEY` |
| `WeatherProvider` | clima determinístico | Open-Meteo | `WEATHER_PROVIDER=open-meteo` (+ chave comercial) |
| `PlacesProvider` | hospedagens/restaurantes/POIs demo | Google Places: **esboço que recusa uso** até haver contrato | `PLACES_PROVIDER=google` |
| `EventsProvider` | eventos fictícios | – | – |
| `TranslationProvider` | frases revisadas + tradução simulada | DeepL | `TRANSLATION_PROVIDER=deepl`, `DEEPL_API_KEY` |
| `BillingProvider` | compra simulada local | Stripe Checkout, pagamento único (REST, sem SDK) | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PASS`, `STRIPE_PRICE_GROUP`, `STRIPE_COUPON_PROMO` |

Reservas de hospedagem: não há integração. O botão "Reservar" abre apenas `bookingUrl` de parceiro autorizado; sem parceiro, aparece "Ver contato" e o aviso. Nenhum dado é coletado por scraping.

## Webhook do Stripe (fase 2)

O MVP marca o plano no aparelho ao voltar do Checkout (`?status=success`). Em produção a fonte da verdade deve ser `POST /api/billing/webhook` validando a assinatura do evento (`STRIPE_WEBHOOK_SECRET`) e gravando a compra em `subscriptions` (Supabase), com `metadata.coupon` e `metadata.affiliate` para a comissão do criador.

## Camadas sem API própria no MVP

| Recurso | Onde está | Em produção |
|---|---|---|
| Copiloto | `src/lib/copilot/copilot.ts` (regras puras, testadas) | Mesmas regras no servidor + dados reais de clima, lotação e relatos. Um LLM pode só redigir o texto; a decisão continua nas regras, com fontes declaradas. |
| Camino Live | `src/data/demo/live.ts` + store local | Tabelas `live_reports`, `live_invites` e contagem agregada por parada (função SQL com k-anonimato ≥ 3), Supabase Realtime. |
| Cartões e vídeo | `src/lib/cards/render.ts` (canvas + MediaRecorder no aparelho) | Igual; nada é enviado ao servidor. |
| Afiliados e cupons | `src/lib/billing/coupons.ts`, `referral.ts`, `src/data/demo/affiliates.ts` | Tabelas `affiliates`, `affiliate_clicks`, `creator_routes`; comissão calculada sobre vendas confirmadas após o prazo de reembolso. |
| Parceiros fundadores | `src/data/demo/sponsors.ts` (`partnerOffer`, `demoPartnerStats`) | Tabelas `sponsors`, `partner_offers`, `coupon_redemptions`; métricas agregadas e anônimas. |
