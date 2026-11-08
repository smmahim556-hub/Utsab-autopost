// Animated cartoon story video (owner's script -> 9:16 Bangla cartoon short with voice), story.yml.
// Claude (ANTHROPIC_API_KEY) storyboards the script, draws a character sheet and one animated SVG per scene;
// Playwright steps the CSS animations frame by frame, ffmpeg joins them with the narration (ElevenLabs Tanvir, else Edge) and soft music.
// The narration is the owner's own text, split but never rewritten.
const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'out', 'story');
const MODEL = process.env.STORY_MODEL || 'claude-sonnet-5-5';
const FPS = Number(process.env.STORY_FPS || 30);
const usage = { input: 0, output: 0, calls: 0 };
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function claude(prompt, maxTokens = 16000) {
  let last;
  for (let t = 0; t < 4; t++) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: AbortSignal.timeout(600000),
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(b.error || b).slice(0, 200)}`);
      usage.input += b.usage?.input_tokens || 0; usage.output += b.usage?.output_tokens || 0; usage.calls++;
      return (b.content || []).map(c => c.text || '').join('');
    } catch (e) { last = e; log('claude retry', t, e.message); await new Promise(r => setTimeout(r, 5000 * (t + 1))); }
  }
  throw last;
}
const jsonOf = s => JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
const svgOf = s => { const a = s.indexOf('<svg'), b = s.lastIndexOf('</svg>'); if (a < 0 || b < 0) throw new Error('no svg'); return s.slice(a, b + 6); };

const STYLE = `Style (match exactly): flat 2D vector cartoon like a modern kids' explainer short. Bright warm palette, soft gradient skies or walls,
thick dark-brown outlines (#3b2a20, stroke-width 5-7, round joins), simple shapes, big round eyes with white sclera and black pupils,
expressive eyebrows, rosy cheeks, big hands. Clean uncluttered backgrounds (buildings, furniture, nature) with a few details.
No photo realism, no gradients on characters except subtle shading.`;

async function plan(script) {
  const p = await claude(`You storyboard a vertical 9:16 animated Bangla cartoon short (about 45-75 seconds). Here is the owner's script:
<<<
${script}
>>>
Rules:
- Split the spoken text into 8-14 scenes of 1-2 sentences each (about 4-7 seconds when read aloud).
- "narration" must be the script's own words VERBATIM, in order, nothing added, changed or dropped. If the script has scene directions,
  speaker labels, headings or notes, do not narrate them; use them as visual hints only.
- "caption": a punchy Bangla phrase of at most 5 words shown on screen, taken from the narration (like "চিৎকার— ইউরেকা!").
- "highlight": 1-2 words of the caption to colour.
- "visual": in English, exactly what to draw and how it moves: setting, which characters (by id), pose and expression, props,
  at most 2 short Bangla text labels (speech bubble / sign / sticker), and 2-4 simple motions. Keep it drawable with simple SVG shapes.
- "series": the series tag if the script names one (e.g. "আবিষ্কারের গল্প · পর্ব ১"), else "উৎসবের গল্প".
- "teaser": if the script ends with a next-episode hint, its words (they are also narrated in the last scene), else "".
- "characters": every recurring character with a very specific look (age, skin tone, hair, beard, clothes and colours).
Answer only with JSON:
{"title":"...","series":"...","teaser":"...","characters":[{"id":"hero","name":"...","look":"..."}],
 "scenes":[{"narration":"...","caption":"...","highlight":["..."],"visual":"..."}]}`, 8000);
  const j = jsonOf(p);
  // The narration must be the owner's text: every scene's words must appear in the script.
  const norm = s => s.replace(/[\s।,!?—–\-"'“”‘’.:;()]+/g, '');
  const all = norm(script);
  for (const s of j.scenes) if (!all.includes(norm(s.narration))) log('WARN narration not verbatim:', s.narration);
  return j;
}

async function characterSheet(pl) {
  const svg = svgOf(await claude(`${STYLE}
Draw a character sheet as SVG for these characters:
${pl.characters.map(c => `- id "${c.id}": ${c.name}: ${c.look}`).join('\n')}
Output exactly one <svg xmlns="http://www.w3.org/2000/svg"> with a <defs> holding, per character, <g id="char-ID"> in a neutral standing pose, about 700 units tall,
drawn so that (0,0) is the point between the feet and the body goes up into negative y (x roughly -250..250).
Inside each, give the head its own <g id="char-ID-head"> and each arm its own <g id="char-ID-arm-l"> / <g id="char-ID-arm-r"> so they can be animated.
Only shapes and paths, no text, no images, no scripts. Output only the SVG.`, 12000));
  return svg;
}

async function sceneSvg(pl, sheet, s, i, secs) {
  const raw = await claude(`${STYLE}
You draw scene ${i + 1} of ${pl.scenes.length} of the cartoon "${pl.title}".
Narration (Bangla): ${s.narration}
What to show: ${s.visual}
Scene length: about ${secs.toFixed(1)} seconds.
Characters are already defined in this character sheet (it is on the page, so you can reference its ids):
${sheet}
Rules:
- Output exactly one <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1080 1920" width="1080" height="1920">.
- Fill the whole frame with a background. Put the main action between y=140 and y=1250. Below y=1300 a caption is overlaid, so draw only floor/ground/table there.
  The top-left corner (x<520, y<110) gets a small tag overlay, keep it plain.
- Place a character in a standing pose with <use href="#char-ID" transform="translate(x,y) scale(s)"/> (y = where the feet are).
  For an action pose or a different expression, copy that character's code from the sheet into the scene (same shapes and colours) and change only the pose/face.
  Characters must look the same as in the sheet. Give new ids to anything you copy (prefix s${i}-).
- Animate only with CSS @keyframes in a <style> inside the svg (no SMIL, no script). Use transform-box: fill-box; and transform-origin on animated groups.
  2-4 gentle motions (bounce, sway, blink, waving arm, ripples, sparkles, pop-in of labels in the first 0.6 s). Loops must be smooth.
- Bangla words only for at most 2 short labels, with font-family "Baloo Da 2", font-weight 800, large and readable, inside bubbles/signs/stickers.
- No external images, fonts or links. Output only the SVG.`, 16000);
  return svgOf(raw);
}

async function speak(text, outBase) {
  text = require('./bnwords').spoken(text); // numbers read as Bangla words
  let el = {};
  try { el = JSON.parse(fs.readFileSync(path.join(ROOT, 'state', 'eleven.json'), 'utf8')); } catch {}
  const voice = process.env.STORY_VOICE || el.pick;
  if (process.env.ELEVENLABS_API_KEY && voice && process.env.STORY_TTS !== 'edge') {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST', signal: AbortSignal.timeout(120000),
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: process.env.ELEVEN_MODEL || 'eleven_v4_turbo', language_code: 'bn', voice_settings: { stability: 0.5, similarity_boost: 0.85 } }),
    });
    if (r.ok) { fs.writeFileSync(`${outBase}.mp3`, Buffer.from(await r.arrayBuffer())); return `${outBase}.mp3`; }
    throw new Error(`ElevenLabs ${r.status} ${(await r.text()).slice(0, 160)}`); // no silent switch to a weaker voice
  }
  if (process.env.STORY_TTS !== 'edge') throw new Error('ElevenLabs key or voice missing');
  execFileSync('edge-tts', ['--voice', process.env.STORY_EDGE_VOICE || 'bn-BD-PradeepNeural', '--text', text, '--write-media', `${outBase}.mp3`]);
  return `${outBase}.mp3`;
}
const secsOf = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString()) || 4;

function captionHtml(s) {
  let h = esc(s.caption);
  for (const w of s.highlight || []) if (w) h = h.split(esc(w)).join(`<em>${esc(w)}</em>`);
  return h;
}
// Landscape (YouTube 16:9) view of a vertical scene: a wider window around the action band, full-width backgrounds stretched to fill it.
const WIDE = { x: -793, w: 2667, h: 1500 };
function widen(svg, y = 0) {
  return svg.replace(/viewBox="0 0 1080 1920" width="1080" height="1920"/, `viewBox="${WIDE.x} ${y} ${WIDE.w} ${WIDE.h}" width="1920" height="1080"`)
    .replace(/<rect\b([^>]*?)\swidth="1080"/g, (m, a) => /\bx="(?!0")/.test(a) ? m : `<rect${a.replace(/\sx="0"/, '')} x="-950" width="2980"`);
}
function scenePage(pl, sheet, svg, s, secs, logo, wide = false) {
  const [PW, PH] = wide ? [1920, 1080] : [1080, 1920];
  if (wide) svg = widen(svg, s.wideY);
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${PW}px;height:${PH}px;overflow:hidden;background:#fff;font-family:'Baloo Da 2',sans-serif}
#stage{position:absolute;inset:0;animation:kb ${secs}s linear both;transform-origin:50% 45%}
#stage>svg{width:${PW}px;height:${PH}px;display:block}
@keyframes kb{from{transform:scale(1.0)}to{transform:scale(1.045)}}
#in{position:absolute;inset:0;background:#fff;animation:fadein .35s ease-out both;pointer-events:none}
@keyframes fadein{from{opacity:1}to{opacity:0}}
.tag{position:absolute;left:28px;top:72px;display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.92);border:4px solid #3b2a20;border-radius:40px;
  padding:6px 26px 6px 10px;font-size:34px;font-weight:800;color:#3b2a20}
.tag i{width:42px;height:42px;border-radius:50%;background:#ffc93c;border:3px solid #3b2a20;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:28px}
.logo{position:absolute;right:26px;top:22px;height:96px}
.cap{position:absolute;left:40px;right:40px;top:1360px;text-align:center;font-size:92px;font-weight:800;line-height:1.25;color:#fff;
  -webkit-text-stroke:14px #3b2a20;paint-order:stroke fill;animation:pop .45s cubic-bezier(.3,1.6,.5,1) .15s both}
.cap em{font-style:normal;color:#ffd23f}
.cap em:nth-of-type(2){color:#ff5a4e}
@keyframes pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
${wide ? '.tag{top:30px;font-size:30px}.cap{top:auto;bottom:46px;left:160px;right:160px;font-size:70px;-webkit-text-stroke:11px #3b2a20}' : ''}
</style></head><body>
<div style="position:absolute;width:0;height:0;overflow:hidden">${sheet.replace('<svg', '<svg width="0" height="0"')}</div>
<div id="stage">${svg}</div>
<div class="tag"><i>!</i>${esc(pl.series)}</div>${logo ? `<img class="logo" src="${logo}">` : ''}
${s.caption ? `<div class="cap">${captionHtml(s)}</div>` : ''}
<div id="in"></div>
</body></html>`;
}

