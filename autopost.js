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
//   PRAYER=1                       prayer schedule + reminder cards for the 8 divisions (see prayerTick)
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
      // Latest stories as Facebook lists them, to see whether posted stories are live.
      const sto = await (await fetch(`${GRAPH}/${page.id}/stories?fields=post_id,status,creation_time,media_type,url&limit=25&access_token=${encodeURIComponent(page.token)}`)).json();
      entry.stories = sto.error ? sto.error.message : sto.data;
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
    st.data = st.data || {};
    st.data[d.name] = w;
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


// ------------------------------------------------------------------ prayer times
// PRAYER=1: before Fajr, one schedule card per division (PRAYER_GAP_MIN apart, starting PRAYER_LEAD_MIN before
// Dhaka's Fajr); then 30 minutes before each prayer, one reminder card with that prayer's time in every division.
// Times are calculated here (no web service). State: state/prayer.json.
// Prayer times (Karachi method: Fajr/Isha 18°, Hanafi Asr), PrayTimes.org formulas.
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
function sunPos(jd) {
  const D = jd - 2451545.0, g = (357.529 + 0.98560028 * D) % 360, q = (280.459 + 0.98564736 * D) % 360;
  const L = (q + 1.915 * Math.sin(rad(g)) + 0.020 * Math.sin(rad(2 * g))) % 360, e = 23.439 - 0.00000036 * D;
  const RA = deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15;
  const eqt = q / 15 - ((RA % 24) + 24) % 24;
  return { decl: deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L)))), eqt: ((eqt + 12) % 24 + 24) % 24 - 12 };
}
function prayerTimes(y, m, d, lat, lng, tz = 6) {
  const jd0 = Date.UTC(y, m - 1, d) / 864e5 + 2440587.5 - lng / 360;
  const at = h => sunPos(jd0 + h / 24);
  const noon = h => 12 - at(h).eqt;
  const angleTime = (angle, h, ccw) => {
    const { decl } = at(h);
    const T = deg(Math.acos((-Math.sin(rad(angle)) - Math.sin(rad(decl)) * Math.sin(rad(lat))) / (Math.cos(rad(decl)) * Math.cos(rad(lat))))) / 15;
    return noon(h) + (ccw ? -T : T);
  };
  const asrAngle = h => { const { decl } = at(h); return -deg(Math.atan(1 / (2 + Math.tan(rad(Math.abs(lat - decl)))))); };
  let t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, maghrib: 18, isha: 18 };
  for (let i = 0; i < 2; i++) {
    t = { fajr: angleTime(18, t.fajr, true), sunrise: angleTime(0.833, t.sunrise, true), dhuhr: noon(t.dhuhr),
      asr: angleTime(asrAngle(t.asr), t.asr, false), maghrib: angleTime(0.833, t.maghrib, false), isha: angleTime(18, t.isha, false) };
  }
  const out = {};
  for (const [k, v] of Object.entries(t)) out[k] = v + tz - lng / 15;
  return out; // hours, local
}

const PRAYER_FILE = path.join(__dirname, 'state', 'prayer.json');
const PRAYERS = [['fajr', 'ফজর'], ['sunrise', 'সূর্যোদয়'], ['dhuhr', 'যোহর'], ['asr', 'আসর'], ['maghrib', 'মাগরিব'], ['isha', 'এশা']];
const BN_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const prayerGen = (k, d) => k === 'dhuhr' && d.getUTCDay() === 5 ? 'জুমার' : { fajr: 'ফজরের', dhuhr: 'যোহরের', asr: 'আসরের', maghrib: 'মাগরিবের', isha: 'এশার' }[k];
const prayerName = (k, d) => k === 'dhuhr' && d.getUTCDay() === 5 ? 'জুমা' : PRAYERS.find(p => p[0] === k)[1];
// 4.73 -> "৪:৪৪" (12-hour clock, as Bangladeshi schedules print it)
const bnTime = h => { const m = Math.round(h * 60), hh = Math.floor(m / 60) % 12 || 12; return `${bn(hh)}:${bn(String(m % 60).padStart(2, '0'))}`; };
const timesFor = (d, now = dhakaNow()) => prayerTimes(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), d.lat, d.lon);

