// Ypatingas darbo laikas (šventės, atostogos, pakeitimai) ir svarbūs pranešimai.
// specialHours įrašas: { "date": "2027-01-01", "closed": true }
//                    arba { "from": "2026-12-24", "to": "2026-12-29", "closed": true, "note": "…" }
//                    arba { "date": "2026-11-14", "hours": [["10:00", "15:00"]] }
// notices įrašas:      { "text": "…", "from": "2026-12-01", "to": "2026-12-20" } (datos neprivalomos)
import { dayIv, ivText, cap } from './text.mjs';

export const MONTHS_GEN = ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio'];
export const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const addDays = (d, k) => {
  const x = new Date(`${d}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() + k);
  return x.toISOString().slice(0, 10);
};
export const weekday = (d) => (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7;
export const validDate = (d) => ISO.test(d || '') && new Date(`${d}T12:00:00Z`).toISOString().slice(0, 10) === d;

// „gruodžio 24 d.“, „gruodžio 24–29 d.“, „gruodžio 30 d. – sausio 2 d.“
export const dayLT = (d) => `${MONTHS_GEN[Number(d.slice(5, 7)) - 1]} ${Number(d.slice(8, 10))} d.`;
export function rangeLT(from, to) {
  if (from === to) return dayLT(from);
  if (from.slice(0, 7) === to.slice(0, 7)) return `${MONTHS_GEN[Number(from.slice(5, 7)) - 1]} ${Number(from.slice(8, 10))}–${Number(to.slice(8, 10))} d.`;
  return `${dayLT(from)} – ${dayLT(to)}`;
}

// Įrašai kaip intervalai, surikiuoti pagal pradžią.
export function specialRanges(b) {
  return (b.specialHours || [])
    .map((s) => {
      const from = s.from || s.date;
      const to = s.to || s.date || s.from;
      const hours = Array.isArray(s.hours) ? s.hours : [];
      return { from, to, closed: Boolean(s.closed) || !hours.length, hours, note: s.note || '' };
    })
    .filter((r) => validDate(r.from) && validDate(r.to) && r.from <= r.to)
    .sort((x, y) => x.from.localeCompare(y.from));
}

// Kiekviena ypatinga diena atskirai: data -> intervalas.
export function specialDays(b) {
  const out = new Map();
  for (const r of specialRanges(b)) {
    for (let d = r.from, k = 0; d <= r.to && k < 400; d = addDays(d, 1), k++) out.set(d, r);
  }
  return out;
}

// Konkrečios dienos darbo laikas, atsižvelgiant į ypatingas dienas.
export function hoursOn(b, d, days = specialDays(b)) {
  const r = days.get(d);
  if (r) return r.closed ? [] : r.hours;
  return dayIv(b.hours, weekday(d));
}

export function nextOpenAfter(b, d, days = specialDays(b)) {
  for (let k = 1; k <= 120; k++) {
    const x = addDays(d, k);
    const iv = hoursOn(b, x, days);
    if (iv.length) return { date: x, iv };
  }
  return null;
}

// Svetainės ir kitų kanalų sąrašas: nuo šiandien galiojantys įrašai, žmonių kalba.
export function noticeItems(b, date) {
  const days = specialDays(b);
  const list = specialRanges(b).filter((r) => r.to >= date);
  return list.map((r, i) => {
    const what = r.closed ? 'nedirbame' : `dirbame ${ivText(r.hours)}`;
    let back = '';
    if (r.closed) {
      const n = nextOpenAfter(b, r.to, days);
      const next = list[i + 1];
      const nextSaysIt = next && !next.closed && n && next.from === n.date;
      if (n && !nextSaysIt) back = `Vėl dirbame ${dayLT(n.date)}`;
    }
    const end = (x) => (/[.!?]$/.test(x) ? x : `${x}.`);
    const note = r.note.trim().replace(/[.]+$/, '');
    const sentence = `${end(`${cap(rangeLT(r.from, r.to))} ${what}${note ? ` – ${note}` : ''}`)}${back ? ` ${end(back)}` : ''}`;
    return { ...r, when: cap(rangeLT(r.from, r.to)), what, back, sentence };
  });
}

export const activeNotices = (b, date) => (b.notices || []).filter((n) => n && n.text && (!n.to || n.to >= date));

// Google ir Apple profiliams: kiekviena diena atskirai, be dienų, kai ir taip nedirbama.
export function specialPerDay(b, date) {
  const out = [];
  for (const [d, r] of specialDays(b)) {
    if (d < date) continue;
    const regular = dayIv(b.hours, weekday(d));
    if (r.closed && !regular.length) continue;
    out.push({ date: d, wd: weekday(d), closed: r.closed, hours: r.hours, note: r.note });
  }
  return out.sort((x, y) => x.date.localeCompare(y.date));
}

// Konfigūracija naršyklės skriptui: { 'YYYY-MM-DD': [[min, min], ...] }
export function specialForScript(b, date, toMin, horizon = 400) {
  const last = addDays(date, horizon);
  const out = {};
  for (const [d, r] of specialDays(b)) {
    if (d < date || d > last) continue;
    out[d] = r.closed ? [] : r.hours.map(([o, c]) => [toMin(o), toMin(c)]);
  }
  return out;
}