// Steps every CSS animation to each frame time and pipes JPEG screenshots into ffmpeg.
async function renderScene(browser, html, secs, outFile, wide = false) {
  const page = await browser.newPage({ viewport: wide ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => { const s = document.querySelector('#stage svg'); const b = s && s.getBBox(); return !!(b && b.width > 100); });
  if (!ok) { await page.close(); throw new Error('scene svg did not render'); }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), outFile]);
  const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error(`ffmpeg ${c}`))));
  const n = Math.round(secs * FPS);
  for (let f = 0; f < n; f++) {
    await page.evaluate(ms => document.getAnimations().forEach(a => { a.pause(); a.currentTime = ms; }), (f / FPS) * 1000);
    const buf = await page.screenshot({ type: 'jpeg', quality: 88 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await done;
  if (errs.length) log('page errors', errs.slice(0, 3));
  await page.close();
  return outFile;
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let k = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (k < items.length) { const i = k++; out[i] = await fn(items[i], i); } }));
  return out;
}

async function makeStory(scriptFile, outFile, opts = {}) {
  fs.mkdirSync(OUT, { recursive: true });
  // A folder (stories/<name>/ with plan.json and s0.svg, s1.svg, ...) is a storyboard drawn ahead; a .txt is drawn here by the API.
  const pre = fs.statSync(scriptFile).isDirectory() ? scriptFile : null;
  const pl = pre ? JSON.parse(fs.readFileSync(path.join(pre, 'plan.json'), 'utf8')) : await plan(fs.readFileSync(scriptFile, 'utf8').trim());
  log('plan', pl.title, pl.scenes.length, 'scenes');
  fs.writeFileSync(path.join(OUT, 'plan.json'), JSON.stringify(pl, null, 2));
  // Voice first: each scene lasts as long as its sentence plus a short breath.
  const audio = [];
  for (const [i, s] of pl.scenes.entries()) { const f = await speak(s.narration, path.join(OUT, `a${i}`)); audio.push({ f, secs: secsOf(f) + 0.45 }); }
  const sheet = pre ? (fs.existsSync(path.join(pre, 'sheet.svg')) ? fs.readFileSync(path.join(pre, 'sheet.svg'), 'utf8') : '<svg></svg>') : await characterSheet(pl);
  fs.writeFileSync(path.join(OUT, 'sheet.svg'), sheet);
  const svgs = pre ? pl.scenes.map((_, i) => fs.readFileSync(path.join(pre, `s${i}.svg`), 'utf8')) : await pool(pl.scenes, 4, async (s, i) => {
    for (let t = 0; t < 2; t++) { try { const v = await sceneSvg(pl, sheet, s, i, audio[i].secs); fs.writeFileSync(path.join(OUT, `s${i}.svg`), v); return v; } catch (e) { log('scene', i, e.message); } }
    throw new Error(`scene ${i} failed`);
  });
  const logoFile = path.join(ROOT, 'assets', 'logo.png');
  // The channel's animated logo (assets/video-logo.webm, keyed from its blue screen) is laid over the finished video; the still logo only without it.
  const anim = path.join(ROOT, 'assets', 'video-logo.webm'), useAnim = process.env.STORY_LOGO !== '0' && fs.existsSync(anim);
  const logo = process.env.STORY_LOGO !== '0' && !useAnim && fs.existsSync(logoFile) ? `data:image/png;base64,${fs.readFileSync(logoFile).toString('base64')}` : '';
  const browser = await chromium.launch();
  const clips = [], wclips = [];
  try {
    for (const [i, s] of pl.scenes.entries()) {
      const html = scenePage(pl, sheet, svgs[i], s, audio[i].secs, logo);
      fs.writeFileSync(path.join(OUT, `s${i}.html`), html);
      clips.push(await renderScene(browser, html, audio[i].secs, path.join(OUT, `v${i}.mp4`)));
      log('rendered scene', i);
    }
    // opts.wideOut: the same episode in 16:9 for the owner's YouTube, same voice and music (no extra TTS).
    if (opts.wideOut) for (const [i, s] of pl.scenes.entries()) {
      wclips.push(await renderScene(browser, scenePage(pl, sheet, svgs[i], s, audio[i].secs, logo, true), audio[i].secs, path.join(OUT, `w${i}.mp4`), true));
      log('rendered wide scene', i);
    }
  } finally { await browser.close(); }
  const ff = args => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
  fs.writeFileSync(path.join(OUT, 'v.txt'), clips.map(c => `file '${c}'`).join('\n'));
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'v.txt'), '-c', 'copy', path.join(OUT, 'video.mp4')]);
  const total = audio.reduce((a, x) => a + x.secs, 0);
  const m = audio.length;
  const pads = audio.map((x, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=stereo,apad,atrim=0:${x.secs.toFixed(3)}[p${i}]`);
  // Our own synthesised track (tools/make-story-music.js): the stock piano track got a YouTube Content ID claim (2026-11-08).
  const music = process.env.STORY_MUSIC || path.join(ROOT, 'assets', 'story-music.mp3');
  ff([...audio.flatMap(x => ['-i', x.f]), '-stream_loop', '-1', '-i', music, '-filter_complex',
    `${pads.join(';')};${audio.map((_, i) => `[p${i}]`).join('')}concat=n=${m}:v=0:a=1[v];[${m}:a]atrim=0:${total.toFixed(3)},volume=0.13,afade=t=out:st=${(total - 1.5).toFixed(2)}:d=1.5[bg];[v][bg]amix=inputs=2:normalize=0:duration=first[a]`,
    '-map', '[a]', '-c:a', 'aac', '-b:a', '160k', path.join(OUT, 'audio.m4a')]);
  // 16:9: logo about 15% of the width, set in from the corner (owner's YouTube package sample).
  const mux = (video, out, wide = false) => ff(['-i', video, '-i', path.join(OUT, 'audio.m4a'), ...(useAnim ? ['-stream_loop', '-1', '-c:v', 'libvpx-vp9', '-i', anim,
    '-filter_complex', `[2:v]setpts=PTS-STARTPTS${wide ? ',scale=300:-2' : ''}[lg];[0:v][lg]overlay=${wide ? 'W-w-62:58' : 'W-w-28:28'}:shortest=1,format=yuv420p[v]`, '-map', '[v]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20']
    : ['-map', '0:v', '-c:v', 'copy']), '-map', '1:a', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', out]);
  mux(path.join(OUT, 'video.mp4'), outFile);
  if (opts.wideOut) {
    fs.writeFileSync(path.join(OUT, 'w.txt'), wclips.map(c => `file '${c}'`).join('\n'));
    ff(['-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'w.txt'), '-c', 'copy', path.join(OUT, 'wide.mp4')]);
    mux(path.join(OUT, 'wide.mp4'), opts.wideOut, true);
  }
  return { file: outFile, plan: pl, secs: total, usage: { ...usage, model: MODEL } };
}

module.exports = { makeStory, plan, scenePage, renderScene, widen };

if (require.main === module) {
  (async () => {
    const script = process.env.STORY_SCRIPT || process.argv[2];
    const out = process.env.STORY_OUT || path.join(ROOT, 'preview', 'story-demo.mp4');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const r = await makeStory(script, out, { wideOut: process.env.STORY_WIDE_OUT });
    fs.writeFileSync(path.join(ROOT, 'state', 'story-probe.json'), JSON.stringify({ title: r.plan.title, secs: r.secs, scenes: r.plan.scenes.length, usage: r.usage }, null, 2));
    log('done', r.file, r.secs.toFixed(1), 's', JSON.stringify(r.usage));
  })().catch(e => { console.error(e); try { fs.writeFileSync(path.join(ROOT, 'state', 'story-probe.json'), JSON.stringify({ error: e.message, usage })); } catch {} process.exit(1); });
}
