# Goaleadors — Design Brief
> Za Claude Design / UI dizajnera · Juni 2026

---

## 1. Šta je Goaleadors

Web-based football manager igra s izmišljenim igračima u vidu kartica (Panini stil). Igrač osniva klub, kupuje kesice karata, sastavlja tim i takmiči se u ligama. Core loop:

**Kupi kesice → Otvori karte → Postavi tim → Odigraj meč → Napreduj u ligi**

**Platforma:** Web (React/Vite), PWA-ready. Radi na mobilnom i desktopu.
**Publika:** 18–35, fudbalski fanovi, poznaju FIFA Ultimate Team.
**Ton:** Premium gaming, tamna tema, energičan — blizak FIFA/EA Sports estetici.

---

## 2. Korisnički tok (User Flow)

```
1. LANDING          — Fullscreen fudbalski teren (CSS) + glassmorphism kartica
                       Registracija / Prijava (email + lozinka)

2. ONBOARDING       — 6-koračni wizard (progress bar + animirani prelazi)
   Korak 1: Odabir države     (Španija / Engleska / Italija / Njemačka / Francuska)
   Korak 2: Odabir grada      (5 gradova po državi)
   Korak 3: Ime kluba         (text input)
   Korak 4: Grb builder       (oblik štita + pozadina + simbol + boje + font)
   Korak 5: Dres builder      (dizajn + primarna/sekundarna boja + font)
   Korak 6: Ime stadiona      (text input + summary preview)

3. STARTER PACK     — Fullscreen animacija otvaranja 23 starter kartice
                       Karte licem prema dolje → tap to reveal
                       Legendary overlay s gold česticama
                       Web Audio API zvuci (bez eksternih fajlova)

4. DASHBOARD        — Glavno sučelje (sidebar + topbar + content area)
```

---

## 3. Layout arhitektura

### Desktop (≥769px)
```
┌──────────┬───────────────────────────────────────────┐
│          │  TOPBAR (56px)                             │
│ SIDEBAR  │  [Naziv taba]    [⚽ Lopte] [🪙 Kovanice] │
│  (68px)  ├───────────────────────────────────────────┤
│          │                                           │
│  [Logo]  │           CONTENT AREA                   │
│          │         (scrollable)                     │
│  [Nav]   │                                           │
│  items   │                                           │
│          │                                           │
│  [🔒]    │                                           │
│  locked  │                                           │
└──────────┴───────────────────────────────────────────┘
```

**Sidebar:** 68px širok, tamno navy pozadina. Logo "G" na vrhu. Nav items: ikona + label. Aktivni item = zelena boja. Zaključani tabovi sivi s 🔒.

**Topbar:** 56px visok. Lijevo: naziv i ikona aktivnog taba. Desno: balanse (⚽ Lopte zeleno, 🪙 Kovanice zlatno) + reset dugme.

### Mobilni (≤768px)
```
┌────────────────────────────────┐
│  TOPBAR (56px)                 │
│  [Tab naziv]   [⚽] [🪙]      │
├────────────────────────────────┤
│                                │
│        CONTENT AREA            │
│       (fullscreen scroll)      │
│                                │
├────────────────────────────────┤
│  BOTTOM NAV (60px)             │
│  🏠    👥    ⚽    🏆    🛒   │
│ Klub  Tim   Meč  Liga  Shop   │
└────────────────────────────────┘
```

**Bottom nav:** 5 tabova (Klub, Moj Tim, Meč, Liga, Shop). Aktivni tab zelena ikona + label.

---

## 4. Navigacijska struktura (svi tabovi)

### Uvijek vidljivi (core)
| Tab | Ikona | Label |
|-----|-------|-------|
| club | 🏠 | Moj klub |
| myteam | 👥 | Moj tim |
| cards | 🃏 | Karte |
| packs | 📦 | Kesice |
| match | ⚽ | Meč |
| league | 🏆 | Liga |
| shop | 🛒 | Kupi Lopte |
| account | 👤 | Nalog |

### Otključavaju se progresijom
| Uvjet | Tabovi |
|-------|--------|
| ≥1 sezona odigrana | 🏪 Tržište · 💪 Trening · ⚕️ Medicinski |
| ≥3 sezone | 🎓 Akademija · 🔭 Scout · 💼 Sponzori · 🎬 Live Meč |
| ≥6 sezona | ⭐ Profi liga · 📅 Edicije · 📈 Sezona · 👥 Društvo · 🔗 Referral · 🌍 World Cup · 💰 Affiliate · 💎 Premium |
| Dev mod (`?dev=1`) | ⚙️ Admin |

