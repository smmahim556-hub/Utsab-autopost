// One-off: download TCB's latest daily retail price workbook to preview/tcb-sample.xlsx.
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const out = {};
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
  const pg = await ctx.newPage();
  for (let t = 0; t < 3 && !out.xlsx; t++) {
    try {
      await pg.goto('https://tcb.gov.bd/pages/daily-rmps', { timeout: 90000, waitUntil: 'domcontentloaded' });
      const a = await pg.waitForSelector('a[href*="daily-rmps/"]', { timeout: 60000 });
      out.detail = await a.evaluate(x => x.href);
      await pg.goto(out.detail, { timeout: 90000, waitUntil: 'domcontentloaded' });
      out.xlsx = await (await pg.waitForSelector('a[href*=".xls"]', { timeout: 60000, state: 'attached' })).evaluate(x => x.href);
      fs.writeFileSync('preview/tcb-sample.xlsx', await (await ctx.request.get(out.xlsx, { timeout: 90000 })).body());
    } catch (e) { out[`err${t}`] = e.message.slice(0, 300); }
  }
  await browser.close();
  fs.writeFileSync('state/market-probe.json', JSON.stringify(out, null, 2));
})();
