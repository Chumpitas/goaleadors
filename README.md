# Goaleadors

Web-based football manager card game — izmišljeni igrači u vidu Panini sličica. Igrač osniva
klub, kupuje kesice karata, sastavlja tim i takmiči se u piramidalnim ligama. (Vidi puni GDD:
[`docs/GOALEADORS_SPEC.md`](docs/GOALEADORS_SPEC.md).)

> **Status:** Phase 1 scaffold — fokus na **card system** (§2 spec-a). Ovo je standalone
> projekat; trenutno živi unutar `bezbrige` repozitorija samo privremeno (vidi *Izdvajanje u
> vlastiti repo* niže).

## Tech stack (§15.1)

React + Vite · Framer Motion · Zustand · HTML5 Canvas (match viz, kasnije) · Supabase
(PostgreSQL, Realtime, Edge Functions, Cron) · Vercel · Stripe.

## Šta je u ovom scaffoldu

| Putanja                     | Sadržaj                                                        |
| --------------------------- | ------------------------------------------------------------- |
| `src/game/constants.js`     | Pozicije, atributi, rariteti (boje + pull šanse), edicija pool |
| `src/game/overall.js`       | OVERALL formula po poziciji (§2.2) + computeOverall()          |
| `src/game/abilities.js`     | Katalog abilities: Individual / Aura / Situational / Kontra (§2.6) |
| `src/game/cards.js`         | createCard() factory + validacija (rariteti, atributi, slots)  |
| `src/game/sampleCards.js`   | Demo karte za UI preview                                       |
| `src/game/packs.js`         | Kesice: definicije, pull odds (§5.2), garancije + pity (§5.3)   |
| `src/game/editionGenerator.js`| Proceduralni 110-card edition pool (§4.4) + drawCards          |
| `src/game/tactics.js`       | Formacije, stil, mentalitet, tipovi šanse, haos, navijači (§3.4–3.9) |
| `src/game/matchEngine.js`   | Simulacija meča: AR/DR, 18 intervala, konverzija, scoreboard (§3) |
| `src/game/elo.js`           | ELO sistem: delte, matchmaking, napredovanje (§8.1)            |
| `src/game/amateurSeason.js` | Amaterska sezona: AI klubovi, 30 dana, top 20% promocija (§8.1) |
| `src/game/cosmetics.js`     | Države/gradovi, štitovi, simboli, dizajni dresa, kombinatorika (§9) |
| `src/game/rng.js`           | Seedable PRNG (deterministički draws)                          |
| `src/game/*.test.js`        | Vitest: OVERALL, karte, packs + pity, pool, match engine       |
| `src/store/useGameStore.js` | Zustand store (kolekcija, pity, openAndCollect)                |
| `src/components/CardView.jsx`| Panini-style render karte (Framer Motion)                     |
| `src/components/PackOpening.jsx`| Pack shelf + reveal animacija (Framer Motion)              |
| `src/components/MatchSim.jsx`| Izbor taktike + simulacija meča + event feed                  |
| `src/components/LeagueTable.jsx`| Amaterska sezona: tabela + zona napredovanja              |
| `src/components/ClubOnboarding.jsx`| Onboarding tok + grb/dres builder (live SVG preview)   |
| `src/components/CrestSVG.jsx` / `JerseySVG.jsx`| SVG renderi grba i dresa                    |
| `src/components/ClubPanel.jsx`| Tab Klub: onboarding ili prikaz identiteta               |
| `src/lib/supabase.js`       | Supabase klijent (radi i bez konfiguracije za demo)            |
| `supabase/schema.sql`       | Phase-1 DB skeleton (§15.2 tabele)                             |
| `docs/GOALEADORS_SPEC.md`   | Kompletan GDD v1.3 (kanonski kontekst)                         |

## Pokretanje

```bash
npm install
cp .env.example .env.local   # popuni Supabase vrijednosti (opciono za card demo)
npm run dev                  # Vite dev server — card system preview
npm test                     # Vitest — verifikuje OVERALL formule i pravila karata
```

Card demo radi i bez Supabase konfiguracije (`supabase` klijent je `null` dok env varijable
nisu postavljene).

## Roadmap (§15.3) — jedan sistem = jedna sesija (§15.4)

- [x] **Card system** — atributi, OVERALL, rariteti, abilities katalog
- [x] **Kesica opening** — pull odds, garancije, pity, edition pool + reveal UI (§5)
- [x] **Match engine** — AR/DR, intervali, taktike, konverzija, haos + UI (§3)
- [x] **Amaterska liga (ELO)** — delte, matchmaking, AI klubovi, top 20% + UI (§8.1)
- [x] **Onboarding + grb/dres builder** — tok, SVG štit/dres, kombinatorika (§9)
- [ ] Dvije valute + starter pack (§6, §7)
- [ ] Edicije + penzija (§4)

## Izdvajanje u vlastiti repo

Ovaj folder je samostalan (vlastiti `package.json`, `supabase/`, deps). Kad napraviš
`goaleadors` repo na GitHub-u, izdvoji ga čuvajući historiju:

```bash
# iz root-a bezbrige repozitorija
git subtree split --prefix=goaleadors -b goaleadors-only
cd /putanja/do/novog/goaleadors && git init
git pull /putanja/do/bezbrige goaleadors-only
```

Ili jednostavno: kopiraj `goaleadors/` u novi prazan repo i napravi prvi commit.
