// One-off (2026-11-06, owner asked): delete the posts and stories that went out with the new logo before its start date.
// Only the ids our own log recorded are deleted; every post in the window is listed so nothing manual is touched. Writes state/newlogo-probe.json.
const fs = require('fs');
const GRAPH = 'https://graph.facebook.com/v26.0';
const IDS = { '872606492607357': ['872606492607357_122148723777140193', '4384434818366852'], '1276101408920358': ['1276101408920358_122125833813459930', '3543872519117069'] };
(async () => {
  const acc = await (await fetch(`${GRAPH}/me/accounts?fields=id,access_token&limit=100&access_token=${process.env.FB_USER_TOKEN}`)).json();
  const out = [];
  for (const [pid, ids] of Object.entries(IDS)) {
    const t = acc.data.find(p => p.id === pid).access_token;
    const win = await (await fetch(`${GRAPH}/${pid}/published_posts?fields=id,created_time,message&since=2026-11-06T10:50:00&limit=50&access_token=${t}`)).json();
    const rec = { page: pid, window: (win.data || []).map(p => [p.id, p.created_time, (p.message || '').slice(0, 60)]), deleted: {} };
    for (const id of ids) {
      const r = await (await fetch(`${GRAPH}/${id}?access_token=${t}`, { method: 'DELETE' })).json();
      rec.deleted[id] = r.success === true ? 'ok' : (r.error?.message || JSON.stringify(r)).slice(0, 160);
    }
    out.push(rec);
  }
  fs.writeFileSync('state/newlogo-probe.json', JSON.stringify(out, null, 2));
})();
