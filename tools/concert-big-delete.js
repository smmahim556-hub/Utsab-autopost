// Owner 2026-11-19 17:02 Dhaka: delete the Noble concert video that just went up (logo position/size wrong).
// Lists videos + reels made today by concert-big (caption has #লাইভকনসার্ট) on the 3 Pages, published or scheduled, and deletes them.
// Lists the SCHEDULED (not yet published) Noble concert posts on the 3 Pages; DEL=1 deletes them (2026-11-19: old logo). Writes state/concert-big-delete-probe.json (no tokens).
const fs = require('fs'), path = require('path');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN;
const PAGES = ['1406430145892267', '872606492607357', '1276101408920358'];
const SINCE = Date.parse('2026-11-19T07:45:00Z');
const j = async (u, o) => (await fetch(u, o)).json().catch(e => ({ error: e.message }));
(async () => {
  const acc = await j(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${encodeURIComponent(T)}`);
  if (!acc.data) console.log('accounts', JSON.stringify(acc).slice(0, 300));
  const out = {};
  for (const id of PAGES) {
    const tok = (acc.data || []).find(a => a.id === id)?.access_token;
    if (!tok) { out[id] = 'no token ' + JSON.stringify(acc.error || (acc.data || []).map(a => a.id)).slice(0, 200); continue; }
    const seen = new Map();
    out[id + ':raw'] = [];
    for (const edge of ['videos', 'video_reels', 'scheduled_posts', 'promotable_posts']) {
      for (const extra of (edge === 'scheduled_posts' || edge === 'promotable_posts') ? ['&is_published=false'] : edge === 'video_reels' ? ['', '&video_state=SCHEDULED'] : ['', '&type=uploaded']) {
        const F = /posts/.test(edge) ? 'id,message,created_time,scheduled_publish_time,is_published' : 'id,description,created_time,published,scheduled_publish_time';
        const r = await j(`${G}/${id}/${edge}?fields=${F}&limit=100${extra}&access_token=${tok}`);
        for (const v of r.data || []) if (Date.parse(v.created_time) >= SINCE) out[id + ':raw'].push([edge + extra, v.id, v.created_time, v.published, v.scheduled_publish_time, (v.description || v.message || '').slice(0, 60)]);
        for (const v of r.data || []) if (Date.parse(v.created_time) >= SINCE && /উৎসব টিভির কনসার্ট/.test(v.description || v.message || '') && /posts/.test(edge)) seen.set(v.id, v);
        if (r.error) out[id + ':' + edge + extra] = r.error.message;
      }
    }
    out[id] = [];
    for (const v of seen.values()) {
      const row = { id: v.id, at: v.created_time, published: v.published, sched: v.scheduled_publish_time, desc: (v.description || '').slice(0, 80) };
      if (process.env.DEL === '1') row.del = await j(`${G}/${v.id}?access_token=${tok}`, { method: 'DELETE' });
      out[id].push(row);
    }
  }
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'concert-big-delete-probe.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1).slice(0, 4000));
})().catch(e => { console.error(e); process.exit(1); });
