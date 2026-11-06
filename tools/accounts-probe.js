// One-off: which Pages the automation's Facebook token can post to, its permissions and expiry (no tokens written). Writes state/accounts-probe.json.
const fs = require('fs');
const G = 'https://graph.facebook.com/v26.0', T = process.env.FB_USER_TOKEN;
(async () => {
  const r = await (await fetch(`${G}/me/accounts?fields=id,name,tasks,followers_count&limit=100&access_token=${T}`)).json();
  const perms = await (await fetch(`${G}/me/permissions?access_token=${T}`)).json();
  const dbg = await (await fetch(`${G}/debug_token?input_token=${T}&access_token=${T}`)).json();
  const d = dbg.data || {};
  fs.writeFileSync('state/accounts-probe.json', JSON.stringify({
    pages: r.error ? { error: r.error.message } : (r.data || []).map(p => ({ id: p.id, name: p.name, tasks: p.tasks, followers: p.followers_count })),
    perms: (perms.data || []).filter(p => p.status === 'granted').map(p => p.permission),
    expires: d.expires_at ? new Date(d.expires_at * 1000).toISOString() : d.expires_at, dataAccessExpires: d.data_access_expires_at ? new Date(d.data_access_expires_at * 1000).toISOString() : null, debugError: dbg.error?.message,
  }, null, 2));
})();
