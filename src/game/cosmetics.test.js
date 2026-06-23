import { describe, it, expect } from 'vitest';
import {
  COUNTRIES,
  SHIELD_SHAPES,
  SYMBOLS,
  JERSEY_DESIGNS,
  crestCombinations,
  defaultCrest,
  defaultKit,
  validateCrest,
  validateKit,
  initials,
  shieldPath,
} from './cosmetics.js';

describe('katalog kosmetike (§9)', () => {
  it('podržava 5 država Faze 1 sa gradovima (§8.5)', () => {
    const names = Object.keys(COUNTRIES);
    expect(names).toEqual(['Španija', 'Engleska', 'Italija', 'Njemačka', 'Francuska']);
    for (const cities of Object.values(COUNTRIES)) expect(cities.length).toBeGreaterThanOrEqual(5);
  });

  it('ima 50+ simbola i 10 dizajna dresa (§9.2/§9.3)', () => {
    expect(SYMBOLS.length).toBeGreaterThanOrEqual(50);
    expect(JERSEY_DESIGNS).toHaveLength(10);
  });

  it('svaki oblik štita ima validan SVG path', () => {
    for (const s of SHIELD_SHAPES) {
      expect(s.path).toMatch(/^M/);
      expect(s.path).toMatch(/Z$/);
    }
  });

  it('kombinatorika grba prelazi 500.000 (§9.2)', () => {
    expect(crestCombinations()).toBeGreaterThan(500000);
  });
});

describe('validacija konfiguracije', () => {
  it('nepoznate vrijednosti grba padaju na default', () => {
    const v = validateCrest({ shape: 'xx', background: 'yy', symbol: 'nope', font: 'zz', text: 123 });
    const d = defaultCrest();
    expect(v.shape).toBe(d.shape);
    expect(v.background).toBe(d.background);
    expect(v.symbol).toBe(d.symbol);
    expect(v.font).toBe(d.font);
    expect(typeof v.text).toBe('string');
  });

  it('čuva validne vrijednosti grba i siječe natpis na 20 znakova', () => {
    const v = validateCrest({ shape: 'pentagon', background: 'split-v', text: 'x'.repeat(50) });
    expect(v.shape).toBe('pentagon');
    expect(v.background).toBe('split-v');
    expect(v.text).toHaveLength(20);
  });

  it('validacija dresa pada na default za nepoznat dizajn', () => {
    const v = validateKit({ design: 'plaid', sponsor: 'a'.repeat(40) });
    expect(v.design).toBe(defaultKit().design);
    expect(v.sponsor).toHaveLength(16);
  });
});

describe('helperi', () => {
  it('initials uzima do 3 slova', () => {
    expect(initials('FC Madrid')).toBe('FM');
    expect(initials('Real Sportski Klub Beograd')).toBe('RSK');
    expect(initials('')).toBe('');
  });

  it('shieldPath vraća path poznatog oblika, fallback na prvi', () => {
    expect(shieldPath('flat')).toBe(SHIELD_SHAPES.find((s) => s.id === 'flat').path);
    expect(shieldPath('nepostojeci')).toBe(SHIELD_SHAPES[0].path);
  });
});
