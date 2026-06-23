# Goaleadors — Kompletan Game Design Dokument

> **Verzija:** 1.3 · **Status:** Draft · **Datum:** Juni 2026 · **Logo:** `goaleadors_logo.svg`
>
> Ovo je čista Markdown verzija izvornog GDD-a (PDF). Služi kao kanonski kontekst za
> svaku Claude Code sesiju (vidi §15.4 — "jedan sistem = jedna sesija").

---

## 1. Vizija projekta

Web-based football manager igra s izmišljenim igračima u vidu kartica / Panini sličica.
Igrač osniva klub, kupuje kesice karata, sastavlja tim i takmiči se u piramidalno
strukturisanim ligama. Suština igre je stalna analiza novih edicija karata, pronalaženje
sinergija i menadžerske odluke — slično *Magic: The Gathering* filozofiji, ali u fudbalskom
kontekstu.

**Ključne diferencijacije**

- Izmišljeni igrači = nula pravnih rizika
- Sezonska rotacija edicija karata tjera na stalnu obnovu
- Piramidalni liga sistem daje smisao na svakom nivou
- B2B sponzorski model s kladionicama (affiliate + targeting)
- Live meč s mogućnošću uticaja izmjenama

---

## 2. Kartice / igrači

### 2.1 Osnovna 4 atributa

| Atribut    | Opis                          |
| ---------- | ----------------------------- |
| `SHOOTING` | Preciznost i snaga šuta        |
| `PASSING`  | Distribucija lopte, asistencije |
| `TACKLING` | Odbrana, osvajanje lopte        |
| `PACE`     | Brzina kretanja                 |

**GK posebni atributi:** `REFLEXES` (reakcija na šuteve), `POSITIONING` (pozicija u golu),
`PASSING` (distribucija), `PACE` (izlasci iz gola).

### 2.2 OVERALL formula po poziciji

| Pozicija | Formula                                                  |
| -------- | ------------------------------------------------------- |
| **ATT**  | Shooting×50% + Pace×25% + Passing×20% + Tackling×5%      |
| **MID**  | Passing×40% + Shooting×25% + Pace×20% + Tackling×15%     |
| **DEF**  | Tackling×45% + Pace×25% + Passing×20% + Shooting×10%     |
| **GK**   | Reflexes×45% + Positioning×35% + Passing×15% + Pace×5%   |

### 2.3 Pozicije

`GK`, `DEF`, `MID`, `ATT` — četiri osnovne pozicije.

### 2.4 Nacionalnost

Svaka karta ima nacionalnost koja utiče na sistem kemije i special abilities.

### 2.5 Raritet karata

| Raritet   | Boja               | Abilities          | Šansa (Zlatna kesica) |
| --------- | ------------------ | ------------------ | --------------------- |
| Common    | Siva               | 0                  | 60%                   |
| Rare      | Zlatna             | 1                  | 30%                   |
| Epic      | Ljubičasta         | 2                  | 9%                    |
| Legendary | Crvena             | 2 + boosted stats  | 1%                    |

### 2.6 Special Abilities

**Pravila sistema**

1. Svaka karta ima 0–2 abilities zavisno od rariteta.
2. Abilities se mogu ojačati kroz trening (base → ojačana verzija).
3. Stackovanje s diminishing returns za iste abilities.
4. Kontra-abilities direktno neutrališu protivničke abilities.
5. Određene kombinacije daju sinergijski bonus.

**Abilities po raritetima**

| Raritet   | Abilities                                |
| --------- | ---------------------------------------- |
| Common    | 0                                        |
| Rare      | 1 Individual                             |
| Epic      | 1 Individual + 1 Aura ili Situational    |
| Legendary | 1 Aura ili Situational + 1 Kontra        |

> Legendary karte su jedine s Kontra abilities — što ih čini strateški posebnim, ne samo statistički.

**Individual Abilities** (utiču samo na tu kartu)

