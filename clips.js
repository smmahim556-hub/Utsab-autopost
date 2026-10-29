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

// Owner's look (2026-10-29): the video fills the whole 9:16 screen (a landscape package is centre-cropped), one logo only
// (ours, top right; the package's corner logo falls outside the crop), no lower-third strap or subtitles, and the hook
// headline over the top of the picture for the first few seconds only.
async function renderClip(browser, video, clip, logo, outFile, work, tag) {
  const W = 1080, H = 1920, len = clip.end - clip.start, hookSec = Number(process.env.CLIP_HOOK_SEC || 4);
  const [vw, vh] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', video]).toString().trim().split(',').map(Number);
  const vertical = vh > vw; // already a branded 9:16 reel: it keeps its own logo
  const mark = await overlay(browser, `<div style="position:absolute;inset:0">
${!vertical && logo ? `<img src="${logo}" style="position:absolute;right:40px;top:60px;height:100px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.35)">` : ''}</div>`,
    path.join(work, `${tag}-mark.png`), W, H);
  const hook = await overlay(browser, `<div style="position:absolute;left:0;right:0;top:0;height:560px;background:linear-gradient(180deg,rgba(0,0,0,.75),rgba(0,0,0,0))"></div>
<div style="position:absolute;left:50px;right:${vertical ? 50 : 200}px;top:${vertical ? 120 : 190}px;color:#fff;font-size:70px;line-height:1.3;text-align:left;text-shadow:0 4px 14px rgba(0,0,0,.9)">${esc(clip.hook)}</div>`,
    path.join(work, `${tag}-hook.png`), W, H);
  // A landscape package carries its own lower-third strap along the bottom; cut that band off before filling the screen.
  const cut = vertical ? 0 : Number(process.env.CLIP_CROP_BOTTOM || 0.27);
  const f = `[0:v]crop=iw:ih*${(1 - cut).toFixed(3)}:0:0,scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}[v0];[v0][1:v]overlay=0:0[v1];` +
    `[2:v]format=rgba,fade=t=out:st=${(hookSec - 0.5).toFixed(2)}:d=0.5:alpha=1[hk];[v1][hk]overlay=0:0:enable='lt(t,${hookSec})'[v2]`;
  ff(['-ss', String(clip.start), '-t', String(len), '-i', video, '-loop', '1', '-i', mark, '-loop', '1', '-i', hook, '-filter_complex', f, '-map', '[v2]', '-map', '0:a?',
    '-t', String(len), '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outFile]);
  return outFile;
}

module.exports = { planClips, renderClip, secs };
