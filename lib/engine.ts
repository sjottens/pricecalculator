import type { Answers, AreaValue, CustomLine, Field, Helpers, Line, Missing, Option, Rates, Result, RoomValue, Trade, VatRow } from './types';

const OPENING_M2 = 1.8; // gemiddeld oppervlak per raam/deur dat van de muur afgaat

export const num = (v: unknown): number => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isFinite(n) && n > 0 ? n : 0;
};
const round1 = (x: number) => Math.round(x * 10) / 10;
export const fmt = (x: number, digits = 1) => Number(x).toLocaleString('nl-NL', { maximumFractionDigits: digits });
export const eur = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
export const eur2 = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
export const hrs = (h: number) => `${fmt(h, 1)} uur`;

/** Leesbare tijd: onder het uur in minuten ("14 min"), anders in uren ("2,6 u"). */
export const fmtTime = (h: number | undefined, long = false) => {
  if (!h || h <= 0) return '';
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  return long ? `${fmt(h, 1)} uur` : `${fmt(h, 1)} u`;
};

export function room(v: RoomValue | undefined) {
  if (!v) return { walls: 0, ceiling: 0, count: 0 };
  if (v.mode === 'm2') return { walls: num(v.walls), ceiling: num(v.ceiling), count: 1 };
  if (v.mode === 'walls') {
    let w = 0, c = 0;
    (v.muren || []).forEach((m) => { w += Math.max(0, num(m.l) * num(m.h) - num(m.openings) * OPENING_M2); });
    (v.plafonds || []).forEach((p) => { c += num(p.l) * num(p.b); });
    return { walls: round1(w), ceiling: round1(c), count: 1 };
  }
  let walls = 0, ceiling = 0, count = 0;
  (v.rooms || []).forEach((r) => {
    const l = num(r.l), b = num(r.b), h = num(r.h);
    if (!l || !b) return;
    count++;
    ceiling += l * b;
    walls += Math.max(0, 2 * (l + b) * h - num(r.openings) * OPENING_M2);
  });
  return { walls: round1(walls), ceiling: round1(ceiling), count };
}

export function area(v: AreaValue | undefined) {
  if (!v) return 0;
  return v.mode === 'dims' ? round1(num(v.l) * num(v.b)) : num(v.m2);
}

export const numSigned = (v: unknown): number => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return isFinite(n) ? n : 0;
};

export const allFields = (t: Trade): Field[] => t.steps.flatMap((s) => s.fields);

/** Zichtbaar als de dienst aan staat (of er geen dienst aan hangt) en de showIf-voorwaarde klopt. */
export const isVisible = (x: { showIf?: (a: Answers) => boolean; service?: string }, a: Answers, off?: Set<string>) =>
  (!x.service || !off?.has(x.service)) && (!x.showIf || x.showIf(a));

/** Tarieven die verborgen zijn omdat alle diensten waar ze bij horen uit staan. */
export function hiddenRates(t: Trade, off: Set<string>): Set<string> {
  const hidden = new Set<string>();
  for (const r of t.rates) {
    const owners = (t.services ?? []).filter((s) => s.rates.includes(r.id));
    if (owners.length && owners.every((s) => off.has(s.id))) hidden.add(r.id);
  }
  return hidden;
}

/**
 * Antwoorden opschonen: keuzes van diensten die uit staan eruit halen.
 * Bij een enkele keuze die niet meer kan, wordt de eerste beschikbare optie gekozen.
 */
export function sanitize(t: Trade, a: Answers, off: Set<string>): Answers {
  if (!off.size) return a;
  const out: Answers = { ...a };
  for (const f of allFields(t)) {
    if (!f.options) continue;
    const ok = f.options.filter((o) => !o.service || !off.has(o.service)).map((o) => o.value);
    if (f.type === 'multi') out[f.id] = ((a[f.id] as string[]) || []).filter((v) => ok.includes(v));
    else if (f.type === 'choice' && !ok.includes(a[f.id]) && ok.length) out[f.id] = ok[0];
  }
  return out;
}