| Ability      | Efekat (base)                                  | Ojačan | Pozicija  |
| ------------ | ---------------------------------------------- | ------ | --------- |
| Dead Ball    | +25% konverzija slobodnjaka/penala             | +40%   | MID, ATT  |
| Aerial Threat| +30% konverzija udarca glavom                  | +50%   | DEF, ATT  |
| Dribbler     | +20% prolaz kroz duel                          | +35%   | ATT, MID  |
| Iron Wall    | -20% vjerovatnoća šanse kroz DEF liniju        | -35%   | DEF       |
| Clutch       | kad je neriješeno ili minus, +15% svim statovima| +25%   | bilo koja |
| Speedster    | PACE se računa s 1.3× težinom u AR             | 1.5×   | ATT, DEF  |
| Long Shot    | šutevi s ivice šesnaesterca +15% konverzija    | +28%   | MID, ATT  |
| Penalty King | penali imaju 80% konverziju flat               | 90%    | ATT, MID  |
| Sweeper      | GK pokriva prostor iza DEF, -10% šansi protivnika| -18%  | GK        |
| Wall         | GK na slobodnjacima +25% REFLEXES              | +40%   | GK        |

**Aura Abilities** (utiču na tim)

| Ability          | Efekat (base)                          | Ojačan | Stack (2./3.) |
| ---------------- | -------------------------------------- | ------ | ------------- |
| Captain          | cijeli tim +5 na sve statove           | +8     | +3 / +1       |
| Nationalist      | isti sunarodnjaci +10 OVERALL          | +16    | +5 / +2       |
| Playmaker        | sve MID karte +12 PASSING              | +20    | +6 / +2       |
| Target Man       | sve ATT karte +10% konverzija šansi    | +16%   | +5% / +2%     |
| Libero           | sve DEF karte +10 TACKLING             | +16    | +5 / +2       |
| Ultras Favourite | domaći teren, cijeli tim +6% AR        | +10%   | +3% / +1%     |
| Conductor        | vezna karta daje +5 PASSING svim ATT   | +8     | ne stackuje   |
| Veteran Presence | ako je Veteran token, mlađe karte +8 OVERALL | +12 | ne stackuje  |

**Situational Abilities** (aktiviraju se u određenim momentima)

| Ability         | Kada                                 | Efekat (base)            | Ojačan |
| --------------- | ------------------------------------ | ------------------------ | ------ |
| Big Game Player | evropska takmičenja                  | +20% svim statovima      | +32%   |
| Derby King      | meč rivalstva                        | +25% svim statovima      | +40%   |
| Supersub        | prvih 15 min nakon izmjene           | 130% ratinga             | 150%   |
| Pressure Proof  | zadnjih 15 min meča                  | ne gubi od umora         | +10% statova |
| Comeback King   | tim gubi 1+ gol                      | +20% AR cijelom timu     | +30%   |
| Fortress        | domaći + gubiš 0:1                    | DR +25% za ostatak       | +40%   |
| Ice Veins       | penali/slobodnjaci u zadnjih 10 min  | +35% konverzija          | +55%   |
| Poacher         | 3+ šanse bez gola                    | sljedeća šansa +40% konverzija | +60% |
| Engine          | High Press taktika                   | umor -30% sporije        | -50%   |
| Underdog        | protivnik 10+ overall viši           | +15% AR i DR             | +25%   |

**Kontra Abilities** (neutrališu protivničke abilities — samo Legendary)

| Ability           | Šta countera                          | Efekat (base)              | Ojačan |
| ----------------- | ------------------------------------- | -------------------------- | ------ |
| Disruptor         | sve Aura abilities protivnika         | -40% efikasnosti           | -65%   |
| Aerial Duel       | Aerial Threat                         | potpuno neutralizе + kontira +15% | — |
| Press Breaker     | High Press stil                       | -60% efekta                | potpuno |
| Shadow            | Dribbler                              | -50% efekta                | potpuno |
| Set Piece Stopper | Dead Ball, Ice Veins, Penalty King    | -35% efikasnosti           | -55%   |
| Anti-Captain      | Captain                               | Captain aura -50%          | -80%   |
| Crowd Silencer    | Ultras Favourite, navijački bonus     | navijački bonus -60%       | potpuno |
| Tactician         | 5+ odbrambenih u formaciji            | ATT dobija +20%            | +32%   |

**Sinergije**

