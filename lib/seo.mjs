// Struktūriniai duomenys ir failai paieškos sistemoms bei AI.
import { DAYS, EN_DAYS, dayIv, addressShort, addressPostal, fill, hoursLT, hoursOpenLT, phoneDisplay, nbsp } from './text.mjs';
import { specialRanges, noticeItems, activeNotices } from './special.mjs';

export function mapsUrl(b) {
  if (b.googleMapsUrl) return b.googleMapsUrl;
  const q = encodeURIComponent(`${b.name}, ${addressShort(b.address)}`);
  const id = b.googlePlaceId ? `&query_place_id=${encodeURIComponent(b.googlePlaceId)}` : '';
  return `https://www.google.com/maps/search/?api=1&query=${q}${id}`;
}

export function wazeUrl(b) {
  const g = b.navTarget || b.geo;
  if (g) return `https://waze.com/ul?ll=${g.lat},${g.lng}&navigate=yes`;
  return b.geo
    ? `https://waze.com/ul?ll=${b.geo.lat},${b.geo.lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(addressShort(b.address))}&navigate=yes`;
}

export const faqAnswered = (b, ctx) => b.faq.filter((f) => f.q && f.a).map((f) => ({ q: f.q, a: fill(f.a, ctx) }));
export const socialLinks = (b) => Object.entries(b.social).filter(([, url]) => url);

function openingSpec(hours) {
  const map = new Map();
  for (let i = 0; i < 7; i++) {
    for (const [opens, closes] of dayIv(hours, i)) {
      const k = `${opens}-${closes}`;
      if (!map.has(k)) map.set(k, { '@type': 'OpeningHoursSpecification', dayOfWeek: [], opens, closes });
      map.get(k).dayOfWeek.push(EN_DAYS[i]);
    }
  }
  return [...map.values()];
}

// Šventės ir kiti pakeitimai; uždaryta visą dieną žymima 00:00–00:00 (taip rekomenduoja Google).
function specialSpec(b, date) {
  const out = [];
  for (const r of specialRanges(b).filter((x) => x.to >= date)) {
    const base = { '@type': 'OpeningHoursSpecification', validFrom: r.from, validThrough: r.to };
    if (r.closed) out.push({ ...base, opens: '00:00', closes: '00:00' });
    else for (const [opens, closes] of r.hours) out.push({ ...base, opens, closes });
  }
  return out;
}

