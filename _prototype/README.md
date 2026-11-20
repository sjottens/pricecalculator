# Prijscalculator (prototype)

Klantgerichte prijscalculator voor vakmensen: schilder, stukadoor, dakdekker, glazenwasser.
De bezoeker beantwoordt een paar simpele vragen, krijgt een prijsindicatie (bandbreedte) en kan direct een offerte aanvragen.

## Bestanden

| Bestand | Wat |
|---|---|
| `index.html` | Demo-pagina |
| `config.js` | **Alle prijzen, vragen en rekenregels per vakgebied**, hier pas je alles aan |
| `engine.js` | Rekenmotor (los van de UI, ook bruikbaar op een server) |
| `app.js` | Stappen-wizard, live indicatie, resultaat, offerteformulier |
| `style.css` | Basisstijl; kleuren als CSS-variabelen in `:root` (voor het latere GTA6-thema) |

## Gebruik

Open `index.html` in de browser. Geen build of installatie nodig.

- Alleen bepaalde vakken tonen: `<div id="calc" data-trades="schilder,glazenwasser">`
- Of via de URL: `index.html?vak=dakdekker` (één vak = keuzescherm wordt overgeslagen)

## Rekenmodel

1. Per vak berekent `calc()` regels met **arbeid** en **materiaal** (excl. btw).
2. Daarna komen er voorrijkosten bij, en zo nodig een aanvulling tot het minimumtarief.
3. Btw gaat per regel: arbeid kan 9% zijn (woning ouder dan 2 jaar), materiaal 21%.
4. De indicatie is het totaal ±`spread` (standaard 10%), afgerond op €10.

## Offerte-aanvragen

Zet `leadEndpoint` in `config.js` op een URL die een `multipart/form-data` POST accepteert
(bijv. een eigen API, Formspree, Make/Zapier-webhook). Meegestuurd worden: contactgegevens, foto's,
`vak`, `indicatie_incl`, `indicatie_excl`, `samenvatting` (leesbare tekst) en `antwoorden` (JSON).
Zonder endpoint wordt de aanvraag alleen in de console gelogd.

> De prijzen in `config.js` zijn voorbeeldwaarden en moeten per ondernemer worden ingesteld.