| Kombinacija                | Bonus                                                       |
| -------------------------- | ---------------------------------------------------------- |
| Captain + Nationalist      | Nationalist efekat se udvostručuje za sunarodnjake          |
| Supersub + Clutch          | Oba aktivna simultano s +20% boost                         |
| Poacher + Dead Ball        | Dead Ball +extra 15% dok je Poacher aktivan                |
| Engine + High Press        | Umor -50% sporije umjesto -30%                             |
| Disruptor + Crowd Silencer | Protivnik gubi auru i navijački bonus + moralni malus -5% DR |
| Derby King + Ice Veins     | Penali/slobodnjaci u rivalstvu = flat 85% konverzija       |
| Underdog + Comeback King   | Oba aktivna simultano = +35% AR i DR                       |

**Evolucija kroz trening** — Trening centar nivo 4–5 može ojačati ability (npr.
Dead Ball → 10 treninga → Dead Ball+). Nivo 5 daje šansu za novi ability:
Common 5% / Rare 12% / Epic 25% / Legendary nije moguće (već maxed). Novi ability je
uvijek **Individual** — Aura i Kontra dolaze samo iz kesica.

---

## 3. Match engine

### 3.1 Filozofija

Nije realna simulacija 90 minuta, već serija probabilističkih event-ova koji daju
prirodan rezultat. Prosječan broj golova je **2.7 po meču**. Kvalitet i taktika dominiraju,
ali iznenađenja su moguća.

### 3.2 Tijek meča — 18 intervala

18 intervala od 5 minuta (5'…90'). Sudija dodaje 1–5 min nadoknade (random) na kraju
svakog poluvremena.

### 3.3 Korak 1 — Attack / Defense Rating

```
AR = (prosj. SHOOTING napadača × 0.50)
   + (prosj. PASSING veznih   × 0.30)
   + (prosj. PACE cijelog tima × 0.20)
   + taktički modifikator + navijački bonus + special abilities bonus

DR = (prosj. TACKLING odbrambenih × 0.50)
   + (prosj. PASSING veznih        × 0.20)
   + (prosj. PACE odbrambenih       × 0.20)
   + (REFLEXES + POSITIONING golmana × 0.10)
   + taktički modifikator + special abilities bonus
```

### 3.4 Korak 2 — Taktički modifikatori

**Formacija**

| Formacija | AR mod | DR mod | Karakter        |
| --------- | ------ | ------ | --------------- |
| 4-3-3     | +12%   | -8%    | Ofanzivna       |
| 4-4-2     | +5%    | +0%    | Balansirana     |
| 4-2-3-1   | +8%    | +5%    | Kontrola        |
| 4-5-1     | -8%    | +12%   | Defanzivna      |
| 3-5-2     | +6%    | -3%    | Vezna dominacija|
| 5-3-2     | -5%    | +15%   | Ultra defanzivna|
| 5-4-1     | -12%   | +18%   | Parking the bus |

**Stil igre**

| Stil       | Efekat                                          |
| ---------- | ----------------------------------------------- |
| High Press | AR +8%, DR -10%, umor +20%                       |
| Possession | AR +3%, DR +3%, umor normalan                    |
| Counter    | AR -5%, ali kontra šanse imaju +30% konverziju   |
| Defensive  | DR +10%, AR -10%                                 |

**Mentality:** Attacking (AR +10%, DR -15%) · Balanced (neutralno) · Defensive (DR +10%, AR -15%).

### 3.5 Korak 3 — Generisanje šansi po intervalu

```
P(šansa) = base_rate × (AR_A / DR_B) × random_faktor
```

Base rate **18%** po intervalu. Random faktor **0.7–1.3**.

| AR/DR omjer            | Vjerovatnoća |
| ---------------------- | ------------ |
| 1.5+ (dominacija)      | 27%          |
| 1.2–1.5 (jasna prednost)| 22%         |
| 0.9–1.2 (izjednačeno)  | 18%          |
| 0.7–0.9 (potčinjen)    | 13%          |
| < 0.7 (parking bus)    | 8%           |

### 3.6 Korak 4 — Kvalitet šanse

