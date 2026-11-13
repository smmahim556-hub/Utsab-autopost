// Probe (owner 2026-11-13): what ESPN returns for the SAFF Championship scoreboard, to see why no SAFF cards went out.
// Writes state/saff-probe.json (no tokens written).
const fs = require('fs'), path = require('path');
(async () => {
  const out = {};
  const slugs = (process.env.SAFF_SLUGS || 'saff.championship').split(',');
  out.leagues = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/leagues?limit=1000', { headers: { 'user-agent': 'Mozilla/5.0' } }).then(r => r.json()).then(j => JSON.stringify((j.leagues || j.sports?.[0]?.leagues || []).filter(l => /saff|south asia|SAFF/i.test(JSON.stringify(l))).map(l => l.slug))).catch(e => 'err ' + e.message);
  for (const slug of slugs) {
    try {
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard`, { headers: { 'user-agent': 'Mozilla/5.0' } });
      const j = await r.json();
      out[slug] = { status: r.status, events: (j.events || []).map(e => ({ date: e.date, name: e.name, state: e.status?.type?.state, score: (e.competitions?.[0]?.competitors || []).map(c => `${c.team?.displayName}:${c.score ?? '-'}`).join(' v ') })), error: j.code || null };
    } catch (e) { out[slug] = { error: e.message }; }
  }
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'saff-probe.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1).slice(0, 2500));
})();
