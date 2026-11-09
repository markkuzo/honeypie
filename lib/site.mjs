// Svetainės šablonas („Korys“): visas turinys statiniame HTML, JavaScript tik papildo.
import { esc, nbsp, fill, cap, joinList, LT_SHORT, dayIv, ivShort, ivText, toMin, hoursLT, hoursOpenLT, phoneDisplay, rgba, mix } from './text.mjs';
import { icon, BEE } from './icons.mjs';
import { jsonLd, jsonLdScript, mapsUrl, wazeUrl, faqAnswered, socialLinks } from './seo.mjs';
import { noticeItems, activeNotices, specialForScript, MONTHS_GEN } from './special.mjs';

const SOCIAL = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube' };

// „11:00–18:00“ nelaužomas per brūkšnį
const noWrapTimes = (h) => h.replace(/(\d{1,2}:\d{2})–(\d{1,2}:\d{2})/g, '<span class="nw">$1–$2</span>');

const HEX_INFO = (cream) =>
  `<svg viewBox="0 0 24 27" aria-hidden="true"><polygon points="12,1 23,7.5 23,19.5 12,26 1,19.5 1,7.5" fill="currentColor"/><path d="M12 7.6v7.2" stroke="${cream}" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="19.2" r="1.65" fill="${cream}"/></svg>`;

const HEX_TOGGLE =
  '<svg viewBox="0 0 24 27" aria-hidden="true"><polygon points="12,1 23,7.5 23,19.5 12,26 1,19.5 1,7.5" fill="none" stroke="currentColor" stroke-width="2"/><path class="plus" d="M12 9v9M7.5 13.5h9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

function wordmark(b) {
  const wm = b.brand.wordmarkHtml || esc(b.name.toUpperCase());
  return `<span class="wm" aria-hidden="true">${wm}</span>${b.brand.tagline ? `\n      <small aria-hidden="true">${esc(b.brand.tagline)}</small>` : ''}`;
}

function routeSvg(b, K) {
  const r = b.route;
  if (!r) return '';
  const x0 = 34, x1 = 606;
  const xh = Math.round(x0 + (x1 - x0) * Math.min(0.9, Math.max(0.1, r.position ?? 0.5)));
  const xs = Math.round(r.position > 0.35 ? (x0 + xh) / 2 - 16 : (xh + x1) / 2);
  const title = `Schema: ${r.here} yra prie ${r.road} kelio tarp ${r.start} ir ${r.end}`;
  return `
      <svg class="map" viewBox="0 0 640 160" role="img" aria-labelledby="map-title">
        <title id="map-title">${esc(title)}</title>
        <path d="M${x0} 98H${x1}" stroke="${K.slate}" stroke-width="16" stroke-linecap="round"/>
        <path d="M${x0 + 10} 98H${x1 - 10}" stroke="${K.oat}" stroke-width="2.5" stroke-dasharray="16 12"/>
        <circle cx="${x0}" cy="98" r="12" fill="${K.paper}" stroke="${K.slate}" stroke-width="5"/>
        <circle cx="${x1}" cy="98" r="12" fill="${K.paper}" stroke="${K.slate}" stroke-width="5"/>
        <g transform="translate(${xs} 98)">
          <rect x="-27" y="-17" width="54" height="34" rx="6" fill="${K.terra}" stroke="${K.oat}" stroke-width="3"/>
          <text y="8.5" text-anchor="middle" style="fill:${K.cream};font-size:22px;font-weight:800">${esc(r.road)}</text>
        </g>
        <g transform="translate(${xh} 98)">
          <path d="M0 -24V-4" stroke="${K.terra}" stroke-width="4"/>
          <polygon points="0,-78 23,-65 23,-39 0,-26 -23,-39 -23,-65" fill="${K.terra}"/>
          <polygon points="0,-63 9.5,-57.5 9.5,-46.5 0,-41 -9.5,-46.5 -9.5,-57.5" fill="${K.cream}"/>
          <circle r="9" fill="${K.cream}" stroke="${K.terra}" stroke-width="5"/>
        </g>
        <text x="${x0}" y="146" text-anchor="start">${esc(r.start)}</text>
        <text x="${xh}" y="146" text-anchor="middle">${esc(r.here)}</text>
        <text x="${x1}" y="146" text-anchor="end">${esc(r.end)}</text>
      </svg>`;
}