| Tip šanse                  | Vjerovatnoća tipa | Base konverzija |
| -------------------------- | ----------------- | --------------- |
| Zicer (sam ispred golmana) | 15%               | 55%             |
| Šut iz šesnaesterca        | 45%               | 28%             |
| Šut s ivice šesnaesterca   | 30%               | 12%             |
| Udarac glavom              | 10%               | 20%             |

```
Finalna konverzija = base_konverzija
                   × (SHOOTING napadača / 100)
                   × (100 / REFLEXES golmana)
                   × special_ability_mod
```

### 3.7 Korak 5 — Kontrola haosa (meč karakter)

| Karakter   | Vjerovatnoća | Efekat                       |
| ---------- | ------------ | ---------------------------- |
| Normalan   | 60%          | Bez modifikatora             |
| Lud meč    | 15%          | Sve šanse × 1.4              |
| Čvrst meč  | 15%          | Sve šanse × 0.6              |
| Upset meč  | 10%          | Slabiji tim dobija AR +25%   |

### 3.8 Korak 6 — Live izmjene

Pauza između bilo koja dva intervala: izmjena igrača (max 3), promjena formacije (jednom
po poluvremenu), stil i mentality (bez ograničenja).

### 3.9 Korak 7 — Navijački bonus

`AR_domaći = AR × (1 + navijački_bonus)` — Popunjenost 90–100% → +8%, 70–89% → +5%,
50–69% → +2%, ispod 50% → 0% ili -3%.

### 3.10 Korak 8 — Umor karata

`Efektivni rating = base_rating × (energy / 100)`.

### 3.11 Finalna statistika (primjer)

```
FC Beograd  1 : 1  FC Madrid
Posjed:     64%  |  36%
Šutevi:      11  |   5
Na gol:       4  |   2
Šanse:        4  |   2
Ocjena tima: 7.1 |  6.8
```

---

## 4. Edicije karata

- Jedna edicija = 3 sezone = 90 dana. Nova edicija svake sezone (30 dana). U svakom
  trenutku **3 edicije aktivne paralelno**.
- **Penzija:** Dan 75 najava (15 dana upozorenja) → Dan 90 stara edicija ide u Legacy.
- **Teme (§4.3):** Foundations, Speed, Titans, Maestros, Dark Horse.
- **Card pool (§4.4):** 60 Common, 30 Rare, 15 Epic, 5 Legendary = **110** unikatnih.
  Po pozicijama: GK 10, DEF 30, MID 35, ATT 35. (Kasnije se može povećati na 150–200.)
- **Veteran Token (§4.5):** produžava kartu za jednu dodatnu sezonu (ukupno 4 = 120 dana),
  max jednom po karti, aktivirati prije penzije. Izvori: osvajanje lige (1), LŠ/LE/LK (2),
  30-dnevni streak (1), sezonski izazovi (1), kupovina za Lopte.

---

## 5. Kesice (packs)

| Kesica      | Karte | Garancija       | Lopte | Kovanice     |
| ----------- | ----- | --------------- | ----- | ------------ |
| Srebrna     | 5     | Min. 3 Common   | 50    | 2.000        |
| Zlatna      | 5     | Min. 1 Rare     | 150   | 6.000        |
| Dijamantska | 8     | Min. 1 Epic     | 400   | 18.000       |
| Elite       | 5     | Min. 1 Legendary| 1.200 | Nije dostupna |

- **Šanse (Zlatna):** Common 60% / Rare 30% / Epic 9% / Legendary 1%.
- **Pity (§5.3):** nakon 50 kesica bez Legendary — sljedeća Dijamantska/Elite garantuje Legendary.
- **Trade (§5.4):** 1-na-1 ili uz nadoplatu; transfer listing; trade fee 5% (sink); Legacy
  karte samo u Legacy tržištu.

---

## 6. Valutni sistem

- **Lopte** (premium, kupuju se pravim novcem): kesice, ubrzavanje, Elite kesice, Veteran
  tokeni, premium kosmetika, sezonski pass.
- **Kovanice** (free, zarađuju se igranjem): Srebrne/Zlatne kesice, trade fee, ubrzavanje,
  trening, scouting, osiguranje karata.

**Zarada Kovanica:** pobjeda 500–2.000 · remi 200–800 · poraz 50–100 · osvajanje lige 25.000 ·
osvajanje LŠ 100.000 · dnevni login 100–300 · dnevni izazovi 500–1.500 · sponzor ~2.000/sezona.

