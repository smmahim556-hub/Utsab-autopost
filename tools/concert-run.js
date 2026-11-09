// Concert reels (owner 2026-11-07: "as many reels as you can from the concert lives, on the 3 Pages" =
// Utsab TV Entertainment, Utsab TV, Utsab TV Digital). Two modes, run from clips.yml:
//   CONCERT_PLAN=<video ids, comma separated>: download each live, let Gemini pick the best song moments (clips.js planClips
//     'concert'), queue them at spread-out Dhaka slots in state/concert.json and write a still of the first to preview/concert-check.png.
//   default: post every queued reel whose time has come (render, then all 3 Pages, full-video link in the first comment).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { planClips, renderClip, ff } = require('../clips');
const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_VERSION || 'v26.0'}`;
const ROOT = path.join(__dirname, '..'), FILE = path.join(ROOT, 'state', 'concert.json'), W = '/tmp/concert';
const ENT = process.env.ENT_PAGE_ID === undefined ? '1406430145892267' : process.env.ENT_PAGE_ID;
const SLOTS = (process.env.CONCERT_SLOTS || '11:00,12:30,13:45,16:15,17:00,19:00,20:15,21:30,22:30').split(',');
// CONCERT_KIND=podcast (owner 2026-11-09, 'গান-বাজ'): ~1-min parts with the hook moment played first, whole picture kept.
const POD = process.env.CONCERT_KIND === 'podcast';
const TAG = POD ? (process.env.PODCAST_TAG || 'পডকাস্ট') : 'বিনোদন', HOLD = process.env.CONCERT_HOLD === '1' || POD;
const FOOT = process.env.CONCERT_FOOT || (POD ? 'পুরো পর্ব দেখুন উৎসব টিভির পেজে' : 'পুরো কনসার্ট দেখুন উৎসব টিভির পেজে');
const TAGOF = j => j.clip.tag || 'পডকাস্ট';
let st = {};
try { st = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
st.queue = st.queue || []; st.done = st.done || [];
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
// Next free Dhaka slot times (ms), from tomorrow-or-today onward.
function slotTimes(n, after) {
  const out = [];
  for (let day = 0; out.length < n && day < 30; day++) {
    const d = new Date(after + 6 * 3600e3 + day * 86400e3).toISOString().slice(0, 10);
    for (const s of SLOTS) { const t = Date.parse(`${d}T${s}:00+06:00`); if (t > after && out.length < n) out.push(t); }
  }
  return out;
}
async function download(video, token) {
  // 'gd:<id>': a public Google Drive file (owner's own concert footage).
  if (video.startsWith('gd:')) {
    fs.mkdirSync(W, { recursive: true });
    const f = `${W}/${video.replace(/[^\w-]/g, '_')}.mp4`;
    if (!fs.existsSync(f)) require('child_process').execFileSync('curl', ['-sSL', '--retry', '3', '-o', f, `https://drive.usercontent.google.com/download?id=${video.slice(3)}&export=download&confirm=t`]);
    return { file: f, url: '' };
  }
  const r = await (await fetch(`${GRAPH}/${video}?fields=source,permalink_url,title,description&access_token=${encodeURIComponent(token)}`)).json();
  if (!r.source) throw new Error(`${video}: no source (${r.error?.message || ''})`);
  fs.mkdirSync(W, { recursive: true });
  const f = `${W}/${video}.mp4`;
  if (!fs.existsSync(f)) fs.writeFileSync(f, Buffer.from(await (await fetch(r.source)).arrayBuffer()));
  const u = r.permalink_url || '';
  if (POD && !process.env.PODCAST_CONTEXT) process.env.PODCAST_CONTEXT = (r.description || r.title || '').slice(0, 400);
  return { file: f, url: u ? `https://www.facebook.com${u.startsWith('/') ? '' : '/'}${u.replace(/^https?:\/\/(www\.)?facebook\.com/, '')}` : '' };
}
(async () => {
  try {
    if (process.env.DRY_RUN === '1') return;
    const acc = await (await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).json();
    const pages = [ENT, process.env.FB_PAGE_ID, process.env.FB_PAGE_ID_2].filter(Boolean).map(id => (acc.data || []).find(a => a.id === id)).filter(Boolean)
      .map(a => ({ id: a.id, token: a.access_token }));
    const main = pages.find(p => p.id === process.env.FB_PAGE_ID) || pages[0];
    if (!main) throw new Error('no Pages');
    if (process.env.CONCERT_PLAN) {
      const found = [];
      for (const v of process.env.CONCERT_PLAN.split(',').map(x => x.trim()).filter(Boolean)) {
        let file, url;
        try { ({ file, url } = await download(v, main.token)); } catch (e) { log(`download ${v}: ${e.message}`); continue; }
        const clips = await planClips(file, W, Number(process.env.CONCERT_MAX || (POD ? 40 : 20)), POD ? 'podcast' : 'concert').catch(e => (log(`plan ${v}: ${e.message}`), []));
        log(`plan ${v}: ${clips.length} clips: ${clips.map(c => `${Math.round(c.start)}-${Math.round(c.end)} ${c.hook}`).join(' | ')}`);
        for (const c of clips) found.push({ video: v, url, ...(POD ? { kind: 'podcast' } : {}), clip: { ...c, tag: TAG, foot: FOOT, cut: Number(process.env.CONCERT_CUT || 0), ...(POD ? { wide: true, subs: [] } : {}) }, ...(HOLD ? { hold: true } : {}) });
      }
      // The package-clip pipeline had already queued second reels from these lives: fold them in so they go to all 3 Pages at good times.
      try {
        const cf = path.join(ROOT, 'state', 'clips.json'), cs = JSON.parse(fs.readFileSync(cf, 'utf8'));
        const ids = new Set(found.map(f => f.video));
        const keep = [];
        for (const p of cs.pending || []) {
          if (!ids.has(p.video)) { keep.push(p); continue; }
          if (!found.some(f => f.video === p.video && Math.abs(f.clip.start - p.clip.start) < 20))
            found.push({ video: p.video, url: p.url, clip: { ...p.clip, tag: TAG, foot: FOOT, cut: Number(process.env.CONCERT_CUT || 0) } });
        }
        cs.pending = keep;
        fs.writeFileSync(cf, JSON.stringify(cs, null, 2));
      } catch (e) { log(`clips.json: ${e.message}`); }
      // Interleave the lives so one concert's songs don't all come in a row.
      const byV = {}; for (const f of found) (byV[f.video] = byV[f.video] || []).push(f);
      const mixed = []; for (let i = 0; Object.values(byV).some(l => l[i]); i++) for (const l of Object.values(byV)) if (l[i]) mixed.push(l[i]);
      // CONCERT_HOLD=1: queued but held until the owner approves (times are set then).
      const last = Math.max(Date.now(), ...st.queue.filter(q => q.at).map(q => q.at));
      if (!HOLD) slotTimes(mixed.length, last).forEach((t, i) => { mixed[i].at = t; });
      st.queue.push(...mixed);
      save();
      if (mixed[0]) {
        const browser = await chromium.launch();
        try {
          fs.mkdirSync(path.join(ROOT, 'preview', POD ? 'podcast' : 'concert'), { recursive: true });
          // One still per reel (numbered) for the owner to review, and the first reel in full as a sample.
          const list = HOLD ? mixed : mixed.slice(0, 1);
          for (const [i, c] of list.entries()) {
            const probe = `${W}/check-${i}.mp4`;
            await renderClip(browser, `${W}/${c.video.replace(/[^\w-]/g, '_')}.mp4`.replace(/\/(\d+)\.mp4$/, '/$1.mp4'), { ...c.clip, pre: undefined, end: c.clip.start + 2 }, '', probe, W, 'k');
            ff(['-ss', '1', '-i', probe, '-frames:v', '1', '-vf', 'scale=540:-2', path.join(ROOT, 'preview', POD ? 'podcast' : 'concert', `c${String(i + 1).padStart(2, '0')}.png`)]);
          }
          if (HOLD) {
            const c = mixed[0];
            await renderClip(browser, `${W}/${c.video.replace(/[^\w-]/g, '_')}.mp4`, c.clip, '', path.join(ROOT, 'preview', POD ? 'podcast-sample.mp4' : 'concert-sample.mp4'), W, 's');
          }
        } finally { await browser.close(); }
      }
      return log(`queued ${mixed.length} concert reels`), save();
    }
    if (process.env.CONCERT !== '1') return;
    const due = st.queue.filter(q => !q.hold && q.at && q.at <= Date.now()).slice(0, 1);
    if (!due.length) return;
    const job = due[0];
    st.queue = st.queue.filter(q => q !== job); save();
    const { file } = await download(job.video, main.token);
    const browser = await chromium.launch();
    try {
      const out = `${W}/reel-${job.video}-${Math.round(job.clip.start)}.mp4`;
      await renderClip(browser, file, job.clip, '', out, W, 'r');
      const desc = job.kind === 'podcast' ? `${job.clip.hook}\n\nউৎসব টিভির পডকাস্ট '${TAGOF(job)}' থেকে।${job.url ? ' পুরো পর্ব দেখুন প্রথম কমেন্টের লিংকে।' : ''}\n\n#utsabtv #পডকাস্ট #বিনোদন` : `${job.clip.hook}\n\n${job.url ? 'উৎসব টিভির কনসার্ট লাইভ থেকে। পুরো কনসার্ট দেখুন প্রথম কমেন্টের লিংকে।' : 'উৎসব টিভির কনসার্ট থেকে।'}\n\n#utsabtv #কনসার্ট #বিনোদন #গান`;
      const ids = {};
      for (const page of pages) {
        try {
          ids[page.id] = await postReel(page, out, desc);
          log(`concert reel on ${page.id}: ${ids[page.id]} (${job.clip.hook})`);
        } catch (e) { log(`concert reel on ${page.id} FAILED: ${e.message}`); }
      }
      // The reel needs a moment before Facebook accepts comments on it.
      await new Promise(r => setTimeout(r, 60000));
      for (const page of pages) if (ids[page.id] && job.url) {
        const c = new FormData(); c.append('message', `${job.kind === 'podcast' ? 'পুরো পর্ব' : 'পুরো কনসার্ট'}: ${job.url}`); c.append('access_token', page.token);
        await graph(`${ids[page.id]}/comments`, c).catch(e => log(`comment ${ids[page.id]}: ${e.message.slice(0, 120)}`));
      }
      st.done.push({ video: job.video, start: job.clip.start, hook: job.clip.hook, ids });
    } finally { await browser.close(); }
  } catch (e) { log(`FAILED: ${e.message}`); process.exitCode = 1; }
  save();
})();
