import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hoursLT, hoursOpenLT, hoursEN, addressLine, addressShort, mix, phoneDisplay } from './text.mjs';

export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const businessDir = (slug) => path.join(ROOT, 'businesses', slug);

const DEFAULT_COLORS = {
  primary: '#2F4544',
  accent: '#A64E33',
  paper: '#F6EFE3',
  band: '#EADFCB',
  light: '#FBF6EC',
  ink: '#1F2B2A',
};

export function listBusinesses() {
  return fs
    .readdirSync(path.join(ROOT, 'businesses'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(ROOT, 'businesses', d.name, 'business.json')))
    .map((d) => d.name);
}

export function loadBusiness(slug) {
  const file = path.join(businessDir(slug), 'business.json');
  if (!fs.existsSync(file)) throw new Error(`Nerastas failas ${path.relative(ROOT, file)}`);
  let b;
  try {
    b = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`Klaida JSON faile ${path.relative(ROOT, file)}: ${e.message}`);
  }
  return normalize(b, slug);
}

function normalize(b, slug) {
  b.slug ||= slug;
  b.alternateNames ||= [];
  b.types ||= ['LocalBusiness'];
  b.categories ||= {};
  b.address ||= {};
  b.social ||= {};
  b.hours ||= {};
  b.specialHours ||= [];
  b.cuisine ||= [];
  b.content ||= {};
  b.directions ||= [];
  b.menu ||= {};
  b.menu.items ||= [];
  b.faq ||= [];
  b.photos ||= [];
  b.brand ||= {};
  b.brand.colors = { ...DEFAULT_COLORS, ...(b.brand.colors || {}) };
  b.brand.colors.accentLift ||= mix(b.brand.colors.accent, '#FFFFFF', 0.2);
  b.unconfirmed ||= [];
  b.channels ||= {};
  b.timezone ||= 'Europe/Vilnius';
  if (b.website && !b.website.endsWith('/')) b.website += '/';
  const pub = path.join(businessDir(slug), 'public');
  b.publicFiles = fs.existsSync(pub) ? fs.readdirSync(pub).filter((f) => !f.startsWith('.')) : [];
  const dir = businessDir(slug);
  const inSite = (src) => fs.existsSync(path.join(dir, src)) || fs.existsSync(path.join(dir, 'public', src));
  b.missingFiles = [
    ...b.photos.flatMap((x) => [x.src, x.small].filter(Boolean)),
    ...(b.brand.logo ? [b.brand.logo.src, b.brand.logo.schemaSrc].filter(Boolean) : []),
  ].filter((src) => !inSite(src));
  if (b.localMap?.file) {
    const f = path.join(businessDir(slug), b.localMap.file);
    b.localMap.svg = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
  }
  return b;
}

// Šiandienos data verslo laiko juostoje (RADARAS_DATE leidžia nustatyti testams).
export function today(tz = 'Europe/Vilnius') {
  if (process.env.RADARAS_DATE) return process.env.RADARAS_DATE;
  return new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(new Date());
}

// Žymės, kurias galima naudoti tekstuose.
export function context(b) {
  return {
    name: b.name,
    hours: hoursLT(b.hours),
    hoursOpen: hoursOpenLT(b.hours),
    hoursEn: hoursEN(b.hours),
    address: addressLine(b.address),
    addressShort: addressShort(b.address),
    phone: b.phone ? phoneDisplay(b.phone) : '',
  };
}

export const get = (obj, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
