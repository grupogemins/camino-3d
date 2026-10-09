# 07. Como substituir os dados simulados

Cada integração tem uma variável de ambiente. Sem ela o app continua funcionando com mocks rotulados. Depois de trocar, `GET /api/health` mostra o estado de cada provedor.

## Clima: Open-Meteo
1. Para uso comercial, contrate o plano pago (a API gratuita é só para uso não comercial).
2. `WEATHER_PROVIDER=open-meteo`, `OPEN_METEO_API_KEY`, `OPEN_METEO_BASE_URL` (URL do plano customer).
3. Cache de 30 min já aplicado; a fonte "Open-Meteo" aparece no cartão.

## Rotas: OpenRouteService
1. Crie a chave em openrouteservice.org (verifique limites e termos para uso comercial).
2. `ROUTING_PROVIDER=openrouteservice`, `ORS_API_KEY`.
3. O adaptador calcula a geometria a pé entre as paradas demo. Para traçados oficiais, importe GPX licenciado (ex.: associações do Caminho, com autorização) para a tabela `route_segments`.

## Hospedagens e restaurantes
- Opções: acordo com rede de albergues, Google Places (exige exibir atribuição e respeitar cache), ou cadastro próprio de parceiros no admin.
- Implemente `PlacesProvider` em `src/providers/real/` e registre-o em `registry.ts`. O esboço `placesNotContracted.ts` mostra o formato e falha de propósito.
- Preço sempre com `provenance` (fonte e data). Reserva só via `bookingUrl` de parceiro autorizado.

## Eventos
- Agenda de turismo oficial (prefeituras, Turismo de Galicia, Turismo de Portugal) via feed com permissão, ou curadoria manual no admin. Implemente `EventsProvider`.

## Tradução: DeepL
- `TRANSLATION_PROVIDER=deepl`, `DEEPL_API_KEY`. O texto vai ao servidor do app e de lá à DeepL. O áudio nunca passa pelo nosso servidor: o reconhecimento de voz é do navegador e só funciona com consentimento.

## Pagamentos: Stripe
1. Crie dois preços de pagamento único: Camino Pass (EUR 14,99) e Grupo/Família (EUR 34,99).
2. Crie um cupom com **id personalizado** (ex.: `CAMINO-PROMO`) de EUR 5 de desconto. Ele vale para o código de lançamento e para os códigos de criadores; o código usado vai em `metadata` para atribuir a comissão.
3. `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PASS`, `STRIPE_PRICE_GROUP`, `STRIPE_COUPON_PROMO`.
4. Antes de produção, implemente o webhook (ver doc 05).

## Comunidade, contas e diário (Supabase)
1. Crie um projeto Supabase com PostGIS e aplique `supabase/migrations/0001_init.sql` (RLS já incluída).
2. Troque `demoAuth` (`src/lib/auth/auth.ts`) pelo Supabase Auth (e-mail com link mágico; Apple/Google depois).
3. Migre as fatias do `useAppStore` para chamadas ao banco, começando por perfil, viagem e diário.
4. Peregrinos próximos via função `nearby_pilgrims`, que já aplica granularidade e expiração da posição precisa.
5. Os dados de `src/data/demo/pilgrims.ts` deixam de ser usados; mantenha o selo Demo só onde ainda houver mock.

## Mapa
`NEXT_PUBLIC_MAP_STYLE_URL` aceita qualquer estilo MapLibre. Para relevo 3D real, use um provedor com tiles de terreno (MapTiler, Stadia) e confira a licença de atribuição.

## Camino Live, criadores e parceiros
- **Camino Live:** troque `demoLive()` por uma consulta agregada por parada (nunca linhas por pessoa) e mantenha `MIN_VISIBLE_COUNT = 3`. Relatos e convites viram tabelas com expiração e moderação.
- **Criadores:** cadastre em `affiliates` com o código, a taxa de comissão e a autorização de uso do nome; a rota de criador referencia uma rota base e dicas por parada.
- **Parceiros fundadores:** `partner_offers` com cupom e validade. As ofertas aparecem só no componente `PartnerOffers` (seção marcada como publicidade).
- **Copiloto:** as regras não mudam; passam a receber clima, disponibilidade e relatos reais. Teste as regras novas em `tests/unit/copilot-journey.test.ts`.

## Caminho Francês (rota de lançamento)
Adicione as paradas e o traçado licenciado em `src/data/demo/routes.ts` (ou na tabela `routes`/`route_stops`), com `region` próprias (ex.: Navarra, Rioja, Castela e Leão, Galiza), lembranças em `src/lib/journey.ts` e o fuso em `timeZoneFor`. É preciso ampliar o tipo `RouteStop['region']` e o cenário da cena 3D (`ExploreScene`) para as novas regiões; planejador, copiloto, Live e cartões reaproveitam a mesma lógica.
