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
1. Crie dois preços: Passe do Caminho (EUR 10, pagamento único, 45 dias) e mensal (EUR 10, recorrente).
2. `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PASS`, `STRIPE_PRICE_MONTHLY`.
3. Antes de produção, implemente o webhook (ver doc 05).

## Comunidade, contas e diário (Supabase)
1. Crie um projeto Supabase com PostGIS e aplique `supabase/migrations/0001_init.sql` (RLS já incluída).
2. Troque `demoAuth` (`src/lib/auth/auth.ts`) pelo Supabase Auth (e-mail com link mágico; Apple/Google depois).
3. Migre as fatias do `useAppStore` para chamadas ao banco, começando por perfil, viagem e diário.
4. Peregrinos próximos via função `nearby_pilgrims`, que já aplica granularidade e expiração da posição precisa.
5. Os dados de `src/data/demo/pilgrims.ts` deixam de ser usados; mantenha o selo Demo só onde ainda houver mock.

## Mapa
`NEXT_PUBLIC_MAP_STYLE_URL` aceita qualquer estilo MapLibre. Para relevo 3D real, use um provedor com tiles de terreno (MapTiler, Stadia) e confira a licença de atribuição.
