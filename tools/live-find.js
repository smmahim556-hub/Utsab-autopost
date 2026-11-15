// Lists the latest videos on Utsab TV and Digital (title, length, live status) to find a finished live, e.g. the সংসদ session.
// Writes state/live-find-probe.json.
const fs = require('fs'), path = require('path');
const G = 'https://graph.facebook.com/v26.0';
(async () => {
  const T = process.env.FB_USER_TOKEN;
  const acc = await (await fetch(`${G}/me/accounts?fields=id,name,access_token&limit=100&access_token=${T}`)).json();
  const out = { at: new Date().toISOString(), pages: {} };
  for (const id of [process.env.FB_PAGE_ID || '872606492607357', process.env.FB_PAGE_ID_2 || '1276101408920358']) {
    const p = (acc.data || []).find(a => a.id === id);
    if (!p) { out.pages[id] = { error: 'no token' }; continue; }
    const v = await (await fetch(`${G}/${id}/videos?fields=id,title,description,created_time,length,live_status,permalink_url&limit=40&access_token=${p.access_token}`)).json();
    out.pages[id] = (v.data || []).map(x => ({ id: x.id, t: x.created_time, len: Math.round(x.length || 0), live: x.live_status || '', title: (x.title || '').slice(0, 80), desc: (x.description || '').slice(0, 120), url: x.permalink_url }));
    if (v.error) out.pages[id] = { error: v.error.message };
  }
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'live-find-probe.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1).slice(0, 4000));
})().catch(e => { console.error(e); process.exit(1); });
