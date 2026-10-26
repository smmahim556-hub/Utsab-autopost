// One-off (2026-10-26): two desk posts went out with hashtags only; give them their headline as caption.
// Also records which Gemini models answer right now (status only) in state/fix-captions-probe.json.
const fs = require('fs');
const GRAPH = 'https://graph.facebook.com/v26.0';
const POSTS = [
  ['872606492607357_122147267085140193', '1276101408920358_122122943781459930', '‘৭-৮ বছর আগেই আঁচ করেছিলাম…’, স্ত্রীকে কে প্রভাবিত করছে? ‘অন্য খেলা’র ইঙ্গিত গোবিন্দার'],
  ['872606492607357_122147267745140193', '1276101408920358_122122944687459930', '৭ কোম্পানির ডিভিডেন্ড ঘোষণা, সর্বোচ্চ ১৩০ শতাংশ'],
];
(async () => {
  const acc = await (await fetch(`${GRAPH}/me/accounts?fields=id,access_token&limit=100&access_token=${process.env.FB_USER_TOKEN}`)).json();
  const tok = Object.fromEntries((acc.data || []).map(p => [p.id, p.access_token]));
  const out = { posts: [], gemini: {} };
  for (const [a, b, title] of POSTS) for (const id of [a, b]) {
    const t = tok[id.split('_')[0]];
    const cur = await (await fetch(`${GRAPH}/${id}?fields=message&access_token=${t}`)).json();
    if (cur.error) { out.posts.push({ id, error: cur.error.message }); continue; }
    if ((cur.message || '').includes(title)) { out.posts.push({ id, skipped: 'has headline' }); continue; }
    const form = new FormData(); form.append('message', `${title}\n\n${cur.message || ''}`.trim()); form.append('access_token', t);
    const r = await (await fetch(`${GRAPH}/${id}`, { method: 'POST', body: form })).json();
    out.posts.push({ id, edited: r.success === true, error: r.error?.message });
  }
  for (const m of ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.8-flash']) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ parts: [{ text: 'এক শব্দে: ২+২?' }] }] }) })
      .then(async x => `${x.status} ${x.ok ? '' : ((await x.json()).error?.message || '').slice(0, 160)}`).catch(e => e.message);
    out.gemini[m] = r;
  }
  fs.writeFileSync('state/fix-captions-probe.json', JSON.stringify(out, null, 2));
})();
