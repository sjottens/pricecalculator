'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { compute, defaults, eur, eur2, fmtTime, isVisible, missingInputs, resolveRates, sanitize } from '@/lib/engine';
import { addDays, todayIso } from '@/lib/dates';
import { tradeList, trades } from '@/lib/trades';
import { useStored } from '@/lib/useStored';
import { track } from '@/lib/analytics';
import type { Answers, Company, CustomLine, QuoteMeta } from '@/lib/types';
import CustomLines from './CustomLines';
import TradeIcon from '@/components/TradeIcon';
import { FieldInput } from './Fields';
import RatesPanel from './RatesPanel';
import QuoteDetails from './QuoteDetails';
import QuotePreview from './QuotePreview';
import { fileName, type QuoteDoc } from './quoteDoc';

const emptyCompany: Company = { naam: '', adres: '', plaats: '', telefoon: '', email: '', website: '', kvk: '', btw: '', iban: '', logo: '' };
const defaultTerms =
  'Prijzen zijn gebaseerd op de opgegeven afmetingen. Meer- en minderwerk wordt in overleg verrekend. Betaling binnen 14 dagen na oplevering.';
const emptyMeta = (): QuoteMeta => ({
  nummer: '', datum: '', geldigDagen: '30', klantNaam: '', klantAdres: '', klantPlaats: '', klantEmail: '', klantTelefoon: '',
  omschrijving: '', voorwaarden: defaultTerms,
});

