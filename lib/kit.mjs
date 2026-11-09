// Kanalų paketas: paruošti tekstai ir žingsniai kiekvienai platformai (operatoriui, ne viešinti).
import { esc, fill, hoursLT, hoursOpenLT, hoursPerDayLT, hoursPerDayEN, hoursOSM, addressPostal, phoneDisplay, ivText, LT_NOM } from './text.mjs';
import { specialPerDay, noticeItems, activeNotices } from './special.mjs';

const STATUS = { yra: ['ok', 'Sutvarkyta'], nėra: ['no', 'Nėra'], tikrinti: ['chk', 'Patikrinti'] };

function chip(status) {
  const [cls, label] = STATUS[status] || ['chk', status || 'Nežinoma'];
  return `<span class="chip ${cls}">${esc(label)}</span>`;
}

let n = 0;
function field(label, value, { multiline = false, limit = 0, hint = '' } = {}) {
  const id = `f${++n}`;
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) {
    return `<div class="field missing"><div class="lbl">${esc(label)}</div><div class="val">Trūksta duomenų</div></div>`;
  }
  const text = Array.isArray(value) ? value.join('\n') : String(value);
  const len = [...text].length;
  const count = limit ? `<span class="count${len > limit ? ' over' : ''}">${len}/${limit}</span>` : '';
  const tag = multiline || text.includes('\n') ? 'pre' : 'div';
  return `<div class="field"><div class="lbl">${esc(label)}${count}</div><${tag} class="val" id="${id}">${esc(text)}</${tag}><button type="button" data-copy="${id}">Kopijuoti</button>${hint ? `<p class="hint">${esc(hint)}</p>` : ''}</div>`;
}

function card(key, title, status, why, links, steps, fields) {
  return `
<section class="card" id="${key}">
  <div class="card-head"><h2>${esc(title)}</h2>${chip(status)}</div>
  <p class="why">${why}</p>
  <p class="links">${links.map(([href, label]) => `<a class="go" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`).join(' ')}</p>
  <ol class="steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol>
  ${fields.join('\n  ')}
</section>`;
}

