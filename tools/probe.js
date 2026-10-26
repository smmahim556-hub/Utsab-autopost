// One-off: does munalert.org mark deceased cases? Writes state/mun-probe.json (counts and labels only, no personal data).
const fs = require('fs');
const get = u => fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }).then(r => r.text());
(async () => {
  const list = JSON.parse(await get('https://munalert.org/api/reports'));
  const re = /মৃত|লাশ|মরদেহ|dead|deceased|body/i;
  const hits = list.filter(x => re.test([x.description, x.additionalDetails, x.status, x.type].join(' ')))
    .map(x => ({ id: x.id, type: x.type, status: x.status, approved: x.approved, reportedAt: x.reportedAt, updatedAt: x.updatedAt, word: ([x.description, x.additionalDetails].join(' ').match(re) || [])[0] }));
  const html = await get('https://munalert.org/');
  const js = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => new URL(m[1], 'https://munalert.org/').href);
  const labels = [], statuses = new Set();
  for (const u of [null, ...js]) {
    const t = u ? await get(u) : html;
    for (const m of t.matchAll(/.{0,80}(মৃত|লাশ|মরদেহ|deceased|Deceased).{0,80}/g)) if (labels.length < 30) labels.push(m[0]);
    for (const m of t.matchAll(/status\s*===?\s*"(\w+)"/g)) statuses.add(m[1]);
  }
  fs.writeFileSync('state/mun-probe.json', JSON.stringify({ hits, labels, statuses: [...statuses] }, null, 2));
})();
