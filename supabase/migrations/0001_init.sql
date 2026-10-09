-- Camino 3D: esquema inicial (Supabase / Postgres 15+ com PostGIS)
-- Convenções: snake_case, timestamps em UTC, colunas de procedência em todo dado externo,
-- índices GIST para geografia, RLS habilitado em tabelas de usuário.

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ---------- Tipos ----------
create type location_granularity as enum ('hidden', 'city', 'approximate', 'precise_temporary');
create type plan_id as enum ('free', 'pass', 'monthly');
create type subscription_status as enum ('trialing', 'active', 'cancelled', 'expired');
create type route_mode as enum ('fastest','easiest','cheapest','safest','scenic','accessible','quietest','social');
create type waypoint_kind as enum ('town','water','toilet','pharmacy','health','market','shelter','rest','danger','no_signal','detour','transport','viewpoint');

-- Bloco de procedência reutilizado (documentação: toda tabela de dado externo tem estas colunas)
--   source text not null, source_url text, fetched_at timestamptz not null,
--   expires_at timestamptz not null, is_demo boolean not null default false

-- ---------- Usuários ----------
-- users é gerenciado por auth.users do Supabase; profiles referencia auth.users(id).
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  locale text not null default 'pt',
  country_code char(2),
  start_date date,
  origin_id text,
  destination_id text default 'santiago',
  days_available int check (days_available between 1 and 90),
  daily_km numeric(4,1) check (daily_km between 5 and 45),
  fitness text check (fitness in ('beginner','intermediate','advanced')),
  daily_budget_eur numeric(6,2),
  lodging text[] default '{}',
  food text[] default '{}',
  interests text[] default '{}',
  accessibility text[] default '{}',
  walking_style text check (walking_style in ('alone','group','meet')),
  languages text[] default '{}',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  community_presence boolean not null default false,
  invisible_mode boolean not null default false,
  location_granularity location_granularity not null default 'hidden',
  precise_sharing_expires_at timestamptz,
  consent_location boolean not null default false,
  consent_analytics boolean not null default false,
  consent_voice_processing boolean not null default false,
  consent_terms boolean not null default false,
  updated_at timestamptz not null default now(),
  -- compartilhamento preciso precisa ter expiração
  constraint precise_requires_expiry check (
    location_granularity <> 'precise_temporary' or precise_sharing_expires_at is not null
  )
);

-- ---------- Rotas ----------
create table routes (
  id text primary key,
  name text not null,
  short_name text not null,
  description text,
  origin_id text not null,
  destination_id text not null,
  total_km numeric(6,1) not null,
  attributes jsonb not null,
  geometry geography(LineString, 4326) not null,
  source text not null, source_url text,
  fetched_at timestamptz not null, expires_at timestamptz not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index routes_geom_gix on routes using gist (geometry);

create table route_stops (
  id text primary key,
  route_id text not null references routes(id) on delete cascade,
  name text not null,
  location geography(Point, 4326) not null,
  km numeric(6,1) not null,
  elevation_m int,
  services jsonb not null default '{}',
  region text
);
create index route_stops_route_idx on route_stops (route_id, km);
create index route_stops_gix on route_stops using gist (location);

create table waypoints (
  id text primary key,
  route_id text not null references routes(id) on delete cascade,
  kind waypoint_kind not null,
  name text not null,
  location geography(Point, 4326) not null,
  km numeric(6,1) not null,
  note text,
  verified_at timestamptz,
  source text not null, fetched_at timestamptz not null, expires_at timestamptz not null,
  is_demo boolean not null default false
);
create index waypoints_route_idx on waypoints (route_id, km);
create index waypoints_gix on waypoints using gist (location);

create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  route_id text not null references routes(id),
  mode route_mode not null default 'easiest',
  start_date date not null,
  days int not null,
  daily_km numeric(4,1) not null,
  status text not null default 'planned' check (status in ('planned','active','completed','abandoned')),
  offline_downloaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trips_user_idx on trips (user_id, status);

create table route_segments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day int not null,
  from_stop_id text not null references route_stops(id),
  to_stop_id text not null references route_stops(id),
  start_km numeric(6,1) not null,
  end_km numeric(6,1) not null,
  distance_km numeric(5,1) not null,
  estimated_hours numeric(4,1) not null,
  ascent_m int, descent_m int,
  difficulty text, terrain text[],
  completed_at timestamptz,
  unique (trip_id, day)
);