**UX nota:** Zaključani tabovi su vidljivi u sidebaru kao sivi s 🔒 (tek nakon 1. sezone — hint igraču da postoje).

---

## 5. Design sistem (trenutne CSS varijable)

### Paleta boja
```css
--bg:         #0d0f14   /* Tamna pozadina (gotovo crna, plava nijansa) */
--bg-2:       #131720   /* Sekundarna pozadina */
--card:       #1a1d28   /* Kartice, paneli */
--card-2:     #1f2335   /* Uzdignute kartice (hover/modal) */
--border:     #2a2f45   /* Linije, granice */

--green:      #22c55e   /* Primarni akcent (CTA, aktivni, uspjeh) */
--gold:       #f59e0b   /* Valuta (Kovanice), Rare boja */
--purple:     #8b5cf6   /* Epic boja */
--red:        #ef4444   /* Greška, opasnost */
--blue:       #3b82f6   /* Info, linke */

--text:       #e2e8f0   /* Primarni tekst */
--text-muted: #64748b   /* Sekundarni tekst, labele */
```

### Rijetkoće karata (rarity system)
| Raritet | Hex | Pozadina kartice | Svrha |
|---------|-----|-----------------|-------|
| **Common** | `#9aa0a6` (siva) | `linear-gradient(160deg, #1F2937, #374151)` | 60% karata, base |
| **Rare** | `#e0a01e` (zlatna) | `linear-gradient(160deg, #1A1500, #2D2200)` | 30%, 1 ability |
| **Epic** | `#8b3fd1` (ljubičasta) | `linear-gradient(160deg, #1A0A2E, #2D1054)` | 9%, 2 abilities |
| **Legendary** | `#d63a3a` (crvena) | `linear-gradient(160deg, #1A0000, #3D0000)` | 1%, 2 abilities + boost |

Svaka kartica ima **glow box-shadow** u boji rariteta: `box-shadow: 0 0 14px color-mix(in srgb, VAR 35%, transparent)`

### Tipografija
- **System UI / Inter** za UI tekst
- **Roboto Slab / Rockwell** za gaming naslove (slab serif)
- Veličine: 9px (micro labele) · 11px (badge) · 13px (body) · 15px (nav) · 22px (naslovi) · 32px (hero)

### Spacing
- Padding kartice: 16–20px
- Gap između elemenata: 8px / 12px / 16px / 24px
- Border radius: 8px (small), 12px (kartica), 16px (modal), 20px (hero)

---

## 6. Karta igrača (Player Card)

### Vizuelna struktura (160px × 220px)
```
┌──────────────────────┐
│ 87  ATT         🇷🇸 │  ← OVR (24px bold, rarity boja) · POS badge · zastava
├──────────────────────┤
│                      │
│     [Inicijali]      │  ← Avatar krug (56px), pozadina = rarity hex 22%
│                      │
│   MARKO VIDIĆ        │  ← Ime (11px, uppercase, bijelo)
│   ─ LEGENDARY ─      │  ← Raritet label (9px, rarity boja)
├──────────────────────┤
│  SHO 92 │ PAS 74    │  ← 2-kolumni grid atributa
│  TAC 35 │ PAC 88    │    Label sivi (9px) · Vrijednost bijela (10px bold)
├──────────────────────┤
│  ⚡ Target Man       │  ← Abilities chipovi (rarity boja bg + border)
│  ⚡ Anti Captain     │
└──────────────────────┘
```

**Varijante po poziciji:**
- **ATT/MID/DEF:** SHO, PAS, TAC, PAC
- **GK:** REF, POS, PAS, PAC

**Hover efekt:** `translateY(-6px) scale(1.03)` s spring animacijom

**Legendary posebnost:** shimmer animacija na pozadini (repeating-linear-gradient 45°, pokreće se)

---

## 7. Kesica (Pack)

### Tipovi
| Kesica | Vizualni stil | Emoji | Boja glow |
|--------|--------------|-------|-----------|
| Silver | Sivo-bijeli gradient | 🥈 | `rgba(156,163,175,0.5)` |
| Gold | Tamno zlatni gradient | 🥇 | `rgba(201,168,76,0.7)` |
| Diamond | Plavo-bijeli gradient | 💎 | `rgba(96,165,250,0.7)` |
| Starter | Zeleni gradient | ⚽ | `rgba(34,197,94,0.6)` |

