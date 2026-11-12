// Probe (owner 2026-11-12): reels open on a green first frame. Test setting a custom thumbnail on ONE already-posted
// Entertainment concert reel: grab a frame from the middle (speaker shot) and upload it as the preferred thumbnail.
// Writes state/thumb-test-probe.json with each step's result (no tokens written).
const fs = require('fs'), path = require('path'), { execFileSync, execSync } = require('child_process');
try { execSync('which ffmpeg'); } catch { execSync('sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg', { stdio: 'inherit' }); }
const G = 'https://graph.facebook.com/v26.0', GV = 'https://graph-video.facebook.com/v26.0';
const T = process.env.FB_USER_TOKEN, ENT = '1406430145892267';
const VIDEO = process.env.THUMB_VIDEO || '1585675496648887';   // an Entertainment concert reel already posted
const W = '/tmp/thumb-test', OUT = path.join(__dirname, '..', 'state', 'thumb-test-probe.json');
(async () => {
  fs.mkdirSync(W, { recursive: true });
  const out = { video: VIDEO, steps: {} };
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
  const page = (acc.data || []).find(a => a.id === ENT);
  if (!page) throw new Error('Entertainment page token not found');
  let vid = VIDEO;
  const reels = await (await fetch(`${G}/${ENT}/video_reels?fields=id,description&limit=5&access_token=${page.access_token}`)).json();
  out.steps.reels = (reels.data || []).map(x => x.id).slice(0, 5) || reels.error?.message;
  if (reels.data && reels.data.length) vid = process.env.THUMB_VIDEO || reels.data[0].id;
  out.video = vid;
  const v = await (await fetch(`${G}/${vid}?fields=source,length,picture&access_token=${page.access_token}`)).json();
  out.steps.info = { hasSource: !!v.source, length: v.length, error: v.error?.message || null };
  if (!v.source) { fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); console.log(out); return; }
  const mp4 = `${W}/src.mp4`, jpg = `${W}/thumb.jpg`;
  fs.writeFileSync(mp4, Buffer.from(await (await fetch(v.source)).arrayBuffer()));
  const t = Math.min(4, Math.max(1, (v.length || 10) / 3));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(t), '-i', mp4, '-frames:v', '1', '-q:v', '2', jpg]);
  out.steps.frame = { at: t, bytes: fs.statSync(jpg).size };
  const f = new FormData();
  f.append('source', new Blob([fs.readFileSync(jpg)], { type: 'image/jpeg' }), 'thumb.jpg');
  f.append('is_preferred', 'true');
  f.append('access_token', page.access_token);
  const r = await (await fetch(`${G}/${vid}/thumbnails`, { method: 'POST', body: f })).text();
  out.steps.upload = r.slice(0, 400);
  const after = await (await fetch(`${G}/${vid}/thumbnails?access_token=${page.access_token}`)).json().catch(() => ({}));
  out.steps.thumbnails = after.data ? after.data.map(x => ({ is_preferred: x.is_preferred, uri: !!x.uri })) : (after.error?.message || 'none');
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
