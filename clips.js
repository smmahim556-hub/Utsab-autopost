// Long video -> short "hook" reels (owner's idea, 2026-10-29). Gemini listens to the audio and picks the strongest
// stand-alone moments (each opening on a hook) with Bangla subtitles; ffmpeg cuts them into 9:16 reels with the
// Utsab TV frame: hook headline on top, the video in the middle over a blurred copy, subtitles below, red footer.
// Bangla text is drawn by Chromium (ffmpeg's drawtext can't shape Bangla) and laid over as PNGs.
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ff = args => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { maxBuffer: 1 << 26 });
const secs = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString()) || 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LOGO_VIDEO = path.join(__dirname, 'assets', 'video-logo.webm');
const FONT = '<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700;800;900&display=swap" rel="stylesheet">';

// The first complete JSON array/object in a model reply (it sometimes adds a second block or text after it).
function firstJson(t) {
  const i = t.search(/[[{]/);
  if (i < 0) return null;
  let depth = 0, str = false;
  for (let k = i; k < t.length; k++) {
    const c = t[k];
    if (str) { if (c === '\\') k++; else if (c === '"') str = false; continue; }
    if (c === '"') str = true; else if (c === '[' || c === '{') depth++; else if (c === ']' || c === '}') { if (--depth === 0) { try { return JSON.parse(t.slice(i, k + 1)); } catch { return null; } } }
  }
  return null;
}
async function gemini(parts) {
  for (const model of (process.env.CLIP_MODELS || 'gemini-3.5-flash,gemini-3-flash-preview,gemini-3.1-flash-lite').split(',')) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(300000),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.3, responseMimeType: 'application/json' } }) }).catch(() => null);
    const b = r ? await r.json().catch(() => ({})) : {};
    const t = (b.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    if (t) { const j = firstJson(t); if (j) return j; }
  }
  throw new Error('Gemini gave no clip plan');
}

