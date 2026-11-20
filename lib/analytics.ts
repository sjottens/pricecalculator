/*
 * Bezoekersstatistieken, op twee plekken tegelijk (beide zonder cookies):
 * - Vercel Web Analytics: <Analytics /> in app/layout.tsx. Custom events alleen zichtbaar op Vercel Pro.
 * - Umami (cloud.umami.is): script in app/layout.tsx. Custom events ook op het gratis plan.
 * Paginaweergaven meten beide automatisch; met track() meten we belangrijke acties.
 */
import { track as vercelTrack } from '@vercel/analytics';

/** Umami Website ID. Dit is geen geheim: het staat sowieso zichtbaar in de HTML van de site. */
export const UMAMI_ID = '68d04110-0752-4281-8621-a8f1a6f34a65';
export const UMAMI_SRC = 'https://cloud.umami.is/script.js';

type Umami = { track: (event: string, data?: Record<string, string | number>) => void };

/** Meet een gebeurtenis, bijv. track('pdf-download', { vak: 'schilder' }). Stuur hier nooit klantgegevens mee. */
export function track(event: string, data?: Record<string, string | number>) {
  try {
    vercelTrack(event, data);
  } catch {
    // meten mag de app nooit breken
  }
  try {
    if (typeof window !== 'undefined') (window as unknown as { umami?: Umami }).umami?.track(event, data);
  } catch {
    // idem
  }
}
