# 3. Arquitetura técnica, arquitetura de informação e estrutura de pastas

## 3.1 Decisões de arquitetura

| Decisão | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | SSR/rotas de API no mesmo projeto, ótimo suporte a PWA, deploy simples (Vercel, Fly, Docker). |
| Estilo | **Tailwind CSS 4** com tokens em CSS (`@theme`) | Design system em variáveis, troca de tema claro/escuro/alto contraste sem duplicar classes. |
| Componentes | Componentes próprios pequenos com ARIA + elementos nativos acessíveis (`<dialog>`, `<button>`, `<fieldset>`) | Menos dependências e controle total de acessibilidade. Radix/React Aria podem entrar depois sem mudar a API dos componentes. |
| Estado do cliente | **Zustand** com `persist` | Simples, tipado e com persistência local para o modo demonstração e offline. |
| 3D | **React Three Fiber + Three.js** (drei para controles) | Ecossistema maduro; carregado sob demanda com `next/dynamic` e `ssr:false`. Personagem feito de primitivas estilizadas: original, leve e sem assets de terceiros. |
| Mapa | **MapLibre GL** com estilo **OpenFreeMap** (dados OpenStreetMap) | Código aberto, sem chave, sem custo por carregamento; atribuição OSM exibida. Troca para Mapbox/MapTiler via variável de ambiente. Fallback em **SVG esquemático** quando não houver WebGL ou rede. |
| Backend | Rotas de API do Next (`src/app/api/*`) + **camada de provedores** | Chaves só no servidor, cache, rate limiting, fallback e observabilidade centralizados. |
| Banco | **Supabase (Postgres + PostGIS)**, migração SQL pronta em `supabase/migrations` | Auth, storage e realtime prontos. No MVP sem credenciais, um repositório local implementa a mesma interface. |
| Pagamentos | **Stripe Checkout** via REST no servidor | Sem chave, o fluxo é simulado e identificado como demonstração. |
| Voz | **Web Speech API** do navegador (reconhecimento e síntese) | Funciona sem chave; o app avisa que alguns navegadores enviam o áudio ao fornecedor do navegador. Provedor de servidor (DeepL, Google, Azure) entra pela interface `TranslationProvider`. |
| Testes | **Vitest** (regras críticas) + **Playwright** (fluxos) | Rápidos e independentes de serviços externos. |
| Apps nativos | PWA agora, **Capacitor** depois | Reaproveita 100% do código web para iOS/Android. |

### Princípios
- **Nenhuma chave no frontend.** Somente variáveis sem prefixo `NEXT_PUBLIC_` guardam segredos e são lidas em rotas de servidor.
- **Todo provedor é substituível.** Cada domínio (rotas, clima, hospedagem, restaurantes, eventos, tradução, pagamentos) tem uma interface, uma implementação de demonstração e o ponto de entrada para a implementação real.
- **Toda resposta externa carrega metadados:** `source`, `fetchedAt`, `expiresAt`, `isDemo`.
- **Fallback:** se o provedor real falhar ou estourar o tempo, a API responde com o último cache válido ou com os dados de demonstração, sempre marcados.

## 3.2 Diagrama

```
 Navegador (PWA, mobile-first)
 ├─ UI (React, Tailwind, componentes acessíveis)
 ├─ Mapa 2D MapLibre ─┬─ fallback SVG esquemático (offline/sem WebGL)
 ├─ Cena 3D R3F (lazy)┘
 ├─ Zustand (perfil, viagem, privacidade, diário, assinatura) → localStorage
 ├─ Service Worker (app shell + rotas baixadas para offline)
 └─ fetch /api/*
        │
 Next.js (servidor)
 ├─ /api/weather  /api/places  /api/events  /api/routes  /api/translate
 ├─ /api/billing/checkout  /api/analytics  /api/health
 ├─ middleware lógico: rate limit + cache TTL + timeout + fallback
 └─ Provider registry ──► Mock (demo) | Open-Meteo | OpenRouteService | Google Places | Afiliados | DeepL | Stripe
        │
 Supabase (fase 2): Auth · Postgres + PostGIS · Storage · Realtime
```

## 3.3 Arquitetura de informação

Navegação inferior (5 itens, poucas ações por tela): **Início · Mapa · Explorar · Comunidade · Eu**.

```
/                       Splash e apresentação
/entrar                 Login e cadastro
/onboarding             Onboarding (8 passos)
/inicio                 Tela inicial (etapa do dia, clima, atalhos)
├─ /planejar            Planejamento da viagem
│  └─ /rotas            Comparação de rotas (8 modos)
├─ /etapas/[id]         Detalhes da etapa
└─ /seguranca           Central de Segurança (sempre a 1 toque: botão SOS no topo)
/mapa                   Mapa, navegação, 2D/3D, filtros, offline
/explorar               Hub
├─ /hospedagens         Lista + filtros
│  └─ /hospedagens/[id] Detalhe
├─ /comer               Cafés e restaurantes
├─ /cultura             Eventos, cultura, pontos de interesse
├─ /clima               Clima por etapa
└─ /tradutor            Tradutor por voz e frases offline
/comunidade             Peregrinos próximos, grupos, conexões
└─ /comunidade/chat/[id] Chat
/eu                     Hub pessoal
├─ /peregrino           Personalização do personagem 3D
├─ /diario              Diário, carimbos, conquistas
├─ /premium             Planos e pagamento
└─ /perfil              Perfil, privacidade, configurações, exclusão de conta
/admin                  Painel: funil, parceiros, patrocínios, moderação
```

## 3.4 Estrutura de pastas

```
camino-3d/
├─ docs/                       Estratégia, personas, arquitetura, dados, APIs, design, riscos, roadmap
├─ public/                     Manifest, ícones, service worker (sw.js)
├─ supabase/migrations/        SQL com PostGIS, RLS e índices
├─ src/
│  ├─ app/                     Rotas (App Router)
│  │  ├─ (app)/                Telas com navegação inferior
│  │  └─ api/                  Rotas de servidor (provedores)
│  ├─ components/
│  │  ├─ ui/                   Design system (Button, Card, Badge, DemoBadge, Toggle, Field, States…)
│  │  ├─ layout/               AppShell, BottomNav, TopBar
│  │  ├─ map/                  RouteMap, MapLibreView, SchematicMap, NavigationPanel
│  │  ├─ avatar/               Avatar3D (lazy), PilgrimModel, Scene, Avatar2D (fallback)
│  │  └─ <feature>/            Componentes por funcionalidade
│  ├─ data/demo/               Dados de demonstração em arquivos separados
│  ├─ lib/
│  │  ├─ domain/               Tipos das entidades
│  │  ├─ geo/                  Distâncias, progresso na linha, desvio da rota
│  │  ├─ planner/              Divisão em etapas, pontuação por modo
│  │  ├─ privacy/              Granularidade e expiração de localização
│  │  ├─ billing/              Planos e direitos (entitlements)
│  │  ├─ analytics/            Eventos com consentimento
│  │  ├─ server/               Cache TTL, rate limit, timeout
│  │  └─ i18n/                 Dicionários pt/en/es
│  ├─ providers/               Interfaces + mocks + implementações reais + registro
│  └─ store/                   Zustand (perfil, viagem, comunidade, diário…)
└─ tests/
   ├─ unit/                    Vitest
   └─ e2e/                     Playwright
```