**Animacije kesice:**
1. `pack-float` — levitira gore-dolje (3s loop) dok čeka klik
2. `pack-shake` — trese se (0.4s) pri otvaranju
3. **Burst efekt** — krug + particle eksplozija pri pucanju
4. Karte se prikazuju face-down → klik = flip (rotateY 90°→0° + scale)
5. **Legendary overlay** — fullscreen darkening, zlatni tekst "⭐ LEGENDARY ⭐", spotlight odozgo, gold čestice, pulsiranje kartice

---

## 8. Onboarding Wizard

### Layout
**Desktop:** Max 760px, centriran, glassmorphism kartica na pitch pozadini  
**Mobilni:** Fullscreen, nema padding

### Komponente
- **Progress bar** (3px, zeleni, sticky vrh) — širi se kroz korake
- **Step indikatori** — 6 kružića (emoji ikona → zelena ✓ kad završen, klikabilni za povratak)
- **Step title** (22px bold) + hint tekst (13px sivi)
- **Animate presence** — slide+fade između koraka (x: 40→0, duration: 0.22s)

### Koraci vizuelno

**Korak 1 & 2 (Država/Grad):** Grid kartica (minmax 130px). Karta = centrirana ikona (28px) + label. Active state: zeleni border + zeleni tekst + glow.

**Korak 3 & 6 (Tekst):** Veliki input (18px tekst, 14px padding, zeleni focus border). Hint tekst ispod.

**Korak 4 (Grb):**
- Lijevo (sticky): CrestSVG preview (160px) + label
- Desno: kontrole
  - Pill selektori (zaobljeni, zeleni active)
  - Emoji grid (34px gumbi, scrollable, max 140px visine)
  - Color swatches (44px × 44px color input + hex prikaz)

**Korak 5 (Dres):** Isti pattern kao grb, JerseySVG preview.

**Korak 6 (Stadion):** Input + summary kartica na dnu (grb + ime kluba + dres preview).

### Nav gumbi
- **Nazad**: transparentno, sivi tekst
- **Dalje**: zeleno, bijeli tekst, glow shadow
- **Osnuj klub**: veći (15px), gradient, pulsing shadow

---

## 9. Moj Tim (MyTeam Panel)

### Layout
```
[4-3-3] [4-4-2] [4-2-3-1] [4-5-1] [3-5-2] [5-3-2] [5-4-1]   ← Formacija picker (pill gumbi)
3/11 igrača · ⚠️ Klikni slot za dodavanje                       ← Status

┌─────────────────────────────────────────┐
│  FUDBALSKI TEREN (zeleni gradient bg)   │
│                                         │
│         [ATT] [ATT] [ATT]               │
│                                         │
│      [MID]  [MID]  [MID]               │
│                                         │
│   [DEF] [DEF] [DEF] [DEF]              │
│                                         │
│              [GK]                       │
└─────────────────────────────────────────┘

KLUPA
[76 Vidić DEF] [72 Kovač MID] [68 Perić ATT] ...
```

**Slot (prazan):** Isprekidani bijeli border (dashed), POS label u centru, hover → zeleni border  
**Slot (popunjen):** Zeleni solid border, OVR (16px, zeleni) + prezime (9px, bijelo)  
**Klik na popunjen** → briše igrača  
**Klik na prazan** → otvara picker modal

**Picker modal:**
- Overlay (70% crno)
- Bijela lista filtrirana po poziciji
- Sortirano: ista pozicija prvo, pa po OVR
- Format: `[OVR] Ime igrača [POS]`
- Igrači iste pozicije imaju blago istaknuti stil

---

## 10. Meč simulator

```
┌─────────────────────────────────────────┐
│  ✅ Koristiš svoju postavu (11 igrača)  │  ← Status notice (zeleni ili žuti)
├────────────────┬────────────────────────┤
│   DOMAĆI       │      GOSTI             │  ← Tactics picker (2 kolone)
│   Formacija ▼  │   Formacija ▼          │
│   Stil      ▼  │   Stil      ▼          │
│   Mentalitet ▼ │   Mentalitet ▼         │
└────────────────┴────────────────────────┘
         [⚽ SIMULIRAJ MEČ]

─── REZULTAT ──────────────────────────────
         Domaći  2 : 1  Gosti
         "Lud meč — obje ekipe napadale"

   Posjed   64%  │  36%
   Šutevi    11  │   5
   Na gol     4  │   2
   Šanse      4  │   2
   Ocjena    7.1 │  6.8

   5' · šansa — Domaći (Marković, šut iz šesnaesterca) 0:0
  23' · ⚽ GOL — Domaći (Perić, zicer) 1:0
  67' · ⚽ GOL — Gosti (Müller, šut s ivice) 1:1
  88' · ⚽ GOL — Domaći (Vidić, slobodnjak) 2:1
```

