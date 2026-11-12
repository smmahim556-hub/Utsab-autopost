// Probe (owner 2026-11-12): which reels went out today on the three Pages, with their caption start, to find any গান-বাজ reel.
// Writes state/reels-list-probe.json (no tokens written).
const fs = require('fs'), path = require('path');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN;
const PAGES = { ent: '1406430145892267', main: '872606492607357', digital: '1276101408920358' };
(async () => {
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
  const out = {};
  for (const [k, id] of Object.entries(PAGES)) {
    const page = (acc.data || []).find(a => a.id === id);
    if (!page) { out[k] = 'no token'; continue; }
    const r = await (await fetch(`${G}/${id}/video_reels?fields=id,description,created_time&limit=60&access_token=${page.access_token}`)).json();
    out[k] = (r.data || []).map(x => ({ id: x.id, at: x.created_time, desc: (x.description || '').slice(0, 140) })) || r.error?.message;
  }
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'reels-list-probe.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1).slice(0, 3000));
})().catch(e => { console.error(e); process.exit(1); });
