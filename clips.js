// Long video -> short "hook" reels (owner's idea, 2026-10-29). Gemini listens to the audio and picks the strongest
// stand-alone moments (each opening on a hook) with Bangla subtitles; ffmpeg cuts them into 9:16 reels with the
// Utsab TV frame: hook headline on top, the video in the middle over a blurred copy, subtitles below, red footer.
// Bangla text is drawn by Chromium (ffmpeg's drawtext can't shape Bangla) and laid over as PNGs.
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ff = args => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { maxBuffer: 1 << 26 });
const secs = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString()) || 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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
async function planClips(video, work, n = 2) {
  const audio = path.join(work, 'audio.mp3');
  ff(['-i', video, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '32k', audio]);
  const plan = await gemini([{ inline_data: { mime_type: 'audio/mp3', data: fs.readFileSync(audio).toString('base64') } }, { text:
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
      return { ...c, end: Math.min(c.end, dur), subs: subs.filter(x => x.e > x.s) };
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

async function renderClip(browser, video, clip, logo, outFile, work, tag) {
  const W = 1080, H = 1920, len = clip.end - clip.start;
  const [vw, vh] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', video]).toString().trim().split(',').map(Number);
  const vertical = vh > vw; // already a branded 9:16 reel: keep its own look, add only the subtitles
  // Frame: header with logo + hook headline, footer with the site.
  const frame = await overlay(browser, `<div style="position:absolute;inset:0">
<div style="position:absolute;left:0;right:0;top:0;height:420px;background:linear-gradient(135deg,#12873d,#0b5e2a);border-bottom:10px solid #c8202f"></div>
${logo ? `<img src="${logo}" style="position:absolute;right:48px;top:44px;height:110px;border-radius:14px;background:#fff">` : ''}
<div style="position:absolute;left:48px;top:58px;background:#c8202f;color:#fff;font-size:40px;padding:6px 28px;border-radius:40px;border:3px solid #ffd54f">উৎসব টিভি</div>
<div style="position:absolute;left:48px;right:48px;top:180px;height:220px;display:flex;align-items:center;color:#fff;font-size:66px;line-height:1.3;text-align:left">${esc(clip.hook)}</div>
<div style="position:absolute;left:0;right:0;bottom:0;height:130px;background:linear-gradient(135deg,#c8202f,#931624);border-top:8px solid #ffd54f;color:#fff;font-size:52px;display:flex;align-items:center;justify-content:center">www.utsabtv.com</div></div>`,
    path.join(work, `${tag}-frame.png`), W, H);
  const subs = [];
  for (const [i, s] of clip.subs.entries()) subs.push({ ...s, file: await overlay(browser,
    `<div style="max-width:980px;background:#fff;color:#0b2a17;font-size:56px;line-height:1.45;padding:14px 30px;border-radius:22px;border-left:14px solid #c8202f;box-shadow:0 10px 28px rgba(0,0,0,.4)">${esc(s.t)}</div>`,
    path.join(work, `${tag}-sub${i}.png`), W, 360) });
  // Video: blurred full-bleed copy behind, the real picture 1080 wide in the middle.
  const inputs = ['-ss', String(clip.start), '-t', String(len), '-i', video, '-loop', '1', '-i', frame, ...subs.flatMap(s => ['-loop', '1', '-i', s.file])];
  let f = vertical ? `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}[v0];[v0][1:v]overlay=0:0:enable='lt(t,0)'[v1]`
    : `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=30:2,eq=brightness=-0.12[bg];` +
      `[0:v]scale=${W}:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2-40[v0];[v0][1:v]overlay=0:0[v1]`;
  const subY = vertical ? H - 620 : H - 130 - 380;
  subs.forEach((s, i) => { f += `;[v${i + 1}][${i + 2}:v]overlay=0:${subY}:enable='between(t,${s.s.toFixed(2)},${Math.min(s.e, len).toFixed(2)})'[v${i + 2}]`; });
  ff([...inputs, '-filter_complex', f, '-map', `[v${subs.length + 1}]`, '-map', '0:a?', '-t', String(len), '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outFile]);
  return outFile;
}

module.exports = { planClips, renderClip, secs };
