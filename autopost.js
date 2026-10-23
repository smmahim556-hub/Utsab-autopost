// Utsab TV auto-poster.
// 1. Reads the utsabtv.com homepage and finds news links not seen before.
// 2. Makes the photocard on card.utsabtv.com (paste link -> Fetch -> Download).
// 3. Posts the card to each Facebook Page, then puts the news link in the first comment.
//
// Env:
//   FB_PAGE_ID, FB_PAGE_ID_2       Facebook Page ids to post to (the second is optional)
//   FB_USER_TOKEN                  long-lived user token; each Page's own token is looked up from it
//   FB_PAGE_TOKEN, FB_PAGE_TOKEN_2 alternatively, the Page tokens themselves (used when no FB_USER_TOKEN)
//   HEADLINE_SCALE (1.2), DATE_SCALE (1.25), LOGO_SCALE (1.27)  headline / date / logo size relative to the card site's default
//   STORY=1                        also post the card as a Page story (shared-post look)
//   CHECK=1                        only test the Page tokens (no posting), write the result to state/check.json
//   DRY_RUN=1                  make cards into ./out but do not post (default unless DRY_RUN=0)
//   WEATHER=1                      daily weather cards for the 8 divisions (see weatherTick)
//   REEL_RUN=1 / DEMO_REEL=1       daily top-10 Reel (post / only build the video), see reelRun
//   MAX_PER_RUN                at most this many posts per run (default 3)
//   GRAPH_VERSION              Graph API version (default v26.0)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SITE = 'https://utsabtv.com/';
const CARD_SITE = process.env.CARD_SITE || 'https://card.utsabtv.com/';
const STATE_FILE = path.join(__dirname, 'state', 'seen.json');
const OUT_DIR = path.join(__dirname, 'out');
const DRY_RUN = process.env.DRY_RUN !== '0';
const MAX_PER_RUN = Number(process.env.MAX_PER_RUN || 3);
const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_VERSION || 'v26.0'}`;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

const EVENTS_FILE = path.join(__dirname, 'state', 'events.json');
const log = (...a) => console.log(new Date().toISOString(), ...a);
// Outcome of each post/story, kept in the repo (last 40) so a failure can be read without the Actions logs.
function event(text) {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8')); } catch {}
  list.push({ at: new Date().toISOString(), text: String(text).slice(0, 600) });
  fs.mkdirSync(path.dirname(EVENTS_FILE), { recursive: true });
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(list.slice(-40), null, 2));
  log(text);
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return null; }
}
function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  state.seen = state.seen.slice(-500);
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

const meta = (html, prop) => {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)`, 'i'))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, 'i'));
  return m ? decodeEntities(m[1]) : '';
};
const decodeEntities = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// News links on the homepage, newest first as they appear on the page.
// A news link is https://utsabtv.com/<one-slug-with-hyphens>; category/tag pages are
// filtered out later because only news pages carry a /storage/posts/ og:image.
async function homepageLinks() {
  const html = await getText(SITE);
  const links = [];
  for (const m of html.matchAll(/href=["'](https?:\/\/(?:www\.)?utsabtv\.com\/([a-z0-9]+(?:-[a-z0-9]+)+))\/?["']/gi)) {
    const url = m[1].replace('://www.', '://');
    if (!links.includes(url)) links.push(url);
  }
  return links;
}

async function articleInfo(url) {
  const html = await getText(url);
  return { title: meta(html, 'og:title'), image: meta(html, 'og:image'), isArticle: html.includes('বার পড়া হয়েছে') };
}

async function makeCard(browser, url, file, ratio = process.env.CARD_RATIO || '4:5') {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1000 }, userAgent: UA });
  const page = await ctx.newPage();
  try {
    await page.goto(CARD_SITE, { waitUntil: 'networkidle', timeout: 60000 });
    // Card size: 4:5 portrait (1080x1350) unless CARD_RATIO says otherwise.
    await page.click(`#ratioSelector [data-ratio="${ratio}"]`);
    // Headline size: the site's "Text Size" slider (1 = default, steps of 0.05).
    await page.$eval('#textSizeInput', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); },
      String(process.env.HEADLINE_SCALE || 1.2));
    await page.fill('#articleUrlInput', url);
    await page.click('#fetchArticleBtn');
    // The status hint shows "loading" while it fetches the headline, date and photo,
    // then switches to "success" or "error" once the photo has loaded too.
    await page.waitForFunction(() => /\b(success|error)\b/.test(document.querySelector('#articleStatusHint')?.className || ''),
      null, { timeout: 90000 });
    const hint = (await page.textContent('#articleStatusHint') || '').trim();
    log('card site says:', hint);
    if (/\berror\b/.test(await page.getAttribute('#articleStatusHint', 'class'))) throw new Error(`card site: ${hint}`);
    if (!hint.includes('ছবি')) log('warning: no photo found for this news');
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);
    // The date has no size control on the site, so scale it directly (1 = default).
    const date = await page.evaluate(([k, dy]) => {
      const el = document.querySelector('#renderTarget .utsab-date-text');
      if (!el) return null;
      const before = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = `${before * k}px`;
      // Bigger text sits lower in the ribbon; nudge it back up to stay centred.
      el.style.position = 'relative';
      el.style.top = `${dy}px`;
      return { before, after: before * k };
    }, [Number(process.env.DATE_SCALE || 1.25), Number(process.env.DATE_DY || -3)]);
    log('date font size:', JSON.stringify(date));
    // Logo: grow it from its top-right corner, then move it to the reference position
    // (LOGO_DX / LOGO_DY in card pixels; negative DX = left, positive DY = down).
    await page.evaluate(([k, dx, dy]) => {
      const el = document.querySelector('#renderTarget .utsab-channel-logo');
      if (!el) return;
      el.style.transformOrigin = 'top right';
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${k})`;
    }, [Number(process.env.LOGO_SCALE || 1.27), Number(process.env.LOGO_DX || -22), Number(process.env.LOGO_DY || 24)]);
    await page.waitForTimeout(500);
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#downloadBtn')]);
    const ext = path.extname(download.suggestedFilename()) || '.png';
    const out = file + ext;
    await download.saveAs(out);
    return out;
  } finally {
    await ctx.close();
  }
}

async function graph(pathPart, form) {
  const res = await fetch(`${GRAPH}/${pathPart}`, { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(`Graph ${pathPart}: ${JSON.stringify(body.error || body)}`);
  return body;
}

// Every configured Page with its token. With FB_USER_TOKEN the Page tokens come from
// me/accounts, which never expire when the user token is long-lived.
async function loadPages() {
  const ids = [['FB_PAGE_ID', 'FB_PAGE_TOKEN'], ['FB_PAGE_ID_2', 'FB_PAGE_TOKEN_2']]
    .map(([id, token]) => ({ id: process.env[id], token: process.env[token] }))
    .filter(p => p.id);
  if (process.env.FB_USER_TOKEN) {
    const res = await (await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).json();
    if (res.error) throw new Error(`me/accounts: ${res.error.message}`);
    for (const p of ids) {
      const acct = (res.data || []).find(a => a.id === p.id);
      if (!acct) throw new Error(`Page ${p.id} not found in me/accounts`);
      Object.assign(p, { token: acct.access_token, name: acct.name });
    }
  }
  return ids.filter(p => p.token);
}

let pagesCache;
const pages = async () => (pagesCache = pagesCache || await loadPages());

async function postToPage(page, cardFile, caption, link) {
  const photo = new FormData();
  photo.append('source', new Blob([fs.readFileSync(cardFile)]), path.basename(cardFile));
  // No caption: the card already carries the headline, and the link goes in the first comment.
  if (process.env.FB_CAPTION === '1') photo.append('caption', caption);
  photo.append('access_token', page.token);
  const { post_id: postId, id: photoId } = await graph(`${page.id}/photos`, photo);
  const target = postId || `${page.id}_${photoId}`;

  if (link) {
    const comment = new FormData();
    comment.append('message', link);
    comment.append('access_token', page.token);
    await graph(`${target}/comments`, comment);
  }
  return target;
}

// Story image (1080x1920) in the look of a post shared to a story: a red background with a
// white card holding the Page's logo and name above the 4:5 photocard.
async function composeStory(browser, cardFile, page, outFile) {
  const card = `data:image/png;base64,${fs.readFileSync(cardFile).toString('base64')}`;
  const avatar = `https://graph.facebook.com/${page.id}/picture?width=200&height=200`;
  const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1920px;overflow:hidden;background:linear-gradient(180deg,#a2333c 0%,#922f39 100%);
       font-family:'Helvetica Neue',Helvetica,Arial,'Liberation Sans','Hind Siliguri',sans-serif}
  .card{position:absolute;left:129px;top:356px;width:822px;height:1209px;background:#fff;border-radius:26px;
        overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.28)}
  .head{height:183px;display:flex;align-items:center;padding-left:41px;padding-right:30px;gap:26px}
  .av{width:106px;height:106px;border-radius:50%;border:2px solid #e4e6eb;background:#fff center/cover no-repeat;flex:none}
  .name{font-weight:700;font-size:39px;color:#050505;white-space:nowrap;overflow:hidden}
  .photo{display:block;width:822px;height:1026px}
</style>
<div class="card">
  <div class="head"><div class="av" style="background-image:url('${avatar}')"></div><div class="name" id="n"></div></div>
  <img class="photo" src="${card}">
</div>`;
  const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  try {
    await tab.setContent(html, { waitUntil: 'networkidle' });
    await tab.evaluate(n => { document.getElementById('n').textContent = n; }, page.name || 'Utsab TV');
    await tab.evaluate(() => {
      const n = document.getElementById('n'), room = n.parentElement.clientWidth - 41 - 106 - 26 - 30;
      let size = 39;
      while (n.scrollWidth > room && size > 20) n.style.fontSize = `${--size}px`;
    });
    await tab.evaluate(() => document.fonts.ready);
    await tab.waitForTimeout(500);
    await tab.screenshot({ path: outFile });
    return outFile;
  } finally {
    await tab.close();
  }
}

// Publishes the story image as a Page story: upload unpublished, then create the story.
async function postStory(page, storyFile) {
  const photo = new FormData();
  photo.append('source', new Blob([fs.readFileSync(storyFile)]), path.basename(storyFile));
  photo.append('published', 'false');
  photo.append('access_token', page.token);
  const { id } = await graph(`${page.id}/photos`, photo);
  const story = new FormData();
  story.append('photo_id', id);
  story.append('access_token', page.token);
  return graph(`${page.id}/photo_stories`, story);
}

// Posts to every Page not yet done for this link; `done` lists Page ids already posted,
// so a retry after one Page failed does not post twice on the other.
async function postToFacebook(cardFile, caption, link, done, browser) {
  const targets = await pages();
  if (!targets.length) throw new Error('no FB_PAGE_ID / FB_PAGE_TOKEN set');
  let failed = null;
  for (const page of targets) {
    if (done.includes(page.id)) continue;
    try {
      event(`posted to Page ${page.id}: ${await postToPage(page, cardFile, caption, link)} (${link})`);
      done.push(page.id);
    } catch (e) {
      failed = e;
      event(`Page ${page.id} FAILED: ${e.message}`);
      continue;
    }
    // Story is a one-shot extra: a failure here is logged but never retried or blocks the post.
    if (process.env.STORY === '1') {
      try {
        const file = await composeStory(browser, cardFile, page, cardFile.replace(/\.png$/, `-story-${page.id}.png`));
        event(`story on Page ${page.id}: ${JSON.stringify(await postStory(page, file))}`);
      } catch (e) {
        event(`story on Page ${page.id} FAILED: ${e.message}`);
      }
    }
  }
  if (failed) throw failed;
}

// Read-only check that each Page token works and whether it expires. Never posts.
async function checkPages() {
  const result = { checkedAt: new Date().toISOString(), usingUserToken: !!process.env.FB_USER_TOKEN, pages: [] };
  if (process.env.FB_USER_TOKEN) {
    const dbg = await (await fetch(`${GRAPH}/debug_token?input_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}&access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).json();
    const d = dbg.data || {};
    result.userToken = { valid: d.is_valid, type: d.type, error: dbg.error?.message || d.error?.message,
      expires: d.expires_at === 0 ? 'never' : d.expires_at ? new Date(d.expires_at * 1000).toISOString() : undefined,
      dataAccessExpires: d.data_access_expires_at ? new Date(d.data_access_expires_at * 1000).toISOString() : undefined };
  }
  let list = [];
  try { list = await pages(); } catch (e) { result.error = e.message; }
  for (const [n, page] of list.entries()) {
    const entry = { slot: n + 1, id: page.id };
    try {
      const me = await (await fetch(`${GRAPH}/${page.id}?fields=name&access_token=${encodeURIComponent(page.token)}`)).json();
      const dbg = await (await fetch(`${GRAPH}/debug_token?input_token=${encodeURIComponent(page.token)}&access_token=${encodeURIComponent(page.token)}`)).json();
      const d = dbg.data || {};
      Object.assign(entry, {
        name: me.name, error: me.error?.message || dbg.error?.message, type: d.type, valid: d.is_valid,
        expires: d.expires_at === 0 ? 'never' : d.expires_at ? new Date(d.expires_at * 1000).toISOString() : undefined,
        scopes: d.scopes
      });
    } catch (e) {
      entry.error = e.message;
    }
    result.pages.push(entry);
  }
  result.configured = result.pages.length;
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(path.join(path.dirname(STATE_FILE), 'check.json'), JSON.stringify(result, null, 2));
  log(JSON.stringify(result));
}

