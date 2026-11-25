// GTA 6 reels (owner 2026-11-19): two a day on Utsab TV, Digital and Utsab TV Entertainment ('jehetu game').
//   13:00 Dhaka KIND=news  : today's GTA 6 news.        21:00 Dhaka KIND=fact : a 'জানা-অজানা' fact about the game.
// Script: Gemini with Google Search grounding (facts only from what search returns), then Amin's ElevenLabs clone reads it.
// Look: our green/red frame + headline, the owner's gameplay footage (Drive, he says copyright free) in the middle, Bangla
// subtitle per sentence in the lower band, animated logo. Footage windows move through the video so reels don't repeat.
// DRY=1 renders preview/gta/<kind>.mp4 only. State: state/gta.json.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { ff, secs, overlay } = require('../clips');
const ROOT = path.join(__dirname, '..'), W = '/tmp/gta', PV = path.join(ROOT, 'preview', 'gta'), ST = path.join(ROOT, 'state', 'gta.json');
const SRC = process.env.GTA_SRC || '/mnt/gta/src.mp4', DRIVE = process.env.GTA_DRIVE || '1fmejgUdebamEXbCzdntxI2Ny4OMxa-N5';
const VOICE = JSON.parse(fs.readFileSync(path.join(ROOT, 'state', 'eleven.json'), 'utf8')).voice_id; // Amin
const LOGO = path.join(ROOT, 'assets', 'video-logo.webm'), G = 'https://graph.facebook.com/v26.0', ENT = '1406430145892267';
const DRY = process.env.DRY === '1';
const dk = new Date(Date.now() + 6 * 3600e3), today = dk.toISOString().slice(0, 10);
const KIND = process.env.KIND || (dk.getUTCHours() < 17 ? 'news' : 'fact');
const st = (() => { try { return JSON.parse(fs.readFileSync(ST, 'utf8')); } catch { return { done: [], offset: 0, log: [] }; } })();
const save = () => fs.writeFileSync(ST, JSON.stringify(st, null, 1));
const log = m => { console.log(m); st.log = [...(st.log || []), `${new Date().toISOString()} ${m}`].slice(-60); save(); };
const BN = /[ঀ-৿]/;

