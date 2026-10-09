# Camino 3D

Peregrinação digital viva para quem caminha até Santiago de Compostela: app web mobile-first (PWA) em que o caminho, o personagem 3D e a comunidade evoluem junto com o peregrino.

- **Copiloto do dia:** sugestões a partir de etapa, ritmo, clima, orçamento, lotação e relatos, com "por que esta sugestão?" e replanejamento.
- **Mundo 3D da jornada:** o peregrino avança conforme as etapas reais, com região, hora, clima, chegada às cidades e lembranças.
- **Camino Live:** quantos estão em cada etapa, idiomas, grupos saindo, condições do trecho e convites, sem expor posições.
- **Memórias:** cartões de etapa e retrospectiva em imagem e vídeo curto, gerados no aparelho.
- **Camino Pass:** pagamento único por jornada, Grupo/Família, cupons de lançamento e de criadores, rotas de criadores e parceiros fundadores.
- Também: planejador com 3 rotas comparáveis, mapa 2D e navegação, hospedagens, comida, cultura, clima, tradutor, diário, central de segurança e painel admin.

> **MVP com dados de demonstração.** Preços, avaliações, clima, eventos e peregrinos são simulados e marcados como "Demo" com fonte e data. Nenhuma integração externa está ativa sem a respectiva chave (ver `.env.example`).

## Rodar localmente

Requisitos: Node 20+ e npm.

```bash
npm install          # também copia o worker do MapLibre para public/vendor
cp .env.example .env.local   # opcional: sem chaves, tudo roda em modo demonstração
npm run dev          # http://localhost:3000
```

Produção: `npm run build && npm run start`.

Para testar sem WebGL, abra qualquer tela 3D com `?webgl=off`.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `start` | build e servidor de produção |
| `npm run typecheck` | TypeScript sem emitir |
| `npm test` | testes unitários (Vitest): planejador, privacidade, geo/navegação, cobrança, segurança, provedores |
| `npm run test:e2e` | Playwright em celular (Pixel 7) e desktop: onboarding → rota → compra do Camino Pass com cupom; copiloto, cartão da etapa, jornada 3D e Camino Live; privacidade da comunidade; cancelamento do SOS; fallback sem WebGL |

O e2e sobe o app em `:3100` (`npm run build` antes). Para usar um Chromium já instalado, defina `PLAYWRIGHT_CHROMIUM_PATH`.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Zustand (persistência local), zod, MapLibre GL (OpenFreeMap), React Three Fiber, Vitest, Playwright. Banco previsto: Supabase/PostGIS (`supabase/migrations/0001_init.sql`).

## Documentação

1. [Estratégia e escopo](docs/01-estrategia-e-escopo.md)
2. [Personas e jornadas](docs/02-personas-e-jornadas.md)
3. [Arquitetura, IA e pastas](docs/03-arquitetura.md)
4. [Modelo de dados](docs/04-modelo-de-dados.md)
5. [APIs e provedores](docs/05-apis-e-provedores.md)
6. [Design system](docs/06-design-system.md)
7. [Como substituir os mocks](docs/07-substituir-mocks.md)
8. [Riscos](docs/08-riscos.md)
9. [Roadmap de 90 dias](docs/09-roadmap-90-dias.md)

## Conta de demonstração

O cadastro é local (nenhuma senha é armazenada; os dados ficam no aparelho). O painel `/admin` é acessível para demonstração; em produção ele exige papel `admin` (RLS).

## Celular nativo (iOS/Android)

O app já é PWA instalável (manifest, ícones, service worker, offline por etapa). Para as lojas, o caminho previsto é o Capacitor:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Camino 3D" app.camino3d
```

Aponte `server.url` para o deploy (o app usa rotas de API do Next, então não é exportação estática) e adicione os plugins de geolocalização e notificações. Veja o risco de comissão das lojas em `docs/08-riscos.md`.

## Licenças e créditos

- Mapa © colaboradores do OpenStreetMap (ODbL), estilo OpenFreeMap.
- Fonte Atkinson Hyperlegible (OFL).
- Ícones Lucide (ISC).
- Personagem, cenas 3D e ilustrações são originais deste projeto.