-- ---------- Lugares ----------
create table booking_providers (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('official_api','affiliate','direct_contact')),
  base_url text not null
);

create table accommodations (
  id text primary key,
  name text not null,
  type text not null,
  location geography(Point, 4326) not null,
  stop_id text references route_stops(id),
  town text not null,
  distance_from_route_km numeric(5,2),
  accessible boolean default false,
  amenities jsonb not null default '{}',
  check_in_from text,
  beds int,
  description text,
  source text not null, source_url text, fetched_at timestamptz not null, expires_at timestamptz not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index accommodations_gix on accommodations using gist (location);
create index accommodations_stop_idx on accommodations (stop_id);

create table restaurants (
  id text primary key,
  name text not null,
  kind text not null,
  location geography(Point, 4326) not null,
  stop_id text references route_stops(id),
  town text not null,
  distance_from_route_km numeric(5,2),
  opening_hours text,
  cuisine text,
  pilgrim_menu boolean default false,
  diets jsonb default '{}',
  amenities jsonb default '{}',
  accessible boolean default false,
  source text not null, source_url text, fetched_at timestamptz not null, expires_at timestamptz not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index restaurants_gix on restaurants using gist (location);

create table points_of_interest (
  id text primary key,
  name text not null,
  category text not null,
  location geography(Point, 4326) not null,
  stop_id text references route_stops(id),
  description text, opening_hours text, etiquette text,
  source text not null, source_url text, fetched_at timestamptz not null, expires_at timestamptz not null,
  is_demo boolean not null default false
);
create index poi_gix on points_of_interest using gist (location);

create table events (
  id text primary key,
  title text not null,
  category text not null,
  location geography(Point, 4326),
  stop_id text references route_stops(id),
  town text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price_eur numeric(6,2),
  description text,
  source text not null, source_url text, fetched_at timestamptz not null, expires_at timestamptz not null,
  is_demo boolean not null default false
);
create index events_time_idx on events (stop_id, starts_at);
create index events_gix on events using gist (location);

-- Preço e avaliação são snapshots versionados por fonte (nunca sobrescrever histórico de preço)
create table price_snapshots (
  id bigserial primary key,
  place_type text not null check (place_type in ('accommodation','restaurant','poi','event')),
  place_id text not null,
  amount numeric(8,2) not null,
  currency char(3) not null default 'EUR',
  unit text not null,
  known_fees text,
  is_estimate boolean not null default true,
  source text not null, source_url text, fetched_at timestamptz not null, expires_at timestamptz not null,
  is_demo boolean not null default false
);
create index price_snapshots_place_idx on price_snapshots (place_type, place_id, fetched_at desc);

create table review_summaries (
  id bigserial primary key,
  place_type text not null,
  place_id text not null,
  rating numeric(2,1) not null,
  review_count int not null,
  source text not null, source_url text, fetched_at timestamptz not null, expires_at timestamptz not null,
  is_demo boolean not null default false
);
create index review_summaries_place_idx on review_summaries (place_type, place_id, fetched_at desc);

create table weather_snapshots (
  id bigserial primary key,
  location geography(Point, 4326) not null,
  location_name text,
  payload jsonb not null,
  source text not null, fetched_at timestamptz not null, expires_at timestamptz not null,
  is_demo boolean not null default false
);
create index weather_snapshots_gix on weather_snapshots using gist (location);
create index weather_snapshots_exp_idx on weather_snapshots (expires_at);

-- ---------- Comunidade (privacidade por padrão) ----------
-- Guarda SOMENTE a última posição já ofuscada. Sem histórico (requisito de produto e GDPR).
create table user_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granularity location_granularity not null check (granularity <> 'hidden'),
  location geography(Point, 4326),
  city_name text,
  accuracy_m int not null,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
create index user_locations_gix on user_locations using gist (location);
-- Job agendado (pg_cron) deve apagar linhas expiradas: delete from user_locations where expires_at < now();

create table connection_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_user_id, to_user_id)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct','group')),
  title text,
  stop_id text references route_stops(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table conversation_members (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  flagged boolean not null default false,
  sent_at timestamptz not null default now()
);
create index messages_conv_idx on messages (conversation_id, sent_at desc);

create table blocks (
  blocker_id uuid references auth.users(id) on delete cascade,
  blocked_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  target_message_id uuid references messages(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  moderator_id uuid not null references auth.users(id),
  action text not null check (action in ('dismiss','warn','mute_24h','suspend','ban')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Segurança ----------
create table emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, phone text not null, relation text
);
create table safety_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  segment_id uuid references route_segments(id) on delete set null,
  due_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','ok','missed')),
  created_at timestamptz not null default now()
);

-- ---------- Personagem, diário, conquistas ----------
create table avatar_configurations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  config jsonb not null,
  updated_at timestamptz not null default now()
);
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,
  segment_id uuid references route_segments(id) on delete set null,
  title text not null, body text,
  photo_paths text[] default '{}',  -- Supabase Storage (bucket privado)
  distance_km numeric(5,1),
  places_visited text[] default '{}',
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table achievements (
  code text primary key, title text not null, description text, icon text
);
create table user_achievements (
  user_id uuid references auth.users(id) on delete cascade,
  code text references achievements(code),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- ---------- Comercial ----------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan plan_id not null,
  status subscription_status not null,
  current_period_end timestamptz,
  provider text not null check (provider in ('stripe','apple','google','demo')),
  provider_ref text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on subscriptions (user_id, status);

create table sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null, category text not null, contact_email text,
  status text not null default 'lead',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table sponsored_placements (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references sponsors(id) on delete cascade,
  place_type text not null, place_id text not null,
  label text not null default 'Patrocinado' check (label = 'Patrocinado'),
  boost numeric(3,2) not null default 0.2 check (boost between 0 and 0.5),
  starts_at timestamptz not null, ends_at timestamptz not null
);

create table analytics_events (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  name text not null,
  props jsonb default '{}',
  occurred_at timestamptz not null default now()
);
create index analytics_events_name_time_idx on analytics_events (name, occurred_at);

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table privacy_settings enable row level security;
alter table trips enable row level security;
alter table route_segments enable row level security;
alter table user_locations enable row level security;
alter table emergency_contacts enable row level security;
alter table safety_check_ins enable row level security;
alter table avatar_configurations enable row level security;
alter table journal_entries enable row level security;
alter table subscriptions enable row level security;
alter table messages enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own privacy" on privacy_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trips" on trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own segments" on route_segments for all using (exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid()));
create policy "own contacts" on emergency_contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own checkins" on safety_check_ins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own avatar" on avatar_configurations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own journal" on journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own subscription read" on subscriptions for select using (auth.uid() = user_id);
create policy "own location write" on user_locations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Leitura de localização de outros: somente via view/função que filtra presença ativa, não expirada, não bloqueada.
create policy "conversation members read messages" on messages for select using (
  exists (select 1 from conversation_members m where m.conversation_id = messages.conversation_id and m.user_id = auth.uid())
);
create policy "members send messages" on messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from conversation_members m where m.conversation_id = messages.conversation_id and m.user_id = auth.uid())
);

-- Peregrinos visíveis próximos (respeita presença, modo invisível, expiração e bloqueios)
create or replace function nearby_pilgrims(lng double precision, lat double precision, radius_m int default 20000)
returns table (user_id uuid, display_name text, granularity location_granularity, location geography, city_name text, accuracy_m int)
language sql stable security definer set search_path = public as $$
  select l.user_id, p.display_name, l.granularity, l.location, l.city_name, l.accuracy_m
  from user_locations l
  join privacy_settings s on s.user_id = l.user_id
  join profiles p on p.user_id = l.user_id
  where s.community_presence and not s.invisible_mode
    and s.location_granularity <> 'hidden'
    and (l.expires_at is null or l.expires_at > now())
    and l.user_id <> auth.uid()
    and not exists (select 1 from blocks b where (b.blocker_id = auth.uid() and b.blocked_id = l.user_id) or (b.blocker_id = l.user_id and b.blocked_id = auth.uid()))
    and (l.location is null or st_dwithin(l.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography, radius_m));
$$;
