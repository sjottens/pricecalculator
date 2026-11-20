'use client';

/*
 * PDF-versie van de offerte (vector, A4) met @react-pdf/renderer.
 * Wordt alleen geladen als iemand op "Download PDF" klikt.
 */
import { Defs, Document, Font, Image, LinearGradient, Page, Rect, StyleSheet, Stop, Svg, Text, View } from '@react-pdf/renderer';
import { eur2, fmtTime } from '@/lib/engine';
import { fmtDate } from '@/lib/dates';
import { companyFooter, companyLines, pct, type QuoteDoc } from './quoteDoc';

Font.registerHyphenationCallback((word) => [word]);

const C = {
  night: '#0f172a',
  pink: '#f97316',
  hot: '#fb923c',
  sun: '#fdba74',
  text: '#0f172a',
  muted: '#64748b',
  line: '#e2e8f0',
  soft: '#f8fafc',
};

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9.5, color: C.text, paddingBottom: 56 },
  head: { backgroundColor: C.night, paddingVertical: 26, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'space-between' },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 20, color: '#ffffff', marginBottom: 6 },
  logo: { maxHeight: 54, maxWidth: 170, objectFit: 'contain', marginBottom: 6 },
  headLine: { color: '#cbd5e1', fontSize: 8.5, marginBottom: 1.5 },
  headStrong: { color: '#ffffff', fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  docTitle: { fontFamily: 'Helvetica-Bold', fontSize: 24, color: '#ffffff', textTransform: 'uppercase', textAlign: 'right', letterSpacing: 4, marginBottom: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2 },
  metaKey: { color: '#94a3b8', fontSize: 8.5, width: 60, textAlign: 'right', marginRight: 8 },
  metaVal: { color: '#ffffff', fontSize: 8.5, fontFamily: 'Helvetica-Bold', minWidth: 90, textAlign: 'right' },
  body: { paddingHorizontal: 40, paddingTop: 24 },
  parties: { flexDirection: 'row', marginBottom: 14 },
  party: { flex: 1 },
  label: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  bold: { fontFamily: 'Helvetica-Bold', fontSize: 10.5, marginBottom: 2 },
  desc: { backgroundColor: C.soft, padding: 10, borderRadius: 6, marginBottom: 14, lineHeight: 1.4 },
  th: { flexDirection: 'row', backgroundColor: C.night, color: '#fff', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4 },
  thText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.6, color: '#ffffff' },
  tr: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 0.7, borderBottomColor: C.line },
  cDesc: { flex: 1, paddingRight: 8 },
  cHours: { width: 42, textAlign: 'right' },
  cMoney: { width: 72, textAlign: 'right' },
  detail: { fontSize: 8, color: C.muted, marginTop: 1.5 },
  matDetail: { fontSize: 8, color: C.muted, marginTop: 1, fontFamily: 'Helvetica-Oblique' },
  totals: { marginTop: 12, marginLeft: 'auto', width: 260 },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  tSub: { borderTopWidth: 0.8, borderTopColor: C.text, marginTop: 3, paddingTop: 5, fontFamily: 'Helvetica-Bold' },
  grand: { marginTop: 8, backgroundColor: C.night, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandLabel: { color: '#ffffff', fontSize: 8.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.8 },
  grandVal: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: C.hot },
  note: { marginTop: 10, fontSize: 8.5, color: C.muted, textAlign: 'right' },
  terms: { marginTop: 22, lineHeight: 1.45, fontSize: 8.5 },
  sign: { flexDirection: 'row', marginTop: 28, gap: 30 },
  signBox: { flex: 1, borderBottomWidth: 0.8, borderBottomColor: C.text, height: 54, justifyContent: 'flex-start' },
  signLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  signHint: { fontSize: 7.5, color: C.muted, marginTop: 3 },
  foot: { position: 'absolute', bottom: 22, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.6, borderTopColor: C.line, paddingTop: 7 },
  footText: { fontSize: 7.5, color: C.muted },
});

