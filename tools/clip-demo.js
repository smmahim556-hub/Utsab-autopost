// Demo (2026-10-29): hook reels from the newest long video on the Utsab TV Page (clips.js). Writes preview/clip-demo-*.mp4. Posts nothing.
const fs = require('fs'), path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const { planClips, renderClip } = require('../clips');
const GRAPH = 'https://graph.facebook.com/v26.0', out = {};
const done = () => fs.writeFileSync('state/clip-probe.json', JSON.stringify(out, null, 2));
(async () => {
  try {
    execSync('which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)', { stdio: 'inherit' });
    const acc = await (await fetch(`${GRAPH}/me/accounts?fields=id,access_token&access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).json();
    const page = (acc.data || []).find(p => p.id === process.env.FB_PAGE_ID);
    // Packages: landscape videos of 1.5+ minutes (the vertical ones are reels already). Up to 300 recent videos.
    const vids = { data: [] };
    let u = `${GRAPH}/${page.id}/videos?fields=id,title,description,length,source,created_time,permalink_url,format{width,height}&limit=100&access_token=${encodeURIComponent(page.access_token)}`;
    for (let i = 0; i < 3 && u; i++) { const r = await (await fetch(u)).json(); if (r.error) throw new Error(`videos: ${r.error.message}`); vids.data.push(...(r.data || [])); u = r.paging?.next || ''; }
    const wide = x => { const f = (x.format || []).slice(-1)[0] || {}; return f.width > f.height; };
    const pk = vids.data.filter(x => wide(x) && x.length >= Number(process.env.CLIP_MIN_LEN || 90) && x.source);
    out.packages = pk.map(v => `${v.created_time.slice(0, 10)} ${Math.round(v.length)}s ${(v.title || v.description || '').slice(0, 60).replace(/\n/g, ' ')}`).slice(0, 15);
    out.total = vids.data.length;
    const v = pk[0];
    if (!v) throw new Error('no landscape package video');
    out.picked = { id: v.id, len: v.length, title: (v.title || v.description || '').slice(0, 120), url: v.permalink_url };
    const W = '/tmp/clips'; fs.mkdirSync(W, { recursive: true });
    fs.writeFileSync(`${W}/src.mp4`, Buffer.from(await (await fetch(v.source)).arrayBuffer()));
    const clips = await planClips(`${W}/src.mp4`, W, 2);
    out.plan = clips.map(c => ({ start: c.start, end: c.end, hook: c.hook, subs: c.subs.length, first: c.subs[0]?.t }));
    const browser = await chromium.launch();
    try {
      const pg = await browser.newPage(); let logo = '';
      try {
        await pg.goto('https://card.utsabtv.com/', { waitUntil: 'networkidle', timeout: 60000 });
        logo = await pg.evaluate(async () => { const img = document.querySelector('#renderTarget .card-logo-img, #renderTarget .utsab-channel-logo img, #renderTarget img[alt*="ogo"]');
          if (!img) return ''; const b = await (await fetch(img.src)).blob(); return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); });
      } catch {} finally { await pg.close(); }
      for (const [i, c] of clips.entries()) await renderClip(browser, `${W}/src.mp4`, c, logo, `preview/clip-demo-${i + 1}.mp4`, W, `c${i}`);
    } finally { await browser.close(); }
  } catch (e) { out.error = e.message.slice(0, 400); }
  done();
})();