export function renderKit(b, ctx, result, date) {
  n = 0;
  const a = b.address;
  const site = b.website || null;
  const phone = b.phone ? phoneDisplay(b.phone) : null;
  const longDesc = fill(b.content.longDescription, ctx);
  const shortDesc = fill(b.content.description, ctx);
  const en = fill(b.content.en, ctx);
  const geo = b.geo ? `${b.geo.lat}, ${b.geo.lng}` : null;
  const cats = b.categories || {};
  const nap = [b.name, addressPostal(a), phone, site].filter(Boolean).join('\n');
  const ch = b.channels;

  // Ypatingas darbo laikas: Google ir Apple – kiekviena data atskirai; Facebook ir Instagram – paruoštas įrašas.
  const perDay = specialPerDay(b, date).map((x) => `${x.date} (${LT_NOM[x.wd]}) – ${x.closed ? 'nedirbame' : ivText(x.hours)}${x.note ? ` (${x.note})` : ''}`);
  const sh = noticeItems(b, date);
  const notes = activeNotices(b, date);
  const post = sh.length || notes.length
    ? [
        'Svarbi informacija',
        '',
        ...sh.map((x) => x.sentence),
        ...notes.map((nt) => fill(nt.text, ctx)),
        ...(sh.length ? ['', `Kitomis dienomis – įprastai: ${hoursOpenLT(b.hours)}.`] : []),
        ...(site ? [`Daugiau: ${site}`] : []),
      ]
    : null;

  const [street, house] = (() => {
    const m = /^(.*?)\s+(\d+[A-Za-z]?(?:[-/]\d+)?)$/.exec(a.street || '');
    return m ? [m[1], m[2]] : [a.street, ''];
  })();
  const osmTags = [
    ...(cats.osm || []),
    `name=${b.name}`,
    `opening_hours=${hoursOSM(b.hours)}`,
    `addr:street=${street}`,
    house && `addr:housenumber=${house}`,
    a.city && `addr:city=${a.city}`,
    a.postalCode && `addr:postcode=${a.postalCode}`,
    b.phone && `phone=${b.phone}`,
    site && `website=${site}`,
    b.social.facebook && `contact:facebook=${b.social.facebook}`,
    b.social.instagram && `contact:instagram=${b.social.instagram}`,
    `check_date=${date}`,
  ].filter(Boolean);

  const hereMail = [
    `Subject: New business listing: ${b.name}, ${a.city}, ${a.country === 'LT' ? 'Lithuania' : a.country}`,
    '',
    'Hello,',
    '',
    'Please add our business to HERE maps:',
    '',
    `Name: ${b.name}`,
    `Category: ${(cats.apple || []).join('; ') || b.types.join('; ')}`,
    `Address: ${[a.street, [a.postalCode, a.city].filter(Boolean).join(' '), a.country === 'LT' ? 'Lithuania' : a.country].filter(Boolean).join(', ')}`,
    geo && `Coordinates: ${geo}`,
    phone && `Phone: ${phone}`,
    site && `Website: ${site}`,
    'Opening hours:',
    ...hoursPerDayEN(b.hours).map((l) => `  ${l}`),
    '',
    'Thank you,',
    b.name,
  ].filter((l) => l !== null && l !== undefined && l !== false);

  const common = [
    field('Pavadinimas', b.name, { hint: 'Visur rašykite taip pat, kaip ant iškabos.' }),
    field('Kiti pavadinimai', b.alternateNames.join(', ') || null),
    field('Gatvė ir numeris', a.street),
    field('Miestas', a.city),
    field('Pašto kodas', a.postalCode),
    field('Savivaldybė', a.region),
    field('Visas adresas', addressPostal(a)),
    field('Kaip rasti įėjimą', a.landmark ? a.landmark.charAt(0).toUpperCase() + a.landmark.slice(1) : null),
    field('Telefonas', phone),
    field('Svetainė', site),
    field('El. paštas', b.email),
    field('Koordinatės', geo),
    field('Darbo laikas', hoursLT(b.hours)),
    field('Darbo laikas pagal dienas', hoursPerDayLT(b.hours)),
    ...(perDay.length ? [field('Ypatingas darbo laikas (šventės, atostogos)', perDay, { multiline: true, hint: 'Įrašykite Google ir Apple profiliuose. Dienos, kai ir taip nedirbate, praleistos.' })] : []),
    field('Kaip atvykti', b.directions.filter((d) => d.text).map((d) => `${d.title}: ${fill(d.text, ctx)}`), { multiline: true }),
    field('Trumpas aprašymas', shortDesc),
    field('Ilgas aprašymas', longDesc, { limit: 750, multiline: true }),
    field('Aprašymas anglų kalba', en, { multiline: true }),
    field('Facebook', b.social.facebook),
    field('Instagram', b.social.instagram),
  ];

  const cards = [
    card('google', 'Google verslo profilis', ch.google,
      'Google paieška, Google Maps ir Gemini. Svarbiausias kanalas.',
      [['https://business.google.com/', 'Atidaryti Google profilį']],
      [
        'Prisijunkite paskyra, kuri valdo profilį, ir patikrinkite, ar profilis patvirtintas.',
        'Sutikrinkite pavadinimą, adresą, telefoną ir darbo laiką su laukais žemiau.',
        'Įrašykite ilgą aprašymą (iki 750 simbolių) ir svetainės adresą.',
        'Pasirinkite pagrindinę ir papildomas kategorijas.',
        'Įkelkite bent 5 nuotraukas: fasadą, įėjimą, vitriną, produktus ir vidų.',
        'Darbo laiko nustatymuose įrašykite šventines ir kitas ypatingas darbo valandas: kiekvieną datą iš sąrašo žemiau.',
      ],
      [
        field('Kategorijos', cats.google),
        field('Darbo laikas pagal dienas', hoursPerDayLT(b.hours)),
        ...(perDay.length ? [field('Ypatingos darbo valandos', perDay, { multiline: true })] : []),
        field('Ilgas aprašymas', longDesc, { limit: 750, multiline: true }),
        field('Svetainė', site),
      ]),
    card('apple', 'Apple Maps (Apple Business)', ch.apple,
      'Apple Maps, Siri ir paieška iPhone telefonuose. Anksčiau vadinosi Apple Business Connect.',
      [['https://business.apple.com/', 'Atidaryti Apple Business']],
      [
        'Prisijunkite su Apple paskyra.',
        'Suraskite savo vietą arba pridėkite naują ir patvirtinkite, kad esate savininkas.',
        'Suveskite laukus, įkelkite logotipą ir nuotraukas.',
      ],
      [
        field('Kategorijos', cats.apple),
        field('Trumpas aprašymas', shortDesc),
        field('Darbo laikas pagal dienas', hoursPerDayLT(b.hours)),
        ...(perDay.length ? [field('Ypatingas darbo laikas (Special Hours)', perDay, { multiline: true })] : []),
        field('Telefonas', phone),
      ]),
    card('bing', 'Bing Places', ch.bing,
      'Bing paieška ir žemėlapiai. ChatGPT paieška remiasi Bing indeksu.',
      [['https://www.bing.com/forbusiness', 'Atidaryti Bing Places']],
      [
        'Prisijunkite ir pasirinkite importą iš Google verslo profilio. Tai greičiausias būdas.',
        'Po importo patikrinkite darbo laiką, telefoną ir svetainę.',
      ],
      [field('Svetainė', site), field('Telefonas', phone)]),
    card('here', 'HERE', ch.here,
      'HERE WeGo ir dalis automobilių navigacijų. Pakeitimai navigacijas pasiekia per kelis mėnesius.',
      [['https://mapcreator.here.com/', 'Atidaryti HERE Map Creator'], ['mailto:appsupport@here.com', 'Rašyti appsupport@here.com']],
      [
        'Naują vietą pridėkite per Map Creator arba nusiųskite paruoštą laišką žemiau.',
        'Jei vieta jau yra, HERE WeGo programėlėje atidarykite ją ir pasirinkite „Suggest an edit“.',
      ],
      [field('Laiškas HERE (anglų kalba)', hereMail, { multiline: true })]),
    card('tomtom', 'TomTom', ch.tomtom,
      'TomTom navigacijos ir dalis automobilių sistemų. Peržiūra trunka nuo kelių dienų iki kelių savaičių.',
      [['https://www.tomtom.com/mapshare/tools', 'Atidaryti TomTom MapShare']],
      [
        'Prisijunkite TomTom paskyra.',
        'Suraskite adresą, priartinkite ir spustelėkite vietą.',
        'Pasirinkite „Add a Point of Interest“ ir suveskite laukus.',
      ],
      [
        field('Kategorija (anglų kalba)', (cats.apple || []).join('; ') || null),
        field('Adresas', addressPostal(a)),
        field('Telefonas', phone),
        field('Svetainė', site),
      ]),
    card('osm', 'OpenStreetMap', ch.osm,
      'Atviras žemėlapis, kurį naudoja daugybė programėlių ir paslaugų.',
      [['https://www.openstreetmap.org/', 'Atidaryti OpenStreetMap']],
      [
        'Prisijunkite, priartinkite pastatą ir spauskite „Redaguoti“.',
        `Padėkite tašką ten, kur iš tikrųjų yra verslas${b.geo ? ` (koordinatės ${b.geo.lat}, ${b.geo.lng})` : ''}, atidarykite žymių teksto rodinį ir įklijuokite žymes žemiau.`,
        'addr:street turi sutapti su gatvės pavadinimu, koks jau yra žemėlapyje.',
      ],
      [field('Žymės', osmTags, { multiline: true })]),
    card('waze', 'Waze', ch.waze,
      'Populiari vairuotojų navigacija.',
      [['https://www.waze.com/editor', 'Atidaryti Waze Map Editor']],
      [
        'Waze programėlėje pridėkite vietą ir nufotografuokite įėjimą, arba naudokite Waze Map Editor kompiuteryje.',
        'Jei zona užrakinta, pakeitimą patvirtina vietinis žemėlapio redaktorius.',
      ],
      [field('Pavadinimas', b.name), field('Adresas', addressPostal(a))]),
    card('katalogai', 'Lietuviški katalogai', ch.katalogai,
      'Vienodi duomenys kataloguose sustiprina pasitikėjimą jūsų duomenimis paieškoje ir AI.',
      [
        ['https://www.1551.lt/', '1551.lt'],
        ['https://rekvizitai.vz.lt/', 'Rekvizitai'],
        ['https://www.imones.lt/', 'Imones.lt'],
        ['https://www.visalietuva.lt/', 'Visalietuva.lt'],
      ],
      [
        'Kiekviename kataloge suraskite įmonę arba užregistruokite naują.',
        'Visur naudokite tą patį pavadinimą, adresą ir telefoną, kaip žemiau.',
      ],
      [field('Pavadinimas, adresas, telefonas, svetainė', nap, { multiline: true }), field('Trumpas aprašymas', shortDesc)]),
    card('tripadvisor', 'Tripadvisor', ch.tripadvisor,
      'Turistai ir keliautojai, ypač važiuojantys pro šalį.',
      [['https://www.tripadvisor.com/Owners', 'Atidaryti Tripadvisor verslui']],
      ['Pridėkite verslą ir patvirtinkite, kad esate savininkas.', 'Aprašymui naudokite tekstą anglų kalba.'],
      [field('Aprašymas anglų kalba', en, { multiline: true })]),
    card('social', 'Facebook ir Instagram', ch.facebook === 'yra' && ch.instagram === 'yra' ? 'tikrinti' : 'nėra',
      'Duomenys čia turi sutapti su kitais kanalais.',
      [b.social.facebook && [b.social.facebook, 'Facebook'], b.social.instagram && [b.social.instagram, 'Instagram']].filter(Boolean),
      [
        'Facebook puslapio informacijoje patikrinkite adresą, darbo laiką, telefoną ir svetainę.',
        'Instagram aprašyme įdėkite svetainės nuorodą.',
        ...(post ? ['Paskelbkite įrašą apie darbo laiko pakeitimus ir prisekite jį puslapio viršuje (Facebook: „Prisegti įrašą“).'] : []),
      ],
      [
        field('Svetainė', site),
        field('Darbo laikas', hoursLT(b.hours)),
        field('Adresas', addressPostal(a)),
        ...(post ? [field('Įrašas apie darbo laiką', post, { multiline: true })] : []),
      ]),
  ];

  const issues = [...result.errors.map((x) => ['err', x]), ...result.warnings.map((x) => ['warn', x])];
  const nav = [['google', 'Google'], ['apple', 'Apple'], ['bing', 'Bing'], ['here', 'HERE'], ['tomtom', 'TomTom'], ['osm', 'OSM'], ['waze', 'Waze'], ['katalogai', 'Katalogai'], ['tripadvisor', 'Tripadvisor'], ['social', 'FB ir IG']];

  return `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Kanalų paketas – ${esc(b.name)}</title>
<style>
  :root { --bg: #F3F4F1; --card: #FFFFFF; --ink: #1E2422; --muted: #5B6461; --line: #DCE0DA; --accent: #2F4544; --ok: #2E6B45; --ok-bg: #E2F1E7; --no: #A33A26; --no-bg: #FBE6E1; --chk: #7A5600; --chk-bg: #FFF1C9; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { width: min(820px, 100% - 32px); margin: 0 auto; padding: 24px 0 64px; }
  h1 { font-size: 28px; line-height: 1.15; margin: 0 0 6px; }
  .sub { color: var(--muted); margin: 0 0 20px; font-size: 15px; }
  nav { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 20px; }
  nav a { color: var(--ink); background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 6px 12px; text-decoration: none; font-size: 14px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; margin: 0 0 14px; }
  .card-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  h2 { font-size: 20px; margin: 0; }
  .why { color: var(--muted); margin: 6px 0 12px; }
  .chip { flex: none; font-size: 13px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
  .chip.ok { color: var(--ok); background: var(--ok-bg); }
  .chip.no { color: var(--no); background: var(--no-bg); }
  .chip.chk { color: var(--chk); background: var(--chk-bg); }
  .links { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; }
  .go { display: inline-block; background: var(--accent); color: #fff; text-decoration: none; padding: 9px 14px; border-radius: 10px; font-weight: 600; font-size: 15px; }
  .steps { margin: 0 0 14px; padding-left: 22px; }
  .steps li { margin: 4px 0; }
  .field { border-top: 1px solid var(--line); padding: 10px 0; display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; align-items: start; }
  .lbl { grid-column: 1 / -1; font-size: 13px; color: var(--muted); display: flex; gap: 10px; }
  .count { font-variant-numeric: tabular-nums; }
  .count.over { color: var(--no); font-weight: 700; }
  .val { margin: 0; font: inherit; white-space: pre-wrap; word-break: break-word; }
  pre.val { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13.5px; line-height: 1.55; }
  .missing .val { color: var(--no); }
  .hint { grid-column: 1 / -1; margin: 0; font-size: 13px; color: var(--muted); }
  button { font: inherit; font-size: 14px; border: 1px solid var(--line); background: #fff; color: var(--ink); border-radius: 8px; padding: 6px 10px; cursor: pointer; min-height: 36px; }
  button.done { background: var(--ok-bg); color: var(--ok); border-color: var(--ok-bg); }
  .issues { list-style: none; padding: 0; margin: 10px 0 0; }
  .issues li { padding: 8px 10px; border-radius: 8px; margin: 0 0 6px; font-size: 15px; }
  .issues .err { background: var(--no-bg); color: var(--no); }
  .issues .warn { background: var(--chk-bg); color: #5C4100; }
  details summary { cursor: pointer; font-weight: 600; }
  :focus-visible { outline: 3px solid #E8A33D; outline-offset: 2px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Kanalų paketas: ${esc(b.name)}</h1>
  <p class="sub">Paruošta ${esc(date)} iš businesses/${esc(b.slug)}/business.json. Atlikę kanalą, jo būseną faile pakeiskite į „yra“.</p>

  <section class="card">
    <details${result.errors.length ? ' open' : ''}>
      <summary>${result.errors.length ? `Klaidų: ${result.errors.length}. ` : ''}Ko dar trūksta: ${result.warnings.length}</summary>
      <ul class="issues">${issues.map(([k, x]) => `<li class="${k}">${esc(x)}</li>`).join('')}</ul>
    </details>
  </section>

  <nav aria-label="Kanalai">${nav.map(([k, l]) => `<a href="#${k}">${esc(l)}</a>`).join('')}</nav>

  <section class="card" id="bendri">
    <div class="card-head"><h2>Bendri duomenys</h2></div>
    <p class="why">Vieni ir tie patys visiems kanalams.</p>
    ${common.join('\n    ')}
  </section>
${cards.join('\n')}
</div>
<script>
document.addEventListener('click', function (e) {
  var btn = e.target.closest('button[data-copy]');
  if (!btn) return;
  var text = document.getElementById(btn.dataset.copy).textContent;
  function ok() { btn.textContent = 'Nukopijuota'; btn.classList.add('done'); setTimeout(function () { btn.textContent = 'Kopijuoti'; btn.classList.remove('done'); }, 1600); }
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
  function fallback() {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); ok(); } catch (err) {}
    document.body.removeChild(ta);
  }
});
</script>
</body>
</html>
`;
}
