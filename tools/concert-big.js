// Owner 2026-11-15: a big phone recording of a whole concert on Drive (Noble Man show, ~12.8 GB), run by concert-big.yml.
// Owner's rule: every song goes up on its own as a FULL song video first, then as many reels as can be cut from that song.
// Gemini LISTENS to the show to find each song (start/end, no song names) and then listens to each song to pick its reel
// moments (hooks from listening, mood-style, no song names, lyric subtitles). Everything is scheduled with Facebook's own
// scheduling on Utsab TV Entertainment first, then Utsab TV and Digital, in the concert slots 13:00 / 17:00 / 22:00 Dhaka:
// song 1 full, its reels, song 2 full, its reels, ...
// Two stages:
//   DRY=1  -> plan only: writes state/concert-big-plan.json + preview/concert-big (list.md, a still per song, one sample reel).
//   else   -> uses that saved plan (so what the owner saw is what goes up), cuts the full songs in 1080p with our logo,
//             renders the reels, schedules everything; progress in state/concert-big-probe.json (a re-run skips done items).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { renderClip, ff, secs, gemini } = require('../clips');
const G = 'https://graph.facebook.com/v26.0', GV = 'https://graph-video.facebook.com/v26.0';
const ROOT = path.join(__dirname, '..'), B = '/mnt/big', PV = path.join(ROOT, 'preview', 'concert-big');
const PLAN = path.join(ROOT, 'state', 'concert-big-plan.json'), OUT = path.join(ROOT, 'state', 'concert-big-probe.json');
const ENT = '1406430145892267';
const SLOTS = (process.env.SLOTS || '13:00,17:00,22:00').split(',');
const id = process.env.DRIVE_ID, DRY = process.env.DRY === '1';
const prev = (() => { try { const p = JSON.parse(fs.readFileSync(OUT, 'utf8')); return p.drive === id ? p : null; } catch { return null; } })();
const out = prev && !DRY ? prev : { drive: id, steps: {}, posts: {} };
out.at = new Date().toISOString(); out.posts = out.posts || {};
const save = () => { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); };
// Captions for search and reach (owner 2026-11-25: research SEO so the concert reels go viral). Facebook indexes caption text, so
// the first line carries the hook plus the searchable words (artist + live concert), then one line in English for English search,
// a question that invites comments, and 5 focused hashtags.
const TAGS = '#নোবেল #Noble #LiveConcert #BanglaSong #utsabtv';
const ASK = 'নোবেলের কোন গানটা আপনার সবচেয়ে প্রিয়? কমেন্টে লিখুন।';
const songDesc = hook => `${hook} | নোবেলের লাইভ কনসার্ট\n\nউৎসব টিভির মঞ্চে নোবেলের কণ্ঠে পুরো গান।\nNoble live in concert, full song.\n\n${ASK}\n\n${TAGS}`;
const reelDesc = hook => `${hook} | নোবেল লাইভ\n\nউৎসব টিভির কনসার্টে নোবেলের কণ্ঠে। পুরো গানটি আমাদের পেজে।\nNoble live in concert.\n\n${ASK}\n\n${TAGS}`;
const fmt = t => new Date(t).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

const HOOK_RULE = `বাংলায় শিরোনাম (সর্বোচ্চ ১০ শব্দ) যা শুনছ তার ভিত্তিতে: গানের মেজাজ, বাজনা, গায়কী আর দর্শকের সাড়া। ভিডিওর ছোট মঞ্চ, তাই 'হাজারো দর্শক' ধরনের অতিরঞ্জন নয়। গানের নাম, শিল্পীর নাম বা গানের কথা শিরোনামে দেবে না, অনুমানে কিছু বানাবে না। প্রতিটি শিরোনাম আলাদা ধাঁচের।`;

