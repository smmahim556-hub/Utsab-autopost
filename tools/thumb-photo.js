// Probe: free-licence portrait for a thumbnail (Wikipedia page image / Wikimedia Commons search), with its licence.
// THUMB_Q = search words (default Noble the singer). Saves preview/thumb/photo-N.jpg + state/thumb-photo-probe.json.
const fs = require('fs'), path = require('path');
const UA = { 'User-Agent': 'UtsabAutopost/1.0 (https://github.com/smmahim556-hub/Utsab-autopost)', 'Api-User-Agent': 'UtsabAutopost/1.0 (https://github.com/smmahim556-hub/Utsab-autopost)' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const j = async u => { for (let i = 0; i < 5; i++) { const t = await (await fetch(u, { headers: UA })).text(); try { return JSON.parse(t); } catch { console.log('retry', t.slice(0, 80)); await sleep(5000 * (i + 1)); } } return {}; };
(async () => {
  const q = process.env.THUMB_Q || 'Mainul Ahsan Noble';
  const out = [], files = new Set();
  for (const w of ['en', 'bn']) {
    const s = await j(`https://${w}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(w === 'bn' ? 'নোবেল গায়ক' : q)}&format=json&srlimit=5`);
    for (const r of s.query?.search || []) {
      const p = await j(`https://${w}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(r.title)}&prop=pageimages&piprop=name&format=json`);
      for (const pg of Object.values(p.query?.pages || {})) if (pg.pageimage) files.add(pg.pageimage), out.push({ wiki: w, title: r.title, file: pg.pageimage });
    }
  }
  const c = await j(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(q)}&format=json&srlimit=8`);
  for (const r of c.query?.search || []) files.add(r.title.replace(/^File:/, '')), out.push({ commons: r.title });
  const dir = path.join(__dirname, '..', 'preview', 'thumb'); fs.mkdirSync(dir, { recursive: true });
  let n = 0; const info = [];
  for (const f of files) {
    const ii = await j(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(f)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json`);
    const pg = Object.values(ii.query?.pages || {})[0], im = pg?.imageinfo?.[0];
    if (!im) { info.push({ f, missing: true }); continue; }
    const m = im.extmetadata || {}, fn = `photo-${++n}.jpg`;
    fs.writeFileSync(path.join(dir, fn), Buffer.from(await (await fetch(im.thumburl || im.url, { headers: UA })).arrayBuffer()));
    info.push({ fn, f, license: m.LicenseShortName?.value, artist: (m.Artist?.value || '').replace(/<[^>]+>/g, ''), desc: (m.ImageDescription?.value || '').replace(/<[^>]+>/g, '').slice(0, 200) });
  }
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'thumb-photo-probe.json'), JSON.stringify({ q, out, info }, null, 1));
  console.log(JSON.stringify(info, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
