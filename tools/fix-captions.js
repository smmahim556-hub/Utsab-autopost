// One-off (2026-10-26): add hashtags to the captions of desk posts made before hashtags existed.
// Only posts that already have a caption are edited; posts that already carry #utsabtv are left alone.
const fs = require('fs');
const GRAPH = 'https://graph.facebook.com/v26.0';
const POSTS = [
  ['122147255985140193', '122122915071459930', '#utsabtv #বিনোদন #হলিউড'],
  ['122147257671140193', '122122917309459930', '#utsabtv #প্রযুক্তি #এআই'],
  ['122147260059140193', '122122920813459930', '#utsabtv #বিনোদন'],
  ['122147262585140193', '122122932207459930', '#utsabtv #বিনোদন'],
  ['122147263107140193', '122122933371459930', '#utsabtv #অর্থনীতি #শেয়ারবাজার'],
  ['122147263647140193', '122122934571459930', '#utsabtv #প্রযুক্তি'],
];
const PAGES = ['872606492607357', '1276101408920358'];
(async () => {
  const acc = await (await fetch(`${GRAPH}/me/accounts?fields=id,access_token&limit=100&access_token=${process.env.FB_USER_TOKEN}`)).json();
  const tok = Object.fromEntries((acc.data || []).map(p => [p.id, p.access_token]));
  const out = [];
  for (const [a, b, tags] of POSTS) for (const [i, page] of PAGES.entries()) {
    const id = `${page}_${[a, b][i]}`, t = tok[page];
    const cur = await (await fetch(`${GRAPH}/${id}?fields=message&access_token=${t}`)).json();
    if (cur.error) { out.push({ id, error: cur.error.message }); continue; }
    if (!cur.message) { out.push({ id, skipped: 'no caption' }); continue; }
    if (cur.message.includes('#utsabtv')) { out.push({ id, skipped: 'already tagged' }); continue; }
    const form = new FormData(); form.append('message', `${cur.message}\n\n${tags}`); form.append('access_token', t);
    const r = await (await fetch(`${GRAPH}/${id}`, { method: 'POST', body: form })).json();
    out.push({ id, edited: r.success === true, error: r.error?.message });
  }
  fs.writeFileSync('state/fix-captions-probe.json', JSON.stringify(out, null, 2));
})();
