// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Answers = Record<string, any>;
export type Rates = Record<string, number>;

export interface Option {
  value: string;
  label: string;
  hint?: string;
  icon?: string;
  factor?: number;
  rate?: string; // verwijzing naar een tarief (bijv. steigerkosten)
  perYear?: number;
  service?: string; // alleen tonen als de ondernemer deze dienst aanbiedt
  showIf?: (a: Answers) => boolean;
}

/** Een dienst die de ondernemer wel of niet aanbiedt. Uit = bijbehorende tarieven en keuzes verdwijnen. */
export interface Service {
  id: string;
  label: string;
  rates: string[];
}

/** Een regel die de ondernemer zelf aan de offerte toevoegt. */
export interface CustomLine {
  id: string;
  omschrijving: string;
  aantal: string;
  eenheid: string;
  prijs: string;
  soort: 'arbeid' | 'materiaal';
}

export type FieldType = 'choice' | 'multi' | 'toggle' | 'number' | 'area' | 'room';

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  help?: string;
  unit?: string;
  step?: number;
  default?: unknown;
  options?: Option[];
  service?: string;
  optional?: boolean; // niet nodig om een berekening te krijgen
  wallsIf?: (a: Answers) => boolean; // room-veld: muren nodig?
  ceilingIf?: (a: Answers) => boolean; // room-veld: plafond nodig?
  showIf?: (a: Answers) => boolean;
}

export interface Missing {
  id: string;
  label: string;
}

export interface Section {
  title: string;
  intro?: string;
  fields: Field[];
}

/** Een tarief dat de ondernemer zelf instelt. */
export interface RateDef {
  id: string;
  label: string;
  unit: string;
  default: number;
  group: 'Arbeid' | 'Materiaal' | 'Overig';
  step?: number;
  help?: string;
  perHour?: string; // bij minuten-tarieven: toon "≈ X <perHour> per uur"
}

export interface Line {
  custom?: boolean;
  label: string;
  detail?: string;
  hours?: number;
  labor: number;
  material: number;
  matDetail?: string; // specificatie materiaal, bijv. "Muurverf: 12,4 liter × € 16,00"
  vatLabor?: number;
}

export interface Helpers {
  num: (v: unknown) => number;
  room: (v: RoomValue) => { walls: number; ceiling: number; count: number };
  area: (v: AreaValue) => number;
  fmt: (n: number) => string;
  opt: (id: string) => Option;
  has: (id: string, v: string) => boolean;
}

export interface RoomValue {
  mode: 'walls' | 'dims' | 'm2';
  muren: { l: string; h: string; openings: string }[]; // per muur: lengte × hoogte
  plafonds: { l: string; b: string }[]; // per plafond: lengte × breedte
  rooms: { l: string; b: string; h: string; openings: string }[]; // hele ruimte
  walls: string;
  ceiling: string;
}

export interface AreaValue {
  mode: 'dims' | 'm2';
  m2: string;
  l: string;
  b: string;
}

export interface Trade {
  id: string;
  name: string;
  icon: string;
  svgIcon?: 'paintcan';
  tagline: string;
  basis: string;
  rates: RateDef[];
  services?: Service[];
  callout?: (a: Answers, R: Rates) => number;
  minimum?: (a: Answers, R: Rates) => number;
  priceUnit?: (a: Answers) => string;
  vat: (a: Answers) => { labor: number; material: number };
  steps: Section[];
  calc: (a: Answers, h: Helpers, R: Rates) => Line[];
  note?: (a: Answers, total: number, eur: (n: number) => string, h: Helpers) => string | null;
}

export interface QuoteLine extends Line {
  ex: number;
  vat: number;
  custom?: boolean;
}

export interface VatRow {
  rate: number;
  base: number;
  vat: number;
}

export interface Result {
  empty: boolean;
  lines: QuoteLine[];
  hours: number;
  labor: number;
  material: number;
  ex: number;
  vat: number;
  vatRows: VatRow[];
  inc: number;
  unit: string;
  helpers: Helpers;
}

export interface Company {
  naam: string;
  adres: string;
  plaats: string;
  telefoon: string;
  email: string;
  website: string;
  kvk: string;
  btw: string;
  iban: string;
  logo: string; // data-URL
}

export interface QuoteMeta {
  nummer: string;
  datum: string; // ISO yyyy-mm-dd
  geldigDagen: string;
  klantNaam: string;
  klantAdres: string;
  klantPlaats: string;
  klantEmail: string;
  klantTelefoon: string;
  omschrijving: string;
  voorwaarden: string;
}