// Makes a card for one link at the given ratio into ./preview. Posts nothing, touches no state.
async function demoCard() {
  const link = process.env.DEMO_LINK, ratio = process.env.DEMO_RATIO || '9:16';
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const preview = path.join(__dirname, 'preview');
    fs.mkdirSync(preview, { recursive: true });
    const slug = link.split('/').pop();
    const out = [];
    if (ratio === 'story') {
      // Story look: 4:5 card inside the shared-post frame, once per Page.
      const card = await makeCard(browser, link, path.join(OUT_DIR, `demo-card-${slug}`), '4:5');
      for (const page of [{ id: '872606492607357', name: 'Utsab TV' }, { id: '1276101408920358', name: 'Utsab TV Digital - উৎসব TV' }]) {
        out.push(await composeStory(browser, card, page, path.join(OUT_DIR, `demo-story-${page.id}-${slug}.png`)));
      }
    } else {
      out.push(await makeCard(browser, link, path.join(OUT_DIR, `demo-${ratio.replace(':', 'x')}-${slug}`), ratio));
    }
    for (const f of out) { fs.copyFileSync(f, path.join(preview, path.basename(f))); log('demo card:', f); }
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------- daily weather
// WEATHER=1: every morning, one card per division (Weather template of the card site),
// posted to every Page (plus story) WEATHER_GAP_MIN minutes apart, starting at WEATHER_HOUR Dhaka time.
// One division per run; progress lives in state/weather.json.
const WEATHER_FILE = path.join(__dirname, 'state', 'weather.json');
const WEATHER_HOUR = Number(process.env.WEATHER_HOUR || 7);
const WEATHER_GAP_MIN = Number(process.env.WEATHER_GAP_MIN || 4);
const DIVISIONS = [
  { name: 'ঢাকা', lat: 23.81, lon: 90.41 }, { name: 'চট্টগ্রাম', lat: 22.34, lon: 91.83 },
  { name: 'রাজশাহী', lat: 24.37, lon: 88.60 }, { name: 'খুলনা', lat: 22.82, lon: 89.55 },
  { name: 'বরিশাল', lat: 22.70, lon: 90.37 }, { name: 'সিলেট', lat: 24.90, lon: 91.87 },
  { name: 'রংপুর', lat: 25.74, lon: 89.25 }, { name: 'ময়মনসিংহ', lat: 24.75, lon: 90.40 },
];
const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
// WMO weather code -> Bengali text and the sky look used for the card background.
function skyOf(code) {
  if (code === 0) return { text: 'পরিষ্কার আকাশ', sky: 'sun' };
  if (code <= 2) return { text: 'আংশিক মেঘলা আকাশ', sky: 'part' };
  if (code === 3) return { text: 'মেঘলা আকাশ', sky: 'cloud' };
  if (code <= 48) return { text: 'কুয়াশাচ্ছন্ন আকাশ', sky: 'fog' };
  if (code <= 57) return { text: 'গুঁড়ি গুঁড়ি বৃষ্টি', sky: 'rain' };
  if (code <= 67) return { text: 'বৃষ্টির সম্ভাবনা', sky: 'rain' };
  if (code <= 82) return { text: 'থেমে থেমে বৃষ্টি', sky: 'rain' };
  return { text: 'বজ্রসহ বৃষ্টির সম্ভাবনা', sky: 'storm' };
}
const SKIES = {
  sun: ['#1f78d1', '#7cc3f4', '#f7d56b'], part: ['#3a7fc0', '#9cc6e6', '#e9eef2'], cloud: ['#59718a', '#9aaab9', '#cfd6dc'],
  fog: ['#7d8b97', '#b8c1c8', '#e3e7ea'], rain: ['#24384f', '#4a647d', '#8497a8'], storm: ['#1b1f33', '#3b3f63', '#6a6f94'],
};
async function weatherFor(d) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${d.lat}&longitude=${d.lon}&current=temperature_2m`
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FDhaka&forecast_days=1';
  const j = JSON.parse(await getText(url));
  const code = j.daily.weather_code[0], rain = j.daily.precipitation_probability_max[0];
  const sky = skyOf(code);
  return {
    temp: `${bn(Math.round(j.current.temperature_2m))}°`, condition: sky.text, city: d.name, sky: sky.sky,
    note: `সর্বোচ্চ ${bn(Math.round(j.daily.temperature_2m_max[0]))}° · সর্বনিম্ন ${bn(Math.round(j.daily.temperature_2m_min[0]))}°`
      + (rain != null ? ` · বৃষ্টির সম্ভাবনা ${bn(rain)}%` : ''),
  };
}
// Sky photo for the card background (the Weather template wants a photo).
async function skyPhoto(browser, sky, file) {
  const [a, b, c] = SKIES[sky];
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.setContent(`<body style="margin:0;width:1080px;height:1350px;background:
    radial-gradient(circle at 78% 18%, ${c} 0, transparent 38%),
    radial-gradient(ellipse at 20% 30%, rgba(255,255,255,.35) 0, transparent 40%),
    radial-gradient(ellipse at 60% 45%, rgba(255,255,255,.22) 0, transparent 45%),
    linear-gradient(180deg, ${a} 0%, ${b} 70%, ${c} 100%)"></body>`);
  await pg.screenshot({ path: file });
  await pg.close();
  return file;
}
async function makeWeatherCard(browser, w, file) {
  const photo = await skyPhoto(browser, w.sky, `${file}-sky.png`);
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1000 }, userAgent: UA });
  const page = await ctx.newPage();
  try {
    await page.goto(CARD_SITE, { waitUntil: 'networkidle', timeout: 60000 });
    await page.click('#templateGrid [data-template="weather"]');
    await page.click('#ratioSelector [data-ratio="4:5"]');
    await page.setInputFiles('#imageInput', photo);
    for (const f of ['temp', 'condition', 'city', 'note']) await page.fill(`#dynamicContent [data-field="${f}"]`, w[f]);
    await page.waitForTimeout(2000);
    // Logo like the news cards: bigger, right edge at x=1027 and top at y=56 of the 1080x1350 card.
    await page.evaluate(([k, dx, dy]) => {
      const el = document.querySelector('#renderTarget .card-logo');
      if (!el) return;
      el.style.transformOrigin = 'top right';
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${k})`;
    }, [Number(process.env.WLOGO_SCALE || 1.27), Number(process.env.WLOGO_DX || -13), Number(process.env.WLOGO_DY || 20)]);
    await page.waitForTimeout(500);
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#downloadBtn')]);
    const out = file + (path.extname(download.suggestedFilename()) || '.png');
    await download.saveAs(out);
    return out;
  } finally {
    await ctx.close();
  }
}
const dhakaNow = () => new Date(Date.now() + 6 * 3600e3);

async function weatherTick() {
  if (process.env.WEATHER !== '1') return;
  const now = dhakaNow(), today = now.toISOString().slice(0, 10);
  let st = {};
  try { st = JSON.parse(fs.readFileSync(WEATHER_FILE, 'utf8')); } catch {}
  if (st.date !== today) st = { date: today, done: [], pages: {}, tries: {}, lastAt: 0 };
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), WEATHER_HOUR) - 6 * 3600e3;
  if (now.getUTCHours() >= 12 || Date.now() < Math.max(start, st.lastAt + WEATHER_GAP_MIN * 60e3)) return;
  const d = DIVISIONS.find(x => !st.done.includes(x.name));
  if (!d) return;
  const save = () => { fs.mkdirSync(path.dirname(WEATHER_FILE), { recursive: true }); fs.writeFileSync(WEATHER_FILE, JSON.stringify(st, null, 2)); };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const w = await weatherFor(d);
    const card = await makeWeatherCard(browser, w, path.join(OUT_DIR, `weather-${today}-${d.lat}`));
    log('weather card:', d.name, JSON.stringify(w));
    if (DRY_RUN) {
      const preview = path.join(__dirname, 'preview');
      fs.mkdirSync(preview, { recursive: true });
      fs.copyFileSync(card, path.join(preview, path.basename(card)));
    } else {
      const done = st.pages[d.name] = st.pages[d.name] || [];
      try { await postToFacebook(card, '', '', done, browser); } finally { save(); }
    }
    st.done.push(d.name);
  } catch (e) {
    // A division that keeps failing is skipped after 3 tries so the others still go out.
    st.tries[d.name] = (st.tries[d.name] || 0) + 1;
    event(`weather ${d.name} FAILED (try ${st.tries[d.name]}): ${e.message}`);
    if (st.tries[d.name] >= 3) st.done.push(d.name);
  } finally {
    st.lastAt = Date.now();
    save();
    await browser.close();
  }
}

// One weather card for DEMO_WEATHER (a division name) into ./preview. Posts nothing, touches no state.
async function weatherDemo() {
  const d = DIVISIONS.find(x => x.name === process.env.DEMO_WEATHER) || DIVISIONS[0];
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const preview = path.join(__dirname, 'preview');
    fs.mkdirSync(preview, { recursive: true });
    const w = await weatherFor(d);
    log('weather demo:', JSON.stringify(w));
    const card = await makeWeatherCard(browser, w, path.join(OUT_DIR, `weather-demo-${d.lat}`));
    fs.copyFileSync(card, path.join(preview, `weather-demo-${d.lat}.png`));
    const page = { id: '872606492607357', name: 'Utsab TV' };
    await composeStory(browser, card, page, path.join(preview, `weather-demo-story-${d.lat}.png`));
  } finally {
    await browser.close();
  }
}

// ------------------------------------------------------------------ daily top-10 reel
// REEL_RUN=1: at night, take today's 10 most-read news ("N বার পড়া হয়েছে" on each article page),
// make their cards, turn them into a 9:16 video and post it as a Reel to every Page.
// DEMO_REEL=1 only builds the video into ./preview. State: state/reel.json (one reel per day).
const REEL_FILE = path.join(__dirname, 'state', 'reel.json');
const REEL_SLIDE_SEC = Number(process.env.REEL_SLIDE_SEC || 5);
const toAscii = s => String(s).replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/,/g, '');
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

// Title, publish day (Dhaka, YYYY-MM-DD) and read count of one article page.
async function readInfo(url) {
  const html = await getText(url);
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const reads = text.match(/([\d০-৯,]+)\s*বার পড়া হয়েছে/);
  let day = '';
  const iso = meta(html, 'article:published_time');
  if (iso) day = new Date(new Date(iso).getTime() + 6 * 3600e3).toISOString().slice(0, 10);
  else {
    const d = text.match(/(\d{1,2})\s+([A-Z][a-z]{2}),?\s+(\d{4})/);
    if (d && d[2] in MONTHS) day = new Date(Date.UTC(+d[3], MONTHS[d[2]], +d[1])).toISOString().slice(0, 10);
  }
  return { url, title: meta(html, 'og:title'), image: meta(html, 'og:image'), day, reads: reads ? Number(toAscii(reads[1])) : 0 };
}

async function topToday(n = 10) {
  const today = dhakaNow().toISOString().slice(0, 10);
  const seen = (loadState() || { seen: [] }).seen.slice(-120);
  const urls = [...new Set([...(await homepageLinks()), ...seen])];
  const items = [];
  for (let i = 0; i < urls.length; i += 8) {
    const batch = await Promise.all(urls.slice(i, i + 8).map(u => readInfo(u).catch(() => null)));
    items.push(...batch.filter(Boolean));
  }
  const todays = items.filter(x => x.day === today && /\/storage\/posts\//.test(x.image));
  log(`reel: ${items.length} pages read, ${todays.length} from today`);
  return todays.sort((a, b) => b.reads - a.reads).slice(0, n);
}

// The channel logo as a data URL, taken from the card site (the same file the cards use).
async function channelLogo(browser) {
  const pg = await browser.newPage();
  try {
    await pg.goto(CARD_SITE, { waitUntil: 'networkidle', timeout: 60000 });
    return await pg.evaluate(async () => {
      const img = document.querySelector('#renderTarget .card-logo-img, #renderTarget .utsab-channel-logo img, #renderTarget img[alt*="ogo"]');
      if (!img) return '';
      const blob = await (await fetch(img.src)).blob();
      return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
    });
  } catch (e) { log('logo not found:', e.message); return ''; } finally { await pg.close(); }
}

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const bnDate = d => `${bn(d.getUTCDate())} ${BN_MONTHS[d.getUTCMonth()]} ${bn(d.getUTCFullYear())}`;

// One 1080x1920 slide in the logo's colours (green #12873d, red #c8202f, white).
// With a card: green header with logo and rank, the 4:5 card, red footer with the site.
// Without a card: the intro (kind 'intro') or closing (kind 'end') title slide.
async function reelSlide(browser, cardFile, rank, total, outFile, logo = '', kind = 'intro') {
  const card = cardFile ? `data:image/png;base64,${fs.readFileSync(cardFile).toString('base64')}` : '';
  const logoImg = logo ? `<img class="logo" src="${logo}">` : `<div class="logo txt">উৎসব TV</div>`;
  const body = cardFile ? `
<div class="hdr">${logoImg}<div class="htxt"><div class="h1">আজকের শীর্ষ সংবাদ</div><div class="h2">${bnDate(dhakaNow())}</div></div>
  <div class="rank"><b>${bn(rank)}</b><span>/${bn(total)}</span></div></div>
<div class="cardwrap"><img src="${card}"></div>
<div class="ftr"><span class="lbl">বিস্তারিত পড়ুন</span><span class="pill">www.utsabtv.com</span></div>`
    : `
<div class="split"></div>
<div class="panel">${logoImg.replace('class="logo', 'class="logo big')}
  ${kind === 'end'
    ? `<div class="t1 s">সব খবর সবার আগে</div><div class="t2">পড়ুন <b>www.utsabtv.com</b></div><div class="date">ফলো করুন উৎসব টিভি</div>`
    : `<div class="t1">আজকের শীর্ষ ${bn(total)}</div><div class="t2">সংবাদ</div><div class="date">${bnDate(dhakaNow())}</div>`}
</div>`;
  const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@600;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}
:root{--g:#12873d;--g2:#0b5e2a;--r:#c8202f;--r2:#931624}
body{width:1080px;height:1920px;overflow:hidden;font-family:'Noto Sans Bengali',sans-serif;position:relative;
  background:#f3f5f2;background-image:repeating-linear-gradient(135deg,rgba(18,135,61,.05) 0 26px,transparent 26px 52px)}
.logo{height:118px;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.25);background:#fff}
.logo.txt{display:flex;align-items:center;padding:0 24px;font-size:56px;font-weight:800;color:var(--r)}
.hdr{position:absolute;left:0;right:0;top:0;height:300px;background:linear-gradient(135deg,var(--g) 0%,var(--g2) 100%);
  display:flex;align-items:center;padding:60px 56px 0;gap:30px;border-bottom:12px solid var(--r)}
.htxt{flex:1;color:#fff}.h1{font-size:56px;font-weight:800;line-height:1.15;white-space:nowrap}.h2{font-size:38px;font-weight:600;opacity:.92;margin-top:6px}
.rank{background:var(--r);color:#fff;border:6px solid #fff;border-radius:28px;padding:6px 26px;display:flex;align-items:baseline;box-shadow:0 8px 20px rgba(0,0,0,.3)}
.rank b{font-size:104px;font-weight:800;line-height:1.1}.rank span{font-size:44px;font-weight:700;opacity:.9}
.cardwrap{position:absolute;left:60px;top:370px;width:960px;height:1200px;border-radius:24px;overflow:hidden;border:8px solid #fff;
  box-shadow:0 22px 50px rgba(0,0,0,.28)}
.cardwrap img{width:100%;height:100%;object-fit:cover;display:block}
.ftr{position:absolute;left:0;right:0;bottom:0;height:270px;background:linear-gradient(135deg,var(--r) 0%,var(--r2) 100%);
  border-top:12px solid var(--g);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding-bottom:40px}
.lbl{color:#fff;font-size:44px;font-weight:700}
.pill{background:#fff;color:var(--g2);font-size:58px;font-weight:800;padding:8px 48px;border-radius:70px}
.split{position:absolute;inset:0;background:linear-gradient(160deg,var(--g) 0%,var(--g2) 48%,var(--r) 48.2%,var(--r2) 100%)}
.panel{position:absolute;left:90px;right:90px;top:520px;height:880px;background:#fff;border-radius:40px;box-shadow:0 30px 70px rgba(0,0,0,.35);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;border-bottom:16px solid var(--r);border-top:16px solid var(--g)}
.logo.big{height:190px;margin-bottom:40px}
.t1{font-size:110px;font-weight:800;color:var(--g2);line-height:1.2}
.t1.s{font-size:84px}
.t2{font-size:84px;font-weight:800;color:var(--r);line-height:1.2}.t2 b{color:var(--g2);font-size:66px}
.date{margin-top:40px;background:var(--r);color:#fff;font-size:52px;font-weight:700;padding:10px 46px;border-radius:60px}
</style>${body}`;
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(html, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: outFile });
  await pg.close();
  return outFile;
}

