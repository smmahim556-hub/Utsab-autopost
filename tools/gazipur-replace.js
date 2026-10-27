// One-off (2026-10-27, user approved): the Gazipur fire photocard went out with a wrong photo. On each Page, delete that post
// (found by its first-comment link) and post the corrected card with the same link in the first comment. Writes state/gazipur-probe.json.
const fs = require('fs');
const GRAPH = 'https://graph.facebook.com/v26.0';
const LINK = 'https://utsabtv.com/fire-at-jhut-warehouse-gazipur-four-fire-units';
const OUT = 'state/gazipur-probe.json';
(async () => {
  let prev = []; try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
  const acc = await (await fetch(`${GRAPH}/me/accounts?fields=id,access_token&limit=100&access_token=${process.env.FB_USER_TOKEN}`)).json();
  const out = [];
  for (const pid of ['872606492607357', '1276101408920358']) {
    if (prev.find(x => x.page === pid && x.newPost)) { out.push(prev.find(x => x.page === pid)); continue; }
    const t = acc.data.find(p => p.id === pid).access_token;
    const feed = await (await fetch(`${GRAPH}/${pid}/posts?fields=id,created_time,comments.limit(3){message}&limit=100&access_token=${t}`)).json();
    if (feed.error) { out.push({ page: pid, error: feed.error.message }); continue; }
    const hits = (feed.data || []).filter(p => (p.comments?.data || []).some(c => (c.message || '').includes(LINK)));
    const rec = { page: pid, found: hits.map(h => [h.id, h.created_time]) };
    if (hits.length === 1) {
      const del = await (await fetch(`${GRAPH}/${hits[0].id}?access_token=${t}`, { method: 'DELETE' })).json();
      rec.deleted = del.success === true; rec.delError = del.error?.message;
      if (rec.deleted) {
        const photo = new FormData();
        photo.append('source', new Blob([fs.readFileSync('tools/assets/gazipur-new.png')]), 'gazipur.png');
        photo.append('access_token', t);
        const p = await (await fetch(`${GRAPH}/${pid}/photos`, { method: 'POST', body: photo })).json();
        rec.newPost = p.post_id || (p.id && `${pid}_${p.id}`); rec.postError = p.error?.message;
        if (rec.newPost) {
          const c = new FormData(); c.append('message', LINK); c.append('access_token', t);
          const cr = await (await fetch(`${GRAPH}/${rec.newPost}/comments`, { method: 'POST', body: c })).json();
          rec.comment = cr.id || cr.error?.message;
        }
      }
    }
    out.push(rec);
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
})();