**Cijene Loptica (EUR):** Starter 100 / 0.99€ · Small 300 / 2.99€ · Medium 700 (+50) / 6.99€ ·
Large 1.500 (+150) / 14.99€ · XL 3.500 (+500) / 29.99€ · Mega 8.000 (+1.500) / 59.99€.

**Ostalo u Lopticama:** ubrzanje gradnje (1h) 10 · ubrzanje skauta (1h) 8 · Veteran token 300 ·
legendarni stadion 2.000 · legendarni grb 500 · legendary dresovi 300 · sezonski pass 400.

---

## 7. Starter pack (po registraciji — besplatno)

```
GK  × 2  (2 Common)
DEF × 6  (4 Common, 2 Rare)
MID × 6  (4 Common, 2 Rare)
ATT × 5  (3 Common, 1 Rare, 1 Epic)
────────────────────────────────────
Ukupno: 19 Common, 5 Rare, 1 Epic = 25 karata
```

Plus: 1 Zlatna kesica, 500 Kovanica, Starter stadion (2.000 kapaciteta). Prosječan overall
tima 65–68 (dovoljno za amatersku ligu).

> ⚠️ **Nekonzistentnost + odluka vlasnika:** raspored po pozicijama daje 13C/5R/1E = 19, a
> sumarna linija tvrdi „19 Common … = 25". Po odluci vlasnika dodato je **+1 Common po
> poziciji** → implementacija (`src/game/starterPack.js`) koristi **17 Common, 5 Rare,
> 1 Epic = 23 karte** (GK×3, DEF×7, MID×7, ATT×6).

---

## 8. Takmičarski sistem

- **Amaterska faza (ELO, §8.1):** svaki dan protivnik sličnog ELO. Pobjeda +25 / remi +5 /
  poraz -15. Na kraju sezone (30 dana) top 20% po državi → najniža profesionalna liga.
  AI klubovi popunjavaju prazna mjesta.
- **Profesionalne lige (§8.2):** piramidalni sistem (1. liga 16 klubova → 2a/2b → 3a–3d…).
  Jednokružno, 1 meč dnevno. Top 2 napreduju, posljednja 2 ispadaju.
- **Promocija/ispadanje (§8.3):** 1–2 mjesto napredak, 3–14 ostaju, 15–16 ispadanje.
- **Evropa (§8.4):** samo iz 1. lige — LŠ (top 2), LE (3–4), LK (5–6).
- **Države Faza 1 (§8.5):** Španija, Engleska, Italija, Njemačka, Francuska.

---

## 9. Klub identitet i kosmetika

- **Onboarding:** Država → Grad → Ime kluba → Grb → Dresovi → Ime stadiona.
- **Grb builder (§9.2):** oblik štita (15–20), pozadina (puna/split), simbol (50+), boja
  simbola (slobodno), natpis (ime/inicijali + font). 500.000+ kombinacija.
- **Dres builder (§9.3):** dizajn (10 opcija), primarna/sekundarna boja, font, sponzor (auto).
- **Premium (Legendary tier, §9.4):** legendarni stadioni (1-of-1 po državi), historijski
  grbovi, special dresovi. Kupljeni legendarni stadion prikazan kao "ZAUZETO" za ostale u državi.
- **Stadion vizuali (§9.5):** Starter 2.000 → Amaterski 5.000 → Polupro 10.000 →
  Profesionalni 25.000 (atmosferski efekti) → Elitni 50.000+ (europske noći).

---

## 10. Infrastruktura kluba

| Objekat            | Maks nivo | Funkcija                          |
| ------------------ | --------- | --------------------------------- |
| Stadion            | 8         | Kapacitet, prihodi, navijači      |
| Akademija          | 5         | Domaće karte besplatno svake sezone|
| Trening centar     | 5         | Stat boost kartama                |
| Scout mreža        | 5         | Traženje specifičnih karata       |
| Medicinski centar  | 3         | Umor i oporavak karata            |
| Marketinška agencija| 5        | Sponzori, prihodi, affiliate      |