---

## 11. Liga tabela

```
 #   Klub                W  D  L  Pts   ← Header
────────────────────────────────────────
 1  🟢 FC Sarajevo       8  2  0  26   ← Top 2: zelena → napredak
 2  🟢 Dynamo            7  1  2  22
 3     Athletic           6  3  1  21
 4     FC Madrid          5  2  3  17
...
15  🔴 Botafogo           1  1  8   4   ← Posljednja 2: crvena → ispadanje
16  🔴 FC Torino          0  2  8   2
────────────────────────────────────────
     [Simuliraj novu sezonu]
```

---

## 12. Admin Panel

**Dva taba:**

**👥 Igrači** — tabela svih Supabase korisnika:
`Klub | Država | ⚽ Lopte | 🪙 Kovanice | Karte | Dan | Zadnja aktivnost`

**⚙️ Dev alati** — cheat sekcije:
- Valute (input + dugmad: +Kovanice, +Lopte, +Veteran token)
- Karte (gumbi za otvaranje svake kesice, +1 po raritetu)
- Nivoi objekata (select dropdowns: Scout/Trening/Medicinski/Agencija)
- Vrijeme (+1 dan, +7 dana, +1 sezona)
- Manager Rating (inputi za parametre)
- Stanje (stat grid + Reset dugme)

---

## 13. Shop Panel (Kupi Lopte)

**6 paketa Lopti** u grid rasporedu:

| Paket | Lopte | Cijena | Badge |
|-------|-------|--------|-------|
| Starter | 100 | €0.99 | — |
| Small | 300 | €2.99 | — |
| Medium | 750 | €6.99 | 🔥 Najpopularnije |
| Large | 1.650 | €14.99 | — |
| XL | 4.000 | €29.99 | — |
| Mega | 9.500 | €59.99 | 💎 Najbolja vrijednost |

Svaki paket: kartica s imenom, Lopte ikona (⚽), količina, cijena, CTA dugme.

---

## 14. Animacije i interakcije

### Postojeće animacije
| Animacija | Gdje | Detalji |
|-----------|------|---------|
| Spring hover | Player card | `translateY(-6px) scale(1.03)`, spring stiffness 260 |
| Slide-fade | Onboarding koraci | `x: 40→0, opacity: 0→1, 220ms easeInOut` |
| Pack float | Kesica | `translateY 0→-12px→0, 3s loop` |
| Pack shake | Kesica (otvaranje) | `rotate ±3°, translateX ±8px, 400ms` |
| Particle burst | Pack opening | 24–28 čestica, radijalno, 800ms fade-out |
| Card flip | Pack reveal | `rotateY 90°→0°, scale 0.8→1, 450ms spring` |
| Legendary overlay | Legendary pull | Darkening + "⭐ LEGENDARY ⭐" drop, gold particles |
| Splash pulse | Loading | "G" logo + pulsing dot |
| Progress bar | Onboarding | Width transition 400ms ease |

### Što treba dizajnirati
- Hover stanja za sve interaktivne elemente
- Focus/active stanja (accessibility)
- Loading skeleton stanja
- Success/error toast notifikacije
- Smooth tab switching transitions
- Mobile swipe geste za navigaciju

---

## 15. Posebni ekrani (fullscreen)

### Landing (Auth)
- **Pozadina:** Fullscreen CSS fudbalski teren (zelene pruge + linije + centar krug + penal + golovi)
- **Overlay:** Tamni gradient odozgo-dolje (65% crno)
- **Kartica:** Glassmorphism (backdrop-filter blur 20px, bijela 8% bg, bijeli border 12%)
  - Logo "G" u zelenoj kružnici
  - "Goaleadors" naslov + "Football manager · card game"
  - Tabs: Registracija | Prijava
  - Email + Password inputi
  - Submit dugme (zeleni)

### Onboarding Flow (wrapper)
- Isti CSS teren u pozadini (50% opacity)
- Centrirana kartica max 760px (desktop), fullscreen mobilni
- Kartica sadrži header (logo + naslov + email korisnika) + `<ClubOnboarding>` + "Odjavi se" link

