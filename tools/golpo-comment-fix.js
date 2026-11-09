// One-off: the page-link comment that failed on Utsab TV Digital under ep04 (reel 4712446919079587, 2026-11-09).
const fs = require('fs');
const G = 'https://graph.facebook.com/v26.0', PAGE = '1276101408920358', REEL = '4712446919079587', GOLPO = '1417588244778601';
(async () => {
  const acc = await (await fetch(`${G}/me/accounts?fields=id,access_token&limit=100&access_token=${process.env.FB_USER_TOKEN}`)).json();
  const tok = acc.data.find(a => a.id === PAGE).access_token;
  const f = new FormData(); f.append('message', `পুরো সিরিজ "আবিষ্কারের গল্প" দেখুন উৎসবের গল্প পেজে: https://www.facebook.com/${GOLPO}`); f.append('access_token', tok);
  const r = await (await fetch(`${G}/${REEL}/comments`, { method: 'POST', body: f })).json();
  fs.writeFileSync('state/golpo-comment-probe.json', JSON.stringify(r)); console.log(r);
})();
