/*
 * VAKGEBIEDEN – vragen, tarieven en rekenregels.
 *
 * Elk vak heeft "rates": tarieven die de ondernemer zelf invult (uurtarief, minuten per m², materiaal...).
 * De standaardwaarden hieronder zijn alleen een startpunt.
 * Arbeid = uren × uurtarief. Alle bedragen zijn EXCL. btw.
 */
import type { Answers, Line, Rates, RoomValue, Trade } from './types';
import { eur2, fmt } from './engine';

const defaultRoom = (): RoomValue => ({
  mode: 'walls',
  muren: [{ l: '', h: '2.6', openings: '' }],
  plafonds: [{ l: '', b: '' }],
  rooms: [{ l: '', b: '', h: '2.6', openings: '2' }],
  walls: '',
  ceiling: '',
});
const wallsIf = (a: Answers) => has(a, 'onderdelen', 'muren');
const ceilingIf = (a: Answers) => has(a, 'onderdelen', 'plafond');
const has = (a: Answers, id: string, v: string) => ((a[id] as string[]) || []).includes(v);
const lagenTxt = (n: number) => `${n} ${n === 1 ? 'laag' : 'lagen'}`;
const ruimteTxt = (n: number) => `${n} ${n === 1 ? 'ruimte' : 'ruimtes'}`;

/** Maak een arbeidsregel: uren × uurtarief. */
const work = (R: Rates, hours: number) => ({ hours, labor: hours * R.uurtarief });

/**
 * Maak een materiaalregel: hoeveelheid × prijs, met een leesbare specificatie voor de klant
 * (bijv. "Muurverf: 12,4 liter × € 16,00"). Bedrag en tekst komen zo altijd overeen.
 */
const mat = (naam: string, qty: number, unit: string, price: number) => {
  const material = qty * price;
  return { material, matDetail: material > 0.005 ? `${naam}: ${fmt(qty, 2)} ${unit} × ${eur2(price)}` : undefined };
};

const woningOud = (help: string, showIf?: (a: Answers) => boolean) => ({
  id: 'woningOud', type: 'toggle' as const, label: 'Is de woning ouder dan 2 jaar?', default: true, help, showIf,
});

