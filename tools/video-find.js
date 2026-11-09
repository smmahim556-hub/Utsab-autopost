// One-off: Utsab TV videos from a time window (owner 2026-11-09: last evening's Pori Moni package). Writes state/video-find-probe.json.
const fs = require('fs');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN;
const FROM = Date.parse(process.env.FIND_FROM || '2026-11-08T10:00:00Z'), TO = Date.parse(process.env.FIND_TO || '2026-11-08T17:00:00Z');
(async () => {
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
  const p = (acc.data || []).find(a => a.id === process.env.FB_PAGE_ID);
  const out = [];
  let url = `${G}/${p.id}/videos?fields=id,created_time,title,description,length,permalink_url,source&limit=50&access_token=${p.access_token}`;
  for (let i = 0; i < 4 && url; i++) {
    const r = await (await fetch(url)).json();
    if (r.error) { out.push({ error: r.error }); break; }
    for (const v of r.data || []) { const t = Date.parse(v.created_time); if (t >= FROM && t <= TO) out.push({ id: v.id, at: v.created_time, title: v.title, desc: (v.description || '').slice(0, 200), len: Math.round(v.length || 0), url: v.permalink_url, hasSource: !!v.source }); }
    const last = r.data?.[r.data.length - 1]; if (!last || Date.parse(last.created_time) < FROM) break;
    url = r.paging?.next;
  }
  fs.writeFileSync('state/video-find-probe.json', JSON.stringify(out, null, 1));
  console.log(out);
})();
