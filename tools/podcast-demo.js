// Demo of the held podcast reels in the owner's 'গান-বাজ' template (2026-11-09): renders reel N (PODCAST_DEMO, 1-based,
// default 24, the one in his sample) in full to preview/podcast-sample.mp4, plus 6-second checks of a few others
// (preview/podcast/check-NN.png, frames at the start and in the middle) to see the guest framing.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
try { execSync('which ffmpeg'); } catch { execSync('sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg', { stdio: 'inherit' }); }
const { chromium } = require('playwright');
const { renderClip, ff, hdUrl } = require('../clips');
const G = 'https://graph.facebook.com/v26.0', W = '/tmp/pod', ROOT = path.join(__dirname, '..');
(async () => {
  const st = JSON.parse(fs.readFileSync(path.join(ROOT, 'state', 'concert.json'), 'utf8'));
  const items = st.queue.filter(q => q.kind === 'podcast');
  fs.mkdirSync(W, { recursive: true }); fs.mkdirSync(path.join(ROOT, 'preview', 'podcast'), { recursive: true });
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${process.env.FB_USER_TOKEN}`)).json();
  const tok = acc.data.find(a => a.id === process.env.FB_PAGE_ID).access_token;
  const v = await (await fetch(`${G}/${items[0].video}?fields=source&access_token=${tok}`)).json();
  const file = `${W}/src.mp4`;
  const hd = await hdUrl(items[0].video);
  fs.writeFileSync(file, Buffer.from(await (await fetch(hd || v.source)).arrayBuffer()));
  console.log('source', execSync(`ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 ${file}`).toString().trim());
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