/* ============================== SCHILDER ============================== */
const schilder: Trade = {
  id: 'schilder',
  name: 'Schilderwerk',
  icon: '🎨',
  svgIcon: 'paintcan',
  tagline: 'Muren, plafonds, kozijnen en gevels',
  basis: 'uurtarief · min/m² · verfprijs',
  vat: (a) => ({ labor: a.woningOud ? 0.09 : 0.21, material: 0.21 }),
  rates: [
    { id: 'uurtarief', label: 'Uurtarief', unit: '€/uur', default: 55, group: 'Arbeid' },
    { id: 'min_muur', label: 'Muren', unit: 'min/m² per laag', default: 6, group: 'Arbeid', step: 0.5, perHour: 'm²' },
    { id: 'min_plafond', label: 'Plafonds', unit: 'min/m² per laag', default: 7.5, group: 'Arbeid', step: 0.5, perHour: 'm²' },
    { id: 'min_gevel', label: 'Gevel', unit: 'min/m² per laag', default: 9, group: 'Arbeid', step: 0.5, perHour: 'm²' },
    { id: 'min_kozijn', label: 'Kozijn / raam', unit: 'min/stuk', default: 90, group: 'Arbeid', step: 5, help: 'bij 2 lagen' },
    { id: 'min_deur', label: 'Deur', unit: 'min/stuk', default: 75, group: 'Arbeid', step: 5, help: 'bij 2 lagen' },
    { id: 'uur_afdekken', label: 'Afdekken & meubels', unit: 'uur/ruimte', default: 0.75, group: 'Arbeid', step: 0.25 },
    { id: 'uur_opstart', label: 'Voorbereiding & opruimen', unit: 'uur/klus', default: 1, group: 'Arbeid', step: 0.5 },
    { id: 'verf_prijs', label: 'Muurverf', unit: '€/liter', default: 16, group: 'Materiaal', step: 0.5 },
    { id: 'verf_dekking', label: 'Dekking muurverf', unit: 'm²/liter', default: 9, group: 'Materiaal', step: 0.5 },
    { id: 'gevelverf_prijs', label: 'Gevelverf', unit: '€/liter', default: 28, group: 'Materiaal', step: 0.5 },
    { id: 'gevelverf_dekking', label: 'Dekking gevelverf', unit: 'm²/liter', default: 8, group: 'Materiaal', step: 0.5 },
    { id: 'mat_kozijn', label: 'Lak & materiaal kozijn', unit: '€/stuk', default: 12, group: 'Materiaal' },
    { id: 'mat_deur', label: 'Lak & materiaal deur', unit: '€/stuk', default: 10, group: 'Materiaal' },
    { id: 'mat_afdekken', label: 'Afdekmateriaal', unit: '€/ruimte', default: 15, group: 'Materiaal' },
    { id: 'steiger_rol', label: 'Rolsteiger', unit: '€', default: 350, group: 'Overig', step: 25 },
    { id: 'steiger_groot', label: 'Steiger / hoogwerker', unit: '€', default: 750, group: 'Overig', step: 25 },
    { id: 'voorrijkosten', label: 'Voorrijkosten', unit: '€', default: 45, group: 'Overig' },
    { id: 'minimum', label: 'Minimum orderbedrag', unit: '€', default: 295, group: 'Overig', step: 5 },
  ],
  services: [
    { id: 'muren', label: 'Muren', rates: ['min_muur', 'verf_prijs', 'verf_dekking'] },
    { id: 'plafond', label: 'Plafonds', rates: ['min_plafond', 'verf_prijs', 'verf_dekking'] },
    { id: 'gevel', label: 'Gevels', rates: ['min_gevel', 'gevelverf_prijs', 'gevelverf_dekking'] },
    { id: 'kozijnen', label: 'Kozijnen / ramen', rates: ['min_kozijn', 'mat_kozijn'] },
    { id: 'deuren', label: 'Deuren', rates: ['min_deur', 'mat_deur'] },
    { id: 'afdekken', label: 'Afdekken & meubels', rates: ['uur_afdekken', 'mat_afdekken'] },
    { id: 'steiger', label: 'Steigerwerk', rates: ['steiger_rol', 'steiger_groot'] },
  ],
  steps: [
    {
      title: 'De klus',
      fields: [
        {
          id: 'locatie', type: 'choice', label: 'Binnen of buiten?', default: 'binnen',
          options: [
            { value: 'binnen', label: 'Binnen', icon: '🏠' },
            { value: 'buiten', label: 'Buiten', icon: '🌴' },
          ],
        },
        {
          id: 'onderdelen', type: 'multi', label: 'Wat moet er geschilderd worden?', help: 'Meerdere keuzes mogelijk', default: ['muren', 'plafond'],
          options: [
            { value: 'muren', label: 'Muren', icon: '🧱', service: 'muren', showIf: (a) => a.locatie === 'binnen' },
            { value: 'plafond', label: 'Plafonds', icon: '⬜', service: 'plafond', showIf: (a) => a.locatie === 'binnen' },
            { value: 'gevel', label: 'Gevel', icon: '🏢', service: 'gevel', showIf: (a) => a.locatie === 'buiten' },
            { value: 'kozijnen', label: 'Kozijnen / ramen', icon: '🪟', service: 'kozijnen' },
            { value: 'deuren', label: 'Deuren', icon: '🚪', service: 'deuren' },
          ],
        },
      ],
    },
    {
      title: 'Afmetingen',
      fields: [
        {
          id: 'ruimte', type: 'room', label: 'Afmetingen', default: defaultRoom(), wallsIf, ceilingIf,
          showIf: (a) => a.locatie === 'binnen' && (has(a, 'onderdelen', 'muren') || has(a, 'onderdelen', 'plafond')),
        },
        {
          id: 'gevel', type: 'number', label: 'Oppervlak gevel', unit: 'm²', default: '', step: 5,
          help: 'Breedte × hoogte van de gevel.',
          showIf: (a) => a.locatie === 'buiten' && has(a, 'onderdelen', 'gevel'),
        },
        { id: 'kozijnen', type: 'number', label: 'Aantal kozijnen / ramen', unit: 'stuks', default: 1, showIf: (a) => has(a, 'onderdelen', 'kozijnen') },
        { id: 'deuren', type: 'number', label: 'Aantal deuren', unit: 'stuks', default: 1, showIf: (a) => has(a, 'onderdelen', 'deuren') },
      ],
    },
    {
      title: 'Details',
      fields: [
        {
          id: 'lagen', type: 'choice', label: 'Aantal lagen', default: '2',
          options: [
            { value: '1', label: '1 laag', hint: 'zelfde kleur opfrissen' },
            { value: '2', label: '2 lagen', hint: 'andere kleur' },
            { value: '3', label: '3 lagen', hint: 'donker → licht' },
          ],
        },
        {
          id: 'staat', type: 'choice', label: 'Staat van de ondergrond', default: 'goed',
          options: [
            { value: 'goed', label: 'Goed', hint: '+0% tijd', factor: 1 },
            { value: 'matig', label: 'Matig', hint: '+20% tijd', factor: 1.2 },
            { value: 'slecht', label: 'Slecht', hint: '+45% tijd', factor: 1.45 },
          ],
        },
        {
          id: 'hoogte', type: 'choice', label: 'Plafondhoogte', default: 'normaal', showIf: (a) => a.locatie === 'binnen',
          options: [
            { value: 'normaal', label: 'Tot 3 meter', hint: '+0% tijd', factor: 1 },
            { value: 'hoog', label: '3 – 5 meter', hint: '+20% tijd', factor: 1.2 },
            { value: 'vide', label: 'Vide / trappenhuis', hint: '+40% tijd', factor: 1.4 },
          ],
        },
        {
          id: 'bereik', type: 'choice', label: 'Steigerwerk', default: 'laag', service: 'steiger', showIf: (a) => a.locatie === 'buiten',
          options: [
            { value: 'laag', label: 'Niet nodig', hint: 'ladder volstaat' },
            { value: 'midden', label: 'Rolsteiger', hint: '1e verdieping', rate: 'steiger_rol' },
            { value: 'hoog', label: 'Steiger / hoogwerker', hint: '2e verdieping +', rate: 'steiger_groot' },
          ],
        },
        { id: 'leeg', type: 'toggle', label: 'Is de ruimte leeg?', default: false, service: 'afdekken', help: 'Nee = afdekken en meubels verschuiven wordt gerekend.', showIf: (a) => a.locatie === 'binnen' },
        woningOud('Ja = 9% btw over arbeid (verlaagd tarief renovatie woningen).'),
      ],
    },
  ],
  calc(a, h, R) {
    const L: Line[] = [];
    const lagen = Number(a.lagen) || 2;
    const staat = h.opt('staat').factor || 1;
    const houtLagen = 0.5 + lagen / 4; // 1 laag = 75%, 2 = 100%, 3 = 125%
    // verbruik in liters = m² (× lagen) ÷ dekking; tonen als liters × literprijs
    const verf = (naam: string, m2: number, prijs: number, dekking: number) => mat(naam, dekking ? m2 / dekking : 0, 'liter', prijs);

    if (a.locatie === 'binnen') {
      const r = h.room(a.ruimte);
      const f = staat * (h.opt('hoogte').factor || 1);
      let surfaces = 0;
      if (h.has('onderdelen', 'muren') && r.walls) {
        surfaces++;
        L.push({ label: 'Muren schilderen', detail: `${h.fmt(r.walls)} m² × ${lagenTxt(lagen)}`,
          ...work(R, (r.walls * lagen * R.min_muur * f) / 60), ...verf('Muurverf', r.walls * lagen, R.verf_prijs, R.verf_dekking) });
      }
      if (h.has('onderdelen', 'plafond') && r.ceiling) {
        surfaces++;
        L.push({ label: 'Plafonds schilderen', detail: `${h.fmt(r.ceiling)} m² × ${lagenTxt(lagen)}`,
          ...work(R, (r.ceiling * lagen * R.min_plafond * f) / 60), ...verf('Muurverf', r.ceiling * lagen, R.verf_prijs, R.verf_dekking) });
      }
      if (surfaces && !a.leeg) {
        const n = Math.max(1, r.count);
        L.push({ label: 'Afdekken & meubels verschuiven', detail: ruimteTxt(n), ...work(R, n * R.uur_afdekken), ...mat('Afdekmateriaal', n, n === 1 ? 'ruimte' : 'ruimtes', R.mat_afdekken) });
      }
    } else {
      const g = h.num(a.gevel);
      if (h.has('onderdelen', 'gevel') && g) {
        L.push({ label: 'Gevel schilderen', detail: `${h.fmt(g)} m² × ${lagenTxt(lagen)}`,
          ...work(R, (g * lagen * R.min_gevel * staat) / 60), ...verf('Gevelverf', g * lagen, R.gevelverf_prijs, R.gevelverf_dekking) });
      }
    }

    const nk = h.num(a.kozijnen);
    if (h.has('onderdelen', 'kozijnen') && nk) {
      L.push({ label: 'Kozijnen / ramen lakken', detail: `${nk} stuks · ${lagenTxt(lagen)}`,
        ...work(R, (nk * R.min_kozijn * staat * houtLagen) / 60), ...mat('Lak & materiaal', nk, 'st', R.mat_kozijn * houtLagen) });
    }
    const nd = h.num(a.deuren);
    if (h.has('onderdelen', 'deuren') && nd) {
      L.push({ label: 'Deuren lakken', detail: `${nd} stuks · ${lagenTxt(lagen)}`,
        ...work(R, (nd * R.min_deur * staat * houtLagen) / 60), ...mat('Lak & materiaal', nd, 'st', R.mat_deur * houtLagen) });
    }
    if (L.length && R.uur_opstart) L.push({ label: 'Voorbereiding & opruimen', ...work(R, R.uur_opstart), material: 0 });
    if (a.locatie === 'buiten' && L.length) {
      const s = h.opt('bereik');
      if (s.rate && R[s.rate]) L.push({ label: s.label, detail: 'huur, op- en afbouw', labor: 0, material: R[s.rate] });
    }
    return L;
  },
};