export function renderSite(b, ctx, { date, draft = false, updated = date } = {}) {
  const c = b.brand.colors;
  const K = {
    slate: c.primary, ink: c.ink, paper: c.paper, oat: c.band, cream: c.light, terra: c.accent, terraLift: c.accentLift,
    off: mix(c.primary, c.light, 0.08), offText: mix(c.light, c.primary, 0.2), dockSoft: mix(c.primary, c.light, 0.12),
  };
  const L = (a) => rgba(c.light, a);
  const logo = b.brand.logo || null;
  const un = new Set(b.unconfirmed);
  const t = (s) => esc(nbsp(fill(s, ctx)));
  const v = (path, value) => (draft && un.has(path) ? `<mark>${esc(nbsp(value))}</mark>` : esc(nbsp(value)));
  const ph = (label) => (draft ? `<mark>[${esc(label)}]</mark>` : '');
  const a = b.address;
  const street = v('address.street', a.street);
  const addrShortHtml = `${street}, ${esc(a.city)}`;
  const addrLineHtml = [street, esc(a.city), esc(a.region)].filter(Boolean).join(', ');
  const maps = esc(mapsUrl(b));
  const waze = esc(wazeUrl(b));
  const tel = b.phone ? `tel:${esc(b.phone)}` : '';
  const title = fill(b.content.seoTitle, ctx) || `${b.name} – ${b.content.headline || ''}`;
  const desc = fill(b.content.seoDescription, ctx) || fill(b.content.description, ctx) || '';
  const ld = jsonLdScript(jsonLd(b, ctx, date));
  const ogImage = !b.website ? '' : b.publicFiles.includes('og.png') ? `${b.website}og.png` : b.photos.length ? new URL(b.photos[0].src, b.website).href : '';

  // Darbo laikas
  const cells = [0, 1, 2, 3, 4, 5, 6]
    .map((i) => {
      const iv = dayIv(b.hours, i);
      return `          <li${iv.length ? '' : ' class="off"'} data-d="${i + 1}" style="--i:${i}"><b>${LT_SHORT[i]}</b><span>${iv.length ? ivShort(iv) : 'nedirbame'}</span></li>`;
    })
    .join('\n');
  const cfg = {
    tz: b.timezone,
    h: [0, 1, 2, 3, 4, 5, 6].map((i) => dayIv(b.hours, i).map(([o, cl]) => [toMin(o), toMin(cl)])),
    s: specialForScript(b, date, toMin),
    m: MONTHS_GEN,
  };

  // Svarbi informacija: ypatingas darbo laikas ir pranešimai (pasibaigę pasislepia patys)
  const shItems = noticeItems(b, date);
  const notes = activeNotices(b, date);
  const futureNote = (n) => n.from && n.from > date;
  const allLater = !shItems.length && notes.length && notes.every(futureNote);
  const notice = shItems.length || notes.length
    ? `
    <section class="notice" id="svarbu" aria-labelledby="svarbu-h"${allLater ? ' hidden' : ''}>
      <h2 id="svarbu-h">${HEX_INFO(K.cream)}Svarbi informacija</h2>
      <ul>
${[
  ...shItems.map((x) => `        <li class="sh" data-to="${x.to}"><b>${esc(nbsp(x.when))}</b> ${noWrapTimes(esc(nbsp(x.sentence.slice(x.when.length + 1))))}</li>`),
  ...notes.map((n) => `        <li${n.from ? ` data-from="${esc(n.from)}"` : ''}${n.to ? ` data-to="${esc(n.to)}"` : ''}${futureNote(n) ? ' hidden' : ''}>${t(n.text)}</li>`),
].join('\n')}
      </ul>${shItems.length ? `\n      <p class="notice-foot">Kitomis dienomis – įprastai: ${esc(hoursOpenLT(b.hours))}.</p>` : ''}
    </section>
`
    : '';
  const bee = b.brand.mascot === 'bee';

  // Kaip rasti
  const ways = b.directions.filter((d) => d.text || draft);
  const waysHtml = ways.length
    ? `
      <ul class="ways">
${ways
  .map(
    (d) => `        <li>
          ${icon(d.icon)}
          <div><h3>${esc(d.title)}</h3><p>${d.text ? t(d.text) : ph('trūksta aprašymo')}</p></div>
        </li>`,
  )
  .join('\n')}
      </ul>`
    : '';

  const localMap = b.localMap?.svg
    ? `
      <figure class="local">
        ${b.localMap.svg.trim()}${b.localMap.caption ? `\n        <figcaption>${t(b.localMap.caption)}</figcaption>` : ''}
      </figure>`
    : '';

  // Nuotraukos pagal vietą puslapyje
  const imgTag = (ph_, sizes, lazy = true) =>
    `<img src="${esc(ph_.small || ph_.src)}"${ph_.small ? ` srcset="${esc(ph_.small)} ${Math.round(ph_.w / 2)}w, ${esc(ph_.src)} ${ph_.w}w" sizes="${sizes}"` : ''} alt="${esc(ph_.alt || '')}" width="${ph_.w}" height="${ph_.h}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
  const menuPhotos = b.photos.filter((x) => x.role === 'menu');
  const findPhotos = b.photos.filter((x) => x.role === 'find');
  const galleryPhotos = b.photos.filter((x) => !x.role || x.role === 'gallery');
  // Pirmoji „wide“ nuotrauka – didžioji šalia sąrašo, kitos – juostoje po juo.
  const tileCap = (x) => (x.caption ? `<figcaption>${t(x.caption)}</figcaption>` : '');
  const lead = menuPhotos.find((x) => x.wide) || null;
  const rest = menuPhotos.filter((x) => x !== lead);
  const leadHtml = lead
    ? `
        <figure class="tile big">${imgTag(lead, '(min-width: 900px) 660px, 100vw')}${tileCap(lead)}</figure>`
    : '';
  const mosaic = rest.length
    ? `
        <div class="mosaic">
${rest.map((x) => `          <figure class="tile">${imgTag(x, '(min-width: 900px) 280px, 50vw')}${tileCap(x)}</figure>`).join('\n')}
        </div>`
    : '';
  const findPhotoHtml = findPhotos
    .map((x) => `
      <figure class="find-photo">
        ${imgTag(x, '(min-width: 900px) 560px, 100vw')}${x.caption ? `\n        <figcaption>${t(x.caption)}</figcaption>` : ''}
      </figure>`)
    .join('');

  // Asortimentas
  const menu = b.menu.items.length
    ? `
  <section class="bake" id="asortimentas">
    <div class="wrap">
      <h2>${esc(b.menu.title || 'Ką siūlome')}</h2>
      <div class="bake-grid${menuPhotos.length ? ' has-photos' : ''}${lead ? ' has-big' : ''}">${leadHtml}${mosaic}
        <div class="bake-list">
          <ul class="menu">
${b.menu.items.map((it) => `            <li>${icon(it.icon)}<span>${t(it.name)}</span></li>`).join('\n')}
          </ul>${b.menu.priceNote ? `\n          <p class="price">${t(b.menu.priceNote)}</p>` : ''}${b.menu.note ? `\n          <p>${t(b.menu.note)}</p>` : ''}
        </div>
      </div>
    </div>
  </section>
`
    : '';

  // Užsakymai (pvz. tortai): grupės, kaina, pastaba ir kaip užsakyti
  const om = b.orderMenu;
  const omGroups = (om?.groups || []).filter((g) => g.items?.length);
  const fb = b.social?.facebook;
  const orders = omGroups.length
    ? `
  <section class="order" id="${esc(om.id || 'uzsakymai')}" aria-labelledby="order-h">
    <div class="wrap">
      <div class="order-card">
        <div class="order-head">
          <h2 id="order-h">${esc(om.title || 'Užsakymai')}</h2>${om.price?.text ? `
          <p class="order-price" aria-label="Kaina ${esc(om.price.text)}"><span>${esc(om.price.text.split('/')[0].trim())}</span>${om.price.text.includes('/') ? `<small>/ ${esc(om.price.text.split('/')[1].trim())}</small>` : ''}</p>` : ''}
        </div>${om.intro ? `
        <p class="order-intro">${t(om.intro)}</p>` : ''}
        <div class="order-groups">
${omGroups
  .map(
    (g) => `          <div>${g.title ? `
            <h3>${esc(g.title)}</h3>` : ''}
            <ul>
${g.items.map((it) => `              <li>${t(it.name)}${it.tag ? ` <span class="tag">${esc(it.tag)}</span>` : ''}</li>`).join('\n')}
            </ul>
          </div>`,
  )
  .join('\n')}
        </div>${om.note ? `
        <p class="order-note">${t(om.note)}</p>` : ''}${b.phone || fb ? `
        <p class="actions">${b.phone ? `<a class="btn" href="tel:${esc(b.phone)}">Skambinti ${esc(phoneDisplay(b.phone))}</a>` : ''}${fb ? `<a class="btn soft" href="${esc(fb)}">Rašyti Facebook</a>` : ''}</p>` : ''}
      </div>
    </div>
  </section>
`
    : '';

  // Nuotraukos
  const gallery = galleryPhotos.length
    ? `
  <section class="gallery" id="nuotraukos">
    <div class="wrap">
      <h2>Nuotraukos</h2>
      <ul class="photos">
${galleryPhotos.map((x) => `        <li>${imgTag(x, '(min-width: 900px) 25vw, 50vw')}</li>`).join('\n')}
      </ul>
    </div>
  </section>
`
    : '';

  // Apie
  const social = socialLinks(b);
  const socialSentence = social.length
    ? ` ${esc(b.content.socialIntro || 'Naujienas skelbiame')} ${joinList(social.map(([k, url]) => `<a href="${esc(url)}">${SOCIAL[k] || esc(k)}</a>`))}.`
    : draft ? ` ${ph('Facebook ir Instagram nuorodos')}` : '';
  const about = b.content.about
    ? `
  <section class="about" id="apie">
    <div class="wrap measure">
      <h2>Apie mus</h2>
      <p>${t(b.content.about)}${socialSentence}</p>
    </div>
  </section>
`
    : '';

  // DUK
  const faqItems = draft ? b.faq.filter((f) => f.q) : faqAnswered(b, ctx).map((f) => ({ q: f.q, a: f.a, filled: true }));
  const faq = faqItems.length
    ? `
  <section class="faq" id="klausimai">
    <div class="wrap measure">
      <h2>Dažni klausimai</h2>
${faqItems
  .map(
    (f) => `      <details>
        <summary>${esc(f.q)}${HEX_TOGGLE}</summary>
        <p>${f.a ? (f.filled ? esc(nbsp(f.a)) : t(f.a)) : ph('trūksta atsakymo')}</p>
      </details>`,
  )
  .join('\n')}
    </div>
  </section>
`
    : '';

  const en = b.content.en
    ? `
  <section class="en" id="english" lang="en">
    <div class="wrap measure">
      <h2>In English</h2>
      <p>${t(b.content.en)}</p>
    </div>
  </section>
`
    : '';

  const telLine = b.phone
    ? `<span class="tel">Tel. <a href="${tel}">${esc(phoneDisplay(b.phone))}</a></span>`
    : draft ? `<span class="tel">Tel. ${ph('telefonas')}</span>` : '';

  const footSocial = social.map(([k, url]) => `<a href="${esc(url)}">${SOCIAL[k] || esc(k)}</a>`).join('<br>');
  const legal = b.legal?.name ? `${esc(b.legal.name)}${b.legal.code ? `, įmonės kodas ${esc(b.legal.code)}` : ''}<br>` : '';

  return `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">${draft ? '\n<meta name="robots" content="noindex">' : ''}${b.website ? `\n<link rel="canonical" href="${esc(b.website)}">` : ''}
<meta name="theme-color" content="${K.slate}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">${b.publicFiles.includes('favicon-48.png') ? '\n<link rel="icon" href="favicon-48.png" sizes="48x48" type="image/png">' : ''}${b.publicFiles.includes('apple-touch-icon.png') ? '\n<link rel="apple-touch-icon" href="apple-touch-icon.png">' : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="lt_LT">
<meta property="og:site_name" content="${esc(b.name)}">
<meta property="og:title" content="${esc(b.name)} – ${esc(b.content.headline || '')}">
<meta property="og:description" content="${esc(desc)}">${b.website ? `\n<meta property="og:url" content="${esc(b.website)}">` : ''}${ogImage ? `\n<meta property="og:image" content="${esc(ogImage)}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&amp;display=swap" rel="stylesheet">

${ld}

<style>
  :root {
    --slate: ${K.slate};
    --ink: ${K.ink};
    --paper: ${K.paper};
    --oat: ${K.oat};
    --cream: ${K.cream};
    --terra: ${K.terra};
    --terra-lift: ${K.terraLift};
    --line: ${rgba(c.ink, 0.15)};
    --focus: #E8A33D;
    --font: "Bricolage Grotesque", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --w: 74px;
    --gap: 6px;
  }
  *, *::before, *::after { box-sizing: border-box; }
  [hidden] { display: none !important; }
  html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
  body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--font); font-size: 18px; line-height: 1.55; font-optical-sizing: auto; -webkit-font-smoothing: antialiased; }
  .wrap { width: min(1120px, 100% - 40px); margin-inline: auto; }
  .measure > * { max-width: 46rem; }
  a { color: var(--terra); text-underline-offset: .18em; }
  :focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
  mark { background: #FFE08A; color: #1F2B2A; padding: 0 .25em; border-radius: 3px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .draft { margin: 0; background: #FFE08A; color: #1F2B2A; font-size: 14px; padding: 10px 20px; }

  .hero { background: var(--slate); color: var(--cream); padding: 22px 0 64px; }
  .hero-top { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .brand { color: inherit; text-decoration: none; display: inline-flex; flex-direction: column; align-items: center; line-height: 1; }
  .brand .wm { display: flex; align-items: center; font-weight: 800; font-size: 24px; letter-spacing: .07em; }
  .brand svg { width: 18px; height: 21px; margin: 0 2px; color: var(--terra-lift); }
  .brand small { font-size: 10px; font-weight: 600; letter-spacing: .42em; padding-left: .42em; opacity: .72; margin-top: 6px; }
  .lang { color: var(--cream); font-size: 15px; text-decoration: none; padding: 10px 0; border-bottom: 1px solid ${L(0.35)}; }

  .hero-grid { display: grid; gap: 44px; margin-top: 40px; }
  h1 { margin: 0; font-size: clamp(44px, 12.6vw, 92px); font-stretch: 75%; font-weight: 800; line-height: .92; letter-spacing: -.012em; }
  .lead { margin: 18px 0 0; font-size: 20px; line-height: 1.45; max-width: 31ch; color: ${L(0.88)}; }
  .where { margin: 30px 0 0; font-size: 23px; font-weight: 700; line-height: 1.25; }
  .where .tel { display: block; margin-top: 6px; font-size: 16px; font-weight: 400; color: ${L(0.85)}; }
  .where .tel a { color: inherit; }
  .where .near { display: block; margin-top: 4px; font-size: 17px; font-weight: 500; color: ${L(0.88)}; }

  .actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0 0; }
  .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 50px; padding: 0 26px; font-size: 17px; font-weight: 650; text-decoration: none; background: var(--terra); color: var(--cream); clip-path: polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%); }
  .btn.soft { background: ${L(0.13)}; }
  .btn:hover { background: var(--terra-lift); }
  .btn.soft:hover { background: ${L(0.22)}; }
  .btn:focus-visible { outline: none; background: var(--cream); color: var(--slate); }

  .status { display: flex; align-items: center; gap: 12px; margin: 0 0 20px; font-size: 21px; font-weight: 700; line-height: 1.25; }
  .status .dot { flex: none; width: 12px; height: 12px; border-radius: 50%; background: #E39A7F; }
  .status.open .dot { background: #8ED1A0; }
  .comb-wrap { position: relative; width: fit-content; }
  .comb { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; column-gap: var(--gap); width: calc(4 * var(--w) + 3 * var(--gap) + 1px); }
  .comb li { width: var(--w); height: calc(var(--w) * 1.1547); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); background: var(--terra); color: var(--cream); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; line-height: 1.12; }
  .comb li:nth-child(n+5) { margin-top: calc(var(--w) * -.2887 + var(--gap) * .866); }
  .comb li:nth-child(5) { margin-left: calc((var(--w) + var(--gap)) / 2); }
  .comb li.off { background: ${K.off}; color: ${K.offText}; }
  .comb li.today { background: var(--cream); color: var(--slate); }
  .comb b { font-size: 17px; font-weight: 800; }
  .comb span { font-size: 12.5px; }
  .bee { position: absolute; width: 34px; height: 28px; pointer-events: none; }
  .hours-note { margin: 22px 0 0; font-size: 16px; color: ${L(0.85)}; }
  .notice { background: var(--cream); color: var(--ink); border-radius: 16px; padding: 20px 20px 18px; }
  .notice h2 { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; font-size: 22px; font-stretch: 100%; font-weight: 800; line-height: 1.2; letter-spacing: 0; }
  .notice h2 svg { flex: none; width: 24px; height: 27px; color: var(--terra); }
  .notice ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 9px; }
  .notice li { position: relative; padding-left: 20px; font-size: 17px; line-height: 1.45; }
  .notice li::before { content: ""; position: absolute; left: 1px; top: .5em; width: 9px; height: 10.4px; background: var(--terra); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); }
  .notice b { font-weight: 750; }
  .nw { white-space: nowrap; }
  .notice-foot { margin: 14px 0 0; padding-top: 12px; border-top: 1px solid var(--line); font-size: 15.5px; color: ${rgba(c.ink, 0.78)}; }

  h2 { margin: 0 0 18px; font-size: clamp(36px, 8vw, 56px); font-stretch: 78%; font-weight: 800; line-height: .98; letter-spacing: -.01em; }
  h3 { margin: 0 0 4px; font-size: 19px; line-height: 1.3; font-weight: 700; }

  .route { background: var(--oat); padding: 64px 0 56px; }
  .route .intro { margin: 0 0 8px; font-size: 19px; }
  .map { display: block; width: 100%; max-width: 760px; height: auto; margin: 18px 0 30px; }
  .map text { font-family: var(--font); fill: var(--ink); font-weight: 700; font-size: 25px; }
  .ways { list-style: none; margin: 0; padding: 0; display: grid; }
  .ways li { display: grid; grid-template-columns: 44px 1fr; align-content: start; gap: 14px; padding: 18px 0; border-top: 1px solid var(--line); }
  .ways svg { width: 40px; height: 40px; color: var(--slate); }
  .ways p { margin: 0; }

  .find.has-map { display: grid; gap: 8px; }
  .local { margin: 4px 0 18px; }
  .lm { display: block; width: 100%; height: auto; }
  .local figcaption { margin-top: 10px; font-size: 17px; font-weight: 600; line-height: 1.4; }
  .lm-bg { fill: var(--paper); }
  .lm-bld path { fill: ${rgba(c.ink, 0.1)}; }
  .lm-lot { fill: ${rgba(c.primary, 0.16)}; stroke: ${rgba(c.primary, 0.45)}; stroke-width: 1; stroke-dasharray: 3 3; }
  .lm-casing { fill: none; stroke: ${rgba(c.ink, 0.16)}; stroke-width: 17; stroke-linecap: round; stroke-linejoin: round; }
  .lm-street { fill: none; stroke: var(--cream); stroke-width: 14; stroke-linecap: round; stroke-linejoin: round; }
  .lm-drive { fill: none; stroke: var(--cream); stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; }
  .lm-landmark { fill: ${rgba(c.ink, 0.42)}; }
  .lm-kc { fill: var(--slate); }
  .lm-hp { fill: var(--terra); stroke: var(--cream); stroke-width: 1.6; }
  .lm-hp-dot { fill: var(--cream); }
  .lm-house { fill: ${rgba(c.ink, 0.26)}; }
  .lm-num { font-size: 9.5px; font-weight: 800; }
  .lm-route { fill: none; stroke: var(--terra); stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 0.1 7; }
  .lm-arrowhead { fill: var(--terra); }
  .lm-walk { fill: none; stroke: var(--ink); stroke-width: 2; stroke-linecap: round; stroke-dasharray: 0.1 4.6; }
  .lm-door { stroke: var(--ink); stroke-width: 3.4; stroke-linecap: round; }
  .lm-p rect { fill: var(--slate); }
  .lm-p text { fill: var(--cream); font: 800 11px var(--font); }
  .lm-t { font-family: var(--font); fill: var(--ink); paint-order: stroke; stroke: var(--paper); stroke-width: 3px; stroke-linejoin: round; }
  .lm-small { font-size: 11.5px; font-weight: 650; }
  .lm-street-name { font-size: 10.5px; font-weight: 650; stroke: var(--cream); }
  .lm-iki { font: 800 11px var(--font); fill: var(--cream); }
  .lm-callout path { fill: none; stroke: var(--ink); stroke-width: 1.3; }
  .lm-callout rect { fill: var(--slate); }
  .lm-callout-hp rect { fill: var(--terra); }
  .lm-callout text { font: 700 12.5px var(--font); fill: var(--cream); }
  .lm-north path { fill: var(--ink); }
  .lm-north text { font: 700 11px var(--font); fill: var(--ink); }
  .lm-attr { font: 400 8px var(--font); fill: ${rgba(c.ink, 0.65)}; }

  .bake { padding: 72px 0 8px; }
  .menu { list-style: none; margin: 6px 0 22px; padding: 0; display: grid; }
  .menu li { display: grid; grid-template-columns: 50px 1fr; align-items: center; gap: 14px; padding: 13px 0; border-bottom: 1px solid var(--line); font-size: 20px; font-weight: 600; line-height: 1.3; }
  .menu svg { width: 44px; height: 44px; color: var(--terra); }
  .price { margin: 0 0 8px; font-size: 21px; font-weight: 700; }
  .bake p { max-width: 46rem; }

  .topbar { background: var(--paper); }
  .topbar-in { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 10px 0; }
  .brand-logo { display: block; line-height: 0; }
  .brand-logo img { display: block; height: 62px; width: auto; }
  .topbar .lang { color: var(--ink); border-bottom: 0; text-decoration: underline; text-decoration-thickness: 1px; text-decoration-color: ${rgba(c.ink, 0.45)}; text-underline-offset: 5px; }
  .hero.has-logo { padding-top: 0; }
  .brand-badge { display: inline-block; justify-self: start; align-self: start; padding: 10px 14px; border-radius: 14px; background: var(--paper); line-height: 0; }
  .brand-badge img { height: 54px; width: auto; }

  .bake-grid.has-photos { display: grid; gap: 22px; }
  .mosaic { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .tile { position: relative; margin: 0; overflow: hidden; border-radius: 12px; background: var(--oat); }
  .tile img { display: block; width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; }
  .tile.big img { aspect-ratio: 4 / 3; }
  .big + .mosaic { margin-top: -14px; }
  .mosaic .tile:last-child:nth-child(odd) { grid-column: span 2; }
  .mosaic .tile:last-child:nth-child(odd) img { aspect-ratio: 2 / 1; }
  .tile figcaption { position: absolute; left: 8px; bottom: 8px; max-width: calc(100% - 16px); padding: 4px 10px; border-radius: 999px; background: ${rgba(c.primary, 0.9)}; color: var(--cream); font-size: 14px; font-weight: 600; line-height: 1.3; }
  .find-photo { margin: 6px 0 18px; }
  .find-photo img { display: block; width: 100%; height: auto; border-radius: 14px; background: var(--oat); }
  .find-photo figcaption { margin-top: 10px; font-size: 18px; font-weight: 700; }

  .order { padding-top: 64px; }
  .order-card { background: var(--slate); color: var(--cream); border-radius: 20px; padding: 28px 22px 26px; }
  .order-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .order h2 { margin: 0; color: var(--cream); }
  .order-price { flex: none; margin: 0; width: 92px; height: 106px; clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); background: var(--terra); display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.05; text-align: center; }
  .order-price span { font-size: 25px; font-weight: 800; }
  .order-price small { font-size: 15px; font-weight: 600; }
  .order-intro { margin: 16px 0 6px; font-size: 18px; color: ${L(0.9)}; }
  .order-groups { display: grid; gap: 8px 48px; }
  .order h3 { margin: 18px 0 6px; font-size: 15px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: ${mix(K.terraLift, K.cream, 0.45)}; }
  .order ul { list-style: none; margin: 0; padding: 0; }
  .order li { position: relative; padding: 10px 0 10px 24px; border-bottom: 1px solid ${L(0.16)}; font-size: 19px; font-weight: 600; line-height: 1.35; }
  .order li::before { content: ""; position: absolute; left: 2px; top: 1.05em; width: 10px; height: 11.5px; background: var(--terra-lift); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); }
  .order .tag { display: inline-block; margin-left: 6px; padding: 1px 9px; border: 1px solid ${L(0.4)}; border-radius: 999px; font-size: 13.5px; font-weight: 500; color: ${L(0.85)}; vertical-align: 2px; white-space: nowrap; }
  .order-note { margin: 20px 0 0; font-size: 16px; color: ${L(0.82)}; max-width: 46rem; }
  .order .actions { margin: 22px 0 0; }

  .gallery { padding-top: 64px; }
  .photos { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .photos img { display: block; width: 100%; height: 100%; aspect-ratio: 1; object-fit: cover; }

  .about, .faq, .en { padding-top: 64px; }
  .faq details { border-top: 1px solid var(--line); }
  .faq details:last-of-type { border-bottom: 1px solid var(--line); }
  .faq summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 17px 0; font-size: 19px; font-weight: 700; }
  .faq summary::-webkit-details-marker { display: none; }
  .faq summary svg { flex: none; width: 24px; height: 27px; color: var(--terra); }
  .faq .plus { transform-box: fill-box; transform-origin: center; transition: transform .2s ease; }
  .faq details[open] .plus { transform: rotate(45deg); }
  .faq details p { margin: 0 0 18px; }
  .en { padding-bottom: 8px; }

  footer { margin-top: 80px; background: var(--slate); color: var(--cream); padding: 52px 0 44px; font-size: 15px; }
  footer a { color: var(--cream); }
  .foot { display: grid; gap: 26px; }
  .foot p { margin: 0; }
  .foot .brand { align-items: flex-start; }
  .foot .brand small { padding-left: 0; }
  .legal { color: ${L(0.7)}; }

  .dock { display: none; }

  @media (min-width: 900px) {
    :root { --w: 96px; --gap: 8px; }
    .hero { padding: 26px 0 88px; }
    .hero-grid { grid-template-columns: 1.15fr .85fr; align-items: center; gap: 56px; margin-top: 64px; }
    .hero-grid .notice { grid-column: 1 / -1; grid-row: 2; padding: 24px 28px 22px; }
    .order-card { padding: 40px 44px 38px; }
    .order-groups { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .order-price { width: 108px; height: 124.7px; }
    .order-price span { font-size: 30px; }
    .notice ul { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 44px; }
    .comb b { font-size: 21px; }
    .comb span { font-size: 14.5px; }
    .bee { width: 40px; height: 33px; }
    .ways { grid-template-columns: repeat(3, 1fr); gap: 32px; }
    .ways li { grid-template-columns: 1fr; border-top: 2px solid var(--ink); padding-top: 20px; }
    .find.has-map { grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 44px; align-items: start; }
    .find.has-map .ways { grid-template-columns: 1fr; gap: 0; }
    .find.has-map .ways li { grid-template-columns: 44px 1fr; border-top: 1px solid var(--line); padding-top: 18px; }
    .menu { grid-template-columns: 1fr 1fr; column-gap: 48px; }
    .bake-grid.has-photos { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 48px; align-items: start; }
    .bake-grid.has-photos .mosaic { order: 2; }
    .bake-grid.has-photos .menu { grid-template-columns: 1fr; }
    .bake-grid.has-big { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-areas: "list list" "big strip"; gap: 8px; }
    .bake-grid.has-big .bake-list { grid-area: list; padding-bottom: 22px; }
    .bake-grid.has-big .menu { grid-template-columns: 1fr 1fr; column-gap: 48px; }
    .bake-grid.has-big .big { grid-area: big; aspect-ratio: 1; }
    .bake-grid.has-big .big img { position: absolute; inset: 0; width: 100%; height: 100%; aspect-ratio: auto; }
    .bake-grid.has-big .mosaic { grid-area: strip; margin-top: 0; }
    .find-photo { display: grid; grid-template-columns: minmax(0, 0.52fr) minmax(0, 0.48fr); align-items: end; gap: 22px; margin-top: 26px; }
    .find-photo figcaption { margin: 0 0 6px; padding-top: 12px; border-top: 2px solid var(--ink); font-size: 20px; line-height: 1.3; }
    .brand-logo img { height: 74px; }
    .photos { grid-template-columns: repeat(4, 1fr); }
    .foot { grid-template-columns: 1.2fr 1fr 1fr; align-items: start; }
  }
  @media (min-width: 1200px) {
    .bake-grid.has-big { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); grid-template-areas: "list big" "strip strip"; gap: 8px 48px; align-items: stretch; }
    .bake-grid.has-big .bake-list { padding-bottom: 26px; }
    .bake-grid.has-big .menu { grid-template-columns: 1fr; }
    .bake-grid.has-big .big { aspect-ratio: auto; min-height: 22rem; }
    .bake-grid.has-big .mosaic { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
    .bake-grid.has-big .mosaic .tile:last-child:nth-child(odd) { grid-column: auto; }
    .bake-grid.has-big .mosaic .tile img { aspect-ratio: 1; }
  }
  @media (max-width: 760px) {
    .dock { display: flex; gap: 8px; position: fixed; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 10; padding: 8px; background: var(--slate); border-radius: 16px; box-shadow: 0 10px 30px ${rgba(c.ink, 0.28)}; visibility: hidden; transform: translateY(150%); transition: transform .3s ease, visibility 0s linear .3s; }
    .dock.show { visibility: visible; transform: none; transition: transform .3s ease; }
    .dock .btn { flex: 1; }
    .dock .btn.soft { background: ${K.dockSoft}; }
    .actions .btn { flex: 1 1 auto; }
    footer { padding-bottom: 116px; }
  }
  @media (max-width: 360px) {
    :root { --w: 62px; }
    .comb b { font-size: 15px; }
    .comb span { font-size: 11px; }
    .dock .btn { padding: 0 16px; font-size: 16px; white-space: nowrap; }
    .mosaic .tile figcaption { left: 6px; bottom: 6px; max-width: calc(100% - 12px); padding: 3px 8px; font-size: 12.5px; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .js .comb li { animation: pop .55s cubic-bezier(.2, .9, .3, 1.25) both; animation-delay: calc(var(--i) * 70ms + 120ms); }
    .bee.fly { animation: fly 1.2s cubic-bezier(.3, .7, .3, 1) .75s both; }
    .status.open .dot { animation: pulse 2.4s ease-out infinite; }
  }
  @keyframes pop { from { opacity: 0; transform: scale(.55); } }
  @keyframes fly { 0% { opacity: 0; transform: translate(-90px, -70px) rotate(-25deg); } 55% { opacity: 1; transform: translate(-18px, -26px) rotate(14deg); } 80% { transform: translate(3px, -4px) rotate(-6deg); } 100% { transform: none; } }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(142, 209, 160, .55); } 70%, 100% { box-shadow: 0 0 0 12px rgba(142, 209, 160, 0); } }
</style>
</head>
<body>
${draft ? '\n<p class="draft">Juodraštis peržiūrai. Geltonai pažymėti duomenys, kuriuos dar reikia patikslinti arba įrašyti.</p>\n' : ''}
<header class="hero${logo ? ' has-logo' : ''}">${logo ? `
  <div class="topbar">
    <div class="wrap topbar-in">
      <a class="brand-logo" href="#"><img src="${esc(logo.src)}" alt="${esc(b.name)}" width="${logo.w}" height="${logo.h}" fetchpriority="high"></a>${b.content.en ? '\n      <a class="lang" href="#english" lang="en">English</a>' : ''}
    </div>
  </div>` : `
  <div class="wrap hero-top">
    <a class="brand" href="#" aria-label="${esc(b.name)}, puslapio pradžia">
      ${wordmark(b)}
    </a>${b.content.en ? '\n    <a class="lang" href="#english" lang="en">English</a>' : ''}
  </div>`}

  <div class="wrap hero-grid">
    <div>
      <h1>${t(b.content.headline || b.name)}</h1>${b.content.lead ? `\n      <p class="lead">${t(b.content.lead)}</p>` : ''}
      <p class="where">${addrShortHtml}${a.landmark ? `<span class="near">${esc(cap(a.landmark))}</span>` : ''}${telLine}</p>
      <p class="actions" id="actions">
        <a class="btn" href="${maps}">Google Maps</a>
        <a class="btn soft" href="${waze}">Waze</a>${b.phone ? `\n        <a class="btn soft" href="${tel}">Skambinti</a>` : ''}
      </p>
    </div>
${notice}
    <div class="hours">
      <p class="status" id="status" hidden><span class="dot"></span><span id="status-text"></span></p>
      <div class="comb-wrap">
        <ul class="comb" id="comb" aria-label="Darbo laikas pagal savaitės dienas">
${cells}
        </ul>${bee ? `\n        ${BEE}` : ''}
      </div>
      <p class="hours-note">${esc(hoursLT(b.hours))}</p>
    </div>
  </div>
</header>

<main>

  <section class="route" id="kaip-rasti">
    <div class="wrap">
      <h2>Kaip mus rasti</h2>
      <p class="intro">${b.content.where ? `${t(b.content.where)} ` : ''}Mus rasite adresu ${addrLineHtml}${/\.(<\/mark>)?$/.test(addrLineHtml) ? '' : '.'}</p>${routeSvg(b, K)}
      <div class="find${b.localMap?.svg || findPhotoHtml ? ' has-map' : ''}">
        <div class="find-visuals">${localMap}${findPhotoHtml}
        </div>${waysHtml}
      </div>
    </div>
  </section>
${menu}${orders}${gallery}${about}${faq}${en}
</main>

<footer>
  <div class="wrap foot">${logo ? `
    <a class="brand-badge" href="#"><img src="${esc(logo.src)}" alt="${esc(b.name)}" width="${logo.w}" height="${logo.h}" loading="lazy"></a>` : `
    <a class="brand" href="#" aria-label="${esc(b.name)}, puslapio pradžia">
      ${wordmark(b)}
    </a>`}
    <p>${esc(b.name)}<br>${addrLineHtml}<br>${esc(cap(hoursOpenLT(b.hours)))}${b.phone ? `<br><a href="${tel}">${esc(phoneDisplay(b.phone))}</a>` : ''}${b.email ? `<br><a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : ''}</p>
    <p>${footSocial ? `${footSocial}<br>` : ''}<span class="legal">${legal}Atnaujinta ${esc(updated)}</span></p>
  </div>
</footer>

<nav class="dock" id="dock" aria-label="Greiti veiksmai">
  <a class="btn" href="${maps}">Rodyti kelią</a>${b.phone ? `\n  <a class="btn soft" href="${tel}">Skambinti</a>` : ''}
</nav>

<script>
(function () {
  var C = ${JSON.stringify(cfg)};
  var ACC = ['pirmadienį', 'antradienį', 'trečiadienį', 'ketvirtadienį', 'penktadienį', 'šeštadienį', 'sekmadienį'];
  document.documentElement.classList.add('js');
  var p = {};
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: C.tz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
  } catch (e) { return; }
  var day = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[p.weekday];
  var mins = parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);
  if (day === undefined || isNaN(mins)) return;
  function iso(k) { return new Date(Date.UTC(+p.year, +p.month - 1, +p.day + k)).toISOString().slice(0, 10); }
  function ivs(k) { var s = C.s[iso(k)]; return s !== undefined ? s : C.h[(day + k) % 7]; }
  function hm(m) { return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
  function hs(m) { return Math.floor(m / 60) + (m % 60 ? ':' + ('0' + (m % 60)).slice(-2) : ''); }
  function when(k) { var d = iso(k); return k === 1 ? 'rytoj' : k <= 6 ? ACC[(day + k) % 7] : C.m[+d.slice(5, 7) - 1] + ' ' + (+d.slice(8, 10)) + ' d.'; }

  var today = ivs(0), text, isOpen = false, i;
  for (i = 0; i < today.length; i++) if (mins >= today[i][0] && mins < today[i][1]) { isOpen = true; text = 'Dabar atidaryta, iki ' + hm(today[i][1]); }
  if (!isOpen) {
    for (i = 0; i < today.length; i++) if (mins < today[i][0]) { text = 'Šiandien atidarome ' + hm(today[i][0]); break; }
  }
  if (!text) {
    for (var k = 1; k <= 120; k++) {
      var n = ivs(k);
      if (n.length) { text = (today.length ? 'Šiandien jau uždaryta. ' : 'Šiandien nedirbame. ') + 'Atidarysime ' + when(k) + ' ' + hm(n[0][0]); break; }
    }
  }
  if (text) {
    var st = document.getElementById('status');
    document.getElementById('status-text').textContent = text;
    st.classList.toggle('open', isOpen);
    st.hidden = false;
  }

  // Korys rodo artimiausias 7 dienas: šventės ir kiti pakeitimai matomi iškart.
  for (var j = 0; j < 7; j++) {
    var sp = C.s[iso(j)];
    var li = sp && document.querySelector('#comb [data-d="' + ((day + j) % 7 + 1) + '"]');
    if (!li) continue;
    li.classList.toggle('off', !sp.length);
    li.querySelector('span').textContent = sp.length ? sp.map(function (x) { return hs(x[0]) + '–' + hs(x[1]); }).join(' ') : 'nedirbame';
    document.getElementById('comb').setAttribute('aria-label', 'Darbo laikas artimiausias 7 dienas');
  }

  var nt = document.getElementById('svarbu');
  if (nt) {
    var td = iso(0), shown = 0, sh = 0;
    [].forEach.call(nt.querySelectorAll('li'), function (x) {
      var f = x.getAttribute('data-from'), t = x.getAttribute('data-to');
      x.hidden = !!((t && t < td) || (f && f > td));
      if (!x.hidden) { shown++; if (x.className === 'sh') sh++; }
    });
    var foot = nt.querySelector('.notice-foot');
    if (foot) foot.hidden = !sh;
    nt.hidden = !shown;
  }

  var cell = document.querySelector('#comb [data-d="' + (day + 1) + '"]');
  var bee = document.getElementById('bee');
  if (cell) {
    cell.classList.add('today');
    if (bee) {
      var place = function () {
        var h = parseFloat(getComputedStyle(bee).height) || 28;
        bee.style.left = (cell.offsetLeft + cell.offsetWidth * 0.56) + 'px';
        bee.style.top = (day >= 4 ? cell.offsetTop + cell.offsetHeight - h * 0.6 : cell.offsetTop - h * 0.45) + 'px';
      };
      bee.hidden = false;
      place();
      bee.classList.add('fly');
      window.addEventListener('resize', place);
    }
  }

  var dock = document.getElementById('dock'), actions = document.getElementById('actions');
  if ('IntersectionObserver' in window && dock && actions) {
    new IntersectionObserver(function (e) {
      dock.classList.toggle('show', !e[0].isIntersecting && e[0].boundingClientRect.top < 0);
    }).observe(actions);
  }
})();
</script>
</body>
</html>
`;
}
