# Radaras

Mažo verslo matomumo įrankis. Visi verslo duomenys laikomi viename faile (verslo pase), o Radaras iš jo sugeneruoja:

- **Svetainę**, kurią gerai skaito paieškos sistemos ir AI: visas tekstas paprastame HTML, schema.org duomenys, `robots.txt`, `llms.txt`, o kai nurodytas domenas, ir `sitemap.xml`.
- **Kanalų paketą** su paruoštais tekstais ir žingsniais Google, Apple, Bing, HERE, TomTom, OpenStreetMap, Waze, lietuviškiems katalogams ir Tripadvisor.
- **Patikrą**: ko trūksta, kurios valstybinės šventės artėja be nurodyto darbo laiko, ar pakankamas spalvų kontrastas.

Trūkstami duomenys (`null`) svetainėje tiesiog nerodomi, todėl ją galima skelbti dar prieš surenkant viską.

## Greitas startas

Reikia Node.js 20 ar naujesnio. Papildomų paketų diegti nereikia.

```
node radaras.mjs all honey-pie
```

| Rezultatas | Kas tai | Skelbti? |
|---|---|---|
| `dist/honey-pie/` | Svetainė | Taip |
| `dist/honey-pie-juodrastis/` | Juodraštis su geltonai pažymėtais trūkstamais duomenimis | Ne |
| `kits/honey-pie/kanalai.html` | Kanalų paketas | Ne |

## Komandos

| Komanda | Ką daro |
|---|---|
| `node radaras.mjs list` | Išvardija visus verslus |
| `node radaras.mjs check <verslas>` | Patikrina duomenis. Klaidos sustabdo paskelbimą, įspėjimai ne |
| `node radaras.mjs build <verslas>` | Sugeneruoja svetainę |
| `node radaras.mjs build <verslas> --draft` | Sugeneruoja juodraštį su pažymėtais trūkumais |
| `node radaras.mjs kit <verslas>` | Sugeneruoja kanalų paketą |
| `node radaras.mjs all <verslas>` | Visa tai iš karto |
| `node radaras.mjs indexnow <verslas>` | Praneša Bing apie atnaujinimą (po paskelbimo) |

## Verslo pasas

Failas `businesses/<verslas>/business.json`. Naujam klientui nukopijuokite aplanką ir pakeiskite duomenis.

| Laukas | Pavyzdys ir paaiškinimas |
|---|---|
| `name`, `alternateNames` | `"HoneyPie Desertai"`, `["Honey Pie"]` |
| `types` | schema.org tipai: `["Bakery", "CafeOrCoffeeShop"]`, `["HairSalon"]` |
| `categories` | Kategorijos Google, Apple ir OpenStreetMap platformoms (kanalų paketui) |
| `address` | `street`, `city`, `region`, `postalCode`, `country`, `landmark` (pvz. „priešais Vievio kultūros centrą“, rodomas po adresu) |
| `geo` | `{ "lat": 54.77, "lng": 24.80 }` (iš Google Maps) |
| `phone` | Tarptautiniu formatu be tarpų: `"+37060012345"` |
| `website` | `"https://honeypie.lt/"` |
| `googlePlaceId` | Google vietos ID. Tada Google Maps mygtukas atidaro tikslią vietą |
| `googleMapsUrl` | Tiksli Google Maps nuoroda į verslo kortelę, pvz. `https://www.google.com/maps?cid=…`. Turi pirmenybę prieš paiešką |
| `social` | `facebook`, `instagram`, `tiktok`, `youtube` nuorodos |
| `hours` | `mon`–`sun`: `[["11:00", "18:00"]]`, pertrauka `[["9:00", "13:00"], ["14:00", "16:00"]]`, nedirba `[]` |
| `payment`, `amenities` | `["Cash", "Credit Card"]`, `["Lauko terasa (be stogo)"]` – patenka į schema.org duomenis |
| `public/` aplankas | Failai, kopijuojami į svetainės šaknį: `og.png` (dalinimosi paveikslėlis 1200×630), `favicon-48.png`, `apple-touch-icon.png`, logotipas |
| `localMap` | Paskutinių metrų schema: `{ "file": "vietos-schema.svg", "caption": "…" }`. SVG failas verslo aplanke, spalvos imamos iš temos |
| `specialHours` | Šventės, atostogos, kitoks darbo laikas: `{ "date": "2027-01-01", "closed": true }`, laikotarpis `{ "from": "2026-12-24", "to": "2026-12-29", "closed": true }`, kitos valandos `{ "date": "2026-11-14", "hours": [["10:00", "15:00"]], "note": "dėl techninių priežasčių" }`. Rodoma skiltyje „Svarbi informacija“, korys ir būsena („Šiandien nedirbame…“) persiskaičiuoja patys, patenka į schema.org ir llms.txt, o kanalų pakete atsiranda datos Google ir Apple profiliams bei paruoštas įrašas Facebook ir Instagram. Pasibaigę įrašai pasislepia patys |
| `notices` | Kiti pranešimai skiltyje „Svarbi informacija“: `[{ "text": "Kalėdinių tortų užsakymus priimame iki gruodžio 20 d.", "from": "2026-12-01", "to": "2026-12-20" }]`. Datos neprivalomos: `from` – nuo kada rodyti, `to` – iki kada |
| `content` | `seoTitle`, `seoDescription`, `headline`, `lead`, `description`, `longDescription` (iki 750 simb.), `about`, `where`, `socialIntro`, `en` |
| `route` | Kelio schema: `{ "road": "A1", "start": "Kaunas", "end": "Vilnius", "here": "Vievis", "position": 0.61 }` |
| `directions` | `[{ "icon": "car", "title": "Automobiliu nuo A1", "text": "…" }]` |
| `menu` | `title`, `items` (`icon`, `name`), `priceNote`, `note` |
| `faq` | `[{ "q": "Kada dirbate?", "a": "{hours}" }]`, be atsakymo `"a": null` |
| `photos` | `[{ "src": "photos/bandeles-1200.webp", "small": "photos/bandeles-600.webp", "w": 1200, "h": 1200, "alt": "…", "caption": "Bandelės", "role": "menu", "wide": true }]`, failai aplanke `photos/`. `role`: `menu` – prie asortimento (pirmoji su `"wide": true` rodoma didelė), `find` – skiltyje „Kaip mus rasti“ (iškaba, įėjimas), be `role` – galerijoje. `small` – dvigubai siauresnė versija telefonams |
| `brand` | `logo` (`{ "src": "logo.webp", "schemaSrc": "logo.png", "w": 640, "h": 287 }`, failai `public/` aplanke; rodomas viršuje, apačioje ir schema.org duomenyse), be logotipo – `wordmarkHtml` ir `tagline`; `mascot` (`"bee"`), `colors` (`primary`, `accent`, `paper`, `band`, `light`, `ink`) |
| `unconfirmed` | Dar nepatvirtinti laukai, pvz. `["address.street"]`. Juodraštyje jie pažymimi |
| `channels` | Kiekvieno kanalo būsena: `"yra"`, `"nėra"` arba `"tikrinti"` |
| `indexnowKey` | IndexNow raktas (8–128 raidžių ir skaičių) |

