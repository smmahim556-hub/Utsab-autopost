// Probe: last posts on Utsab TV with caption + photo alt text, to check the SEO captions. Writes state/seo-check-probe.json (no tokens).
const fs = require('fs'), path = require('path');
const G = 'https://graph.facebook.com/v21.0';
(async () => {
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).json();
  const p = (acc.data || []).find(a => a.id === (process.env.FB_PAGE_ID || '872606492607357'));
  const out = { at: new Date().toISOString(), posts: [] };
  const r = await (await fetch(`${G}/${p.id}/published_posts?fields=id,created_time,message,attachments{target{id},type}&limit=8&access_token=${p.access_token}`)).json();
  for (const x of r.data || []) {
    const t = x.attachments?.data?.[0];
    let alt = null;
    if (t?.type === 'photo' && t.target?.id) alt = (await (await fetch(`${G}/${t.target.id}?fields=alt_text_custom,alt_text&access_token=${p.access_token}`)).json());
    out.posts.push({ id: x.id, at: x.created_time, type: t?.type, message: (x.message || '').slice(0, 400), alt });
  }
  if (r.error) out.error = r.error.message;
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'seo-check-probe.json'), JSON.stringify(out, null, 1));
})();
