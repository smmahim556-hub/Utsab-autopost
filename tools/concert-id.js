// Identify the songs in the held concert clips (owner 2026-11-08: Gemini gave different names to parts of one song).
// For every source file behind a held item: whole-file audio -> Gemini lists the songs it hears (verbatim chorus lines,
// title, original artist, confidence, time span). Writes state/concert-id-probe.json for me to check by hand.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
try { execSync('which ffmpeg'); } catch { execSync('sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg', { stdio: 'inherit' }); }
const { gemini, ff, secs } = require('../clips');
const st = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'state', 'concert.json'), 'utf8'));
const W = '/tmp/cid'; fs.mkdirSync(W, { recursive: true });
(async () => {
  const out = {};
  for (const v of [...new Set(st.queue.filter(q => q.hold).map(q => q.video))]) {
    const f = `${W}/${v.slice(3)}.mp4`, a = `${W}/${v.slice(3)}.mp3`;
    try {
      execSync(`curl -sSL --retry 3 -o ${f} "https://drive.usercontent.google.com/download?id=${v.slice(3)}&export=download&confirm=t"`);
      ff(['-i', f, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', a]);
      const clips = st.queue.filter(q => q.video === v).map(q => [Math.round(q.clip.start), Math.round(q.clip.end)]);
      out[v] = { secs: Math.round(secs(a)), clips, songs: await gemini([{ inline_data: { mime_type: 'audio/mp3', data: fs.readFileSync(a).toString('base64') } }, { text:
`এটি শিল্পী নোবেলের (Mainul Ahsan Noble) একটি কনসার্টের মোবাইলে ধারণ করা অডিও। এতে কোন কোন গান গাওয়া হয়েছে তা চিহ্নিত করো। নোবেল সাধারণত অন্য শিল্পীদের জনপ্রিয় বাংলা গান (ব্যান্ড, আধুনিক, লোকগান, রবীন্দ্রসংগীত) কভার করেন।
প্রতিটি গানের জন্য দাও: সময় (শুরু-শেষ সেকেন্ড), যে মূল লাইনগুলো স্পষ্ট শোনা যায় সেগুলো হুবহু (৩-৬ লাইন), গানের প্রচলিত নাম, মূল শিল্পী/ব্যান্ড, আর তুমি কতটা নিশ্চিত (high/medium/low)। নিশ্চিত না হলে নাম ফাঁকা রাখো, বানাবে না।
শুধু JSON: [{"from":0,"to":180,"lines":["..."],"title":"","artist":"","confidence":"low"}]` }]).catch(e => ({ error: e.message })) };
    } catch (e) { out[v] = { error: e.message }; }
    console.log(v, JSON.stringify(out[v]).slice(0, 600));
    fs.writeFileSync(path.join(__dirname, '..', 'state', 'concert-id-probe.json'), JSON.stringify(out, null, 2));
  }
})();
