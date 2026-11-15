// Papildomi svetainės failai: 404 puslapis, programėlės manifestas, kontakto kortelė, security.txt.
import { esc, addressShort, hoursLT, phoneDisplay } from './text.mjs';
import { mapsUrl } from './seo.mjs';

export function notFoundPage(b) {
  const c = b.brand.colors;
  const logo = b.brand.logo;
  return `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'">
<meta name="robots" content="noindex">
<title>Puslapis nerastas – ${esc(b.name)}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
@font-face{font-family:"Bricolage Grotesque";src:url(/fonts/bricolage-grotesque.woff2) format("woff2");font-weight:400 800;font-stretch:75% 100%;font-display:swap}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:32px 20px;background:${c.primary};color:${c.light};font-family:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;font-size:18px;line-height:1.5;text-align:center}
main{max-width:34rem}
.logo{display:inline-block;padding:14px 22px;background:${c.light};border-radius:16px}
.logo img{display:block;height:64px;width:auto}
h1{margin:34px 0 10px;font-size:clamp(34px,8vw,52px);font-stretch:78%;font-weight:800;line-height:1.05}
p{margin:0 0 26px;color:${c.light}}
.btn{display:inline-block;margin:6px;padding:14px 26px;border-radius:999px;background:${c.accent};color:${c.light};font-weight:700;text-decoration:none}
.btn.soft{background:transparent;box-shadow:inset 0 0 0 2px ${c.light}}
.btn:focus-visible{outline:3px solid #E8A33D;outline-offset:3px}
</style>
</head>
<body>
<main>${logo ? `
  <a class="logo" href="/"><img src="/${esc(logo.small || logo.src)}" alt="${esc(b.name)}" width="${logo.w}" height="${logo.h}"></a>` : ''}
  <h1>Tokio puslapio nėra</h1>
  <p>Gali būti, kad nuoroda pasenusi. Viskas apie ${esc(b.name)} – pagrindiniame puslapyje: ${esc(addressShort(b.address))}.</p>
  <a class="btn" href="/">Į pagrindinį puslapį</a>${b.phone ? `<a class="btn soft" href="tel:${esc(b.phone)}">Skambinti ${esc(phoneDisplay(b.phone))}</a>` : ''}
</main>
</body>
</html>
`;
}

export function webManifest(b) {
  const c = b.brand.colors;
  return `${JSON.stringify(
    {
      name: b.name,
      short_name: b.name.split(' ')[0].slice(0, 12),
      description: b.content.description || b.name,
      lang: 'lt',
      start_url: '/',
      scope: '/',
      display: 'minimal-ui',
      background_color: c.primary,
      theme_color: c.primary,
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  )}\n`;
}

// vCard 3.0: „Išsaugoti kontaktą telefone“
export function vCard(b) {
  const v = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  const a = b.address;
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${v(b.name)};;;`,
    `FN:${v(b.name)}`,
    `ORG:${v(b.name)}`,
    b.phone && `TEL;TYPE=WORK,VOICE:${b.phone}`,
    b.email && `EMAIL;TYPE=INTERNET,WORK:${b.email}`,
    `ADR;TYPE=WORK:;;${v(a.street)};${v(a.city)};${v(a.region || '')};${v(a.postalCode || '')};${a.country === 'LT' ? 'Lietuva' : v(a.country || '')}`,
    b.geo && `GEO:${b.geo.lat};${b.geo.lng}`,
    b.website && `URL:${b.website}`,
    `NOTE:${v(`${hoursLT(b.hours)}${a.landmark ? ` Kaip rasti: ${a.landmark}.` : ''} Žemėlapis: ${mapsUrl(b)}`)}`,
    'END:VCARD',
  ].filter(Boolean);
  return `${lines.join('\r\n')}\r\n`;
}

// RFC 9116: kam pranešti apie saugumo spragą. Galioja iki kitų metų pabaigos.
export function securityTxt(b, date) {
  if (!b.email || !b.website) return null;
  const year = Number(date.slice(0, 4)) + 1;
  return [
    `Contact: mailto:${b.email}`,
    `Expires: ${year}-12-31T22:00:00.000Z`,
    'Preferred-Languages: lt, en',
    `Canonical: ${b.website}.well-known/security.txt`,
    '',
  ].join('\n');
}