// Gemini sometimes returns nothing, or English text: up to 3 tries, a result counts only with Bengali headlines.
const BN = /[\u0980-\u09FF]/;
async function retry(fn, ok) {
  let last = [], err;
  for (let i = 0; i < 3; i++) {
    try { last = await fn(); if (ok(last)) return last; } catch (e) { err = e; }
  }
  if (last.length) return last;
  throw err || new Error('no result');
}
async function findSongs(audio, off, total) {
  const len = Math.round(secs(audio));
  const r = await gemini([{ inline_data: { mime_type: 'audio/mp3', data: fs.readFileSync(audio).toString('base64') } }, { text:
`এটি একটি লাইভ কনসার্টের রেকর্ডিংয়ের একটি অংশের অডিও (মোট ${len} সেকেন্ড)। মন দিয়ে শুনে এতে গাওয়া প্রতিটি গান আলাদা করে দাও।
প্রতিটি গানের start = গানের বাজনা বা গাওয়া শুরুর সেকেন্ড, end = গান শেষ হওয়ার সেকেন্ড (শেষের হাততালি ধরে ২-৩ সেকেন্ড)। গানের মাঝের বাজনা গানেরই অংশ। একটি গান সাধারণত ৩-৬ মিনিট; দুটি গান জুড়ে এক করবে না: একটি গান শেষে থেমে (বা হাততালির পরে) নতুন সুর/তাল/কথা শুরু হলে সেটা নতুন গান।
গানের আগে-পরের কথাবার্তা, সাউন্ড চেক, লম্বা বিরতি বাদ। অডিওর একেবারে শুরুতে বা শেষে কেটে যাওয়া গান হলে partial:true দাও।
${HOOK_RULE}
শুধু এই JSON দাও: [{"start":35.0,"end":290.0,"partial":false,"hook":"শিরোনাম"}]` }]);
  return (Array.isArray(r) ? r : []).filter(s => s.end > s.start + 45 && s.start >= 0 && s.start < len)
    .map(s => ({ start: off + Math.max(0, s.start), end: Math.min(total, off + Math.min(s.end, len)), partial: !!s.partial, hook: String(s.hook || '').trim() }));
}

async function findReels(audio, n, used = []) {
  const len = Math.round(secs(audio));
  const r = await gemini([{ inline_data: { mime_type: 'audio/mp3', data: fs.readFileSync(audio).toString('base64') } }, { text:
`এটি একটি লাইভ কনসার্টের একটি গানের পুরো অডিও (মোট ${len} সেকেন্ড)। ফেসবুক রিলের জন্য এই গানের ভেতর থেকে যত বেশি ভালো অংশ পাও বেছে নাও (সর্বোচ্চ ${n}টি), পরস্পর ওভারল্যাপ নয়।
নিয়ম: প্রতিটি অংশ ২০-৫৫ সেকেন্ড, গানের জমজমাট জায়গা (কোরাস, অন্তরা, দর্শকের গলা মেলানো, দারুণ বাজনা), লাইনের মাঝখানে শুরু বা শেষ নয়। একই লাইন বারবার এলে আলাদা জায়গা নাও।
প্রতিটির জন্য ${HOOK_RULE}${used.length ? `\nএই শিরোনামগুলো অন্য রিলে আগেই ব্যবহার হয়েছে। এগুলোর কোনোটি হুবহু বা প্রায় একই দেবে না, প্রতিটি নতুন করে লিখবে: ${used.join(' | ')}` : ''}
আর হুবহু গানের কথার সাবটাইটেল দাও (যা স্পষ্ট শোনা যায় শুধু তাই; অস্পষ্ট হলে বাদ), প্রতিটি সর্বোচ্চ ৮-১০ শব্দ, সময় অংশের শুরু থেকে সেকেন্ডে।
শুধু এই JSON দাও: [{"start":12.5,"end":48.0,"hook":"শিরোনাম","subs":[{"s":0.0,"e":2.6,"t":"কথা"}]}]` }]);
  const keep = [];
  for (const c of (Array.isArray(r) ? r : []).filter(c => c.end - c.start >= 15 && c.start >= 0 && c.start < len).sort((a, b) => a.start - b.start)) {
    if (keep.length && c.start < keep[keep.length - 1].end - 3) continue;
    const subs = (c.subs || []).filter(x => x.t && x.e > x.s).sort((a, b) => a.s - b.s);
    subs.forEach((x, i) => { if (subs[i + 1] && x.e > subs[i + 1].s - 0.05) x.e = subs[i + 1].s - 0.05; });
    if (Math.min(c.end, len) - c.start < 15) continue;
    keep.push({ start: c.start, end: Math.min(c.end, len), hook: String(c.hook || '').trim(), subs: subs.filter(x => x.e > x.s) });
  }
  return keep.slice(0, n);
}

