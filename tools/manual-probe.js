// One-off: recent Utsab TV posts with the app that made them, to tell the owner's manual posts from ours. Writes state/manual-probe.json.
const fs = require('fs');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN;
(async () => {
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
  const p = (acc.data || []).find(a => a.id === process.env.FB_PAGE_ID);
  const r = await (await fetch(`${G}/${p.id}/published_posts?fields=id,created_time,message,status_type,application,permalink_url,attachments{media_type,type,url,media,subattachments.limit(5){media_type,type,media}}&limit=60&access_token=${p.access_token}`)).json();
  const out = r.error ? { error: r.error } : (r.data || []).map(x => ({ id: x.id, at: x.created_time, app: x.application, st: x.status_type, msg: (x.message || '').slice(0, 80),
    att: (x.attachments?.data || []).map(a => ({ mt: a.media_type, t: a.type, n: a.subattachments?.data?.length })) }));
  fs.writeFileSync('state/manual-probe.json', JSON.stringify(out, null, 1));
})();