/* ============================== STUKADOOR ============================== */
const stukadoor: Trade = {
  id: 'stukadoor',
  name: 'Stucwerk',
  icon: '🧱',
  tagline: 'Strakke wanden, plafonds en sierpleister',
  basis: 'uurtarief · min/m² · materiaal/m²',
  vat: (a) => ({ labor: a.woningOud ? 0.09 : 0.21, material: 0.21 }),
  rates: [
    { id: 'uurtarief', label: 'Uurtarief', unit: '€/uur', default: 50, group: 'Arbeid' },
    { id: 'min_behangklaar', label: 'Behangklaar', unit: 'min/m²', default: 15, group: 'Arbeid', perHour: 'm²' },
    { id: 'min_sausklaar', label: 'Sausklaar', unit: 'min/m²', default: 19, group: 'Arbeid', perHour: 'm²' },
    { id: 'min_spachtelputz', label: 'Spachtelputz', unit: 'min/m²', default: 24, group: 'Arbeid', perHour: 'm²' },
    { id: 'min_sier', label: 'Sierpleister', unit: 'min/m²', default: 66, group: 'Arbeid', perHour: 'm²' },
    { id: 'plafond_toeslag', label: 'Extra tijd plafonds', unit: '%', default: 25, group: 'Arbeid', step: 5 },
    { id: 'min_behang_weg', label: 'Behang verwijderen', unit: 'min/m²', default: 6, group: 'Arbeid', perHour: 'm²' },
    { id: 'min_stuc_weg', label: 'Oud stucwerk verwijderen', unit: 'min/m²', default: 12, group: 'Arbeid', perHour: 'm²' },
    { id: 'uur_afdekken', label: 'Afdekken & opruimen', unit: 'uur/ruimte', default: 0.75, group: 'Arbeid', step: 0.25 },
    { id: 'mat_behangklaar', label: 'Materiaal behangklaar', unit: '€/m²', default: 3, group: 'Materiaal', step: 0.5 },
    { id: 'mat_sausklaar', label: 'Materiaal sausklaar', unit: '€/m²', default: 3.5, group: 'Materiaal', step: 0.5 },
    { id: 'mat_spachtelputz', label: 'Materiaal spachtelputz', unit: '€/m²', default: 5, group: 'Materiaal', step: 0.5 },
    { id: 'mat_sier', label: 'Materiaal sierpleister', unit: '€/m²', default: 15, group: 'Materiaal', step: 0.5 },
    { id: 'afvoer', label: 'Afvoer oud stucwerk', unit: '€/m²', default: 2, group: 'Materiaal', step: 0.5 },
    { id: 'mat_afdekken', label: 'Afdekmateriaal', unit: '€/ruimte', default: 15, group: 'Materiaal' },
    { id: 'voorrijkosten', label: 'Voorrijkosten', unit: '€', default: 50, group: 'Overig' },
    { id: 'minimum', label: 'Minimum orderbedrag', unit: '€', default: 395, group: 'Overig', step: 5 },
  ],
  services: [
    { id: 'behangklaar', label: 'Behangklaar', rates: ['min_behangklaar', 'mat_behangklaar'] },
    { id: 'sausklaar', label: 'Sausklaar', rates: ['min_sausklaar', 'mat_sausklaar'] },
    { id: 'spachtelputz', label: 'Spachtelputz', rates: ['min_spachtelputz', 'mat_spachtelputz'] },
    { id: 'sier', label: 'Sierpleister', rates: ['min_sier', 'mat_sier'] },
    { id: 'plafond', label: 'Plafonds', rates: ['plafond_toeslag'] },
    { id: 'behang_weg', label: 'Behang verwijderen', rates: ['min_behang_weg'] },
    { id: 'stuc_weg', label: 'Oud stucwerk verwijderen', rates: ['min_stuc_weg', 'afvoer'] },
    { id: 'afdekken', label: 'Afdekken & opruimen', rates: ['uur_afdekken', 'mat_afdekken'] },
  ],
  steps: [
    {
      title: 'De klus',
      fields: [
        {
          id: 'onderdelen', type: 'multi', label: 'Wat moet er gestuct worden?', default: ['muren'],
          options: [
            { value: 'muren', label: 'Muren', icon: '🧱' },
            { value: 'plafond', label: 'Plafonds', icon: '⬜', service: 'plafond' },
          ],
        },
        {
          id: 'afwerking', type: 'choice', label: 'Afwerking', default: 'sausklaar',
          options: [
            { value: 'behangklaar', label: 'Behangklaar', hint: 'Klaar om te behangen', service: 'behangklaar' },
            { value: 'sausklaar', label: 'Sausklaar', hint: 'Glad, klaar voor verf', service: 'sausklaar' },
            { value: 'spachtelputz', label: 'Spachtelputz', hint: 'Grove structuur', service: 'spachtelputz' },
            { value: 'sier', label: 'Sierpleister', hint: 'Betonlook, decoratief', service: 'sier' },
          ],
        },
      ],
    },
    { title: 'Afmetingen', fields: [{ id: 'ruimte', type: 'room', label: 'Afmetingen', default: defaultRoom(), wallsIf, ceilingIf }] },
    {
      title: 'Details',
      fields: [
        {
          id: 'verwijderen', type: 'choice', label: 'Eerst iets verwijderen?', default: 'nee',
          options: [
            { value: 'nee', label: 'Nee' },
            { value: 'behang', label: 'Behang verwijderen', service: 'behang_weg' },
            { value: 'stuc', label: 'Oud stucwerk', hint: 'incl. afvoer', service: 'stuc_weg' },
          ],
        },
        {
          id: 'staat', type: 'choice', label: 'Staat van de ondergrond', default: 'goed',
          options: [
            { value: 'goed', label: 'Goed', hint: '+0% tijd', factor: 1 },
            { value: 'matig', label: 'Matig', hint: '+15% tijd', factor: 1.15 },
            { value: 'slecht', label: 'Slecht', hint: '+35% tijd', factor: 1.35 },
          ],
        },
        {
          id: 'hoogte', type: 'choice', label: 'Plafondhoogte', default: 'normaal',
          options: [
            { value: 'normaal', label: 'Tot 3 meter', hint: '+0% tijd', factor: 1 },
            { value: 'hoog', label: '3 – 5 meter', hint: '+20% tijd', factor: 1.2 },
            { value: 'vide', label: 'Vide / trappenhuis', hint: '+40% tijd', factor: 1.4 },
          ],
        },
        woningOud('Ja = 9% btw over arbeid (verlaagd tarief renovatie woningen).'),
      ],
    },
  ],
  calc(a, h, R) {
    const L: Line[] = [];
    const r = h.room(a.ruimte);
    const af = String(a.afwerking);
    const afLabel = h.opt('afwerking').label;
    const minM2 = R[`min_${af}`] ?? 0;
    const matM2 = R[`mat_${af}`] ?? 0;
    const f = (h.opt('staat').factor || 1) * (h.opt('hoogte').factor || 1);
    let m2 = 0;
    if (h.has('onderdelen', 'muren') && r.walls) {
      m2 += r.walls;
      L.push({ label: `Muren ${afLabel.toLowerCase()} stucen`, detail: `${h.fmt(r.walls)} m²`, ...work(R, (r.walls * minM2 * f) / 60), ...mat(`Materiaal ${afLabel.toLowerCase()}`, r.walls, 'm²', matM2) });
    }
    if (h.has('onderdelen', 'plafond') && r.ceiling) {
      m2 += r.ceiling;
      L.push({ label: `Plafonds ${afLabel.toLowerCase()} stucen`, detail: `${h.fmt(r.ceiling)} m²`,
        ...work(R, (r.ceiling * minM2 * f * (1 + R.plafond_toeslag / 100)) / 60), ...mat(`Materiaal ${afLabel.toLowerCase()}`, r.ceiling, 'm²', matM2) });
    }
    if (m2 && a.verwijderen === 'behang') L.push({ label: 'Behang verwijderen', detail: `${h.fmt(m2)} m²`, ...work(R, (m2 * R.min_behang_weg) / 60), material: 0 });
    if (m2 && a.verwijderen === 'stuc') L.push({ label: 'Oud stucwerk verwijderen & afvoeren', detail: `${h.fmt(m2)} m²`, ...work(R, (m2 * R.min_stuc_weg) / 60), ...mat('Afvoer', m2, 'm²', R.afvoer) });
    if (m2) {
      const n = Math.max(1, r.count);
      L.push({ label: 'Afdekken & opruimen', detail: ruimteTxt(n), ...work(R, n * R.uur_afdekken), ...mat('Afdekmateriaal', n, n === 1 ? 'ruimte' : 'ruimtes', R.mat_afdekken) });
    }
    return L;
  },
};

