// One-off: which sports feeds answer from the Actions runner. Writes state/sports-probe.json.
const fs = require('fs');
const urls = [
  'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
  'https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard',
  'https://site.api.espn.com/apis/site/v2/sports/cricket/scoreboard',
  'https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=cricket',
  'https://hs-consumer-api.espncricinfo.com/v1/pages/matches/current?lang=en&latest=true',
  'https://www.cricbuzz.com/api/cricket-match/live-matches',
  'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard',
];
(async () => {
  const out = {};
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
      const t = await r.text();
      let summary = t.slice(0, 300);
      try {
        const j = JSON.parse(t);
        summary = { keys: Object.keys(j).slice(0, 15), events: (j.events || []).slice(0, 5).map(e => ({ name: e.name, date: e.date, status: e.status?.type?.description || e.status?.type?.detail })),
          sports: (j.sports || []).map(s => ({ name: s.name, leagues: (s.leagues || []).slice(0, 10).map(l => ({ name: l.name, id: l.id, events: (l.events || []).slice(0, 4).map(e => `${e.name} | ${e.status} | ${e.summary || ''}`) })) })),
          matches: (j.matches || j.typeMatches || []).slice(0, 5).map(m => m.title || m.slug || JSON.stringify(m).slice(0, 200)) };
      } catch {}
      out[u] = { status: r.status, summary };
    } catch (e) { out[u] = { error: e.message }; }
  }
  fs.mkdirSync('state', { recursive: true });
  fs.writeFileSync('state/sports-probe.json', JSON.stringify(out, null, 2));
})();
