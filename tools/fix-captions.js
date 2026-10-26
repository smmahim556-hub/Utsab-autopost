// One-off (2026-10-26): news photocards posted with a caption; the user wants none at all on them.
const fs = require('fs');
const GRAPH = 'https://graph.facebook.com/v26.0';
const TAGS = '';
const IDS = ['872606492607357_122147274201140193', '1276101408920358_122122956285459930', '872606492607357_122147275071140193', '1276101408920358_122122957515459930',
  '872606492607357_122147275587140193', '1276101408920358_122122958775459930', '872606492607357_122147275803140193', '1276101408920358_122122959159459930',
  '872606492607357_122147276469140193', '1276101408920358_122122960533459930', '872606492607357_122147277087140193', '1276101408920358_122122962027459930'];
(async () => {
  const acc = await (await fetch(`${GRAPH}/me/accounts?fields=id,access_token&limit=100&access_token=${process.env.FB_USER_TOKEN}`)).json();
  const tok = Object.fromEntries((acc.data || []).map(p => [p.id, p.access_token]));
  const out = [];
  for (const id of IDS) {
    const t = tok[id.split('_')[0]];
    const cur = await (await fetch(`${GRAPH}/${id}?fields=message&access_token=${t}`)).json();
    if (cur.error) { out.push({ id, error: cur.error.message }); continue; }
    if (!(cur.message || '').trim()) { out.push({ id, skipped: 'no caption', at: Date.now() }); continue; }
    const form = new FormData(); form.append('message', TAGS); form.append('access_token', t);
    const r = await (await fetch(`${GRAPH}/${id}`, { method: 'POST', body: form })).json();
    const after = await (await fetch(`${GRAPH}/${id}?fields=message&access_token=${t}`)).json();
    out.push({ id, edited: r.success === true, error: r.error?.message, now: after.message || '' });
  }
  fs.writeFileSync('state/fix-captions-probe.json', JSON.stringify(out, null, 2));
})();
