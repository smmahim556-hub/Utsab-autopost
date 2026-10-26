// One-off: shape of munalert.org's public reports list. Writes state/mun-probe.json.
const fs = require('fs');
(async () => {
  const r = await fetch('https://munalert.org/api/reports', { headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' } });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = null; }
  const list = Array.isArray(j) ? j : (j && (j.data || j.reports || j.items || j.results)) || [];
  const out = { status: r.status, type: Array.isArray(j) ? 'array' : typeof j, topKeys: j && !Array.isArray(j) ? Object.keys(j) : undefined, count: list.length,
    keys: list[0] ? Object.keys(list[0]) : [], sample: list.slice(0, 2), head: j ? undefined : t.slice(0, 300) };
  fs.writeFileSync('state/mun-probe.json', JSON.stringify(out, null, 2));
})();
