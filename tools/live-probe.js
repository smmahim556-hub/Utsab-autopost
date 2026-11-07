// One-off: today's live videos and videos on the main Pages with basic response counts (no tokens written). Writes state/live-probe.json.
const fs = require('fs');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN;
(async () => {
  const acc = await (await fetch(`${G}/me/accounts?fields=id,name,access_token&limit=100&access_token=${T}`)).json();
  const out = {};
  for (const a of acc.data || []) {
    const since = Math.floor(Date.now() / 1000) - 30 * 3600;
    const lv = await (await fetch(`${G}/${a.id}/live_videos?fields=id,title,status,creation_time,live_views,video{id,length,permalink_url}&limit=10&access_token=${a.access_token}`)).json();
    const vd = await (await fetch(`${G}/${a.id}/videos?fields=id,title,description,created_time,length,live_status,permalink_url,comments.summary(true).limit(0),likes.summary(true).limit(0)&since=${since}&limit=50&access_token=${a.access_token}`)).json();
    out[a.name] = { live: lv.error ? lv.error.message : lv.data, videos: vd.error ? vd.error.message : (vd.data || []).map(v => ({ id: v.id, title: v.title, desc: (v.description || '').slice(0, 120), at: v.created_time, len: v.length, live: v.live_status, url: v.permalink_url, comments: v.comments?.summary?.total_count, likes: v.likes?.summary?.total_count })) };
  }
  fs.writeFileSync('state/live-probe.json', JSON.stringify(out, null, 2));
})();
