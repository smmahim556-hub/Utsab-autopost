// Probe (owner 2026-11-12): status of the scheduled full episode videos on the three Pages, and the reel-list entries that show them.
// Writes state/gan-status-probe.json (no tokens written).
const fs = require('fs'), path = require('path');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN;
const IDS = { ent: ['1406430145892267', '1339181701575274'], main: ['872606492607357', '1084089768004026', '2225857348283459'], digital: ['1276101408920358', '1560357175851119', '1654133159532966'] };
(async () => {
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${T}`)).json();
  const out = {};
  for (const [k, list] of Object.entries(IDS)) {
    const page = (acc.data || []).find(a => a.id === list[0]);
    out[k] = [];
    for (const id of list.slice(1)) {
      const r = await (await fetch(`${G}/${id}?fields=published,scheduled_publish_time,created_time,title,permalink_url,status&access_token=${page ? page.access_token : T}`)).json();
      out[k].push({ id, r: r.error ? r.error.message : r });
    }
  }
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'gan-status-probe.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1).slice(0, 3000));
})().catch(e => { console.error(e); process.exit(1); });
