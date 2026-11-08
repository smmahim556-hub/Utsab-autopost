// Delete the 3 copies of James' 'মীরাবাঈ' reel posted with the wrong name (owner 2026-11-08: "Muche sothik name abr deo").
const fs = require('fs'), path = require('path');
const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_VERSION || 'v26.0'}`;
const IDS = { '1406430145892267': '1660923208768532', '872606492607357': '1846749979895743', '1276101408920358': '1511357344159328' };
(async () => {
  const acc = await (await fetch(`${GRAPH}/me/accounts?fields=id,access_token&limit=100&access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).json();
  const out = {};
  for (const [page, id] of Object.entries(IDS)) {
    const tok = acc.data.find(a => a.id === page)?.access_token;
    out[page] = await (await fetch(`${GRAPH}/${id}?access_token=${encodeURIComponent(tok)}`, { method: 'DELETE' })).json().catch(e => ({ error: e.message }));
  }
  fs.writeFileSync(path.join(__dirname, '..', 'state', 'delete-probe.json'), JSON.stringify(out, null, 2));
  console.log(out);
})();
