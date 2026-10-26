// One-off: how munalert.org marks recovered/found reports. Writes state/mun-probe.json (no personal data).
const fs = require('fs');
(async () => {
  const r = await fetch('https://munalert.org/api/reports', { headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' } });
  const j = await r.json();
  const list = Array.isArray(j) ? j : j.data || j.reports || [];
  const combos = {}; const keys = {};
  for (const x of list) { const k = `${x.type}|${x.status}|${x.approved}`; combos[k] = (combos[k] || 0) + 1; for (const f of Object.keys(x)) keys[f] = (keys[f] || 0) + 1; }
  const hide = new Set(['name', 'contactPhone', 'contactName', 'description', 'additionalDetails', 'lastSeen', 'imageUrl']);
  const odd = list.filter(x => !(x.type === 'missing' && x.status === 'active'))
    .sort((a, b) => Date.parse(b.updatedAt || b.reportedAt) - Date.parse(a.updatedAt || a.reportedAt)).slice(0, 8)
    .map(x => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, hide.has(k) ? (v ? `<${String(v).length} chars>` : v) : v])));
  fs.writeFileSync('state/mun-probe.json', JSON.stringify({ count: list.length, combos, keys, recentOther: odd }, null, 2));
})();
