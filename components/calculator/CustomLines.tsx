'use client';

import { eur2, numSigned } from '@/lib/engine';
import type { CustomLine } from '@/lib/types';

const units = ['uur', 'stuk', 'm²', 'm¹', 'liter', 'post'];

interface Props {
  lines: CustomLine[];
  setLines: (fn: (l: CustomLine[]) => CustomLine[]) => void;
  uurtarief: number;
}

let seq = 0;
const newId = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`;

export default function CustomLines({ lines, setLines, uurtarief }: Props) {
  const add = (p: Partial<CustomLine>) =>
    setLines((l) => [...l, { id: newId(), omschrijving: '', aantal: '1', eenheid: 'stuk', prijs: '', soort: 'materiaal', ...p }]);
  const patch = (id: string, p: Partial<CustomLine>) => setLines((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const remove = (id: string) => setLines((l) => l.filter((x) => x.id !== id));

  return (
    <section className="calc-step">
      <header className="calc-step-head">
        <span className="calc-step-no">+</span>
        <h2>Eigen regels</h2>
      </header>
      <p className="muted calc-step-intro">
        Voeg zelf regels toe aan de offerte, bijvoorbeeld extra uren, materiaal of een korting (negatieve prijs).
      </p>

      {lines.length > 0 && (
        <div className="custom-list">
          {lines.map((c) => {
            const total = numSigned(c.aantal) * numSigned(c.prijs);
            return (
              <div className="custom" key={c.id}>
                <label className="in custom-desc">
                  <span className="in-label">Omschrijving</span>
                  <span className="in-box">
                    <input value={c.omschrijving} placeholder="Bijv. houtrot herstellen" onChange={(e) => patch(c.id, { omschrijving: e.target.value })} />
                  </span>
                </label>
                <label className="in">
                  <span className="in-label">Aantal</span>
                  <span className="in-box"><input inputMode="decimal" value={c.aantal} onChange={(e) => patch(c.id, { aantal: e.target.value })} /></span>
                </label>
                <label className="in">
                  <span className="in-label">Eenheid</span>
                  <span className="in-box">
                    <select value={c.eenheid} onChange={(e) => patch(c.id, { eenheid: e.target.value })}>
                      {units.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </span>
                </label>
                <label className="in">
                  <span className="in-label">Prijs per {c.eenheid}</span>
                  <span className="in-box"><em className="pre">€</em><input inputMode="decimal" value={c.prijs} placeholder="0,00" onChange={(e) => patch(c.id, { prijs: e.target.value })} /></span>
                </label>
                <div className="in">
                  <span className="in-label">Soort</span>
                  <div className="seg seg-sm custom-seg">
                    <button type="button" className={c.soort === 'arbeid' ? 'on' : ''} onClick={() => patch(c.id, { soort: 'arbeid' })}>Arbeid</button>
                    <button type="button" className={c.soort === 'materiaal' ? 'on' : ''} onClick={() => patch(c.id, { soort: 'materiaal' })}>Materiaal</button>
                  </div>
                </div>
                <div className="custom-total">
                  <span className={total < 0 ? 'neg' : ''}>{eur2(total)}</span>
                  <button type="button" className="custom-del" aria-label="Regel verwijderen" onClick={() => remove(c.id)}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="custom-add">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => add({ soort: 'arbeid', eenheid: 'uur', prijs: String(uurtarief).replace('.', ','), omschrijving: 'Extra werkzaamheden' })}>
          + Uren
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => add({ soort: 'materiaal', eenheid: 'stuk' })}>+ Materiaal</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => add({ soort: 'arbeid', eenheid: 'post', prijs: '-50', omschrijving: 'Korting' })}>
          + Korting
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => add({})}>+ Lege regel</button>
      </div>
    </section>
  );
}
