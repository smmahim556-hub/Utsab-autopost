// One-off: find Utsab TV videos whose title/description contains a phrase (owner 2026-11-09: podcast 'গান বাজ'). Writes state/video-search-probe.json.
const fs = require('fs');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN;
const Q = ['গান বাজ', 'গানবাজ', 'gaan baj', 'gan baj'];
(async () => {
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
  const p = (acc.data || []).find(a => a.id === process.env.FB_PAGE_ID);
  const out = { scanned: 0, hits: [] };
  let url = `${G}/${p.id}/videos?fields=id,created_time,title,description,length,permalink_url&limit=100&access_token=${p.access_token}`;
  for (let i = 0; i < 40 && url; i++) {
    const r = await (await fetch(url)).json();
    if (r.error) { out.error = r.error; break; }
    for (const v of r.data || []) {
      out.scanned++; out.oldest = v.created_time;
      const t = `${v.title || ''} ${v.description || ''}`.toLowerCase();
      if (Q.some(q => t.includes(q))) out.hits.push({ id: v.id, at: v.created_time, title: v.title, desc: (v.description || '').slice(0, 300), len: Math.round(v.length || 0), url: v.permalink_url });
    }
    url = r.paging?.next;
  }
  fs.writeFileSync('state/video-search-probe.json', JSON.stringify(out, null, 1)); console.log(out);
})();
