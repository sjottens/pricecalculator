/*
 * Rekenmotor – los van de UI, zodat hij ook server-side of in tests te gebruiken is.
 */
(function (g) {
  const OPENING_M2 = 1.8; // gemiddeld oppervlak per raam/deur dat van de muur afgaat

  const num = (v) => {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return isFinite(n) && n > 0 ? n : 0;
  };
  const round1 = (x) => Math.round(x * 10) / 10;
  const fmt = (x) => Number(x).toLocaleString('nl-NL', { maximumFractionDigits: 1 });
  const val = (x, a) => (typeof x === 'function' ? x(a) : x || 0);

  function room(v) {
    if (!v) return { walls: 0, ceiling: 0, count: 0 };
    if (v.mode === 'm2') return { walls: num(v.walls), ceiling: num(v.ceiling), count: 1 };
    let walls = 0, ceiling = 0, count = 0;
    (v.rooms || []).forEach((r) => {
      const l = num(r.l), b = num(r.b), h = num(r.h);
      if (!l || !b) return;
      count++;
      ceiling += l * b;
      walls += Math.max(0, 2 * (l + b) * h - num(r.openings) * OPENING_M2);
    });
    return { walls: round1(walls), ceiling: round1(ceiling), count };
  }

  function area(v) {
    if (!v) return 0;
    return v.mode === 'dims' ? round1(num(v.l) * num(v.b)) : num(v.m2);
  }

  const fields = (trade) => trade.steps.flatMap((s) => s.fields);

  function option(trade, a, id) {
    const f = fields(trade).find((x) => x.id === id);
    return (f && f.options && f.options.find((o) => o.value === a[id])) || {};
  }

  function compute(cfg, trade, a) {
    const h = {
      num, room, area, fmt,
      opt: (id) => option(trade, a, id),
      has: (id, v) => (a[id] || []).includes(v),
    };
    let lines = (trade.calc(a, h, trade.prices) || []).filter((l) => (l.labor || 0) + (l.material || 0) > 0.5);
    const empty = lines.length === 0;

    if (!empty) {
      const callout = val(trade.callout, a);
      if (callout) lines.push({ label: 'Voorrijkosten', labor: callout, material: 0 });
      const sub = lines.reduce((s, l) => s + (l.labor || 0) + (l.material || 0), 0);
      const min = val(trade.minimum, a);
      if (sub < min) lines.push({ label: 'Aanvulling minimumtarief', labor: min - sub, material: 0 });
    }

    const vat = trade.vat ? trade.vat(a) : { labor: 0.21, material: 0.21 };
    let ex = 0, vatAmt = 0;
    lines = lines.map((l) => {
      const labor = l.labor || 0, material = l.material || 0;
      const v = labor * (l.vatLabor ?? vat.labor) + material * vat.material;
      ex += labor + material;
      vatAmt += v;
      return { ...l, labor, material, ex: labor + material, vat: v };
    });

    const spread = trade.spread ?? cfg.spread ?? 0.1;
    const r = cfg.roundTo || 10;
    const range = (t) => ({ low: Math.floor((t * (1 - spread)) / r) * r, high: Math.ceil((t * (1 + spread)) / r) * r, mid: t });
    const inc = ex + vatAmt;

    return {
      empty, lines, ex, vat: vatAmt, inc,
      rangeEx: range(ex), rangeInc: range(inc),
      unit: typeof trade.priceUnit === 'function' ? trade.priceUnit(a) : trade.priceUnit || '',
    };
  }

  g.CalcEngine = { compute, room, area, num, fmt, fields, option };
})(typeof window !== 'undefined' ? window : globalThis);
