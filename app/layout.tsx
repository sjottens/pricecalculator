import type { Metadata } from 'next';
import { Inter, Inter_Tight } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { site } from '@/lib/site';
import './globals.css';

const display = Inter_Tight({ weight: ['700', '800'], subsets: ['latin'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: { default: `${site.name} – Offertes voor vakmensen`, template: `%s · ${site.name}` },
  description: 'Offerte-calculator voor schilders, stukadoors, dakdekkers en glazenwassers: reken met je eigen tarieven en download de offerte als PDF.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${display.variable} ${body.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
