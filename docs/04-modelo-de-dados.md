# 4. Modelo de dados

- **Tipos TypeScript (fonte de verdade no app):** `src/lib/domain/types.ts`
- **Esquema SQL com PostGIS, índices e RLS:** `supabase/migrations/0001_init.sql`

## Relacionamentos principais

```
auth.users 1─1 profiles
           1─1 privacy_settings
           1─1 avatar_configurations
           1─1 user_locations           (só a última posição ofuscada, com expiração; sem histórico)
           1─N trips 1─N route_segments N─1 route_stops
           1─N journal_entries
           1─N emergency_contacts, safety_check_ins
           1─N subscriptions
           N─N conversations (conversation_members) 1─N messages
           1─N connection_requests, blocks, reports 1─N moderation_actions

routes 1─N route_stops, waypoints
route_stops 1─N accommodations, restaurants, points_of_interest, events
accommodations/restaurants/poi/events 1─N price_snapshots, review_summaries (versionados por fonte)
sponsors 1─N sponsored_placements ─► (place_type, place_id)
```

## Regras de modelagem

| Regra | Onde |
|---|---|
| Procedência em todo dado externo: `source`, `source_url`, `fetched_at`, `expires_at`, `is_demo` | routes, waypoints, places, snapshots, weather |
| Preço e avaliação **nunca** sobrescritos: um snapshot por coleta, consulta pelo mais recente | `price_snapshots`, `review_summaries` |
| Expiração de cache (`expires_at`) consultada antes de chamar o provedor | snapshots, weather |
| Índices geoespaciais GIST em toda coluna `geography` | todas as tabelas com localização |
| Localização: `hidden` não grava linha; `precise_temporary` exige `expires_at`; job apaga expiradas | `user_locations`, `privacy_settings` |
| Patrocínio: rótulo fixo "Patrocinado" e `boost` limitado a 0,5 | `sponsored_placements` (check constraints) |
| Exclusão de conta: `on delete cascade` a partir de `auth.users` remove todos os dados pessoais | todas as tabelas de usuário |
| RLS: cada usuário só lê/escreve seus próprios dados; peregrinos próximos apenas pela função `nearby_pilgrims` | políticas no fim do SQL |

## Entidades × arquivos

| Entidade | Tipo TS | Tabela | Demo |
|---|---|---|---|
| User / Profile | `User`, `Profile` | `auth.users`, `profiles` | `store/useAppStore.ts` |
| PrivacySettings | `PrivacySettings` | `privacy_settings` | idem |
| Trip / Route / RouteSegment / Waypoint | `Trip`, `Route`, `RouteSegment`, `Waypoint` | `trips`, `routes`, `route_segments`, `waypoints` | `data/demo/routes.ts` |
| Accommodation / Restaurant / PointOfInterest / Event | idem | idem | `data/demo/accommodations.ts`, `restaurants.ts`, `culture.ts` |
| WeatherSnapshot | `WeatherSnapshot` | `weather_snapshots` | `data/demo/weather.ts` |
| PriceSnapshot / ReviewSummary / BookingProvider | idem | idem | embutido nos lugares |
| UserLocation / ConnectionRequest / Conversation / Message | idem | idem | `data/demo/pilgrims.ts` |
| SafetyCheckIn / EmergencyContact | idem | idem | store |
| AvatarConfiguration / JournalEntry / Achievement | idem | idem | `data/demo/achievements.ts` |
| Subscription / Sponsor / SponsoredPlacement | idem | idem | `lib/billing/plans.ts`, `data/demo/sponsors.ts` |
| Report / ModerationAction | idem | idem | `data/demo/moderation.ts` |
