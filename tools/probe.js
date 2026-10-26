// One-off: resolved / found reports on munalert.org and how the site labels them. Writes state/mun-probe.json (no personal data).
const fs = require('fs');
const get = u => fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }).then(r => r.text());
(async () => {
  const list = JSON.parse(await get('https://munalert.org/api/reports'));
  const pick = x => ({ id: x.id, type: x.type, status: x.status, approved: x.approved, date: x.date, reportedAt: x.reportedAt, updatedAt: x.updatedAt, district: x.district, hasImg: !!x.imageUrl });
  const out = { resolved: list.filter(x => ['resolved', 'urgent'].includes(x.status) || (x.type === 'found' && x.approved)).map(pick) };
  const html = await get('https://munalert.org/');
  const js = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => new URL(m[1], 'https://munalert.org/').href);
  out.labels = [];
  for (const u of [null, ...js]) {
    const t = u ? await get(u) : html;
    for (const m of t.matchAll(/.{0,80}(উদ্ধার|resolved|Recovered|Found).{0,80}/g)) if (out.labels.length < 40) out.labels.push(m[0]);
  }
  fs.writeFileSync('state/mun-probe.json', JSON.stringify(out, null, 2));
})();
