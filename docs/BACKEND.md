# Goaleadors — Backend (Supabase)

Backend je **opcioni cloud-save sloj** (auth + JSONB snapshot stanja po korisniku).
Dok nije konfigurisan, igra radi 100% lokalno (localStorage). Čim postaviš kredencijale,
tab **Nalog** nudi prijavu/registraciju i automatsku sinhronizaciju.

## Postavljanje (3 koraka)

### 1. Supabase projekat
Napravi projekat na [supabase.com](https://supabase.com) (ili reci asistentu da ga
napravi preko MCP-a). Iz **Project Settings → API** uzmi `Project URL` i `anon public` ključ.

### 2. Env varijable
Kopiraj `.env.example` u `.env.local` i popuni:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### 3. Migracija
Primijeni cloud-save tabelu + RLS. Bilo kako:

- **Supabase SQL Editor:** zalijepi sadržaj `supabase/migrations/0001_game_states.sql` i pokreni.
- **Supabase CLI:** `supabase db push` (migracije su u `supabase/migrations/`).
- **Preko asistenta (MCP):** zatraži `apply_migration` na svoj projekat.

Restartuj `npm run dev` — tab **Nalog** sada radi.

## Kako radi

- `src/lib/supabase.js` — klijent (null ako env nije postavljen → graceful no-op).
- `src/lib/auth.js` — signUp / signIn / signOut / sesija.
- `src/lib/cloudSave.js` — `game_states(user_id, state jsonb)` upsert/select.
- Store akcije: `initAuth`, `signIn/Up/Out`, `syncFromCloud`, `syncToCloud`.
- `App.jsx` — `initAuth()` na startu + debounce auto-sync (2s) dok si prijavljen.

Snapshot je isti `persistable()` izbor stanja koji ide i u localStorage (bez `pool`-a
koji se determinizmom regeneriše).

## Multiplayer / produkcija (kasnije)

`supabase/schema.sql` sadrži normalizovane tabele (clubs, cards, user_cards, leagues,
scout_talents, world_cups, …) za buduću multiplayer fazu (Realtime mečevi, leaderboardi,
World Cup kvalifikacije). Trenutni cloud-save je single-player MVP.
