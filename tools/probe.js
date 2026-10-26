// One-off: can a Facebook Page be read from the Actions runner? Writes state/fb-probe.json.
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const out = {};
  const UA = { fb: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', ch: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' };
  for (const [k, ua] of Object.entries(UA)) {
    try {
      const r = await fetch('https://www.facebook.com/share/1CVF4We3Ld/', { headers: { 'user-agent': ua }, redirect: 'follow' });
      const t = await r.text();
      const m = (p) => (t.match(new RegExp(`<meta[^>]+property="${p}"[^>]+content="([^"]*)"`)) || [])[1];
      out[k] = { status: r.status, url: r.url, title: m('og:title'), desc: m('og:description'), image: m('og:image'), len: t.length, login: /login/i.test(r.url) };
    } catch (e) { out[k] = { error: e.message }; }
  }
  // Graph API: does the token see this Page's posts?
  try {
    const target = out.fb?.url || out.ch?.url || '';
    const slug = (target.match(/facebook\.com\/(?:profile\.php\?id=(\d+)|([^/?#]+))/) || []).slice(1).find(Boolean);
    out.slug = slug;
    if (slug && process.env.FB_USER_TOKEN) {
      const g = await (await fetch(`https://graph.facebook.com/v26.0/${slug}?fields=id,name,posts.limit(3){message,created_time,full_picture,permalink_url}&access_token=${process.env.FB_USER_TOKEN}`)).json();
      out.graph = g.error ? { error: g.error.message, code: g.error.code } : { id: g.id, name: g.name, posts: g.posts?.data?.map(p => ({ t: p.created_time, m: (p.message || '').slice(0, 120), pic: !!p.full_picture })) };
    }
  } catch (e) { out.graphErr = e.message; }
  // Headless browser, no login
  try {
    const b = await chromium.launch(); const pg = await b.newPage({ userAgent: UA.ch });
    await pg.goto('https://www.facebook.com/share/1CVF4We3Ld/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await pg.waitForTimeout(5000);
    const txt = await pg.evaluate(() => document.body.innerText.slice(0, 1500));
    out.browser = { url: pg.url(), text: txt };
    await b.close();
  } catch (e) { out.browserErr = e.message; }
  fs.writeFileSync('state/fb-probe.json', JSON.stringify(out, null, 2));
})();
