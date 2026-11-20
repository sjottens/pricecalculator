import Link from 'next/link';
import SunsetScene from '@/components/SunsetScene';
import TradeIcon from '@/components/TradeIcon';
import { tradeList } from '@/lib/trades';

const steps = [
  { n: '01', title: 'Stel je tarieven in', text: 'Jouw uurtarief, jouw tempo in minuten per m², jouw materiaalprijzen. Eén keer invullen, daarna bewaard.' },
  { n: '02', title: 'Vul de klus in', text: 'Maten, aantal lagen, staat van de ondergrond. De uren en de prijs rekenen live mee.' },
  { n: '03', title: 'Download de PDF', text: 'Een strakke offerte met je logo, btw-specificatie en akkoordregel. Klaar om te mailen.' },
];

const perks = [
  ['⏱', 'Rekent in uren', 'Minuten per m² × oppervlak × lagen. Je ziet precies hoeveel uur een klus kost.'],
  ['🧾', 'Btw goed geregeld', '9% over arbeid bij woningen ouder dan 2 jaar, 21% over materiaal. Automatisch.'],
  ['📄', 'Professionele PDF', 'Logo, klantgegevens, offertenummer, geldigheid en voorwaarden erop.'],
  ['🔒', 'Jouw data blijft lokaal', 'Tarieven en bedrijfsgegevens worden alleen in je eigen browser bewaard.'],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <SunsetScene />
        <div className="hero-glow" />
        <div className="wrap hero-in">
          <span className="chip">★ Voor schilders, stukadoors, dakdekkers en glazenwassers</span>
          <h1 className="hero-title">
            <span>Offerte klaar</span>
            <span className="grad">in 60 sec.</span>
          </h1>
          <p className="hero-lead">
            Vul je eigen uurtarief en tempo in, reken de klus door en download direct een professionele PDF-offerte.
            Geen Excel, geen gedoe.
          </p>
          <div className="hero-cta">
            <Link href="/calculator" className="btn btn-neon btn-lg">Maak een offerte →</Link>
            <Link href="#werkwijze" className="btn btn-ghost btn-lg">Hoe werkt het?</Link>
          </div>
          <ul className="hero-stats">
            <li><b>60 sec</b><span>per offerte</span></li>
            <li><b>Jouw</b><span>tarieven</span></li>
            <li><b>PDF</b><span>direct downloaden</span></li>
          </ul>
        </div>
      </section>

      <section id="vakken" className="section">
        <div className="wrap">
          <p className="kicker">Vakgebieden</p>
          <h2 className="section-title">Kies je <span className="grad">vak</span></h2>
          <div className="trade-grid">
            {tradeList.map((t, i) => (
              <Link key={t.id} href={`/calculator?vak=${t.id}`} className={`trade-card tc-${i % 4}`}>
                <div className="trade-art">
                  <span className="trade-icon"><TradeIcon trade={t} size={92} /></span>
                  <span className="trade-no">0{i + 1}</span>
                </div>
                <div className="trade-body">
                  <h3>{t.name}</h3>
                  <p>{t.tagline}</p>
                  <div className="trade-foot">
                    <span className="trade-from">{t.basis}</span>
                    <span className="trade-go">Offerte →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="werkwijze" className="section section-alt">
        <div className="wrap">
          <p className="kicker">Werkwijze</p>
          <h2 className="section-title">In drie stappen <span className="grad">geregeld</span></h2>
          <div className="steps-grid">
            {steps.map((s) => (
              <div key={s.n} className="step-card">
                <span className="step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">Waarom</p>
          <h2 className="section-title">Gemaakt voor de <span className="grad">vakman</span></h2>
          <div className="perk-grid">
            {perks.map(([ic, title, text]) => (
              <div key={title} className="perk">
                <span className="perk-ic">{ic}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap band-in">
          <h2 className="band-title">Minder rekenen, <span className="grad">meer klussen.</span></h2>
          <p>Stop met offertes maken op de achterkant van een bouwbon. Reken het in een minuut door.</p>
          <Link href="/calculator" className="btn btn-neon btn-lg">Start nu →</Link>
        </div>
      </section>
    </>
  );
}
