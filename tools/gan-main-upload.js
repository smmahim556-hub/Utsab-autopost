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
    // Resumable upload: the file is ~1 GB, too big for one multipart request (Facebook answers 413).
    const api = async (url, fields, blob) => {
      const f = new FormData();
      for (const [k, v] of Object.entries(fields)) f.append(k, String(v));
      if (blob) f.append('video_file_chunk', blob, 'chunk.mp4');
      const resp = await fetch(url, { method: 'POST', body: f });
      const txt = await resp.text();
      try { return JSON.parse(txt); } catch { return { error: { message: `HTTP ${resp.status} non-JSON: ${txt.slice(0, 200)}` } }; }
    };
    const start = await api(`${GV}/${id}/videos`, { upload_phase: 'start', file_size: size, access_token: page.access_token });
    let r = {};
    if (start.error || !start.upload_session_id) r = start;
    else {
      const sid = start.upload_session_id, vid = start.video_id;
      let off = Number(start.start_offset), end = Number(start.end_offset);
      const fd = fs.openSync(file, 'r');
      let err = null;
      while (!err && off < size) {
        const len = end - off, buf = Buffer.alloc(len);
        fs.readSync(fd, buf, 0, len, off);
        const t = await api(`${GV}/${id}/videos`, { upload_phase: 'transfer', upload_session_id: sid, start_offset: off, access_token: page.access_token }, new Blob([buf], { type: 'video/mp4' }));
        if (t.error) { err = t.error.message; break; }
        off = Number(t.start_offset); end = Number(t.end_offset);
        if (end <= off) break;
      }
      fs.closeSync(fd);
      if (err) r = { error: { message: 'transfer: ' + err } };
      else {
        const fin = await api(`${GV}/${id}/videos`, { upload_phase: 'finish', upload_session_id: sid, title: 'গান-বাজ | পর্ব ১', description, published: 'false', scheduled_publish_time: AT, access_token: page.access_token });
        r = fin.success ? { id: vid } : (fin.error ? fin : { error: { message: 'finish: no success flag' } });
      }
    }
    out.pages[key] = { page: id, id: r.id || null, error: r.error ? r.error.message : null };
    console.log(key, JSON.stringify(out.pages[key]));
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  if (Object.values(out.pages).some(p => p.error || !p.id)) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