const PRAYER_CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:'Noto Serif Bengali','Noto Serif',serif;font-weight:700;color:#fff;position:relative;
  background:radial-gradient(circle at 50% 0%,#1d9a52 0,#0b5e2a 55%,#063d1b 100%)}
body:before{content:'';position:absolute;inset:0;opacity:.08;background-image:
  radial-gradient(circle at 25px 25px,#fff 2px,transparent 3px),linear-gradient(45deg,transparent 46%,#fff 47%,#fff 53%,transparent 54%);
  background-size:50px 50px,100px 100px}
.hdr{position:relative;display:flex;align-items:center;gap:26px;padding:50px 56px 0}
.logo{height:104px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.logo.txt{display:flex;align-items:center;padding:0 22px;font-size:48px;font-weight:800;color:#c8202f}
.ht{flex:1}.h1{font-size:64px;font-weight:800;line-height:1.1}.h2{font-size:34px;font-weight:700;color:#c8f7d4;margin-top:6px}
.moon{width:110px;height:110px}
.ftr{position:absolute;left:0;right:0;bottom:0;height:110px;background:linear-gradient(135deg,#c8202f,#931624);border-top:8px solid #ffd54f;
  display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:800}`;
const MOON_SVG = `<svg class="moon" viewBox="0 0 100 100"><path d="M62 10a40 40 0 1 0 28 62a32 32 0 1 1-28-62z" fill="#ffd54f"/>
  <path d="M74 22l3 9h9l-7 6 3 9-8-6-8 6 3-9-7-6h9z" fill="#ffd54f"/></svg>`;
async function renderPrayerCard(browser, inner, extraCss, outFile, logo) {
  const logoImg = logo ? `<img class="logo" src="${logo}">` : `<div class="logo txt">উৎসব TV</div>`;
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.setContent(`<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700;800;900&family=Noto+Serif:wght@700;800;900&display=swap" rel="stylesheet">
<style>${PRAYER_CSS}${extraCss}</style>${inner.replace('{LOGO}', logoImg)}`, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: outFile });
  await pg.close();
  return outFile;
}
// Full day for one division.
function prayerScheduleCard(browser, d, outFile, logo) {
  const now = dhakaNow(), t = timesFor(d, now);
  const rows = PRAYERS.map(([k]) => `<div class="row${k === 'sunrise' ? ' dim' : ''}"><span>${prayerName(k, now)}</span><b>${bnTime(t[k])}</b></div>`).join('');
  return renderPrayerCard(browser, `
<div class="hdr">{LOGO}<div class="ht"><div class="h1">নামাজের সময়সূচি</div><div class="h2">${BN_DAYS[now.getUTCDay()]}, ${bnDate(now)}</div></div>${MOON_SVG}</div>
<div class="city">${d.name} ও আশপাশের এলাকা</div>
<div class="tbl">${rows}</div>
<div class="note">সময় আনুমানিক, স্থানীয় মসজিদের সময় ১-২ মিনিট আলাদা হতে পারে</div>
<div class="ftr">www.utsabtv.com</div>`, `
.city{position:relative;margin:34px auto 0;width:max-content;background:#c8202f;border:5px solid #ffd54f;border-radius:60px;padding:6px 48px;font-size:54px;font-weight:800}
.tbl{position:relative;margin:34px 70px 0;display:flex;flex-direction:column;gap:18px}
.row{display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.95);color:#0b5e2a;border-radius:24px;padding:12px 44px;
  font-size:58px;font-weight:800;box-shadow:0 8px 18px rgba(0,0,0,.2)}
.row b{color:#c8202f;font-size:64px}.row.dim{background:rgba(255,255,255,.7);font-size:48px}.row.dim b{font-size:52px;color:#7a5c00}
.note{position:relative;text-align:center;margin-top:24px;font-size:28px;color:#c8f7d4}`, outFile, logo);
}
// One prayer, every division.
function prayerReminderCard(browser, key, outFile, logo) {
  const now = dhakaNow(), gen = prayerGen(key, now);
  const cells = DIVISIONS.map(d => `<div class="cell"><span>${d.name}</span><b>${bnTime(timesFor(d, now)[key])}</b></div>`).join('');
  return renderPrayerCard(browser, `
<div class="hdr">{LOGO}<div class="ht"><div class="h1">${gen} ওয়াক্ত</div><div class="h2">${BN_DAYS[now.getUTCDay()]}, ${bnDate(now)}</div></div>${MOON_SVG}</div>
<div class="big">আর ৩০ মিনিট পর ${gen} ওয়াক্ত শুরু</div>
<div class="grid">${cells}</div>
<div class="call">নামাজের প্রস্তুতি নিন</div>
<div class="ftr">www.utsabtv.com</div>`, `
.call{position:relative;margin:60px auto 0;width:max-content;color:#ffd54f;font-size:60px;font-weight:800;border-top:3px solid rgba(255,213,79,.6);border-bottom:3px solid rgba(255,213,79,.6);padding:10px 40px}
.big{position:relative;margin:40px 60px 0;text-align:center;background:#c8202f;border:5px solid #ffd54f;border-radius:30px;padding:14px 20px;font-size:52px;font-weight:800}
.grid{position:relative;margin:40px 60px 0;display:grid;grid-template-columns:1fr 1fr;gap:22px}
.cell{display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.95);color:#0b5e2a;border-radius:22px;padding:16px 32px;
  font-size:48px;font-weight:800;box-shadow:0 8px 18px rgba(0,0,0,.2)}
.cell b{color:#c8202f;font-size:52px}`, outFile, logo);
}

async function prayerTick() {
  if (process.env.PRAYER !== '1') return;
  const now = dhakaNow(), today = now.toISOString().slice(0, 10);
  const nowH = now.getUTCHours() + now.getUTCMinutes() / 60;
  let st = {};
  try { st = JSON.parse(fs.readFileSync(PRAYER_FILE, 'utf8')); } catch {}
  if (st.date !== today) st = { date: today, sched: [], rem: [], pages: {}, lastAt: 0 };
  const dhaka = timesFor(DIVISIONS[0], now);
  let job = null;
  // Reminders first: they are tied to a time. Due from 30 min before the prayer, given up 20 min later.
  for (const [k] of PRAYERS) {
    if (k === 'sunrise' || st.rem.includes(k)) continue;
    if (nowH >= dhaka[k] - 0.5 && nowH < dhaka[k] - 0.5 + 20 / 60) { job = { key: `rem-${k}`, done: () => st.rem.push(k), make: (b, f, l) => prayerReminderCard(b, k, f, l) }; break; }
  }
  const lead = Number(process.env.PRAYER_LEAD_MIN || 75) / 60, gap = Number(process.env.PRAYER_GAP_MIN || 4) * 60e3;
  if (!job && nowH >= dhaka.fajr - lead && nowH < dhaka.sunrise && Date.now() >= st.lastAt + gap) {
    const d = DIVISIONS.find(x => !st.sched.includes(x.name));
    if (d) job = { key: `sched-${d.name}`, done: () => st.sched.push(d.name), make: (b, f, l) => prayerScheduleCard(b, d, f, l) };
  }
  if (!job) return;
  const save = () => { fs.mkdirSync(path.dirname(PRAYER_FILE), { recursive: true }); fs.writeFileSync(PRAYER_FILE, JSON.stringify(st, null, 2)); };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const card = await job.make(browser, path.join(OUT_DIR, `prayer-${job.key}.png`), await channelLogo(browser));
    const done = st.pages[job.key] = st.pages[job.key] || [];
    try { await postToFacebook(card, '', '', done, browser); job.done(); } finally { st.lastAt = Date.now(); save(); }
  } catch (e) {
    event(`prayer ${job.key} FAILED: ${e.message}`);
    job.done(); // a missed prayer card is not retried: the next one comes soon enough
  } finally {
    save();
    await browser.close();
  }
}

// DEMO_PRAYER=1: one schedule card (Dhaka) and one reminder card (Dhuhr) into ./preview. Posts nothing.
async function prayerDemo() {
  const browser = await chromium.launch();
  try {
    const preview = path.join(__dirname, 'preview');
    fs.mkdirSync(preview, { recursive: true });
    const logo = await channelLogo(browser);
    await prayerScheduleCard(browser, DIVISIONS[0], path.join(preview, 'prayer-demo-schedule.png'), logo);
    await prayerReminderCard(browser, 'dhuhr', path.join(preview, 'prayer-demo-reminder.png'), logo);
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
async function reelSlide(browser, cardFile, rank, total, outFile, logo = '', kind = 'intro', text = {}) {
  const t = { head: 'আজকের শীর্ষ সংবাদ', t1: `আজকের শীর্ষ ${bn(total)}`, t2: 'সংবাদ', lbl: 'বিস্তারিত পড়ুন', ...text };
  const card = cardFile ? `data:image/png;base64,${fs.readFileSync(cardFile).toString('base64')}` : '';
  const logoImg = logo ? `<img class="logo" src="${logo}">` : `<div class="logo txt">উৎসব TV</div>`;
  const body = cardFile ? `
<div class="hdr">${logoImg}<div class="htxt"><div class="h1">${t.head}</div><div class="h2">${bnDate(dhakaNow())}</div></div>
  <div class="rank"><b>${bn(rank)}</b><span>/${bn(total)}</span></div></div>
<div class="cardwrap"><img src="${card}"></div>
<div class="ftr"><span class="lbl">${t.lbl}</span><span class="pill">www.utsabtv.com</span></div>`
    : `
<div class="split"></div>
<div class="panel">${logoImg.replace('class="logo', 'class="logo big')}
  ${kind === 'end'
    ? `<div class="t1 s">সব খবর সবার আগে</div><div class="t2">পড়ুন <b>www.utsabtv.com</b></div><div class="date">ফলো করুন উৎসব টিভি</div>`
    : `<div class="t1${t.small ? ' s' : ''}">${t.t1}</div><div class="t2">${t.t2}</div><div class="date">${bnDate(dhakaNow())}</div>`}
</div>`;
  const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700;800;900&family=Noto+Serif:wght@700;800;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}
:root{--g:#12873d;--g2:#0b5e2a;--r:#c8202f;--r2:#931624}
body{width:1080px;height:1920px;overflow:hidden;font-family:'Noto Serif Bengali','Noto Serif',serif;font-weight:700;position:relative;
  background:#f3f5f2;background-image:repeating-linear-gradient(135deg,rgba(18,135,61,.05) 0 26px,transparent 26px 52px)}
.logo{height:118px;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.25);background:#fff}
.logo.txt{display:flex;align-items:center;padding:0 24px;font-size:56px;font-weight:800;color:var(--r)}
.hdr{position:absolute;left:0;right:0;top:0;height:300px;background:linear-gradient(135deg,var(--g) 0%,var(--g2) 100%);
  display:flex;align-items:center;padding:60px 56px 0;gap:30px;border-bottom:12px solid var(--r)}
.htxt{flex:1;color:#fff}.h1{font-size:56px;font-weight:800;line-height:1.15;white-space:nowrap}.h2{font-size:38px;font-weight:700;opacity:.92;margin-top:6px}
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
// sfx=false: no transition sound; with music=null as well the audio track is silent.
function buildVideo(slides, outFile, music = MUSIC_FILE, sfx = true) {
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
  const n = clips.length, hasMusic = !!music && fs.existsSync(music), K = offsets.length;
  if (!sfx) {
    const aIn = hasMusic ? ['-stream_loop', '-1', '-i', music] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo'];
    const af = hasMusic ? `[${n}:a]atrim=0:${total},afade=t=in:d=1,afade=t=out:st=${total - 2}:d=2,volume=0.55[aout]` : `[${n}:a]atrim=0:${total}[aout]`;
    ff([...clips.flatMap(c => ['-i', c]), ...aIn, '-filter_complex', [...v, af].join(';'), '-map', last, '-map', '[aout]', '-t', String(total),
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outFile]);
    return outFile;
  }
  const a = [`[${n + 1}:a]asplit=${K}${offsets.map((_, k) => `[w${k}]`).join('')}`];
  offsets.forEach((o, k) => a.push(`[w${k}]adelay=${Math.round(o * 1000)}|${Math.round(o * 1000)},volume=0.9[d${k}]`));
  const mix = offsets.map((_, k) => `[d${k}]`).join('');
  if (hasMusic) {
    a.push(`[${n}:a]atrim=0:${total},afade=t=in:d=1,afade=t=out:st=${total - 2}:d=2,volume=0.55[m]`);
    a.push(`[m]${mix}amix=inputs=${K + 1}:normalize=0:duration=first[aout]`);
  } else {
    a.push(`${mix}amix=inputs=${K}:normalize=0[aout]`);
  }
  const inputs = [...clips.flatMap(c => ['-i', c]), ...(hasMusic ? ['-stream_loop', '-1', '-i', music] : []), '-i', whoosh];
  // With no music the whoosh input sits at index n, so shift the label used above.
  const fc = [...v, ...a.map(x => hasMusic ? x : x.replace(`[${n + 1}:a]`, `[${n}:a]`))].join(';');
  ff([...inputs, '-filter_complex', fc, '-map', last, '-map', '[aout]', '-t', String(total),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outFile]);
  return outFile;
}

async function postReel(page, videoFile, description) {
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
  fin.append('description', description || process.env.REEL_DESCRIPTION || 'আজকের শীর্ষ ১০ সংবাদ'); fin.append('access_token', page.token);
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

// Weather Reel slide: sky theme (blue sky, clouds, sun), glass panels, the weather card in the middle.
const SUN_CLOUD_SVG = `<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="sg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff59d"/><stop offset="1" stop-color="#ffb300"/></radialGradient></defs>
  <g stroke="#ffca28" stroke-width="7" stroke-linecap="round">
    ${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a);
      return `<line x1="${120 + 44 * c}" y1="${58 + 44 * sn}" x2="${120 + 60 * c}" y2="${58 + 60 * sn}"/>`; }).join('')}
  </g>
  <circle cx="120" cy="58" r="34" fill="url(#sg)"/>
  <path d="M48 140h92a30 30 0 0 0 0-60a40 40 0 0 0-76 10a26 26 0 0 0-16 50z" fill="#fff" stroke="#e3f2fd" stroke-width="3"/>
</svg>`;
async function weatherSlide(browser, cardFile, rank, total, outFile, logo = '', kind = 'intro') {
  const card = cardFile ? `data:image/png;base64,${fs.readFileSync(cardFile).toString('base64')}` : '';
  const logoImg = logo ? `<img class="logo" src="${logo}">` : `<div class="logo txt">উৎসব TV</div>`;
  const body = cardFile ? `
<div class="top glass">${logoImg}<div class="tt"><div class="h1">আবহাওয়া বার্তা</div><div class="h2">${bnDate(dhakaNow())}</div></div>
  <div class="num">${bn(rank)}<span>/${bn(total)}</span></div></div>
<div class="cardwrap"><img src="${card}"></div>
<div class="bot glass">${SUN_CLOUD_SVG}<span>প্রতিদিনের আবহাওয়া · www.utsabtv.com</span></div>`
    : kind === 'end' ? `
<div class="center">${logoImg.replace('class="logo', 'class="logo big')}
  <div class="icon">${SUN_CLOUD_SVG}</div>
  <div class="big1">নিরাপদে থাকুন</div><div class="big2">আবহাওয়ার খবর প্রতিদিন সকালে</div>
  <div class="pill">www.utsabtv.com</div></div>`
    : `
<div class="center">${logoImg.replace('class="logo', 'class="logo big')}
  <div class="icon">${SUN_CLOUD_SVG}</div>
  <div class="big1">আজকের আবহাওয়া</div><div class="big2">সারাদেশের ${bn(total)} বিভাগ</div>
  <div class="pill">${bnDate(dhakaNow())}</div></div>`;
  const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700;800;900&family=Noto+Serif:wght@700;800;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;font-family:'Noto Serif Bengali','Noto Serif',serif;font-weight:700;color:#fff;position:relative;
  background:radial-gradient(circle at 85% 8%,rgba(255,236,150,.85) 0,rgba(255,236,150,0) 22%),
    linear-gradient(180deg,#0b3d91 0%,#1565c0 35%,#42a5f5 70%,#b3e5fc 100%)}
.cl{position:absolute;background:#fff;border-radius:50%;filter:blur(18px);opacity:.55}
.glass{background:rgba(255,255,255,.16);border:2px solid rgba(255,255,255,.45);backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.18)}
.logo{height:110px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.25)}
.logo.txt{display:flex;align-items:center;padding:0 24px;font-size:52px;font-weight:800;color:#c8202f}
.top{position:absolute;left:50px;right:50px;top:80px;height:200px;border-radius:36px;display:flex;align-items:center;gap:28px;padding:0 36px}
.tt{flex:1}.h1{font-size:62px;font-weight:800;text-shadow:0 3px 10px rgba(0,0,0,.3)}.h2{font-size:38px;font-weight:700;opacity:.95}
.num{font-size:96px;font-weight:800;color:#ffd54f;text-shadow:0 3px 10px rgba(0,0,0,.35)}.num span{font-size:44px;color:#fff}
.cardwrap{position:absolute;left:70px;top:340px;width:940px;height:1175px;border-radius:34px;overflow:hidden;border:8px solid rgba(255,255,255,.85);
  box-shadow:0 26px 60px rgba(4,30,80,.45)}
.cardwrap img{width:100%;height:100%;object-fit:cover;display:block}
.bot{position:absolute;left:50px;right:50px;bottom:120px;height:170px;border-radius:36px;display:flex;align-items:center;justify-content:center;gap:20px;
  color:#0b3d91;background:rgba(255,255,255,.82);font-size:40px;font-weight:800}
.bot svg{width:120px;height:96px}
.center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center}
.logo.big{height:170px;margin-bottom:10px}
.icon svg{width:420px;height:336px;filter:drop-shadow(0 12px 24px rgba(0,0,0,.25))}
.big1{font-size:104px;font-weight:800;line-height:1.15;text-shadow:0 6px 20px rgba(0,0,0,.35)}
.big2{font-size:60px;font-weight:700;text-shadow:0 4px 14px rgba(0,0,0,.3)}
.pill{margin-top:30px;background:#fff;color:#0b3d91;font-size:56px;font-weight:800;padding:12px 56px;border-radius:70px;box-shadow:0 10px 26px rgba(0,0,0,.2)}
</style>
<div class="cl" style="left:-80px;top:260px;width:520px;height:200px"></div>
<div class="cl" style="left:600px;top:520px;width:600px;height:220px"></div>
<div class="cl" style="left:-120px;top:1250px;width:700px;height:260px"></div>
<div class="cl" style="left:520px;top:1500px;width:640px;height:240px"></div>
${body}`;
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(html, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: outFile });
  await pg.close();
  return outFile;
}

// REEL_KIND=weather: WEATHER_REEL_DELAY_MIN minutes after the last morning weather card, one Reel of all
// the divisions' cards (same numbers as the posts, kept in state/weather.json). State: state/reel-weather.json.
const WEATHER_REEL_FILE = path.join(__dirname, 'state', 'reel-weather.json');
async function weatherReelRun() {
  const demo = process.env.DEMO_REEL === '1';
  const today = dhakaNow().toISOString().slice(0, 10);
  let ws = {};
  try { ws = JSON.parse(fs.readFileSync(WEATHER_FILE, 'utf8')); } catch {}
  let st = {};
  try { st = JSON.parse(fs.readFileSync(WEATHER_REEL_FILE, 'utf8')); } catch {}
  if (st.date !== today) st = { date: today, done: [] };
  if (!demo) {
    if (process.env.DRY_RUN !== '0') return log('weather reel: dry run');
    if (ws.date !== today || (ws.done || []).length < DIVISIONS.length) return log('weather reel: morning cards not finished');
    if (Date.now() < ws.lastAt + Number(process.env.WEATHER_REEL_DELAY_MIN || 15) * 60e3) return log('weather reel: not yet time');
  }
  const targets = demo ? [] : (await pages()).filter(p => !st.done.includes(p.id));
  if (!demo && !targets.length) return log('weather reel: already posted today');
  const data = [];
  for (const d of DIVISIONS) data.push((!demo && ws.data && ws.data[d.name]) || await weatherFor(d));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const logo = await channelLogo(browser);
    const slides = [{ file: await weatherSlide(browser, null, 0, data.length, path.join(OUT_DIR, 'wreel-0.png'), logo, 'intro'), sec: 2.5 }];
    for (const [i, w] of data.entries()) {
      const card = await makeWeatherCard(browser, w, path.join(OUT_DIR, `wreel-card-${i + 1}`));
      slides.push({ file: await weatherSlide(browser, card, i + 1, data.length, path.join(OUT_DIR, `wreel-${i + 1}.png`), logo, 'card'),
        sec: Number(process.env.WEATHER_REEL_SLIDE_SEC || 4) });
    }
    slides.push({ file: await weatherSlide(browser, null, 0, data.length, path.join(OUT_DIR, 'wreel-end.png'), logo, 'end'), sec: 3 });
    const video = buildVideo(slides, path.join(OUT_DIR, `weather-${today}.mp4`), path.join(__dirname, 'assets', 'weather-music.mp3'));
    log('weather reel video:', video, fs.statSync(video).size, 'bytes');
    if (demo) {
      const preview = path.join(__dirname, 'preview');
      fs.mkdirSync(preview, { recursive: true });
      fs.copyFileSync(video, path.join(preview, 'weather-reel-demo.mp4'));
      return;
    }
    for (const page of targets) {
      try {
        event(`weather reel on Page ${page.id}: ${JSON.stringify(await postReel(page, video, 'আজকের আবহাওয়া'))}`);
        st.done.push(page.id);
      } catch (e) { event(`weather reel on Page ${page.id} FAILED: ${e.message}`); }
      fs.mkdirSync(path.dirname(WEATHER_REEL_FILE), { recursive: true });
      fs.writeFileSync(WEATHER_REEL_FILE, JSON.stringify(st, null, 2));
    }
  } finally {
    await browser.close();
  }
}

// Prayer Reel slide: deep green with a gold frame, crescent and lantern motifs, the schedule card in the middle.
async function prayerSlide(browser, cardFile, rank, total, outFile, logo = '', kind = 'intro', name = '') {
  const card = cardFile ? `data:image/png;base64,${fs.readFileSync(cardFile).toString('base64')}` : '';
  const logoImg = logo ? `<img class="logo" src="${logo}">` : `<div class="logo txt">উৎসব TV</div>`;
  const now = dhakaNow(), moon = MOON_SVG.replace('class="moon"', 'class="bigmoon"');
  const body = cardFile ? `
<div class="top">${logoImg}<div class="tt"><div class="h1">নামাজের সময়সূচি</div><div class="h2">${name}</div></div>
  <div class="num">${bn(rank)}<span>/${bn(total)}</span></div></div>
<div class="cardwrap"><img src="${card}"></div>
<div class="bot"><span>নামাজ কায়েম করুন</span><span class="pill">www.utsabtv.com</span></div>`
    : kind === 'end' ? `
<div class="center">${logoImg.replace('class="logo', 'class="logo big')}${moon}
  <div class="big1">নামাজ কায়েম করুন</div><div class="big2">প্রতিদিনের নামাজের সময়সূচি পেতে<br>ফলো করুন উৎসব টিভি</div>
  <div class="pill">www.utsabtv.com</div></div>`
    : `
<div class="center">${logoImg.replace('class="logo', 'class="logo big')}${moon}
  <div class="big1">আজকের নামাজের<br>সময়সূচি</div><div class="big2">সারাদেশের ${bn(total)} বিভাগ</div>
  <div class="pill">${BN_DAYS[now.getUTCDay()]}, ${bnDate(now)}</div></div>`;
  const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700;800;900&family=Noto+Serif:wght@700;800;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;font-family:'Noto Serif Bengali','Noto Serif',serif;font-weight:700;color:#fff;position:relative;
  background:radial-gradient(circle at 50% 30%,#1d9a52 0,#0b5e2a 50%,#042a12 100%)}
body:before{content:'';position:absolute;inset:0;opacity:.07;background-image:
  radial-gradient(circle at 30px 30px,#fff 2px,transparent 3px),linear-gradient(45deg,transparent 46%,#fff 47%,#fff 53%,transparent 54%),
  linear-gradient(-45deg,transparent 46%,#fff 47%,#fff 53%,transparent 54%);background-size:60px 60px,120px 120px,120px 120px}
.frame{position:absolute;inset:26px;border:6px solid #ffd54f;border-radius:40px;box-shadow:inset 0 0 0 10px rgba(255,213,79,.18)}
.lamp{position:absolute;top:26px;width:6px;background:#ffd54f}.lamp i{position:absolute;left:-22px;bottom:-60px;width:50px;height:64px;border-radius:12px 12px 24px 24px;
  background:linear-gradient(#ffe082,#ffb300);box-shadow:0 0 40px 12px rgba(255,213,79,.45)}
.logo{height:110px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.logo.txt{display:flex;align-items:center;padding:0 24px;font-size:52px;font-weight:800;color:#c8202f}
.top{position:absolute;left:60px;right:60px;top:90px;height:200px;border-radius:36px;display:flex;align-items:center;gap:28px;padding:0 36px;
  background:rgba(0,0,0,.18);border:3px solid rgba(255,213,79,.6)}
.tt{flex:1}.h1{font-size:60px;font-weight:800}.h2{font-size:44px;font-weight:700;color:#ffd54f}
.num{font-size:96px;font-weight:800;color:#ffd54f}.num span{font-size:44px;color:#fff}
.cardwrap{position:absolute;left:80px;top:340px;width:920px;height:1150px;border-radius:30px;overflow:hidden;border:8px solid #ffd54f;
  box-shadow:0 26px 60px rgba(0,0,0,.5)}
.cardwrap img{width:100%;height:100%;object-fit:cover;display:block}
.bot{position:absolute;left:60px;right:60px;bottom:110px;height:250px;border-radius:36px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
  background:linear-gradient(135deg,#c8202f,#931624);border:4px solid #ffd54f;font-size:48px;font-weight:800}
.pill{background:#fff;color:#0b5e2a;font-size:56px;font-weight:800;padding:8px 52px;border-radius:70px;box-shadow:0 10px 26px rgba(0,0,0,.25)}
.center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center}
.logo.big{height:170px;margin-bottom:10px}
.bigmoon{width:300px;height:300px;filter:drop-shadow(0 0 40px rgba(255,213,79,.55))}
.big1{font-size:100px;font-weight:800;line-height:1.2;text-shadow:0 6px 20px rgba(0,0,0,.35)}
.big2{font-size:54px;font-weight:700;color:#c8f7d4;line-height:1.35}
.center .pill{margin-top:30px;background:#c8202f;color:#fff;border:5px solid #ffd54f}
</style>
<div class="frame"></div>
<div class="lamp" style="left:180px;height:${cardFile ? 0 : 160}px">${cardFile ? '' : '<i></i>'}</div>
<div class="lamp" style="right:180px;height:${cardFile ? 0 : 240}px">${cardFile ? '' : '<i></i>'}</div>
${body}`;
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(html, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: outFile });
  await pg.close();
  return outFile;
}

// REEL_KIND=prayer: PRAYER_REEL_DELAY_MIN minutes after the 8th division schedule card, one Reel of those cards.
// No music or transition sound (religious content) unless assets/prayer-music.mp3 exists. State: state/reel-prayer.json.
const PRAYER_REEL_FILE = path.join(__dirname, 'state', 'reel-prayer.json');
async function prayerReelRun() {
  const demo = process.env.DEMO_REEL === '1';
  const today = dhakaNow().toISOString().slice(0, 10);
  let ps = {};
  try { ps = JSON.parse(fs.readFileSync(PRAYER_FILE, 'utf8')); } catch {}
  let st = {};
  try { st = JSON.parse(fs.readFileSync(PRAYER_REEL_FILE, 'utf8')); } catch {}
  if (st.date !== today) st = { date: today, done: [] };
  if (!demo) {
    if (process.env.DRY_RUN !== '0') return log('prayer reel: dry run');
    if (ps.date !== today || (ps.sched || []).length < DIVISIONS.length) return log('prayer reel: schedule cards not finished');
    if (Date.now() < ps.lastAt + Number(process.env.PRAYER_REEL_DELAY_MIN || 5) * 60e3) return log('prayer reel: not yet time');
  }
  const targets = demo ? [] : (await pages()).filter(p => !st.done.includes(p.id));
  if (!demo && !targets.length) return log('prayer reel: already posted today');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const logo = await channelLogo(browser), N = DIVISIONS.length;
    const slides = [{ file: await prayerSlide(browser, null, 0, N, path.join(OUT_DIR, 'preel-0.png'), logo, 'intro'), sec: 3 }];
    for (const [i, d] of DIVISIONS.entries()) {
      const card = await prayerScheduleCard(browser, d, path.join(OUT_DIR, `preel-card-${i + 1}.png`), logo);
      slides.push({ file: await prayerSlide(browser, card, i + 1, N, path.join(OUT_DIR, `preel-${i + 1}.png`), logo, 'card', `${d.name} বিভাগ`),
        sec: Number(process.env.PRAYER_REEL_SLIDE_SEC || 4) });
    }
    slides.push({ file: await prayerSlide(browser, null, 0, N, path.join(OUT_DIR, 'preel-end.png'), logo, 'end'), sec: 3 });
    const music = path.join(__dirname, 'assets', 'prayer-music.mp3');
    const video = buildVideo(slides, path.join(OUT_DIR, `prayer-${today}.mp4`), fs.existsSync(music) ? music : null, false);
    log('prayer reel video:', video, fs.statSync(video).size, 'bytes');
    if (demo) {
      const preview = path.join(__dirname, 'preview');
      fs.mkdirSync(preview, { recursive: true });
      fs.copyFileSync(video, path.join(preview, 'prayer-reel-demo.mp4'));
      return;
    }
    for (const page of targets) {
      try {
        event(`prayer reel on Page ${page.id}: ${JSON.stringify(await postReel(page, video, 'আজকের নামাজের সময়সূচি'))}`);
        st.done.push(page.id);
      } catch (e) { event(`prayer reel on Page ${page.id} FAILED: ${e.message}`); }
      fs.mkdirSync(path.dirname(PRAYER_REEL_FILE), { recursive: true });
      fs.writeFileSync(PRAYER_REEL_FILE, JSON.stringify(st, null, 2));
    }
  } finally {
    await browser.close();
  }
}

// ------------------------------------------------------------------ sports
// SPORTS=1: football and cricket from ESPN's public scoreboards. A result card for every finished match
// that passes the filters below (SPORTS_GAP_MIN apart, one per run), and at SPORTS_FIXTURE_HOUR a card of
// the day's matches. State: state/sports.json ({done: [ids], fixtures: date, lastAt}).
const SPORTS_FILE = path.join(__dirname, 'state', 'sports.json');
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
// League slug -> [Bengali name, rule]: 'all' posts every match, 'big' only matches with a BIG_CLUBS/BIG_NATIONS team.
const FOOTBALL_LEAGUES = {
  'eng.1': ['ইংলিশ প্রিমিয়ার লিগ', 'all'], 'esp.1': ['লা লিগা', 'all'], 'uefa.champions': ['উয়েফা চ্যাম্পিয়নস লিগ', 'all'],
  'ita.1': ['সিরি আ', 'big'], 'ger.1': ['বুন্দেসলিগা', 'big'], 'fra.1': ['লিগ ওয়ান', 'big'], 'uefa.europa': ['উয়েফা ইউরোপা লিগ', 'big'],
  'eng.fa': ['এফএ কাপ', 'big'], 'esp.copa_del_rey': ['কোপা দেল রে', 'big'], 'usa.1': ['মেজর লিগ সকার', 'big'],
  'fifa.world': ['ফিফা বিশ্বকাপ', 'all'], 'fifa.friendly': ['আন্তর্জাতিক প্রীতি ম্যাচ', 'big'],
  'fifa.worldq.conmebol': ['বিশ্বকাপ বাছাই', 'big'], 'fifa.worldq.uefa': ['বিশ্বকাপ বাছাই', 'big'], 'fifa.worldq.afc': ['বিশ্বকাপ বাছাই', 'big'],
  'conmebol.america': ['কোপা আমেরিকা', 'all'], 'uefa.euro': ['ইউরো', 'all'], 'uefa.nations': ['উয়েফা নেশনস লিগ', 'big'],
  'afc.asian.cup': ['এএফসি এশিয়ান কাপ', 'big'], 'afc.cupq': ['এশিয়ান কাপ বাছাই', 'big'], 'saff.championship': ['সাফ চ্যাম্পিয়নশিপ', 'all'],
};
const BN_TEAMS = {
  // national teams
  Bangladesh: 'বাংলাদেশ', India: 'ভারত', Pakistan: 'পাকিস্তান', 'Sri Lanka': 'শ্রীলঙ্কা', Afghanistan: 'আফগানিস্তান', Nepal: 'নেপাল',
  Australia: 'অস্ট্রেলিয়া', England: 'ইংল্যান্ড', 'New Zealand': 'নিউজিল্যান্ড', 'South Africa': 'দক্ষিণ আফ্রিকা', 'West Indies': 'ওয়েস্ট ইন্ডিজ',
  Zimbabwe: 'জিম্বাবুয়ে', Ireland: 'আয়ারল্যান্ড', Scotland: 'স্কটল্যান্ড', Netherlands: 'নেদারল্যান্ডস', 'United Arab Emirates': 'সংযুক্ত আরব আমিরাত',
  Argentina: 'আর্জেন্টিনা', Brazil: 'ব্রাজিল', Portugal: 'পর্তুগাল', France: 'ফ্রান্স', Germany: 'জার্মানি', Spain: 'স্পেন', Italy: 'ইতালি',
  Belgium: 'বেলজিয়াম', Croatia: 'ক্রোয়েশিয়া', Uruguay: 'উরুগুয়ে', Colombia: 'কলম্বিয়া', Mexico: 'মেক্সিকো', 'United States': 'যুক্তরাষ্ট্র', USA: 'যুক্তরাষ্ট্র',
  Japan: 'জাপান', 'South Korea': 'দক্ষিণ কোরিয়া', 'Saudi Arabia': 'সৌদি আরব', Qatar: 'কাতার', Morocco: 'মরক্কো', Bhutan: 'ভুটান', Maldives: 'মালদ্বীপ', Palestine: 'ফিলিস্তিন', Iran: 'ইরান', Iraq: 'ইরাক', 'United Arab Emirates ': 'আমিরাত', Oman: 'ওমান', Kuwait: 'কুয়েত', Jordan: 'জর্ডান', Syria: 'সিরিয়া', Lebanon: 'লেবানন', China: 'চীন', 'China PR': 'চীন', Singapore: 'সিঙ্গাপুর', 'Hong Kong': 'হংকং', Malaysia: 'মালয়েশিয়া', Thailand: 'থাইল্যান্ড', Vietnam: 'ভিয়েতনাম', Indonesia: 'ইন্দোনেশিয়া', Egypt: 'মিশর', Nigeria: 'নাইজেরিয়া', Senegal: 'সেনেগাল', Chile: 'চিলি', Peru: 'পেরু', Ecuador: 'ইকুয়েডর', Paraguay: 'প্যারাগুয়ে', Canada: 'কানাডা', Switzerland: 'সুইজারল্যান্ড', Denmark: 'ডেনমার্ক', Poland: 'পোল্যান্ড', Austria: 'অস্ট্রিয়া', Turkey: 'তুরস্ক', Türkiye: 'তুরস্ক', Norway: 'নরওয়ে', Sweden: 'সুইডেন', Wales: 'ওয়েলস', Namibia: 'নামিবিয়া', Oman: 'ওমান', 'Papua New Guinea': 'পাপুয়া নিউগিনি',
  // clubs
  Arsenal: 'আর্সেনাল', Chelsea: 'চেলসি', Liverpool: 'লিভারপুল', 'Manchester City': 'ম্যানচেস্টার সিটি', 'Manchester United': 'ম্যানচেস্টার ইউনাইটেড',
  'Tottenham Hotspur': 'টটেনহ্যাম', 'Newcastle United': 'নিউক্যাসল', 'Aston Villa': 'অ্যাস্টন ভিলা', Everton: 'এভারটন', 'West Ham United': 'ওয়েস্ট হ্যাম',
  Brighton: 'ব্রাইটন', 'Brighton & Hove Albion': 'ব্রাইটন', Fulham: 'ফুলহ্যাম', Brentford: 'ব্রেন্টফোর্ড', 'Crystal Palace': 'ক্রিস্টাল প্যালেস',
  Bournemouth: 'বোর্নমাউথ', 'AFC Bournemouth': 'বোর্নমাউথ', 'Nottingham Forest': 'নটিংহাম ফরেস্ট', 'Wolverhampton Wanderers': 'উলভস',
  'Leeds United': 'লিডস', Sunderland: 'সান্ডারল্যান্ড', Burnley: 'বার্নলি', 'Coventry City': 'কভেন্ট্রি', 'Ipswich Town': 'ইপসউইচ', 'Leicester City': 'লেস্টার',
  'Real Madrid': 'রিয়াল মাদ্রিদ', Barcelona: 'বার্সেলোনা', 'Atlético Madrid': 'অ্যাতলেতিকো মাদ্রিদ', 'Atletico Madrid': 'অ্যাতলেতিকো মাদ্রিদ',
  Sevilla: 'সেভিয়া', 'Real Betis': 'রিয়াল বেতিস', Villarreal: 'ভিয়ারিয়াল', 'Athletic Club': 'অ্যাথলেটিক বিলবাও', 'Real Sociedad': 'রিয়াল সোসিয়েদাদ',
  Valencia: 'ভ্যালেন্সিয়া', Girona: 'জিরোনা', 'Celta Vigo': 'সেল্তা ভিগো', Osasuna: 'ওসাসুনা', Getafe: 'গেতাফে', Mallorca: 'মায়োর্কা',
  'Rayo Vallecano': 'রায়ো ভায়েকানো', Alavés: 'আলাভেস', Espanyol: 'এস্পানিওল', Elche: 'এলচে', Levante: 'লেভান্তে', 'Real Oviedo': 'রিয়াল ওভিয়েদো',
  'Bayern Munich': 'বায়ার্ন মিউনিখ', 'Borussia Dortmund': 'বরুসিয়া ডর্টমুন্ড', 'Bayer Leverkusen': 'বায়ার লেভারকুসেন', 'RB Leipzig': 'আরবি লাইপজিগ',
  'Paris Saint-Germain': 'পিএসজি', Marseille: 'মার্সেই', Monaco: 'মোনাকো', Lyon: 'লিওঁ',
  Internazionale: 'ইন্টার মিলান', 'Inter Milan': 'ইন্টার মিলান', 'AC Milan': 'এসি মিলান', Juventus: 'জুভেন্টাস', Napoli: 'নাপোলি', 'AS Roma': 'রোমা', Lazio: 'লাৎসিও', Atalanta: 'আতালান্তা',
  'Inter Miami CF': 'ইন্টার মায়ামি', 'Al Nassr': 'আল নাসর', 'Al Hilal': 'আল হিলাল', Benfica: 'বেনফিকা', Porto: 'পোর্তো', 'Sporting CP': 'স্পোর্টিং', Ajax: 'আয়াক্স', 'PSV Eindhoven': 'পিএসভি', Celtic: 'সেল্টিক',
  // cricket franchises
  'Mumbai Indians': 'মুম্বাই ইন্ডিয়ানস', 'Chennai Super Kings': 'চেন্নাই সুপার কিংস', 'Royal Challengers Bengaluru': 'রয়্যাল চ্যালেঞ্জার্স বেঙ্গালুরু',
  'Kolkata Knight Riders': 'কলকাতা নাইট রাইডার্স', 'Sunrisers Hyderabad': 'সানরাইজার্স হায়দরাবাদ', 'Delhi Capitals': 'দিল্লি ক্যাপিটালস',
  'Rajasthan Royals': 'রাজস্থান রয়্যালস', 'Punjab Kings': 'পাঞ্জাব কিংস', 'Lucknow Super Giants': 'লক্ষ্ণৌ সুপার জায়ান্টস', 'Gujarat Titans': 'গুজরাট টাইটান্স',
  'Comilla Victorians': 'কুমিল্লা ভিক্টোরিয়ান্স', 'Rangpur Riders': 'রংপুর রাইডার্স', 'Fortune Barishal': 'ফরচুন বরিশাল', 'Sylhet Strikers': 'সিলেট স্ট্রাইকার্স',
  'Khulna Tigers': 'খুলনা টাইগার্স', 'Chittagong Kings': 'চিটাগং কিংস', 'Dhaka Capitals': 'ঢাকা ক্যাপিটালস', 'Durbar Rajshahi': 'দুর্বার রাজশাহী',
};
const BIG_CLUBS = ['Real Madrid', 'Barcelona', 'Atlético Madrid', 'Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen', 'Paris Saint-Germain',
  'Internazionale', 'Inter Milan', 'AC Milan', 'Juventus', 'Napoli', 'AS Roma', 'Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United',
  'Tottenham Hotspur', 'Newcastle United', 'Aston Villa', 'Inter Miami CF', 'Benfica', 'Porto', 'Sporting CP', 'Marseille', 'Atalanta', 'Lazio'];
const BIG_NATIONS = ['Bangladesh', 'Argentina', 'Brazil', 'Portugal', 'France', 'Germany', 'Spain', 'England', 'Italy', 'Netherlands', 'Belgium', 'Croatia',
  'Uruguay', 'India', 'Pakistan', 'Saudi Arabia', 'Japan', 'Morocco', 'Nepal', 'Bhutan', 'Sri Lanka', 'Maldives'];
const CRICKET_FULL = ['Bangladesh', 'India', 'Pakistan', 'Sri Lanka', 'Afghanistan', 'Australia', 'England', 'New Zealand', 'South Africa', 'West Indies', 'Zimbabwe', 'Ireland'];
const bnTeam = n => BN_TEAMS[n] || BN_TEAMS[n.replace(/ Women$/, '')] && `${BN_TEAMS[n.replace(/ Women$/, '')]} নারী` || n;
const bnClock = iso => { const d = new Date(new Date(iso).getTime() + 6 * 3600e3), h = d.getUTCHours(), m = d.getUTCMinutes();
  const part = h < 4 ? 'রাত' : h < 6 ? 'ভোর' : h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকাল' : h < 20 ? 'সন্ধ্যা' : 'রাত';
  return `${part} ${bn(h % 12 || 12)}:${bn(String(m).padStart(2, '0'))}`; };
// "Bangladesh won by 5 wickets (with 89 balls remaining)" -> "বাংলাদেশ ৫ উইকেটে জয়ী"
function bnCricketResult(s, names) {
  if (!s) return '';
  let m = s.match(/^(.+?) won by (\d+) (wickets?|wkts?|runs?)/i);
  if (m) return `${bnTeam(findTeam(m[1], names))} ${bn(m[2])} ${/run/i.test(m[3]) ? 'রানে' : 'উইকেটে'} জয়ী`;
  if (/^match drawn/i.test(s)) return 'ম্যাচ ড্র';
  if (/tied/i.test(s)) return 'ম্যাচ টাই';
  if (/no result|abandoned/i.test(s)) return 'ম্যাচ পরিত্যক্ত';
  m = s.match(/^(.+?) won/i);
  if (m) return `${bnTeam(findTeam(m[1], names))} জয়ী`;
  return s;
}
// "WPR Women" (short form in summaries) -> the competitor's full name.
function findTeam(s, names) {
  if (names[s]) return names[s];
  const w = s.split(' ')[0].toLowerCase(), women = /women/i.test(s);
  return Object.values(names).find(n => n.toLowerCase().startsWith(w) && /women/i.test(n) === women)
    || Object.entries(names).find(([k]) => k.toLowerCase().startsWith(w))?.[1] || s;
}
// "Bangladesh tour of Sri Lanka 2026/27" -> "বাংলাদেশ দলের শ্রীলঙ্কা সফর"
const bnSeries = s => { const m = s.match(/^(.+?)( Women)? tour of (.+?)(?: \d{4}.*)?$/);
  return m ? `${bnTeam(m[1])}${m[2] ? ' নারী' : ''} দলের ${bnTeam(m[3])} সফর` : s.replace(/ \d{4}\/\d{2}$/, ''); };
// Possessive: "বাংলাদেশ" -> "বাংলাদেশের", "শ্রীলঙ্কা" -> "শ্রীলঙ্কার"
const bnOf = n => /[\u0995-\u09B9\u09CE]$/.test(n) ? `${n}ের` : `${n}র`;
// "Western Province Women , elected to field first" -> "... টসে জিতে ফিল্ডিং নিয়েছে"
function bnToss(t, names) {
  const m = (t || '').match(/^(.+?)\s*,\s*elected to (bat|field)/i);
  return m ? `${bnTeam(findTeam(m[1].trim(), names))} টসে জিতে ${/bat/i.test(m[2]) ? 'ব্যাটিং' : 'বোলিং'} নিয়েছে` : '';
}
// "138/5 (35.1/50 ov, target 136)" -> "১৩৮/৫ (৩৫.১ ওভার)"
const bnCricketScore = s => bn(String(s || '').replace(/\(([\d.]+)(?:\/\d+)? ov[^)]*\)/, '($1 ওভার)').replace(/&/g, ' ও '));

async function sportsFetch(u) {
  const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  return r.json();
}
// Normalised matches: {id, sport, league, state, start, home:{name,logo,score}, away, result, scorers:[], venue}
async function footballMatches(dates = '') {
  const out = [];
  for (const [slug, [league, rule]] of Object.entries(FOOTBALL_LEAGUES)) {
    let j;
    try { j = await sportsFetch(`${ESPN}/${slug}/scoreboard${dates ? `?dates=${dates}` : ''}`); } catch { continue; }
    for (const e of j.events || []) {
      const c = e.competitions?.[0]; if (!c) continue;
      const side = h => c.competitors.find(x => x.homeAway === h);
      const H = side('home'), A = side('away');
      const names = [H.team.displayName, A.team.displayName];
      if (rule === 'big' && !names.some(n => BIG_CLUBS.includes(n) || BIG_NATIONS.includes(n))) continue;
      const pen = (H.shootoutScore != null) ? ` (টাইব্রেকারে ${bn(H.shootoutScore)}-${bn(A.shootoutScore)})` : '';
      const scorers = (c.details || []).filter(d => d.scoringPlay).map(d => ({
        team: d.team?.id === H.team.id ? 'home' : 'away',
        text: `${d.athletesInvolved?.[0]?.shortName || ''} ${bn(d.clock?.displayValue || '')}${d.penaltyKick ? ' (পে.)' : ''}${d.ownGoal ? ' (আত্মঘাতী)' : ''}` }));
      const hs = Number(H.score), as = Number(A.score);
      out.push({ id: `fb-${e.id}`, sport: 'football', league, state: e.status?.type?.state, done: !!e.status?.type?.completed, start: e.date,
        bd: names.includes('Bangladesh'), half: e.status?.type?.name === 'STATUS_HALFTIME',
        home: { name: bnTeam(H.team.displayName), en: H.team.displayName, logo: H.team.logo, score: H.score },
        away: { name: bnTeam(A.team.displayName), en: A.team.displayName, logo: A.team.logo, score: A.score },
        result: hs === as && !pen ? 'ম্যাচ ড্র' : `${hs > as || (pen && H.winner) ? bnTeam(H.team.displayName) : bnTeam(A.team.displayName)} জয়ী${pen}`,
        scorers, venue: c.venue?.fullName || '' });
    }
  }
  return out;
}
function cricketWanted(e, league) {
  const names = e.competitors.map(c => c.displayName);
  if (names.some(n => /Bangladesh/.test(n))) return true;
  if (/Bangladesh Premier League|Indian Premier League|ICC (Men's )?(T20 )?World Cup(?! .*Qualifier)|Champions Trophy|Asia Cup/i.test(league) && !/Qualifier|League 2|Challenge/i.test(league)) return true;
  const cls = e.class?.generalClassCard || '';
  return /^(Test|ODI|T20I)$/.test(cls) && names.every(n => CRICKET_FULL.includes(n));
}
async function cricketMatches() {
  const j = await sportsFetch('https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=cricket');
  const out = [];
  for (const l of j.sports?.[0]?.leagues || []) {
    for (const e of l.events || []) {
      if (!cricketWanted(e, l.name) || e.competitors?.length !== 2) continue;
      const [H, A] = e.competitors;
      const names = Object.fromEntries(e.competitors.flatMap(c => [[c.displayName, c.displayName], [c.name, c.displayName], [c.abbreviation, c.displayName]]));
      const toss = (e.notes || []).find(n => n.type === 'toss')?.text;
      out.push({ id: `cr-${e.id}`, sport: 'cricket', league: bnSeries(l.name), title: e.title || '', state: e.status, done: e.status === 'post', start: e.date,
        home: { name: bnTeam(H.displayName), en: H.displayName, logo: H.logo, score: bnCricketScore(H.score) },
        away: { name: bnTeam(A.displayName), en: A.displayName, logo: A.logo, score: bnCricketScore(A.score) },
        result: bnCricketResult(e.fullStatus?.longSummary || e.fullStatus?.summary, names), toss: bnToss(toss, names), venue: e.location || '', cls: e.class?.generalClassCard || '',
        bd: e.competitors.some(c => /Bangladesh/.test(c.displayName)), raw: [H.score || '', A.score || ''], summary: e.fullStatus?.summary || e.summary || '',
        day: e.fullStatus?.dayNumber || 0, names });
    }
  }
  return out;
}

const SPORTS_CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:'Noto Serif Bengali','Noto Serif',serif;font-weight:700;color:#fff;position:relative;background:#0a1f14}
.bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 38%,#1a8a4a 0,#0b5e2a 45%,#05301a 100%)}
.bg:after{content:'';position:absolute;inset:0;opacity:.09;background:repeating-linear-gradient(90deg,#fff 0 2px,transparent 2px 108px),
  radial-gradient(circle at 50% 50%,transparent 0 180px,#fff 181px 184px,transparent 185px)}
.hdr{position:relative;display:flex;align-items:center;gap:24px;padding:44px 50px 0}
.logo{height:100px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.logo.txt{display:flex;align-items:center;padding:0 22px;font-size:46px;font-weight:800;color:#c8202f}
.ht{flex:1}.h1{font-size:60px;font-weight:800;line-height:1.1}.h2{font-size:32px;font-weight:700;color:#c8f7d4;margin-top:4px}
.tag{background:#c8202f;border:4px solid #ffd54f;border-radius:50px;padding:4px 26px;font-size:36px;font-weight:800}
.lg{position:relative;margin:30px auto 0;width:max-content;max-width:960px;background:rgba(0,0,0,.28);border:3px solid rgba(255,213,79,.7);border-radius:50px;
  padding:6px 36px;font-size:38px;font-weight:700;color:#ffd54f;text-align:center}
.ftr{position:absolute;left:0;right:0;bottom:0;height:100px;background:linear-gradient(135deg,#c8202f,#931624);border-top:8px solid #ffd54f;
  display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:800}`;
const teamBadge = t => t.logo ? `<img class="tl" src="${t.logo}" onerror="this.outerHTML='<div class=&quot;tl ph&quot;>${(t.en || '?').slice(0, 2).toUpperCase()}</div>'">`
  : `<div class="tl ph">${(t.en || '?').slice(0, 2).toUpperCase()}</div>`;
async function renderSportsCard(browser, inner, css, outFile, logo) {
  const logoImg = logo ? `<img class="logo" src="${logo}">` : `<div class="logo txt">উৎসব TV</div>`;
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.setContent(`<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700;800;900&family=Noto+Serif:wght@700;800;900&display=swap" rel="stylesheet">
<style>${SPORTS_CSS}${css}</style><div class="bg"></div>${inner.replace('{LOGO}', logoImg)}`, { waitUntil: 'networkidle', timeout: 60000 });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: outFile });
  await pg.close();
  return outFile;
}
function sportsResultCard(browser, m, outFile, logo, tag = 'ম্যাচ শেষ', line = m.result) {
  const fb = m.sport === 'football';
  const sc = side => fb ? m.scorers.filter(s => s.team === side).map(s => `<div>⚽ ${s.text}</div>`).join('') : '';
  const score = fb ? `<div class="score">${bn(m.home.score)}<i>-</i>${bn(m.away.score)}</div>` : `<div class="vs">বনাম</div>`;
  const team = (t, side) => `<div class="team">${teamBadge(t)}<div class="tn">${t.name}</div>${fb ? `<div class="gs">${sc(side)}</div>` : `<div class="cs">${t.score || '-'}</div>`}</div>`;
  return renderSportsCard(browser, `
<div class="hdr">{LOGO}<div class="ht"><div class="h1">${fb ? 'ফুটবল' : 'ক্রিকেট'}</div><div class="h2">${bnDate(dhakaNow())}</div></div><div class="tag">${tag}</div></div>
<div class="lg">${m.league}${m.title ? ` · ${m.title.replace(/(\d+)(st|nd|rd|th) Match/i, (_, n) => `${bn(n)}তম ম্যাচ`).replace(/Final/i, 'ফাইনাল').replace(/Semi-?final/i, 'সেমিফাইনাল')}` : ''}</div>
${m.bd ? '<div class="bdr"><i></i>বাংলাদেশের খেলা</div>' : ''}
<div class="row${m.bd ? ' bdrow' : ''}">${team(m.home, 'home')}${score}${team(m.away, 'away')}</div>
<div class="res">${line}</div>
${m.venue ? `<div class="ven">${m.venue}</div>` : ''}
<div class="ftr">www.utsabtv.com</div>`, `
.row{position:relative;margin:90px 30px 0;display:flex;align-items:flex-start;justify-content:space-between}
.team{width:400px;display:flex;flex-direction:column;align-items:center;text-align:center}
.tl{width:300px;height:300px;object-fit:contain;background:#fff;border-radius:50%;padding:26px;border:8px solid #ffd54f;box-shadow:0 14px 34px rgba(0,0,0,.4)}
.tl.ph{display:flex;align-items:center;justify-content:center;font-size:90px;font-weight:800;color:#0b5e2a}
.tn{margin-top:26px;font-size:${fb ? 52 : 56}px;font-weight:800;line-height:1.15}
.gs{margin-top:14px;font-size:32px;font-weight:700;color:#e3ffe9;line-height:1.45}
.cs{margin-top:18px;background:#fff;color:#c8202f;border-radius:20px;padding:6px 22px;font-size:40px;font-weight:800;white-space:nowrap}
.score{margin-top:90px;font-size:150px;font-weight:800;color:#ffd54f;text-shadow:0 8px 26px rgba(0,0,0,.45);white-space:nowrap}.score i{font-style:normal;margin:0 14px;color:#fff}
.vs{margin-top:120px;font-size:56px;font-weight:800;color:#ffd54f}
.res{position:absolute;left:60px;right:60px;bottom:${m.venue ? 220 : 170}px;text-align:center;background:#fff;color:#0b5e2a;border-radius:30px;border:6px solid #c8202f;
  padding:14px 20px;font-size:58px;font-weight:800;box-shadow:0 14px 30px rgba(0,0,0,.35)}
.bdr{position:relative;margin:22px auto 0;width:max-content;display:flex;align-items:center;gap:16px;background:#006a4e;border:4px solid #fff;border-radius:50px;padding:6px 34px;font-size:40px;font-weight:800;box-shadow:0 8px 20px rgba(0,0,0,.35)}
.bdr i{width:34px;height:34px;border-radius:50%;background:#f42a41}
.row.bdrow{margin-top:40px}
.ven{position:absolute;left:0;right:0;bottom:130px;text-align:center;font-size:30px;color:#c8f7d4}`, outFile, logo);
}
function sportsFixturesCard(browser, list, outFile, logo) {
  const rows = list.map(m => `<div class="fx${m.bd ? ' bd' : ''}"><span class="ic">${m.sport === 'football' ? '⚽' : '🏏'}</span>
    <div class="mt"><b>${m.home.name} <i>বনাম</i> ${m.away.name}</b><small>${m.league}</small></div><span class="tm">${bnClock(m.start)}</span></div>`).join('');
  return renderSportsCard(browser, `
<div class="hdr">{LOGO}<div class="ht"><div class="h1">আজকের খেলা</div><div class="h2">${BN_DAYS[dhakaNow().getUTCDay()]}, ${bnDate(dhakaNow())}</div></div><div class="tag">সময়সূচি</div></div>
<div class="list">${rows}</div>
<div class="note">সময় বাংলাদেশ সময় অনুযায়ী</div>
<div class="ftr">www.utsabtv.com</div>`, `
.list{position:relative;margin:36px 50px 0;display:flex;flex-direction:column;gap:${list.length > 6 ? 12 : 18}px}
.fx{display:flex;align-items:center;gap:20px;background:rgba(255,255,255,.95);color:#0b5e2a;border-radius:22px;padding:${list.length > 6 ? 8 : 14}px 26px;box-shadow:0 8px 18px rgba(0,0,0,.25)}
.fx.bd{background:#fff3c4;border:5px solid #c8202f}.ic{font-size:44px}.mt{flex:1;display:flex;flex-direction:column;min-width:0}
.mt b{font-size:${list.length > 6 ? 36 : 42}px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mt b i{font-style:normal;color:#c8202f;font-size:.75em}
.mt small{font-size:26px;font-weight:700;color:#557a62}
.tm{background:#c8202f;color:#fff;border-radius:16px;padding:6px 18px;font-size:34px;font-weight:800;white-space:nowrap}
.note{position:absolute;left:0;right:0;bottom:122px;text-align:center;font-size:28px;color:#c8f7d4}`, outFile, logo);
}

async function sportsTick() {
  if (process.env.SPORTS !== '1') return;
  let st = {};
  try { st = JSON.parse(fs.readFileSync(SPORTS_FILE, 'utf8')); } catch {}
  const first = !st.done;
  st.done = st.done || []; st.lastAt = st.lastAt || 0; st.pages = st.pages || {};
  const gap = Number(process.env.SPORTS_GAP_MIN || 3) * 60e3;
  const save = () => { st.done = st.done.slice(-400); fs.mkdirSync(path.dirname(SPORTS_FILE), { recursive: true }); fs.writeFileSync(SPORTS_FILE, JSON.stringify(st, null, 2)); };
  const now = dhakaNow(), today = now.toISOString().slice(0, 10);
  const all = [...await footballMatches().catch(e => (log('football feed:', e.message), [])), ...await cricketMatches().catch(e => (log('cricket feed:', e.message), []))];
  if (first) { st.done = all.filter(m => m.done).map(m => m.id).concat(all.filter(m => m.bd && m.state === 'in').flatMap(m => [`${m.id}-toss`, `${m.id}-half`])); save(); return log(`sports: first run, ${st.done.length} finished matches marked seen`); }
  // Bangladesh first: live steps (toss, second innings, day's close, half-time) and results, without waiting for the gap.
  let job = null;
  for (const m of all.filter(x => x.bd)) {
    const steps = m.sport === 'cricket' ? [
      [`${m.id}-toss`, m.state === 'in' && m.toss, 'টস', m.toss],
      [`${m.id}-inn`, m.state === 'in' && /target/i.test(m.raw.join(' ')), 'ইনিংস বিরতি', (() => {
        const i = /target/i.test(m.raw[0]) ? 0 : 1, t = m.raw[i].match(/target (\d+)/i);
        return t ? `জয়ের জন্য ${bnOf(i ? m.away.name : m.home.name)} লক্ষ্য ${bn(t[1])} রান` : 'দ্বিতীয় ইনিংস শুরু'; })()],
      [`${m.id}-day${m.day}`, m.state === 'in' && /stumps/i.test(m.summary), m.day ? `${['', '১ম', '২য়', '৩য়', '৪র্থ', '৫ম'][m.day] || bn(m.day)} দিন শেষ` : 'দিন শেষ', 'দিনের খেলা শেষ'],
      [m.id, m.done, 'ম্যাচ শেষ', m.result],
    ] : [
      [`${m.id}-half`, m.half, 'বিরতি', 'প্রথমার্ধ শেষ'],
      [m.id, m.done, 'ম্যাচ শেষ', m.result],
    ];
    const s1 = steps.find(([k, ok]) => ok && !st.done.includes(k));
    if (s1) { const [k, , tag, line] = s1; job = { key: k, done: () => st.done.push(k), make: (b, f, l) => sportsResultCard(b, m, f, l, tag, line) }; break; }
  }
  if (!job && Date.now() < st.lastAt + gap) return;
  if (!job && st.fixtures !== today && now.getUTCHours() >= Number(process.env.SPORTS_FIXTURE_HOUR || 9)) {
    // Next 24 hours of matches (European football mostly falls in Bangladesh's night).
    const tom = new Date(Date.now() + 864e5).toISOString().slice(0, 10).replace(/-/g, '');
    const fb2 = await footballMatches(tom).catch(() => []);
    const seen = new Set();
    const list = [...all, ...fb2].filter(m => m.state === 'pre' && !seen.has(m.id) && seen.add(m.id))
      .filter(m => { const t = new Date(m.start).getTime(); return t > Date.now() && t < Date.now() + 864e5; })
      .sort((a, b) => (b.bd - a.bd) || new Date(a.start) - new Date(b.start)).slice(0, 8);
    if (!list.length) { st.fixtures = today; save(); return log('sports: no fixtures today'); }
    job = { key: `fixtures-${today}`, done: () => { st.fixtures = today; }, make: (b, f, l) => sportsFixturesCard(b, list, f, l) };
  }
  if (!job) {
    const m = all.find(x => x.done && !x.bd && !st.done.includes(x.id));
    if (!m) return;
    job = { key: m.id, done: () => st.done.push(m.id), make: (b, f, l) => sportsResultCard(b, m, f, l) };
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const card = await job.make(browser, path.join(OUT_DIR, `sports-${job.key}.png`), await channelLogo(browser));
    const done = st.pages[job.key] = st.pages[job.key] || [];
    try { await postToFacebook(card, '', '', done, browser); job.done(); delete st.pages[job.key]; } finally { st.lastAt = Date.now(); save(); }
  } catch (e) {
    event(`sports ${job.key} FAILED: ${e.message}`);
    job.done();
  } finally {
    save();
    await browser.close();
  }
}

// DEMO_SPORTS=1: recent result cards (2 football, 2 cricket) and today's fixtures card into ./preview. Posts nothing.
async function sportsDemo() {
  const fb = await footballMatches().catch(e => (log(e.message), []));
  const yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10).replace(/-/g, '');
  const fbY = fb.some(m => m.done) ? [] : await footballMatches(yest).catch(() => []);
  const cr = await cricketMatches().catch(e => (log(e.message), []));
  const preview = path.join(__dirname, 'preview');
  fs.mkdirSync(preview, { recursive: true });
  const browser = await chromium.launch();
  try {
    const logo = await channelLogo(browser);
    const fdone = [...fb, ...fbY].filter(m => m.done), cdone = cr.filter(m => m.done);
    const pick = [...fdone.filter(m => m.scorers.length).slice(0, 2), ...cdone.slice(0, 2)];
    for (const [i, m] of pick.entries()) await sportsResultCard(browser, m, path.join(preview, `sports-demo-${i + 1}.png`), logo);
    const pre = [...fb, ...cr].filter(m => m.state === 'pre').sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 8);
    if (pre.length) await sportsFixturesCard(browser, pre, path.join(preview, 'sports-demo-fixtures.png'), logo);
    fs.writeFileSync(path.join(preview, 'sports-demo.json'), JSON.stringify({ football: fb.length + fbY.length, cricket: cr.length,
      cricketList: cr.map(m => `${m.state} ${m.home.en} v ${m.away.en} | ${m.league} | ${m.result}`), picked: pick.map(m => m.id), fixtures: pre.length }, null, 2));
  } finally {
    await browser.close();
  }
}

// ------------------------------------------------------------------ entertainment
// ENT=1: entertainment news (Bangladesh, India, world) from Google News' Bengali entertainment feeds.
// Each story becomes a branded card (the source's photo, the headline, a category tag, the source's name),
// one per ENT_GAP_MIN minutes between ENT_FROM_HOUR and ENT_TO_HOUR Dhaka time. Near-duplicate headlines
// (the same story from several papers) are posted once. State: state/ent.json.
const ENT_FILE = path.join(__dirname, 'state', 'ent.json');
const ENT_FEEDS = [
  'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=bn&gl=BD&ceid=BD:bn',
  'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=bn&gl=IN&ceid=IN:bn',
  'https://news.google.com/rss/search?q=%E0%A6%AC%E0%A6%BF%E0%A6%A8%E0%A7%8B%E0%A6%A6%E0%A6%A8&hl=bn&gl=BD&ceid=BD:bn', // "বিনোদন"
];
// Category tag from words in the headline, first match wins.
const ENT_TAGS = [
  ['কনসার্ট', /কনসার্ট|মঞ্চ মাতা|লাইভ শো|কনসার্টে/], ['গান', /গান|সংগীত|শিল্পী|অ্যালবাম|মিউজিক|ব্যান্ড|কণ্ঠ|গায়ক|গায়িকা/],
  ['নাটক', /নাটক|টেলিফিল্ম|ধারাবাহিক|সিরিয়াল/], ['ওটিটি', /ওটিটি|ওয়েব সিরিজ|ওয়েবসিরিজ|নেটফ্লিক্স|চরকি|হইচই|প্রাইম ভিডিও/],
  ['বলিউড', /বলিউড|Bollywood|শাহরুখ|সালমান|সলমন|বিগ বস|অমিতাভ|রণবীর|রণবীর|শ্রদ্ধা|জাহ্নবী|কঙ্গনা|আমির খান|রণবীর|দীপিকা|আলিয়া|ক্যাটরিনা|প্রিয়াঙ্কা|ঐশ্বরিয়া|অক্ষয়|হৃতিক|কারিনা|কার্তিক|বচ্চন/],
  ['টলিউড', /টলিউড|টালিগঞ্জ|দেব |জিৎ|কোয়েল|শুভশ্রী|ঋতুপর্ণা|প্রসেনজিৎ|পরমব্রত|স্বস্তিকা|মিমি|নুসরাত জাহান|কলকাতার/],
  ['হলিউড', /হলিউড|Hollywood|অস্কার|মার্ভেল|টেলর সুইফট|কে-পপ|বিটিএস|ব্ল্যাকপিংক/],
  ['ঢালিউড', /ঢালিউড|শাকিব|অপু বিশ্বাস|বুবলী|পরীমণি|জয়া আহসান|মিম|চঞ্চল|আফরান নিশো|সিয়াম|মেহজাবীন|তাসনিয়া ফারিণ|ঢাকাই/],
  ['সিনেমা', /সিনেমা|চলচ্চিত্র|ছবির|ট্রেলার|বক্স অফিস/],
];
// Papers whose stories are used (others, mostly small sites, are skipped).
const ENT_SOURCES = /Prothom Alo|প্রথম আলো|Jugantor|যুগান্তর|Kaler Kantho|কালের কণ্ঠ|Samakal|সমকাল|bdnews24|Jagonews24|জাগো|Dhaka Post|ঢাকা পোস্ট|Channel i|Bangla Tribune|বাংলা ট্রিবিউন|Somoy|সময়|Ittefaq|ইত্তেফাক|Desh Rupantor|দেশ রূপান্তর|Daily Star|Bangladesh Pratidin|বাংলাদেশ প্রতিদিন|banglanews24|বাংলানিউজ|Ajker Patrika|আজকের পত্রিকা|Kalbela|কালবেলা|NTV|RTV|Jamuna|যমুনা|Independent|Ekattor|একাত্তর|DBC|Dhaka Times|ঢাকা টাইমস|Risingbd|রাইজিংবিডি|Manab Zamin|মানবজমিন|Naya Diganta|নয়া দিগন্ত|Inqilab|BBC|বিবিসি|Deutsche Welle|DW|Anandabazar|আনন্দবাজার|ABP Ananda|এবিপি|Sangbad Pratidin|সংবাদ প্রতিদিন|Ei Samay|এই সময়|Hindustan Times|Indian Express|Zee 24|জি ২৪|News18|TV9|Aajkaal|আজকাল|Bartaman|বর্তমান|Kolkata TV|Sangbad|Bangla Hunt/i;
const entTag = t => (ENT_TAGS.find(([, re]) => re.test(t)) || ['বিনোদন'])[0];
// Word sets for spotting the same story from different papers.
const entWords = t => new Set(t.replace(/[^ঀ-৿A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2));
const entSame = (a, b) => { const A = entWords(a), B = entWords(b); let n = 0; for (const w of A) if (B.has(w)) n++; return n >= 3 && n / Math.min(A.size, B.size) >= 0.5; };

async function entItems() {
  const out = [];
  for (const u of ENT_FEEDS) {
    let xml = '';
    try { xml = await (await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } })).text(); } catch { continue; }
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const g = tag => decodeEntities((m[1].match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`)) || [])[1] || '');
      const raw = g('title'), source = g('source') || raw.split(' - ').pop();
      const title = raw.replace(/\s+-\s+[^-]+$/, '').trim();
      if (/live (news )?updates?|লাইভ আপডেট|^[A-Za-z0-9 ,.'’-]+:/i.test(title)) continue; // live blogs and English-prefixed titles
      out.push({ id: g('guid') || g('link'), link: g('link'), title, source, at: Date.parse(g('pubDate')) || 0 });
    }
  }
  return out.sort((a, b) => b.at - a.at);
}
// Opens the Google News link in the browser (it forwards to the paper) and reads the paper's photo.
async function entResolve(browser, it) {
  const pg = await browser.newPage();
  try {
    await pg.goto(it.link, { waitUntil: 'domcontentloaded', timeout: 45000 });
    for (let i = 0; i < 20 && /news\.google\.com/.test(pg.url()); i++) await pg.waitForTimeout(500);
    await pg.waitForTimeout(1500);
    const html = await pg.content();
    const image = meta(html, 'og:image') || meta(html, 'twitter:image');
    return { url: pg.url(), image: image && !/logo|default|placeholder/i.test(image) ? new URL(image, pg.url()).href : '' };
  } catch (e) { log('ent resolve failed:', it.link, e.message); return { url: '', image: '' }; } finally { await pg.close(); }
}
async function entCard(browser, it, outFile, logo) {
  const logoImg = logo ? `<img class="logo" src="${logo}">` : `<div class="logo txt">উৎসব TV</div>`;
  const len = [...it.title].length, fs1 = len > 90 ? 50 : len > 65 ? 56 : len > 45 ? 62 : 70;
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.setContent(`<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700;800;900&family=Noto+Serif:wght@700;800;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:'Noto Serif Bengali','Noto Serif',serif;font-weight:700;color:#fff;background:#0b0b10;position:relative}
.ph{position:absolute;left:0;right:0;top:0;height:820px;background:#222 center/cover no-repeat;background-image:url('${it.image}')}
.ph:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35) 0,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 60%,#0b5e2a 100%)}
.logo{position:absolute;left:40px;top:36px;height:96px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.35);z-index:2}
.logo.txt{display:flex;align-items:center;padding:0 22px;font-size:44px;font-weight:800;color:#c8202f}
.badge{position:absolute;right:40px;top:44px;z-index:2;display:flex;gap:0;border-radius:40px;overflow:hidden;border:4px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.badge span{padding:4px 22px;font-size:34px;font-weight:800}.badge .a{background:#c8202f}.badge .b{background:#ffd54f;color:#7a1020}
.body{position:absolute;left:0;right:0;top:800px;bottom:100px;background:linear-gradient(180deg,#0b5e2a 0,#063d1b 100%);padding:34px 56px 0;display:flex;flex-direction:column}
.bar{width:140px;height:10px;background:#ffd54f;border-radius:6px;margin-bottom:22px}
.hl{font-size:${fs1}px;font-weight:800;line-height:1.38;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.meta{margin-top:auto;margin-bottom:26px;display:flex;justify-content:space-between;font-size:30px;color:#c8f7d4}
.ftr{position:absolute;left:0;right:0;bottom:0;height:100px;background:linear-gradient(135deg,#c8202f,#931624);border-top:8px solid #ffd54f;
  display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:800}
</style>
<div class="ph"></div>${logoImg}<div class="badge"><span class="a">বিনোদন</span>${it.tag !== 'বিনোদন' ? `<span class="b">${it.tag}</span>` : ''}</div>
<div class="body"><div class="bar"></div><div class="hl">${it.title.replace(/</g, '&lt;')}</div>
<div class="meta"><span>${bnDate(dhakaNow())}</span></div></div>
<div class="ftr">www.utsabtv.com</div>`, { waitUntil: 'networkidle', timeout: 60000 });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: outFile });
  await pg.close();
  return outFile;
}

async function entTick() {
  if (process.env.ENT !== '1') return;
  let st = {};
  try { st = JSON.parse(fs.readFileSync(ENT_FILE, 'utf8')); } catch {}
  const first = !st.seen;
  st.seen = st.seen || []; st.titles = st.titles || []; st.lastAt = st.lastAt || 0; st.pages = st.pages || {};
  const save = () => { st.seen = st.seen.slice(-600); st.titles = st.titles.slice(-150); fs.mkdirSync(path.dirname(ENT_FILE), { recursive: true }); fs.writeFileSync(ENT_FILE, JSON.stringify(st, null, 2)); };
  const h = dhakaNow().getUTCHours();
  if (!first && (h < Number(process.env.ENT_FROM_HOUR || 8) || h >= Number(process.env.ENT_TO_HOUR || 24))) return;
  if (Date.now() < st.lastAt + Number(process.env.ENT_GAP_MIN || 30) * 60e3) return;
  const items = await entItems();
  if (first) { st.seen = items.map(i => i.id); save(); return log(`ent: first run, ${items.length} stories marked seen`); }
  const fresh = items.filter(i => !st.seen.includes(i.id) && Date.now() - i.at < 6 * 3600e3 && ENT_SOURCES.test(i.source));
  if (!fresh.length) return;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const it of fresh.slice(0, 6)) {
      st.seen.push(it.id);
      if (st.titles.some(t => entSame(t, it.title))) continue; // already posted from another paper
      const r = await entResolve(browser, it);
      if (!r.image) { log('ent: no photo, skipped:', it.title); continue; }
      Object.assign(it, r, { tag: entTag(it.title) });
      const card = await entCard(browser, it, path.join(OUT_DIR, `ent-${st.seen.length}.png`), await channelLogo(browser));
      const done = st.pages[it.id] = st.pages[it.id] || [];
      try { await postToFacebook(card, '', '', done, browser); st.titles.push(it.title); delete st.pages[it.id]; }
      catch (e) { event(`ent FAILED: ${e.message}`); }
      finally { st.lastAt = Date.now(); }
      break;
    }
  } finally {
    save();
    await browser.close();
  }
}

// DEMO_ENT=1: cards for the 4 newest different stories into ./preview. Posts nothing.
async function entDemo() {
  const items = await entItems();
  const preview = path.join(__dirname, 'preview');
  fs.mkdirSync(preview, { recursive: true });
  const browser = await chromium.launch();
  const made = [];
  try {
    const logo = await channelLogo(browser);
    for (const it of items) {
      if (made.length >= 4) break;
      if (!ENT_SOURCES.test(it.source) || made.some(m => entSame(m.title, it.title))) continue;
      const r = await entResolve(browser, it);
      if (!r.image) continue;
      Object.assign(it, r, { tag: entTag(it.title) });
      await entCard(browser, it, path.join(preview, `ent-demo-${made.length + 1}.png`), logo);
      made.push(it);
    }
    fs.writeFileSync(path.join(preview, 'ent-demo.json'), JSON.stringify({ total: items.length, made: made.map(m => ({ title: m.title, source: m.source, tag: m.tag, url: m.url })) }, null, 2));
  } finally {
    await browser.close();
  }
}

(async () => {
  if ((process.env.DEMO_REEL === '1' || process.env.REEL_RUN === '1') && process.env.REEL_KIND === 'weather')
    return weatherReelRun().catch(e => { event(`weather reel FAILED: ${e.stack || e.message}`); process.exit(1); });
  if ((process.env.DEMO_REEL === '1' || process.env.REEL_RUN === '1') && process.env.REEL_KIND === 'prayer')
    return prayerReelRun().catch(e => { event(`prayer reel FAILED: ${e.stack || e.message}`); process.exit(1); });
  if (process.env.DEMO_REEL === '1' || process.env.REEL_RUN === '1') return reelRun().catch(e => { event(`reel FAILED: ${e.stack || e.message}`); process.exit(1); });
  if (process.env.DEMO_PRAYER === '1') return prayerDemo();
  if (process.env.DEMO_SPORTS === '1') return sportsDemo();
  if (process.env.DEMO_ENT === '1') return entDemo();
  if (process.env.DEMO_WEATHER) return weatherDemo();
  if (process.env.DEMO_LINK) return demoCard();
  if (process.env.CHECK === '1') return checkPages();
  await weatherTick().catch(e => event(`weather FAILED: ${e.message}`));
  await prayerTick().catch(e => event(`prayer FAILED: ${e.message}`));
  await sportsTick().catch(e => event(`sports FAILED: ${e.message}`));
  await entTick().catch(e => event(`ent FAILED: ${e.message}`));
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