- **Stadion (§10.2):** idealan kapacitet po ligi; premali → gubiš prihode; prevelik (niža
  liga) → negativan moral / finansijska crna rupa. Navijačka baza = f(kapacitet, zadnjih 10
  mečeva, liga nivo).
- **Akademija (§10.3):** 85–90% domaći talenti, uvijek iz aktivne edicije. Nivo 1: 2 Common
  (OVR 55–65) … Nivo 5: 5 karata, šansa za Epic (OVR do 90).
- **Trening centar (§10.4):** pasivno +1…+5 svim kartama po nivou; aktivno biraš kartu +
  focus area, +3–5/sezona na stat, max +10 po karti. Nivo 4 → šansa za novi ability.
- **Scout mreža (§10.5):** parametri (pozicija, nacionalnost, min overall, raritet). Trajanje:
  Common 4h, Rare 12h, Epic 48h, Legendary 7 dana. Nivo 5 → 5 skauta + traženje special abilities.
- **Umor (§10.6):** energy bar 100%; meč troši 15% base + 5%; oporavak ~20%/dan; <30% energy
  → -10% statovima; <10% → karta ne može igrati.
- **Medicinski centar (§10.7):** +10/+20/+30% oporavak po nivou; hitno liječenje.
- **Marketinška agencija (§10.8):** 2–5 sponzorskih ponuda/sezona. Lokalni 3.000 (1 sez),
  regionalni 8.000 (2 sez), premium 20.000 (3 sez).

---

## 11. Affiliate sistem (B2B)

- **Za igrača (§11.1):** odabir sponzora-kladionice → "Već imam nalog" (+5.000 Kovanica) ili
  "Nemam nalog" (+15.000 Kovanica + Zlatna kesica). Bonus po potvrdi kladionice.
- **Prihod developera (§11.2):** povezivanje → fee po verifikaciji; nova registracija → CPA
  20–50€; prvi depozit → revenue share %.
- **Tehnički (§11.3):** redirect s affiliate tracking linkom → webhook potvrda → auto isplata
  Kovanica → faktura CPA fee.
- **B2B paketi (§11.4):** Basic (logo + Kovanice), Premium (+ CPA), Exclusive (+ jedina
  kladionica u državi).
- **Zaštita (§11.5):** dobna verifikacija 18+, odgovorno kockanje disclaimer, jedan affiliate
  po kladionici, geo-restriction.

---

## 12. Dnevni progression loop

- **Dnevno:** login bonus, transfer tržište, scouting; dnevni meč (live + izmjene), 1–2
  izazova, status gradnje.
- **Sedmično:** liga kolo, streak reward, sezonski pass.
- **Dnevni izazovi (primjeri):** "3+ gola razlike" → 800; "3 igrača iste nacionalnosti" →
  Srebrna kesica; "2 izmjene" → 400; "pobijedi viši overall" → 1.200 + Rare.
- **Streak:** 3 dana → mala kesica · 7 → Zlatna · 30 → Dijamantska + kosmetika.
- **Sezonski pass (30 dana):** free + premium track (kesice, Kovanice, Epic/Legendary karte).

---

## 13. Legacy album

- **Muzej kluba (§13.1):** svaka penzionisana karta hronološki, statistike, "legendarni
  momenti", vizuelno kao Panini album.
- **Legacy bonusi (§13.2):** 10 karata iste edicije → +1% prihod trajno; kompletna Legendary
  kolekcija → vizualni efekat; 50 karata → +2% navijačka baza; karta iz titule → "Titula karta".
- **Legacy tržište (§13.3):** kolekcijska vrijednost, sekundarna ekonomija.

---

## 14. Socijalni sistemi

- **Ultra grupe (§14.1):** 5–20 igrača, Capo + Lieutenanti + Membri; Ultra poeni; sedmični
  grupni izazovi; kapacitet po nivou (5/10/15/20/30) otključava chat/leaderboard/kosmetiku/
  europska takmičenja/Legendarni grb.
- **Rivalstva (§14.2):** zahtjev → prihvat; svaki međusobni meč = Derby; max 3 aktivna; bonusi
  +50%…+150% Kovanica; nivoi: Mlado (0–10) → Pravo (11–25) → Vječno (26–50) → Legendarno (50+).
