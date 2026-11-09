// IndexNow: praneša Bing (ir kitoms IndexNow paieškoms), kad puslapis atnaujintas.
// Kol domenas dar nenukreiptas į svetainę, pranešimas praleidžiamas (ne klaida).
export async function pingIndexNow(b) {
  if (!b.website) return { skipped: 'nėra domeno (website)' };
  if (!b.indexnowKey) return { skipped: 'nėra indexnowKey' };
  const host = new URL(b.website).host;
  const keyLocation = `${b.website}${b.indexnowKey}.txt`;
  try {
    const r = await fetch(keyLocation, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    const txt = r.ok ? (await r.text()).trim() : '';
    if (txt !== b.indexnowKey) return { skipped: `raktas dar nepasiekiamas adresu ${keyLocation} (domenas dar nenukreiptas į svetainę?)` };
  } catch {
    return { skipped: `domenas ${host} dar neveikia` };
  }
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: b.indexnowKey, keyLocation, urlList: [b.website, `${b.website}llms.txt`] }),
    signal: AbortSignal.timeout(15000),
  });
  return { status: res.status, ok: res.status === 200 || res.status === 202 };
}