function firstJson(t) {
  const i = t.indexOf('{'); if (i < 0) return null;
  for (let k = t.length; k > i; k = t.lastIndexOf('}', k - 1)) { try { return JSON.parse(t.slice(i, k + 1)); } catch {} if (k <= i) break; }
  return null;
}
// Context from Google News (the Gemini key's Google Search grounding quota is 0, 2026-11-19): latest GTA 6 headlines.
async function newsContext() {
  const q = KIND === 'news' ? 'GTA 6 when:2d' : 'GTA 6';
  const x = await (await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`)).text();
  const items = [...x.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 25).map(m => {
    const g = k => ((m[1].match(new RegExp(`<${k}[^>]*>([\\s\\S]*?)</${k}>`)) || [])[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    return `- ${g('title')} (${g('pubDate').slice(0, 16)})`;
  });
  return items.join('\n');
}
async function script() {
  const ctx = await newsContext().catch(() => '');
  const recent = (st.done || []).slice(-14).map(d => d.head).join(' | ');
  const ask = KIND === 'news'
    ? `নিচের সংবাদ শিরোনামগুলো থেকে GTA 6 (Grand Theft Auto VI) নিয়ে সবচেয়ে বড় খবরটি বেছে নাও (আজ ${today})। প্রতিটি বাক্য কোনো একটি শিরোনামে স্পষ্ট লেখা তথ্যের ওপর দাঁড়াবে, নিজে তথ্য বানাবে না। গুজব, ফাঁস, 'শোনা যাচ্ছে' ধরনের কিছু দেবে না। 'সর্বকালের সেরা', 'সর্বোচ্চ রেটিং' ধরনের দাবি দেবে না, যদি না শিরোনামে হুবহু থাকে। আগের এই খবরগুলো আবার দেবে না: ${recent || '(নেই)'}`
    : `GTA 6 (Grand Theft Auto VI) সম্পর্কে একটি মজার, কম জানা কিন্তু নিশ্চিত সত্য তথ্য বেছে নাও (গেমের শহর, চরিত্র, তৈরির গল্প, রেকর্ড, ফিচার ইত্যাদি), নিচের শিরোনাম বা ২০২৩ সাল থেকে Rockstar-এর ঘোষিত তথ্য থেকে। অনিশ্চিত কিছু নয়। আগের এগুলো আবার নয়: ${recent || '(নেই)'}`;
  const prompt = `${ask}
সংবাদ শিরোনাম (Google News):
${ctx || '(পাওয়া যায়নি)'}
তারপর বাংলা ফেসবুক রিলের স্ক্রিপ্ট লেখো (বাংলাদেশি দর্শক, সংবাদ পাঠকের ভাষা, প্রায় ৩০-৪০ সেকেন্ড): ৫-৭টি ছোট বাক্য।
প্রতিটি বাক্যের জন্য say (পড়ার জন্য: সব সংখ্যা বাংলা শব্দে লেখো, যেমন 'নিরানব্বই', 'জিটিএ সিক্স'; ইংরেজি নাম বাংলা বানানে) আর sub (পর্দার জন্য ছোট লেখা, সর্বোচ্চ ৬-৭ শব্দ, সংখ্যা অঙ্কে চলবে)।
শেষ বাক্য দর্শককে কমেন্টে মত জানাতে বলবে। অতিরঞ্জন নয়, মিথ্যা নয়; হেডলাইনেও না।
head1 ও head2: দুই লাইনের হেডলাইন (প্রতিটি সর্বোচ্চ ৫-৬ শব্দ)। caption: ফেসবুক ক্যাপশনের ২ বাক্য।
শুধু এই JSON: {"head1":"...","head2":"...","caption":"...","lines":[{"say":"...","sub":"..."}]}`;
  for (const model of ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite']) {
    for (let t = 0; t < 2; t++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(180000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, responseMimeType: 'application/json' } }) }).catch(() => null);
      const b = r ? await r.json().catch(() => ({})) : {};
      const c = b.candidates?.[0], txt = (c?.content?.parts || []).map(p => p.text || '').join('');
      const j = firstJson(txt);
      const srcs = (c?.groundingMetadata?.groundingChunks || []).map(g => g.web?.uri || '').filter(Boolean);
      if (j && BN.test(j.head1 || '') && (j.lines || []).length >= 4 && j.lines.every(l => BN.test(l.say || '') && l.sub)) return { ...j, model, sources: srcs.slice(0, 8), context: ctx.split('\n').slice(0, 10) };
      log(`script retry ${model}: ${(b.error?.message || txt).slice(0, 120)}`);
    }
  }
  throw new Error('no script');
}
async function tts(text, out) {
  for (const model of ['eleven_v4_turbo', 'eleven_v4', 'eleven_v3']) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, { method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: model, language_code: 'bn', voice_settings: { stability: 0.5, similarity_boost: 0.85 } }) });
    if (r.ok) { fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); return out; }
    log(`tts ${model} ${r.status} ${(await r.text()).slice(0, 120)}`);
  }
  throw new Error('ElevenLabs failed');
}
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

async function render(sc, out) {
  fs.rmSync(W, { recursive: true, force: true }); fs.mkdirSync(W, { recursive: true });
  const parts = []; let t = 0;
  for (const [i, l] of sc.lines.entries()) { const f = await tts(l.say, `${W}/v${i}.mp3`); const d = secs(f); parts.push({ f, s: t, e: t + d, sub: l.sub }); t += d + 0.25; }
  ff(['-f', 'lavfi', '-t', '0.25', '-i', 'anullsrc=r=44100:cl=mono', '-b:a', '128k', `${W}/gap.mp3`]);
  fs.writeFileSync(`${W}/vl.txt`, parts.map(p => `file '${p.f}'\nfile '${W}/gap.mp3'`).join('\n'));
  ff(['-f', 'concat', '-safe', '0', '-i', `${W}/vl.txt`, '-ar', '44100', '-ac', '2', `${W}/voice.wav`]);
  const total = secs(`${W}/voice.wav`) + 0.8, dur = secs(SRC);
  // 4-second shots from a window that moves through the gameplay each reel (skip the first/last 5%).
  const n = Math.ceil(total / 4), span = dur * 0.9, shots = [];
  let off = Number(st.offset || 0);
  for (let i = 0; i < n; i++) {
    const at = dur * 0.05 + (off % span), f = `${W}/c${i}.mp4`; off += 37;  // 37 s apart: different scenes, wraps around
    ff(['-ss', at.toFixed(1), '-t', '4', '-i', SRC, '-an', '-vf', 'scale=-2:1080,crop=1080:1080,fps=30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', f]); shots.push(`file '${f}'`);
  }
  st.offset = off % span;
  fs.writeFileSync(`${W}/cl.txt`, shots.join('\n'));
  ff(['-f', 'concat', '-safe', '0', '-i', `${W}/cl.txt`, '-t', String(total), '-c', 'copy', `${W}/foot.mp4`]);
  const browser = await chromium.launch();
  try {
    await overlay(browser, `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#0b5e2a,#12873d 40%,#0b5e2a)">
<div style="position:absolute;left:0;right:0;top:0;height:470px;background:linear-gradient(135deg,#12873d,#0b5e2a);border-bottom:10px solid #c8202f"></div>
<div style="position:absolute;left:44px;top:62px;background:#c8202f;color:#fff;font-size:40px;padding:6px 30px;border-radius:40px;border:3px solid #ffd54f">${KIND === 'news' ? 'গেমিং খবর' : 'জানা-অজানা'}</div>
<div style="position:absolute;left:44px;right:44px;top:180px;color:#fff;font-size:72px;line-height:1.25;text-align:left">${esc(sc.head1)}<br><span style="color:#ffd54f">${esc(sc.head2 || '')}</span></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:130px;background:linear-gradient(135deg,#c8202f,#931624);border-top:8px solid #ffd54f;color:#fff;font-size:52px;display:flex;align-items:center;justify-content:center">www.utsabtv.com</div></div>`, `${W}/frame.png`, 1080, 1920);
    for (const [i, p] of parts.entries()) await overlay(browser, `<div style="background:rgba(0,0,0,.72);color:#fff;font-size:54px;line-height:1.3;padding:16px 34px;border-radius:18px;border-left:10px solid #ffd54f;max-width:1000px">${esc(p.sub)}</div>`, `${W}/s${i}.png`, 1080, 300);
  } finally { await browser.close(); }
  const inputs = ['-loop', '1', '-i', `${W}/frame.png`, '-i', `${W}/foot.mp4`, '-i', `${W}/voice.wav`, '-stream_loop', '-1', '-c:v', 'libvpx-vp9', '-i', LOGO, ...parts.flatMap((_, i) => ['-loop', '1', '-i', `${W}/s${i}.png`])];
  let fc = `[0][1]overlay=0:470:shortest=1[b0];[3]scale=260:-1[lg];[b0][lg]overlay=W-w-28:28:shortest=1[b1]`;
  parts.forEach((p, i) => { fc += `;[b${i + 1}][${4 + i}]overlay=0:1570:enable='between(t,${p.s.toFixed(2)},${p.e.toFixed(2)})'[b${i + 2}]`; });
  ff([...inputs, '-filter_complex', fc, '-map', `[b${parts.length + 1}]`, '-map', '2:a', '-t', String(total), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out]);
  return total;
}
async function form(url, fields) {
  const f = new FormData(); for (const [k, v] of Object.entries(fields)) f.append(k, String(v));
  const b = await (await fetch(url, { method: 'POST', body: f })).json().catch(() => ({}));
  if (b.error) throw new Error(JSON.stringify(b.error).slice(0, 300));
  return b;
}
async function postReel(page, file, description) {
  const { video_id: vid, upload_url } = await form(`${G}/${page.id}/video_reels`, { upload_phase: 'start', access_token: page.token });
  const up = await fetch(upload_url || `https://rupload.facebook.com/video-upload/v26.0/${vid}`, { method: 'POST', headers: { Authorization: `OAuth ${page.token}`, offset: '0', file_size: String(fs.statSync(file).size) }, body: fs.readFileSync(file) });
  const ub = await up.json().catch(() => ({}));
  if (!up.ok || ub.success === false) throw new Error(`reel upload: ${JSON.stringify(ub).slice(0, 200)}`);
  await form(`${G}/${page.id}/video_reels`, { upload_phase: 'finish', video_id: vid, video_state: 'PUBLISHED', description, access_token: page.token });
  return vid;
}

(async () => {
  if (!DRY && process.env.GTA === '0') return log('GTA off');
  const slot = `${today}-${KIND}`;
  if (!DRY && (st.done || []).some(d => d.slot === slot) && process.env.GTA_FORCE !== '1') return log(`already posted ${slot}`);
  if (!fs.existsSync(SRC)) {
    fs.mkdirSync(path.dirname(SRC), { recursive: true });
    execFileSync('curl', ['-sSL', '--retry', '3', '-o', SRC, `https://drive.usercontent.google.com/download?id=${DRIVE}&export=download&confirm=t`], { stdio: 'inherit' });
    if (fs.statSync(SRC).size < 1e7) { const t = fs.readFileSync(SRC, 'utf8').slice(0, 200); fs.unlinkSync(SRC); throw new Error('footage download failed: ' + t); }
  }
  const sc = await script();
  log(`${KIND}: ${sc.head1} / ${sc.head2} (${sc.model})`);
  fs.mkdirSync(PV, { recursive: true });
  const out = path.join(PV, `${KIND}.mp4`);
  const secsLen = await render(sc, out);
  fs.writeFileSync(path.join(PV, `${KIND}.json`), JSON.stringify(sc, null, 1));
  if (DRY) { save(); return log(`dry ${KIND} ${secsLen.toFixed(1)}s`); }
  const tags = '#GTA6 #GTAVI #RockstarGames #গেমিং #utsabtv';
  const desc = `${sc.head1} ${sc.head2 || ''}`.trim() + `\n\n${sc.caption || ''}\n\n${tags}`;
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).json();
  const pages = [process.env.FB_PAGE_ID, process.env.FB_PAGE_ID_2, ENT].filter(Boolean).map(id => (acc.data || []).find(a => a.id === id)).filter(Boolean);
  const ids = {};
  for (const p of pages) { try { ids[p.id] = await postReel({ id: p.id, token: p.access_token }, out, desc); log(`reel ${ids[p.id]} on ${p.id}`); } catch (e) { log(`post ${p.id} failed: ${e.message}`); } }
  st.done = [...(st.done || []), { slot, at: new Date().toISOString(), kind: KIND, head: `${sc.head1} ${sc.head2 || ''}`.trim(), ids, sources: sc.sources }].slice(-200);
  save();
})().catch(e => { log(`error: ${e.message}`); process.exit(1); });
