// One-off: fetch the HD link from the public watch page and report its size (2026-11-09).
const fs = require('fs'), { execSync } = require('child_process');
try { execSync('which ffprobe'); } catch { execSync('sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg'); }
const { hdUrl } = require('../clips');
(async () => {
  const u = await hdUrl(process.env.HD_VIDEO || '1464481912171733');
  const out = { found: !!u, head: u.slice(0, 90) };
  if (u) {
    const r = await fetch(u, { headers: { Range: 'bytes=0-6000000' } });
    out.status = r.status; out.type = r.headers.get('content-type'); out.total = r.headers.get('content-range');
    fs.writeFileSync('/tmp/hd.mp4', Buffer.from(await r.arrayBuffer()));
    try { out.probe = execSync('ffprobe -v error -show_entries stream=codec_type,width,height -of compact /tmp/hd.mp4').toString(); } catch (e) { out.probe = String(e.stderr || e.message).slice(0, 300); }
  }
  fs.writeFileSync('state/hd-probe.json', JSON.stringify(out, null, 1)); console.log(out);
})();
