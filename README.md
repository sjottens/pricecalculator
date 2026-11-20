# Offerte Snel – offerte-calculator voor vakmensen

Tool voor ondernemers in het mkb: schilders, stukadoors, dakdekkers en glazenwassers. Je stelt je eigen tarieven in (uurtarief, minuten per m², materiaalprijzen), vult de klus in en downloadt de offerte als PDF.

## Starten

```powershell
cd C:\Projects-2025\pricecalculator   # let op: hoofdletter C:
npm install
npm run dev
```

Open daarna http://localhost:3000.

> **Windows:** start vanuit een pad met een **hoofdletter-C** (`C:\…`). Met `c:\…` laadt Next.js React soms twee keer
> en krijg je de fout `Cannot read properties of null (reading 'useContext')`.

## Hoe het rekent

- **Arbeid** = uren × uurtarief. De uren komen uit: oppervlak × lagen × minuten per m² × toeslagen (staat van de ondergrond, hoogte).
- **Materiaal**: bijv. verfprijs per liter ÷ dekking (m²/liter) × m² × lagen.
- Daarna komen voorrijkosten en het minimum orderbedrag erbij.
- **Btw** gaat per regel: 9% over arbeid bij woningen ouder dan 2 jaar, 21% over materiaal.

## Alleen wat je doet + eigen regels

- **Wat doe jij?** (bovenaan de tarieven): elke dienst hangt aan tarieven (`services` in `lib/trades.ts`) en aan keuzes
  (`service` op opties/velden). Een dienst uitzetten verbergt die tarieven en keuzes en zet ze in de berekening op 0.
- Een **leeg tariefveld telt als 0**. Het valt dus niet stil terug op de standaardwaarde.
- **Eigen regels**: vrije regels met aantal × prijs, als arbeid (lage btw als die van toepassing is) of als materiaal.
  Een negatieve prijs maakt er een korting van. Met eenheid "uur" tellen de uren mee in het totaal.

## Opslag

Tarieven (`pc.rates`), uitgezette diensten (`pc.services`), bedrijfsgegevens met logo (`pc.company`) en de offerteteller (`pc.counter`) staan in de
`localStorage` van de browser. Er is geen server of database. Ander apparaat of andere browser betekent lege instellingen.

## Structuur

| Pad | Wat |
|---|---|
| `app/page.tsx` | Homepage |
| `app/calculator/page.tsx` | Calculator, `?vak=schilder` kiest het vakgebied |
| `lib/trades.ts` | **Vragen, tarieven (met standaardwaarden) en rekenregels per vakgebied** |
| `lib/engine.ts` | Rekenmotor (uren, arbeid, materiaal, btw per tarief) |
| `components/calculator/RatesPanel.tsx` | Tarieven invullen |
| `components/calculator/QuoteDetails.tsx` | Klant-, offerte- en bedrijfsgegevens + logo |
| `components/calculator/QuotePreview.tsx` | Offerte op de pagina |
| `components/calculator/QuotePdf.tsx` | PDF (A4, @react-pdf/renderer), wordt pas geladen bij downloaden |
| `components/TradeIcon.tsx` | Iconen, o.a. het verfblik met kwast |
| `app/globals.css` | Stijl; kleuren als CSS-variabelen in `:root` |
| `_prototype/` | Eerste losse HTML-versie (klantgerichte calculator) |
