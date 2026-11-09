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

// Owner's look (2026-10-29, second try): a 9:16 Utsab TV template with the video as a 1:1 square inside it. Header: our logo +
// the hook headline; the square video in the middle (a landscape package is centre-cropped above its lower-third strap, so
// its own corner logo and strap fall away); red footer with the site. No subtitles.
async function renderClip(browser, video, clip, logo, outFile, work, tag) {
  // clip.pre = {s,e}: play that hook moment first, then the whole part (owner 2026-11-09, podcast reels).
  if (clip.pre) {
    const src = path.join(work, `${tag}-pre.mp4`), enc = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac', '-b:a', '160k', '-r', '30', '-ar', '44100'];
    ff(['-ss', String(clip.pre.s), '-t', String(clip.pre.e - clip.pre.s), '-i', video, ...enc, path.join(work, `${tag}-a.mp4`)]);
    ff(['-ss', String(clip.start), '-t', String(clip.end - clip.start), '-i', video, ...enc, path.join(work, `${tag}-b.mp4`)]);
    ff(['-i', path.join(work, `${tag}-a.mp4`), '-i', path.join(work, `${tag}-b.mp4`), '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]', '-map', '[v]', '-map', '[a]', ...enc, src]);
    video = src; clip = { ...clip, pre: undefined, start: 0, end: secs(src) };
  }
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
  const f = (clip.wide ? `[0:v]split[a0][b0];[a0]scale=${S}:${S}:force_original_aspect_ratio=increase,crop=${S}:${S},boxblur=24:2,eq=brightness=-0.12[bg];[b0]scale=${S}:-2[fg];[bg][fg]overlay=0:(H-h)/2[sq];`
    : `[0:v]crop=iw:ih*${(1 - cut).toFixed(3)}:0:0,scale=${S}:${S}:force_original_aspect_ratio=increase,crop=${S}:${S}[sq];`) +
    `[1:v][sq]overlay=0:${TOP}${anim ? '[b];[2:v]setpts=PTS-STARTPTS[lg];[b][lg]overlay=W-w-40:36:shortest=0' : ''}[v]`;
  ff(['-ss', String(clip.start), '-t', String(len), '-i', video, '-loop', '1', '-i', frame,
    ...(anim ? ['-stream_loop', '-1', '-c:v', 'libvpx-vp9', '-i', LOGO_VIDEO] : []), '-filter_complex', f, '-map', '[v]', '-map', '0:a?',
    '-t', String(len), '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outFile]);
  return outFile;
}

module.exports = { planClips, renderClip, secs, ff, gemini };
