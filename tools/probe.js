// One-off: data sources for market-price and on-this-day cards. Writes state/extras-probe.json (snippets only).
const fs = require('fs');
const get = async (u, o = {}) => { try { const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 UtsabAutopost/1.0' }, signal: AbortSignal.timeout(30000), ...o }); const t = await r.text(); return { status: r.status, len: t.length, t }; } catch (e) { return { status: 0, err: e.message, t: '' }; } };
const strip = t => t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
(async () => {
  const out = {};
  const tcb = await get('https://tcb.gov.bd/');
  out.tcb = { status: tcb.status, links: [...tcb.t.matchAll(/href="([^"]+)"[^>]*>([^<]{0,80}(?:বাজার|দর|price|Price)[^<]{0,40})</g)].slice(0, 15).map(m => [m[1], m[2].trim()]) };
  for (const u of ['https://tcb.gov.bd/site/view/daily_rmp', 'https://tcb.gov.bd/site/view/daily_rmp/-']) {
    const r = await get(u); out[u] = { status: r.status, pdfs: [...r.t.matchAll(/href="([^"]+\.pdf)"/gi)].slice(0, 5).map(m => m[1]), text: strip(r.t).slice(0, 600) };
  }
  const bajus = await get('https://www.bajus.org/gold-price');
  out.bajus = { status: bajus.status, text: strip(bajus.t).match(/.{0,300}(22 ?K|২২ ক্যারেট|22 Karat).{0,500}/i)?.[0] || strip(bajus.t).slice(0, 500) };
  const bb = await get('https://www.bb.org.bd/en/index.php/econdata/exchangerate');
  out.bb = { status: bb.status, text: strip(bb.t).match(/.{0,200}USD.{0,400}/)?.[0] || strip(bb.t).slice(0, 400) };
  const d = new Date(Date.now() + 6 * 3600e3), mm = String(d.getUTCMonth() + 1).padStart(2, '0'), dd = String(d.getUTCDate()).padStart(2, '0');
  const otd = await get(`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${mm}/${dd}`);
  try { const j = JSON.parse(otd.t); out.otd = { status: otd.status, selected: (j.selected || []).slice(0, 8).map(e => `${e.year}: ${e.text}`), births: (j.births || []).slice(0, 5).map(e => `${e.year}: ${e.text}`) }; } catch { out.otd = { status: otd.status, head: otd.t.slice(0, 200) }; }
  const bnw = await get(`https://bn.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext&page=${encodeURIComponent('২৭ অক্টোবর')}`);
  try { out.bnwiki = JSON.parse(bnw.t).parse.wikitext['*'].slice(0, 1500); } catch { out.bnwiki = bnw.status; }
  fs.writeFileSync('state/extras-probe.json', JSON.stringify(out, null, 2));
})();
