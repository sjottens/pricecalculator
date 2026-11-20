'use client';

import { fmt, hiddenRates, num } from '@/lib/engine';
import type { RateDef, Trade } from '@/lib/types';

interface Props {
  trade: Trade;
  values: Record<string, string>;
  off: Set<string>;
  onChange: (id: string, v: string) => void;
  onToggleService: (id: string) => void;
  onReset: () => void;
}

const groups: RateDef['group'][] = ['Arbeid', 'Materiaal', 'Overig'];

export default function RatesPanel({ trade, values, off, onChange, onToggleService, onReset }: Props) {
  const val = (r: RateDef) => values[r.id] ?? String(r.default).replace('.', ',');
  const hidden = hiddenRates(trade, off);
  const uurtarief = trade.rates.find((r) => r.id === 'uurtarief');
  const changed = Object.keys(values).length > 0 || off.size > 0;

  return (
    <details className="calc-step rates" open>
      <summary className="calc-step-head">
        <span className="calc-step-no">€</span>
        <h2>Jouw tarieven</h2>
        {uurtarief && <span className="rates-badge">€ {val(uurtarief) || '0'} / uur</span>}
        <span className="rates-toggle" aria-hidden="true" />
      </summary>

      {trade.services && trade.services.length > 0 && (
        <div className="services">
          <h3>Wat doe jij?</h3>
          <p className="muted">Vink uit wat je niet doet. Die tarieven en keuzes verdwijnen dan uit de calculator.</p>
          <div className="service-list">
            {trade.services.map((s) => {
              const on = !off.has(s.id);
              return (
                <button key={s.id} type="button" className={`service ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => onToggleService(s.id)}>
                  <span className="service-check" aria-hidden="true">{on ? '✓' : ''}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="muted calc-step-intro">
        Vul je eigen uurtarief, tempo en prijzen in. Een leeg veld telt als € 0. Alles wordt in deze browser bewaard.
      </p>

      {groups.map((g) => {
        const list = trade.rates.filter((r) => r.group === g && !hidden.has(r.id));
        if (!list.length) return null;
        return (
          <div className="rates-group" key={g}>
            <h3>{g}</h3>
            <div className="rates-grid">
              {list.map((r) => {
                const v = val(r);
                const n = num(v);
                const perHour = r.perHour && r.unit.startsWith('min') && n ? `≈ ${fmt(60 / n)} ${r.perHour} per uur` : r.help;
                return (
                  <label className={`in rate ${r.id === 'uurtarief' ? 'rate-main' : ''} ${v === '' ? 'rate-empty' : ''}`} key={r.id}>
                    <span className="in-label">{r.label}</span>
                    <span className="in-box">
                      <input type="text" inputMode="decimal" autoComplete="off" value={v} placeholder="0" onChange={(e) => onChange(r.id, e.target.value)} />
                      <em>{r.unit}</em>
                    </span>
                    {perHour && <span className="rate-hint">{perHour}</span>}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="rates-foot">
        <span className="muted">💾 Automatisch opgeslagen in deze browser</span>
        {changed && <button type="button" className="link" onClick={onReset}>Standaardwaarden herstellen</button>}
      </div>
    </details>
  );
}