// -> [{ start, end, hook, subs: [{ s, e, t }] }] (times in seconds; subs relative to the clip start)
async function planClips(video, work, n = 2, kind = 'news') {
  const audio = path.join(work, 'audio.mp3');
  ff(['-i', video, '-vn', '-ac', '1', '-ar', '16000', '-b:a', kind === 'podcast' ? '16k' : '32k', audio]);
  const total = Math.round(secs(audio));
  const concert = `এটি উৎসব টিভির একটি কনসার্ট লাইভের অডিও (মোট ${total} সেকেন্ড)। ফেসবুক রিলের জন্য এর ভেতর থেকে সবচেয়ে জমজমাট গানের অংশগুলো বেছে নাও, যত বেশি ভালো অংশ পাও (সর্বোচ্চ ${n}টি), প্রতিটি আলাদা গান থেকে।
নিয়ম: প্রতিটি অংশ ২০-৫৫ সেকেন্ড, গানের সবচেয়ে পরিচিত বা জমজমাট অংশ (কোরাস, দর্শকের গলা মেলানো), লাইনের মাঝখানে শুরু বা শেষ নয়। কথাবার্তা, সাউন্ড চেক, নীরবতা বা ভাঙা অডিও বাদ দাও।
${process.env.CONCERT_ARTIST ? `শিল্পী: ${process.env.CONCERT_ARTIST}। প্রতিটির জন্য নিউজ স্টাইলের হুক শিরোনাম দাও, গানের নামসহ, যেমন: কনসার্টে ${process.env.CONCERT_ARTIST}ের কণ্ঠে 'গানের নাম', মাতালেন দর্শক (সর্বোচ্চ ১২ শব্দ, প্রতিটি শিরোনাম আলাদা ধাঁচের)। গানের নাম নিশ্চিত না হলে নাম বানাবে না, তখন গানের একটি লাইন উদ্ধৃতিচিহ্নে দাও। অডিও ছোট হলে (৭০ সেকেন্ডের কম) পুরো গানের অংশটাই একটি রিল হতে পারে।` : `প্রতিটির জন্য হুক শিরোনাম: গানের নাম আর শিল্পী নিশ্চিত হলে 'গানের নাম' - শিল্পী, নিশ্চিত না হলে গানের একটি লাইন উদ্ধৃতিচিহ্নে (সর্বোচ্চ ১০ শব্দ, অনুমানে নাম বানাবে না)।`} আর হুবহু গানের কথার সাবটাইটেল দাও,
প্রতিটি সাবটাইটেল সর্বোচ্চ ৮-১০ শব্দ, সময় অংশের শুরু থেকে সেকেন্ডে।
শুধু এই JSON দাও: [{"start":12.5,"end":48.0,"hook":"শিরোনাম","subs":[{"s":0.0,"e":2.6,"t":"কথা"}]}]`;
  // Podcast (owner 2026-11-09): ~1-minute self-contained parts; each also names its strongest 5 seconds (hs-he), which the reel
  // plays first as a hook and then the whole minute (reel ~1:05).
  const podcast = `এটি উৎসব টিভির একটি পডকাস্ট পর্বের অডিও (মোট ${total} সেকেন্ড)। ${process.env.PODCAST_CONTEXT ? `পর্বের পরিচিতি: ${process.env.PODCAST_CONTEXT}\n` : ''}ফেসবুক রিলের জন্য এর ভেতর থেকে যত বেশি সম্ভব (সর্বোচ্চ ${n}টি) ভালো অংশ বেছে নাও, পরস্পর ওভারল্যাপ নয়।
নিয়ম: প্রতিটি অংশ ৫৫-৬৫ সেকেন্ড, নিজে নিজে বোঝা যায় এমন একটি গল্প, মজার ঘটনা, মতামত বা গাওয়া গান; বাক্য বা গানের লাইনের মাঝখানে শুরু বা শেষ নয়। শুরু-শেষের ভূমিকা, বিজ্ঞাপন, নীরবতা বাদ।
প্রতিটির ভেতর থেকে সবচেয়ে চোখ আটকানো ৪-৬ সেকেন্ড (হুক: চমকে দেওয়া কথা, হাসি, গানের সেরা লাইন) বেছে দাও, hs-he (সেকেন্ডে, পুরো অডিওর হিসেবে, start-end এর ভেতরে, পুরো বাক্য)।
আর একটি শিরোনাম দাও (সর্বোচ্চ ১০ শব্দ, যা বলা হয়েছে তার ভিত্তিতে, অতিরঞ্জন বা মিথ্যা নয়; কারো কথা হলে উদ্ধৃতিচিহ্নে রেখে বক্তার নাম দাও; গানের নাম নিশ্চিত না হলে নাম বানাবে না)।
শুধু এই JSON দাও: [{"start":120.0,"end":182.0,"hs":150.0,"he":155.0,"hook":"শিরোনাম"}]`;
  const plan = await gemini([{ inline_data: { mime_type: 'audio/mp3', data: fs.readFileSync(audio).toString('base64') } }, { text: kind === 'podcast' ? podcast : kind === 'concert' ? concert :
`এটি একটি বাংলাদেশি নিউজ চ্যানেলের ভিডিওর অডিও (মোট ${Math.round(secs(audio))} সেকেন্ড)। ফেসবুক রিলের জন্য এর ভেতর থেকে সবচেয়ে আকর্ষণীয় ${n}টি অংশ বেছে নাও।
নিয়ম: প্রতিটি অংশ ২০-৫০ সেকেন্ড, আলাদাভাবে বোঝা যায় এমন, আর প্রথম ৩ সেকেন্ডেই চোখ আটকানো কথা (হুক) দিয়ে শুরু। বাক্যের মাঝখানে শুরু বা শেষ নয়।
প্রতিটির জন্য একটি ছোট হুক শিরোনাম (সর্বোচ্চ ৮ শব্দ, যা বলা হয়েছে তার ভিত্তিতে, অতিরঞ্জন বা মিথ্যা নয়; কারো মন্তব্য হলে উদ্ধৃতিচিহ্নে রেখে বক্তার পরিচয় দাও, যেমন: 'কথা', বললেন অমুক — চ্যানেলের নিজের মত নয়) আর হুবহু কথাগুলোর সাবটাইটেল দাও,
প্রতিটি সাবটাইটেল সর্বোচ্চ ৮-১০ শব্দ, সময় অংশের শুরু থেকে সেকেন্ডে।
শুধু এই JSON দাও: [{"start":12.5,"end":48.0,"hook":"শিরোনাম","subs":[{"s":0.0,"e":2.6,"t":"কথা"}]}]` }]);
  const dur = secs(video);
  return (Array.isArray(plan) ? plan : []).filter(c => c.end > c.start + 8 && c.start >= 0 && c.start < dur)
    .map(c => {
      const subs = (c.subs || []).filter(x => x.t && x.e > x.s).sort((a, b) => a.s - b.s);
      subs.forEach((x, i) => { if (subs[i + 1] && x.e > subs[i + 1].s - 0.05) x.e = subs[i + 1].s - 0.05; }); // one subtitle on screen at a time
      const pre = kind === 'podcast' && c.he > c.hs && c.he - c.hs <= 8 && c.hs >= c.start && c.he <= c.end + 1 ? { s: c.hs, e: c.he } : undefined;
      return { ...c, end: Math.min(c.end, dur), subs: subs.filter(x => x.e > x.s), ...(pre ? { pre } : {}) };
    }).slice(0, n);
}