export function jsonLd(b, ctx, date) {
  const a = b.address;
  const biz = { '@type': b.types.length === 1 ? b.types[0] : b.types };
  if (b.website) biz['@id'] = `${b.website}#verslas`;
  biz.name = b.name;
  if (b.alternateNames.length) biz.alternateName = b.alternateNames.length === 1 ? b.alternateNames[0] : b.alternateNames;
  if (b.content.description) biz.description = fill(b.content.description, ctx);
  if (b.website) biz.url = b.website;
  if (b.phone) biz.telephone = b.phone;
  if (b.email) biz.email = b.email;
  if (b.photos.length && b.website) biz.image = b.photos.map((p) => new URL(p.src, b.website).href);
  else if (b.publicFiles?.includes('og.png') && b.website) biz.image = `${b.website}og.png`;
  if (b.brand.logo && b.website) biz.logo = new URL(b.brand.logo.schemaSrc || b.brand.logo.src, b.website).href;
  if (b.priceRange) biz.priceRange = b.priceRange;
  biz.currenciesAccepted = 'EUR';
  if (b.payment?.length) biz.paymentAccepted = b.payment.join(', ');
  if (b.amenities?.length) biz.amenityFeature = b.amenities.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true }));
  if (b.cuisine.length) biz.servesCuisine = b.cuisine;
  biz.address = Object.fromEntries(
    Object.entries({
      '@type': 'PostalAddress',
      streetAddress: a.street,
      addressLocality: a.city,
      addressRegion: a.region,
      postalCode: a.postalCode,
      addressCountry: a.country,
    }).filter(([, v]) => v),
  );
  if (b.geo) biz.geo = { '@type': 'GeoCoordinates', latitude: b.geo.lat, longitude: b.geo.lng };
  biz.hasMap = mapsUrl(b);
  const spec = openingSpec(b.hours);
  if (spec.length) biz.openingHoursSpecification = spec;
  const special = specialSpec(b, date);
  if (special.length) biz.specialOpeningHoursSpecification = special;
  const same = socialLinks(b).map(([, url]) => url);
  if (same.length) biz.sameAs = same;

  const graph = [biz];
  const faq = faqAnswered(b, ctx);
  if (faq.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

export const jsonLdScript = (data) =>
  `<script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}\n</script>`;

export function robotsTxt(b) {
  return [
    '# Visi paieškos sistemų ir AI robotai laukiami.',
    'User-agent: *',
    'Allow: /',
    ...(b.website ? ['', `Sitemap: ${b.website}sitemap.xml`] : []),
    '',
  ].join('\n');
}

export function sitemapXml(b, date) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${b.website}</loc><lastmod>${date}</lastmod></url>
</urlset>
`;
}

// llms.txt – trumpa santrauka kalbos modeliams (llmstxt.org formatu).
export function llmsTxt(b, ctx, date) {
  const L = [];
  L.push(`# ${b.name}`, '');
  if (b.content.description) L.push(`> ${fill(b.content.description, ctx)}`, '');
  L.push(`- Adresas: ${addressPostal(b.address)}${b.address.landmark ? ` (${b.address.landmark})` : ''}`);
  L.push(`- Darbo laikas: ${hoursLT(b.hours)}`);
  if (b.phone) L.push(`- Telefonas: ${phoneDisplay(b.phone)}`);
  if (b.email) L.push(`- El. paštas: ${b.email}`);
  if (b.website) L.push(`- Svetainė: ${b.website}`);
  for (const [k, url] of socialLinks(b)) L.push(`- ${k[0].toUpperCase()}${k.slice(1)}: ${url}`);
  if (b.alternateNames.length) L.push(`- Kiti pavadinimai: ${b.alternateNames.join(', ')}`);
  const sh = noticeItems(b, date);
  const notes = activeNotices(b, date);
  if (sh.length || notes.length) {
    L.push('', '## Svarbi informacija', '');
    for (const x of sh) L.push(`- ${x.sentence}`);
    for (const n of notes) L.push(`- ${n.from ? `Nuo ${n.from}${n.to ? ` iki ${n.to}` : ''}: ` : n.to ? `Iki ${n.to}: ` : ''}${fill(n.text, ctx)}`);
    if (sh.length) L.push(`- Kitomis dienomis – įprastai: ${hoursOpenLT(b.hours)}.`);
  }
  if (b.menu.items.length) {
    L.push('', `## ${b.menu.title || 'Asortimentas'}`, '');
    for (const it of b.menu.items) L.push(`- ${it.name}`);
    if (b.menu.priceNote) L.push('', nbsp(b.menu.priceNote).replace(/\u00A0/g, ' '));
  }
  const ways = b.directions.filter((d) => d.text);
  if (b.content.where || ways.length) {
    L.push('', '## Kaip atvykti', '');
    if (b.content.where) L.push(fill(b.content.where, ctx));
    for (const d of ways) L.push(`- ${d.title}: ${fill(d.text, ctx)}`);
  }
  const faq = faqAnswered(b, ctx);
  if (faq.length) {
    L.push('', '## Dažni klausimai');
    for (const f of faq) L.push('', `### ${f.q}`, '', f.a);
  }
  if (b.content.en) L.push('', '## In English', '', fill(b.content.en, ctx));
  L.push('');
  return L.join('\n');
}

export const faviconSvg = (b) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 115"><polygon points="50,6 94,31 94,84 50,109 6,84 6,31" fill="${b.brand.colors.accent}"/></svg>\n`;
