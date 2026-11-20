import type { Metadata } from 'next';
import Calculator from '@/components/calculator/Calculator';
import { trades } from '@/lib/trades';

export const metadata: Metadata = { title: 'Offerte maken' };

export default async function CalculatorPage({ searchParams }: { searchParams: Promise<{ vak?: string }> }) {
  const { vak } = await searchParams;
  const initial = vak && trades[vak] ? vak : 'schilder';
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Offerte-calculator</p>
          <h1 className="page-title">Maak je <span className="grad">offerte</span></h1>
          <p className="muted">Stel je tarieven in, vul de klus in en download de offerte als PDF.</p>
        </div>
      </section>
      <Calculator key={initial} initialTrade={initial} />
    </>
  );
}
