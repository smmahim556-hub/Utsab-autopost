// Probe (2026-11-11): news-style landscape reel (renderClip default path) with the speaker tracked shot by shot.
// Renders 30 s of the owner's HD podcast file to preview/track-demo.mp4 (and the old fixed centre crop to preview/track-demo-old.mp4).
const fs = require('fs'), path = require('path'), { execSync, execFileSync } = require('child_process');
try { execSync('which ffmpeg'); } catch { execSync('sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg', { stdio: 'inherit' }); }
const { chromium } = require('playwright');
const { renderClip } = require('../clips');
const W = '/tmp/track', ROOT = path.join(__dirname, '..');
(async () => {
  fs.mkdirSync(W, { recursive: true });
  const file = `${W}/src.mp4`;
  execFileSync('curl', ['-sSL', '--retry', '3', '-o', file, 'https://drive.usercontent.google.com/download?id=1RK-7l6-fhjy9zmPFbxR6-3V0AV0Ydfqs&export=download&confirm=t']);
  const clip = { start: 1200, end: 1245, hook: 'গানের পেছনের গল্প শুনুন', tag: 'সংবাদ', foot: 'পুরো ভিডিও দেখুন উৎসব টিভির পেজে', focus: 'the guest: a bearded man in a black T-shirt and cap' };
  const b = await chromium.launch();
  try {
    await renderClip(b, file, clip, '', path.join(ROOT, 'preview', 'track-demo-news2.mp4'), W, 'trk');
    await renderClip(b, file, clip, '', path.join(ROOT, 'preview', 'track-demo-news2-old.mp4'), W, 'old').catch(() => {});
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