export default function Calculator({ initialTrade }: { initialTrade: string }) {
  const [tradeId, setTradeId] = useState(initialTrade);
  const trade = trades[tradeId];
  const [answers, setAnswers] = useState<Answers>(() => defaults(trades[initialTrade]));
  const [rateStore, setRateStore] = useStored<Record<string, Record<string, string>>>('pc.rates', {});
  const [company, setCompanyState] = useStored<Company>('pc.company', emptyCompany);
  const [counter, setCounter] = useStored<{ n: number }>('pc.counter', { n: 1 });
  const [offStore, setOffStore] = useStored<Record<string, string[]>>('pc.services', {});
  const [meta, setMetaState] = useState<QuoteMeta>(emptyMeta);
  const [customLines, setCustomLines] = useState<CustomLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState('');
  const quoteRef = useRef<HTMLDivElement>(null);
  const [quoteVisible, setQuoteVisible] = useState(false);

  const setMeta = (p: Partial<QuoteMeta>) => setMetaState((m) => ({ ...m, ...p }));
  const setCompany = (p: Partial<Company>) => setCompanyState((c) => ({ ...c, ...p }));

  // datum pas op de client invullen
  useEffect(() => {
    setMetaState((m) => (m.datum ? m : { ...m, datum: todayIso() }));
  }, []);

  const rateValues = rateStore[tradeId] ?? {};
  const offList = offStore[tradeId];
  const off = useMemo(() => new Set(offList ?? []), [offList]);
  // antwoorden zonder keuzes van diensten die uit staan
  const A = useMemo(() => sanitize(trade, answers, off), [trade, answers, off]);
  const R = useMemo(() => resolveRates(trade, rateStore[tradeId], off), [trade, rateStore, tradeId, off]);
  const result = useMemo(() => compute(trade, A, R, customLines), [trade, A, R, customLines]);
  const missing = useMemo(() => missingInputs(trade, A, off), [trade, A, off]);
  const missingIds = new Set(missing.map((m) => m.id));

  function goTo(id: string) {
    const el = document.getElementById(`veld-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = [...el.querySelectorAll('input')].find((i) => !i.value) ?? el.querySelector('input');
    setTimeout(() => input?.focus({ preventScroll: true }), 400);
  }
  const set = (id: string, value: unknown) => setAnswers((a) => ({ ...a, [id]: value }));

  const year = (meta.datum || todayIso()).slice(0, 4);
  const autoNr = `${year}-${String(counter.n).padStart(3, '0')}`;
  const datum = meta.datum || todayIso();
  const doc: QuoteDoc = {
    trade,
    result,
    meta: { ...meta, nummer: meta.nummer || autoNr, datum },
    geldigTot: addDays(datum, parseInt(meta.geldigDagen, 10) || 30),
    company,
    note: trade.note && !result.empty ? trade.note(A, result.inc, eur, result.helpers) : null,
  };

  function pickTrade(id: string) {
    if (id === tradeId) return;
    setTradeId(id);
    setAnswers(defaults(trades[id]));
    track('vak-gekozen', { vak: id });
    window.history.replaceState(null, '', `/calculator?vak=${id}`);
  }

  function setRate(id: string, v: string) {
    setRateStore((s) => ({ ...s, [tradeId]: { ...(s[tradeId] ?? {}), [id]: v } }));
  }
  function resetRates() {
    setRateStore((s) => {
      const next = { ...s };
      delete next[tradeId];
      return next;
    });
    setOffStore((s) => {
      const next = { ...s };
      delete next[tradeId];
      return next;
    });
  }
  function toggleService(id: string) {
    setOffStore((s) => {
      const cur = s[tradeId] ?? [];
      return { ...s, [tradeId]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });
  }

  async function downloadPdf() {
    setBusy(true);
    setPdfErr('');
    try {
      const [{ pdf }, { default: QuotePdf }] = await Promise.all([import('@react-pdf/renderer'), import('./QuotePdf')]);
      const blob = await pdf(<QuotePdf doc={doc} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName(doc);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      track('pdf-download', { vak: tradeId, regels: doc.result.lines.length });
    } catch (e) {
      console.error(e);
      setPdfErr('De PDF kon niet worden gemaakt. Probeer het opnieuw.');
    } finally {
      setBusy(false);
    }
  }

  function newQuote() {
    if (!meta.nummer) setCounter((c) => ({ n: c.n + 1 }));
    setMetaState({ ...emptyMeta(), datum: todayIso(), voorwaarden: meta.voorwaarden });
    setAnswers(defaults(trade));
    setCustomLines([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // zwevende balk verbergen zodra de offerte in beeld is
  useEffect(() => {
    const el = quoteRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setQuoteVisible(e.isIntersecting), { rootMargin: '0px 0px -30% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const sections = trade.steps.filter((s) => s.fields.some((f) => isVisible(f, A, off)));

  return (
    <div className="wrap calc">
      <div className="tabs" role="tablist" aria-label="Kies het vak">
        {tradeList.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === tradeId}
            className={`tab ${t.id === tradeId ? 'on' : ''}`} onClick={() => pickTrade(t.id)}>
            <span className="tab-ic"><TradeIcon trade={t} size={28} /></span>
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      <div className="calc-panel">
        <RatesPanel trade={trade} values={rateValues} off={off} onChange={setRate} onToggleService={toggleService} onReset={resetRates} />

        {sections.map((s, i) => (
          <section className="calc-step" key={s.title}>
            <header className="calc-step-head">
              <span className="calc-step-no">{String(i + 1).padStart(2, '0')}</span>
              <h2>{s.title}</h2>
            </header>
            {s.intro && <p className="muted calc-step-intro">{s.intro}</p>}
            <div className="fields">
              {s.fields.filter((f) => isVisible(f, A, off)).map((f) => <FieldInput key={f.id} f={f} a={A} set={set} off={off} needs={missingIds.has(f.id)} />)}
            </div>
          </section>
        ))}

        <CustomLines lines={customLines} setLines={setCustomLines} uurtarief={R.uurtarief} />

        <QuoteDetails meta={meta} setMeta={setMeta} autoNr={autoNr} company={company} setCompany={setCompany} />
      </div>

      <section className="quote-wrap" id="offerte" ref={quoteRef}>
        <div className="quote-title-row">
          <p className="kicker">Jouw offerte</p>
          {!result.empty && (
            <div className="quote-summary">
              <span>{fmtTime(result.hours, true)}</span>
              <b>{eur2(result.inc)}</b>
              <span>incl. btw</span>
            </div>
          )}
        </div>

        <QuotePreview doc={doc} missing={missing} onGoTo={goTo} />

        <div className="quote-actions">
          <button type="button" className="btn btn-neon btn-lg" onClick={downloadPdf} disabled={result.empty || busy}>
            {busy ? 'PDF maken…' : '⬇ Download PDF'}
          </button>
          <button type="button" className="btn btn-ghost btn-lg" onClick={newQuote}>+ Nieuwe offerte</button>
        </div>
        {pdfErr && <p className="err">{pdfErr}</p>}
        {!company.naam && !result.empty && <p className="muted small center">Tip: vul bij &ldquo;Jouw bedrijf&rdquo; je gegevens en logo in, die komen op de PDF.</p>}
      </section>

      <a href="#offerte" className={`float-bar ${quoteVisible ? 'hide' : ''} ${result.empty ? 'empty' : ''}`}>
        {result.empty ? (
          <span>Vul de klus in voor een berekening</span>
        ) : (
          <>
            <span className="float-label">{fmtTime(result.hours, true)}</span>
            <b>{eur(result.inc)}</b>
            <span className="float-go">Offerte ↓</span>
          </>
        )}
      </a>
    </div>
  );
}
