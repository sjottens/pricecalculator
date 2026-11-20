'use client';

import { useState } from 'react';
import type { Company, QuoteMeta } from '@/lib/types';

function Txt({ label, value, onChange, type = 'text', placeholder, full, auto }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; full?: boolean; auto?: string;
}) {
  return (
    <label className={`in ${full ? 'in-full' : ''}`}>
      <span className="in-label">{label}</span>
      <span className="in-box"><input type={type} value={value} placeholder={placeholder} autoComplete={auto} onChange={(e) => onChange(e.target.value)} /></span>
    </label>
  );
}

function Area({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label className="in in-full">
      <span className="in-label">{label}</span>
      <span className="in-box"><textarea rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></span>
    </label>
  );
}

interface Props {
  meta: QuoteMeta;
  setMeta: (p: Partial<QuoteMeta>) => void;
  autoNr: string;
  company: Company;
  setCompany: (p: Partial<Company>) => void;
}

export default function QuoteDetails({ meta, setMeta, autoNr, company, setCompany }: Props) {
  const [logoErr, setLogoErr] = useState('');

  function onLogo(file: File | undefined) {
    if (!file) return;
    if (!/image\/(png|jpe?g)/.test(file.type)) return setLogoErr('Gebruik een PNG of JPG.');
    if (file.size > 400 * 1024) return setLogoErr('Logo is te groot (max. 400 kB).');
    setLogoErr('');
    const reader = new FileReader();
    reader.onload = () => setCompany({ logo: String(reader.result) });
    reader.readAsDataURL(file);
  }

  return (
    <div className="details-grid">
      <section className="calc-step">
        <header className="calc-step-head">
          <span className="calc-step-no">👤</span>
          <h2>Klant & offerte</h2>
        </header>
        <div className="form-grid">
          <Txt label="Naam klant" value={meta.klantNaam} onChange={(v) => setMeta({ klantNaam: v })} full />
          <Txt label="Adres" value={meta.klantAdres} onChange={(v) => setMeta({ klantAdres: v })} />
          <Txt label="Postcode + plaats" value={meta.klantPlaats} onChange={(v) => setMeta({ klantPlaats: v })} />
          <Txt label="E-mail" type="email" value={meta.klantEmail} onChange={(v) => setMeta({ klantEmail: v })} />
          <Txt label="Telefoon" type="tel" value={meta.klantTelefoon} onChange={(v) => setMeta({ klantTelefoon: v })} />
          <Txt label="Offertenummer" value={meta.nummer} placeholder={autoNr} onChange={(v) => setMeta({ nummer: v })} />
          <div className="row">
            <Txt label="Datum" type="date" value={meta.datum} onChange={(v) => setMeta({ datum: v })} />
            <Txt label="Geldig (dagen)" value={meta.geldigDagen} onChange={(v) => setMeta({ geldigDagen: v })} />
          </div>
          <Area label="Omschrijving werkzaamheden (optioneel)" value={meta.omschrijving} onChange={(v) => setMeta({ omschrijving: v })}
            placeholder="Bijv. woonkamer en hal schilderen, kleur RAL 9010" rows={2} />
          <Area label="Voorwaarden" value={meta.voorwaarden} onChange={(v) => setMeta({ voorwaarden: v })} />
        </div>
      </section>

      <details className="calc-step company">
        <summary className="calc-step-head">
          <span className="calc-step-no">🏢</span>
          <h2>Jouw bedrijf</h2>
          <span className="rates-badge">{company.naam || 'nog invullen'}</span>
          <span className="rates-toggle" aria-hidden="true" />
        </summary>
        <p className="muted calc-step-intro">Deze gegevens komen op de PDF en blijven bewaard in deze browser.</p>
        <div className="form-grid">
          <Txt label="Bedrijfsnaam" value={company.naam} onChange={(v) => setCompany({ naam: v })} full auto="organization" />
          <Txt label="Adres" value={company.adres} onChange={(v) => setCompany({ adres: v })} />
          <Txt label="Postcode + plaats" value={company.plaats} onChange={(v) => setCompany({ plaats: v })} />
          <Txt label="Telefoon" type="tel" value={company.telefoon} onChange={(v) => setCompany({ telefoon: v })} />
          <Txt label="E-mail" type="email" value={company.email} onChange={(v) => setCompany({ email: v })} />
          <Txt label="Website" value={company.website} onChange={(v) => setCompany({ website: v })} />
          <Txt label="KvK-nummer" value={company.kvk} onChange={(v) => setCompany({ kvk: v })} />
          <Txt label="Btw-nummer" value={company.btw} onChange={(v) => setCompany({ btw: v })} />
          <Txt label="IBAN" value={company.iban} onChange={(v) => setCompany({ iban: v })} />
          <div className="in in-full">
            <span className="in-label">Logo (PNG of JPG)</span>
            <div className="logo-row">
              {company.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logo} alt="Logo" className="logo-preview" />
              )}
              <label className="btn btn-ghost btn-sm">
                {company.logo ? 'Ander logo' : 'Logo uploaden'}
                <input type="file" accept="image/png,image/jpeg" hidden onChange={(e) => onLogo(e.target.files?.[0])} />
              </label>
              {company.logo && <button type="button" className="link" onClick={() => setCompany({ logo: '' })}>verwijderen</button>}
            </div>
            {logoErr && <span className="err">{logoErr}</span>}
          </div>
        </div>
      </details>
    </div>
  );
}