function slotTimes(n, after) {
  const res = [];
  for (let day = 0; res.length < n && day < 120; day++) {
    const d = new Date(after + 6 * 3600e3 + day * 86400e3).toISOString().slice(0, 10);
    for (const s of SLOTS) { const t = Date.parse(`${d}T${s}:00+06:00`); if (t > after && res.length < n) res.push(t); }
  }
  return res;
}

async function form(url, fields, blob) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, String(v));
  if (blob) f.append('video_file_chunk', blob, 'chunk.mp4');
  const r = await fetch(url, { method: 'POST', body: f });
  const t = await r.text();
  let b; try { b = JSON.parse(t); } catch { b = { error: { message: `HTTP ${r.status}: ${t.slice(0, 200)}` } }; }
  if (b.error) throw new Error(`${url.split('/').slice(-2).join('/')}: ${JSON.stringify(b.error).slice(0, 300)}`);
  return b;
}
async function scheduleVideo(page, file, title, description, when) {   // full song: resumable /videos upload
  const size = fs.statSync(file).size;
  const st = await form(`${GV}/${page.id}/videos`, { upload_phase: 'start', file_size: size, access_token: page.token });
  let off = Number(st.start_offset), end = Number(st.end_offset);
  const fd = fs.openSync(file, 'r');
  try {
    while (off < size && end > off) {
      const buf = Buffer.alloc(end - off); fs.readSync(fd, buf, 0, end - off, off);
      const t = await form(`${GV}/${page.id}/videos`, { upload_phase: 'transfer', upload_session_id: st.upload_session_id, start_offset: off, access_token: page.token }, new Blob([buf], { type: 'video/mp4' }));
      off = Number(t.start_offset); end = Number(t.end_offset);
    }
  } finally { fs.closeSync(fd); }
  await form(`${GV}/${page.id}/videos`, { upload_phase: 'finish', upload_session_id: st.upload_session_id, title, description, published: 'false', scheduled_publish_time: Math.floor(when / 1000), access_token: page.token });
  return st.video_id;
}
async function scheduleReel(page, file, description, when) {
  const { video_id: vid, upload_url } = await form(`${G}/${page.id}/video_reels`, { upload_phase: 'start', access_token: page.token });
  const up = await fetch(upload_url || `https://rupload.facebook.com/video-upload/v26.0/${vid}`, {
    method: 'POST', headers: { Authorization: `OAuth ${page.token}`, offset: '0', file_size: String(fs.statSync(file).size) }, body: fs.readFileSync(file) });
  const ub = await up.json().catch(() => ({}));
  if (!up.ok || ub.success === false) throw new Error(`reel upload: ${JSON.stringify(ub).slice(0, 200)}`);
  await form(`${G}/${page.id}/video_reels`, { upload_phase: 'finish', video_id: vid, video_state: 'SCHEDULED', scheduled_publish_time: Math.floor(when / 1000), description, access_token: page.token });
  return vid;
}
async function thumb(page, vid, jpg) {
  const f = new FormData(); f.append('source', new Blob([fs.readFileSync(jpg)], { type: 'image/jpeg' }), 'thumb.jpg');
  f.append('is_preferred', 'true'); f.append('access_token', page.token);
  const r = await fetch(`${G}/${vid}/thumbnails`, { method: 'POST', body: f });
  const b = await r.json().catch(() => ({}));
  if (b.error) throw new Error(JSON.stringify(b.error).slice(0, 160));
}

