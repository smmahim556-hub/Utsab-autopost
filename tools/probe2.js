// One-off: market-price sources, round 2 (TCB daily PDF via browser, BAJUS with a longer wait, USD rate APIs). Writes state/market-probe.json.
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const strip = t => t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
(async () => {
  const out = {};
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
  const pg = await ctx.newPage();
  try {
    await pg.goto('https://tcb.gov.bd/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    out.tcbLinks = await pg.evaluate(() => [...document.querySelectorAll('a')].filter(a => /বাজার|দর|মূল্য/.test(a.textContent)).map(a => [a.textContent.trim().slice(0, 60), a.href]).slice(0, 30));
    const target = (out.tcbLinks.find(l => /দৈনিক.*বাজার|বাজার দর/.test(l[0])) || [])[1] || 'https://tcb.gov.bd/site/view/daily_rmp/ঢাকা-মহানগরীর-দৈনিক-বাজার-দর';
    await pg.goto(target, { timeout: 60000, waitUntil: 'domcontentloaded' });
    out.tcbPage = { url: pg.url(), title: await pg.title() };
    const pdfs = await pg.evaluate(() => [...document.querySelectorAll('a')].filter(a => /\.pdf/i.test(a.href)).map(a => [a.closest('tr')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 120), a.href]).slice(0, 6));
    out.tcbPdfs = pdfs;
    if (pdfs[0]) {
      const r = await ctx.request.get(pdfs[0][1]);
      fs.writeFileSync('/tmp/tcb.pdf', await r.body());
      try { execSync('which pdftotext || (sudo apt-get update -qq && sudo apt-get install -y -qq poppler-utils)'); out.tcbText = execSync('pdftotext -layout /tmp/tcb.pdf -').toString().slice(0, 5000); } catch (e) { out.tcbText = 'pdftotext: ' + e.message; }
    }
  } catch (e) { out.tcbErr = e.message.slice(0, 300); }
  try {
    await pg.goto('https://www.bajus.org/gold-price', { timeout: 60000, waitUntil: 'domcontentloaded' });
    for (let i = 0; i < 6 && /moment/i.test(await pg.title()); i++) await pg.waitForTimeout(5000);
    out.bajus = { title: await pg.title(), text: strip(await pg.content()).match(/.{0,100}(?:22|২২).{0,700}/)?.[0] };
  } catch (e) { out.bajus = e.message.slice(0, 200); }
  await browser.close();
  for (const u of ['https://open.er-api.com/v6/latest/USD', 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json']) {
    try { const j = await (await fetch(u)).json(); out[u] = j.rates?.BDT || j.usd?.bdt; } catch (e) { out[u] = e.message; }
  }
  fs.writeFileSync('state/market-probe.json', JSON.stringify(out, null, 2));
})();
