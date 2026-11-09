// Verslo paso tikrinimas: klaidos stabdo paskelbimą, įspėjimai rodo, ko trūksta matomumui.
import { DAYS, LT_NOM, toMin, hexOk, contrast } from './text.mjs';
import { get, context } from './load.mjs';
import { fill } from './text.mjs';
import { iconNames } from './icons.mjs';
import { specialDays, validDate, rangeLT } from './special.mjs';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day));
}
const firstSunday = (y, month) => {
  const d = new Date(Date.UTC(y, month - 1, 1));
  d.setUTCDate(1 + ((7 - d.getUTCDay()) % 7));
  return d;
};
const iso = (d) => d.toISOString().slice(0, 10);

// Lietuvos valstybinės šventės ir poilsio dienos.
export function ltHolidays(y) {
  const e = easter(y);
  const em = new Date(e);
  em.setUTCDate(e.getUTCDate() + 1);
  return [
    [ymd(y, 1, 1), 'Naujieji metai'],
    [ymd(y, 2, 16), 'Vasario 16-oji'],
    [ymd(y, 3, 11), 'Kovo 11-oji'],
    [iso(e), 'Velykos'],
    [iso(em), 'Antroji Velykų diena'],
    [ymd(y, 5, 1), 'Gegužės 1-oji'],
    [iso(firstSunday(y, 5)), 'Motinos diena'],
    [iso(firstSunday(y, 6)), 'Tėvo diena'],
    [ymd(y, 6, 24), 'Joninės'],
    [ymd(y, 7, 6), 'Valstybės diena'],
    [ymd(y, 8, 15), 'Žolinė'],
    [ymd(y, 11, 1), 'Visų šventųjų diena'],
    [ymd(y, 11, 2), 'Vėlinės'],
    [ymd(y, 12, 24), 'Kūčios'],
    [ymd(y, 12, 25), 'Kalėdos'],
    [ymd(y, 12, 26), 'Antroji Kalėdų diena'],
  ].map(([date, name]) => ({ date, name }));
}