async function overlay(browser, html, file, w, h) {
  const pg = await browser.newPage({ viewport: { width: w, height: h } });
  await pg.setContent(`<!doctype html><meta charset="utf-8">${FONT}<style>*{margin:0;padding:0;box-sizing:border-box}html,body{background:transparent}
body{width:${w}px;height:${h}px;font-family:'Noto Serif Bengali',serif;font-weight:800;display:flex;align-items:center;justify-content:center;text-align:center}</style>${html}`, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: file, omitBackground: true });
  await pg.close();
  return file;
}

function preCut(video, clip, work, tag) {
  const src = path.join(work, `${tag}-pre.mp4`), enc = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac', '-b:a', '160k', '-r', '30', '-ar', '44100'];
  ff(['-ss', String(clip.pre.s), '-t', String(clip.pre.e - clip.pre.s), '-i', video, ...enc, path.join(work, `${tag}-a.mp4`)]);
  ff(['-ss', String(clip.start), '-t', String(clip.end - clip.start), '-i', video, ...enc, path.join(work, `${tag}-b.mp4`)]);
  ff(['-i', path.join(work, `${tag}-a.mp4`), '-i', path.join(work, `${tag}-b.mp4`), '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]', '-map', '[v]', '-map', '[a]', ...enc, src]);
  return { video: src, clip: { ...clip, pre: undefined, start: 0, end: secs(src) } };
}

