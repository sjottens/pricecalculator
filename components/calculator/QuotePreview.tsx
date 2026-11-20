'use client';

import { eur2, fmtTime } from '@/lib/engine';
import { fmtDate } from '@/lib/dates';
import type { Missing } from '@/lib/types';
import { companyFooter, companyLines, pct, type QuoteDoc } from './quoteDoc';

/** HTML-voorbeeld van de offerte; de PDF heeft dezelfde opbouw. */
export default function QuotePreview({ doc, missing = [], onGoTo }: { doc: QuoteDoc; missing?: Missing[]; onGoTo?: (id: string) => void }) {
  const { trade, result: r, meta, company, note, geldigTot } = doc;

  return (
    <article className="quote" aria-live="polite">
      <header className="quote-head">
        <div className="quote-from">
          {company.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logo} alt="" className="quote-logo" />
          ) : (
            <div className="quote-brand">{company.naam || 'Jouw bedrijfsnaam'}</div>
          )}
          {company.logo && company.naam && <div className="quote-sub strong">{company.naam}</div>}
          {companyLines(company).map((l) => <div className="quote-sub" key={l}>{l}</div>)}
        </div>
        <div className="quote-meta">
          <div className="quote-doc">Offerte</div>
          <dl>
            <dt>Nummer</dt><dd>{meta.nummer}</dd>
            <dt>Datum</dt><dd>{fmtDate(meta.datum)}</dd>
            <dt>Geldig tot</dt><dd>{fmtDate(geldigTot)}</dd>
          </dl>
        </div>
      </header>
      <div className="quote-bar" />

      <div className="quote-body">
        <div className="quote-parties">
          <div>
            <div className="quote-label">Offerte voor</div>
            {meta.klantNaam ? <b>{meta.klantNaam}</b> : <span className="quote-placeholder">Naam klant</span>}
            {[meta.klantAdres, meta.klantPlaats, meta.klantEmail, meta.klantTelefoon].filter(Boolean).map((l) => <div key={l}>{l}</div>)}
          </div>
          <div>
            <div className="quote-label">Werkzaamheden</div>
            <b>{trade.name}</b>
            {!r.empty && r.hours > 0 && <div>Geschatte tijd: {fmtTime(r.hours, true)}</div>}
          </div>
        </div>
        {meta.omschrijving && <p className="quote-desc">{meta.omschrijving}</p>}

        {r.empty ? (
          <div className="quote-empty">
            <b>Nog geen berekening</b>
            <p>De offerte rekent automatisch zodra de maten of aantallen van de klus zijn ingevuld. Dit ontbreekt nog:</p>
            {missing.length > 0 ? (
              <ul>
                {missing.map((m) => (
                  <li key={m.id + m.label}>
                    <button type="button" onClick={() => onGoTo?.(m.id)}>{m.label} →</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Kies minstens één onderdeel van de klus of voeg een eigen regel toe.</p>
            )}
          </div>
        ) : (
          <>
            {missing.length > 0 && (
              <div className="quote-warn">
                <span>⚠ Nog niet ingevuld:</span>
                {missing.map((m) => (
                  <button key={m.id + m.label} type="button" onClick={() => onGoTo?.(m.id)}>{m.label} →</button>
                ))}
              </div>
            )}
            <table className="quote-table">
              <thead>
                <tr>
                  <th>Omschrijving</th>
                  <th className="amt">Tijd</th>
                  <th className="amt hide-sm">Arbeid</th>
                  <th className="amt hide-sm">Materiaal</th>
                  <th className="amt">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {r.lines.map((l, i) => (
                  <tr key={i}>
                    <td>{l.label}{l.detail && <small>{l.detail}</small>}{l.matDetail && <small className="mat">{l.matDetail}</small>}</td>
                    <td className="amt">{fmtTime(l.hours)}</td>
                    <td className="amt hide-sm">{l.labor ? eur2(l.labor) : ''}</td>
                    <td className="amt hide-sm">{l.material ? eur2(l.material) : ''}</td>
                    <td className="amt">{eur2(l.ex)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="quote-totals">
              <div><span>Arbeid{r.hours > 0 ? ` (${fmtTime(r.hours, true)})` : ''}</span><span>{eur2(r.labor)}</span></div>
              <div><span>Materiaal & overig</span><span>{eur2(r.material)}</span></div>
              <div className="sub"><span>Subtotaal excl. btw</span><span>{eur2(r.ex)}</span></div>
              {r.vatRows.map((v) => (
                <div key={v.rate}><span>Btw {pct(v.rate)} over {eur2(v.base)}</span><span>{eur2(v.vat)}</span></div>
              ))}
              <div className="quote-grand"><span>Totaal incl. btw {r.unit}</span><strong>{eur2(r.inc)}</strong></div>
            </div>
            {note && <p className="quote-note">{note}</p>}
          </>
        )}

        {meta.voorwaarden && (
          <div className="quote-terms">
            <div className="quote-label">Voorwaarden</div>
            <p>{meta.voorwaarden}</p>
          </div>
        )}
        <div className="quote-sign">
          <div><span>Voor akkoord opdrachtgever</span><i>Naam, datum en handtekening</i></div>
          <div><span>{company.naam || 'Opdrachtnemer'}</span><i>Handtekening</i></div>
        </div>
      </div>
      <footer className="quote-foot">{companyFooter(company) || 'Vul je bedrijfsgegevens in voor de voettekst'}</footer>
    </article>
  );
}