/** Welke zichtbare (niet-optionele) velden zijn nog leeg? Gebruikt om te laten zien waarom de offerte leeg is. */
export function missingInputs(t: Trade, a: Answers, off: Set<string>): Missing[] {
  const out: Missing[] = [];
  for (const f of allFields(t)) {
    if (f.optional || !isVisible(f, a, off)) continue;
    const v = a[f.id];
    if (f.type === 'multi' && !(v || []).length) out.push({ id: f.id, label: `${f.label} – kies minstens één` });
    if (f.type === 'number' && !num(v)) out.push({ id: f.id, label: f.label });
    if (f.type === 'area' && !area(v)) out.push({ id: f.id, label: v?.mode === 'm2' ? `${f.label} (m²)` : `${f.label}: lengte en breedte` });
    if (f.type === 'room') {
      const r = room(v);
      const needW = !f.wallsIf || f.wallsIf(a);
      const needC = !f.ceilingIf || f.ceilingIf(a);
      if (v?.mode === 'walls') {
        if (needW && !r.walls) out.push({ id: f.id, label: 'Lengte en hoogte van de muur' });
        if (needC && !r.ceiling) out.push({ id: f.id, label: 'Lengte en breedte van het plafond' });
      } else if (v?.mode === 'm2') {
        if (needW && !r.walls) out.push({ id: f.id, label: 'm² muren' });
        if (needC && !r.ceiling) out.push({ id: f.id, label: 'm² plafonds' });
      } else if (!r.walls && !r.ceiling) {
        out.push({ id: f.id, label: 'Lengte, breedte en hoogte van de ruimte' });
      }
    }
  }
  return out;
}

export function customToLine(c: CustomLine, defaultLabor: number): Line {
  const total = numSigned(c.aantal) * numSigned(c.prijs);
  const isWork = c.soort === 'arbeid';
  return {
    custom: true,
    label: c.omschrijving.trim() || (isWork ? 'Extra werkzaamheden' : 'Extra materiaal'),
    detail: `${fmt(numSigned(c.aantal), 2)} ${c.eenheid} × ${eur2(numSigned(c.prijs))}`,
    hours: isWork && c.eenheid === 'uur' ? numSigned(c.aantal) : undefined,
    labor: isWork ? total : 0,
    material: isWork ? 0 : total,
    vatLabor: isWork ? defaultLabor : undefined,
  };
}

export function defaults(t: Trade): Answers {
  const a: Answers = {};
  allFields(t).forEach((f) => {
    if (f.default !== undefined) a[f.id] = structuredClone(f.default);
  });
  return a;
}

export const defaultRates = (t: Trade): Rates => Object.fromEntries(t.rates.map((r) => [r.id, r.default]));

/**
 * Combineer standaardtarieven met wat de ondernemer heeft ingevuld (strings uit invoervelden).
 * Een leeg gemaakt veld telt als 0; tarieven van diensten die uit staan worden ook 0.
 */
export function resolveRates(t: Trade, stored: Record<string, unknown> | undefined, off: Set<string> = new Set()): Rates {
  const R = defaultRates(t);
  if (stored) for (const r of t.rates) if (stored[r.id] !== undefined) R[r.id] = num(stored[r.id]);
  for (const id of hiddenRates(t, off)) R[id] = 0;
  return R;
}

export function compute(t: Trade, a: Answers, R: Rates, extra: CustomLine[] = []): Result {
  const helpers: Helpers = {
    num, room, area, fmt,
    opt: (id) => (allFields(t).find((f) => f.id === id)?.options?.find((o) => o.value === a[id]) ?? {}) as Option,
    has: (id, v) => (a[id] || []).includes(v),
  };

  const vat = t.vat(a);
  const lines = (t.calc(a, helpers, R) || []).filter((l) => l.labor + l.material > 0.005);
  for (const c of extra) {
    const l = customToLine(c, vat.labor);
    if (Math.abs(l.labor + l.material) > 0.005) lines.push(l);
  }
  const empty = lines.length === 0;

  if (!empty) {
    const callout = t.callout ? t.callout(a, R) : R.voorrijkosten || 0;
    if (callout) lines.push({ label: 'Voorrijkosten', labor: callout, material: 0 });
    const sub = lines.reduce((s, l) => s + l.labor + l.material, 0);
    const min = t.minimum ? t.minimum(a, R) : R.minimum || 0;
    if (sub < min) lines.push({ label: 'Aanvulling minimum orderbedrag', labor: min - sub, material: 0 });
  }

  const buckets = new Map<number, number>();
  const addVat = (rate: number, base: number) => buckets.set(rate, (buckets.get(rate) ?? 0) + base);

  let hours = 0, labor = 0, material = 0, vatAmt = 0;
  const quoteLines = lines.map((l) => {
    const lr = l.vatLabor ?? vat.labor;
    const v = l.labor * lr + l.material * vat.material;
    if (l.labor) addVat(lr, l.labor);
    if (l.material) addVat(vat.material, l.material);
    hours += l.hours ?? 0;
    labor += l.labor;
    material += l.material;
    vatAmt += v;
    return { ...l, ex: l.labor + l.material, vat: v };
  });

  const vatRows: VatRow[] = [...buckets.entries()].sort((x, y) => x[0] - y[0]).map(([rate, base]) => ({ rate, base, vat: base * rate }));
  const ex = labor + material;

  return {
    empty, lines: quoteLines, hours, labor, material, ex,
    vat: vatAmt, vatRows, inc: ex + vatAmt,
    unit: t.priceUnit ? t.priceUnit(a) : '',
    helpers,
  };
}
