// One-off: open TCB's latest daily retail price entry, download its file and dump the text. Writes state/market-probe.json.
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
(async () => {
  const out = { api: [] };
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, acceptDownloads: true, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
  const pg = await ctx.newPage();
  pg.on('response', async r => { const u = r.url(); if (/rmp|price|bazar|ajax|api/i.test(u) && !/office/.test(u)) { try { out.api.push({ u, s: r.status(), ct: r.headers()['content-type'], b: (await r.text()).slice(0, 1500) }); } catch {} } });
  try {
    await pg.goto('https://tcb.gov.bd/pages/daily-rmps', { timeout: 60000, waitUntil: 'networkidle' });
    out.links = await pg.evaluate(() => [...document.querySelectorAll('a')].filter(a => /দেখুন/.test(a.textContent) && /rmp|view|details|show/i.test(a.href)).map(a => a.href).slice(0, 5));
    await pg.goto(out.links[0], { timeout: 60000, waitUntil: 'networkidle' });
    await pg.waitForTimeout(3000);
    out.detailUrl = pg.url();
    out.detailText = (await pg.evaluate(() => document.querySelector('main, #content, .content, body').innerText)).slice(-3000);
    out.files = await pg.evaluate(() => [...document.querySelectorAll('a[href], iframe[src], embed[src], object[data]')].map(a => a.href || a.src || a.data).filter(h => /\.(pdf|xlsx?|docx?|jpe?g|png)(\?|$)|files|upload|storage/i.test(h)).slice(0, 10));
    const f = out.files.find(h => /\.pdf/i.test(h));
    if (f) {
      fs.writeFileSync('/tmp/tcb.pdf', await (await ctx.request.get(f)).body());
      execSync('which pdftotext || (sudo apt-get update -qq && sudo apt-get install -y -qq poppler-utils)');
      out.pdfText = execSync('pdftotext -layout /tmp/tcb.pdf -').toString().slice(0, 7000);
    }
  } catch (e) { out.err = e.message.slice(0, 400); }
  await browser.close();
  fs.writeFileSync('state/market-probe.json', JSON.stringify(out, null, 2));
})();