// Full song in 1080p (short side) with the channel's ANIMATED logo top right (owner 2026-11-19, from his sample frame:
// visible logo ~14.4% of the frame width, ~5.1% in from the right edge, ~5.4% down from the top; looped for the whole song).
function cutSong(src, s, file) {
  const [iw, ih] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src]).toString().trim().split(',').map(Number);
  const W = iw > ih ? Math.round(iw * 1080 / ih / 2) * 2 : 1080, H = iw > ih ? 1080 : Math.round(ih * 1080 / iw / 2) * 2;
  // assets/video-logo.webm is 260x152 with the logo itself at x 2-244, y 4-149.
  const vis = Math.round(Math.min(W, H * 16 / 9) * 0.148), k = vis / 242, lw = Math.round(260 * k / 2) * 2;
  const x = Math.round(W - Math.min(W, H * 16 / 9) * 0.057 - 244 * k), y = Math.round(H * 0.054 - 4 * k);
  ff(['-ss', String(Math.max(0, s.start - 1)), '-t', String(s.end - s.start + 2), '-i', src,
    '-stream_loop', '-1', '-c:v', 'libvpx-vp9', '-i', path.join(ROOT, 'assets', 'video-logo.webm'),
    '-filter_complex', `[0:v]scale=${W}:${H},fps=30,setsar=1[v];[1:v]scale=${lw}:-2,format=rgba[l];[v][l]overlay=${x}:${y}:shortest=1[o]`,
    '-map', '[o]', '-map', '0:a:0?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', file]);
}

