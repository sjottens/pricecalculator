/*
 * UI van de prijscalculator.
 * Embed: <div id="calc" data-trades="schilder,glazenwasser"></div>
 * Of via URL: ?vak=schilder  (één vak = keuzescherm wordt overgeslagen)
 */
(function () {
  const cfg = window.CALC_CONFIG;
  const E = window.CalcEngine;
  const root = document.getElementById('calc');

  const eur = (n) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const eur2 = (n) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const params = new URLSearchParams(location.search);
  const allowed = (params.get('vak') || root.dataset.trades || '').split(',').map((s) => s.trim()).filter(Boolean);
  const tradeIds = Object.keys(cfg.trades).filter((id) => !allowed.length || allowed.includes(id));

  const S = { trade: null, a: {}, step: 0, view: 'trade', mode: 'inc', lead: null };

  const trade = () => cfg.trades[S.trade];
  const visible = (f) => !f.showIf || f.showIf(S.a);
  const steps = () => trade().steps.filter((s) => s.fields.some(visible));
  const result = () => E.compute(cfg, trade(), S.a);

  /* ---------------- state ---------------- */

  function selectTrade(id) {
    S.trade = id;
    S.a = {};
    E.fields(cfg.trades[id]).forEach((f) => {
      if (f.default !== undefined) S.a[f.id] = clone(f.default);
    });
    S.step = 0;
    S.view = 'q';
    render(true);
  }

  function setPath(obj, path, v) {
    const keys = path.split('.');
    let o = obj;
    keys.slice(0, -1).forEach((k) => (o = o[k]));
    o[keys[keys.length - 1]] = v;
  }

  /* ---------------- rendering ---------------- */

  function render(scroll) {
    let body = '';
    if (S.view === 'trade') body = viewTrade();
    else if (S.view === 'q') body = viewQuestions();
    else if (S.view === 'result') body = viewResult();
    else if (S.view === 'lead') body = viewLead();
    else if (S.view === 'done') body = viewDone();

    root.innerHTML = `
      <header class="c-head">
        <h1>${esc(cfg.title)}</h1>
        <p>${esc(cfg.subtitle)}</p>
      </header>
      ${S.view === 'trade' ? '' : progress()}
      <section class="c-body">${body}</section>`;

    updateLive();
    if (scroll && root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth' });
  }

  function progress() {
    const labels = [...steps().map((s) => s.title), 'Prijs', 'Offerte'];
    const cur = S.view === 'q' ? S.step : S.view === 'result' ? labels.length - 2 : labels.length - 1;
    return `<ol class="c-progress" aria-label="Voortgang">
      ${labels.map((l, i) => `<li class="${i < cur ? 'done' : i === cur ? 'cur' : ''}" title="${esc(l)}"></li>`).join('')}
    </ol>
    <div class="c-trade-tag">${trade().icon} ${esc(trade().name)}
      ${tradeIds.length > 1 ? '<button class="link" data-act="change-trade">wijzig</button>' : ''}</div>`;
  }

  function viewTrade() {
    return `<h2>Wat voor klus heb je?</h2>
      <div class="c-opts big">
        ${tradeIds.map((id) => {
          const t = cfg.trades[id];
          return `<button type="button" class="c-opt" data-trade="${id}">
            <span class="ic">${t.icon}</span><span><b>${esc(t.name)}</b><small>${esc(t.tagline)}</small></span></button>`;
        }).join('')}
      </div>`;
  }

  function viewQuestions() {
    const all = steps();
    S.step = Math.min(S.step, all.length - 1);
    const st = all[S.step];
    const last = S.step === all.length - 1;
    return `<h2>${esc(st.title)}</h2>
      ${st.intro ? `<p class="muted">${esc(st.intro)}</p>` : ''}
      <div class="c-fields">${st.fields.filter(visible).map(fieldHtml).join('')}</div>
      <p class="c-err" id="c-err" role="alert"></p>
      <nav class="c-nav">
        <button type="button" class="btn ghost" data-act="back" ${S.step === 0 && tradeIds.length < 2 ? 'disabled' : ''}>← Terug</button>
        <button type="button" class="btn primary" data-act="next">${last ? 'Bekijk prijs →' : 'Volgende →'}</button>
      </nav>
      <div class="c-live" id="c-live" aria-live="polite"></div>`;
  }

  const fieldWrap = (f, inner, forId) => `
    <div class="c-field">
      ${forId ? `<label class="c-label" for="${forId}">${esc(f.label)}</label>` : `<div class="c-label">${esc(f.label)}</div>`}
      ${f.help ? `<div class="c-help">${esc(f.help)}</div>` : ''}
      ${inner}
    </div>`;

  const optBtn = (attr, o, on) => `
    <button type="button" class="c-opt ${on ? 'on' : ''}" ${attr} aria-pressed="${on}">
      ${o.icon ? `<span class="ic">${o.icon}</span>` : ''}
      <span><b>${esc(o.label)}</b>${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</span>
    </button>`;

  const input = (path, value, label, unit) => `
    <label class="c-in">
      ${label ? `<span>${esc(label)}</span>` : ''}
      <span class="c-in-box"><input type="text" inputmode="decimal" autocomplete="off" data-bind="${path}" value="${esc(value)}">${unit ? `<em>${unit}</em>` : ''}</span>
    </label>`;

  function fieldHtml(f) {
    const v = S.a[f.id];
    switch (f.type) {
      case 'choice': {
        const opts = f.options.filter((o) => !o.showIf || o.showIf(S.a));
        return fieldWrap(f, `<div class="c-opts">${opts.map((o) => optBtn(`data-choice="${f.id}" data-val="${o.value}"`, o, v === o.value)).join('')}</div>`);
      }
      case 'multi': {
        const opts = f.options.filter((o) => !o.showIf || o.showIf(S.a));
        return fieldWrap(f, `<div class="c-opts">${opts.map((o) => optBtn(`data-multi="${f.id}" data-val="${o.value}"`, o, (v || []).includes(o.value))).join('')}</div>`);
      }
      case 'toggle':
        return fieldWrap(f, `<div class="c-seg">
          <button type="button" class="${v ? 'on' : ''}" data-toggle="${f.id}" data-val="1" aria-pressed="${!!v}">Ja</button>
          <button type="button" class="${!v ? 'on' : ''}" data-toggle="${f.id}" data-val="0" aria-pressed="${!v}">Nee</button></div>`);
      case 'number':
        return fieldWrap(f, `<div class="c-num">
          <button type="button" class="c-step" data-step="-${f.step || 1}" data-for="${f.id}" aria-label="Minder">−</button>
          <span class="c-in-box"><input id="f-${f.id}" type="text" inputmode="decimal" autocomplete="off" data-bind="${f.id}" value="${esc(v)}" placeholder="0"><em>${esc(f.unit || '')}</em></span>
          <button type="button" class="c-step" data-step="${f.step || 1}" data-for="${f.id}" aria-label="Meer">+</button></div>`, `f-${f.id}`);
      case 'area':
        return fieldWrap(f, `
          ${modeSeg(f.id, v.mode, 'Lengte × breedte', 'Ik weet de m²')}
          <div class="c-row">
            ${v.mode === 'dims'
              ? input(`${f.id}.l`, v.l, 'Lengte', 'm') + input(`${f.id}.b`, v.b, 'Breedte', 'm')
              : input(`${f.id}.m2`, v.m2, 'Oppervlak', 'm²')}
          </div>
          <div class="c-sum" data-summary="${f.id}"></div>`);
      case 'room':
        return fieldWrap(f, `
          ${modeSeg(f.id, v.mode, 'Afmetingen per ruimte', 'Ik weet de m²')}
          ${v.mode === 'dims'
            ? v.rooms.map((r, i) => `
              <div class="c-room">
                <div class="c-room-head"><b>Ruimte ${i + 1}</b>
                  ${v.rooms.length > 1 ? `<button type="button" class="link" data-delroom="${f.id}" data-i="${i}">verwijder</button>` : ''}</div>
                <div class="c-row four">
                  ${input(`${f.id}.rooms.${i}.l`, r.l, 'Lengte', 'm')}
                  ${input(`${f.id}.rooms.${i}.b`, r.b, 'Breedte', 'm')}
                  ${input(`${f.id}.rooms.${i}.h`, r.h, 'Hoogte', 'm')}
                  ${input(`${f.id}.rooms.${i}.openings`, r.openings, 'Ramen + deuren', '')}
                </div>
              </div>`).join('') +
              `<button type="button" class="btn ghost small" data-addroom="${f.id}">+ Ruimte toevoegen</button>`
            : `<div class="c-row">${input(`${f.id}.walls`, v.walls, 'Muren', 'm²')}${input(`${f.id}.ceiling`, v.ceiling, 'Plafonds', 'm²')}</div>`}
          <div class="c-sum" data-summary="${f.id}"></div>`);
    }
    return '';
  }

  const modeSeg = (id, mode, a, b) => `<div class="c-seg small">
    <button type="button" class="${mode === 'dims' ? 'on' : ''}" data-mode="${id}" data-val="dims">${a}</button>
    <button type="button" class="${mode === 'm2' ? 'on' : ''}" data-mode="${id}" data-val="m2">${b}</button></div>`;

  function viewResult() {
    const r = result();
    const inc = S.mode === 'inc';
    const rg = inc ? r.rangeInc : r.rangeEx;
    const note = trade().note ? trade().note(S.a, inc ? r.inc : r.ex, eur) : null;
    return `<div class="c-result">
      <div class="c-seg center">
        <button type="button" class="${inc ? 'on' : ''}" data-act="mode" data-val="inc">Particulier</button>
        <button type="button" class="${!inc ? 'on' : ''}" data-act="mode" data-val="ex">Zakelijk</button>
      </div>
      <p class="muted">Jouw prijsindicatie ${esc(r.unit)}</p>
      <div class="c-price">${eur(rg.low)}<span> – </span>${eur(rg.high)}</div>
      <p class="muted small">${inc ? 'inclusief btw' : 'exclusief btw'} · definitieve prijs na opname of foto's</p>
      ${note ? `<p class="c-note">${note}</p>` : ''}

      <details class="c-break">
        <summary>Bekijk de opbouw</summary>
        <table>
          ${r.lines.map((l) => `<tr><td>${esc(l.label)}${l.detail ? `<small>${esc(l.detail)}</small>` : ''}</td><td>${eur2(l.ex)}</td></tr>`).join('')}
          <tr class="sub"><td>Subtotaal excl. btw</td><td>${eur2(r.ex)}</td></tr>
          <tr><td>Btw</td><td>${eur2(r.vat)}</td></tr>
          <tr class="tot"><td>Totaal incl. btw</td><td>${eur2(r.inc)}</td></tr>
        </table>
        <p class="muted small">Gebaseerd op gemiddelde prijzen. Ter plekke kan het afwijken.</p>
      </details>

      <div class="c-cta">
        <button type="button" class="btn primary big" data-act="lead">Vraag exacte offerte aan →</button>
        ${cfg.business.whatsapp ? `<a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/${cfg.business.whatsapp}?text=${encodeURIComponent(summaryText())}">💬 Stuur via WhatsApp</a>` : ''}
      </div>
      <nav class="c-nav">
        <button type="button" class="btn ghost" data-act="edit">← Aanpassen</button>
        <button type="button" class="btn ghost" data-act="restart">Opnieuw beginnen</button>
      </nav>
    </div>`;
  }

  function viewLead() {
    const r = result();
    const rg = S.mode === 'inc' ? r.rangeInc : r.rangeEx;
    return `<h2>Vraag je exacte offerte aan</h2>
      <p class="muted">Indicatie: <b>${eur(rg.low)} – ${eur(rg.high)}</b> ${esc(r.unit)}. We sturen je binnen ${esc(cfg.business.responseTime)} een offerte op maat.</p>
      <form class="c-form" novalidate>
        <label class="c-in"><span>Naam *</span><span class="c-in-box"><input name="naam" required autocomplete="name"></span></label>
        <div class="c-row">
          <label class="c-in"><span>Telefoon</span><span class="c-in-box"><input name="telefoon" type="tel" autocomplete="tel"></span></label>
          <label class="c-in"><span>E-mail</span><span class="c-in-box"><input name="email" type="email" autocomplete="email"></span></label>
        </div>
        <div class="c-row">
          <label class="c-in"><span>Postcode</span><span class="c-in-box"><input name="postcode" autocomplete="postal-code"></span></label>
          <label class="c-in"><span>Huisnummer</span><span class="c-in-box"><input name="huisnummer"></span></label>
        </div>
        <label class="c-in"><span>Opmerking</span><span class="c-in-box"><textarea name="opmerking" rows="3" placeholder="Bijv. gewenste periode, bijzonderheden…"></textarea></span></label>
        <label class="c-file">
          <input type="file" name="fotos" accept="image/*" multiple>
          <span>📷 Foto's toevoegen <small>(maakt de offerte nauwkeuriger)</small></span>
          <em id="c-files"></em>
        </label>
        <label class="c-check"><input type="checkbox" name="akkoord" required> Ik ga akkoord dat mijn gegevens gebruikt worden om een offerte te maken.</label>
        <p class="c-err" id="c-err" role="alert"></p>
        <nav class="c-nav">
          <button type="button" class="btn ghost" data-act="to-result">← Terug</button>
          <button type="submit" class="btn primary">Verstuur aanvraag</button>
        </nav>
      </form>`;
  }

  function viewDone() {
    return `<div class="c-result">
      <div class="c-done">✓</div>
      <h2>Bedankt${S.lead && S.lead.naam ? `, ${esc(S.lead.naam)}` : ''}!</h2>
      <p class="muted">We hebben je aanvraag ontvangen en nemen binnen ${esc(cfg.business.responseTime)} contact met je op.</p>
      ${!cfg.leadEndpoint ? '<p class="c-note">Prototype: de aanvraag is niet echt verstuurd (geen <code>leadEndpoint</code> ingesteld). Bekijk de console voor de gegevens.</p>' : ''}
      <button type="button" class="btn ghost" data-act="restart">Nieuwe berekening</button>
    </div>`;
  }

  /* ---------------- live updates ---------------- */

  function updateLive() {
    const el = root.querySelector('#c-live');
    if (el) {
      const r = result();
      const rg = S.mode === 'inc' ? r.rangeInc : r.rangeEx;
      el.innerHTML = r.empty
        ? '<span class="muted">Vul de gegevens in voor een prijsindicatie</span>'
        : `<span class="muted">Indicatie</span> <b>${eur(rg.low)} – ${eur(rg.high)}</b> <span class="muted">${esc(r.unit)}</span>`;
      el.classList.toggle('on', !r.empty);
    }
    root.querySelectorAll('[data-summary]').forEach((s) => {
      const id = s.dataset.summary;
      const f = E.fields(trade()).find((x) => x.id === id);
      if (f.type === 'room') {
        const r = E.room(S.a[id]);
        s.textContent = r.walls || r.ceiling ? `≈ ${E.fmt(r.walls)} m² muur · ${E.fmt(r.ceiling)} m² plafond` : '';
      } else if (f.type === 'area') {
        const m2 = E.area(S.a[id]);
        s.textContent = m2 ? `≈ ${E.fmt(m2)} m²` : '';
      }
    });
  }

  function displayValue(f) {
    const v = S.a[f.id];
    switch (f.type) {
      case 'choice': return (f.options.find((o) => o.value === v) || {}).label || '';
      case 'multi': return f.options.filter((o) => (v || []).includes(o.value) && (!o.showIf || o.showIf(S.a))).map((o) => o.label).join(', ');
      case 'toggle': return v ? 'Ja' : 'Nee';
      case 'number': return E.num(v) ? `${v} ${f.unit || ''}` : '';
      case 'area': return `${E.fmt(E.area(v))} m²`;
      case 'room': {
        const r = E.room(v);
        return `${E.fmt(r.walls)} m² muur, ${E.fmt(r.ceiling)} m² plafond`;
      }
    }
    return '';
  }

  function summaryText() {
    const r = result();
    const rg = S.mode === 'inc' ? r.rangeInc : r.rangeEx;
    const rows = E.fields(trade()).filter(visible).map((f) => [f.label, displayValue(f)]).filter(([, v]) => v);
    return [
      `Offerte-aanvraag ${trade().name}`,
      ...rows.map(([k, v]) => `• ${k}: ${v}`),
      `Indicatie: ${eur(rg.low)} – ${eur(rg.high)} ${S.mode === 'inc' ? 'incl.' : 'excl.'} btw ${r.unit}`.trim(),
    ].join('\n');
  }

  function showErr(msg) {
    const el = root.querySelector('#c-err');
    if (el) el.textContent = msg;
  }

  /* ---------------- events ---------------- */

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !root.contains(b)) return;
    const d = b.dataset;

    if (d.trade) return selectTrade(d.trade);
    if (d.choice) { S.a[d.choice] = d.val; return render(); }
    if (d.multi) {
      const arr = S.a[d.multi] || (S.a[d.multi] = []);
      const i = arr.indexOf(d.val);
      i >= 0 ? arr.splice(i, 1) : arr.push(d.val);
      return render();
    }
    if (d.toggle) { S.a[d.toggle] = d.val === '1'; return render(); }
    if (d.mode) { S.a[d.mode].mode = d.val; return render(); }
    if (d.addroom) {
      const rooms = S.a[d.addroom].rooms;
      const prev = rooms[rooms.length - 1] || {};
      rooms.push({ l: '', b: '', h: prev.h || '2.6', openings: '2' });
      return render();
    }
    if (d.delroom) { S.a[d.delroom].rooms.splice(+d.i, 1); return render(); }
    if (d.step) {
      const inp = root.querySelector(`[data-bind="${d.for}"]`);
      const next = Math.max(0, E.num(inp.value) + Number(d.step));
      inp.value = String(next).replace('.', ',');
      S.a[d.for] = String(next);
      return updateLive();
    }

    switch (d.act) {
      case 'next': {
        if (S.step < steps().length - 1) { S.step++; return render(true); }
        if (result().empty) return showErr('Vul minimaal één afmeting of aantal in om een prijs te berekenen.');
        S.view = 'result';
        return render(true);
      }
      case 'back':
        if (S.step > 0) { S.step--; return render(true); }
        S.view = 'trade';
        return render(true);
      case 'change-trade': S.view = 'trade'; return render(true);
      case 'mode': S.mode = d.val; return render();
      case 'edit': S.view = 'q'; S.step = steps().length - 1; return render(true);
      case 'lead': S.view = 'lead'; return render(true);
      case 'to-result': S.view = 'result'; return render(true);
      case 'restart':
        if (tradeIds.length === 1) return selectTrade(tradeIds[0]);
        S.view = 'trade'; S.trade = null; return render(true);
    }
  });

  root.addEventListener('input', (e) => {
    const path = e.target.dataset && e.target.dataset.bind;
    if (path) { setPath(S.a, path, e.target.value); updateLive(); }
  });

  root.addEventListener('change', (e) => {
    if (e.target.name === 'fotos') {
      const n = e.target.files.length;
      root.querySelector('#c-files').textContent = n ? `${n} foto${n > 1 ? "'s" : ''} geselecteerd` : '';
    }
  });

  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    if (!fd.get('naam').trim()) return showErr('Vul je naam in.');
    if (!fd.get('telefoon').trim() && !fd.get('email').trim()) return showErr('Vul een telefoonnummer of e-mailadres in.');
    if (fd.get('email').trim() && !form.email.checkValidity()) return showErr('Dit e-mailadres lijkt niet te kloppen.');
    if (!fd.get('akkoord')) return showErr('Geef akkoord om je aanvraag te versturen.');

    const r = result();
    fd.append('vak', S.trade);
    fd.append('indicatie_incl', `${r.rangeInc.low}-${r.rangeInc.high}`);
    fd.append('indicatie_excl', `${r.rangeEx.low}-${r.rangeEx.high}`);
    fd.append('samenvatting', summaryText());
    fd.append('antwoorden', JSON.stringify(S.a));

    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Versturen…';
    try {
      if (cfg.leadEndpoint) {
        const res = await fetch(cfg.leadEndpoint, { method: 'POST', body: fd });
        if (!res.ok) throw new Error(res.status);
      } else {
        console.log('[prijscalculator] lead (prototype, niet verstuurd):', Object.fromEntries([...fd.entries()].map(([k, v]) => [k, v instanceof File ? v.name : v])));
      }
      S.lead = { naam: fd.get('naam') };
      S.view = 'done';
      render(true);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Verstuur aanvraag';
      showErr('Versturen lukte niet. Probeer het opnieuw of neem telefonisch contact op.');
    }
  });

  /* ---------------- start ---------------- */
  if (tradeIds.length === 1) selectTrade(tradeIds[0]);
  else render();
})();
