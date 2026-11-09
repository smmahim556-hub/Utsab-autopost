// Probe (2026-11-09): find frames in our own concert footage where the singer's face is clear, for reel thumbnails.
// THUMB_SRC = comma list of gd:<id> (default: every Drive file in state/concert.json), THUMB_WHO = who to look for.
// Writes the best frames (full size) to preview/thumb/face-N.jpg and state/thumb-face-probe.json.
const fs = require('fs'), path = require('path'), { execSync, execFileSync } = require('child_process');
try { execSync('which ffmpeg'); } catch { execSync('sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg', { stdio: 'inherit' }); }
const { gemini } = require('../clips');
const ROOT = path.join(__dirname, '..'), W = '/tmp/face', OUT = path.join(ROOT, 'preview', 'thumb');
const WHO = process.env.THUMB_WHO || 'the lead singer Noble: a young man singing into a microphone at the front of the stage (usually in a white panjabi)';
(async () => {
  fs.mkdirSync(W, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
  const st = JSON.parse(fs.readFileSync(path.join(ROOT, 'state', 'concert.json'), 'utf8'));
  const srcs = (process.env.THUMB_SRC || [...new Set([...st.queue, ...st.done].map(x => x.video).filter(v => v.startsWith('gd:')))].join(',')).split(',');
  const cands = [];
  for (const [k, src] of srcs.entries()) {
    const f = `${W}/v${k}.mp4`;
    try { execFileSync('curl', ['-sSL', '--retry', '3', '-o', f, `https://drive.usercontent.google.com/download?id=${src.slice(3)}&export=download&confirm=t`]); } catch (e) { console.log('dl fail', src); continue; }
    const dur = Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${f}`).toString()) || 0;
    const step = Math.max(2, dur / 40);
    // 40 numbered frames per file, one sheet
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', f, '-vf', `fps=1/${step},scale=320:-2,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='%{n}':x=8:y=8:fontsize=36:fontcolor=yellow:box=1:boxcolor=black,tile=8x5`, '-frames:v', '1', `${W}/s${k}.jpg`]);
    const r = await gemini([{ inline_data: { mime_type: 'image/jpeg', data: fs.readFileSync(`${W}/s${k}.jpg`).toString('base64') } },
      { text: `This contact sheet has numbered frames (number top-left, 0-based) from a phone video of a concert. Find frames that show ${WHO} with the FACE clearly visible, sharp, reasonably large and facing the camera. Score each good frame 1-10 for use as a thumbnail photo. Return JSON only: [{"n":3,"score":8,"note":"short"}] (empty list if none).` }]).catch(e => []);
    for (const c of (Array.isArray(r) ? r : [])) cands.push({ k, src, t: c.n * step + step / 2, score: c.score, note: c.note, f });
    console.log(src, dur, JSON.stringify(r));
  }
  cands.sort((a, b) => b.score - a.score);
  const best = cands.slice(0, 8);
  best.forEach((c, i) => { c.out = `face-${i + 1}.jpg`; execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(c.t), '-i', c.f, '-frames:v', '1', '-q:v', '2', path.join(OUT, c.out)]); });
  fs.writeFileSync(path.join(ROOT, 'state', 'thumb-face-probe.json'), JSON.stringify(best, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
