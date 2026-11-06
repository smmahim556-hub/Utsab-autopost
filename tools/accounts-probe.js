// One-off: which Pages the automation's Facebook token can post to (names and ids only, no tokens). Writes state/accounts-probe.json.
const fs = require('fs');
(async () => {
  const r = await (await fetch(`https://graph.facebook.com/v26.0/me/accounts?fields=id,name,tasks,followers_count&limit=100&access_token=${process.env.FB_USER_TOKEN}`)).json();
  fs.writeFileSync('state/accounts-probe.json', JSON.stringify(r.error ? { error: r.error.message } : (r.data || []).map(p => ({ id: p.id, name: p.name, tasks: p.tasks, followers: p.followers_count })), null, 2));
})();