- **Prijatelji (§14.3):** friendly (500–1.000), random trening (200–300), AI sparring (100).
- **Hall of Fame (§14.4):** kraj sezone — šampioni liga/LŠ/LE/LK, najviše golova, najduži niz,
  Ultra grupa sezone.

---

## 15. Tehnička arhitektura

### 15.1 Tech stack

| Sloj                | Tehnologija                     |
| ------------------- | ------------------------------- |
| Frontend            | React + Vite                    |
| Animacije/UI        | Framer Motion                   |
| State management    | Zustand                         |
| Match vizualizacija | HTML5 Canvas                    |
| Backend/DB          | Supabase (PostgreSQL)           |
| Real-time           | Supabase Realtime subscriptions |
| Server logika       | Supabase Edge Functions         |
| Sezonski ciklusi    | Supabase Cron jobs              |
| Deployment (FE)     | Vercel                          |
| Plaćanje            | Stripe                          |

### 15.2 Ključne baze (Faza 1)

`users` · `clubs` (jedan per user) · `cards` (definicije) · `user_cards` · `editions` ·
`matches` · `leagues` · `league_standings` · `packs` · `transactions`.

### 15.3 Build faze

- **Faza 1 — Core loop (2–3 mj):** registracija + onboarding, grb/dres builder, starter pack +
  otvaranje kesica (animacija), osnovna karta sistema, jednostavan match engine, amaterska liga
  s ELO, jedna aktivna edicija, dvije valute.
- **Faza 2 — Depth:** live meč s izmjenama/taktikama, special abilities, profesionalne lige,
  stadion gradnja, akademija + trening centar, trade tržište, sezonski ciklusi + penzija.
- **Faza 3 — Social & Economy:** rivalstva + friendly, Ultra grupe, scout mreža, marketinška
  agencija + sponzori, affiliate, sezonski pass, Veteran tokeni.
- **Faza 4 — Scale:** evropska takmičenja, više država, Legendary kosmetika (1-of-1),
  medicinski centar + umor, Hall of Fame, mobile optimizacija.

### 15.4 Strategija za Claude Code

**Jedan sistem = jedna sesija.** Primjer: (1) card system → (2) match engine → (3) kesica
opening. Svaka sesija dobija ovaj dokument kao kontekst + detalje za tu funkcionalnost.

---

## 16. Monetizacija (summary)

- **Streamovi:** Lopte (direktna prodaja), sezonski pass (subscription), Legendary kosmetika
  (one-time), B2B sponzorstva (fiksni fee), affiliate kladionice (CPA + rev share).
- **Igrač tipovi:** F2P 70% (0% prihoda, popunjavaju lige/tržište) · Dolphins 25% (50% prihoda)
  · Whales 5% (50% prihoda).
- **F2P balans:** dedicated F2P ~15.400 Kovanica/sedmično (≈ 1 Zlatna kesica svaka 3 dana);
  konkurentan, ali 5–10× sporije od plaćenih igrača.

---

## 17. Referral program

- **Mehanika:** unikatan link/kod (`goaleadors.com/join?ref=DADO123`).
- **Nagrade (obje strane):** registracija → pozivač 1 Zlatna; 7 mečeva → 3.000 Kovanica /
  novi 1 Zlatna; prva kesica → 500; profesionalna liga → 1 Dijamantska (obje strane); prvi
  pack Loptica → 10% vrijednosti u Lopticama.
- **Tier (§17.3):** Scout 1–4 (standard) · Agent 5–14 (+25%) · Director 15–29 (+50% + kosmetika)
  · Legenda 30+ (+100% + ekskluzivni grb + mjesečna Dijamantska; vidljiva titula).
- **Chain (§17.4):** 2 nivoa — drugi nivo daje 20% standardnih nagrada.
- **Anti-abuse (§17.5):** 7 mečeva prije validacije, max 3 referrala s iste IP, jedan
  uređaj/IP = jedan nalog, isplata tek nakon validacije.
- **"Moja mreža" (§17.6):** lista pozvanih + napredak, ukupno zarađenih Loptica.

---

> *Dokument će se ažurirati sa svakom novom odlukom tokom razvoja.*
