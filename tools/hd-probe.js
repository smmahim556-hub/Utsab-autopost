// One-off: can we get the HD file of a Page video? (Graph 'source' gave only 640x360 for গান-বাজ ep1, 2026-11-09.)
// Tries the public video page HTML for HD links. Writes state/hd-probe.json.
const fs = require('fs');
const ID = process.env.HD_VIDEO || '1464481912171733';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
(async () => {
  const out = {};
  for (const u of [`https://www.facebook.com/reel/${ID}`, `https://www.facebook.com/watch/?v=${ID}`, `https://www.facebook.com/video.php?v=${ID}`]) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', Accept: 'text/html' } });
      const t = await r.text();
      const keys = {};
      for (const k of ['browser_native_hd_url', 'playable_url_quality_hd', 'hd_src', 'browser_native_sd_url', 'playable_url']) {
        const m = t.match(new RegExp(`"${k}":"([^"]+)"`)); if (m) keys[k] = m[1].replace(/\\\//g, '/').slice(0, 120);
      }
      const reps = [...t.matchAll(/"width":(\d+),"height":(\d+)[^}]{0,200}?"base_url":"([^"]+)"/g)].map(m => `${m[1]}x${m[2]}`);
      out[u] = { status: r.status, len: t.length, keys, reps: [...new Set(reps)].slice(0, 10), login: /login/i.test(r.url) };
    } catch (e) { out[u] = { error: e.message }; }
  }
  fs.writeFileSync('state/hd-probe.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1));
})();
