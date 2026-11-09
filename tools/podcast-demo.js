// Demo of the held podcast reels in the owner's 'গান-বাজ' template (2026-11-09): renders reel N (PODCAST_DEMO, 1-based,
// default 24, the one in his sample) in full to preview/podcast-sample.mp4, plus 6-second checks of a few others
// (preview/podcast/check-NN.png, frames at the start and in the middle) to see the guest framing.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
try { execSync('which ffmpeg'); } catch { execSync('sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg', { stdio: 'inherit' }); }
const { chromium } = require('playwright');
const { renderClip, ff } = require('../clips');
const G = 'https://graph.facebook.com/v26.0', W = '/tmp/pod', ROOT = path.join(__dirname, '..');
(async () => {
  const st = JSON.parse(fs.readFileSync(path.join(ROOT, 'state', 'concert.json'), 'utf8'));
  const items = st.queue.filter(q => q.kind === 'podcast');
  fs.mkdirSync(W, { recursive: true }); fs.mkdirSync(path.join(ROOT, 'preview', 'podcast'), { recursive: true });
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${process.env.FB_USER_TOKEN}`)).json();
  const tok = acc.data.find(a => a.id === process.env.FB_PAGE_ID).access_token;
  const v = await (await fetch(`${G}/${items[0].video}?fields=source&access_token=${tok}`)).json();
  const low = `${W}/low.mp4`, file = `${W}/src.mp4`;
  fs.writeFileSync(low, Buffer.from(await (await fetch(v.source)).arrayBuffer()));
  const src = process.env.PODCAST_SRC || items[0].src;
  if (src && src.startsWith('gd:')) execSync(`curl -sSL --retry 3 -o ${file} "https://drive.usercontent.google.com/download?id=${src.slice(3)}&export=download&confirm=t"`, { stdio: 'inherit' });
  else fs.copyFileSync(low, file);
  const dur = f => Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${f}`).toString());
  console.log('source', execSync(`ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 ${file}`).toString().trim(), 'dur', dur(file), 'fb dur', dur(low));
  // Offset of the HD file against the FB copy (clip times were planned on the FB copy): audio envelope cross-correlation.
  const env = (f, ss, t) => { const b = execSync(`ffmpeg -v error -ss ${ss} -t ${t} -i ${f} -ac 1 -ar 8000 -f s16le -`, { maxBuffer: 1e8 }); const a = new Int16Array(b.buffer, b.byteOffset, b.length >> 1), e = []; for (let i = 0; i + 80 <= a.length; i += 80) { let m = 0; for (let j = i; j < i + 80; j++) m += Math.abs(a[j]); e.push(m / 80); } return e; };
  const ref = env(low, 900, 60), big = env(file, 600, 660); let best = -1e18, bi = 0;
  const mr = ref.reduce((x, y) => x + y, 0) / ref.length;
  for (let k = 0; k + ref.length <= big.length; k++) { let s = 0, mb = 0; for (let j = 0; j < ref.length; j++) mb += big[k + j]; mb /= ref.length; for (let j = 0; j < ref.length; j++) s += (ref[j] - mr) * (big[k + j] - mb); if (s > best) { best = s; bi = k; } }
  const off = Math.round((600 + bi / 100 - 900) * 100) / 100;
  console.log('OFFSET', off); fs.writeFileSync(path.join(ROOT, 'state', 'podcast-offset-probe.json'), JSON.stringify({ off, hd: dur(file), fb: dur(low) }));
  const sh = c => off ? { ...c, start: c.start + off, end: c.end + off, hs: c.hs + off, he: c.he + off, pre: c.pre && { s: c.pre.s + off, e: c.pre.e + off } } : c;
  items.forEach(it => { it.clip = sh(it.clip); });
  const b = await chromium.launch();
  try {
    const n = Number(process.env.PODCAST_DEMO || 24) - 1;
    await renderClip(b, file, items[n].clip, '', path.join(ROOT, 'preview', 'podcast-sample.mp4'), W, 'demo');
    for (const i of [1, 4, 11, 21]) {
      const c = items[i].clip, out = `${W}/chk${i}.mp4`;
      await renderClip(b, file, { ...c, pre: undefined, end: c.start + 30 }, '', out, W, `c${i}`);
      const pics = [2, 10, 20, 28].map(t => { const p = `${W}/chk${i}-${t}.png`; ff(['-ss', String(t), '-i', out, '-frames:v', '1', '-vf', 'scale=360:-2', p]); return p; });
      execSync(`ffmpeg -y -loglevel error ${pics.map(p => `-i ${p}`).join(' ')} -filter_complex hstack=inputs=4 ${path.join(ROOT, 'preview', 'podcast', `check-${String(i + 1).padStart(2, '0')}.png`)}`);
    }
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