/* ============================== DAKDEKKER ============================== */
const isPlat = (a: Answers) => a.type === 'bitumen' || a.type === 'epdm';

const dakdekker: Trade = {
  id: 'dakdekker',
  name: 'Dakwerk',
  icon: '🏚️',
  tagline: 'Plat dak, pannendak, lekkages en goten',
  basis: 'uurtarief · min/m² · materiaal/m²',
  callout: (a, R) => (a.type === 'reparatie' ? R.voorrijkosten : 0),
  minimum: (a, R) => (a.type === 'reparatie' ? R.minimum_reparatie : R.minimum),
  vat: () => ({ labor: 0.21, material: 0.21 }),
  rates: [
    { id: 'uurtarief', label: 'Uurtarief', unit: '€/uur', default: 60, group: 'Arbeid' },
    { id: 'min_bitumen', label: 'Bitumen leggen', unit: 'min/m²', default: 28, group: 'Arbeid', perHour: 'm²' },
    { id: 'min_epdm', label: 'EPDM leggen', unit: 'min/m²', default: 30, group: 'Arbeid', perHour: 'm²' },
    { id: 'min_pannen', label: 'Pannendak vernieuwen', unit: 'min/m²', default: 45, group: 'Arbeid', perHour: 'm²' },
    { id: 'min_verwijderen', label: 'Oude dakbedekking slopen', unit: 'min/m²', default: 8, group: 'Arbeid', perHour: 'm²' },
    { id: 'min_isolatie', label: 'Isolatie aanbrengen', unit: 'min/m²', default: 12, group: 'Arbeid', perHour: 'm²' },
    { id: 'min_goot', label: 'Dakgoot vervangen', unit: 'min/meter', default: 45, group: 'Arbeid', step: 5 },
    { id: 'uur_reparatie', label: 'Reparatie', unit: 'uur/plek', default: 2.5, group: 'Arbeid', step: 0.5 },
    { id: 'mat_bitumen', label: 'Bitumen', unit: '€/m²', default: 27, group: 'Materiaal' },
    { id: 'mat_epdm', label: 'EPDM', unit: '€/m²', default: 32, group: 'Materiaal' },
    { id: 'mat_pannen', label: 'Pannen + panlatten', unit: '€/m²', default: 40, group: 'Materiaal' },
    { id: 'mat_pir100', label: 'Isolatie PIR 100 mm', unit: '€/m²', default: 26, group: 'Materiaal' },
    { id: 'mat_pir140', label: 'Isolatie PIR 140 mm', unit: '€/m²', default: 34, group: 'Materiaal' },
    { id: 'afvoer', label: 'Afvoer / container', unit: '€/m²', default: 6, group: 'Materiaal', step: 0.5 },
    { id: 'mat_goot', label: 'Zinken dakgoot', unit: '€/meter', default: 40, group: 'Materiaal' },
    { id: 'mat_reparatie', label: 'Materiaal reparatie', unit: '€/plek', default: 35, group: 'Materiaal' },
    { id: 'steiger_midden', label: 'Steiger woonhuis', unit: '€', default: 450, group: 'Overig', step: 25 },
    { id: 'steiger_hoog', label: 'Steiger / lift hoogbouw', unit: '€', default: 950, group: 'Overig', step: 25 },
    { id: 'voorrijkosten', label: 'Voorrijkosten reparatie', unit: '€', default: 45, group: 'Overig' },
    { id: 'minimum', label: 'Minimum orderbedrag', unit: '€', default: 750, group: 'Overig', step: 5 },
    { id: 'minimum_reparatie', label: 'Minimum reparatie', unit: '€', default: 195, group: 'Overig', step: 5 },
  ],
  services: [
    { id: 'bitumen', label: 'Bitumen', rates: ['min_bitumen', 'mat_bitumen'] },
    { id: 'epdm', label: 'EPDM', rates: ['min_epdm', 'mat_epdm'] },
    { id: 'pannen', label: 'Pannendaken', rates: ['min_pannen', 'mat_pannen'] },
    { id: 'reparatie', label: 'Reparaties', rates: ['uur_reparatie', 'mat_reparatie', 'voorrijkosten', 'minimum_reparatie'] },
    { id: 'slopen', label: 'Slopen & afvoeren', rates: ['min_verwijderen', 'afvoer'] },
    { id: 'isolatie', label: 'Isolatie', rates: ['min_isolatie', 'mat_pir100', 'mat_pir140'] },
    { id: 'goten', label: 'Dakgoten', rates: ['min_goot', 'mat_goot'] },
    { id: 'steiger', label: 'Steigerwerk', rates: ['steiger_midden', 'steiger_hoog'] },
  ],
  steps: [
    {
      title: 'De klus',
      fields: [
        {
          id: 'type', type: 'choice', label: 'Wat voor dakwerk?', default: 'bitumen',
          options: [
            { value: 'bitumen', label: 'Plat dak – bitumen', icon: '⬛', service: 'bitumen' },
            { value: 'epdm', label: 'Plat dak – EPDM', icon: '◼️', service: 'epdm' },
            { value: 'pannen', label: 'Pannendak', icon: '🏠', service: 'pannen' },
            { value: 'reparatie', label: 'Lekkage / reparatie', icon: '💧', service: 'reparatie' },
          ],
        },
      ],
    },
    {
      title: 'Afmetingen',
      fields: [
        { id: 'oppervlak', type: 'area', label: 'Oppervlak dak', default: { mode: 'dims', m2: '', l: '', b: '' }, showIf: (a) => a.type !== 'reparatie' },
        { id: 'plekken', type: 'number', label: 'Aantal lekkages / plekken', unit: 'plekken', default: 1, showIf: (a) => a.type === 'reparatie' },
        { id: 'goten', type: 'number', label: 'Dakgoten vervangen', unit: 'meter', default: 0, service: 'goten', optional: true, help: 'Optioneel. 0 = niet nodig.' },
      ],
    },
    {
      title: 'Details',
      fields: [
        {
          id: 'helling', type: 'choice', label: 'Dakhelling', default: 'normaal', showIf: (a) => a.type === 'pannen',
          options: [
            { value: 'flauw', label: 'Tot 30°', hint: '+0% tijd', factor: 1 },
            { value: 'normaal', label: '30° – 45°', hint: '+10% tijd', factor: 1.1 },
            { value: 'steil', label: 'Meer dan 45°', hint: '+25% tijd', factor: 1.25 },
          ],
        },
        { id: 'verwijderen', type: 'toggle', label: 'Oude dakbedekking slopen en afvoeren?', default: true, service: 'slopen', showIf: (a) => a.type !== 'reparatie' },
        {
          id: 'isolatie', type: 'choice', label: 'Dakisolatie', default: 'geen', service: 'isolatie', showIf: isPlat,
          options: [
            { value: 'geen', label: 'Geen' },
            { value: 'pir100', label: 'PIR 100 mm', hint: 'Rc ≈ 4,5' },
            { value: 'pir140', label: 'PIR 140 mm', hint: 'Rc ≈ 6,3' },
          ],
        },
        {
          id: 'bereik', type: 'choice', label: 'Steigerwerk', default: 'laag', service: 'steiger',
          options: [
            { value: 'laag', label: 'Niet nodig', hint: 'aanbouw / garage' },
            { value: 'midden', label: 'Steiger woonhuis', hint: '2 bouwlagen', rate: 'steiger_midden' },
            { value: 'hoog', label: 'Steiger / lift', hint: '3 lagen of hoger', rate: 'steiger_hoog' },
          ],
        },
        woningOud('Ja = 9% btw over arbeid voor isolatie.', (a) => isPlat(a) && a.isolatie && a.isolatie !== 'geen'),
      ],
    },
  ],
  calc(a, h, R) {
    const L: Line[] = [];
    if (a.type === 'reparatie') {
      const n = h.num(a.plekken);
      if (n) L.push({ label: 'Inspectie & reparatie lekkage', detail: `${n} ${n === 1 ? 'plek' : 'plekken'}`, ...work(R, n * R.uur_reparatie), ...mat('Materiaal', n, n === 1 ? 'plek' : 'plekken', R.mat_reparatie) });
    } else {
      const m2 = h.area(a.oppervlak);
      if (m2) {
        const helling = a.type === 'pannen' ? h.opt('helling').factor || 1 : 1;
        L.push({ label: h.opt('type').label, detail: `${h.fmt(m2)} m²`, ...work(R, (m2 * (R[`min_${a.type}`] ?? 0) * helling) / 60), ...mat(a.type === 'pannen' ? 'Pannen + panlatten' : 'Dakbedekking', m2, 'm²', R[`mat_${a.type}`] ?? 0) });
        if (a.verwijderen) L.push({ label: 'Oude dakbedekking slopen & afvoeren', detail: `${h.fmt(m2)} m²`, ...work(R, (m2 * R.min_verwijderen) / 60), ...mat('Afvoer', m2, 'm²', R.afvoer) });
        if (isPlat(a) && a.isolatie && a.isolatie !== 'geen') {
          L.push({ label: `Dakisolatie ${h.opt('isolatie').label}`, detail: `${h.fmt(m2)} m²`, ...work(R, (m2 * R.min_isolatie) / 60),
            ...mat(`Isolatie ${h.opt('isolatie').label}`, m2, 'm²', R[`mat_${a.isolatie}`] ?? 0), vatLabor: a.woningOud ? 0.09 : undefined });
        }
      }
    }
    const g = h.num(a.goten);
    if (g) L.push({ label: 'Zinken dakgoot vervangen', detail: `${h.fmt(g)} meter`, ...work(R, (g * R.min_goot) / 60), ...mat('Zink & bevestiging', g, 'meter', R.mat_goot) });
    const s = h.opt('bereik');
    if (L.length && s.rate && R[s.rate]) L.push({ label: s.label, detail: 'huur, op- en afbouw', labor: 0, material: R[s.rate] });
    return L;
  },
};

