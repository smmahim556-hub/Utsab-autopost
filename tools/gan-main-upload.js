// Owner 2026-11-12: the full 'গান-বাজ' episode 1 (Tarun Munshi) goes up as a scheduled video at 22:00 Dhaka on
// Utsab TV Entertainment first, then Utsab TV and Utsab TV Digital. The HD copy is the owner's Drive file.
// Writes state/gan-main-probe.json with each page's video id, so the reels can link to the right page's copy.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const G = 'https://graph.facebook.com/v26.0', GV = 'https://graph-video.facebook.com/v26.0';
const T = process.env.FB_USER_TOKEN;
const DRIVE_ID = '1RK-7l6-fhjy9zmPFbxR6-3V0AV0Ydfqs';
const SRC_VIDEO = '1464481912171733';
const PAGES = [
  ['ent', '1406430145892267'],   // Utsab TV Entertainment, first
  ['main', process.env.FB_PAGE_ID || '872606492607357'],   // Utsab TV
  ['digital', process.env.FB_PAGE_ID_2 || '1276101408920358'],   // Utsab TV Digital
];
const AT = Math.floor(Date.parse(process.env.GAN_AT || '2026-11-12T22:00:00+06:00') / 1000);
const W = '/tmp/gan-main', OUT = path.join(__dirname, '..', 'state', 'gan-main-probe.json');

(async () => {
  if (!T) throw new Error('FB_USER_TOKEN missing');
  if (AT * 1000 < Date.now() + 10 * 60 * 1000) throw new Error('schedule time must be at least 10 minutes ahead');
  fs.mkdirSync(W, { recursive: true });
  const file = `${W}/${DRIVE_ID}.mp4`;
  if (!fs.existsSync(file)) execFileSync('curl', ['-sSL', '--retry', '3', '-o', file, `https://drive.usercontent.google.com/download?id=${DRIVE_ID}&export=download&confirm=t`]);
  const size = fs.statSync(file).size;
  console.log('downloaded bytes', size);
  if (size < 5e6) throw new Error(`download too small (${size} bytes)`);

  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
  const src = await (await fetch(`${G}/${SRC_VIDEO}?fields=description,title&access_token=${T}`)).json().catch(() => ({}));
  const description = (src.description || '').trim() || 'গান-বাজ | পর্ব ১ — Tarun Munshi\n\n#utsabtv #গানবাজ';

  const out = { at: new Date(AT * 1000).toISOString(), file_bytes: size, pages: {} };
  for (const [key, id] of PAGES) {
    const page = (acc.data || []).find(a => a.id === id);
    if (!page) { out.pages[key] = { error: 'page token not found' }; continue; }
    const f = new FormData();
    f.append('source', new Blob([fs.readFileSync(file)], { type: 'video/mp4' }), 'gan-episode-1.mp4');
    f.append('description', description);
    f.append('title', 'গান-বাজ | পর্ব ১');
    f.append('published', 'false');
    f.append('scheduled_publish_time', String(AT));
    f.append('access_token', page.access_token);
    const resp = await fetch(`${GV}/${id}/videos`, { method: 'POST', body: f });
    const txt = await resp.text();
    let r = {};
    try { r = JSON.parse(txt); } catch { r = { error: { message: `HTTP ${resp.status} non-JSON: ${txt.slice(0, 200)}` } }; }
    out.pages[key] = { page: id, id: r.id || null, error: r.error ? r.error.message : null };
    console.log(key, JSON.stringify(out.pages[key]));
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  if (Object.values(out.pages).some(p => p.error || !p.id)) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