export function upcomingHolidays(date, days = 60) {
  const y = Number(date.slice(0, 4));
  const end = new Date(`${date}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + days);
  const last = iso(end);
  return [...ltHolidays(y), ...ltHolidays(y + 1)].filter((h) => h.date >= date && h.date <= last);
}
const weekday = (date) => (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;

export function check(b, date) {
  const E = [];
  const W = [];
  const I = [];
  const time = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

  if (!b.name) E.push('Nėra pavadinimo (name).');
  if (!b.address.street || !b.address.city) E.push('Nėra adreso (address.street ir address.city).');
  if (!DAYS.some((d) => (b.hours[d] || []).length)) E.push('Nenurodytas darbo laikas (hours).');
  for (const d of DAYS) {
    const iv = b.hours[d] ?? [];
    if (!Array.isArray(iv)) {
      E.push(`hours.${d} turi būti sąrašas, pvz. [["11:00", "18:00"]].`);
      continue;
    }
    for (const pair of iv) {
      const [o, c] = pair || [];
      if (!time.test(o || '') || !time.test(c || '')) E.push(`hours.${d}: laikas turi būti HH:MM formatu, rasta ${JSON.stringify(pair)}.`);
      else if (toMin(o) >= toMin(c)) E.push(`hours.${d}: atidarymas ${o} turi būti anksčiau nei uždarymas ${c}.`);
    }
  }
  for (const s of b.specialHours) {
    const from = s.from || s.date, to = s.to || s.date || s.from;
    const id = `specialHours ${s.date || `${s.from || '?'}…${s.to || '?'}`}`;
    if (s.date && (s.from || s.to)) E.push(`${id}: rašykite arba "date", arba "from" ir "to".`);
    if (!validDate(from) || !validDate(to)) E.push(`${id}: ${[from, to].every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '')) ? 'tokios datos nėra' : 'datos turi būti YYYY-MM-DD formatu, pvz. "2026-12-24"'}.`);
    else if (from > to) E.push(`${id}: "from" turi būti ne vėliau nei "to".`);
    else if ((new Date(to) - new Date(from)) / 864e5 > 366) E.push(`${id}: laikotarpis ilgesnis nei metai.`);
    if (!s.closed && !(s.hours || []).length) E.push(`${id}: nurodykite "closed": true arba "hours".`);
    for (const pair of s.hours || []) {
      const [o, c] = pair || [];
      if (!time.test(o || '') || !time.test(c || '')) E.push(`${id}: laikas turi būti HH:MM formatu, rasta ${JSON.stringify(pair)}.`);
      else if (toMin(o) >= toMin(c)) E.push(`${id}: atidarymas ${o} turi būti anksčiau nei uždarymas ${c}.`);
    }
  }
  for (const nt of b.notices || []) {
    if (!nt?.text) E.push('notices: kiekvienas pranešimas turi turėti "text".');
    for (const k of ['from', 'to']) if (nt?.[k] && !validDate(nt[k])) E.push(`notices: „${nt[k]}“ turi būti YYYY-MM-DD formatu.`);
  }
  for (const f of b.missingFiles || []) E.push(`Nerastas failas ${f} (nuotrauka ar logotipas).`);
  for (const x of b.photos) if (!x.w || !x.h || !x.alt) E.push(`Nuotraukai ${x.src} reikia w, h ir alt.`);
  if (b.localMap?.file && !b.localMap.svg) E.push(`Nerastas vietos schemos failas ${b.localMap.file}.`);
  if (b.phone && !/^\+\d{8,15}$/.test(b.phone)) E.push(`Telefonas „${b.phone}“ turi būti tarptautiniu formatu be tarpų, pvz. +37060012345.`);
  if (b.website && !/^https:\/\/[^\s/]+\.[^\s/]+\//.test(b.website)) E.push(`Svetainės adresas „${b.website}“ turi prasidėti https://.`);
  if (b.geo && (typeof b.geo.lat !== 'number' || typeof b.geo.lng !== 'number')) E.push('geo turi būti { "lat": skaičius, "lng": skaičius }.');
  for (const [k, v] of Object.entries(b.brand.colors)) if (!hexOk(v)) E.push(`Spalva brand.colors.${k} turi būti #RRGGBB formatu.`);
  if (b.indexnowKey && !/^[a-zA-Z0-9-]{8,128}$/.test(b.indexnowKey)) E.push('indexnowKey turi būti 8–128 raidžių, skaičių arba brūkšnelių.');
  for (const it of [...b.menu.items, ...b.directions]) {
    if (it.icon && !iconNames.includes(it.icon)) W.push(`Nežinoma ikona „${it.icon}“, bus rodomas taškas. Galimos: ${iconNames.join(', ')}.`);
  }

  if (!b.phone) W.push('Nėra telefono (phone): svetainėje nebus mygtuko „Skambinti“, o Google ir Apple profiliuose telefonas svarbus.');
  if (!b.website) W.push('Nėra domeno (website): be jo negeneruojami sitemap.xml ir canonical, neveikia IndexNow pranešimas Bing.');
  if (!b.geo) W.push('Nėra koordinačių (geo): Waze ves pagal adresą. Koordinates rasite Google Maps, paspaudę ant vietos.');
  if (!b.social.facebook) W.push('Nėra Facebook nuorodos (social.facebook).');
  const noDir = b.directions.filter((d) => !d.text);
  if (noDir.length) W.push(`Neaprašyta, kaip atvykti: ${noDir.map((d) => d.title).join(', ')}.`);
  const noAns = b.faq.filter((f) => f.q && !f.a);
  if (noAns.length) W.push(`DUK be atsakymų (svetainėje nerodomi): ${noAns.map((f) => `„${f.q}“`).join(', ')}.`);
  if (b.unconfirmed.length) W.push(`Nepatvirtinti duomenys: ${b.unconfirmed.map((p) => `${p} = „${get(b, p)}“`).join(', ')}.`);
  if (!b.photos.length) W.push('Nėra nuotraukų: įkelkite fasado, įėjimo, vitrinos ir produktų nuotraukas į photos/ aplanką.');
  else if (!b.photos.some((x) => x.role === 'find')) W.push('Nėra įėjimo ar iškabos nuotraukos ("role": "find"): ji labiausiai padeda rasti vietą.');
  const long = fill(b.content.longDescription, context(b));
  if (!long) W.push('Nėra ilgo aprašymo (content.longDescription): jo reikia Google ir Apple profiliams.');
  else if ([...long].length > 750) W.push(`Ilgas aprašymas turi ${[...long].length} simb., o Google leidžia 750.`);

  const c = b.brand.colors;
  if (Object.values(c).every(hexOk)) {
    for (const [fg, bg, what] of [
      [c.light, c.primary, 'šviesus tekstas ant pagrindinės spalvos'],
      [c.light, c.accent, 'šviesus tekstas ant mygtukų'],
      [c.ink, c.paper, 'tekstas ant fono'],
      [c.accent, c.paper, 'nuorodos ant fono'],
    ]) {
      const r = contrast(fg, bg);
      if (r < 4.5) W.push(`Per mažas kontrastas (${r.toFixed(2)}:1, reikia 4,5:1): ${what}.`);
    }
  }

  const sdays = specialDays(b);
  for (const h of upcomingHolidays(date, 60)) {
    const i = weekday(h.date);
    if ((b.hours[DAYS[i]] || []).length && !sdays.has(h.date)) {
      W.push(`${h.date} (${LT_NOM[i]}, ${h.name}): ar dirbate? Įrašykite į specialHours, kad Google ir svetainė rodytų teisingai.`);
    }
  }

  const old = b.specialHours.filter((s) => validDate(s.to || s.date) && (s.to || s.date) < date);
  if (old.length) I.push(`Pasibaigę ypatingo darbo laiko įrašai (svetainėje neberodomi, galima ištrinti): ${old.map((s) => rangeLT(s.from || s.date, s.to || s.date)).join(', ').replace(/\.$/, '')}.`);
  const oldNotes = (b.notices || []).filter((n) => n?.to && validDate(n.to) && n.to < date);
  if (oldNotes.length) I.push(`Pasibaigę pranešimai (galima ištrinti): ${oldNotes.length}.`);

  const todo = Object.entries(b.channels).filter(([, s]) => s !== 'yra');
  if (todo.length) I.push(`Kanalai, kuriuos dar reikia sutvarkyti ar patikrinti: ${todo.map(([k, s]) => `${k} (${s})`).join(', ')}.`);
  return { errors: E, warnings: W, info: I };
}
