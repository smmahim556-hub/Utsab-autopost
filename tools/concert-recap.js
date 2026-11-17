// Owner 2026-11-15: concert reel captions must come from listening to the song, not from guesses.
// For every held concert reel (and the two already posted from this batch), Gemini listens to the clip's own audio and writes
// a short Bengali headline (no song or artist name). Writes state/concert-recap-probe.json for review.
// APPLY=1: write the new hooks into state/concert.json (kept held unless RELEASE=1) and, for the posted reels listed in
// EDIT (comma separated start offsets), replace the Facebook caption on every page with the new hook.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { gemini, ff } = require('../clips');
const ROOT = path.join(__dirname, '..'), FILE = path.join(ROOT, 'state', 'concert.json'), OUT = path.join(ROOT, 'state', 'concert-recap-probe.json');
const W = '/tmp/concert-recap';
const G = 'https://graph.facebook.com/v26.0';
const APPLY = process.env.APPLY === '1', RELEASE = process.env.RELEASE === '1';
const EDIT = (process.env.EDIT || '').split(',').filter(Boolean).map(Number);
// Ends of the two posted reels (done entries keep only the start).
const POSTED_END = {};

// Owner 2026-11-17: mood headlines 'kono caption er moddhei pore na'; the headline must come from what is SUNG in the part.
const PROMPT = `এটি একটি লাইভ কনসার্টের একটি বাংলা গানের ছোট অংশের অডিও। মন দিয়ে গানের কথা শোনো।
ফেসবুক রিলের হেডলাইন বানাতে হবে এই অংশে গাওয়া কথা থেকে, যাতে মানুষ দেখেই গানটা চিনে ফেলে।
line: এই অংশে স্পষ্ট গাওয়া সবচেয়ে আকর্ষণীয়/পরিচিত লাইনটি হুবহু যেমন গাওয়া হয়েছে (মুখড়া/কোরাস হলে সবচেয়ে ভালো)।
hook: সেই লাইনটি উদ্ধৃতিচিহ্নে, তারপর ছোট আকর্ষণীয় অংশ (৩-৬ শব্দ, যেমন: লাইভে শুনুন একবার / কনসার্টে গলা মেলালেন দর্শক / মন ছুঁয়ে যাবে)।
নিয়ম: কথা বানাবে না; কোনো লাইন স্পষ্ট শোনা না গেলে line ফাঁকা রেখে hook-এ ওই অংশে যা হচ্ছে তা লেখো (গিটার সোলো, দর্শকের গলা মেলানো)। গানের বা শিল্পীর নাম নয়, অতিরঞ্জন নয়।
শুধু এই JSON দাও: {"line":"...","hook":"...","heard":"যা শুনলাম"}`;

const desc = hook => `${hook}\n\nউৎসব টিভির কনসার্ট থেকে।\n\n#utsabtv #কনসার্ট #বিনোদন #গান`;

(async () => {
  // probe.yml has no ffmpeg step (clips.yml does).
  execFileSync('bash', ['-c', 'which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)'], { stdio: 'inherit' });
  const st = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  fs.mkdirSync(W, { recursive: true });
  const doneKeys = new Set((st.done || []).map(d => d.video));
  const jobs = [];
  for (const d of st.done || []) {
    const end = POSTED_END[`${d.video}@${d.start}`];
    if (end) jobs.push({ posted: true, ref: d, video: d.video, start: d.start, end, old: d.hook });
  }
  for (const q of st.queue) {
    if ((q.kind || 'concert') !== 'concert' || doneKeys.has(q.video) && !q.hold) continue;
    if (!q.hold) continue;
    jobs.push({ posted: false, ref: q, video: q.video, start: q.clip.start, end: q.clip.end, old: q.clip.hook, at: q.at });
  }
  const files = {};
  const out = { at: new Date().toISOString(), apply: APPLY, items: [] };
  for (const j of jobs) {
    const id = j.video.replace(/^gd:/, '');
    if (!files[id]) {
      const f = `${W}/${id}.mp4`;
      if (!fs.existsSync(f)) execFileSync('curl', ['-sSL', '--retry', '3', '-o', f, `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`]);
      files[id] = f;
    }
    const a = `${W}/${id}-${j.start}.mp3`;
    ff(['-ss', String(j.start), '-t', String(j.end - j.start), '-i', files[id], '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', a]);
    let r = null;
    try { r = await gemini([{ inline_data: { mime_type: 'audio/mp3', data: fs.readFileSync(a).toString('base64') } }, { text: PROMPT }]); } catch (e) { r = { error: e.message }; }
    const item = { posted: j.posted, video: j.video, start: j.start, end: j.end, at: j.at ? new Date(j.at).toISOString() : null, old: j.old, hook: r && r.hook || null, line: r && r.line || null, heard: r && r.heard || null, error: r && r.error || null };
    out.items.push(item);
    console.log(JSON.stringify(item));
    if (APPLY && item.hook) {
      if (!j.posted) j.ref.clip.hook = item.hook;
      else j.ref.hook = item.hook;
    }
  }
  if (APPLY && EDIT.length) {
    const T = process.env.FB_USER_TOKEN;
    const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
    out.edits = [];
    for (const it of out.items.filter(i => i.posted && EDIT.includes(i.start) && i.hook)) {
      const d = st.done.find(x => x.video === it.video && x.start === it.start);
      for (const [pid, vid] of Object.entries(d.ids || {})) {
        const page = (acc.data || []).find(a => a.id === pid);
        if (!page) { out.edits.push({ pid, vid, error: 'no page token' }); continue; }
        const f = new FormData(); f.append('description', desc(it.hook)); f.append('access_token', page.access_token);
        const r = await (await fetch(`${G}/${vid}`, { method: 'POST', body: f })).json().catch(e => ({ error: { message: e.message } }));
        out.edits.push({ pid, vid, ok: !!r.success, error: r.error ? r.error.message : null });
      }
    }
    console.log(JSON.stringify(out.edits));
  }
  if (APPLY && RELEASE) for (const q of st.queue) if ((q.kind || 'concert') === 'concert' && q.hold) delete q.hold;
  if (APPLY) fs.writeFileSync(FILE, JSON.stringify(st, null, 1));
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
