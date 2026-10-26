// One-off: what munalert.org offers (pages, feeds, APIs). Writes state/mun-probe.json.
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const out = { requests: [] };
  const b = await chromium.launch(); const pg = await b.newPage();
  pg.on('response', r => { const u = r.url(); if (/api|json|graphql|wp-json|feed|missing|case/i.test(u) && !/\.(js|css|png|jpg|svg|woff)/.test(u)) out.requests.push(`${r.status()} ${u}`); });
  for (const u of ['https://munalert.org/', 'https://munalert.org/feed/', 'https://munalert.org/wp-json/wp/v2/posts?per_page=3']) {
    try {
      await pg.goto(u, { waitUntil: 'networkidle', timeout: 45000 });
      const html = await pg.content();
      out[u] = { url: pg.url(), title: await pg.title(), text: (await pg.evaluate(() => document.body.innerText)).slice(0, 1500),
        links: [...new Set((html.match(/href="([^"]+)"/g) || []).map(x => x.slice(6, -1)))].filter(x => /munalert/.test(x) || x.startsWith('/')).slice(0, 60),
        imgs: (html.match(/<img[^>]+src="([^"]+)"/g) || []).slice(0, 8) };
    } catch (e) { out[u] = { error: e.message }; }
  }
  await b.close();
  fs.writeFileSync('state/mun-probe.json', JSON.stringify(out, null, 2));
})();