/* ============================== GLAZENWASSER ============================== */
const glazenwasser: Trade = {
  id: 'glazenwasser',
  name: 'Glazenwassen',
  icon: '🪟',
  tagline: 'Eenmalig of als abonnement',
  basis: 'uurtarief · minuten per raam',
  callout: (a, R) => (a.frequentie === 'eenmalig' ? R.voorrijkosten : 0),
  minimum: (a, R) => (a.frequentie === 'eenmalig' ? R.minimum_eenmalig : R.minimum),
  priceUnit: (a) => (a.frequentie === 'eenmalig' ? '' : 'per beurt'),
  vat: () => ({ labor: 0.21, material: 0.21 }),
  rates: [
    { id: 'uurtarief', label: 'Uurtarief', unit: '€/uur', default: 40, group: 'Arbeid' },
    { id: 'min_klein', label: 'Klein raam', unit: 'min/raam', default: 5, group: 'Arbeid', step: 0.5, perHour: 'ramen' },
    { id: 'min_middel', label: 'Normaal raam', unit: 'min/raam', default: 7.5, group: 'Arbeid', step: 0.5, perHour: 'ramen' },
    { id: 'min_groot', label: 'Groot raam / pui', unit: 'min/raam', default: 12, group: 'Arbeid', step: 0.5, perHour: 'ramen' },
    { id: 'min_dakraam', label: 'Dakraam', unit: 'min/stuk', default: 9, group: 'Arbeid', step: 0.5, perHour: 'dakramen' },
    { id: 'min_serre', label: 'Serre- / verandadak', unit: 'min/m²', default: 3.75, group: 'Arbeid', step: 0.25, perHour: 'm²' },
    { id: 'kozijnen_toeslag', label: 'Extra tijd kozijnen', unit: '%', default: 40, group: 'Arbeid', step: 5 },
    { id: 'binnen_toeslag', label: 'Extra tijd binnenkant', unit: '%', default: 80, group: 'Arbeid', step: 5 },
    { id: 'voorrijkosten', label: 'Voorrijkosten eenmalig', unit: '€', default: 25, group: 'Overig' },
    { id: 'minimum', label: 'Minimum per beurt', unit: '€', default: 35, group: 'Overig' },
    { id: 'minimum_eenmalig', label: 'Minimum eenmalig', unit: '€', default: 75, group: 'Overig' },
  ],
  services: [
    { id: 'klein', label: 'Kleine ramen', rates: ['min_klein'] },
    { id: 'middel', label: 'Normale ramen', rates: ['min_middel'] },
    { id: 'groot', label: 'Grote ramen / puien', rates: ['min_groot'] },
    { id: 'dakramen', label: 'Dakramen', rates: ['min_dakraam'] },
    { id: 'serre', label: 'Serredaken', rates: ['min_serre'] },
    { id: 'binnen', label: 'Binnenkant', rates: ['binnen_toeslag'] },
    { id: 'kozijnen', label: 'Kozijnen', rates: ['kozijnen_toeslag'] },
  ],
  note(a, total, eur, h) {
    const f = h.opt('frequentie');
    if (!f.perYear) return null;
    return `Op jaarbasis ongeveer ${eur(total * f.perYear)} (${String(f.perYear).replace('.', ',')} beurten per jaar).`;
  },
  steps: [
    {
      title: 'Ramen',
      intro: 'Een raam met meerdere vakken telt als 1.',
      fields: [
        { id: 'klein', type: 'number', label: 'Kleine ramen', help: 'kleiner dan ±1 m²', unit: 'stuks', default: 0, service: 'klein', optional: true },
        { id: 'middel', type: 'number', label: 'Normale ramen', help: '±1 – 2 m²', unit: 'stuks', default: 6, service: 'middel' },
        { id: 'groot', type: 'number', label: 'Grote ramen / puien', help: 'groter dan 2 m²', unit: 'stuks', default: 0, service: 'groot', optional: true },
        { id: 'dakramen', type: 'number', label: 'Dakramen / Velux', unit: 'stuks', default: 0, service: 'dakramen', optional: true },
        { id: 'serre', type: 'number', label: 'Serre- of verandadak', unit: 'm²', default: 0, step: 5, service: 'serre', optional: true },
      ],
    },
    {
      title: 'Wassen',
      fields: [
        {
          id: 'zijden', type: 'choice', label: 'Welke kant?', default: 'buiten',
          options: [
            { value: 'buiten', label: 'Alleen buiten', icon: '🌤️' },
            { value: 'beide', label: 'Binnen + buiten', icon: '🏠', service: 'binnen' },
          ],
        },
        { id: 'kozijnen', type: 'toggle', label: 'Kozijnen meewassen?', default: false, service: 'kozijnen' },
        {
          id: 'hoogte', type: 'choice', label: 'Hoogste ramen', default: 'eerste',
          options: [
            { value: 'bg', label: 'Begane grond', hint: '+0% tijd', factor: 1 },
            { value: 'eerste', label: '1e verdieping', hint: '+15% tijd', factor: 1.15 },
            { value: 'hoger', label: '2e verdieping +', hint: '+35% tijd', factor: 1.35 },
          ],
        },
      ],
    },
    {
      title: 'Frequentie',
      fields: [
        {
          id: 'frequentie', type: 'choice', label: 'Hoe vaak?', default: '8w',
          options: [
            { value: 'eenmalig', label: 'Eenmalig', hint: 'normaal tarief', factor: 1 },
            { value: '4w', label: 'Elke 4 weken', hint: '20% korting', factor: 0.8, perYear: 13 },
            { value: '8w', label: 'Elke 8 weken', hint: '15% korting', factor: 0.85, perYear: 6.5 },
            { value: '12w', label: 'Elke 12 weken', hint: '10% korting', factor: 0.9, perYear: 4.3 },
          ],
        },
      ],
    },
  ],
  calc(a, h, R) {
    const L: Line[] = [];
    const freq = h.opt('frequentie').factor || 1;
    const tijd = (a.zijden === 'beide' ? 1 + R.binnen_toeslag / 100 : 1) * (h.opt('hoogte').factor || 1) * (a.kozijnen ? 1 + R.kozijnen_toeslag / 100 : 1);
    const extra = [h.opt('zijden').label, a.kozijnen ? 'incl. kozijnen' : ''].filter(Boolean).join(', ');
    const korting = freq < 1 ? ` · ${Math.round((1 - freq) * 100)}% abonnementskorting` : '';
    const line = (label: string, detail: string, minutes: number) => {
      const w = work(R, minutes / 60);
      L.push({ label, detail: detail + korting, hours: w.hours, labor: w.labor * freq, material: 0 });
    };
    ([['klein', 'Kleine ramen'], ['middel', 'Normale ramen'], ['groot', 'Grote ramen / puien']] as const).forEach(([id, label]) => {
      const n = h.num(a[id]);
      if (n) line(label, `${n} ${n === 1 ? 'stuk' : 'stuks'} · ${extra}`, n * R[`min_${id}`] * tijd);
    });
    const d = h.num(a.dakramen);
    if (d) line('Dakramen', `${d} ${d === 1 ? 'stuk' : 'stuks'}`, d * R.min_dakraam);
    const s = h.num(a.serre);
    if (s) line('Serre- / verandadak', `${h.fmt(s)} m²`, s * R.min_serre);
    return L;
  },
};

export const trades: Record<string, Trade> = { schilder, stukadoor, dakdekker, glazenwasser };
export const tradeList = Object.values(trades);
