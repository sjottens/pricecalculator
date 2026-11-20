import Link from 'next/link';
import { site } from '@/lib/site';
import { tradeList } from '@/lib/trades';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <div className="logo-main">{site.name}</div>
          <p className="muted">{site.tagline}. Reken klussen door op basis van je eigen tarieven en download de offerte als PDF.</p>
        </div>
        <div>
          <h4>Vakgebieden</h4>
          {tradeList.map((t) => (
            <Link key={t.id} href={`/calculator?vak=${t.id}`}>{t.name}</Link>
          ))}
        </div>
        <div>
          <h4>Tool</h4>
          <Link href="/calculator">Offerte maken</Link>
          <Link href="/#werkwijze">Werkwijze</Link>
        </div>
      </div>
      <div className="wrap footer-bottom muted">
        © {new Date().getFullYear()} {site.name}. Berekeningen zijn hulpmiddelen; controleer de offerte altijd voor verzending.
      </div>
    </footer>
  );
}
