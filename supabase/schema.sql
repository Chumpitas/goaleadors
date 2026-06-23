-- Goaleadors — Phase 1 database skeleton (§15.2).
-- Postgres / Supabase. This is a starting point for the core loop, not the
-- final schema; columns will grow as systems land (match engine, leagues, etc.).

-- ---------------------------------------------------------------------------
-- Reference / enum-like types
-- ---------------------------------------------------------------------------
create type card_position as enum ('GK', 'DEF', 'MID', 'ATT');
create type card_rarity   as enum ('common', 'rare', 'epic', 'legendary');
create type currency_kind as enum ('lopte', 'kovanice'); -- premium / free (§6)

-- ---------------------------------------------------------------------------
-- users  (mirrors auth.users; profile + balances)
-- ---------------------------------------------------------------------------
create table users (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text unique,
  display_name  text,
  lopte         integer not null default 0,   -- premium currency
  kovanice      integer not null default 500, -- free currency (starter, §7)
  referral_code text unique,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- clubs  (one per user)
-- ---------------------------------------------------------------------------
create table clubs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references users (id) on delete cascade,
  name          text not null,
  country       text not null,           -- §8.5 supported countries
  city          text,
  crest         jsonb,                    -- crest builder layers (§9.2)
  kit           jsonb,                    -- kit builder layers (§9.3)
  stadium_name  text,
  stadium_cap   integer not null default 2000, -- starter stadium (§7)
  elo           integer not null default 1000, -- amateur phase (§8.1)
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- editions  (§4)
-- ---------------------------------------------------------------------------
create table editions (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,       -- e.g. 'foundations'
  name        text not null,
  theme       text,                       -- §4.3
  released_at timestamptz not null,
  retires_at  timestamptz,                -- day 90 -> Legacy (§4.2)
  is_active   boolean not null default true
);

-- ---------------------------------------------------------------------------
-- cards  (canonical card definitions; 110 per edition, §4.4)
-- ---------------------------------------------------------------------------
create table cards (
  id          uuid primary key default gen_random_uuid(),
  edition_id  uuid not null references editions (id) on delete cascade,
  name        text not null,
  position    card_position not null,
  rarity      card_rarity not null,
  nationality text,
  attributes  jsonb not null,             -- {shooting,passing,tackling,pace} or GK set
  abilities   text[] not null default '{}', -- ability ids (§2.6)
  overall     smallint not null           -- precomputed per §2.2
);
create index cards_edition_idx on cards (edition_id);

-- ---------------------------------------------------------------------------
-- user_cards  (ownership; which cards a player holds)
-- ---------------------------------------------------------------------------
create table user_cards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users (id) on delete cascade,
  card_id     uuid not null references cards (id),
  energy      smallint not null default 100, -- fatigue system (§10.6)
  trained     jsonb not null default '{}',   -- per-stat training boosts (§10.4)
  is_veteran  boolean not null default false, -- Veteran token applied (§4.5)
  acquired_at timestamptz not null default now()
);
create index user_cards_user_idx on user_cards (user_id);

-- ---------------------------------------------------------------------------
-- packs  (pack definitions + opening log)
-- ---------------------------------------------------------------------------
create table packs (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,      -- srebrna | zlatna | dijamantska | elite
  name         text not null,
  card_count   smallint not null,
  guarantee    text,                      -- e.g. 'min 1 Rare' (§5.1)
  price_lopte    integer,
  price_kovanice integer
);

create table pack_openings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  pack_id    uuid not null references packs (id),
  card_ids   uuid[] not null,
  opened_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- leagues + standings  (§8)
-- ---------------------------------------------------------------------------
create table leagues (
  id        uuid primary key default gen_random_uuid(),
  country   text not null,
  tier      smallint not null,            -- 1 = top, higher = lower
  name      text not null,
  season    integer not null
);

create table league_standings (
  id        uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues (id) on delete cascade,
  club_id   uuid not null references clubs (id) on delete cascade,
  played    smallint not null default 0,
  won       smallint not null default 0,
  drawn     smallint not null default 0,
  lost      smallint not null default 0,
  goals_for smallint not null default 0,
  goals_against smallint not null default 0,
  points    smallint not null default 0,
  unique (league_id, club_id)
);