### Starter Pack Opening
- Tamna svemirska pozadina `#060a0f`
- 25 animiranih zvjezdica (fixed, drift animacija)
- "GOALEADORS" naslov (32px, zeleni, glow)
- Zelena kesica (pack visual) → otvaranje → grid karata face-down → reveal po jedna

---

## 16. Komponente koje treba dizajnirati

### Prioritet 1 (core gameplay)
- [ ] Player Card (sve 4 rijetkoće + talent varijanta)
- [ ] Pack (Silver, Gold, Diamond, Starter)
- [ ] Pack opening animacija (fullscreen)
- [ ] Landing / Auth stranica
- [ ] Onboarding wizard (6 koraka)
- [ ] Dashboard layout (sidebar + topbar + content)

### Prioritet 2 (engagement)
- [ ] Pitch view (MyTeam) — zeleni teren s slotovima
- [ ] Match result (scoreboard + event feed)
- [ ] League table
- [ ] Club panel (grb + dresovi + info)

### Prioritet 3 (monetizacija i meta)
- [ ] Shop panel (6 paketa)
- [ ] Admin panel (players table + dev tools)
- [ ] Training panel
- [ ] Scout panel
- [ ] Toast/notification sistem

---

## 17. Grb i dres builder

### Grb (CrestSVG)
SVG u viewBox `0 0 100 120`. Parametri:
- **Oblici štita (8):** Classic · Rounded · French · Spanish · Arched · Swallow tail · Flat · Pentagon
- **Pozadina (3):** Solid (puna boja) · Split H (gore/dolje) · Split V (lijevo/desno)
- **Simbol (54):** životinje, sportski simboli, slova, predmeti (emoji)
- **Boje:** color1, color2 (slobodan input), symbolColor
- **Font natpisa (4):** Sans · Serif · Slab · Mono
- **Tekst:** ime kluba ili inicijali (auto)

### Dres (JerseySVG)
SVG. Parametri:
- **Dizajni (10):** Jednobojan · Vertikalne pruge · Horizontalne pruge · Polovine · Dijagonalna traka · Kvadrati · Kontrast rukavi · Tanke pruge · Dijagonalne polovine · Akcent kragna
- **Boje:** primary, secondary (slobodan input)
- **Font:** 4 opcije

---

## 18. Responsivne napomene

| Element | Desktop | Mobilni |
|---------|---------|---------|
| Sidebar | Vidljiv (68px) | Skriven |
| Bottom nav | Skriven | Vidljiv (60px) |
| Onboarding kartica | Max 760px, centrirana | Fullscreen |
| Grb/dres builder | 2 kolone (preview + kontrole) | Stack (jedna kolona) |
| Card grid | 4–6 karata u redu | 2–3 karte u redu |
| Admin tabela | Horizontalni scroll | Horizontalni scroll |
| Liga tabela | Full width | Scroll |

**Breakpoint:** 768px

---

## 19. Tekući problemi i prijedlozi za dizajnera

1. **Karte** trenutno nemaju pravu sliku igrača — avatar je krug s inicijalima. Treba razmotriti generisanu ilustraciju ili siluetu.
2. **Onboarding** wizard radi ali vizualno nije optimalan na mobilnom (kontrole za grb builder su zbijene).
3. **Admin tabela** nema sortiranje ni filtriranje — treba placeholder za te kontrole.
4. **Locked tabs** u sidebaru su vidljivi ali nedostaje tooltip koji govori kada se otključavaju.
5. **Valute u topar** — potrebna je konzistentnija vizualna hijerarhija (Lopte = premium, Kovanice = earned).
6. **Match feed** (event log) mogao bi biti vizualniji — ticker stil ili timeline.
7. **Starter Pack Opening** zvučni efekti postoje ali vizuelni je prilagodba originalnog dizajna — treba dedicated UX flow.

---

## 20. Referentne boje (quick reference)

```
Pozadina:     #0d0f14
Kartice:      #1a1d28
Granice:      #2a2f45
Primarni akcent (CTA, zeleni): #22c55e
Kovanice (zlatni):             #f59e0b
Lopte (zeleni, isti kao CTA):  #22c55e
Greška / ispadanje:            #ef4444
Napredak / promocija:          #22c55e

Common rarity:    #9aa0a6
Rare rarity:      #e0a01e
Epic rarity:      #8b5cf6
Legendary rarity: #d63a3a
```
