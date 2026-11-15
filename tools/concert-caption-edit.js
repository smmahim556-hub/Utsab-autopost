// Owner 2026-11-15: replace the captions of the two posted concert reels with the headlines Gemini wrote after listening
// (state/concert-recap-probe.json, from tools/concert-recap.js). Edits each page's copy. Writes state/concert-caption-edit-probe.json.
const fs = require('fs'), path = require('path');
const G = 'https://graph.facebook.com/v26.0';
const ROOT = path.join(__dirname, '..');
const recap = JSON.parse(fs.readFileSync(path.join(ROOT, 'state', 'concert-recap-probe.json'), 'utf8'));
const st = JSON.parse(fs.readFileSync(path.join(ROOT, 'state', 'concert.json'), 'utf8'));
const desc = hook => `${hook}\n\nউৎসব টিভির কনসার্ট থেকে।\n\n#utsabtv #কনসার্ট #বিনোদন #গান`;
(async () => {
  const T = process.env.FB_USER_TOKEN;
  if (!T) throw new Error('FB_USER_TOKEN missing');
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
  const out = { at: new Date().toISOString(), edits: [] };
  for (const it of recap.items.filter(i => i.posted && i.hook)) {
    const d = (st.done || []).find(x => x.video === it.video && x.start === it.start);
    if (!d) { out.edits.push({ video: it.video, start: it.start, error: 'not in done' }); continue; }
    for (const [pid, vid] of Object.entries(d.ids || {})) {
      const page = (acc.data || []).find(a => a.id === pid);
      if (!page) { out.edits.push({ pid, vid, error: 'no page token' }); continue; }
      const f = new FormData(); f.append('description', desc(it.hook)); f.append('access_token', page.access_token);
      const r = await (await fetch(`${G}/${vid}`, { method: 'POST', body: f })).json().catch(e => ({ error: { message: e.message } }));
      const chk = await (await fetch(`${G}/${vid}?fields=description&access_token=${page.access_token}`)).json().catch(() => ({}));
      out.edits.push({ pid, vid, hook: it.hook, ok: !!r.success, error: r.error ? r.error.message : null, now: (chk.description || '').split('\n')[0] });
    }
  }
  fs.writeFileSync(path.join(ROOT, 'state', 'concert-caption-edit-probe.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  if (out.edits.some(e => e.error)) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