-- ---------------------------------------------------------------------------
-- matches  (§3)
-- ---------------------------------------------------------------------------
create table matches (
  id          uuid primary key default gen_random_uuid(),
  league_id   uuid references leagues (id) on delete set null,
  home_club   uuid not null references clubs (id),
  away_club   uuid references clubs (id),     -- null = AI opponent
  home_goals  smallint,
  away_goals  smallint,
  stats       jsonb,                          -- possession, shots, ratings (§3.11)
  played_at   timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- scout_talents  (mladi talenti — posebna kategorija van kesica, SCOUT_SYSTEM_UPDATE)
-- ---------------------------------------------------------------------------
create table scout_talents (
  id                uuid primary key default gen_random_uuid(),
  club_id           uuid references clubs (id) on delete cascade,
  name              text not null,
  nationality       text not null,
  position          card_position not null,
  region            text not null,           -- europe|south_america|africa|asia
  potential         text not null,           -- fast|standard|high|exceptional
  overall           smallint not null,       -- raste svake sezone (nije fiksan)
  shooting          smallint not null,
  passing           smallint not null,
  tackling          smallint not null,
  pace              smallint not null,
  seasons_remaining smallint not null default 5,
  training_slot     smallint,                -- null | 1 (standard) | 2 (focus)
  abilities         text[] not null default '{}',
  discovered_at     timestamptz not null default now(),
  signed_at         timestamptz,
  available_until   timestamptz,             -- discovered_at + 48h (FOMO)
  status            text not null default 'available' -- available|signed|expired|released
);
create index scout_talents_club_idx on scout_talents (club_id, status);

-- ---------------------------------------------------------------------------
-- scout_missions  (misije koje pronalaze talente, SCOUT_SYSTEM_UPDATE)
-- ---------------------------------------------------------------------------
create table scout_missions (
  id                uuid primary key default gen_random_uuid(),
  club_id           uuid references clubs (id) on delete cascade,
  scout_index       smallint not null,       -- koji skaut (1–5)
  position          card_position not null,
  region            text,
  potential_type    text not null,
  started_at        timestamptz not null default now(),
  completes_at      timestamptz not null,
  status            text not null default 'active', -- active|completed|failed
  result_talent_id  uuid references scout_talents (id),
  cost_paid         integer not null
);
create index scout_missions_club_idx on scout_missions (club_id, status);
create index scout_missions_active_idx on scout_missions (completes_at) where status = 'active';

-- ---------------------------------------------------------------------------
-- World Cup (WORLD_CUP_SYSTEM)
-- ---------------------------------------------------------------------------
create table manager_ratings (
  manager_id        uuid primary key references users (id) on delete cascade,
  total             integer not null default 0,
  league_level_score integer default 0,
  win_rate_score    integer default 0,
  european_score    integer default 0,
  seasons_score     integer default 0,
  updated_at        timestamptz not null default now()
);
create index manager_ratings_total_idx on manager_ratings (total desc);

create table world_cups (
  id                uuid primary key default gen_random_uuid(),
  year              integer unique not null,
  status            text not null default 'qualification', -- qualification|group_stage|knockout|completed
  winner_manager_id uuid references users (id),
  created_at        timestamptz not null default now()
);

create table wc_applications (
  id            uuid primary key default gen_random_uuid(),
  world_cup_id  uuid references world_cups (id) on delete cascade,
  manager_id    uuid references users (id) on delete cascade,
  nation        text not null,
  priority      smallint not null check (priority between 1 and 3),
  status        text not null default 'pending', -- pending|qualified|rejected|active_selector
  applied_at    timestamptz not null default now(),
  unique (world_cup_id, manager_id, nation)
);
create index wc_applications_idx on wc_applications (world_cup_id, nation, status);

create table wc_qualification_matches (
  id              uuid primary key default gen_random_uuid(),
  world_cup_id    uuid references world_cups (id) on delete cascade,
  nation          text not null,
  round           smallint not null,
  home_manager_id uuid references users (id),
  away_manager_id uuid references users (id),
  home_goals      smallint,
  away_goals      smallint,
  home_present    boolean default false,
  away_present    boolean default false,
  home_setup      jsonb,
  away_setup      jsonb,
  scheduled_at    timestamptz not null,
  played_at       timestamptz,
  status          text not null default 'scheduled' -- scheduled|live|completed
);
create index wc_qual_idx on wc_qualification_matches (world_cup_id, nation, round);

create table wc_selectors (
  id                uuid primary key default gen_random_uuid(),
  world_cup_id      uuid references world_cups (id) on delete cascade,
  nation            text not null,
  manager_id        uuid references users (id),
  deputy_manager_id uuid references users (id), -- finalista (zamjenik)
  squad             jsonb, -- 23 igrača
  created_at        timestamptz not null default now(),
  unique (world_cup_id, nation)
);

create table wc_legacy_activations (
  id             uuid primary key default gen_random_uuid(),
  world_cup_id   uuid references world_cups (id) on delete cascade,
  manager_id     uuid references users (id) on delete cascade,
  legacy_card_id uuid,
  nation         text not null,
  activated_at   timestamptz not null default now(),
  unique (world_cup_id, manager_id, nation) -- max 1 po menadžeru po naciji
);

create table wc_rewards (
  id              uuid primary key default gen_random_uuid(),
  world_cup_id    uuid references world_cups (id) on delete cascade,
  manager_id      uuid references users (id) on delete cascade,
  placement       text not null, -- winner|runner_up|third_place
  rewards_granted jsonb,
  granted_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- transactions  (currency ledger: purchases, rewards, sinks — §6)
-- ---------------------------------------------------------------------------
create table transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  currency   currency_kind not null,
  amount     integer not null,             -- signed: + credit, - debit
  reason     text not null,                -- 'pack_purchase', 'match_win', ...
  created_at timestamptz not null default now()
);
create index transactions_user_idx on transactions (user_id);
