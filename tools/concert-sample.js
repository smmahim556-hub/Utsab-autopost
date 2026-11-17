// Owner 2026-11-17 chose options 2 + 3 for concert headlines ("2 3 sample dekhao"):
//   A (option 2): ElevenLabs speech-to-text listens again; the headline quotes a line ONLY if it is verbatim in that transcript.
//   B (option 3): no lyric at all; the headline says what the song is about (father, love, the city ...).
// Renders a few sample reels from the saved Noble plan (both versions each), nothing is posted.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { renderClip, ff, secs, gemini } = require('../clips');
const ROOT = path.join(__dirname, '..'), B = '/mnt/big', PV = path.join(ROOT, 'preview', 'concert-sample');
const PLAN = path.join(ROOT, 'state', 'concert-big-plan.json'), OUT = path.join(ROOT, 'state', 'concert-sample-probe.json');
const id = process.env.DRIVE_ID, PICK = (process.env.SAMPLE_SONGS || '4,0,2').split(',').map(Number);
const BN = /[ঀ-৿]/, out = { at: new Date().toISOString(), items: [] };
const save = () => fs.writeFileSync(OUT, JSON.stringify(out, null, 1));

async function scribe(file) {
  for (const model of ['scribe_v2', 'scribe_v1']) {
    const fd = new FormData();
    fd.append('model_id', model); fd.append('language_code', 'ben'); fd.append('timestamps_granularity', 'word'); fd.append('tag_audio_events', 'false');
    fd.append('file', new Blob([fs.readFileSync(file)], { type: 'audio/mpeg' }), 'a.mp3');
    const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }, body: fd });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.text) return { model, text: j.text, words: (j.words || []).filter(w => w.type === 'word') };
    out[`scribe_${model}_error`] = `${r.status} ${JSON.stringify(j).slice(0, 300)}`; save();
  }
  return null;
}
const norm = s => String(s || '').replace(/[“”"'‘’,.।!?\-–—]/g, '').replace(/\s+/g, ' ').trim();

// APPLY=1 (owner 2026-11-17 'Duto miliye'): rewrite every headline of the saved plan, mixing both kinds: reels alternate
// between a verified lyric line (option 2) and a topic headline (option 3); a lyric line not verbatim in the ElevenLabs
// transcript falls back to the topic one. Subtitles come from the ElevenLabs words. Parts that are talk, not a song, are dropped.
async function apply(plan, src) {
  const PV2 = path.join(ROOT, 'preview', 'concert-big'), times = plan.songs.flatMap(s => [s.at, ...s.reels.map(r => r.at)]).sort((a, b) => a - b);
  const keep = [];
  for (const [i, s] of plan.songs.entries()) {
    const song = `${B}/s${i}.mp3`, it = { song: i + 1 };
    out.items.push(it);
    ff(['-ss', String(s.start), '-t', String(s.end - s.start), '-i', src, '-vn', '-ac', '1', '-ar', '44100', '-b:a', '96k', song]);
    const tr = await scribe(song);
    if (!tr) { it.error = 'no transcript'; save(); keep.push(s); continue; }
    it.transcript = tr.text.slice(0, 600);
    const parts = s.reels.map(r => tr.words.filter(w => w.start >= r.start - 0.5 && w.end <= r.end + 0.5));
    let g = null;
    for (let t = 0; t < 3 && !g; t++) {
      const x = await gemini([{ inline_data: { mime_type: 'audio/mp3', data: fs.readFileSync(song).toString('base64') } }, { text:
`এটি একটি লাইভ কনসার্টের রেকর্ডিংয়ের একটি অংশ। একটি স্পিচ-টু-টেক্সট টুল এর কথা এভাবে লিখেছে:
পুরো অংশ: ${tr.text}
${parts.map((p, j) => `রিল ${j + 1}: ${p.map(w => w.text).join(' ') || '(কথা নেই)'}`).join('\n')}
প্রথমে বলো kind: এটা গান হলে "song", আর বেশিরভাগই কথা বলা/ঘোষণা হলে "talk"।
তারপর ফেসবুকের হেডলাইন, প্রতিটি সর্বোচ্চ ১০-১২ শব্দ, অতিরঞ্জন নয়, গানের/শিল্পীর নাম নয়:
- song.b: গানের কথা উদ্ধৃত না করে গানটি কী নিয়ে (বাবা, মা, প্রেম, বিরহ, শহর, দেশ...) তা দিয়ে আকর্ষণীয় হেডলাইন।
- প্রতিটি রিলের জন্য line: ওই রিলের লেখা থেকে একটি অর্থপূর্ণ লাইন, হুবহু ওই লেখার শব্দ ক্রমানুসারে (কোনো শব্দ বদলাবে বা বানাবে না; লেখা অর্থহীন হলে ফাঁকা); a: সেই লাইন উদ্ধৃতিচিহ্নে + ৩-৫ শব্দের ছোট টান; b: কথা উদ্ধৃত না করে গানের বিষয় বা ওই মুহূর্ত নিয়ে হেডলাইন। সব হেডলাইন আলাদা ধাঁচের, একটার সঙ্গে আরেকটা যেন না মেলে।
শুধু এই JSON: {"kind":"song","song":{"b":"..."},"reels":[{"n":1,"line":"...","a":"...","b":"..."}]}` }]).catch(() => null);
      if (x && x.song && BN.test(x.song.b || '') && (x.reels || []).length >= s.reels.length) g = x;
    }
    if (!g) { it.error = 'no headlines'; save(); keep.push(s); continue; }
    it.kind = g.kind;
    if (g.kind === 'talk') { it.dropped = true; save(); continue; }
    s.old_hook = s.old_hook || s.hook; s.hook = g.song.b.trim();
    s.reels.forEach((r, j) => {
      const h = g.reels.find(x => Number(x.n) === j + 1) || g.reels[j] || {}, txt = parts[j].map(w => w.text).join(' ');
      const ok = h.line && norm(txt).includes(norm(h.line)) && BN.test(h.a || '');
      r.old_hook = r.old_hook || r.hook;
      r.hook = (ok && (j % 2 === 0 || !BN.test(h.b || ''))) ? h.a.trim() : (BN.test(h.b || '') ? h.b.trim() : r.hook);
      r.kind = r.hook === (h.a || '').trim() ? 'line' : 'topic'; r.line = ok ? h.line : '';
      const subs = [];
      for (let k = 0; k < parts[j].length; k += 6) { const w = parts[j].slice(k, k + 6); subs.push({ s: Math.max(0, w[0].start - r.start), e: w[w.length - 1].end - r.start, t: w.map(x => x.text).join(' ') }); }
      r.subs = subs;
    });
    keep.push(s); save();
    console.log(`song ${i + 1}: ${s.hook}`);
  }
  plan.songs = keep; let k = 0;
  for (const s of keep) { s.at = times[k++]; for (const r of s.reels) r.at = times[k++]; }
  plan.rehooked = new Date().toISOString();
  fs.writeFileSync(PLAN, JSON.stringify(plan, null, 1));
  const fmt = t => new Date(t).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const mmss = x => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, '0')}`;
  const lines = [`# Noble Man concert: ${keep.length} full songs, ${keep.reduce((x, s) => x + s.reels.length, 0)} reels (lyric line + topic headlines)\n`];
  for (const [i, s] of keep.entries()) {
    lines.push(`\n## গান ${i + 1} (${mmss(s.start)}-${mmss(s.end)}) | ${fmt(s.at)}\n${s.hook}\n`);
    for (const [j, r] of s.reels.entries()) lines.push(`- রিল ${j + 1} | ${fmt(r.at)} | ${r.hook}`);
  }
  fs.mkdirSync(PV2, { recursive: true }); fs.writeFileSync(path.join(PV2, 'list.md'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

(async () => {
  fs.mkdirSync(B, { recursive: true }); if (process.env.APPLY !== '1') fs.rmSync(PV, { recursive: true, force: true }); fs.mkdirSync(PV, { recursive: true });
  const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8')), src = `${B}/src.mp4`;
  if (!fs.existsSync(src)) {
    execFileSync('curl', ['-sSL', '--retry', '3', '-o', src, `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`], { stdio: 'inherit' });
    if (fs.statSync(src).size < 1e8) { const t = fs.readFileSync(src, 'utf8').slice(0, 300); out.error = /Quota exceeded/.test(t) ? 'Drive quota exceeded' : t; save(); throw new Error(out.error); }
  }
  if (process.env.APPLY === '1') return apply(plan, src);
  const browser = await chromium.launch();
  try {
    for (const [k, si] of PICK.entries()) {
      const s = plan.songs[si], r = s.reels[0], it = { song: si + 1, reel: `${Math.round(r.start)}-${Math.round(r.end)}` };
      out.items.push(it);
      const song = `${B}/s${k}.mp3`;
      ff(['-ss', String(s.start), '-t', String(s.end - s.start), '-i', src, '-vn', '-ac', '1', '-ar', '44100', '-b:a', '96k', song]);
      const tr = await scribe(song);
      it.transcript = tr ? tr.text : null; it.model = tr && tr.model; save();
      const inReel = tr ? tr.words.filter(w => w.start >= r.start - 0.5 && w.end <= r.end + 0.5) : [];
      it.reel_text = inReel.map(w => w.text).join(' ');
      const a = await gemini([{ inline_data: { mime_type: 'audio/mp3', data: fs.readFileSync(song).toString('base64') } }, { text:
`এটি একটি লাইভ কনসার্টের একটি বাংলা গান। একটি স্পিচ-টু-টেক্সট টুল গানটির কথা এভাবে লিখেছে:
পুরো গান: ${it.transcript || '(নেই)'}
রিলের অংশ (${it.reel}): ${it.reel_text || '(নেই)'}
দুটি ফেসবুক রিল হেডলাইন দাও, প্রতিটি সর্বোচ্চ ১০ শব্দ, অতিরঞ্জন নয়, গানের/শিল্পীর নাম নয়:
A) রিলের অংশের লেখা থেকে একটি অর্থপূর্ণ লাইন উদ্ধৃতিচিহ্নে, হুবহু ওই লেখার শব্দগুলো ক্রমানুসারে (নিজে কোনো শব্দ বদলাবে বা বানাবে না), তারপর ৩-৫ শব্দের ছোট টান। লেখাটা অর্থহীন/ভাঙা হলে line ফাঁকা দাও।
B) কোনো গানের কথা উদ্ধৃত না করে, গানটি কী নিয়ে (যেমন বাবা, মা, প্রেম, বিরহ, শহরের জীবন, দেশ) তা দিয়ে আকর্ষণীয় হেডলাইন, যাতে মানুষ থেমে দেখে।
শুধু এই JSON: {"line":"...","a":"...","topic":"...","b":"..."}` }]).catch(e => ({ error: e.message }));
      Object.assign(it, { line: a.line || '', a: a.a || '', topic: a.topic || '', b: a.b || '' });
      it.line_ok = !!it.line && norm(it.reel_text).includes(norm(it.line));
      save();
      const seg = `${B}/seg${k}.mp4`;
      ff(['-ss', String(s.start + r.start - 1), '-t', String(r.end - r.start + 2), '-i', src, '-vf', "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)',fps=30", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', seg]);
      const base = { start: 1, end: 1 + r.end - r.start, tag: 'বিনোদন', foot: 'পুরো গানটি দেখুন উৎসব টিভির পেজে', cut: 0, focus: 'the lead singer' };
      // A: subtitles straight from the ElevenLabs words (6 words a line).
      const subs = [];
      for (let i = 0; i < inReel.length; i += 6) { const g = inReel.slice(i, i + 6); subs.push({ s: Math.max(0, g[0].start - r.start) + 1, e: g[g.length - 1].end - r.start + 1, t: g.map(w => w.text).join(' ') }); }
      if (it.line_ok && BN.test(it.a)) await renderClip(browser, seg, { ...base, hook: it.a, subs }, '', path.join(PV, `a${k + 1}.mp4`), B, `a${k}`);
      if (BN.test(it.b)) await renderClip(browser, seg, { ...base, hook: it.b, subs: [] }, '', path.join(PV, `b${k + 1}.mp4`), B, `b${k}`);
      save();
    }
  } finally { await browser.close(); }
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { out.error = out.error || e.message; save(); console.error(e); process.exit(1); });
