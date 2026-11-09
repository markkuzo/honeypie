#!/usr/bin/env node
// Radaras: iš vieno verslo paso (business.json) sugeneruoja svetainę, failus paieškai ir kanalų paketą.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, loadBusiness, listBusinesses, context, today, businessDir } from './lib/load.mjs';
import { check } from './lib/check.mjs';
import { renderSite } from './lib/site.mjs';
import { renderKit } from './lib/kit.mjs';
import { robotsTxt, sitemapXml, llmsTxt, faviconSvg } from './lib/seo.mjs';
import { pingIndexNow } from './lib/indexnow.mjs';
import { specialRanges, addDays } from './lib/special.mjs';

const HELP = `Radaras – mažo verslo matomumo įrankis

Naudojimas:
  node radaras.mjs list                     visi verslai
  node radaras.mjs check <verslas>          patikrina duomenis
  node radaras.mjs build <verslas>          sugeneruoja svetainę į dist/<verslas>/
  node radaras.mjs build <verslas> --draft  juodraštis su pažymėtais trūkstamais duomenimis
  node radaras.mjs kit <verslas>            kanalų paketas į kits/<verslas>/kanalai.html
  node radaras.mjs all <verslas>            visa tai iš karto
  node radaras.mjs indexnow <verslas>       praneša Bing apie atnaujinimą (po paskelbimo)
`;

function printCheck(b, r) {
  console.log(`\n${b.name} (${b.slug})`);
  for (const e of r.errors) console.log(`  KLAIDA   ${e}`);
  for (const w of r.warnings) console.log(`  TRŪKSTA  ${w}`);
  for (const i of r.info) console.log(`  INFO     ${i}`);
  console.log(r.errors.length ? `\n  Klaidų: ${r.errors.length}. Svetainė nebus generuojama, kol jų neištaisysite.` : `\n  Klaidų nėra. Įspėjimų: ${r.warnings.length}.`);
}

// Paskutinio turinio pakeitimo data: paskutinis commit'as arba diena, kai pasibaigė ar prasidėjo pranešimas.
// Taip sitemap.xml ir „Atnaujinta“ nesikeičia kasdien, kai svetainė perkuriama be pakeitimų.
function lastChange(b, date) {
  let commit = null;
  try {
    commit = execFileSync('git', ['log', '-1', '--format=%cs', '--', `businesses/${b.slug}`, 'lib', 'radaras.mjs'], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || null;
  } catch {}
  if (!commit) return date;
  const events = [
    ...specialRanges(b).map((r) => addDays(r.to, 1)),
    ...(b.notices || []).flatMap((n) => [n?.from, n?.to && addDays(n.to, 1)]),
  ].filter((x) => x && x <= date);
  return [commit, ...events].sort().pop();
}

function writeSite(b, { draft }) {
  const date = today(b.timezone);
  const updated = lastChange(b, date);
  const ctx = context(b);
  const out = path.join(ROOT, 'dist', draft ? `${b.slug}-juodrastis` : b.slug);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const write = (name, data) => fs.writeFileSync(path.join(out, name), data);
  write('index.html', renderSite(b, ctx, { date, draft, updated }));
  write('robots.txt', draft ? 'User-agent: *\nDisallow: /\n' : robotsTxt(b));
  write('llms.txt', llmsTxt(b, ctx, date));
  write('.nojekyll', '');
  if (b.website && !draft) write('sitemap.xml', sitemapXml(b, updated));
  if (b.indexnowKey && !draft) write(`${b.indexnowKey}.txt`, b.indexnowKey);
  const pub = path.join(businessDir(b.slug), 'public');
  if (fs.existsSync(pub)) fs.cpSync(pub, out, { recursive: true });
  if (!b.publicFiles.includes('favicon.svg')) write('favicon.svg', faviconSvg(b));
  const photos = path.join(businessDir(b.slug), 'photos');
  if (fs.existsSync(photos)) fs.cpSync(photos, path.join(out, 'photos'), { recursive: true });
  return path.relative(ROOT, out);
}

function writeKit(b, r) {
  const date = today(b.timezone);
  const out = path.join(ROOT, 'kits', b.slug);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'kanalai.html'), renderKit(b, context(b), r, date));
  return path.relative(ROOT, path.join(out, 'kanalai.html'));
}

async function main() {
  const [cmd, slug, ...flags] = process.argv.slice(2);
  if (!cmd || cmd === 'help' || cmd === '--help') return console.log(HELP);
  if (cmd === 'list') return console.log(listBusinesses().join('\n'));
  if (!slug) {
    console.error(`Nurodykite verslą. Galimi: ${listBusinesses().join(', ')}`);
    process.exitCode = 1;
    return;
  }
  const b = loadBusiness(slug);
  const r = check(b, today(b.timezone));
  const draft = flags.includes('--draft');

  switch (cmd) {
    case 'check':
      printCheck(b, r);
      if (r.errors.length) process.exitCode = 1;
      break;
    case 'build':
      if (r.errors.length && !draft) {
        printCheck(b, r);
        process.exitCode = 1;
        break;
      }
      console.log(`Svetainė: ${writeSite(b, { draft })}/`);
      break;
    case 'kit':
      console.log(`Kanalų paketas: ${writeKit(b, r)}`);
      break;
    case 'all':
      printCheck(b, r);
      if (!r.errors.length) console.log(`\nSvetainė: ${writeSite(b, { draft: false })}/`);
      console.log(`Juodraštis: ${writeSite(b, { draft: true })}/`);
      console.log(`Kanalų paketas: ${writeKit(b, r)}`);
      if (r.errors.length) process.exitCode = 1;
      break;
    case 'indexnow': {
      const res = await pingIndexNow(b);
      if (res.skipped) console.log(`IndexNow praleistas: ${res.skipped}.`);
      else console.log(`IndexNow atsakymas: ${res.status}${res.ok ? ' (priimta)' : ''}`);
      break;
    }
    default:
      console.log(HELP);
      process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
