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
const POSTED_END = { 'gd:1VWjzshSVkBCCjohLoT5n_uvtn09C0kWW@24.5': 52, 'gd:1EhU6JTEdp44jOCDce3ga0uVYyQ0rGUsD@20': 70 };

const PROMPT = `এটি একটি লাইভ কনসার্টের ছোট একটি অংশের অডিও। মন দিয়ে পুরোটা শোনো।
এই অংশে আসলে কী শোনা যাচ্ছে তা বুঝে ফেসবুক রিলের জন্য একটি ছোট বাংলা শিরোনাম দাও (৫-৯ শব্দ)।
শিরোনাম গানের আসল মেজাজ (যেমন উৎসবের, দেশের গান, প্রেমের, বিরহের, মজার, জোশের) আর দর্শকের আসল প্রতিক্রিয়া (গলা মেলানো, হাততালি, চিৎকার) অনুযায়ী হবে।
নিয়ম: গানের নাম বা শিল্পীর নাম লিখবে না। যা শোনা যাচ্ছে না তা বানাবে না। অতিরঞ্জন নয়। নিশ্চিত না হলে সাধারণ কিন্তু সঠিক শিরোনাম দাও।
এছাড়া এক লাইনে লেখো কী শুনলে (heard: গানের ধরন, কণ্ঠ, দর্শক), আর গানের মেজাজ এক-দুই শব্দে (mood)।
শুধু এই JSON দাও: {"hook":"শিরোনাম","mood":"মেজাজ","heard":"যা শুনলাম"}`;

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
    const item = { posted: j.posted, video: j.video, start: j.start, end: j.end, at: j.at ? new Date(j.at).toISOString() : null, old: j.old, hook: r && r.hook || null, mood: r && r.mood || null, heard: r && r.heard || null, error: r && r.error || null };
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
