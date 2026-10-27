// One-off: market-price sources (TCB, DAM, BAJUS gold, Bangladesh Bank USD) via fetch and a real browser. Writes state/market-probe.json.
const fs = require('fs');
const { chromium } = require('playwright');
const strip = t => t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const get = async u => { try { const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36' }, signal: AbortSignal.timeout(30000) }); const t = await r.text(); return { status: r.status, t }; } catch (e) { return { status: 0, err: String(e.cause?.code || e.message), t: '' }; } };
(async () => {
  const out = { fetch: {}, browser: {} };
  const urls = ['https://tcb.gov.bd/site/view/daily_rmp', 'http://tcb.gov.bd/', 'https://tcb.portal.gov.bd/', 'http://dam.gov.bd/', 'https://dam.gov.bd/market_daily_price_report?L=B',
    'http://service.moa.gov.bd/market-prices/', 'https://www.bajus.org/gold-price', 'https://www.bb.org.bd/en/index.php/econdata/exchangerate'];
  for (const u of urls) { const r = await get(u); out.fetch[u] = { status: r.status, err: r.err, text: strip(r.t).slice(0, 300), pdf: [...r.t.matchAll(/href="([^"]+\.(?:pdf|xlsx?))"/gi)].slice(0, 5).map(m => m[1]) }; }
  const browser = await chromium.launch();
  const pg = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
  for (const u of ['https://www.bajus.org/gold-price', 'https://tcb.gov.bd/site/view/daily_rmp', 'https://dam.gov.bd/']) {
    try { await pg.goto(u, { timeout: 45000, waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(8000);
      const html = await pg.content(); out.browser[u] = { title: await pg.title(), text: strip(html).match(/.{0,200}(?:22|২২).{0,600}/)?.[0] || strip(html).slice(0, 900), links: [...html.matchAll(/href="([^"]+\.(?:pdf|xlsx?))"/gi)].slice(0, 5).map(m => m[1]) };
    } catch (e) { out.browser[u] = { err: e.message.slice(0, 200) }; }
  }
  await browser.close();
  const bb = await get('https://www.bb.org.bd/en/index.php/econdata/exchangerate');
  out.bbRows = strip(bb.t).match(/USD.{0,300}/g)?.slice(0, 3);
  fs.writeFileSync('state/market-probe.json', JSON.stringify(out, null, 2));
})();
