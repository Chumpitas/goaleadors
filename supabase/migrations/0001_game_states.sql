-- Goaleadors backend — cloud-save sloj.
-- Single-player stanje se čuva kao JSONB snapshot po korisniku (preživi uređaje).
-- Normalizovane tabele (clubs, cards, ...) iz schema.sql su za buduću multiplayer fazu.

create table if not exists public.game_states (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_states enable row level security;

-- Svako vidi i mijenja samo svoj snapshot.
create policy "game_states_select_own"
  on public.game_states for select
  using (auth.uid() = user_id);

create policy "game_states_insert_own"
  on public.game_states for insert
  with check (auth.uid() = user_id);

create policy "game_states_update_own"
  on public.game_states for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