export default function QuotePdf({ doc }: { doc: QuoteDoc }) {
  const { trade, result: r, meta, company, note, geldigTot } = doc;
  const klant = [meta.klantAdres, meta.klantPlaats, meta.klantEmail, meta.klantTelefoon].filter(Boolean);

  return (
    <Document title={`Offerte ${meta.nummer}`} author={company.naam || undefined} subject={trade.name} language="nl">
      <Page size="A4" style={s.page}>
        <View style={s.head}>
          <View style={{ maxWidth: 280 }}>
            {company.logo ? <Image src={company.logo} style={s.logo} /> : <Text style={s.brand}>{company.naam || 'Jouw bedrijf'}</Text>}
            {company.logo && company.naam ? <Text style={s.headStrong}>{company.naam}</Text> : null}
            {companyLines(company).map((l) => <Text key={l} style={s.headLine}>{l}</Text>)}
          </View>
          <View>
            <Text style={s.docTitle}>Offerte</Text>
            <View style={s.metaRow}><Text style={s.metaKey}>Nummer</Text><Text style={s.metaVal}>{meta.nummer}</Text></View>
            <View style={s.metaRow}><Text style={s.metaKey}>Datum</Text><Text style={s.metaVal}>{fmtDate(meta.datum)}</Text></View>
            <View style={s.metaRow}><Text style={s.metaKey}>Geldig tot</Text><Text style={s.metaVal}>{fmtDate(geldigTot)}</Text></View>
          </View>
        </View>
        <Svg width={596} height={5}>
          <Defs>
            <LinearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={C.pink} />
              <Stop offset="0.55" stopColor={C.hot} />
              <Stop offset="1" stopColor={C.sun} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="596" height="5" fill="url(#bar)" />
        </Svg>

        <View style={s.body}>
          <View style={s.parties}>
            <View style={s.party}>
              <Text style={s.label}>Offerte voor</Text>
              <Text style={s.bold}>{meta.klantNaam || '—'}</Text>
              {klant.map((l) => <Text key={l}>{l}</Text>)}
            </View>
            <View style={s.party}>
              <Text style={s.label}>Werkzaamheden</Text>
              <Text style={s.bold}>{trade.name}</Text>
              {r.hours > 0 && <Text>Geschatte tijd: {fmtTime(r.hours, true)}</Text>}
            </View>
          </View>

          {meta.omschrijving ? <Text style={s.desc}>{meta.omschrijving}</Text> : null}

          <View style={s.th}>
            <Text style={[s.thText, s.cDesc]}>Omschrijving</Text>
            <Text style={[s.thText, s.cHours]}>Tijd</Text>
            <Text style={[s.thText, s.cMoney]}>Arbeid</Text>
            <Text style={[s.thText, s.cMoney]}>Materiaal</Text>
            <Text style={[s.thText, s.cMoney]}>Totaal</Text>
          </View>
          {r.lines.map((l, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <View style={s.cDesc}>
                <Text>{l.label}</Text>
                {l.detail ? <Text style={s.detail}>{l.detail}</Text> : null}
                {l.matDetail ? <Text style={s.matDetail}>{l.matDetail}</Text> : null}
              </View>
              <Text style={s.cHours}>{fmtTime(l.hours)}</Text>
              <Text style={s.cMoney}>{l.labor ? eur2(l.labor) : ''}</Text>
              <Text style={s.cMoney}>{l.material ? eur2(l.material) : ''}</Text>
              <Text style={[s.cMoney, { fontFamily: 'Helvetica-Bold' }]}>{eur2(l.ex)}</Text>
            </View>
          ))}

          <View style={s.totals} wrap={false}>
            <View style={s.tRow}><Text>Arbeid{r.hours > 0 ? ` (${fmtTime(r.hours, true)})` : ''}</Text><Text>{eur2(r.labor)}</Text></View>
            <View style={s.tRow}><Text>Materiaal & overig</Text><Text>{eur2(r.material)}</Text></View>
            <View style={[s.tRow, s.tSub]}><Text>Subtotaal excl. btw</Text><Text>{eur2(r.ex)}</Text></View>
            {r.vatRows.map((v) => (
              <View style={s.tRow} key={v.rate}><Text>Btw {pct(v.rate)} over {eur2(v.base)}</Text><Text>{eur2(v.vat)}</Text></View>
            ))}
            <View style={s.grand}>
              <Text style={s.grandLabel}>Totaal incl. btw{r.unit ? ` ${r.unit}` : ''}</Text>
              <Text style={s.grandVal}>{eur2(r.inc)}</Text>
            </View>
          </View>
          {note ? <Text style={s.note}>{note}</Text> : null}

          {meta.voorwaarden ? (
            <View style={s.terms} wrap={false}>
              <Text style={s.label}>Voorwaarden</Text>
              <Text>{meta.voorwaarden}</Text>
            </View>
          ) : null}

          <View style={s.sign} wrap={false}>
            <View style={s.signBox}>
              <Text style={s.signLabel}>Voor akkoord opdrachtgever</Text>
              <Text style={s.signHint}>Naam, datum en handtekening</Text>
            </View>
            <View style={s.signBox}>
              <Text style={s.signLabel}>{company.naam || 'Opdrachtnemer'}</Text>
              <Text style={s.signHint}>Handtekening</Text>
            </View>
          </View>
        </View>

        <View style={s.foot} fixed>
          <Text style={s.footText}>{companyFooter(company)}</Text>
          <Text style={s.footText} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} van ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
