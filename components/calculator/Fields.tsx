'use client';

import { area, fmt, isVisible, num, room } from '@/lib/engine';
import type { Answers, AreaValue, Field, Option, RoomValue } from '@/lib/types';

type SetFn = (id: string, value: unknown) => void;

function OptionButton({ o, on, onClick }: { o: Option; on: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`opt ${on ? 'on' : ''}`} aria-pressed={on} onClick={onClick}>
      {o.icon && <span className="opt-ic">{o.icon}</span>}
      <span>
        <b>{o.label}</b>
        {o.hint && <small>{o.hint}</small>}
      </span>
    </button>
  );
}

function TextIn({ label, value, unit, onChange, id }: { label?: string; value: string; unit?: string; onChange: (v: string) => void; id?: string }) {
  return (
    <label className="in">
      {label && <span className="in-label">{label}</span>}
      <span className="in-box">
        <input id={id} type="text" inputMode="decimal" autoComplete="off" value={value ?? ''} placeholder="0" onChange={(e) => onChange(e.target.value)} />
        {unit && <em>{unit}</em>}
      </span>
    </label>
  );
}

function ModeSwitch({ mode, a, b, onChange }: { mode: string; a: string; b: string; onChange: (m: 'dims' | 'm2') => void }) {
  return (
    <div className="seg seg-sm">
      <button type="button" className={mode === 'dims' ? 'on' : ''} onClick={() => onChange('dims')}>{a}</button>
      <button type="button" className={mode === 'm2' ? 'on' : ''} onClick={() => onChange('m2')}>{b}</button>
    </div>
  );
}

/** Directe m²-berekening onder een rij invoervelden. */
function M2Line({ text }: { text: string }) {
  return <div className={`m2-line ${text ? '' : 'empty'}`}>{text || '= 0 m²'}</div>;
}

function wallText(m: { l: string; h: string; openings: string }) {
  const l = num(m.l), h = num(m.h), o = num(m.openings);
  if (!l || !h) return '';
  const bruto = l * h;
  if (!o) return `${fmt(l)} m × ${fmt(h)} m = ${fmt(bruto)} m²`;
  return `${fmt(l)} m × ${fmt(h)} m = ${fmt(bruto)} m² − ${o} × 1,8 m² = ${fmt(Math.max(0, bruto - o * 1.8))} m²`;
}

function roomText(rm: { l: string; b: string; h: string; openings: string }, needW: boolean, needC: boolean) {
  const r = room({ mode: 'dims', rooms: [rm], muren: [], plafonds: [], walls: '', ceiling: '' });
  if (!r.walls && !r.ceiling) return '';
  return [needW ? `Muren ${fmt(r.walls)} m²` : '', needC ? `Plafond ${fmt(r.ceiling)} m²` : ''].filter(Boolean).join(' · ');
}