(async () => {
  if (!id) throw new Error('DRIVE_ID missing');
  fs.mkdirSync(B, { recursive: true }); fs.mkdirSync(PV, { recursive: true });
  const src = `${B}/src.mp4`, audio = `${B}/all.mp3`;
  // Drive allows only a few downloads of a 12.8 GB file a day (2026-11-15: 'Quota exceeded' after 3), so the show's audio is
  // kept in the Actions cache: re-planning needs no download; only posting (the video itself) downloads again.
  const needVideo = process.env.REHOOK === '1' ? process.env.REHOOK_VIDEO === '1' : (!DRY || !fs.existsSync(audio));
  if (needVideo && !fs.existsSync(src)) {
    execFileSync('curl', ['-sSL', '--retry', '3', '-o', src, `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`], { stdio: 'inherit' });
    out.steps.download_bytes = fs.statSync(src).size; save();
    if (out.steps.download_bytes < 1e8) { const t = fs.readFileSync(src, 'utf8').slice(0, 300); fs.unlinkSync(src); throw new Error(`download failed (${out.steps.download_bytes} bytes)${/Quota exceeded/.test(t) ? ': Drive download quota exceeded, try again later' : ': ' + t.slice(0, 200)}`); }
  }
  if (!fs.existsSync(audio)) ff(['-i', src, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '16k', audio]);
  const hasVideo = fs.existsSync(src);
  const total = secs(hasVideo ? src : audio);
  out.steps.duration_s = Math.round(total); save();

  // REHOOK=1 (owner 2026-11-16: the mood headlines were not relevant, 'gan sune ganer theke headline'): keep the saved songs and
  // reels, but Gemini listens to each song again and writes every headline from the words actually sung in that part.
  if (process.env.REHOOK === '1') {
    const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8'));
    if (plan.drive !== id) throw new Error('no saved plan for this drive id');
    const usedLines = [];
    for (const [i, s] of plan.songs.entries()) {
      const a = `${B}/rh${i}.mp3`;
      ff(['-ss', String(s.start), '-t', String(s.end - s.start), '-i', hasVideo ? src : audio, '-vn', '-ac', '1', '-ar', '16000', '-b:a', hasVideo ? '48k' : '16k', a]);
      const ranges = s.reels.map((r, j) => `রিল ${j + 1}: ${Math.round(r.start)}-${Math.round(r.end)} সেকেন্ড`).join('\n');
      const ask = () => gemini([{ inline_data: { mime_type: 'audio/mp3', data: fs.readFileSync(a).toString('base64') } }, { text:
`এটি একটি লাইভ কনসার্টের একটি বাংলা গানের পুরো অডিও (মোট ${Math.round(secs(a))} সেকেন্ড)। মন দিয়ে গানের কথা শোনো।
ফেসবুকের জন্য হেডলাইন বানাতে হবে গানের কথা থেকে, যাতে মানুষ দেখেই চিনে ফেলে আর থেমে দেখে।
১) পুরো গানের জন্য: গানের সবচেয়ে পরিচিত/মুখে মুখে ফেরা লাইনটি (সাধারণত কোরাস/মুখড়া) হুবহু যেমন গাওয়া হয়েছে।
২) নিচের প্রতিটি রিলের সময়ের ভেতরে স্পষ্ট গাওয়া সবচেয়ে আকর্ষণীয় লাইনটি হুবহু (ওই সময়ের ভেতরে যা গাওয়া হয়েছে শুধু তাই; একই গানের রিলগুলোতে যতটা সম্ভব আলাদা লাইন):
${ranges || '(কোনো রিল নেই)'}
প্রতিটির জন্য hook: সেই লাইনটি উদ্ধৃতিচিহ্নে, তারপর ছোট আকর্ষণীয় অংশ (৩-৬ শব্দ, যেমন: লাইভে শুনুন একবার / কনসার্টে গলা মেলালেন দর্শক / মন ছুঁয়ে যাবে)। প্রতিটি hook আলাদা ধাঁচের। মিথ্যা বা অতিরঞ্জন নয়, গানের বা শিল্পীর নাম নয়।
কোনো লাইন স্পষ্ট শোনা না গেলে line ফাঁকা রাখো আর hook-এ ওই অংশে যা হচ্ছে (গিটার সোলো, দর্শকের গলা মেলানো ইত্যাদি) তা লেখো; কথা বানাবে না।
শুধু এই JSON দাও: {"song":{"line":"...","hook":"..."},"reels":[{"n":1,"line":"...","hook":"..."}]}` }]);
      let r = null;
      for (let t = 0; t < 3 && !r; t++) { const x = await ask().catch(() => null); if (x && x.song && BN.test(x.song.hook || '') && (x.reels || []).length >= s.reels.length) r = x; }
      if (!r) { s.rehook_error = 'no Bengali result'; continue; }
      s.old_hook = s.old_hook || s.hook; s.hook = r.song.hook.trim(); s.line = (r.song.line || '').trim();
      s.reels.forEach((rl, j) => { const g = r.reels.find(x => Number(x.n) === j + 1) || r.reels[j]; if (g && BN.test(g.hook || '')) { rl.old_hook = rl.old_hook || rl.hook; rl.hook = g.hook.trim(); rl.line = (g.line || '').trim(); } });
      console.log(`song ${i + 1}: ${s.hook}`);
    }
    fs.writeFileSync(PLAN, JSON.stringify(plan, null, 1));
    const lines = [`# Noble Man concert: ${plan.songs.length} full songs, ${plan.songs.reduce((x, s) => x + s.reels.length, 0)} reels (headlines from the lyrics)\n`];
    for (const [i, s] of plan.songs.entries()) {
      lines.push(`\n## গান ${i + 1} (${mmss(s.start)}-${mmss(s.end)}, ${mmss(s.end - s.start)}) | ${fmt(s.at)}\n${s.hook}${s.rehook_error ? ' (পুরোনো, নতুন হয়নি)' : ''}\n`);
      for (const [j, r] of s.reels.entries()) lines.push(`- রিল ${j + 1} | ${fmt(r.at)} | গানের ${mmss(r.start)}-${mmss(r.end)} | ${r.hook}`);
    }
    fs.writeFileSync(path.join(PV, 'list.md'), lines.join('\n') + '\n');
    out.steps.rehook = plan.songs.filter(s => !s.rehook_error).length; save();
    if (hasVideo) {   // a fresh sample with the new headline
      const s0 = plan.songs.find(s => s.reels.length), r0 = s0.reels[0], seg = `${B}/sample-src.mp4`;
      ff(['-ss', String(s0.start + r0.start - 1), '-t', String(r0.end - r0.start + 2), '-i', src, '-vf', "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)',fps=30", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', seg]);
      const browser = await chromium.launch();
      try { await renderClip(browser, seg, { start: 1, end: 1 + r0.end - r0.start, hook: r0.hook, subs: r0.subs, tag: 'বিনোদন', foot: 'পুরো গানটি দেখুন উৎসব টিভির পেজে', cut: 0, focus: 'the lead singer' }, '', path.join(PV, 'sample.mp4'), B, 'smp'); }
      finally { await browser.close(); }
    }
    console.log(fs.readFileSync(path.join(PV, 'list.md'), 'utf8'));
    return;
  }
  let plan;
  if (DRY || !fs.existsSync(PLAN) || JSON.parse(fs.readFileSync(PLAN, 'utf8')).drive !== id) {
    // 1. Songs: the audio in 30-minute parts (a 60-minute part at 32k was too big for Gemini), 5 minutes overlap so no song is lost at a seam.
    let songs = [];
    for (let off = 0, i = 0; off < total - 30; off += 1500, i++) {
      const a = `${B}/part${i}.mp3`;
      ff(['-ss', String(off), '-t', '1800', '-i', audio, '-c', 'copy', a]);
      const got = await retry(() => findSongs(a, off, total), r => r.length && r.every(x => BN.test(x.hook))).catch(e => { out.steps[`songs${i}_error`] = e.message; return []; });
      songs.push(...got);
      if (off + 1800 >= total) break;
    }
    songs.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const s of songs) {
      const last = merged[merged.length - 1];
      const ov = last ? Math.min(last.end, s.end) - Math.max(last.start, s.start) : 0;
      if (last && ov > 0.4 * Math.min(last.end - last.start, s.end - s.start)) {
        // The same song seen from two parts: keep the whole (non-cut) one.
        if ((last.partial && !s.partial) || (last.partial === s.partial && s.end - s.start > last.end - last.start)) merged[merged.length - 1] = s;
      } else if (last && s.start < last.end) { s.start = last.end; if (s.end - s.start > 45) merged.push(s); }
      else merged.push(s);
    }
    const full = merged.filter(s => !s.partial || s.end - s.start > 120);
    out.steps.songs_found = songs.length; out.steps.songs = full.length; save();
    if (!full.length) throw new Error('Gemini found no songs');
    // 2. Reels inside each song (about one per 45 seconds of song).
    for (const [i, s] of full.entries()) {
      const a = `${B}/song${i}.mp3`;
      ff(['-ss', String(s.start), '-t', String(s.end - s.start), '-i', hasVideo ? src : audio, '-vn', '-ac', '1', '-ar', '16000', '-b:a', hasVideo ? '32k' : '16k', a]);
      const n = Math.max(2, Math.min(8, Math.floor((s.end - s.start) / 45)));
      const norm = h => h.replace(/[\s,।'"‘’-]/g, '');
      const used = [...full.map(x => x.hook), ...full.flatMap(x => (x.reels || []).map(r => r.hook))];
      const dup = rs => rs.filter(r => used.some(u => norm(u) === norm(r.hook)) || rs.some(o => o !== r && norm(o.hook) === norm(r.hook)));
      s.reels = await retry(() => findReels(a, n, used), r => r.length && r.every(x => BN.test(x.hook)) && !dup(r).length).catch(e => { s.reels_error = e.message; return []; });
      // Still a repeated headline: that reel is left out rather than going up with a copied headline.
      { const seen = new Set(used.map(norm)); s.reels = s.reels.filter(r => { const k = norm(r.hook); if (!k || seen.has(k)) return false; seen.add(k); return true; }); }
      console.log(`song ${i + 1}: ${mmss(s.start)}-${mmss(s.end)} reels ${s.reels.length}`);
    }
    plan = { drive: id, made: new Date().toISOString(), duration_s: Math.round(total), songs: full };
    // 3. Times: song k full, then its reels, in the concert slots after the concert queue (or START_AFTER).
    let after = Date.now() + 60 * 60e3;
    if (process.env.START_AFTER) after = Math.max(after, Date.parse(`${process.env.START_AFTER}:00+06:00`));
    else {
      try {
        const st = JSON.parse(fs.readFileSync(path.join(ROOT, 'state', 'concert.json'), 'utf8'));
        const ts = st.queue.filter(q => (q.kind || 'concert') === 'concert' && q.at).map(q => q.at);
        if (ts.length) after = Math.max(after, ...ts);
      } catch {}
    }
    const items = full.flatMap((s, i) => [{ key: `s${i + 1}` }, ...s.reels.map((r, j) => ({ key: `s${i + 1}r${j + 1}` }))]);
    const times = slotTimes(items.length, after);
    let k = 0;
    for (const s of full) { s.at = times[k++]; for (const r of s.reels) r.at = times[k++]; }
    fs.writeFileSync(PLAN, JSON.stringify(plan, null, 1));
    // Preview: a still per song, the list, and one sample reel.
    const lines = [`# Noble Man concert: ${full.length} full songs, ${full.reduce((a, s) => a + s.reels.length, 0)} reels\n`];
    for (const [i, s] of full.entries()) {
      const n = String(i + 1).padStart(2, '0');
      if (!hasVideo) { try { fs.unlinkSync(path.join(PV, `song${n}.jpg`)); } catch {} }
      if (hasVideo) ff(['-ss', String((s.start + s.end) / 2), '-i', src, '-frames:v', '1', '-vf', 'scale=360:-2', path.join(PV, `song${n}.jpg`)]);
      lines.push(`\n## গান ${i + 1} (${mmss(s.start)}-${mmss(s.end)}, ${mmss(s.end - s.start)}) | ${fmt(s.at)}\n${s.hook}\n`);
      for (const [j, r] of s.reels.entries()) lines.push(`- রিল ${j + 1} | ${fmt(r.at)} | গানের ${mmss(r.start)}-${mmss(r.end)} | ${r.hook}`);
    }
    fs.writeFileSync(path.join(PV, 'list.md'), lines.join('\n') + '\n');
    const s0 = full.find(s => s.reels.length);
    if (s0 && hasVideo) {
      const r0 = s0.reels[0], seg = `${B}/sample-src.mp4`;
      ff(['-ss', String(s0.start + r0.start - 1), '-t', String(r0.end - r0.start + 2), '-i', src, '-vf', "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)',fps=30",
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', seg]);
      const browser = await chromium.launch();
      try { await renderClip(browser, seg, { start: 1, end: 1 + r0.end - r0.start, hook: r0.hook, subs: r0.subs, tag: 'বিনোদন', foot: 'পুরো গানটি দেখুন উৎসব টিভির পেজে', cut: 0, focus: 'the lead singer' }, '', path.join(PV, 'sample.mp4'), B, 'smp'); }
      finally { await browser.close(); }
    }
  } else plan = JSON.parse(fs.readFileSync(PLAN, 'utf8'));
  out.steps.songs = plan.songs.length; out.steps.reels = plan.songs.reduce((a, s) => a + s.reels.length, 0); save();
  if (DRY) { console.log(fs.readFileSync(path.join(PV, 'list.md'), 'utf8')); return; }

  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).json();
  const pages = [ENT, process.env.FB_PAGE_ID, process.env.FB_PAGE_ID_2].filter(Boolean).map(pid => (acc.data || []).find(a => a.id === pid)).filter(Boolean).map(a => ({ id: a.id, token: a.access_token }));
  if (!pages.length) throw new Error('no Pages');
  const browser = await chromium.launch();
  const post = async (key, at, hook, file, jpg, kind) => {
    const rec = out.posts[key] = out.posts[key] || { at: new Date(at).toISOString(), hook, kind, ids: {}, errors: {} };
    for (const page of pages) {
      if (rec.ids[page.id]) continue;
      if (at < Date.now() + 15 * 60e3) { rec.errors[page.id] = 'slot already passed'; continue; }
      try {
        const vid = kind === 'song' ? await scheduleVideo(page, file, hook, songDesc(hook), at) : await scheduleReel(page, file, reelDesc(hook), at);
        rec.ids[page.id] = vid; delete rec.errors[page.id];
        await thumb(page, vid, jpg).catch(e => { rec.errors[`thumb_${page.id}`] = e.message; });
      } catch (e) { rec.errors[page.id] = e.message.slice(0, 300); }
    }
    save();
  };
  const doneAll = key => out.posts[key] && pages.every(p => out.posts[key].ids[p.id]);
  try {
    for (const [i, s] of plan.songs.entries()) {
      const sk = `s${i + 1}`, songFile = `${B}/song-${i + 1}.mp4`;
      if (doneAll(sk) && s.reels.every((r, j) => doneAll(`${sk}r${j + 1}`))) continue;
      cutSong(src, s, songFile);
      const sj = `${B}/song-${i + 1}.jpg`;
      ff(['-ss', String(Math.min(20, (s.end - s.start) / 2)), '-i', songFile, '-frames:v', '1', '-q:v', '3', sj]);
      if (!doneAll(sk)) await post(sk, s.at, s.hook, songFile, sj, 'song');
      for (const [j, r] of s.reels.entries()) {
        const rk = `${sk}r${j + 1}`;
        if (doneAll(rk)) continue;
        const rf = `${B}/reel-${rk}.mp4`, rj = `${B}/reel-${rk}.jpg`;
        // song file starts 1 s before the song
        // Reels come from the clean source, not songFile: songFile already carries the logo, which the reel crop cut in half (owner 2026-11-24).
        const o = Math.max(0, s.start - 1); // songFile second t = source second o + t
        await renderClip(browser, src, { start: r.start + 1 + o, end: r.end + 1 + o, hook: r.hook, subs: r.subs, tag: 'বিনোদন', foot: 'পুরো গানটি দেখুন উৎসব টিভির পেজে', cut: 0, focus: 'the lead singer' }, '', rf, B, rk);
        ff(['-ss', '2', '-i', rf, '-frames:v', '1', '-q:v', '3', rj]);
        await post(rk, r.at, r.hook, rf, rj, 'reel');
        fs.unlinkSync(rf);
      }
      fs.unlinkSync(songFile);
      console.log(`song ${i + 1} done`);
    }
  } finally { await browser.close(); save(); }
  const bad = Object.entries(out.posts).filter(([, r]) => Object.keys(r.errors).some(k => !k.startsWith('thumb_')));
  out.steps.failed = bad.map(([k]) => k); save();
  console.log(JSON.stringify(out.steps, null, 1));
  if (bad.length) process.exitCode = 1;
})().catch(e => { out.error = e.message; save(); console.error(e); process.exit(1); });
