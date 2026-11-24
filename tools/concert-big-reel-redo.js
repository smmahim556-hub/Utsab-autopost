// Owner 2026-11-24: the Noble reels showed half of the full song's logo inside the video (reels were cut from the logo'd song
// file). Deletes the still-SCHEDULED reels (kind 'reel', at > now + 30 min) on the 3 Pages and drops them from
// state/concert-big-probe.json, so the next concert-big run re-renders them from the clean source at the same times.
// Full songs are left alone. Run only with the owner's OK. Writes state/concert-big-redo-probe.json (no tokens).
const fs = require('fs'), path = require('path');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN, ROOT = path.join(__dirname, '..');
const P = path.join(ROOT, 'state', 'concert-big-probe.json');
(async () => {
  const st = JSON.parse(fs.readFileSync(P, 'utf8'));
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${encodeURIComponent(T)}`)).json();
  const tok = id => (acc.data || []).find(a => a.id === id)?.access_token;
  const out = { at: new Date().toISOString(), done: [], errors: {} };
  for (const [k, v] of Object.entries(st.posts)) {
    if (v.kind !== 'reel' || Date.parse(v.at) < Date.now() + 30 * 60e3) continue;
    let ok = true;
    for (const [page, vid] of Object.entries(v.ids)) {
      const r = await (await fetch(`${G}/${vid}?access_token=${encodeURIComponent(tok(page))}`, { method: 'DELETE' })).json().catch(e => ({ error: { message: e.message } }));
      if (!r.success) { ok = false; out.errors[`${k}:${page}`] = JSON.stringify(r).slice(0, 200); }
    }
    if (ok) { delete st.posts[k]; out.done.push(k); }
  }
  fs.writeFileSync(P, JSON.stringify(st, null, 1));
  fs.writeFileSync(path.join(ROOT, 'state', 'concert-big-redo-probe.json'), JSON.stringify(out, null, 1));
  console.log(out);
})().catch(e => { console.error(e); process.exit(1); });