// Slides -> one 9:16 video: slow zoom on each slide, a different xfade transition between slides,
// a whoosh at every transition and the Page's music underneath (assets/reel-music.mp3).
const MUSIC_FILE = path.join(__dirname, 'assets', 'reel-music.mp3');
const TRANSITION_FILE = path.join(__dirname, 'assets', 'transition.mp3');
const TRANSITIONS = ['slideleft', 'circleopen', 'zoomin', 'wipeleft', 'pixelize', 'radial', 'smoothup', 'diagtl', 'squeezeh', 'slideup', 'fadewhite'];
const XFADE = 0.5;
function buildVideo(slides, outFile) {
  const { execFileSync } = require('child_process');
  const ff = args => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
  // Clips are XFADE longer than their slot so the transition overlaps the start of the next slide.
  const clips = slides.map(sl => {
    const clip = `${sl.file}.mp4`, secs = sl.sec + XFADE;
    // Still frames: zoompan shook the picture, so motion comes only from the transitions.
    ff(['-loop', '1', '-framerate', '30', '-i', sl.file, '-vf', 'scale=1080:1920,format=yuv420p',
      '-t', String(secs), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-an', clip]);
    return clip;
  });
  const whoosh = `${outFile}-whoosh.wav`;
  // The Page's own transition sound (assets/transition.mp3); its first 0.45 s are silence, trimmed so it hits with the cut.
  if (fs.existsSync(TRANSITION_FILE)) ff(['-i', TRANSITION_FILE, '-af', 'atrim=start=0.45,asetpts=PTS-STARTPTS', '-ar', '48000', '-ac', '2', whoosh]);
  else ff(['-f', 'lavfi', '-i', 'aevalsrc=0.5*sin(2*PI*(250*t+2600*t*t))*exp(-3*t)+0.25*random(0)*exp(-4*t):d=0.6:s=48000',
    '-af', 'afade=t=in:d=0.05,lowpass=f=7000', whoosh]);
  const offsets = [];
  let acc = 0;
  for (let k = 0; k < slides.length - 1; k++) { acc += slides[k].sec; offsets.push(acc); }
  const total = acc + slides[slides.length - 1].sec + XFADE;
  const v = [];
  let last = '[0:v]';
  offsets.forEach((o, k) => {
    v.push(`${last}[${k + 1}:v]xfade=transition=${TRANSITIONS[k % TRANSITIONS.length]}:duration=${XFADE}:offset=${o}[v${k + 1}]`);
    last = `[v${k + 1}]`;
  });
  const n = clips.length, hasMusic = fs.existsSync(MUSIC_FILE), K = offsets.length;
  const a = [`[${n + 1}:a]asplit=${K}${offsets.map((_, k) => `[w${k}]`).join('')}`];
  offsets.forEach((o, k) => a.push(`[w${k}]adelay=${Math.round(o * 1000)}|${Math.round(o * 1000)},volume=0.9[d${k}]`));
  const mix = offsets.map((_, k) => `[d${k}]`).join('');
  if (hasMusic) {
    a.push(`[${n}:a]atrim=0:${total},afade=t=in:d=1,afade=t=out:st=${total - 2}:d=2,volume=0.55[m]`);
    a.push(`[m]${mix}amix=inputs=${K + 1}:normalize=0:duration=first[aout]`);
  } else {
    a.push(`${mix}amix=inputs=${K}:normalize=0[aout]`);
  }
  const inputs = [...clips.flatMap(c => ['-i', c]), ...(hasMusic ? ['-i', MUSIC_FILE] : []), '-i', whoosh];
  // With no music the whoosh input sits at index n, so shift the label used above.
  const fc = [...v, ...a.map(x => hasMusic ? x : x.replace(`[${n + 1}:a]`, `[${n}:a]`))].join(';');
  ff([...inputs, '-filter_complex', fc, '-map', last, '-map', '[aout]', '-t', String(total),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outFile]);
  return outFile;
}

async function postReel(page, videoFile) {
  const size = fs.statSync(videoFile).size;
  const start = new FormData();
  start.append('upload_phase', 'start'); start.append('access_token', page.token);
  const { video_id: id, upload_url: uploadUrl } = await graph(`${page.id}/video_reels`, start);
  const up = await fetch(uploadUrl || `https://rupload.facebook.com/video-upload/${process.env.GRAPH_VERSION || 'v26.0'}/${id}`, {
    method: 'POST', headers: { Authorization: `OAuth ${page.token}`, offset: '0', file_size: String(size) }, body: fs.readFileSync(videoFile),
  });
  const upBody = await up.json().catch(() => ({}));
  if (!up.ok || upBody.success === false) throw new Error(`reel upload: ${JSON.stringify(upBody)}`);
  const fin = new FormData();
  fin.append('upload_phase', 'finish'); fin.append('video_id', id); fin.append('video_state', 'PUBLISHED');
  fin.append('description', process.env.REEL_DESCRIPTION || 'আজকের শীর্ষ ১০ সংবাদ'); fin.append('access_token', page.token);
  return graph(`${page.id}/video_reels`, fin);
}

async function reelRun() {
  const demo = process.env.DEMO_REEL === '1';
  const today = dhakaNow().toISOString().slice(0, 10);
  let st = {};
  try { st = JSON.parse(fs.readFileSync(REEL_FILE, 'utf8')); } catch {}
  if (st.date !== today) st = { date: today, done: [] };
  if (!demo && (process.env.DRY_RUN !== '0' || dhakaNow().getUTCHours() < Number(process.env.REEL_HOUR || 22))) return log('reel: not yet time / dry run');
  const targets = demo ? [] : (await pages()).filter(p => !st.done.includes(p.id));
  if (!demo && !targets.length) return log('reel: already posted today');
  const top = await topToday(10);
  if (top.length < 3) return event(`reel: only ${top.length} news today, skipped`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const logo = await channelLogo(browser);
    const slides = [{ file: await reelSlide(browser, null, 0, top.length, path.join(OUT_DIR, 'reel-0.png'), logo, 'intro'), sec: 2.5 }];
    for (const [i, it] of top.entries()) {
      const card = await makeCard(browser, it.url, path.join(OUT_DIR, `reel-card-${i + 1}`));
      slides.push({ file: await reelSlide(browser, card, i + 1, top.length, path.join(OUT_DIR, `reel-${i + 1}.png`), logo), sec: REEL_SLIDE_SEC });
    }
    slides.push({ file: await reelSlide(browser, null, 0, top.length, path.join(OUT_DIR, 'reel-end.png'), logo, 'end'), sec: 3 });
    const video = buildVideo(slides, path.join(OUT_DIR, `top10-${today}.mp4`));
    log('reel video:', video, fs.statSync(video).size, 'bytes;', top.map(t => `${t.reads}:${t.url}`).join(' | '));
    if (demo) {
      const preview = path.join(__dirname, 'preview');
      fs.mkdirSync(preview, { recursive: true });
      fs.copyFileSync(video, path.join(preview, 'reel-demo.mp4'));
      return;
    }
    for (const page of targets) {
      try {
        event(`reel on Page ${page.id}: ${JSON.stringify(await postReel(page, video))}`);
        st.done.push(page.id);
      } catch (e) { event(`reel on Page ${page.id} FAILED: ${e.message}`); }
      fs.mkdirSync(path.dirname(REEL_FILE), { recursive: true });
      fs.writeFileSync(REEL_FILE, JSON.stringify(st, null, 2));
    }
  } finally {
    await browser.close();
  }
}

(async () => {
  if (process.env.DEMO_REEL === '1' || process.env.REEL_RUN === '1') return reelRun().catch(e => { event(`reel FAILED: ${e.stack || e.message}`); process.exit(1); });
  if (process.env.DEMO_WEATHER) return weatherDemo();
  if (process.env.DEMO_LINK) return demoCard();
  if (process.env.CHECK === '1') return checkPages();
  await weatherTick().catch(e => event(`weather FAILED: ${e.message}`));
  const links = await homepageLinks();
  log(`homepage: ${links.length} candidate links`);
  let state = loadState();
  if (!state) {
    // First run: remember what is already published so old news is not posted again.
    saveState({ seen: links });
    log('first run: saved current links as already seen, nothing posted');
    return;
  }

  const fresh = links.filter(l => !state.seen.includes(l)).reverse(); // oldest new item first
  if (!fresh.length) return log('no new news');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  let posted = 0;
  try {
    for (const link of fresh) {
      if (posted >= MAX_PER_RUN) break;
      const info = await articleInfo(link).catch(e => (log('skip', link, e.message), null));
      if (info && info.isArticle && !/\/storage\/posts\//.test(info.image)) {
        // A news page whose photo has not been added yet: wait for it (up to 3 hours) instead of skipping it.
        state.noPhoto = state.noPhoto || {};
        const since = state.noPhoto[link] = state.noPhoto[link] || Date.now();
        if (Date.now() - since < 3 * 3600e3) { log('news has no photo yet, will retry:', link); saveState(state); continue; }
        delete state.noPhoto[link];
      }
      if (!info || !/\/storage\/posts\//.test(info.image)) {
        log('not a news page, ignoring:', link);
        state.seen.push(link); saveState(state);
        continue;
      }
      log('new news:', info.title, link);
      try {
        const card = await makeCard(browser, link, path.join(OUT_DIR, link.split('/').pop()));
        log('card saved:', card);
        if (DRY_RUN) {
          log('DRY_RUN: not posting');
          // Keep the card in the repo so it can be checked on GitHub before going live.
          const preview = path.join(__dirname, 'preview');
          fs.mkdirSync(preview, { recursive: true });
          fs.copyFileSync(card, path.join(preview, path.basename(card)));
        } else {
          state.posted = state.posted || {};
          const done = state.posted[link] = state.posted[link] || [];
          try {
            await postToFacebook(card, info.title, link, done, browser);
          } finally {
            saveState(state);
          }
          delete state.posted[link];
        }
        if (state.noPhoto) delete state.noPhoto[link];
        state.seen.push(link); saveState(state);
        posted++;
      } catch (e) {
        // Leave it unseen so the next run retries it.
        log('FAILED', link, e.message);
      }
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
