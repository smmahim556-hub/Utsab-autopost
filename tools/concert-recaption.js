// Fix the caption of an already-posted concert reel on every Page (owner 2026-11-08: James' last reel was 'মীরাবাঈ', not 'না জানে কই').
// The headline drawn inside the video can't be changed without deleting and re-posting.
const fs = require('fs'), path = require('path');
const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_VERSION || 'v26.0'}`;
const FILE = path.join(__dirname, '..', 'state', 'concert.json');
const FIX = { start: 2955, video: '1121181413984647', hook: '"মীরাবাঈ" - জেমস' };
(async () => {
  const st = JSON.parse(fs.readFileSync(FILE, 'utf8')), out = {};
  const job = st.done.find(d => d.video === FIX.video && Math.round(d.start) === FIX.start);
  const acc = await (await fetch(`${GRAPH}/me/accounts?fields=id,access_token&limit=100&access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).json();
  const desc = `${FIX.hook}\n\nউৎসব টিভির কনসার্ট লাইভ থেকে। পুরো কনসার্ট দেখুন প্রথম কমেন্টের লিংকে।\n\n#utsabtv #কনসার্ট #বিনোদন #গান`;
  for (const [page, id] of Object.entries(job.ids)) {
    const tok = acc.data.find(a => a.id === page)?.access_token;
    const f = new FormData(); f.append('description', desc); f.append('access_token', tok);
    const r = await (await fetch(`${GRAPH}/${id}`, { method: 'POST', body: f })).json().catch(e => ({ error: e.message }));
    const chk = await (await fetch(`${GRAPH}/${id}?fields=description&access_token=${encodeURIComponent(tok)}`)).json().catch(() => ({}));
    out[page] = { id, r, now: chk.description?.split('\n')[0] || chk.error?.message };
  }
  job.hook = FIX.hook; fs.writeFileSync(FILE, JSON.stringify(st, null, 2));
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'recaption-probe.json'), JSON.stringify(out, null, 2));
  console.log(out);
})();
