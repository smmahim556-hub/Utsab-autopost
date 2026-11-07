// Cartoon story (story.yml post=true, dispatched 14:55 and 19:25 Dhaka by autopost.yml when var GOLPO=1):
// renders the next episode in stories/epNN-*/ that is not posted yet and posts it as a Reel, first on the উৎসবের গল্প Page,
// then on Utsab TV and Utsab TV Digital with a "follow উৎসবের গল্প" caption and the Page link in the first comment (owner: same on all 3 Pages).
const fs = require('fs'), path = require('path');
const { makeStory } = require('../story');
const ROOT = path.join(__dirname, '..');
const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_VERSION || 'v26.0'}`;
const FILE = path.join(ROOT, 'state', 'golpo.json');
const GOLPO = process.env.GOLPO_PAGE_ID || '1417588244778601';
let st = {};
try { st = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
st.posted = st.posted || [];
const save = () => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(st, null, 2)); };
const log = (...a) => { console.log(...a); st.log = [...(st.log || []), `${new Date().toISOString()} ${a.join(' ')}`].slice(-60); };
async function graph(p, form) {
  const r = await fetch(`${GRAPH}/${p}`, { method: 'POST', body: form });
  const b = await r.json().catch(() => ({}));
  if (!r.ok || b.error) throw new Error(`Graph ${p}: ${JSON.stringify(b.error || b).slice(0, 300)}`);
  return b;
}
async function postReel(page, file, description) {
  const f1 = new FormData(); f1.append('upload_phase', 'start'); f1.append('access_token', page.token);
  const { video_id: id, upload_url } = await graph(`${page.id}/video_reels`, f1);
  const up = await fetch(upload_url || `https://rupload.facebook.com/video-upload/${process.env.GRAPH_VERSION || 'v26.0'}/${id}`, {
    method: 'POST', headers: { Authorization: `OAuth ${page.token}`, offset: '0', file_size: String(fs.statSync(file).size) }, body: fs.readFileSync(file) });
  const ub = await up.json().catch(() => ({}));
  if (!up.ok || ub.success === false) throw new Error(`reel upload: ${JSON.stringify(ub)}`);
  const f2 = new FormData(); f2.append('upload_phase', 'finish'); f2.append('video_id', id); f2.append('video_state', 'PUBLISHED');
  f2.append('description', description); f2.append('access_token', page.token);
  await graph(`${page.id}/video_reels`, f2);
  return id;
}
(async () => {
  try {
    if (process.env.GOLPO !== '1' || process.env.DRY_RUN === '1') return;
    const dk = new Date(Date.now() + 6 * 3600e3), today = dk.toISOString().slice(0, 10), slot = `${today}-${dk.getUTCHours() < 16 ? 'noon' : 'eve'}`;
    st.slots = (st.slots || []).slice(-60);
    if (st.slots.includes(slot) && process.env.GOLPO_FORCE !== '1') return log(`already posted ${slot}`);
    const eps = fs.readdirSync(path.join(ROOT, 'stories')).filter(d => /^ep\d+/.test(d) && fs.existsSync(path.join(ROOT, 'stories', d, 'plan.json'))).sort();
    const next = eps.find(d => !st.posted.includes(d));
    if (!next) return log('no new episode ready');
    const dir = path.join(ROOT, 'stories', next), pl = JSON.parse(fs.readFileSync(path.join(dir, 'plan.json'), 'utf8'));
    const out = `/tmp/golpo-${next}.mp4`;
    const wide = `/tmp/golpo-${next}-youtube.mp4`;
    const r = await makeStory(dir, out, { wideOut: wide });
    log(`rendered ${next} ${r.secs.toFixed(1)}s`);
    // Same demo paths as story.yml demos: the thread check hands the full-frame 16:9 copy (and the vertical one for Shorts) to the owner for YouTube.
    try { fs.mkdirSync(path.join(ROOT, 'preview'), { recursive: true }); fs.copyFileSync(out, path.join(ROOT, 'preview', 'story-demo.mp4')); fs.copyFileSync(wide, path.join(ROOT, 'preview', 'story-youtube.mp4')); } catch {}
    const acc = await (await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).json();
    const find = id => (acc.data || []).find(a => a.id === id);
    const tags = ['#উৎসবেরগল্প', '#আবিষ্কারেরগল্প', `#${(pl.scientist || '').replace(/\s+/g, '')}`, '#বিজ্ঞান', '#utsabtv'].filter(t => t.length > 1).join(' ');
    const head = `${pl.series}: ${pl.title}\n\n${pl.summary || ''}`.trim();
    const golpoDesc = `${head}\n\nনতুন পর্ব রোজ বিকাল ৩টা আর সন্ধ্যা ৭:৩০-এ। ফলো করে সঙ্গেই থাকুন!\n\n${tags}`;
    const bigDesc = `${head}\n\nপুরো সিরিজ দেখতে ফলো করুন "উৎসবের গল্প" পেজ, লিংক প্রথম কমেন্টে।\n\n${tags}`;
    const g = find(GOLPO);
    if (!g) throw new Error('উৎসবের গল্প page not in token');
    st.reels = st.reels || {};
    const ids = {};
    ids[GOLPO] = await postReel({ id: g.id, token: g.access_token }, out, golpoDesc);
    log(`golpo reel ${ids[GOLPO]} ${next}`);
    st.posted.push(next); st.slots.push(slot); st.lastDate = today; save();
    for (const pid of [process.env.FB_PAGE_ID, process.env.FB_PAGE_ID_2].filter(Boolean)) {
      const a = find(pid);
      if (!a) { log(`page ${pid} missing`); continue; }
      try {
        ids[pid] = await postReel({ id: a.id, token: a.access_token }, out, bigDesc);
        const c = new FormData(); c.append('message', `পুরো সিরিজ "আবিষ্কারের গল্প" দেখুন উৎসবের গল্প পেজে: https://www.facebook.com/${GOLPO}`); c.append('access_token', a.access_token);
        await graph(`${ids[pid]}/comments`, c).catch(e => log(`comment ${pid}: ${e.message}`));
        log(`reel ${ids[pid]} on ${pid}`);
      } catch (e) { log(`reel on ${pid} FAILED: ${e.message}`); }
    }
    st.reels[next] = ids;
  } catch (e) { log(`FAILED: ${e.message}`); process.exitCode = 1; }
  save();
})();