function RoomField({ f, v, set, a }: { f: Field; v: RoomValue; set: SetFn; a: Answers }) {
  const update = (fn: (draft: RoomValue) => void) => {
    const d = structuredClone(v);
    d.muren ??= [{ l: '', h: '2.6', openings: '' }];
    d.plafonds ??= [{ l: '', b: '' }];
    fn(d);
    set(f.id, d);
  };
  const r = room(v);
  const needW = !f.wallsIf || f.wallsIf(a);
  const needC = !f.ceilingIf || f.ceilingIf(a);
  const muren = v.muren ?? [];
  const plafonds = v.plafonds ?? [];
  const summary = [needW && r.walls ? `${fmt(r.walls)} m² muur` : '', needC && r.ceiling ? `${fmt(r.ceiling)} m² plafond` : ''].filter(Boolean).join(' · ');

  return (
    <>
      <div className="seg seg-sm">
        {([['walls', 'Per muur'], ['dims', 'Hele ruimte (L × B × H)'], ['m2', 'Ik weet de m²']] as const).map(([m, label]) => (
          <button key={m} type="button" className={v.mode === m ? 'on' : ''} onClick={() => update((d) => { d.mode = m; })}>{label}</button>
        ))}
      </div>

      {v.mode === 'walls' && (
        <>
          {needW && (
            <div className="room">
              <div className="room-head"><b>Muren</b><span className="muted">lengte × hoogte</span></div>
              {muren.map((m, i) => (
                <div className="wall" key={i}>
                  <div className="row row-wall">
                    <TextIn label={`Muur ${i + 1} – lengte`} unit="m" value={m.l} onChange={(x) => update((d) => { d.muren[i].l = x; })} />
                    <TextIn label="Hoogte" unit="m" value={m.h} onChange={(x) => update((d) => { d.muren[i].h = x; })} />
                    <TextIn label="Ramen/deuren eraf" value={m.openings} onChange={(x) => update((d) => { d.muren[i].openings = x; })} />
                    <span className="row-end">
                      {muren.length > 1 && (
                        <button type="button" className="custom-del" aria-label="Muur verwijderen" onClick={() => update((d) => { d.muren.splice(i, 1); })}>×</button>
                      )}
                    </span>
                  </div>
                  <M2Line text={wallText(m)} />
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => update((d) => { d.muren.push({ l: '', h: d.muren.at(-1)?.h || '2.6', openings: '' }); })}>
                + Muur toevoegen
              </button>
            </div>
          )}
          {needC && (
            <div className="room">
              <div className="room-head"><b>Plafonds</b><span className="muted">lengte × breedte</span></div>
              {plafonds.map((p, i) => (
                <div className="wall" key={i}>
                  <div className="row row-wall">
                    <TextIn label={`Plafond ${i + 1} – lengte`} unit="m" value={p.l} onChange={(x) => update((d) => { d.plafonds[i].l = x; })} />
                    <TextIn label="Breedte" unit="m" value={p.b} onChange={(x) => update((d) => { d.plafonds[i].b = x; })} />
                    <span />
                    <span className="row-end">
                      {plafonds.length > 1 && (
                        <button type="button" className="custom-del" aria-label="Plafond verwijderen" onClick={() => update((d) => { d.plafonds.splice(i, 1); })}>×</button>
                      )}
                    </span>
                  </div>
                  <M2Line text={num(p.l) && num(p.b) ? `${fmt(num(p.l))} m × ${fmt(num(p.b))} m = ${fmt(num(p.l) * num(p.b))} m²` : ''} />
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => update((d) => { d.plafonds.push({ l: '', b: '' }); })}>
                + Plafond toevoegen
              </button>
            </div>
          )}
        </>
      )}

      {v.mode === 'dims' ? (
        <>
          {v.rooms.map((rm, i) => (
            <div className="room" key={i}>
              <div className="room-head">
                <b>Ruimte {i + 1}</b>
                {v.rooms.length > 1 && (
                  <button type="button" className="link" onClick={() => update((d) => { d.rooms.splice(i, 1); })}>verwijder</button>
                )}
              </div>
              <div className="row row-4">
                <TextIn label="Lengte" unit="m" value={rm.l} onChange={(x) => update((d) => { d.rooms[i].l = x; })} />
                <TextIn label="Breedte" unit="m" value={rm.b} onChange={(x) => update((d) => { d.rooms[i].b = x; })} />
                <TextIn label="Hoogte" unit="m" value={rm.h} onChange={(x) => update((d) => { d.rooms[i].h = x; })} />
                <TextIn label="Ramen + deuren" value={rm.openings} onChange={(x) => update((d) => { d.rooms[i].openings = x; })} />
              </div>
              <M2Line text={roomText(rm, needW, needC)} />
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => update((d) => { d.rooms.push({ l: '', b: '', h: d.rooms.at(-1)?.h || '2.6', openings: '2' }); })}
          >
            + Ruimte toevoegen
          </button>
        </>
      ) : v.mode === 'm2' ? (
        <div className="row">
          {needW && <TextIn label="Muren" unit="m²" value={v.walls} onChange={(x) => update((d) => { d.walls = x; })} />}
          {needC && <TextIn label="Plafonds" unit="m²" value={v.ceiling} onChange={(x) => update((d) => { d.ceiling = x; })} />}
        </div>
      ) : null}
      {summary && <div className="sum sum-total">Totaal: {summary}</div>}
    </>
  );
}

function AreaField({ f, v, set }: { f: Field; v: AreaValue; set: SetFn }) {
  const patch = (p: Partial<AreaValue>) => set(f.id, { ...v, ...p });
  const m2 = area(v);
  return (
    <>
      <ModeSwitch mode={v.mode} a="Lengte × breedte" b="Ik weet de m²" onChange={(mode) => patch({ mode })} />
      <div className="row">
        {v.mode === 'dims' ? (
          <>
            <TextIn label="Lengte" unit="m" value={v.l} onChange={(l) => patch({ l })} />
            <TextIn label="Breedte" unit="m" value={v.b} onChange={(b) => patch({ b })} />
          </>
        ) : (
          <TextIn label="Oppervlak" unit="m²" value={v.m2} onChange={(x) => patch({ m2: x })} />
        )}
      </div>
      <div className="sum">{m2 ? `≈ ${fmt(m2)} m²` : ''}</div>
    </>
  );
}

export function FieldInput({ f, a, set, off, needs }: { f: Field; a: Answers; set: SetFn; off?: Set<string>; needs?: boolean }) {
  const v = a[f.id];
  let inner: React.ReactNode = null;
  const opts = (f.options ?? []).filter((o) => isVisible(o, a, off));

  switch (f.type) {
    case 'choice':
      inner = (
        <div className="opts">
          {opts.map((o) => <OptionButton key={o.value} o={o} on={v === o.value} onClick={() => set(f.id, o.value)} />)}
        </div>
      );
      break;
    case 'multi':
      inner = (
        <div className="opts">
          {opts.map((o) => {
            const list: string[] = v || [];
            const on = list.includes(o.value);
            return <OptionButton key={o.value} o={o} on={on} onClick={() => set(f.id, on ? list.filter((x) => x !== o.value) : [...list, o.value])} />;
          })}
        </div>
      );
      break;
    case 'toggle':
      inner = (
        <div className="seg">
          <button type="button" className={v ? 'on' : ''} aria-pressed={!!v} onClick={() => set(f.id, true)}>Ja</button>
          <button type="button" className={!v ? 'on' : ''} aria-pressed={!v} onClick={() => set(f.id, false)}>Nee</button>
        </div>
      );
      break;
    case 'number': {
      const step = f.step || 1;
      const bump = (d: number) => set(f.id, String(Math.max(0, num(v) + d)));
      inner = (
        <div className="num">
          <button type="button" className="step" aria-label="Minder" onClick={() => bump(-step)}>−</button>
          <span className="in-box">
            <input id={`f-${f.id}`} type="text" inputMode="decimal" autoComplete="off" placeholder="0" value={v ?? ''} onChange={(e) => set(f.id, e.target.value)} />
            {f.unit && <em>{f.unit}</em>}
          </span>
          <button type="button" className="step" aria-label="Meer" onClick={() => bump(step)}>+</button>
        </div>
      );
      break;
    }
    case 'area':
      inner = <AreaField f={f} v={v} set={set} />;
      break;
    case 'room':
      inner = <RoomField f={f} v={v} set={set} a={a} />;
      break;
  }

  return (
    <div className={`field ${needs ? 'needs' : ''}`} id={`veld-${f.id}`}>
      {f.type === 'number' ? <label className="field-label" htmlFor={`f-${f.id}`}>{f.label}</label> : <div className="field-label">{f.label}</div>}
      {f.help && <div className="field-help">{f.help}</div>}
      {inner}
    </div>
  );
}
