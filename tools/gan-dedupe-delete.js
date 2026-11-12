// One-off (owner said 'Ha' 2026-11-12): delete the two extra copies of গান-বাজ পর্ব ১ that went up at 10:05 PM Dhaka:
// Utsab TV 2225857348283459 (untitled copy) and its mirror on Utsab TV Digital 1654133159532966. Keeps the scheduled originals.
// Writes state/gan-dedupe-probe.json with each DELETE result (no tokens written).
const fs = require('fs'), path = require('path');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN;
const DEL = [['main', '872606492607357', '2225857348283459'], ['digital', '1276101408920358', '1654133159532966']];
(async () => {
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
  const out = {};
  for (const [k, pageId, vid] of DEL) {
    const page = (acc.data || []).find(a => a.id === pageId);
    if (!page) { out[k] = 'no page token'; continue; }
    const r = await (await fetch(`${G}/${vid}?access_token=${page.access_token}`, { method: 'DELETE' })).json();
    out[k] = { id: vid, result: r };
    console.log(k, JSON.stringify(out[k]));
  }
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'gan-dedupe-probe.json'), JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
