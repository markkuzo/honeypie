// Teksto ir darbo laiko pagalbinės funkcijos.

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const LT_SHORT = ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'];
export const LT_NOM = ['pirmadienis', 'antradienis', 'trečiadienis', 'ketvirtadienis', 'penktadienis', 'šeštadienis', 'sekmadienis'];
export const LT_ACC = ['pirmadienį', 'antradienį', 'trečiadienį', 'ketvirtadienį', 'penktadienį', 'šeštadienį', 'sekmadienį'];
export const EN_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const OSM_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const cap = (s) => (s ? s.charAt(0).toLocaleUpperCase('lt') + s.slice(1) : s);

// Nelaužomas tarpas tarp skaičiaus ir vieneto: „1,80 €“, „5 min.“
export const nbsp = (s) =>
  String(s ?? '')
    .replace(/(\d) (€|min\.|km|val\.|d\.|m(?=[\s.,;:!?)]|$))/g, '$1\u00A0$2')
    .replace(/(\sg\.) (\d)/g, '$1\u00A0$2')
    .replace(/(sausio|vasario|kovo|baland\u017Eio|gegu\u017E\u0117s|bir\u017Eelio|liepos|rugpj\u016B\u010Dio|rugs\u0117jo|spalio|lapkri\u010Dio|gruod\u017Eio) (\d)/gi, '$1\u00A0$2')
    .replace(/(\S) (g\.|pr\.|al\.|sav\.)(?=[\s\u00A0,.]|$)/g, '$1\u00A0$2');

export function joinList(items, and = 'ir') {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

export const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const shortTime = (t) => (t.endsWith(':00') ? String(Number(t.slice(0, 2))) : t.replace(/^0/, ''));

export const ivText = (iv) => iv.map(([a, b]) => `${a}–${b}`).join(', ');
export const ivShort = (iv) => iv.map(([a, b]) => `${shortTime(a)}–${shortTime(b)}`).join(' ');
export const dayIv = (hours, i) => hours?.[DAYS[i]] ?? [];
export const closedDays = (hours) => [0, 1, 2, 3, 4, 5, 6].filter((i) => !dayIv(hours, i).length);

// Iš eilės einančios dienos su vienodu darbo laiku.
export function groups(hours) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const iv = dayIv(hours, i);
    const key = JSON.stringify(iv);
    const last = out[out.length - 1];
    if (last && last.key === key && last.days.at(-1) === i - 1) last.days.push(i);
    else out.push({ key, iv, days: [i] });
  }
  return out;
}

const range = (days, names, and, dash) =>
  days.length === 1
    ? names[days[0]]
    : days.length === 2
      ? `${names[days[0]]} ${and} ${names[days[1]]}`
      : `${names[days[0]]}${dash}${names[days.at(-1)]}`;

// „trečiadienį–sekmadienį 11:00–18:00“ (be uždarų dienų, iš mažosios raidės)
export function hoursOpenLT(hours) {
  return groups(hours)
    .filter((g) => g.iv.length)
    .map((g) => `${range(g.days, LT_ACC, 'ir', '–')} ${ivText(g.iv)}`)
    .join('; ');
}

// „Trečiadienį–sekmadienį 11:00–18:00. Pirmadienį ir antradienį nedirbame.“
export function hoursLT(hours) {
  const open = hoursOpenLT(hours);
  if (!open) return 'Šiuo metu nedirbame.';
  const closed = closedDays(hours);
  return `${cap(open)}.${closed.length ? ` ${cap(joinList(closed.map((i) => LT_ACC[i])))} nedirbame.` : ''}`;
}

export function hoursEN(hours) {
  const gs = groups(hours).filter((g) => g.iv.length);
  if (!gs.length) return 'Currently closed.';
  const open = gs.map((g) => `${range(g.days, EN_DAYS, 'and', ' to ')}, ${ivText(g.iv)}`).join('; ');
  const closed = closedDays(hours);
  return `Open ${open}${closed.length ? `; closed on ${joinList(closed.map((i) => EN_DAYS[i]), 'and')}` : ''}.`;
}

// OpenStreetMap opening_hours: „We-Su 11:00-18:00“
export function hoursOSM(hours) {
  return groups(hours)
    .filter((g) => g.iv.length)
    .map((g) => {
      const d = g.days;
      const r = d.length === 1 ? OSM_DAYS[d[0]] : d.length === 2 ? `${OSM_DAYS[d[0]]},${OSM_DAYS[d[1]]}` : `${OSM_DAYS[d[0]]}-${OSM_DAYS[d.at(-1)]}`;
      return `${r} ${g.iv.map(([a, b]) => `${a}-${b}`).join(',')}`;
    })
    .join('; ');
}

export const hoursPerDayLT = (hours) =>
  [0, 1, 2, 3, 4, 5, 6].map((i) => `${cap(LT_NOM[i])}: ${dayIv(hours, i).length ? ivText(dayIv(hours, i)) : 'nedirba'}`);
export const hoursPerDayEN = (hours) =>
  [0, 1, 2, 3, 4, 5, 6].map((i) => `${EN_DAYS[i]}: ${dayIv(hours, i).length ? ivText(dayIv(hours, i)) : 'closed'}`);

export const addressShort = (a) => [a?.street, a?.city].filter(Boolean).join(', ');
export const addressLine = (a) => [a?.street, a?.city, a?.region].filter(Boolean).join(', ');
export const addressPostal = (a) =>
  [a?.street, [a?.postalCode, a?.city].filter(Boolean).join(' '), a?.region, a?.country === 'LT' ? 'Lietuva' : a?.country]
    .filter(Boolean)
    .join(', ');

export function phoneDisplay(p) {
  const m = /^\+370(\d{3})(\d{5})$/.exec(p || '');
  return m ? `+370 ${m[1]} ${m[2]}` : p;
}

// Žymės tekste: {hours}, {hoursOpen}, {hoursEn}, {address}, {addressShort}, {name}
export function fill(str, ctx) {
  if (str == null) return str;
  return String(str)
    .replace(/\{(\w+)\}/g, (m, k) => (k in ctx ? ctx[k] : m))
    .replace(/\.\.(?!\.)/g, '.');
}

export const hexOk = (h) => /^#[0-9a-fA-F]{6}$/.test(h || '');

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
export function mix(a, b, t) {
  const p = (h, i) => parseInt(h.slice(i, i + 2), 16);
  return `#${[1, 3, 5].map((i) => Math.round(p(a, i) * (1 - t) + p(b, i) * t).toString(16).padStart(2, '0')).join('')}`;
}
export function rgba(hex, a) {
  return `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')}, ${a})`;
}
