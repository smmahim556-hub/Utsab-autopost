// One-off: list the files in a public Google Drive folder (DRIVE_URL) without downloading. Writes state/drive-probe.json.
const fs = require('fs'), { execSync } = require('child_process');
const url = process.env.DRIVE_URL || 'https://drive.google.com/drive/folders/1Qkhxo2N2jORFk83XK-HKUKdkeXhYQR3Z';
execSync('pip install -q gdown', { stdio: 'inherit' });
let out;
try {
  out = JSON.parse(execSync(`python3 -c "import gdown,json,sys; fs=gdown.download_folder(sys.argv[1], skip_download=True, quiet=True); print(json.dumps([{'id':f.id,'path':f.path} for f in fs]))" '${url}'`).toString().trim().split('\n').pop());
  for (const f of out) {
    try { const h = execSync(`curl -sIL "https://drive.usercontent.google.com/download?id=${f.id}&export=download&confirm=t" | grep -i content-length | tail -1`).toString(); f.bytes = Number((h.match(/\d+/) || [])[0]) || null; } catch {}
  }
} catch (e) { out = { error: String(e.message).slice(0, 500) }; }
fs.writeFileSync('state/drive-probe.json', JSON.stringify(out, null, 2));
