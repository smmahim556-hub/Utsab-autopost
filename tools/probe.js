// One-off: raw samples of the ESPN feeds. Writes state/sports-probe.json.
const fs = require('fs');
(async () => {
  const get = async u => (await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } })).json();
  const cr = await get('https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=cricket');
  const so = await get('https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard');
  const fb = await get('https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=soccer');
  const lg = cr.sports[0].leagues;
  const out = {
    cricketLeagues: lg.map(l => ({ id: l.id, name: l.name, abbr: l.abbreviation, slug: l.slug, n: l.events.length, classes: [...new Set(l.events.map(e => e.class && (e.class.generalClassCard || JSON.stringify(e.class))))] })),
    cricketEventPost: lg.flatMap(l => l.events).find(e => e.status === 'post'),
    cricketEventIn: lg.flatMap(l => l.events).find(e => e.status === 'in'),
    soccerLeagueNames: [...new Set(so.events.map(e => e.season?.slug + ' ' + (e.competitions?.[0]?.altText || '')))].slice(0, 40),
    soccerAllCount: so.events.length, soccerLeaguesInAll: so.leagues?.map(l => l.name),
    soccerEvent: so.events[0],
    soccerHeaderLeagues: fb.sports?.[0]?.leagues?.map(l => ({ id: l.id, name: l.name, slug: l.slug, n: l.events.length })),
  };
  fs.writeFileSync('state/sports-probe.json', JSON.stringify(out, null, 2));
})();
