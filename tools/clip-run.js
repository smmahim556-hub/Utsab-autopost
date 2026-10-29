// Hook reels from the Page's own news packages (LIVE, owner approved 2026-10-29). Run by clips.yml every ~30 minutes:
// a new landscape package (90+ s) on the main Page becomes 2 short reels (clips.js: 1:1 video in the Utsab TV template,
// the channel's animated logo, hook headline). The first goes out at once, the second CLIP_GAP_H hours later, on every
// Page, with the full video's link in the first comment. The first run only marks the existing packages as seen.
const fs = require('fs'), path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const { planClips, renderClip } = require('../clips');
const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_VERSION || 'v26.0'}`;
const FILE = path.join(__dirname, '..', 'state', 'clips.json'), W = '/tmp/clips';
const GAP = Number(process.env.CLIP_GAP_H || 3) * 3600e3;
let st = {};
try { st = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
const save = () => { st.seen = (st.seen || []).slice(-300); fs.writeFileSync(FILE, JSON.stringify(st, null, 2)); };
const log = (...a) => { console.log(...a); st.log = [...(st.log || []), `${new Date().toISOString()} ${a.join(' ')}`].slice(-40); };
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
async function logo(browser) {
  const pg = await browser.newPage();
  try {
    await pg.goto('https://card.utsabtv.com/', { waitUntil: 'networkidle', timeout: 60000 });
    return await pg.evaluate(async () => { const img = document.querySelector('#renderTarget .card-logo-img, #renderTarget .utsab-channel-logo img, #renderTarget img[alt*="ogo"]');
      if (!img) return ''; const b = await (await fetch(img.src)).blob(); return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); });
  } catch { return ''; } finally { await pg.close(); }
}
(async () => {
  try {
    if (process.env.CLIPS !== '1' || process.env.DRY_RUN === '1') return;
    const acc = await (await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).json();
    const pages = [process.env.FB_PAGE_ID, process.env.FB_PAGE_ID_2].filter(Boolean).map(id => (acc.data || []).find(a => a.id === id)).filter(Boolean)
      .map(a => ({ id: a.id, token: a.access_token }));
    if (!pages.length) throw new Error('no Pages');
    const main = pages[0];
    // 1. A second reel that is due.
    const due = (st.pending || []).find(p => Date.now() >= p.at);
    let job = due;
    if (!job) {
      const r = await (await fetch(`${GRAPH}/${main.id}/videos?fields=id,title,description,length,source,created_time,permalink_url,format{width,height}&limit=30&access_token=${encodeURIComponent(main.token)}`)).json();
      if (r.error) throw new Error(`videos: ${r.error.message}`);
      const wide = x => { const f = (x.format || []).slice(-1)[0] || {}; return f.width > f.height; };
      const pk = (r.data || []).filter(x => wide(x) && x.length >= Number(process.env.CLIP_MIN_LEN || 90) && x.source);
      if (!st.seen) { st.seen = pk.map(x => x.id); log(`first run: ${pk.length} packages marked seen`); return save(); }
      const v = pk.find(x => !st.seen.includes(x.id) && Date.now() - Date.parse(x.created_time) < 48 * 3600e3);
      if (!v) return save();
      st.seen.push(v.id); save();
      execSync('which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)', { stdio: 'inherit' });
      fs.mkdirSync(W, { recursive: true });
      fs.writeFileSync(`${W}/${v.id}.mp4`, Buffer.from(await (await fetch(v.source)).arrayBuffer()));
      const clips = await planClips(`${W}/${v.id}.mp4`, W, 2);
      if (!clips.length) return log(`no clips from ${v.id}`), save();
      const url = v.permalink_url ? `https://www.facebook.com${v.permalink_url.startsWith('/') ? '' : '/'}${v.permalink_url.replace(/^https?:\/\/(www\.)?facebook\.com/, '')}` : '';
      const title = (v.title || v.description || '').split('\n')[0].replace(/\s*\|\s*Utsab TV.*$/i, '').trim();
      job = { video: v.id, src: `${W}/${v.id}.mp4`, clip: clips[0], url, title };
      if (clips[1]) st.pending = [...(st.pending || []), { video: v.id, clip: clips[1], url, title, at: Date.now() + GAP }];
    } else {
      st.pending = st.pending.filter(p => p !== due);
      // the source is gone with the old runner: fetch it again
      const r = await (await fetch(`${GRAPH}/${job.video}?fields=source&access_token=${encodeURIComponent(main.token)}`)).json();
      if (!r.source) return log(`pending ${job.video}: no source`), save();
      execSync('which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)', { stdio: 'inherit' });
      fs.mkdirSync(W, { recursive: true });
      job.src = `${W}/${job.video}.mp4`;
      fs.writeFileSync(job.src, Buffer.from(await (await fetch(r.source)).arrayBuffer()));
    }
    save();
    const browser = await chromium.launch();
    try {
      const out = `${W}/reel-${job.video}-${Math.round(job.clip.start)}.mp4`;
      await renderClip(browser, job.src, job.clip, await logo(browser), out, W, 'r');
      const tags = ['#utsabtv', '#সংবাদ', '#উৎসব_টিভি'].join(' ');
      const desc = `${job.clip.hook}\n\n${job.title ? `${job.title}\n` : ''}পুরো ভিডিও দেখুন প্রথম কমেন্টের লিংকে।\n\n${tags}`;
      for (const page of pages) {
        try {
          const id = await postReel(page, out, desc);
          log(`clip reel on ${page.id}: ${id} from ${job.video}`);
          if (job.url) { const c = new FormData(); c.append('message', `পুরো ভিডিও: ${job.url}`); c.append('access_token', page.token); await graph(`${id}/comments`, c).catch(e => log(`comment ${id}: ${e.message}`)); }
        } catch (e) { log(`clip reel on ${page.id} FAILED: ${e.message}`); }
      }
    } finally { await browser.close(); }
  } catch (e) { log(`FAILED: ${e.message}`); }
  save();
})();
