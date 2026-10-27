// One-off (2026-10-27): the Gazipur fire card went out with the wrong photo (the site's article had the PM's dinner
// photo for a while and now has none). Builds a replacement card: the old card with a freely licensed fire photo
// (Wikimedia Commons) marked "প্রতীকী ছবি". Writes preview/gazipur-new.png and preview/gazipur-photo.json. Posts nothing.
const fs = require('fs');
const { chromium } = require('playwright');
const UA = { 'user-agent': 'UtsabAutopost/1.0 (https://utsabtv.com)' };
(async () => {
  const q = new URLSearchParams({ action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '30',
    gsrsearch: 'warehouse fire firefighters filetype:bitmap', prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1600' });
  const j = await (await fetch(`https://commons.wikimedia.org/w/api.php?${q}`, { headers: UA })).json();
  const pages = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index);
  const ok = pages.map(p => ({ p, ii: p.imageinfo?.[0] })).filter(({ ii }) => ii && ii.width >= 1200 && ii.width > ii.height &&
    /^(CC0|Public domain|CC BY(-SA)? [0-9.]+)$/i.test(ii.extmetadata?.LicenseShortName?.value || ''));
  const list = ok.slice(0, 6).map(({ p, ii }) => ({ title: p.title, license: ii.extmetadata.LicenseShortName.value, artist: (ii.extmetadata.Artist?.value || '').replace(/<[^>]+>/g, ''), url: ii.thumburl || ii.url }));
  fs.mkdirSync('preview', { recursive: true });
  fs.writeFileSync('preview/gazipur-photo.json', JSON.stringify(list, null, 2));
  const browser = await chromium.launch();
  const old = 'data:image/jpeg;base64,' + fs.readFileSync('tools/assets/gazipur-old.jpg').toString('base64');
  for (const [i, pick] of list.slice(0, 3).entries()) {
    const img = await fetch(pick.url, { headers: UA });
    const photo = `data:${img.headers.get('content-type')};base64,${Buffer.from(await img.arrayBuffer()).toString('base64')}`;
    const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
    await pg.setContent(`<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0}body{width:1080px;height:1350px;position:relative;overflow:hidden;background:url('${old}') 0 0/1080px 1350px}
.ph{position:absolute;left:0;top:0;width:1080px;height:858px;background:url('${photo}') center/cover}
.logo{position:absolute;left:838px;top:54px;width:192px;height:110px;background:url('${old}') -838px -54px/1080px 1350px}
.date{position:absolute;left:872px;top:830px;width:208px;height:40px;background:url('${old}') -872px -830px/1080px 1350px}
.sym{position:absolute;left:24px;top:808px;background:rgba(0,0,0,.6);color:#fff;font:700 22px 'Noto Serif Bengali';padding:4px 14px;border-radius:8px}</style>
<div class="ph"></div><div class="logo"></div><div class="date"></div><div class="sym">প্রতীকী ছবি</div>`, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: `preview/gazipur-new-${i + 1}.png` });
    await pg.close();
  }
  await browser.close();
})();
