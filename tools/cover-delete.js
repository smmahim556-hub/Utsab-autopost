// One-off (owner said 'Muche deo' 2026-11-12): delete the cover-artist podcast reel that went out on Utsab TV (1709863350540573)
// and its Digital copy (2353060138852462). Also holds the queued item for that hook so it cannot be released again.
// Writes state/cover-delete-probe.json (no tokens written).
const fs = require('fs'), path = require('path');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN;
const DEL = [['main', '872606492607357', '1709863350540573'], ['digital', '1276101408920358', '2353060138852462']];
(async () => {
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
  const out = {};
  for (const [k, pageId, vid] of DEL) {
    const page = (acc.data || []).find(a => a.id === pageId);
    if (!page) { out[k] = 'no page token'; continue; }
    const r = await (await fetch(`${G}/${vid}?access_token=${page.access_token}`, { method: 'DELETE' })).json();
    out[k] = { id: vid, result: r };
  }
  const cfile = path.join(__dirname, '..', 'state', 'concert.json');
  const c = JSON.parse(fs.readFileSync(cfile, 'utf8'));
  let held = 0;
  for (const q of c.queue) if (JSON.stringify(q).includes('মূল আর্টিস্টের চেয়ে কভার')) { q.hold = true; held++; }
  fs.writeFileSync(cfile, JSON.stringify(c, null, 1));
  out.held = held;
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'cover-delete-probe.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
