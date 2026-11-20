/*
 * PRIJSCALCULATOR – INSTELLINGEN
 * ------------------------------------------------------------------
 * Hier staan per vakgebied de vragen, prijzen en rekenregels.
 * Alle prijzen zijn EXCL. btw. "labor" = arbeid, "material" = materiaal.
 *
 * Veldtypes:
 *   choice  – één keuze uit opties (option.factor / option.add / eigen velden)
 *   multi   – meerdere keuzes (waarde = array)
 *   toggle  – ja/nee (waarde = true/false)
 *   number  – getal met eenheid
 *   area    – oppervlak: m² direct of lengte × breedte
 *   room    – ruimtes: per ruimte L × B × H (+ ramen/deuren) of direct m² muur/plafond
 *   showIf  – functie (antwoorden) => true/false om een veld/optie te tonen
 */
window.CALC_CONFIG = {
  title: 'Prijscalculator',
  subtitle: 'Bereken in 1 minuut wat je klus ongeveer kost.',

  business: {
    name: 'Jouw Bedrijf',
    whatsapp: '31612345678', // internationaal formaat zonder +, leeg laten = geen WhatsApp-knop
    responseTime: '1 werkdag',
  },

  // URL waar de offerte-aanvraag naartoe gestuurd wordt (POST, multipart/form-data).
  // null = prototype-modus: aanvraag wordt alleen in de console gelogd.
  leadEndpoint: null,

  spread: 0.1, // bandbreedte van de indicatie: ±10%
  roundTo: 10, // afronden op €10

  trades: {
    /* ============================== SCHILDER ============================== */
    schilder: {
      name: 'Schilderwerk',
      icon: '🎨',
      tagline: 'Muren, plafonds, kozijnen, gevels',
      callout: 45,
      minimum: 295,
      vat: (a) => ({ labor: a.woningOud ? 0.09 : 0.21, material: 0.21 }),
      prices: {
        muur: { labor: 6.5, material: 1.6 }, // per m² per laag
        plafond: { labor: 8.0, material: 1.6 }, // per m² per laag
        gevel: { labor: 9.0, material: 2.4 }, // per m² per laag
        kozijn: { labor: 85, material: 12 }, // per stuk (2 lagen)
        deur: { labor: 75, material: 10 }, // per stuk (2 lagen)
        buitenFactor: 1.2, // houtwerk buiten is meer werk
        afdekken: { labor: 45, material: 15 }, // per ruimte als die niet leeg is
      },
      steps: [
        {
          title: 'Wat moet er geschilderd worden?',
          fields: [
            {
              id: 'locatie', type: 'choice', label: 'Binnen of buiten?', default: 'binnen',
              options: [
                { value: 'binnen', label: 'Binnen', icon: '🏠' },
                { value: 'buiten', label: 'Buiten', icon: '🏡' },
              ],
            },
            {
              id: 'onderdelen', type: 'multi', label: 'Onderdelen (meerdere mogelijk)', default: ['muren', 'plafond'],
              options: [
                { value: 'muren', label: 'Muren', icon: '🧱', showIf: (a) => a.locatie === 'binnen' },
                { value: 'plafond', label: 'Plafonds', icon: '⬜', showIf: (a) => a.locatie === 'binnen' },
                { value: 'gevel', label: 'Gevel / buitenmuur', icon: '🏢', showIf: (a) => a.locatie === 'buiten' },
                { value: 'kozijnen', label: 'Kozijnen / ramen', icon: '🪟' },
                { value: 'deuren', label: 'Deuren', icon: '🚪' },
              ],
            },
          ],
        },
        {
          title: 'Hoe groot is het?',
          fields: [
            {
              id: 'ruimte', type: 'room', label: 'Ruimtes',
              showIf: (a) => a.locatie === 'binnen' && (a.onderdelen || []).some((x) => x === 'muren' || x === 'plafond'),
              default: { mode: 'dims', rooms: [{ l: '', b: '', h: '2.6', openings: '2' }], walls: '', ceiling: '' },
            },
            {
              id: 'gevel', type: 'number', label: 'Oppervlak gevel', unit: 'm²', default: '', step: 5,
              help: 'Tip: breedte × hoogte van de gevel, ramen mag je meetellen.',
              showIf: (a) => a.locatie === 'buiten' && (a.onderdelen || []).includes('gevel'),
            },
            {
              id: 'kozijnen', type: 'number', label: 'Aantal kozijnen / ramen', unit: 'stuks', default: 1,
              showIf: (a) => (a.onderdelen || []).includes('kozijnen'),
            },
            {
              id: 'deuren', type: 'number', label: 'Aantal deuren', unit: 'stuks', default: 1,
              showIf: (a) => (a.onderdelen || []).includes('deuren'),
            },
          ],
        },
        {
          title: 'Nog een paar details',
          fields: [
            {
              id: 'lagen', type: 'choice', label: 'Welke kleur wordt het?', default: '2',
              options: [
                { value: '1', label: 'Zelfde kleur opfrissen', hint: '1 laag' },
                { value: '2', label: 'Andere kleur', hint: '2 lagen' },
                { value: '3', label: 'Donker naar licht', hint: '3 lagen' },
              ],
            },
            {
              id: 'staat', type: 'choice', label: 'Hoe is de huidige staat?', default: 'goed',
              options: [
                { value: 'goed', label: 'Goed', hint: 'Strak, weinig gaatjes', factor: 1 },
                { value: 'matig', label: 'Matig', hint: 'Scheurtjes, gaten vullen', factor: 1.2 },
                { value: 'slecht', label: 'Slecht', hint: 'Bladderend, veel herstel', factor: 1.45 },
              ],
            },
            {
              id: 'hoogte', type: 'choice', label: 'Plafondhoogte', default: 'normaal',
              showIf: (a) => a.locatie === 'binnen',
              options: [
                { value: 'normaal', label: 'Normaal', hint: 'tot 3 meter', factor: 1 },
                { value: 'hoog', label: 'Hoog', hint: '3 – 5 meter', factor: 1.2 },
                { value: 'vide', label: 'Vide / trappenhuis', hint: 'steigerwerk nodig', factor: 1.4 },
              ],
            },
            {
              id: 'bereik', type: 'choice', label: 'Hoe hoog is het hoogste punt?', default: 'laag',
              showIf: (a) => a.locatie === 'buiten',
              options: [
                { value: 'laag', label: 'Begane grond', hint: 'ladder volstaat', add: 0 },
                { value: 'midden', label: '1e verdieping', hint: 'rolsteiger', add: 350 },
                { value: 'hoog', label: '2e verdieping of hoger', hint: 'steiger / hoogwerker', add: 750 },
              ],
            },
            {
              id: 'leeg', type: 'toggle', label: 'Is de ruimte leeg?', default: false,
              help: 'Zo niet, dan verschuiven en dekken wij alles netjes af.',
              showIf: (a) => a.locatie === 'binnen',
            },
            {
              id: 'woningOud', type: 'toggle', label: 'Is de woning ouder dan 2 jaar?', default: true,
              help: 'Dan geldt vaak 9% btw op het arbeidsloon.',
            },
          ],
        },
      ],
      calc(a, h, P) {
        const L = [];
        const lagen = Number(a.lagen) || 2;
        const staat = h.opt('staat').factor || 1;
        const houtLagen = 0.5 + lagen / 4; // 1 laag = 75%, 2 = 100%, 3 = 125%

        if (a.locatie === 'binnen') {
          const r = h.room(a.ruimte);
          const f = staat * (h.opt('hoogte').factor || 1);
          let surfaces = 0;
          if (h.has('onderdelen', 'muren') && r.walls) {
            surfaces++;
            L.push({ label: 'Muren', detail: `${h.fmt(r.walls)} m² × ${lagen} ${lagen === 1 ? 'laag' : 'lagen'}`,
              labor: r.walls * lagen * P.muur.labor * f, material: r.walls * lagen * P.muur.material });
          }
          if (h.has('onderdelen', 'plafond') && r.ceiling) {
            surfaces++;
            L.push({ label: 'Plafonds', detail: `${h.fmt(r.ceiling)} m² × ${lagen} ${lagen === 1 ? 'laag' : 'lagen'}`,
              labor: r.ceiling * lagen * P.plafond.labor * f, material: r.ceiling * lagen * P.plafond.material });
          }
          if (surfaces && !a.leeg) {
            const n = Math.max(1, r.count);
            L.push({ label: 'Meubels verschuiven & afdekken', detail: `${n} ${n === 1 ? 'ruimte' : 'ruimtes'}`,
              labor: n * P.afdekken.labor, material: n * P.afdekken.material });
          }
        } else {
          const g = h.num(a.gevel);
          if (h.has('onderdelen', 'gevel') && g) {
            L.push({ label: 'Gevel', detail: `${h.fmt(g)} m² × ${lagen} ${lagen === 1 ? 'laag' : 'lagen'}`,
              labor: g * lagen * P.gevel.labor * staat, material: g * lagen * P.gevel.material });
          }
        }

        const kf = a.locatie === 'buiten' ? P.buitenFactor : 1;
        const nk = h.num(a.kozijnen);
        if (h.has('onderdelen', 'kozijnen') && nk) {
          L.push({ label: 'Kozijnen / ramen', detail: `${nk} stuks`,
            labor: nk * P.kozijn.labor * staat * kf * houtLagen, material: nk * P.kozijn.material * houtLagen });
        }
        const nd = h.num(a.deuren);
        if (h.has('onderdelen', 'deuren') && nd) {
          L.push({ label: 'Deuren', detail: `${nd} stuks`,
            labor: nd * P.deur.labor * staat * kf * houtLagen, material: nd * P.deur.material * houtLagen });
        }

        if (a.locatie === 'buiten' && L.length) {
          const s = h.opt('bereik');
          if (s.add) L.push({ label: 'Steiger / hoogwerker', detail: s.label, labor: 0, material: s.add });
        }
        return L;
      },
    },

    /* ============================== STUKADOOR ============================== */
    stukadoor: {
      name: 'Stucwerk',
      icon: '🧱',
      tagline: 'Wanden en plafonds strak of sierpleister',
      callout: 50,
      minimum: 395,
      vat: (a) => ({ labor: a.woningOud ? 0.09 : 0.21, material: 0.21 }),
      prices: {
        plafondFactor: 1.25, // plafonds zijn zwaarder werk
        afdekken: { labor: 40, material: 15 }, // per ruimte
      },
      steps: [
        {
          title: 'Wat moet er gestuct worden?',
          fields: [
            {
              id: 'onderdelen', type: 'multi', label: 'Onderdelen', default: ['muren'],
              options: [
                { value: 'muren', label: 'Muren', icon: '🧱' },
                { value: 'plafond', label: 'Plafonds', icon: '⬜' },
              ],
            },
            {
              id: 'afwerking', type: 'choice', label: 'Gewenste afwerking', default: 'sausklaar',
              options: [
                { value: 'behangklaar', label: 'Behangklaar', hint: 'Klaar om te behangen', labor: 12, material: 3 },
                { value: 'sausklaar', label: 'Sausklaar', hint: 'Glad, klaar voor verf', labor: 16, material: 3.5 },
                { value: 'spachtelputz', label: 'Spachtelputz', hint: 'Grove structuur', labor: 20, material: 5 },
                { value: 'sier', label: 'Sierpleister / betonlook', hint: 'Decoratief, vakwerk', labor: 55, material: 15 },
              ],
            },
          ],
        },
        {
          title: 'Hoe groot is het?',
          fields: [
            {
              id: 'ruimte', type: 'room', label: 'Ruimtes',
              default: { mode: 'dims', rooms: [{ l: '', b: '', h: '2.6', openings: '2' }], walls: '', ceiling: '' },
            },
          ],
        },
        {
          title: 'Nog een paar details',
          fields: [
            {
              id: 'verwijderen', type: 'choice', label: 'Moet er eerst iets verwijderd worden?', default: 'nee',
              options: [
                { value: 'nee', label: 'Nee', hint: 'Kale of geschilderde wand' },
                { value: 'behang', label: 'Behang verwijderen', labor: 5, material: 0.5 },
                { value: 'stuc', label: 'Oud / los stucwerk', hint: 'inclusief afvoer', labor: 10, material: 2 },
              ],
            },
            {
              id: 'staat', type: 'choice', label: 'Staat van de ondergrond', default: 'goed',
              options: [
                { value: 'goed', label: 'Goed', hint: 'Vlak en stevig', factor: 1 },
                { value: 'matig', label: 'Matig', hint: 'Scheuren, oneffen', factor: 1.15 },
                { value: 'slecht', label: 'Slecht', hint: 'Veel herstel nodig', factor: 1.35 },
              ],
            },
            {
              id: 'hoogte', type: 'choice', label: 'Plafondhoogte', default: 'normaal',
              options: [
                { value: 'normaal', label: 'Normaal', hint: 'tot 3 meter', factor: 1 },
                { value: 'hoog', label: 'Hoog', hint: '3 – 5 meter', factor: 1.2 },
                { value: 'vide', label: 'Vide / trappenhuis', factor: 1.4 },
              ],
            },
            {
              id: 'woningOud', type: 'toggle', label: 'Is de woning ouder dan 2 jaar?', default: true,
              help: 'Dan geldt vaak 9% btw op het arbeidsloon.',
            },
          ],
        },
      ],
      calc(a, h, P) {
        const L = [];
        const r = h.room(a.ruimte);
        const af = h.opt('afwerking');
        const f = (h.opt('staat').factor || 1) * (h.opt('hoogte').factor || 1);
        let m2 = 0;
        if (h.has('onderdelen', 'muren') && r.walls) {
          m2 += r.walls;
          L.push({ label: `Muren – ${af.label}`, detail: `${h.fmt(r.walls)} m²`,
            labor: r.walls * af.labor * f, material: r.walls * af.material });
        }
        if (h.has('onderdelen', 'plafond') && r.ceiling) {
          m2 += r.ceiling;
          L.push({ label: `Plafonds – ${af.label}`, detail: `${h.fmt(r.ceiling)} m²`,
            labor: r.ceiling * af.labor * f * P.plafondFactor, material: r.ceiling * af.material });
        }
        const rem = h.opt('verwijderen');
        if (m2 && rem.labor) {
          L.push({ label: rem.label, detail: `${h.fmt(m2)} m²`, labor: m2 * rem.labor, material: m2 * rem.material });
        }
        if (m2) {
          const n = Math.max(1, r.count);
          L.push({ label: 'Afdekken & opruimen', detail: `${n} ${n === 1 ? 'ruimte' : 'ruimtes'}`,
            labor: n * P.afdekken.labor, material: n * P.afdekken.material });
        }
        return L;
      },
    },

    /* ============================== DAKDEKKER ============================== */
    dakdekker: {
      name: 'Dakwerk',
      icon: '🏚️',
      tagline: 'Plat dak, pannendak, reparatie, goten',
      callout: (a) => (a.type === 'reparatie' ? 45 : 0),
      minimum: (a) => (a.type === 'reparatie' ? 195 : 750),
      vat: () => ({ labor: 0.21, material: 0.21 }),
      prices: {
        types: {
          bitumen: { labor: 28, material: 27 }, // per m²
          epdm: { labor: 30, material: 32 },
          pannen: { labor: 45, material: 40 },
        },
        reparatie: { labor: 145, material: 35 }, // per plek
        verwijderen: { labor: 8, material: 6 }, // per m², incl. container
        goot: { labor: 45, material: 40 }, // per strekkende meter, zink
      },
      steps: [
        {
          title: 'Wat voor dakklus?',
          fields: [
            {
              id: 'type', type: 'choice', label: 'Kies het type werk', default: 'bitumen',
              options: [
                { value: 'bitumen', label: 'Plat dak – bitumen', icon: '⬛', hint: 'Nieuwe dakbedekking' },
                { value: 'epdm', label: 'Plat dak – EPDM', icon: '◼️', hint: 'Rubber, lange levensduur' },
                { value: 'pannen', label: 'Pannendak vernieuwen', icon: '🏠', hint: 'Pannen + panlatten' },
                { value: 'reparatie', label: 'Lekkage / reparatie', icon: '💧', hint: 'Inspectie + herstel' },
              ],
            },
          ],
        },
        {
          title: 'Hoe groot is het?',
          fields: [
            {
              id: 'oppervlak', type: 'area', label: 'Oppervlak dak',
              showIf: (a) => a.type !== 'reparatie',
              default: { mode: 'dims', m2: '', l: '', b: '' },
            },
            {
              id: 'plekken', type: 'number', label: 'Aantal lekkages / plekken', unit: 'plekken', default: 1,
              showIf: (a) => a.type === 'reparatie',
            },
            {
              id: 'goten', type: 'number', label: 'Dakgoten vervangen (optioneel)', unit: 'meter', default: 0,
              help: 'Lengte van de goot in meters, 0 = niet nodig.',
            },
          ],
        },
        {
          title: 'Nog een paar details',
          fields: [
            {
              id: 'helling', type: 'choice', label: 'Hoe steil is het dak?', default: 'normaal',
              showIf: (a) => a.type === 'pannen',
              options: [
                { value: 'flauw', label: 'Flauw', hint: 'tot 30°', factor: 1 },
                { value: 'normaal', label: 'Gemiddeld', hint: '30° – 45°', factor: 1.1 },
                { value: 'steil', label: 'Steil', hint: 'meer dan 45°', factor: 1.25 },
              ],
            },
            {
              id: 'verwijderen', type: 'toggle', label: 'Oude dakbedekking verwijderen en afvoeren?', default: true,
              showIf: (a) => a.type !== 'reparatie',
            },
            {
              id: 'isolatie', type: 'choice', label: 'Dakisolatie meenemen?', default: 'geen',
              showIf: (a) => a.type === 'bitumen' || a.type === 'epdm',
              options: [
                { value: 'geen', label: 'Nee' },
                { value: 'pir100', label: 'PIR 100 mm', hint: 'Rc ≈ 4,5', labor: 12, material: 26 },
                { value: 'pir140', label: 'PIR 140 mm', hint: 'Rc ≈ 6,3', labor: 13, material: 34 },
              ],
            },
            {
              id: 'bereik', type: 'choice', label: 'Waar ligt het dak?', default: 'laag',
              options: [
                { value: 'laag', label: 'Aanbouw / garage', hint: 'ladder volstaat', add: 0 },
                { value: 'midden', label: 'Woonhuis (2 lagen)', hint: 'steiger nodig', add: 450 },
                { value: 'hoog', label: '3 lagen of hoger', hint: 'steiger / lift', add: 950 },
              ],
            },
            {
              id: 'woningOud', type: 'toggle', label: 'Is de woning ouder dan 2 jaar?', default: true,
              help: 'Dan geldt vaak 9% btw op arbeid voor isolatie.',
              showIf: (a) => (a.type === 'bitumen' || a.type === 'epdm') && a.isolatie && a.isolatie !== 'geen',
            },
          ],
        },
      ],
      calc(a, h, P) {
        const L = [];
        if (a.type === 'reparatie') {
          const n = h.num(a.plekken);
          if (n) L.push({ label: 'Inspectie & reparatie', detail: `${n} ${n === 1 ? 'plek' : 'plekken'}`,
            labor: n * P.reparatie.labor, material: n * P.reparatie.material });
        } else {
          const m2 = h.area(a.oppervlak);
          const t = P.types[a.type];
          if (m2 && t) {
            const helling = a.type === 'pannen' ? h.opt('helling').factor || 1 : 1;
            L.push({ label: h.opt('type').label, detail: `${h.fmt(m2)} m²`,
              labor: m2 * t.labor * helling, material: m2 * t.material });
            if (a.verwijderen) L.push({ label: 'Oude dakbedekking verwijderen & afvoeren', detail: `${h.fmt(m2)} m²`,
              labor: m2 * P.verwijderen.labor, material: m2 * P.verwijderen.material });
            const iso = h.opt('isolatie');
            if ((a.type === 'bitumen' || a.type === 'epdm') && iso.labor) {
              L.push({ label: `Isolatie ${iso.label}`, detail: `${h.fmt(m2)} m²`,
                labor: m2 * iso.labor, material: m2 * iso.material, vatLabor: a.woningOud ? 0.09 : undefined });
            }
          }
        }
        const g = h.num(a.goten);
        if (g) L.push({ label: 'Zinken dakgoot', detail: `${h.fmt(g)} meter`, labor: g * P.goot.labor, material: g * P.goot.material });
        const s = h.opt('bereik');
        if (L.length && s.add) L.push({ label: 'Steiger / lift', detail: s.label, labor: 0, material: s.add });
        return L;
      },
    },

    /* ============================== GLAZENWASSER ============================== */
    glazenwasser: {
      name: 'Glazenwassen',
      icon: '🪟',
      tagline: 'Eenmalig of als abonnement',
      callout: (a) => (a.frequentie === 'eenmalig' ? 25 : 0),
      minimum: (a) => (a.frequentie === 'eenmalig' ? 75 : 35),
      priceUnit: (a) => (a.frequentie === 'eenmalig' ? '' : 'per beurt'),
      vat: () => ({ labor: 0.21, material: 0.21 }),
      prices: {
        klein: 3.5, // per raam, buitenkant
        middel: 5,
        groot: 8,
        dakraam: 6, // per stuk
        serre: 2.5, // per m² serre-/verandadak
        kozijnenToeslag: 0.4, // +40% als kozijnen meegewassen worden
      },
      note(a, total, eur) {
        const f = this.steps[2].fields.find((x) => x.id === 'frequentie').options.find((o) => o.value === a.frequentie);
        if (!f || !f.perYear) return null;
        return `Dat is ongeveer <b>${eur(total * f.perYear)} per jaar</b> (≈ ${String(f.perYear).replace('.', ',')} beurten). Opzeggen kan altijd.`;
      },
      steps: [
        {
          title: 'Hoeveel ramen?',
          intro: 'Tel per gevel de ramen. Een raam met meerdere vakken telt als 1.',
          fields: [
            { id: 'klein', type: 'number', label: 'Kleine ramen', help: 'kleiner dan ±1 m² (bv. wc, badkamer)', unit: 'stuks', default: 0 },
            { id: 'middel', type: 'number', label: 'Normale ramen', help: '±1 – 2 m²', unit: 'stuks', default: 6 },
            { id: 'groot', type: 'number', label: 'Grote ramen / puien', help: 'groter dan 2 m², schuifpui', unit: 'stuks', default: 0 },
            { id: 'dakramen', type: 'number', label: 'Dakramen / Velux', unit: 'stuks', default: 0 },
            { id: 'serre', type: 'number', label: 'Serre- of verandadak (optioneel)', unit: 'm²', default: 0, step: 5 },
          ],
        },
        {
          title: 'Wat wil je laten wassen?',
          fields: [
            {
              id: 'zijden', type: 'choice', label: 'Welke kant?', default: 'buiten',
              options: [
                { value: 'buiten', label: 'Alleen buitenkant', icon: '🌤️', factor: 1 },
                { value: 'beide', label: 'Binnen + buiten', icon: '🏠', factor: 1.8 },
              ],
            },
            { id: 'kozijnen', type: 'toggle', label: 'Kozijnen ook meewassen?', default: false },
            {
              id: 'hoogte', type: 'choice', label: 'Hoogste ramen zitten op', default: 'eerste',
              options: [
                { value: 'bg', label: 'Begane grond', factor: 1 },
                { value: 'eerste', label: '1e verdieping', factor: 1.15 },
                { value: 'hoger', label: '2e verdieping +', hint: 'telescoopsteel / hoogwerker', factor: 1.35 },
              ],
            },
          ],
        },
        {
          title: 'Hoe vaak?',
          fields: [
            {
              id: 'frequentie', type: 'choice', label: 'Kies een frequentie', default: '8w',
              options: [
                { value: 'eenmalig', label: 'Eenmalig', hint: 'normaal tarief', factor: 1 },
                { value: '4w', label: 'Elke 4 weken', hint: '20% korting', factor: 0.8, perYear: 13 },
                { value: '8w', label: 'Elke 8 weken', hint: '15% korting', factor: 0.85, perYear: 6.5 },
                { value: '12w', label: 'Elke 12 weken', hint: '10% korting', factor: 0.9, perYear: 4.3 },
              ],
            },
          ],
        },
      ],
      calc(a, h, P) {
        const L = [];
        const freq = h.opt('frequentie').factor || 1;
        const f = (h.opt('zijden').factor || 1) * (h.opt('hoogte').factor || 1) * freq * (a.kozijnen ? 1 + P.kozijnenToeslag : 1);
        const extra = [h.opt('zijden').label, a.kozijnen ? 'incl. kozijnen' : ''].filter(Boolean).join(', ');
        [['klein', 'Kleine ramen'], ['middel', 'Normale ramen'], ['groot', 'Grote ramen / puien']].forEach(([id, label]) => {
          const n = h.num(a[id]);
          if (n) L.push({ label, detail: `${n} stuks · ${extra}`, labor: n * P[id] * f, material: 0 });
        });
        const d = h.num(a.dakramen);
        if (d) L.push({ label: 'Dakramen', detail: `${d} stuks`, labor: d * P.dakraam * freq, material: 0 });
        const s = h.num(a.serre);
        if (s) L.push({ label: 'Serre- / verandadak', detail: `${h.fmt(s)} m²`, labor: s * P.serre * freq, material: 0 });
        return L;
      },
    },
  },
};
