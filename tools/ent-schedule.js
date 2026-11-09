// One-off (owner 2026-11-09): last evening's Pori Moni package from Utsab TV -> Utsab TV Entertainment, scheduled by Facebook for the best hour.
const fs = require('fs');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN;
const SRC = '1152717327689735', ENT = '1406430145892267', AT = Math.floor(Date.parse('2026-11-09T22:00:00+06:00') / 1000);
(async () => {
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
  const main = acc.data.find(a => a.id === process.env.FB_PAGE_ID), ent = acc.data.find(a => a.id === ENT);
  const v = await (await fetch(`${G}/${SRC}?fields=source,description&access_token=${main.access_token}`)).json();
  const f = new FormData();
  f.append('file_url', v.source); f.append('description', v.description); f.append('published', 'false');
  f.append('scheduled_publish_time', String(AT)); f.append('access_token', ent.access_token);
  const r = await (await fetch(`${G}/${ENT}/videos`, { method: 'POST', body: f })).json();
  let chk = {};
  if (r.id) { await new Promise(x => setTimeout(x, 20000)); chk = await (await fetch(`${G}/${r.id}?fields=status,scheduled_publish_time,published&access_token=${ent.access_token}`)).json(); }
  const out = { r, chk, at: new Date(AT * 1000).toISOString() };
  fs.writeFileSync('state/ent-schedule-probe.json', JSON.stringify(out, null, 1)); console.log(out);
})();