Tekstuose galima naudoti žymes: `{hours}`, `{hoursOpen}`, `{hoursEn}`, `{address}`, `{addressShort}`, `{name}`, `{phone}`. Jos visada atitinka duomenis, todėl pakeitus darbo laiką keisti tekstų nereikia.

Ikonos: `car`, `train`, `bus`, `walk`, `door`, `parking`, `spiral`, `bun`, `sausage`, `tart`, `cup`, `bread`, `cake`, `scissors`, `star`.

`businesses/_pavyzdys/` yra išgalvotas testinis verslas, skirtas patikrinti, ar generatorius veikia ne tik su Honey Pie.

## Paskelbimas per GitHub Pages

1. Sukurkite GitHub repo ir įkelkite šį aplanką.
2. Repo nustatymuose pasirinkite Settings → Pages → Source: **GitHub Actions**.
3. Po kiekvieno pakeitimo `businesses/` aplanke svetainė automatiškai patikrinama, sugeneruojama ir paskelbiama. Kurį verslą skelbti, nurodo `VERSLAS` kintamasis faile `.github/workflows/deploy.yml`.

   Svetainė perkuriama ir kiekvieną naktį, todėl pasibaigę pranešimai dingsta ir iš HTML. Data „Atnaujinta“ ir `sitemap.xml` keičiasi tik pasikeitus turiniui.

   Skubus pranešimas (pvz. „šiandien nedirbame“): GitHub svetainėje atidarykite `businesses/<verslas>/business.json`, spauskite pieštuką, į `specialHours` įrašykite dieną ir spauskite „Commit changes“. Po 1–2 min. svetainė atsinaujina.

4. Savo domeną nustatykite Settings → Pages → Custom domain (pvz. `www.honeypie.lt`) ir pas domeno registratorių (DNS): `www` – CNAME į `<jūsų-github-vardas>.github.io`, o pagrindiniam domenui – A įrašai `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Kai sertifikatas paruoštas, įjunkite „Enforce HTTPS“. Tada `business.json` faile įrašykite `"website": "https://jusu-domenas.lt/"`, ir atsiras `sitemap.xml`, canonical nuoroda bei IndexNow pranešimai.
5. Pridėkite svetainę ir `sitemap.xml` į Bing Webmaster Tools ir Google Search Console.

Viename repo GitHub Pages leidžia vieną svetainę. Keliems klientams reikės atskirų repo arba Cloudflare Pages. Tai planuojama kitame etape.

## Kas toliau

2 etapas – tikrintuvas. Jis kas savaitę per oficialius API patikrins, ar verslas randamas Google, Apple, HERE, TomTom ir OpenStreetMap žemėlapiuose, palygins duomenis su pasu, užduos klausimus AI asistentams ir paruoš ataskaitą.

## Vietos schema

Honey Pie schema (`businesses/honey-pie/vietos-schema.svg`) nubraižyta pagal tikrą OpenStreetMap geometriją: gatvės, pastatai, kultūros centras, aikštelė, įėjimas. Naudojant OSM duomenis, schemoje turi likti užrašas „Duomenys © OpenStreetMap“.