// Where to point the square crop, second by second (owner 2026-11-09: in the master shot frame the guest). One contact sheet
// (1 frame per second) goes to Gemini, which marks each frame wide (2+ people) or single and where the person to follow is;
// runs of alike seconds become shots, their edges snapped to real cuts found by scene detection.
const NUMFONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
async function shotPlan(video, start, len, work, tag, focus) {
  // Shots come only from real picture cuts (owner 2026-11-09: the crop must never jump inside one camera shot). The earlier
  // per-second shot labels split shots where nothing cut, which made the frame jolt.
  const r = require('child_process').spawnSync('ffmpeg', ['-hide_banner', '-ss', String(start), '-t', String(len), '-i', video, '-an', '-vf', "scale=320:-2,select='gt(scene,0.12)',showinfo", '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const cuts = [...(r.stderr || '').matchAll(/pts_time:\s*([\d.]+)/g)].map(m => Number(m[1])).filter(c => c > 0.6 && c < len - 0.6);
  const shots = [{ t: 0, wide: false, x: 0.5, y: 0.3 }];
  for (const c of cuts) if (c - shots[shots.length - 1].t >= 0.6) shots.push({ t: c, wide: false, x: 0.5, y: 0.3 });
  shots.sort((a, b) => a.t - b.t);
  shots.forEach((sh, i) => { const nx = shots[i + 1]; sh.mid = ((sh.t + (nx ? nx.t : len)) / 2); });
  // 2) One sharp frame per shot for where the person to follow is (labels can be wrong, so no reuse).
  for (const [i, sh] of shots.entries()) {
    const jpg = path.join(work, `${tag}-shot${i}.jpg`);
    ff(['-ss', String(start + sh.mid), '-i', video, '-frames:v', '1', '-vf', 'scale=960:-2', jpg]);
    try {
      const j = await gemini([{ inline_data: { mime_type: 'image/jpeg', data: fs.readFileSync(jpg).toString('base64') } }, { text:
`A frame from a video podcast. Find ${focus || 'the main speaker'}; if that person is not in the frame, use the most prominent person. Give the centre of that person's face as fractions of the frame width and height (0-1), and how many people are visible. JSON only: {"x":0.5,"y":0.3,"people":1}` }]);
      const a = Array.isArray(j) ? j[0] : j;
      if (a && Number(a.x) >= 0 && Number(a.x) <= 1) Object.assign(sh, { x: Number(a.x), y: Number(a.y) || 0.3, wide: Number(a.people) >= 2 });
      else console.log('shot', i, 'odd answer', JSON.stringify(j).slice(0, 160));
    } catch (e) { console.log('shot', i, 'gemini failed', e.message); }
  }
  // Same camera again (e.g. A-B-A, or a false cut inside one shot): give it exactly the same crop as the last time it was seen, so it never shifts a little.
  for (const [i, sh] of shots.entries()) {
    const same = shots.slice(0, i).find(o => o.wide === sh.wide && Math.abs(o.x - sh.x) < 0.06 && Math.abs(o.y - sh.y) < 0.06);
    if (same) Object.assign(sh, { x: same.x, y: same.y });
  }
  console.log('shots', JSON.stringify(shots.map(s => [Number(s.t.toFixed(2)), s.wide ? 'W' : 'S', s.x, s.y])));
  return shots.length ? shots : [{ t: 0, wide: false, x: 0.5, y: 0.3 }];
}

// The owner's own podcast template ('গান-বাজ', 2026-11-09 sample): dark green-red backdrop, his animated logo top centre,
// series pill, two-line headline (second line on a red band), a 1:1 picture in a green-pink glowing frame, a live audio
// waveform, a progress bar with the clock, and the follow line at the bottom.
async function renderGanbaz(browser, video, clip, outFile, work, tag) {
  const W = 1080, H = 1920, BX = 54, BY = 636, BW = 972, IN = 6, SQ = BW - 2 * IN, len = clip.end - clip.start;
  const words = String(clip.hook || '').replace(/\s+-\s+[^-]+$/, '').split(/\s+/);
  const cut = Math.max(1, Math.round(words.length * 0.45));
  const h1 = clip.h1 || words.slice(0, cut).join(' '), h2 = clip.h2 || words.slice(cut).join(' ');
  const mmss = t => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
  const cassette = (w, c = '#fff') => `<svg width="${w}" viewBox="0 0 64 40"><rect x="2" y="2" width="60" height="36" rx="6" fill="none" stroke="${c}" stroke-width="3"/><circle cx="20" cy="18" r="6" fill="none" stroke="${c}" stroke-width="3"/><circle cx="44" cy="18" r="6" fill="none" stroke="${c}" stroke-width="3"/><path d="M14 38 L20 30 L44 30 L50 38" fill="none" stroke="${c}" stroke-width="3"/></svg>`;
  const frame = await overlay(browser, `<div style="position:absolute;inset:0;background:radial-gradient(circle at 12% 22%,rgba(22,150,80,.55),transparent 42%),radial-gradient(circle at 92% 62%,rgba(200,32,47,.5),transparent 45%),radial-gradient(circle at 20% 92%,rgba(22,150,80,.35),transparent 40%),#0c1411">
<div style="position:absolute;left:0;right:0;top:300px;display:flex;justify-content:center"><div style="display:flex;align-items:center;gap:14px;padding:6px 28px;border-radius:40px;border:2px solid rgba(255,255,255,.35);background:rgba(0,0,0,.35);color:#fff;font-size:28px;font-weight:700">${cassette(40)}${esc(clip.series || 'গানবাজ · গানের পেছনের গল্প')}</div></div>
<div style="position:absolute;left:30px;right:30px;top:392px;text-align:center;color:#fff;font-size:${h1.length > 22 ? 56 : 64}px;line-height:1.25;font-weight:900;text-shadow:0 4px 12px rgba(0,0,0,.6)">${esc(h1)}</div>
<div style="position:absolute;left:0;right:0;top:${h2 ? 490 : 9999}px;display:flex;justify-content:center"><div style="background:#e63946;color:#fff;font-size:${h2.length > 24 ? 52 : 60}px;line-height:1.25;font-weight:900;padding:2px 24px 10px;border-radius:10px;box-shadow:0 6px 20px rgba(230,57,70,.45)">${esc(h2)}</div></div>
<div style="position:absolute;left:${BX}px;top:${BY}px;width:${BW}px;height:${BW}px;border-radius:26px;background:linear-gradient(135deg,#2ee6a8,#1aa36f 40%,#e8457a);box-shadow:-14px 0 40px rgba(46,230,168,.45),14px 0 40px rgba(232,69,122,.45)"><div style="position:absolute;inset:${IN}px;border-radius:21px;background:#000"></div></div>
<div style="position:absolute;left:${BX}px;top:1731px;width:${BW}px;height:6px;border-radius:3px;background:rgba(255,255,255,.22)"></div>
<div style="position:absolute;left:${BX}px;top:1800px;display:flex;align-items:center;gap:22px"><div style="width:120px;height:78px;border-radius:12px;background:#2a2a2a;border:3px solid #555;display:flex;align-items:center;justify-content:center">${cassette(86, '#e8e8e8')}</div>
<div><div style="color:#fff;font-size:34px;font-weight:900;line-height:1.2">${esc(clip.show || 'গানবাজ')}</div><div style="color:#ddd;font-size:26px;font-weight:700">পুরো পর্ব দেখতে <span style="color:#ff5468">ফলো করুন</span></div></div></div></div>`,
    path.join(work, `${tag}-gframe.png`), W, H);
  const grad = await overlay(browser, '<div style="width:100%;height:100%;background:linear-gradient(90deg,#2ee6a8,#e8457a)"></div>', path.join(work, `${tag}-grad.png`), BW, 96);
  const dot = await overlay(browser, '<div style="width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 0 10px #2ee6a8"></div>', path.join(work, `${tag}-dot.png`), 26, 26);
  const [vw, vh] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', video]).toString().trim().split(',').map(Number);
  // Each camera shot is cropped on its own: a single-person shot keeps the full height, a wide (master) shot zooms in on the
  // person to follow (owner: frame the guest in the master shot); then the pieces are joined back.
  const shots = await shotPlan(video, clip.start, len, work, tag, clip.focus);
  // Rounded mask so the picture's own corners do not poke out past the frame's rounded inner edge (owner 2026-11-09).
  const rmask = await overlay(browser, `<div style="position:absolute;inset:0;background:#000"></div><div style="position:absolute;inset:0;border-radius:21px;background:#fff"></div>`, path.join(work, `${tag}-rmask.png`), SQ, SQ);
  const ev = n => Math.max(2, Math.round(n / 2) * 2);
  const fps = (([a, b]) => a / (b || 1))(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', video]).toString().trim().split('/').map(Number));
  const pieces = shots.map((p, i) => {
    const t0 = p.t, t1 = i + 1 < shots.length ? shots[i + 1].t : len;
    const S = ev(Math.min(vw, vh * (p.wide ? 0.5 : 0.8)));
    let x = Math.max(0, Math.min(vw - S, p.x * vw - S / 2)), y = Math.max(0, Math.min(vh - S, p.y * vh - S * 0.32));
    // Keep the source's own corner logo (top right) out of the square by sliding left of it.
    // Slide left only if the person still stays inside the square (owner 2026-11-11: the face left the frame at shot changes).
    if (x + S > vw * 0.82 && y < vh * 0.2) { const nx = Math.max(0, Math.min(x, vw * 0.82 - S)); if (p.x * vw >= nx + S * 0.15 && p.x * vw <= nx + S * 0.85) x = nx; }
    x = Math.round(x); y = Math.round(y);
    // Cut by frame number, not time: time rounding put the new crop 1-2 frames after the real cut (owner: frame jolts).
    const f0 = Math.round(t0 * fps), f1 = Math.round(t1 * fps);
    return `[sv${i}]trim=start_frame=${f0}${i + 1 < shots.length ? `:end_frame=${f1}` : ''},setpts=PTS-STARTPTS,crop=${S}:${S}:${x}:${y},scale=${SQ}:${SQ}:flags=lanczos,setsar=1[p${i}]`;
  });
  const cropGraph = `[0:v]split=${shots.length}${shots.map((_, i) => `[sv${i}]`).join('')};${pieces.join(';')};${shots.map((_, i) => `[p${i}]`).join('')}concat=n=${shots.length}:v=1:a=0[sq];`;
  const anim = fs.existsSync(LOGO_VIDEO), font = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
  const clock = fs.existsSync(font) ? `,drawtext=fontfile=${font}:text='%{eif\\:t/60\\:d}\\:%{eif\\:mod(t\\,60)\\:d\\:2}':x=${BX}:y=1752:fontsize=28:fontcolor=0xbbbbbb,drawtext=fontfile=${font}:text='${mmss(len).replace(':', '\\:')}':x=${BX + BW}-tw:y=1752:fontsize=28:fontcolor=0xbbbbbb` : '';
  const f = cropGraph +
    `[8:v]format=gray[rm];[sq][rm]alphamerge[sqr];[1:v][sqr]overlay=${BX + IN}:${BY + IN}[b1];` +
    // Audio bars: a 61-band spectrum, mirrored, blown up so each band is one 16px column (10px bar + gap).
    `[0:a]aresample=12000,pan=mono|c0=c0,showfreqs=s=61x48:mode=bar:ascale=log:fscale=log:win_size=1024:averaging=2:colors=white:rate=30[fq];color=black:s=61x48:r=30[blk];[blk][fq]overlay=shortest=1,format=gray,split[fa][fb];[fb]vflip[fv];[fa][fv]vstack,scale=976:96:flags=neighbor,crop=${BW}:96:2:0[m];` +
    `[3:v]format=gray[st];[m][st]blend=all_mode=multiply:shortest=1[mk];[4:v]format=rgb24[g];[g][mk]alphamerge[w];[b1][w]overlay=${BX}:1620[b2];` +
    `[6:v][5:v]overlay=x='-${BW}+${BW}*t/${len.toFixed(2)}'[tr];[b2][tr]overlay=${BX}:1731[b3];` +
    `[b3][7:v]overlay=x='${BX - 13}+${BW}*t/${len.toFixed(2)}':y=1721${clock}[b4]` +
    (anim ? `;[2:v]setpts=PTS-STARTPTS,scale=300:-2[lg];[b4][lg]overlay=(W-w)/2:118:shortest=0[v]` : `;[b4]null[v]`);
  ff(['-ss', String(clip.start), '-t', String(len), '-i', video, '-loop', '1', '-i', frame,
    ...(anim ? ['-stream_loop', '-1', '-c:v', 'libvpx-vp9', '-i', LOGO_VIDEO] : ['-f', 'lavfi', '-i', 'color=black:s=2x2']),
    '-f', 'lavfi', '-i', `color=black:s=${BW}x96:r=30,format=gray,geq=lum='if(lt(mod(X\\,16)\\,10)\\,255\\,0)'`,
    '-loop', '1', '-i', grad,
    '-f', 'lavfi', '-i', `color=0x2ee6a8:s=${BW}x6:r=30`, '-f', 'lavfi', '-i', `color=0x3a3f3d:s=${BW}x6:r=30`, '-loop', '1', '-i', dot, '-loop', '1', '-i', rmask,
    '-filter_complex', f, '-map', '[v]', '-map', '0:a?', '-t', String(len), '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outFile]);
  return outFile;
}

// Owner's look (2026-10-29, second try): a 9:16 Utsab TV template with the video as a 1:1 square inside it. Header: our logo +
// the hook headline; the square video in the middle (a landscape package is centre-cropped above its lower-third strap, so
// its own corner logo and strap fall away); red footer with the site. No subtitles.
async function renderClip(browser, video, clip, logo, outFile, work, tag) {
  // clip.pre = {s,e}: play that hook moment first, then the whole part (owner 2026-11-09, podcast reels).
  if (clip.pre) ({ video, clip } = preCut(video, clip, work, tag));
  if (clip.style === 'ganbaz') return renderGanbaz(browser, video, clip, outFile, work, tag);
  const W = 1080, H = 1920, S = 1080, TOP = 470, len = clip.end - clip.start;
  const [vw, vh] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', video]).toString().trim().split(',').map(Number);
  const cut = vh > vw ? 0 : clip.cut ?? Number(process.env.CLIP_CROP_BOTTOM || 0.27); // the package's strap band
  const frame = await overlay(browser, `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#0b5e2a 0%,#12873d 40%,#0b5e2a 100%)">
<div style="position:absolute;left:0;right:0;top:0;height:${TOP}px;background:linear-gradient(135deg,#12873d,#0b5e2a);border-bottom:10px solid #c8202f"></div>
${logo && !fs.existsSync(LOGO_VIDEO) ? `<img src="${logo}" style="position:absolute;right:44px;top:50px;height:110px;border-radius:14px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.3)">` : ''}
<div style="position:absolute;left:44px;top:62px;background:#c8202f;color:#fff;font-size:40px;padding:6px 30px;border-radius:40px;border:3px solid #ffd54f">${esc(clip.tag || 'সংবাদ')}</div>
<div style="position:absolute;left:44px;right:44px;top:190px;height:250px;display:flex;align-items:center;color:#fff;font-size:68px;line-height:1.3;text-align:left">${esc(clip.hook)}</div>
<div style="position:absolute;left:0;right:0;top:${TOP + S}px;height:${H - TOP - S - 130}px;display:flex;align-items:center;justify-content:center;color:#ffd54f;font-size:46px">${esc(clip.foot || 'পুরো ভিডিও দেখুন উৎসব টিভির পেজে')}</div>
<div style="position:absolute;left:0;right:0;bottom:0;height:130px;background:linear-gradient(135deg,#c8202f,#931624);border-top:8px solid #ffd54f;color:#fff;font-size:52px;display:flex;align-items:center;justify-content:center">www.utsabtv.com</div></div>`,
    path.join(work, `${tag}-frame.png`), W, H);
  // The channel's own animated logo (keyed from its blue screen, assets/video-logo.webm) plays at the top right.
  const anim = fs.existsSync(LOGO_VIDEO);
  // clip.wide: keep the whole landscape picture (podcast: nobody cut off), over a blurred copy filling the square.
  // Landscape news/package video: the square follows the speaker shot by shot (owner 2026-11-11: the subject fell out of the
  // frame). The square keeps one size; only its left/right position changes, and only at a real picture cut.
  const trackSq = async () => {
    const shots = await shotPlan(video, clip.start, len, work, tag, clip.focus || 'the main speaker');
    const SQ0 = Math.min(vw, Math.round(vh * (1 - cut) / 2) * 2);
    const fps = (([a, b]) => a / (b || 1))(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', video]).toString().trim().split('/').map(Number));
    // Each cut starts with a smooth slide from the previous position over ~0.35 s, cut into 7 small steps (eased), so there is
    // no sudden jump at a cut (owner 2026-11-11). Runner ffmpeg has no per-frame crop expressions, hence the steps.
    const xs = shots.map(p => Math.max(0, Math.min(vw - SQ0, Math.round((p.x * vw - SQ0 / 2) / 2) * 2)));
    const fr = Math.round(0.35 * fps), K = 7, parts = [];
    shots.forEach((p, i) => {
      const f0 = Math.round(p.t * fps), f1 = i + 1 < shots.length ? Math.round(shots[i + 1].t * fps) : Math.round(len * fps);
      const xa = i ? xs[i - 1] : xs[i], xb = xs[i];
      const steps = xa === xb ? 0 : Math.min(K, Math.max(0, Math.floor((f1 - f0) / 2)));
      const ease = u => u * u * (3 - 2 * u);
      let fa = f0;
      for (let k = 0; k < steps; k++) {
        const fb = k === steps - 1 ? Math.min(f1, f0 + fr) : Math.min(f1, f0 + Math.round(fr * (k + 1) / steps));
        if (fb <= fa) continue;
        parts.push({ fa, fb, x: Math.round(xa + (xb - xa) * ease((k + 1) / steps)) });
        fa = fb;
      }
      if (fa < f1) parts.push({ fa, fb: f1, x: xb });
    });
    const pieces = parts.map((q, j) => `[sv${j}]trim=start_frame=${q.fa}:end_frame=${q.fb},setpts=PTS-STARTPTS,crop=${SQ0}:${SQ0}:${q.x}:0,scale=${S}:${S}:flags=lanczos,setsar=1[p${j}]`);
    const sqGraph = `[0:v]split=${parts.length}${parts.map((_, j) => `[sv${j}]`).join('')};${pieces.join(';')};${parts.map((_, j) => `[p${j}]`).join('')}concat=n=${parts.length}:v=1:a=0[sq];`;
    return sqGraph;
  };
  const tracked = !clip.wide && vh <= vw && process.env.NEWS_TRACK !== "0" ? await trackSq() : null;
  const f = (tracked ? tracked : clip.wide ? `[0:v]split[a0][b0];[a0]scale=${S}:${S}:force_original_aspect_ratio=increase,crop=${S}:${S},boxblur=24:2,eq=brightness=-0.12[bg];[b0]scale=${S}:-2[fg];[bg][fg]overlay=0:(H-h)/2[sq];`
    : `[0:v]crop=iw:ih*${(1 - cut).toFixed(3)}:0:0,scale=${S}:${S}:force_original_aspect_ratio=increase,crop=${S}:${S}[sq];`) +
    `[1:v][sq]overlay=0:${TOP}${anim ? '[b];[2:v]setpts=PTS-STARTPTS[lg];[b][lg]overlay=W-w-40:36:shortest=0' : ''}[v]`;
  ff(['-ss', String(clip.start), '-t', String(len), '-i', video, '-loop', '1', '-i', frame,
    ...(anim ? ['-stream_loop', '-1', '-c:v', 'libvpx-vp9', '-i', LOGO_VIDEO] : []), '-filter_complex', f, '-map', '[v]', '-map', '0:a?',
    '-t', String(len), '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outFile]);
  return outFile;
}

module.exports = { planClips, renderClip, secs, ff, gemini };
