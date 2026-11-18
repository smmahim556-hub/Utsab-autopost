// Owner 2026-11-19: GTA 6 videos (news reels + explainers) from his Drive gameplay video (he says it is copyright free), voiced by
// Amin's ElevenLabs clone (state/eleven.json voice_id). Demo: one ~45 s news reel -> preview/gta/news-demo.mp4. Nothing is posted.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
try { execFileSync('which', ['ffmpeg']); } catch { execFileSync('bash', ['-c', 'sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg'], { stdio: 'inherit' }); }
const { chromium } = require('playwright');
const { ff, secs, overlay } = require('../clips');
const ROOT = path.join(__dirname, '..'), W = '/tmp/gta', PV = path.join(ROOT, 'preview', 'gta');
const DRIVE = process.env.GTA_DRIVE || '1fmejgUdebamEXbCzdntxI2Ny4OMxa-N5';
const VOICE = JSON.parse(fs.readFileSync(path.join(ROOT, 'state', 'eleven.json'), 'utf8')).voice_id; // Amin
const LOGO = path.join(ROOT, 'assets', 'video-logo.webm');
const HEAD = ['১৩ বছরের অপেক্ষা শেষ', 'অবশেষে এল জিটিএ ৬'];
const LINES = [
  ['অবশেষে অপেক্ষার অবসান! তেরো বছর পর মুক্তি পেল জিটিএ সিক্স।', '১৩ বছর পর মুক্তি পেল জিটিএ ৬'],
  ['আজ উনিশে নভেম্বর প্লেস্টেশন ফাইভ আর এক্সবক্সে বাজারে এল রকস্টার গেমসের এই গেম।', '১৯ নভেম্বর, PS5 আর Xbox-এ'],
  ['গল্প এবার ভাইস সিটির রাজ্য লিওনিডায়। প্রধান দুই চরিত্র লুসিয়া আর জেসন।', 'ভাইস সিটি, লিওনিডা · লুসিয়া আর জেসন'],
  ['মুক্তির আগেই শুধু প্রি-অর্ডারে বিক্রি ছাড়িয়েছে দেড়শো কোটি ডলার।', 'প্রি-অর্ডারেই ১৫০ কোটি ডলার+'],
  ['আর সমালোচকদের ওয়েবসাইট মেটাক্রিটিকে স্কোর একশোর মধ্যে নিরানব্বই!', 'মেটাক্রিটিক স্কোর ৯৯/১০০'],
  ['তবে কম্পিউটারে খেলতে চাইলে এখনো অপেক্ষা করতে হবে।', 'পিসি সংস্করণ এখনো আসেনি'],
  ['আপনি কি খেলবেন জিটিএ সিক্স? কমেন্টে জানান।', 'আপনি কি খেলবেন? কমেন্টে জানান'],
];
async function tts(text, out) {
  for (const model of ['eleven_v4_turbo', 'eleven_v4', 'eleven_v3']) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, { method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: model, language_code: 'bn', voice_settings: { stability: 0.5, similarity_boost: 0.85 } }) });
    if (r.ok) { fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); return out; }
    console.log(model, r.status, (await r.text()).slice(0, 200));
  }
  throw new Error('tts failed');
}
(async () => {
  fs.mkdirSync(W, { recursive: true }); fs.mkdirSync(PV, { recursive: true });
  const src = `${W}/src.mp4`;
  if (!fs.existsSync(src)) execFileSync('curl', ['-sSL', '--retry', '3', '-o', src, `https://drive.usercontent.google.com/download?id=${DRIVE}&export=download&confirm=t`], { stdio: 'inherit' });
  if (fs.statSync(src).size < 1e7) throw new Error('download failed: ' + fs.readFileSync(src, 'utf8').slice(0, 200));
  const dur = secs(src); console.log('source', Math.round(dur), 's');
  // Voice, sentence by sentence (subtitle timing).
  const parts = []; let t = 0;
  for (const [i, [say, sub]] of LINES.entries()) { const f = await tts(say, `${W}/v${i}.mp3`); const d = secs(f); parts.push({ f, s: t, e: t + d, sub }); t += d + 0.25; }
  fs.writeFileSync(`${W}/vl.txt`, parts.map(p => `file '${p.f}'\nfile '${W}/gap.mp3'`).join('\n'));
  ff(['-f', 'lavfi', '-t', '0.25', '-i', 'anullsrc=r=44100:cl=mono', '-b:a', '128k', `${W}/gap.mp3`]);
  ff(['-f', 'concat', '-safe', '0', '-i', `${W}/vl.txt`, '-ar', '44100', '-ac', '2', `${W}/voice.wav`]);
  const total = secs(`${W}/voice.wav`) + 0.8;
  // Footage: short shots spread over the gameplay (skip intro/outro), square crop.
  const n = Math.ceil(total / 4), shots = [];
  for (let i = 0; i < n; i++) {
    const at = dur * (0.08 + 0.84 * i / n), f = `${W}/c${i}.mp4`;
    ff(['-ss', String(at), '-t', '4', '-i', src, '-an', '-vf', 'scale=-2:1080,crop=1080:1080,fps=30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', f]); shots.push(`file '${f}'`);
  }
  fs.writeFileSync(`${W}/cl.txt`, shots.join('\n'));
  ff(['-f', 'concat', '-safe', '0', '-i', `${W}/cl.txt`, '-t', String(total), '-c', 'copy', `${W}/foot.mp4`]);
  const browser = await chromium.launch();
  const frame = await overlay(browser, `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#0b5e2a,#12873d 40%,#0b5e2a)">
<div style="position:absolute;left:0;right:0;top:0;height:470px;background:linear-gradient(135deg,#12873d,#0b5e2a);border-bottom:10px solid #c8202f"></div>
<div style="position:absolute;left:44px;top:62px;background:#c8202f;color:#fff;font-size:40px;padding:6px 30px;border-radius:40px;border:3px solid #ffd54f">গেমিং</div>
<div style="position:absolute;left:44px;right:44px;top:180px;color:#fff;font-size:76px;line-height:1.25;text-align:left">${HEAD[0]}<br><span style="color:#ffd54f">${HEAD[1]}</span></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:130px;background:linear-gradient(135deg,#c8202f,#931624);border-top:8px solid #ffd54f;color:#fff;font-size:52px;display:flex;align-items:center;justify-content:center">www.utsabtv.com</div></div>`, `${W}/frame.png`, 1080, 1920);
  const subs = [];
  for (const [i, p] of parts.entries()) subs.push(await overlay(browser, `<div style="background:rgba(0,0,0,.72);color:#fff;font-size:54px;line-height:1.3;padding:16px 34px;border-radius:18px;border-left:10px solid #ffd54f;max-width:1000px">${p.sub}</div>`, `${W}/s${i}.png`, 1080, 300));
  await browser.close();
  // Compose: frame, footage at y=470, subtitle over the bottom of the footage, logo top-right, voice + quiet game sound.
  const inputs = ['-i', `${W}/frame.png`, '-i', `${W}/foot.mp4`, '-i', `${W}/voice.wav`, '-stream_loop', '-1', '-i', LOGO, ...subs.flatMap(s => ['-i', s])];
  let fc = `[0][1]overlay=0:470:shortest=1[b0];[3]scale=260:-1[lg];[b0][lg]overlay=W-w-28:28:shortest=1[b1]`;
  parts.forEach((p, i) => { fc += `;[b${i + 1}][${4 + i}]overlay=0:1260:enable='between(t,${p.s.toFixed(2)},${p.e.toFixed(2)})'[b${i + 2}]`; });
  ff([...inputs, '-filter_complex', fc, '-map', `[b${parts.length + 1}]`, '-map', '2:a', '-t', String(total), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', path.join(PV, 'news-demo.mp4')]);
  fs.writeFileSync(path.join(ROOT, 'state', 'gta-probe.json'), JSON.stringify({ at: new Date().toISOString(), source_s: Math.round(dur), secs: total, lines: LINES.map(l => l[0]) }, null, 1));
  console.log('done', total);
})().catch(e => { console.error(e); fs.writeFileSync(path.join(ROOT, 'state', 'gta-probe.json'), JSON.stringify({ error: e.message })); process.exit(1); });
