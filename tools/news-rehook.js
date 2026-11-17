// Owner 2026-11-17: all 89 সংসদ reels from the 16 Nov lives, 'caption gula ektu valo'. Gemini listens to every held news
// reel again (short parts are first widened to at least 25 s) and writes a sharper hook from what is actually said.
// Writes state/news-rehook-probe.json; the hooks are applied to state/concert.json by hand after review.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { gemini, ff } = require('../clips');
const ROOT = path.join(__dirname, '..'), FILE = path.join(ROOT, 'state', 'concert.json'), OUT = path.join(ROOT, 'state', 'news-rehook-probe.json');
const G = 'https://graph.facebook.com/v26.0', W = '/tmp/news-rehook';
const PROMPT = len => `এটি বাংলাদেশের জাতীয় সংসদের লাইভ অধিবেশনের একটি অংশের অডিও (মোট ${len} সেকেন্ড)। মন দিয়ে শোনো কে কী বলছেন।
ফেসবুক রিলের জন্য একটি ধারালো, চোখ আটকানো বাংলা হুক শিরোনাম দাও (৬-১২ শব্দ), যাতে মানুষ থেমে দেখে।
নিয়ম: যা বলা হয়েছে তার ভিত্তিতেই; সবচেয়ে জোরালো কথাটি হুবহু উদ্ধৃতিচিহ্নে দিয়ে বক্তার পরিচয় দাও (যেমন: 'কথা', সংসদে বললেন এমপি / মন্ত্রী / স্পিকার; নাম স্পষ্ট শোনা গেলে নাম)। প্রশ্ন, অভিযোগ, সংখ্যা বা চমকপ্রদ তথ্য থাকলে সেটা সামনে আনো।
চ্যানেলের নিজের মত নয়, মিথ্যা বা অতিরঞ্জন নয়, কারও বিরুদ্ধে অভিযোগ হলে তা বক্তার কথা হিসেবেই দেখাবে। শুধু ধন্যবাদ/আনুষ্ঠানিক কথা হলে তাও সৎভাবে লিখবে।
শুধু এই JSON দাও: {"hook":"শিরোনাম","said":"মূল কথাটি এক লাইনে"}`;

(async () => {
  execFileSync('bash', ['-c', 'which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)'], { stdio: 'inherit' });
  const st = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const items = st.queue.filter(q => q.kind === 'news' && q.hold);
  fs.mkdirSync(W, { recursive: true });
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${process.env.FB_USER_TOKEN}`)).json();
  const tok = (acc.data || []).find(a => a.id === (process.env.FB_PAGE_ID || '872606492607357')).access_token;
  const files = {};
  const out = { at: new Date().toISOString(), items: [] };
  for (const q of items) {
    if (!files[q.video]) {
      const f = `${W}/${q.video}.mp4`;
      if (!fs.existsSync(f)) {
        const r = await (await fetch(`${G}/${q.video}?fields=source&access_token=${tok}`)).json();
        execFileSync('curl', ['-sSL', '--retry', '3', '-o', f, r.source]);
      }
      files[q.video] = f;
    }
    const start = q.clip.start, end = Math.max(q.clip.end, start + 25);
    const a = `${W}/${q.video}-${start}.mp3`;
    ff(['-ss', String(start), '-t', String(end - start), '-i', files[q.video], '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', a]);
    let r = null;
    for (let t = 0; t < 3 && !(r && r.hook); t++) r = await gemini([{ inline_data: { mime_type: 'audio/mp3', data: fs.readFileSync(a).toString('base64') } }, { text: PROMPT(Math.round(end - start)) }]).catch(e => ({ error: e.message }));
    const it = { video: q.video, start, end, old: q.clip.hook, hook: r && r.hook || null, said: r && r.said || null, error: r && r.error || null };
    out.items.push(it); console.log(JSON.stringify(it));
    fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  }
})().catch(e => { console.error(e); process.exit(1); });
