import Link from 'next/link';
import { site } from '@/lib/site';

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap site-header-in">
        <Link href="/" className="logo" aria-label={`${site.name} – home`}>
          <span className="logo-main">{site.name}</span>
          <span className="logo-sub">{site.tagline}</span>
        </Link>
        <nav className="site-nav" aria-label="Hoofdmenu">
          <Link href="/#vakken">Vakgebieden</Link>
          <Link href="/#werkwijze">Werkwijze</Link>
          <Link href="/calculator" className="btn btn-neon btn-sm">Maak een offerte</Link>
        </nav>
      </div>
    </header>
  );
}
