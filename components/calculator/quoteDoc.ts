import type { Company, QuoteMeta, Result, Trade } from '@/lib/types';

/** Alles wat nodig is om een offerte te tonen of als PDF te maken. */
export interface QuoteDoc {
  trade: Trade;
  result: Result;
  meta: QuoteMeta; // nummer en datum zijn hier al ingevuld
  geldigTot: string; // ISO
  company: Company;
  note: string | null;
}

export const pct = (r: number) => `${Math.round(r * 100)}%`;

export const companyLines = (c: Company) =>
  [c.adres, c.plaats, c.telefoon, c.email, c.website].filter(Boolean);

export const companyFooter = (c: Company) =>
  [c.naam, c.kvk && `KvK ${c.kvk}`, c.btw && `Btw ${c.btw}`, c.iban && `IBAN ${c.iban}`].filter(Boolean).join('  ·  ');

export const fileName = (d: QuoteDoc) =>
  `Offerte ${d.meta.nummer}${d.meta.klantNaam ? ` - ${d.meta.klantNaam}` : ''}.pdf`.replace(/[\\/:*?"<>|]/g, '-');
