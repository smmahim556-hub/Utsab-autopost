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
// Shared brand frame (logo top-right, same footer on every card), approved 2026-10-27; FRAME=0 brings back the old look.
const FRAME = process.env.FRAME !== '0';
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
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(45000) });
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
  return { title: meta(html, 'og:title'), image: meta(html, 'og:image'), description: decodeEntities(meta(html, 'og:description') || ''), isArticle: html.includes('বার পড়া হয়েছে') };
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

async function postToPage(page, cardFile, caption, link, withCaption = false) {
  const photo = new FormData();
  photo.append('source', new Blob([fs.readFileSync(cardFile)]), path.basename(cardFile));
  // No caption: the card already carries the headline, and the link goes in the first comment.
  if (withCaption || process.env.FB_CAPTION === '1') photo.append('caption', caption);
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
// Caption hashtags: always #utsabtv, then the card's own topics (spaces become _).
const hashtags = (...t) => ['utsabtv', ...t].filter(Boolean).map(x => '#' + String(x).trim().replace(/[\s\-–:]+/g, '_').replace(/[^\p{L}\p{M}\p{N}_]/gu, '')).filter((x, i, a) => x.length > 1 && a.indexOf(x) === i).slice(0, 5).join(' ');
// withCaption: post the caption even though FB_CAPTION is off (desk cards carry a summary there).
async function postToFacebook(cardFile, caption, link, done, browser, withCaption = false) {
  const targets = await pages();
  if (!targets.length) throw new Error('no FB_PAGE_ID / FB_PAGE_TOKEN set');
  let failed = null;
  const ids = {};
  for (const page of targets) {
    if (done.includes(page.id)) continue;
    try {
      ids[page.id] = await postToPage(page, cardFile, caption, link, withCaption);
      event(`posted to Page ${page.id}: ${ids[page.id]} (${link})`);
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
  return ids;
}

// LEAN=1 (2026-10-29, owner approved): the many small cards that got almost no response (8 division weather cards,
// 8 division prayer schedules, waqt reminders, minor-league results) go to the Page stories only; the feed gets one combined
// weather and one combined prayer card a day. LEAN=0 brings the old format back unchanged.
const LEAN = process.env.LEAN === '1';
async function postStoriesOnly(cardFile, done, browser) {
  for (const page of await pages()) {
    if (done.includes(page.id)) continue;
    try {
      const file = await composeStory(browser, cardFile, page, cardFile.replace(/\.png$/, `-story-${page.id}.png`));
      event(`story only on Page ${page.id}: ${JSON.stringify(await postStory(page, file))}`);
    } catch (e) { event(`story only on Page ${page.id} FAILED: ${e.message}`); }
    done.push(page.id);
  }
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
// Sky photo for the card background (the Weather template wants a photo). With WEATHER_ART=1 a large,
// clear picture of the day's weather (sun, clouds, rain, lightning, fog) is drawn in the top part of the card.
const WX_SUN = (cx, cy, r) => `<g><circle cx="${cx}" cy="${cy}" r="${r * 1.9}" fill="url(#glow)"/>
  <g stroke="#ffc107" stroke-width="${r * 0.16}" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => {
    const a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a);
    return `<line x1="${cx + r * 1.25 * c}" y1="${cy + r * 1.25 * s}" x2="${cx + r * 1.6 * c}" y2="${cy + r * 1.6 * s}"/>`; }).join('')}</g>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sunG)"/></g>`;
const WX_CLOUD = (x, y, k, dark) => `<g transform="translate(${x},${y}) scale(${k})" filter="url(#sh)">
  <path d="M60 200h300a70 70 0 0 0 8-139.5A100 100 0 0 0 175 40a80 80 0 0 0-115 76A42 42 0 0 0 60 200z" fill="url(#${dark ? 'cdG' : 'clG'})"/></g>`;
const WX_RAIN = (x0, x1, y0, y1, n, color = '#7fd3ff') => Array.from({ length: n }, (_, i) => {
  const cols = 7, col = i % cols, row = Math.floor(i / cols);
  const x = x0 + (col + (row % 2) * 0.5) * (x1 - x0) / cols, y = y0 + row * 70 + (col % 3) * 18;
  return `<line x1="${x}" y1="${y}" x2="${x - 18}" y2="${y + 56}" stroke="${color}" stroke-width="9" stroke-linecap="round" opacity=".9"/>`; }).join('');
const WX_ART = {
  sun: () => WX_SUN(540, 430, 170),
  part: () => WX_SUN(650, 360, 130) + WX_CLOUD(250, 380, 1.45),
  cloud: () => WX_CLOUD(120, 250, 1.25) + WX_CLOUD(420, 380, 1.45),
  fog: () => WX_CLOUD(270, 220, 1.4) + [560, 620, 680, 740].map((y, i) => `<rect x="${170 + (i % 2) * 60}" y="${y}" width="${680 - (i % 2) * 120}" height="26" rx="13" fill="#fff" opacity=".8"/>`).join(''),
  rain: () => WX_CLOUD(240, 200, 1.5, true) + WX_RAIN(330, 800, 520, 760, 26),
  storm: () => WX_CLOUD(240, 190, 1.5, true) + WX_RAIN(330, 800, 520, 760, 20)
    + `<path d="M560 470l-90 170h70l-50 150 150-200h-80l60-120z" fill="#ffd600" stroke="#ff8f00" stroke-width="8" stroke-linejoin="round" filter="url(#bolt)"/>`,
};
async function skyPhoto(browser, sky, file) {
  const [a, b, c] = SKIES[sky];
  const art = process.env.WEATHER_ART === '1' ? `<svg width="1080" height="1350" viewBox="0 0 1080 1350" style="position:absolute;left:0;top:0">
  <defs><radialGradient id="sunG" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fffde7"/><stop offset=".45" stop-color="#ffeb3b"/><stop offset="1" stop-color="#ff9800"/></radialGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#fff59d" stop-opacity=".75"/><stop offset="1" stop-color="#fff59d" stop-opacity="0"/></radialGradient>
    <linearGradient id="clG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe9f3"/></linearGradient>
    <linearGradient id="cdG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b0bccb"/><stop offset="1" stop-color="#6d7d90"/></linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".28"/></filter>
    <filter id="bolt"><feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="#ffeb3b" flood-opacity=".9"/></filter></defs>
  ${WX_ART[sky]()}</svg>` : '';
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.setContent(`<body style="margin:0;width:1080px;height:1350px;position:relative;overflow:hidden;background:
    radial-gradient(circle at 78% 18%, ${c} 0, transparent 38%),
    radial-gradient(ellipse at 20% 30%, rgba(255,255,255,.35) 0, transparent 40%),
    radial-gradient(ellipse at 60% 45%, rgba(255,255,255,.22) 0, transparent 45%),
    linear-gradient(180deg, ${a} 0%, ${b} 70%, ${c} 100%)">${art}</body>`);
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

// All 8 divisions on one card (LEAN feed card), from the day's per-division readings in state/weather.json.
const WXI_CLOUD = (fill = '#e9eef2') => `<path d="M30 70h56a18 18 0 0 0 0-36a26 26 0 0 0-50-6a20 20 0 0 0-6 42z" fill="${fill}" stroke="#9aaab9" stroke-width="3"/>`;
const WX_ICON = {
  sun: '<svg viewBox="0 0 120 100"><g stroke="#ffb300" stroke-width="6" stroke-linecap="round"><line x1="60" y1="6" x2="60" y2="18"/><line x1="60" y1="82" x2="60" y2="94"/><line x1="16" y1="50" x2="28" y2="50"/><line x1="92" y1="50" x2="104" y2="50"/><line x1="29" y1="19" x2="37" y2="27"/><line x1="83" y1="73" x2="91" y2="81"/><line x1="29" y1="81" x2="37" y2="73"/><line x1="83" y1="27" x2="91" y2="19"/></g><circle cx="60" cy="50" r="24" fill="#ffc107"/></svg>',
  part: `<svg viewBox="0 0 120 100"><circle cx="44" cy="36" r="22" fill="#ffc107"/>${WXI_CLOUD('#fff')}</svg>`,
  cloud: `<svg viewBox="0 0 120 100">${WXI_CLOUD('#cfd6dc')}</svg>`,
  fog: `<svg viewBox="0 0 120 100">${WXI_CLOUD('#e3e7ea')}<g stroke="#9aaab9" stroke-width="5" stroke-linecap="round"><line x1="20" y1="82" x2="100" y2="82"/><line x1="30" y1="94" x2="90" y2="94"/></g></svg>`,
  rain: `<svg viewBox="0 0 120 100">${WXI_CLOUD('#b8c4cf')}<g stroke="#1f78d1" stroke-width="5" stroke-linecap="round"><line x1="40" y1="78" x2="34" y2="94"/><line x1="60" y1="78" x2="54" y2="94"/><line x1="80" y1="78" x2="74" y2="94"/></g></svg>`,
  storm: `<svg viewBox="0 0 120 100">${WXI_CLOUD('#8497a8')}<path d="M62 70l-14 18h12l-6 12 20-22h-12l8-8z" fill="#ffc107"/></svg>`,
};
async function weatherAllCard(browser, data, outFile, logo) {
  const now = dhakaNow();
  const tiles = DIVISIONS.filter(d => data[d.name]).map(d => { const w = data[d.name];
    return `<div class="tile"><div class="n">${d.name}</div><div class="i">${WX_ICON[w.sky] || WX_ICON.part}</div><div class="v">${w.temp}</div><div class="c">${w.condition}</div><div class="m">${(w.note || '').replace(/ · বৃষ্টির সম্ভাবনা/, '<br>বৃষ্টি')}</div></div>`; }).join('');
  return shot(browser, `<style>${BRAND_CSS}
body{background:linear-gradient(180deg,#7cc3f4 0%,#d7ecfb 60%,#f3f8fc 100%)}
.g{position:absolute;left:40px;right:40px;top:250px;bottom:130px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;gap:18px}
.tile{background:rgba(255,255,255,.93);border-radius:24px;box-shadow:0 8px 20px rgba(0,0,0,.12);border-top:10px solid #12873d;padding:16px 10px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center}
.tile:nth-child(2n){border-top-color:#c8202f}
.n{font-size:36px;font-weight:900;color:#0b2a17}.i svg{width:110px;height:90px}.v{font-size:58px;font-weight:900;color:#c8202f;line-height:1.1}
.c{font-size:24px;color:#1d2b22}.m{font-size:19px;color:#4d5f53;line-height:1.35}
</style>${brandHead(logo, 'আজকের আবহাওয়া', `${BN_DAYS[now.getUTCDay()]}, ${bnDate(now)} · ৮ বিভাগ`)}<div class="g">${tiles}</div><div class="ftr">www.utsabtv.com</div>`, outFile);
}
async function weatherAllPost(st, save) {
  const data = st.data || {};
  if (Object.keys(data).length < 6) { st.allDone = true; return save(); }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const card = await weatherAllCard(browser, data, path.join(OUT_DIR, `weather-all-${st.date}.png`), await channelLogo(browser));
    const lines = DIVISIONS.filter(d => data[d.name]).map(d => `• ${d.name}: ${data[d.name].temp}, ${data[d.name].condition}`).join('\n');
    const done = st.pages.all = st.pages.all || [];
    try { await postToFacebook(card, `আজকের আবহাওয়া, ৮ বিভাগ:\n${lines}\n\n${hashtags('আবহাওয়া', 'আজকের_আবহাওয়া', 'বাংলাদেশ')}`, '', done, browser, true); st.allDone = true; } finally { save(); }
  } catch (e) { event(`weather all FAILED: ${e.message}`); st.allDone = true; save(); } finally { await browser.close(); }
}

async function weatherTick() {
  if (process.env.WEATHER !== '1') return;
  const now = dhakaNow(), today = now.toISOString().slice(0, 10);
  let st = {};
  try { st = JSON.parse(fs.readFileSync(WEATHER_FILE, 'utf8')); } catch {}
  if (st.date !== today) st = { date: today, done: [], pages: {}, tries: {}, lastAt: 0 };
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), WEATHER_HOUR) - 6 * 3600e3;
  if (now.getUTCHours() >= 12 || Date.now() < Math.max(start, st.lastAt + WEATHER_GAP_MIN * 60e3)) return;
  const save = () => { fs.mkdirSync(path.dirname(WEATHER_FILE), { recursive: true }); fs.writeFileSync(WEATHER_FILE, JSON.stringify(st, null, 2)); };
  const d = DIVISIONS.find(x => !st.done.includes(x.name));
  if (!d) return LEAN && !DRY_RUN && !st.allDone ? weatherAllPost(st, save) : undefined;
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
      if (LEAN) await postStoriesOnly(card, done, browser);
      else try { await postToFacebook(card, `আজ ${d.name}-এর আবহাওয়া: ${w.condition}, এখন তাপমাত্রা ${w.temp}।${w.note ? `\n${w.note}` : ''}\n\n${hashtags('আবহাওয়া', `${d.name}_আবহাওয়া`, 'বাংলাদেশ')}`, '', done, browser, true); } finally { save(); }
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
  if (process.env.DEMO_WEATHER === 'skies') {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const browser = await chromium.launch();
    try {
      const preview = path.join(__dirname, 'preview');
      fs.mkdirSync(preview, { recursive: true });
      const w = await weatherFor(d);
      for (const sky of Object.keys(SKIES)) {
        const text = { sun: 'পরিষ্কার আকাশ', part: 'আংশিক মেঘলা আকাশ', cloud: 'মেঘলা আকাশ', fog: 'কুয়াশাচ্ছন্ন আকাশ', rain: 'বৃষ্টির সম্ভাবনা', storm: 'বজ্রসহ বৃষ্টির সম্ভাবনা' }[sky];
        const card = await makeWeatherCard(browser, { ...w, sky, condition: text }, path.join(OUT_DIR, `weather-sky-${sky}`));
        fs.copyFileSync(card, path.join(preview, `weather-sky-${sky}.png`));
      }
    } finally {
      await browser.close();
    }
    return;
  }
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
.logo{${FRAME ? 'order:9;' : ''}height:100px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.logo.txt{display:flex;align-items:center;padding:0 22px;font-size:48px;font-weight:800;color:#c8202f}
.ht{flex:1}.h1{font-size:64px;font-weight:800;line-height:1.1}.h2{font-size:34px;font-weight:700;color:#c8f7d4;margin-top:6px}
.moon{width:110px;height:110px}
.ftr{position:absolute;left:0;right:0;bottom:0;height:${FRAME ? 100 : 110}px;background:linear-gradient(135deg,#c8202f,#931624);border-top:8px solid #ffd54f;
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

// Whole day, all 8 divisions on one card (LEAN feed card).
function prayerAllCard(browser, outFile, logo) {
  const now = dhakaNow(), keys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const head = `<div class="r h"><span>বিভাগ</span>${keys.map(k => `<b>${prayerName(k, now)}</b>`).join('')}</div>`;
  const rows = DIVISIONS.map(d => { const t = timesFor(d, now); return `<div class="r"><span>${d.name}</span>${keys.map(k => `<b>${bnTime(t[k])}</b>`).join('')}</div>`; }).join('');
  return renderPrayerCard(browser, `
<div class="hdr">{LOGO}<div class="ht"><div class="h1">নামাজের সময়সূচি</div><div class="h2">${BN_DAYS[now.getUTCDay()]}, ${bnDate(now)} · ৮ বিভাগ</div></div>${MOON_SVG}</div>
<div class="tbl">${head}${rows}</div>
<div class="note">সূর্যোদয় (ঢাকা) ${bnTime(timesFor(DIVISIONS[0], now).sunrise)} · সময় আনুমানিক, স্থানীয় মসজিদে ১-২ মিনিট আলাদা হতে পারে</div>
<div class="ftr">www.utsabtv.com</div>`, `
.tbl{position:relative;margin:36px 40px 0;display:flex;flex-direction:column;gap:12px}
.r{display:grid;grid-template-columns:1.5fr repeat(5,1fr);align-items:center;background:rgba(255,255,255,.95);color:#0b5e2a;border-radius:18px;padding:12px 18px;
  font-size:36px;font-weight:800;box-shadow:0 6px 14px rgba(0,0,0,.2)}
.r b{text-align:center;color:#c8202f;font-size:36px}
.r.h{background:#c8202f;color:#fff;border:4px solid #ffd54f}.r.h b{color:#ffd54f;font-size:34px}
.note{position:relative;text-align:center;margin:22px 40px 0;font-size:27px;color:#c8f7d4}`, outFile, logo);
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
    if (nowH >= dhaka[k] - 0.5 && nowH < dhaka[k] - 0.5 + 20 / 60) { job = { tags: `${prayerGen(k, now)} নামাজের সময় হতে আর মাত্র ৩০ মিনিট বাকি। সবাই সময়মতো নামাজ আদায় করুন।\n\n${hashtags('নামাজ', 'নামাজের_সময়', k === 'fajr' ? 'ফজর' : '')}`, key: `rem-${k}`, done: () => st.rem.push(k), make: (b, f, l) => prayerReminderCard(b, k, f, l) }; break; }
  }
  const lead = Number(process.env.PRAYER_LEAD_MIN || 75) / 60, gap = Number(process.env.PRAYER_GAP_MIN || 4) * 60e3;
  if (!job && nowH >= dhaka.fajr - lead && nowH < dhaka.sunrise && Date.now() >= st.lastAt + gap) {
    const d = DIVISIONS.find(x => !st.sched.includes(x.name));
    if (!d && LEAN && !st.allDone) job = { feed: true, tags: `আজকের নামাজের সময়সূচি, ৮ বিভাগ (${BN_DAYS[now.getUTCDay()]}, ${bnDate(now)})। সময়মতো নামাজ আদায় করুন, অন্যদেরও মনে করিয়ে দিন।\n\n${hashtags('নামাজের_সময়সূচি', 'নামাজ', 'বাংলাদেশ')}`, key: 'sched-all', done: () => { st.allDone = true; }, make: (b, f, l) => prayerAllCard(b, f, l) };
    if (d) job = { tags: `আজ ${d.name} ও আশপাশের এলাকার নামাজের সময়সূচি। সময়মতো নামাজ আদায় করুন, অন্যদেরও মনে করিয়ে দিন।\n\n${hashtags('নামাজের_সময়সূচি', d.name)}`, key: `sched-${d.name}`, done: () => st.sched.push(d.name), make: (b, f, l) => prayerScheduleCard(b, d, f, l) };
  }
  if (!job) return;
  const save = () => { fs.mkdirSync(path.dirname(PRAYER_FILE), { recursive: true }); fs.writeFileSync(PRAYER_FILE, JSON.stringify(st, null, 2)); };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const card = await job.make(browser, path.join(OUT_DIR, `prayer-${job.key}.png`), await channelLogo(browser));
    const done = st.pages[job.key] = st.pages[job.key] || [];
    if (LEAN && !job.feed) { await postStoriesOnly(card, done, browser); job.done(); st.lastAt = Date.now(); save(); }
    else try { await postToFacebook(card, job.tags, '', done, browser, true); job.done(); } finally { st.lastAt = Date.now(); save(); }
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
// Team names stay in English on the cards (the Page prefers the English/Bengali mix); BN_TEAMS is kept for SPORTS_BN_NAMES=1.
const bnTeam = n => process.env.SPORTS_BN_NAMES !== '1' ? n : BN_TEAMS[n] || BN_TEAMS[n.replace(/ Women$/, '')] && `${BN_TEAMS[n.replace(/ Women$/, '')]} নারী` || n;
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
const bnOf = n => /[A-Za-z)]$/.test(n) ? `${n}-এর` : /[\u0995-\u09B9\u09CE]$/.test(n) ? `${n}ের` : `${n}র`;
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
        home: { name: bnTeam(H.team.displayName), short: bnTeam(H.team.shortDisplayName || H.team.displayName), en: H.team.displayName, logo: H.team.logo, score: H.score },
        away: { name: bnTeam(A.team.displayName), short: bnTeam(A.team.shortDisplayName || A.team.displayName), en: A.team.displayName, logo: A.team.logo, score: A.score },
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
.logo{${FRAME ? 'order:9;' : ''}height:100px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.3)}
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
    <div class="mt"><b>${m.home.short || m.home.name} <i>বনাম</i> ${m.away.short || m.away.name}</b><small>${m.league}</small></div><span class="tm">${bnClock(m.start)}</span></div>`).join('');
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
    if (s1) { const [k, , tag, line] = s1; job = { tags: `${tag}: ${m.home.en} বনাম ${m.away.en}${line ? `\n${line}` : ''}${m.league ? `\n${m.league}` : ''}\n\n${hashtags('খেলা', m.sport === 'cricket' ? 'ক্রিকেট' : 'ফুটবল', m.bd ? 'বাংলাদেশ' : '', m.home?.en, m.away?.en)}`, key: k, done: () => st.done.push(k), make: (b, f, l) => sportsResultCard(b, m, f, l, tag, line) }; break; }
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
    job = { tags: `আজকের খেলা:\n${list.map(x => `• ${x.home.en} বনাম ${x.away.en}`).join('\n')}\n\n${hashtags('খেলা', 'আজকের_খেলা', list.some(x => x.bd) ? 'বাংলাদেশ' : '')}`, key: `fixtures-${today}`, done: () => { st.fixtures = today; }, make: (b, f, l) => sportsFixturesCard(b, list, f, l) };
  }
  if (!job) {
    // LEAN: other countries' results only for big teams (BIG_CLUBS/BIG_NATIONS, full-member cricket), at most SPORTS_LEAN_MAX a day.
    const big = x => x.sport === 'cricket' || [x.home?.en, x.away?.en].some(n => BIG_CLUBS.includes(n) || BIG_NATIONS.includes(n));
    if (LEAN) {
      for (const x of all.filter(x => x.done && !x.bd && !big(x) && !st.done.includes(x.id))) st.done.push(x.id);
      st.leanDay = st.leanDay === today ? today : (st.leanCount = 0, today);
      if ((st.leanCount || 0) >= Number(process.env.SPORTS_LEAN_MAX || 6)) return save();
    }
    const m = all.find(x => x.done && !x.bd && !st.done.includes(x.id));
    if (!m) return save();
    if (LEAN) st.leanCount = (st.leanCount || 0) + 1;
    job = { tags: `ম্যাচ শেষ: ${m.home.en} বনাম ${m.away.en}${m.result ? `\n${m.result}` : ''}${m.league ? `\n${m.league}` : ''}\n\n${hashtags('খেলা', m.sport === 'cricket' ? 'ক্রিকেট' : 'ফুটবল', m.bd ? 'বাংলাদেশ' : '', m.home?.en, m.away?.en)}`, key: m.id, done: () => st.done.push(m.id), make: (b, f, l) => sportsResultCard(b, m, f, l) };
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const card = await job.make(browser, path.join(OUT_DIR, `sports-${job.key}.png`), await channelLogo(browser));
    const done = st.pages[job.key] = st.pages[job.key] || [];
    try { await postToFacebook(card, job.tags, '', done, browser, true); job.done(); delete st.pages[job.key]; } finally { st.lastAt = Date.now(); save(); }
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
  ['টলিউড', /টলিউড|টালিগঞ্জ|(?:^|\s)দেব |(?:^|\s)জিৎ|কোয়েল|শুভশ্রী|ঋতুপর্ণা|প্রসেনজিৎ|পরমব্রত|স্বস্তিকা|মিমি|নুসরাত জাহান|কলকাতার/],
  ['হলিউড', /হলিউড|Hollywood|অস্কার|মার্ভেল|টেলর সুইফট|কে-পপ|বিটিএস|ব্ল্যাকপিংক/],
  ['ঢালিউড', /ঢালিউড|শাকিব|অপু বিশ্বাস|বুবলী|পরীমণি|জয়া আহসান|মিম|চঞ্চল|আফরান নিশো|সিয়াম|মেহজাবীন|তাসনিয়া ফারিণ|ঢাকাই/],
  ['সিনেমা', /সিনেমা|চলচ্চিত্র|ছবির|ট্রেলার|বক্স অফিস/],
];
// Papers whose stories are used (others, mostly small sites, are skipped).
const ENT_SOURCES = /Prothom Alo|প্রথম আলো|Jugantor|যুগান্তর|Kaler Kantho|কালের কণ্ঠ|Samakal|সমকাল|bdnews24|Jagonews24|জাগো|Dhaka Post|ঢাকা পোস্ট|Channel i|Bangla Tribune|বাংলা ট্রিবিউন|Somoy|সময়|Ittefaq|ইত্তেফাক|Desh Rupantor|দেশ রূপান্তর|Daily Star|Bangladesh Pratidin|বাংলাদেশ প্রতিদিন|banglanews24|বাংলানিউজ|Ajker Patrika|আজকের পত্রিকা|Kalbela|কালবেলা|NTV|RTV|Jamuna|যমুনা|Independent|Ekattor|একাত্তর|DBC|Dhaka Times|ঢাকা টাইমস|Risingbd|রাইজিংবিডি|Manab Zamin|মানবজমিন|Naya Diganta|নয়া দিগন্ত|Inqilab|BBC|বিবিসি|Deutsche Welle|DW|Anandabazar|আনন্দবাজার|ABP Ananda|এবিপি|Sangbad Pratidin|সংবাদ প্রতিদিন|Ei Samay|এই সময়|Hindustan Times|Indian Express|Zee 24|জি ২৪|News18|TV9|Aajkaal|আজকাল|Bartaman|বর্তমান|Kolkata TV|Sangbad|Bangla Hunt|Bonik Barta|বণিক বার্তা|Business Standard|টিবিএস|Arthosuchak|অর্থসূচক|Sharebiz|শেয়ার বিজ|Financial Express|Techshohor|টেকশহর|Kaler Kantho|Bangladesh Post/i;
const entTag = (t, tags = ENT_TAGS, label = 'বিনোদন') => (tags.find(([, re]) => re.test(t)) || [label])[0];
// Word sets for spotting the same story from different papers.
const entWords = t => new Set(t.replace(/[^ঀ-৿A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2));
const entSame = (a, b) => { const A = entWords(a), B = entWords(b); let n = 0; for (const w of A) if (B.has(w)) n++; return n >= 3 && n / Math.min(A.size, B.size) >= 0.5; };

// Money and tech stories leak into the entertainment feeds (mostly the Indian ones); they go to their own desks instead.
const MONEY_RE = /শেয়ার|শেয়ার|পুঁজিবাজার|ব্যাঙ্ক|ব্যাংক|ব্রোকারেজ|সেনসেক্স|নিফটি|মিউচুয়াল ফান্ড/;
const TECH_RE = /স্মার্টফোন|মোবাইল ফোন|ফোন আন|ফোন লঞ্চ|ফোনের দাম|নতুন ফোন|দারুণ ফোন|পাওয়ার ব্যাঙ্ক|ব্যাটারি|চার্জে|প্রসেসর|ল্যাপটপ|গ্যাজেট|আইফোন|iPhone|স্যামসাং|Samsung|শাওমি|রিয়েলমি|ওয়ানপ্লাস|মটোরোলা|৫জি|5G/i;
const GN = q => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=bn&gl=BD&ceid=BD:bn`;
// Desks that share this pipeline. Each has its own feeds, label, tags, state file, on/off flag (env) and gap.
// BIZ=1: Bangladesh business (share market, banks, dollar, prices). TECH=1: technology (phones, AI, internet).
const DESKS = {
  ent: { key: 'ent', label: 'বিনোদন', flag: 'ENT', gapDef: 30, feeds: ENT_FEEDS, tags: ENT_TAGS, skip: t => MONEY_RE.test(t) || TECH_RE.test(t) },
  biz: { key: 'biz', label: 'অর্থনীতি', flag: 'BIZ', gapDef: 60, feeds: ['https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=bn&gl=BD&ceid=BD:bn', GN('শেয়ারবাজার')],
    tags: [['শেয়ারবাজার', /শেয়ার|শেয়ার|পুঁজিবাজার|ডিএসই|সিএসই|সূচক/], ['ব্যাংক', /ব্যাংক|ব্যাঙ্ক|ঋণ|সুদহার|আমানত/], ['ডলার', /ডলার|রেমিট্যান্স|রিজার্ভ|টাকার মান/],
      ['বাজার', /দাম|বাজারে|মূল্য|সয়াবিন|চাল|পেঁয়াজ/], ['বাজেট', /বাজেট|রাজস্ব|ভ্যাট|এনবিআর/], ['রপ্তানি', /রপ্তানি|আমদানি|পোশাক খাত|তৈরি পোশাক/]] },
  tech: { key: 'tech', label: 'প্রযুক্তি', flag: 'TECH', gapDef: 60, feeds: ['https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=bn&gl=BD&ceid=BD:bn',
    'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=bn&gl=IN&ceid=IN:bn', GN('প্রযুক্তি'), GN('স্মার্টফোন'), GN('এআই')],
    // The searches bring in politics too, so a tech story must name something techy.
    need: /ফোন|মোবাইল|এআই|কৃত্রিম বুদ্ধিমত্তা|চ্যাটজিপিটি|ইন্টারনেট|ফেসবুক|হোয়াটসঅ্যাপ|ইউটিউব|গুগল|অ্যাপ|ল্যাপটপ|গ্যাজেট|প্রযুক্তি|স্টার্টআপ|সাইবার|ডিজিটাল|নাসা|মহাকাশ|স্যাটেলাইট|রোবট|iPhone|AI/i,
    tags: [['মোবাইল', /ফোন|মোবাইল|আইফোন|iPhone|স্যামসাং|শাওমি/i], ['এআই', /এআই|AI|কৃত্রিম বুদ্ধিমত্তা|চ্যাটজিপিটি|ChatGPT|জেমিনি/], ['ইন্টারনেট', /ইন্টারনেট|ফেসবুক|হোয়াটসঅ্যাপ|ইউটিউব|ইনস্টাগ্রাম|টিকটক|গুগল|অ্যাপ/],
      ['গ্যাজেট', /ল্যাপটপ|গ্যাজেট|স্মার্টওয়াচ|ঘড়ি|ক্যামেরা|টিভি/], ['মহাকাশ', /নাসা|মহাকাশ|রকেট|স্যাটেলাইট|স্পেসএক্স/]] },
};
for (const d of Object.values(DESKS)) d.file = path.join(__dirname, 'state', `${d.key}.json`);

async function entItems(desk = DESKS.ent) {
  const out = [];
  for (const u of desk.feeds) {
    let xml = '';
    try { xml = await (await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } })).text(); } catch { continue; }
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const g = tag => decodeEntities((m[1].match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`)) || [])[1] || '');
      const raw = g('title'), source = g('source') || raw.split(' - ').pop();
      const title = raw.replace(/\s+-\s+[^-]+$/, '').replace(/\s*\|\s*[^|]+$/, '').replace(/\s+/g, ' ').trim(); // drop " - Source" and " | Hindustan Times Bangla"
      if (/live (news )?updates?|লাইভ আপডেট|^[A-Za-z0-9 ,.'’-]+:/i.test(title)) continue; // live blogs and English-prefixed titles
      if (desk.skip && desk.skip(title)) continue;
      if (desk.need && !desk.need.test(title)) continue;
      out.push({ id: g('guid') || g('link'), link: g('link'), title, source, at: Date.parse(g('pubDate')) || 0 });
    }
  }
  return out.sort((a, b) => b.at - a.at);
}
// Opens the Google News link in the browser (it forwards to the paper) and reads the paper's photo.
// Up to ~2-3 sentences (ENT_SUMMARY_MAX chars), cut at a sentence end. Empty when nothing says more than the headline.
function entSummary(title, desc, paras) {
  const max = Number(process.env.ENT_SUMMARY_MAX || 420);
  const plain = t => t.replace(/[^ঀ-৿A-Za-z0-9]/g, '');
  let text = desc.trim();
  if (text.length < 80 || plain(text) === plain(title) || plain(title).includes(plain(text))) text = '';
  for (const p of paras) { if (text.length >= 200) break; if (!text.includes(p.slice(0, 40))) text = (text ? text + ' ' : '') + p; }
  if (text.length > max) { const cut = text.slice(0, max); const end = Math.max(cut.lastIndexOf('।'), cut.lastIndexOf('?'), cut.lastIndexOf('!'), cut.lastIndexOf('. ')); text = end > 120 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…'; }
  text = text.replace(/\s*ছবি\s*:\s*\S+\s*/g, ' ').replace(/\s+/g, ' ').trim(); // photo credits ("ছবি: পিএমও")
  // Papers often clip their description mid-sentence; end on the last full sentence instead.
  if (!/[।?!.…'’"]$/.test(text)) { const end = Math.max(text.lastIndexOf('।'), text.lastIndexOf('?'), text.lastIndexOf('!')); text = end > 80 ? text.slice(0, end + 1) : text ? text + '…' : ''; }
  return text;
}
// One prompt to the AI writer (GEMINI_API_KEY, else ANTHROPIC_API_KEY); throws when none answers.
async function aiAsk(prompt, temperature = 0.7) {
  let out = '';
  if (process.env.GEMINI_API_KEY) {
    // Google's newest models are often overloaded (503) or slow, so the next one is tried on any failure.
    const errs = [];
    for (const model of (process.env.AI_MODEL || 'gemini-3.5-flash,gemini-3.1-flash-lite,gemini-3-flash-preview,gemini-3.8-flash').split(',')) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST', signal: AbortSignal.timeout(30000), headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature } }) });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(`${res.status} ${body.error?.message || ''}`.slice(0, 120));
        out = body.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text).join('') || '';
        if (out) break;
      } catch (e) { errs.push(`${model}: ${e.message}`); }
    }
    if (!out) throw new Error(`Gemini: ${errs.join(' | ')}`);
  } else if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: AbortSignal.timeout(60000), headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 800, temperature, messages: [{ role: 'user', content: prompt }] }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Claude: ${JSON.stringify(body.error || body).slice(0, 200)}`);
    out = (body.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  } else throw new Error('no AI key');
  return out;
}
// Rewrites a paper's summary in our own words (GEMINI_API_KEY, else ANTHROPIC_API_KEY), so no paper's text is copied.
// Returns '' without a key or on any failure: the post then goes out without a summary.
let entRewriteNote = '';
async function entRewrite(title, text) {
  if (!text) return '';
  entRewriteNote = '';
  const prompt = `নিচের খবরের সারাংশটি সম্পূর্ণ নিজের ভাষায় নতুন করে লেখো, যাতে মূল লেখার কোনো বাক্য বা লম্বা অংশ হুবহু না থাকে।
নিয়ম: বাংলায়, ২-৩টি ছোট বাক্যে, সর্বোচ্চ ৪০০ অক্ষর। শুধু মূল লেখায় থাকা তথ্য রাখো, নতুন কিছু যোগ করবে না, মতামত দেবে না।
শিরোনামে প্রশ্ন থাকলে সারাংশে তার উত্তরটা পরিষ্কার করে দাও। কোনো পত্রিকা, ওয়েবসাইট বা সাংবাদিকের নাম লিখবে না। কোনো হ্যাশট্যাগ, ইমোজি বা লিংক দেবে না।
শুধু নতুন সারাংশটা লেখো, আর কিছু না।

শিরোনাম: ${title}
মূল সারাংশ: ${text}`;
  if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) { entRewriteNote = 'no AI key'; return ''; }
  try {
    let out = await aiAsk(prompt);
    out = out.replace(/\s+/g, ' ').replace(/^["“'‘]|["”'’]$/g, '').trim();
    // Guard: anything still sharing a long run of words with the original is dropped.
    const w = text.split(/\s+/), o = ` ${out} `;
    for (let i = 0; i + 8 <= w.length; i++) if (o.includes(` ${w.slice(i, i + 8).join(' ')} `)) { entRewriteNote = `copied: ${out.slice(0, 200)}`; return ''; }
    if (out.length <= 40) entRewriteNote = `short: ${out}`;
    return out.length > 40 ? out : '';
  } catch (e) { entRewriteNote = e.message; log('ent rewrite failed:', e.message); return ''; }
}
async function entResolve(browser, it) {
  const pg = await browser.newPage();
  try {
    await pg.goto(it.link, { waitUntil: 'domcontentloaded', timeout: 45000 });
    for (let i = 0; i < 20 && /news\.google\.com/.test(pg.url()); i++) await pg.waitForTimeout(500);
    await pg.waitForTimeout(1500);
    const html = await pg.content();
    // Prothom Alo-style share images put the paper's logo strip on the photo through overlay=… parameters; without them it is the bare photo.
    const image = (meta(html, 'og:image') || meta(html, 'twitter:image')).replace(/&(amp;)?overlay[a-z_]*=[^&]*/gi, '');
    // A short summary for the post caption: the paper's own description, or else its opening paragraphs.
    const paras = await pg.evaluate(() => [...document.querySelectorAll('article p, main p, .content p, p')]
      .map(p => p.innerText.replace(/\s+/g, ' ').trim()).filter(t => t.length > 60 && /[ঀ-৿]/.test(t)).slice(0, 3)).catch(() => []);
    return { url: pg.url(), image: image && !/logo|default|placeholder/i.test(image) ? new URL(image, pg.url()).href : '',
      summary: entSummary(it.title, decodeEntities(meta(html, 'og:description') || meta(html, 'description') || ''), paras) };
  } catch (e) { log('ent resolve failed:', it.link, e.message); return { url: '', image: '', summary: '' }; } finally { await pg.close(); }
}
// Most Bangladeshi papers stamp a branded strip (logo, "First with the news 24/7", …) along the bottom of their
// og:image. entCard cuts it off: at a sharp full-width horizontal edge in the bottom 32% when there is one, otherwise
// the bottom ENT_CROP (15%) for every source not in ENT_CLEAN.
const ENT_CLEAN = /Anandabazar|আনন্দবাজার|ABP|এবিপি|Sangbad Pratidin|সংবাদ প্রতিদিন|Ei Samay|এই সময়|Hindustan Times|Indian Express|Zee 24|জি ২৪|News18|TV9|Aajkaal|আজকাল|Bartaman|বর্তমান|BBC|বিবিসি|Deutsche Welle|DW/i;
async function entPhoto(pg, url, branded) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`image ${r.status}`);
  const src = `data:${r.headers.get('content-type') || 'image/jpeg'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
  return pg.evaluate(async ([src, fallback]) => {
    const img = new Image(); img.src = src; await img.decode();
    const W = 400, H = Math.round(img.naturalHeight * W / img.naturalWidth);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data, lum = (px, py) => { const i = (py * W + px) * 4; return d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; };
    let best = 0, cut = H;
    for (let y = Math.round(H * .68); y < H - 3; y++) {
      let n = 0; for (let px = 0; px < W; px++) if (Math.abs(lum(px, y) - lum(px, y - 2)) > 22) n++;
      if (n / W > best) { best = n / W; cut = y - 2; }
    }
    if (best < .7) cut = fallback ? Math.round(H * (1 - fallback)) : H;
    const sy = Math.round(cut * img.naturalHeight / H), o = document.createElement('canvas');
    o.width = img.naturalWidth; o.height = sy; o.getContext('2d').drawImage(img, 0, 0);
    return o.toDataURL('image/jpeg', .92);
  }, [src, branded ? Number(process.env.ENT_CROP || .15) : 0]);
}
async function entCard(browser, it, outFile, logo) {
  const logoImg = logo ? `<img class="logo" src="${logo}">` : `<div class="logo txt">উৎসব TV</div>`;
  const len = [...it.title].length, fs1 = len > 90 ? 50 : len > 65 ? 56 : len > 45 ? 62 : 70;
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  let photo = it.image;
  try { photo = await entPhoto(pg, it.image, !ENT_CLEAN.test(it.source || '')); } catch (e) { console.log(`ent photo crop skipped: ${e.message}`); }
  await pg.setContent(`<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700;800;900&family=Noto+Serif:wght@700;800;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:'Noto Serif Bengali','Noto Serif',serif;font-weight:700;color:#fff;background:#0b0b10;position:relative}
.ph{position:absolute;left:0;right:0;top:0;height:820px;background:#222 center/cover no-repeat;background-image:url('${photo}')}
.ph:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35) 0,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 60%,#0b5e2a 100%)}
.logo{position:absolute;right:40px;top:36px;height:96px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.35);z-index:2}
.logo.txt{display:flex;align-items:center;padding:0 22px;font-size:44px;font-weight:800;color:#c8202f}
.badge{position:absolute;left:40px;top:44px;z-index:2;display:flex;gap:0;border-radius:40px;overflow:hidden;border:4px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.badge span{padding:4px 22px;font-size:34px;font-weight:800}.badge .a{background:#c8202f}.badge .b{background:#ffd54f;color:#7a1020}
.body{position:absolute;left:0;right:0;top:800px;bottom:100px;background:linear-gradient(180deg,#0b5e2a 0,#063d1b 100%);padding:34px 56px 0;display:flex;flex-direction:column}
.bar{width:140px;height:10px;background:#ffd54f;border-radius:6px;margin-bottom:22px}
.hl{font-size:${fs1}px;font-weight:800;line-height:1.38;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.meta{margin-top:auto;margin-bottom:26px;display:flex;justify-content:space-between;font-size:30px;color:#c8f7d4}
.ftr{position:absolute;left:0;right:0;bottom:0;height:100px;background:linear-gradient(135deg,#c8202f,#931624);border-top:8px solid #ffd54f;
  display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:800}
</style>
<div class="ph"></div>${logoImg}<div class="badge"><span class="a">${it.label || 'বিনোদন'}</span>${it.tag !== (it.label || 'বিনোদন') ? `<span class="b">${it.tag}</span>` : ''}</div>
<div class="body"><div class="bar"></div><div class="hl">${it.title.replace(/</g, '&lt;')}</div>
<div class="meta"><span>${bnDate(dhakaNow())}</span></div></div>
<div class="ftr">www.utsabtv.com</div>`, { waitUntil: 'networkidle', timeout: 60000 });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: outFile });
  await pg.close();
  return outFile;
}

// A paper's stock share image (its logo or name on a plain background) is not a news photo and must never go on our card.
// The vision model looks at the photo; without a key or on an error the photo is kept.
async function entBranded(url, source = '') {
  if (!process.env.GEMINI_API_KEY) return false;
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
    const buf = Buffer.from(await res.arrayBuffer()), mime = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
    for (const model of ['gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.5-flash']) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(60000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: mime, data: buf.toString('base64') } },
          { text: `Is this image mainly the logo or name of a NEWS PUBLISHER (a newspaper, TV channel or news website, such as ${source || 'Prothom Alo, Jugantor or bdnews24'}) used as a default share picture, or a blank placeholder? Answer NO when it is a real photo, even a photo of the logo of the company or thing the story is about (for example OpenAI, Apple or a bank), or a photo with only a small watermark. Answer only YES or NO.` }] }] }) }).catch(() => null);
      const b = r ? await r.json().catch(() => ({})) : {};
      const a = (b.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim().toUpperCase();
      if (a) return a.startsWith('YES');
    }
  } catch (e) { log('ent brand check failed:', e.message); }
  return false;
}
// Same story from another trusted paper, for its photo when the first paper had none of its own.
async function entOtherPhoto(browser, it) {
  const alts = (await entItems({ feeds: [GN(it.title)] })).filter(x => x.link !== it.link && ENT_SOURCES.test(x.source) && entSame(x.title, it.title));
  for (const x of alts.slice(0, 4)) {
    const r = await entResolve(browser, x);
    if (r.image && !await entBranded(r.image, x.source)) return r.image;
  }
  return '';
}
async function entTick(desk = DESKS.ent) {
  if (process.env[desk.flag] !== '1') return false;
  let st = {};
  try { st = JSON.parse(fs.readFileSync(desk.file, 'utf8')); } catch {}
  const first = !st.seen;
  st.seen = st.seen || []; st.titles = st.titles || []; st.lastAt = st.lastAt || 0; st.pages = st.pages || {};
  const save = () => { st.seen = st.seen.slice(-600); st.titles = st.titles.slice(-150); fs.mkdirSync(path.dirname(desk.file), { recursive: true }); fs.writeFileSync(desk.file, JSON.stringify(st, null, 2)); };
  const h = dhakaNow().getUTCHours();
  if (!first && (h < Number(process.env.ENT_FROM_HOUR || 8) || h >= Number(process.env.ENT_TO_HOUR || 24))) return;
  if (Date.now() < st.lastAt + Number(process.env[`${desk.flag}_GAP_MIN`] || desk.gapDef) * 60e3) return false;
  const items = await entItems(desk);
  if (first) { st.seen = items.map(i => i.id); save(); log(`${desk.key}: first run, ${items.length} stories marked seen`); return false; }
  const fresh = items.filter(i => !st.seen.includes(i.id) && Date.now() - i.at < 6 * 3600e3 && ENT_SOURCES.test(i.source));
  if (!fresh.length) return false;
  let posted = false;
  const others = Object.values(DESKS).filter(d => d !== desk).flatMap(d => { try { return JSON.parse(fs.readFileSync(d.file, 'utf8')).titles || []; } catch { return []; } });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const it of fresh.slice(0, 6)) {
      st.seen.push(it.id);
      if (st.titles.concat(others).some(t => entSame(t, it.title))) continue; // already posted from another paper or desk
      const r = await entResolve(browser, it);
      if (r.image && await entBranded(r.image, it.source)) r.image = '';
      if (!r.image) r.image = await entOtherPhoto(browser, it).catch(() => '');
      if (!r.image) { log(`${desk.key}: no photo, skipped:`, it.title); continue; }
      // A question headline means nothing on its own, so it needs a summary to go with it.
      r.summary = await entRewrite(it.title, r.summary);
      if (/[?？]/.test(it.title) && !r.summary) { log(`${desk.key}: question headline with no summary, skipped:`, it.title); continue; }
      Object.assign(it, r, { tag: entTag(it.title, desk.tags, desk.label), label: desk.label });
      const card = await entCard(browser, it, path.join(OUT_DIR, `${desk.key}-${st.seen.length}.png`), await channelLogo(browser));
      const done = st.pages[it.id] = st.pages[it.id] || [];
      try { await postToFacebook(card, [it.title, it.summary, hashtags(desk.label, it.tag)].filter(Boolean).join('\n\n'), '', done, browser, true); st.titles.push(it.title); delete st.pages[it.id]; posted = true; }
      catch (e) { event(`${desk.key} FAILED: ${e.message}`); }
      finally { st.lastAt = Date.now(); }
      break;
    }
  } finally {
    save();
    await browser.close();
  }
  return posted;
}

// DEMO_ENT=1: cards for the 4 newest different stories into ./preview. Posts nothing.
async function entDemo(desk = DESKS.ent, n = 4) {
  const items = await entItems(desk);
  const preview = path.join(__dirname, 'preview');
  fs.mkdirSync(preview, { recursive: true });
  const browser = await chromium.launch();
  const made = [];
  try {
    const logo = await channelLogo(browser);
    for (const it of items) {
      if (made.length >= n) break;
      if (!ENT_SOURCES.test(it.source) || made.some(m => entSame(m.title, it.title))) continue;
      const r = await entResolve(browser, it);
      if (r.image && await entBranded(r.image, it.source)) r.image = '';
      if (!r.image) r.image = await entOtherPhoto(browser, it).catch(() => '');
      if (!r.image) continue;
      r.orig = r.summary; r.summary = await entRewrite(it.title, r.summary); r.note = entRewriteNote;
      Object.assign(it, r, { tag: entTag(it.title, desk.tags, desk.label), label: desk.label });
      await entCard(browser, it, path.join(preview, `${desk.key}-demo-${made.length + 1}.png`), logo);
      made.push(it);
    }
    fs.writeFileSync(path.join(preview, `${desk.key}-demo.json`), JSON.stringify({ total: items.length, made: made.map(m => ({ title: m.title, source: m.source, tag: m.tag, url: m.url, orig: m.orig, summary: m.summary, note: m.note })) }, null, 2));
  } finally {
    await browser.close();
  }
}

// ------------------------------------------------------------------ good morning card
// GM=1: at GM_HOUR:GM_MIN Dhaka time, a "শুভ সকাল" card with the English, Bangla (Bangladesh's revised
// calendar: 1 Boishakh = 14 April) and Hijri dates. Hijri is Umm al-Qura moved by HIJRI_OFFSET days
// (Bangladesh usually runs a day behind Saudi Arabia). State: state/gm.json.
const GM_FILE = path.join(__dirname, 'state', 'gm.json');
const BANGLA_MONTHS = ['বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'];
const BANGLA_SEASONS = ['গ্রীষ্মকাল', 'বর্ষাকাল', 'শরৎকাল', 'হেমন্তকাল', 'শীতকাল', 'বসন্তকাল'];
const HIJRI_MONTHS = ['মহররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'];
// d: a Date whose UTC fields are the Dhaka calendar day.
function banglaDate(d) {
  const y = d.getUTCFullYear(), day0 = Date.UTC(y, d.getUTCMonth(), d.getUTCDate());
  let start = Date.UTC(y, 3, 14), by = y - 593;
  if (day0 < start) { start = Date.UTC(y - 1, 3, 14); by = y - 594; }
  const gy = new Date(start).getUTCFullYear() + 1; // Falgun falls in this Gregorian year
  const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const len = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, leap ? 30 : 29, 30];
  let n = Math.round((day0 - start) / 864e5), m = 0;
  while (n >= len[m]) n -= len[m++];
  return { day: n + 1, month: BANGLA_MONTHS[m], year: by, season: BANGLA_SEASONS[Math.floor(m / 2)] };
}
function hijriDate(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12) + Number(process.env.HIJRI_OFFSET ?? -1) * 864e5);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .formatToParts(t).map(x => [x.type, x.value]));
  return { day: Number(p.day), month: HIJRI_MONTHS[Number(p.month) - 1], year: Number(String(p.year).replace(/\D/g, '')) };
}
async function goodMorningCard(browser, outFile, logo, now = dhakaNow()) {
  const b = banglaDate(now), h = hijriDate(now);
  const logoImg = logo ? `<img class="logo" src="${logo}">` : `<div class="logo txt">উৎসব TV</div>`;
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.setContent(`<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700;800;900&family=Noto+Serif:wght@700;800;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:'Noto Serif Bengali','Noto Serif',serif;font-weight:700;color:#fff;position:relative;
  background:linear-gradient(180deg,#ff9a3c 0%,#ffc56b 30%,#ffe6a8 52%,#9fd8a8 74%,#0b5e2a 100%)}
.sun{position:absolute;left:50%;top:330px;width:420px;height:420px;margin-left:-210px;border-radius:50%;
  background:radial-gradient(circle at 45% 40%,#fffde7 0,#ffeb3b 45%,#ff9800 100%);box-shadow:0 0 120px 60px rgba(255,213,79,.6)}
.rays{position:absolute;left:50%;top:540px;width:1400px;height:1400px;margin:-700px 0 0 -700px;opacity:.28;
  background:repeating-conic-gradient(from 0deg,#fff 0 6deg,transparent 6deg 18deg);-webkit-mask:radial-gradient(circle,#000 0,transparent 60%)}
.hill{position:absolute;left:-10%;right:-10%;border-radius:50% 50% 0 0}
.h1{top:640px;height:700px;background:#2e9b55}.h2{top:700px;height:700px;left:30%;right:-40%;background:#1f8447}
.bird{position:absolute;font-size:46px;color:#7a3b00;opacity:.7}
.logo{position:absolute;right:46px;top:44px;height:104px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.25);z-index:3}
.logo.txt{display:flex;align-items:center;padding:0 22px;font-size:46px;font-weight:800;color:#c8202f}
.title{position:absolute;left:0;right:0;top:120px;text-align:center;font-size:150px;font-weight:900;color:#b3141f;
  text-shadow:0 6px 0 #fff,0 12px 30px rgba(120,40,0,.35);z-index:3}
.day{position:absolute;left:0;right:0;top:330px;text-align:center;z-index:3}
.day span{display:inline-block;background:#c8202f;border:5px solid #fff;border-radius:60px;padding:6px 50px;font-size:56px;font-weight:800;box-shadow:0 10px 24px rgba(0,0,0,.25)}
.panel{position:absolute;left:70px;right:70px;top:640px;background:rgba(255,255,255,.95);border-radius:36px;border-top:12px solid #0b5e2a;
  box-shadow:0 24px 60px rgba(0,0,0,.3);padding:26px 46px;z-index:3;color:#0b5e2a}
.row{display:flex;align-items:center;justify-content:space-between;padding:20px 0;border-bottom:3px dashed #cfe3d5}
.row:last-child{border-bottom:0}
.row small{font-size:38px;color:#557a62;font-weight:700}.row b{font-size:54px;font-weight:900;color:#0b5e2a}.row b.r{color:#c8202f}
.ftr{position:absolute;left:0;right:0;bottom:0;height:${FRAME ? 100 : 110}px;background:linear-gradient(135deg,#c8202f,#931624);border-top:8px solid #ffd54f;
  display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:800;z-index:3}
</style>
<div class="rays"></div><div class="sun"></div><div class="hill h1"></div><div class="hill h2"></div>
<div class="bird" style="left:170px;top:470px">︶︶</div><div class="bird" style="left:820px;top:430px">︶</div>
${logoImg}<div class="title">শুভ সকাল</div>
<div class="day"><span>আজ ${BN_DAYS[now.getUTCDay()]}</span></div>
<div class="panel">
  <div class="row"><small>ইংরেজি</small><b>${bnDate(now)}</b></div>
  <div class="row"><small>বাংলা</small><b class="r">${bn(b.day)} ${b.month} ${bn(b.year)}</b></div>
  <div class="row"><small>হিজরি</small><b>${bn(h.day)} ${h.month} ${bn(h.year)}</b></div>
  <div class="row"><small>ঋতু</small><b class="r">${b.season}</b></div>
</div>
<div class="ftr">www.utsabtv.com</div>`, { waitUntil: 'networkidle', timeout: 60000 });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: outFile });
  await pg.close();
  return outFile;
}
async function gmTick() {
  if (process.env.GM !== '1') return;
  const now = dhakaNow(), today = now.toISOString().slice(0, 10);
  const at = Number(process.env.GM_HOUR || 6) * 60 + Number(process.env.GM_MIN || 30), mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (mins < at || mins > at + 90) return;
  let st = {};
  try { st = JSON.parse(fs.readFileSync(GM_FILE, 'utf8')); } catch {}
  if (st.date !== today) st = { date: today, pages: [] };
  if (st.done) return;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const save = () => { fs.mkdirSync(path.dirname(GM_FILE), { recursive: true }); fs.writeFileSync(GM_FILE, JSON.stringify(st, null, 2)); };
  try {
    const card = await goodMorningCard(browser, path.join(OUT_DIR, `gm-${today}.png`), await channelLogo(browser));
    try { await postToFacebook(card, (() => { const n = dhakaNow(), b = banglaDate(n), h = hijriDate(n); return `শুভ সকাল! আজ ${bnDate(n)}, ${bn(b.day)} ${b.month} ${bn(b.year)} বঙ্গাব্দ, ${bn(h.day)} ${h.month} ${bn(h.year)} হিজরি। সবার দিনটা ভালো কাটুক।\n\n${hashtags('শুভ_সকাল', 'আজকের_তারিখ')}`; })(), '', st.pages, browser, true); st.done = true; } finally { save(); }
  } catch (e) { event(`good morning FAILED: ${e.message}`); } finally { await browser.close(); }
}

// ------------------------------------------------------------------ missing children (MUN Alert)
// MUN=1: new missing-child reports from MUN Alert (munalert.org, Bangladesh's missing child alert system),
// only those its team has approved, become a "নিখোঁজ সংবাদ" card on every Page (MUN_GAP_MIN apart). When one of
// those is later marked resolved/found, an "উদ্ধার হয়েছে" card follows.
// State: state/mun.json ({seen, watch, recovered: [report ids], lastAt, checkedAt}).
const MUN_FILE = path.join(__dirname, 'state', 'mun.json');
const MUN_SITE = 'https://munalert.org';
async function munReports() {
  const r = await fetch(`${MUN_SITE}/api/reports`, { headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' } });
  if (!r.ok) throw new Error(`MUN Alert ${r.status}`);
  return (await r.json()).filter(x => x.type === 'missing' && x.imageUrl).sort((a, b) => Date.parse(b.reportedAt) - Date.parse(a.reportedAt));
}
const munActive = x => x.status === 'active' && x.approved;
const munRecovered = x => x.status === 'resolved' || x.status === 'found';
const munEsc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
// kind 'found': the "উদ্ধার হয়েছে" (recovered) version, in green, with a thank-you instead of the contact number.
// kind 'dead': the "মৃতদেহ উদ্ধার" version, in black and grey, with a condolence line.
const MUN_DEAD = /মৃত|লাশ|মরদেহ|deceased|dead body/i;
async function munCard(browser, rep, outFile, logo, kind = 'missing') {
  const found = kind !== 'missing', dead = kind === 'dead';
  const img = await fetch(MUN_SITE + rep.imageUrl, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!img.ok) throw new Error(`photo ${img.status}`);
  const photo = `data:${img.headers.get('content-type') || 'image/jpeg'};base64,${Buffer.from(await img.arrayBuffer()).toString('base64')}`;
  const gender = /^f/i.test(rep.gender) ? 'মেয়ে' : /^m/i.test(rep.gender) ? 'ছেলে' : '';
  const rows = [['বয়স', `${bn(rep.age)} বছর${gender ? ` (${gender})` : ''}`], [found ? 'নিখোঁজ হয়েছিল' : 'নিখোঁজের সময়', String(rep.date || '').replace(/ এ /, ', ')],
    ['শেষ দেখা গেছে', rep.lastSeen], ['জেলা', String(rep.district || '').replace(/^\w/, c => c.toUpperCase())], ['বিস্তারিত', found ? '' : rep.description || rep.additionalDetails]].filter(([, v]) => v);
  const [c1, c2] = dead ? ['#3a3a3a', '#1c1c1c'] : found ? ['#1b8a4b', '#136b39'] : ['#c8202f', '#a3141f'];
  const logoImg = logo ? `<img class="logo" src="${logo}">` : '';
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.setContent(`<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700;800;900&family=Noto+Serif:wght@700;800;900&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:'Noto Serif Bengali','Noto Serif',serif;font-weight:700;position:relative;background:#fff6e5}
.top{position:absolute;left:0;right:0;top:0;height:250px;background:repeating-linear-gradient(135deg,${c1} 0 40px,${c2} 40px 80px);border-bottom:10px solid #111}
.logo{position:absolute;right:40px;top:36px;height:96px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.title{position:absolute;left:40px;top:40px;font-size:120px;font-weight:900;color:#fff;text-shadow:0 6px 0 #111;letter-spacing:2px}
.sub{position:absolute;left:46px;top:186px;background:#111;color:#ffd54f;padding:2px 22px;border-radius:10px;font-size:36px;font-weight:800}
.ph{position:absolute;left:50px;top:300px;width:420px;height:520px;border:10px solid #111;border-radius:18px;background:#d9d9d9 center/cover no-repeat;box-shadow:0 18px 40px rgba(0,0,0,.25)}
.name{flex:none;margin:0 0 6px;font-size:${[...rep.name].length > 18 ? 44 : 60}px;font-weight:900;color:${c2};line-height:1.15}
.info{position:absolute;left:510px;right:40px;top:296px;bottom:470px;display:flex;flex-direction:column;gap:10px;overflow:hidden}
.info div{flex:none;display:flex;align-items:center;gap:14px;border-left:8px solid ${c1};background:#fff;padding:10px 18px;border-radius:0 14px 14px 0;box-shadow:0 4px 12px rgba(0,0,0,.08)}
.info small{flex:none;width:130px;font-size:22px;color:#7a5c00;line-height:1.2}
.info b{font-size:26px;color:#111;font-weight:800;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ask{position:absolute;left:50px;right:50px;top:880px;text-align:center;font-size:42px;color:#111;font-weight:800;line-height:1.4}
.ask span{color:${c1}}
.call{position:absolute;left:50px;right:50px;top:1035px;height:170px;background:#111;border-radius:30px;border:8px solid #ffd54f;display:flex;flex-direction:column;align-items:center;justify-content:center}
.call small{font-size:34px;color:#ffd54f;line-height:1.3}.call b{font-size:80px;color:#fff;font-weight:900;letter-spacing:2px;line-height:1.25}
.ftr{position:absolute;left:0;right:0;bottom:0;height:100px;background:linear-gradient(135deg,${c1},${c2});border-top:8px solid #ffd54f;display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:800;color:#fff}
</style>
<div class="top"></div><div class="title">${dead ? 'মৃতদেহ উদ্ধার' : found ? 'উদ্ধার হয়েছে' : 'নিখোঁজ সংবাদ'}</div><div class="sub">${dead ? 'শোক সংবাদ' : found ? 'সুখবর' : 'সন্ধান চাই'}</div>${logoImg}
<div class="ph" style="background-image:url('${photo}')"></div>
<div class="info"><p class="name">${munEsc(rep.name)}</p>${rows.map(([k, v]) => `<div><small>${k}</small><b>${munEsc(v)}</b></div>`).join('')}</div>
${dead ? `<div class="ask">নিখোঁজ শিশুটির <span>মৃতদেহ উদ্ধার</span> করা হয়েছে<br>আমরা গভীরভাবে শোকাহত</div>
<div class="call"><small>মহান আল্লাহ তাকে জান্নাত দান করুন</small><b style="font-size:46px">ইন্না লিল্লাহি ওয়া ইন্না ইলাইহি রাজিউন</b></div>` : found ? `<div class="ask">নিখোঁজ শিশুটিকে <span>খুঁজে পাওয়া গেছে</span><br>MUN Alert এটি নিশ্চিত করেছে</div>
<div class="call"><small>যারা শেয়ার করে পাশে ছিলেন</small><b style="font-size:66px">সবাইকে ধন্যবাদ</b></div>` : `<div class="ask">কেউ সন্ধান পেলে <span>দয়া করে নিচের নম্বরে</span><br>যোগাযোগ করুন</div>
<div class="call"><small>${munEsc(rep.contactName || 'যোগাযোগ')}</small><b>${bn(String(rep.contactPhone || '১৩২১৯').replace(/^\+88/, ''))}</b></div>`}
<div class="ftr">www.utsabtv.com</div>`, { waitUntil: 'networkidle', timeout: 60000 });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: outFile });
  await pg.close();
  return outFile;
}
async function munTick() {
  if (process.env.MUN !== '1') return;
  let st = {};
  try { st = JSON.parse(fs.readFileSync(MUN_FILE, 'utf8')); } catch {}
  const first = !st.seen;
  st.seen = st.seen || []; st.lastAt = st.lastAt || 0; st.pages = st.pages || {}; st.recovered = st.recovered || [];
  const save = () => { st.seen = st.seen.slice(-500); st.recovered = st.recovered.slice(-500); fs.mkdirSync(path.dirname(MUN_FILE), { recursive: true }); fs.writeFileSync(MUN_FILE, JSON.stringify(st, null, 2)); };
  if (Date.now() < st.lastAt + Number(process.env.MUN_GAP_MIN || 5) * 60e3) return;
  // Look for new reports every MUN_CHECK_MIN minutes.
  if (Date.now() < (st.checkedAt || 0) + Number(process.env.MUN_CHECK_MIN || 5) * 60e3 - 30e3) return;
  st.checkedAt = Date.now();
  const all = await munReports();
  const list = all.filter(munActive);
  // First run: older reports are left out; only those from the last MUN_FIRST_HOURS hours are posted.
  if (first) st.seen = list.filter(x => Date.now() - Date.parse(x.reportedAt) > Number(process.env.MUN_FIRST_HOURS || 12) * 3600e3).map(x => x.id);
  // "উদ্ধার হয়েছে": a report that was live (approved, active) when we last looked and is now marked resolved/found.
  const firstWatch = !st.watch;
  const watch = new Set(st.watch || []);
  const back = firstWatch || process.env.MUN_FOUND !== '1' ? [] : all.filter(x => watch.has(x.id) && munRecovered(x) && !st.recovered.includes(x.id));
  st.watch = all.filter(x => munActive(x) || (watch.has(x.id) && !munRecovered(x))).map(x => x.id);
  save();
  const found = back[0];
  const rep = found || list.find(x => !st.seen.includes(x.id) && Date.now() - Date.parse(x.reportedAt) < 3 * 864e5);
  if (!rep) return;
  const kind = !found ? 'missing' : MUN_DEAD.test([found.description, found.additionalDetails, found.status].join(' ')) ? 'dead' : 'found';
  // Until MUN_DEAD_CARD=1, a death case gets no card at all rather than a "সুখবর" one.
  if (kind === 'dead' && process.env.MUN_DEAD_CARD !== '1') { st.recovered.push(rep.id); save(); return; }
  const key = found ? `${kind}-${rep.id}` : rep.id;
  const mark = () => (found ? st.recovered : st.seen).push(rep.id);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const card = await munCard(browser, rep, path.join(OUT_DIR, `mun-${key}.png`), await channelLogo(browser), kind);
    const done = st.pages[key] = st.pages[key] || [];
    try { await postToFacebook(card, `${{ missing: `নিখোঁজ: ${rep.name}, বয়স ${bn(rep.age)} বছর${rep.district ? `, ${rep.district}` : ''}।${rep.lastSeen ? `\nশেষ দেখা গেছে: ${rep.lastSeen}` : ''}\nকেউ সন্ধান পেলে ${bn(String(rep.contactPhone || '13219').replace(/^\+88/, ''))} নম্বরে যোগাযোগ করুন। পোস্টটি শেয়ার করে খুঁজে পেতে সাহায্য করুন।`, found: `সুখবর! নিখোঁজ ${rep.name}-কে খুঁজে পাওয়া গেছে বলে MUN Alert নিশ্চিত করেছে। যারা শেয়ার করে পাশে ছিলেন, সবাইকে ধন্যবাদ।`, dead: `নিখোঁজ ${rep.name}-এর মৃতদেহ উদ্ধার করা হয়েছে। ইন্না লিল্লাহি ওয়া ইন্না ইলাইহি রাজিউন।` }[kind]}\n\n${hashtags(...{ missing: ['নিখোঁজ_সংবাদ', 'সন্ধান_চাই'], found: ['উদ্ধার', 'সুখবর'], dead: ['মৃতদেহ_উদ্ধার', 'শোক_সংবাদ'] }[kind], rep.district)}`, '', done, browser, true); mark(); delete st.pages[key]; } finally { st.lastAt = Date.now(); save(); }
  } catch (e) {
    event(`${kind} card ${rep.id} FAILED: ${e.message}`);
    mark(); save();
  } finally {
    await browser.close();
  }
}
// DEMO_MUN=1: cards for the 3 newest approved reports, plus a "উদ্ধার হয়েছে" card for the newest recovered one, into ./preview. Posts nothing.
async function munDemo() {
  const all = await munReports();
  const preview = path.join(__dirname, 'preview');
  fs.mkdirSync(preview, { recursive: true });
  const browser = await chromium.launch();
  try {
    const logo = await channelLogo(browser);
    for (const [i, rep] of all.filter(munActive).slice(0, 3).entries()) await munCard(browser, rep, path.join(preview, `mun-demo-${i + 1}.png`), logo);
    const back = all.filter(munRecovered).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    for (const [i, rep] of back.slice(0, 2).entries()) await munCard(browser, rep, path.join(preview, `mun-found-demo-${i + 1}.png`), logo, MUN_DEAD.test([rep.description, rep.additionalDetails].join(' ')) ? 'dead' : 'found');
  } finally {
    await browser.close();
  }
}

// ------------------------------------------------------------------ extra daily cards
// TOP5=1: evening top-5 card (TOP5_HOUR, 19:00). OTD=1: "ইতিহাসের এই দিনে" from Bangla Wikipedia (OTD_HOUR, 9:30).
// POLL=1: a neutral "আপনার মত কী?" question on the day's most-read story (POLL_HOUR, 20:30); readers answer in comments.
// BREAKING_REEL=1: a short reel of the latest news at BREAKING_REEL_HOURS (13, 17:30). State: state/extras.json.
const EXTRAS_FILE = path.join(__dirname, 'state', 'extras.json');
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
async function shot(browser, html, outFile, w = 1080, h = 1350) {
  const pg = await browser.newPage({ viewport: { width: w, height: h } });
  await pg.setContent(`<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700;800;900&family=Noto+Serif:wght@700;800;900&display=swap" rel="stylesheet">
${html}`, { waitUntil: 'networkidle', timeout: 60000 });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: outFile });
  await pg.close();
  return outFile;
}
// Green header with logo, title and date; red footer with the site. Body goes in between.
const BRAND_CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:'Noto Serif Bengali','Noto Serif',serif;font-weight:700;position:relative;color:#123;
  background:#f3f5f2;background-image:repeating-linear-gradient(135deg,rgba(18,135,61,.05) 0 26px,transparent 26px 52px)}
.hdr{position:absolute;left:0;right:0;top:0;height:220px;background:linear-gradient(135deg,#12873d,#0b5e2a);border-bottom:10px solid #c8202f;
  display:flex;align-items:center;gap:28px;padding:0 48px;color:#fff}
.hdr .logo{${FRAME ? 'order:9;' : ''}height:100px;border-radius:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.25)}
.hdr .logo.txt{display:flex;align-items:center;padding:0 22px;font-size:46px;font-weight:800;color:#c8202f}
.hdr .t{flex:1}.hdr .t b{display:block;font-size:68px;font-weight:900;line-height:1.15}.hdr .t span{font-size:36px;opacity:.92}
.ftr{position:absolute;left:0;right:0;bottom:0;height:${FRAME ? 100 : 96}px;background:linear-gradient(135deg,#c8202f,#931624);border-top:8px solid ${FRAME ? '#ffd54f' : '#12873d'};
  display:flex;align-items:center;justify-content:center;color:#fff;font-size:42px;font-weight:800}`;
const brandHead = (logo, title, sub) => `<div class="hdr">${logo ? `<img class="logo" src="${logo}">` : '<div class="logo txt">উৎসব TV</div>'}
<div class="t"><b>${title}</b><span>${sub}</span></div></div>`;

async function top5Card(browser, items, outFile, logo, now = dhakaNow()) {
  const rows = items.map((it, i) => `<div class="row"><div class="ph" style="background-image:url('${esc(it.image)}')"><i>${bn(i + 1)}</i></div>
<div class="hl">${esc(it.title)}</div></div>`).join('');
  return shot(browser, `<style>${BRAND_CSS}
.list{position:absolute;left:40px;right:40px;top:250px;bottom:126px;display:flex;flex-direction:column;justify-content:space-between}
.row{height:178px;background:#fff;border-radius:22px;box-shadow:0 8px 22px rgba(0,0,0,.12);display:flex;align-items:center;gap:26px;padding:14px;border-left:12px solid #12873d}
.row:nth-child(even){border-left-color:#c8202f}
.ph{width:250px;height:150px;border-radius:14px;background:#ddd center/cover no-repeat;position:relative;flex:none}
.ph i{position:absolute;left:-12px;top:-12px;width:66px;height:66px;border-radius:50%;background:#c8202f;color:#fff;border:5px solid #fff;
  font-style:normal;font-size:38px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.3)}
.hl{flex:1;font-size:38px;line-height:1.35;color:#0b2a17;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
</style>${brandHead(logo, `আজকের শীর্ষ ${bn(items.length)} সংবাদ`, `${BN_DAYS[now.getUTCDay()]}, ${bnDate(now)}`)}
<div class="list">${rows}</div><div class="ftr">বিস্তারিত পড়ুন www.utsabtv.com</div>`, outFile);
}

// Events, births and deaths for today from Bangla Wikipedia's day page (e.g. "২৭ অক্টোবর"), wiki markup removed.
async function onThisDay(now = dhakaNow()) {
  const page = `${bn(now.getUTCDate())} ${BN_MONTHS[now.getUTCMonth()]}`;
  const r = await fetch(`https://bn.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext&page=${encodeURIComponent(page)}`, { headers: { 'User-Agent': UA } });
  const wt = (await r.json()).parse.wikitext['*'];
  const clean = s => s.replace(/<ref[^>]*\/>|<ref[\s\S]*?<\/ref>/g, '').replace(/\{\{[^{}]*\}\}/g, '').replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '').replace(/<[^>]+>/g, '').replace(/\((?:মৃ|জ)[.ঃ:][^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  const section = name => (wt.split(/^==\s*/m).find(x => x.startsWith(name)) || '').split('\n').filter(l => /^\*\s*\[?\[?[০-৯\d]/.test(l))
    .map(l => { const m = clean(l.replace(/^\*\s*/, '')).match(/^([০-৯\d]+(?:\s*খ্রিস্টপূর্বাব্দ)?)\s*[–—-]\s*(.+)$/); return m && { year: m[1], text: m[2] }; })
    .filter(x => x && x.text.length > 12);
  return { page, events: section('ঘটনা'), births: section('জন্ম'), deaths: section('মৃত্যু') };
}
const OTD_LOCAL = /বাংলাদেশ|ঢাকা|চট্টগ্রাম|বাংলা|বঙ্গ|কলকাতা|ভারত|পাকিস্তান|মুক্তিযুদ্ধ|মোগল|মুঘল|ব্রিটিশ|রবীন্দ্র|নজরুল|শেখ মুজিব|সিলেট|রাজশাহী|খুলনা/;
function otdPick(o, n = 5) {
  // Killings and attacks abroad make a grim history card, so they are left out.
  const yr = x => Number(toAscii(x.year)) || 0, short = x => x.text.length <= 130 && !/নিহত|হত্যা|হামলা|গুলি|বোমা|ধর্ষণ/.test(x.text);
  const local = o.events.filter(x => OTD_LOCAL.test(x.text) && short(x));
  const rest = o.events.filter(x => !local.includes(x) && short(x) && yr(x) >= 1800).sort((a, b) => yr(b) - yr(a));
  const ev = [...local.slice(0, 3), ...rest].slice(0, n - 1).sort((a, b) => yr(a) - yr(b));
  const birth = o.births.filter(x => OTD_LOCAL.test(x.text) && x.text.length <= 90)[0] || o.births.filter(x => x.text.length <= 80).sort((a, b) => yr(b) - yr(a))[0];
  return { events: ev, birth };
}
async function otdCard(browser, pick, outFile, logo, now = dhakaNow()) {
  const rows = pick.events.map(x => `<div class="ev"><b>${esc(x.year)}</b><p>${esc(x.text)}</p></div>`).join('')
    + (pick.birth ? `<div class="ev bd"><b>${esc(pick.birth.year)}</b><p><u>জন্ম:</u> ${esc(pick.birth.text)}</p></div>` : '');
  return shot(browser, `<style>${BRAND_CSS}
body{background:#fbf6e9;background-image:radial-gradient(circle at 20% 30%,rgba(160,120,40,.08),transparent 40%),radial-gradient(circle at 80% 70%,rgba(160,120,40,.08),transparent 40%)}
.tl{position:absolute;left:60px;right:50px;top:262px;bottom:120px;display:flex;flex-direction:column;justify-content:space-evenly}
.tl:before{content:'';position:absolute;left:96px;top:10px;bottom:10px;width:6px;background:linear-gradient(#12873d,#c8202f);border-radius:3px}
.ev{display:flex;align-items:center;gap:30px;position:relative}
.ev b{flex:none;width:198px;text-align:center;background:#12873d;color:#fff;font-size:40px;font-weight:900;padding:8px 0;border-radius:40px;border:5px solid #fff;
  box-shadow:0 6px 14px rgba(0,0,0,.2);z-index:1}
.ev:nth-child(even) b{background:#c8202f}
.ev p{flex:1;font-size:35px;line-height:1.4;color:#2b2112;background:#fff;border-radius:18px;padding:14px 22px;box-shadow:0 6px 16px rgba(80,60,20,.12)}
.ev.bd b{background:#b8860b}.ev u{text-decoration:none;color:#b8860b}
</style>${brandHead(logo, 'ইতিহাসের এই দিনে', `${bn(now.getUTCDate())} ${BN_MONTHS[now.getUTCMonth()]}`)}
<div class="tl">${rows}</div><div class="ftr">www.utsabtv.com</div>`, outFile);
}

// A neutral opinion question on one story, written by the AI. '' when the story is not suitable (crime, death, partisan fight).
async function pollQuestion(story) {
  const out = await aiAsk(`তুমি একটি বাংলাদেশি সংবাদ পেজের জন্য পাঠকের মতামত জানতে চাওয়ার একটি প্রশ্ন লিখবে।
খবরের শিরোনাম: ${story.title}
${story.description ? `খবরের সারাংশ: ${story.description}` : ''}
নিয়ম: বাংলায় একটি ছোট, নিরপেক্ষ প্রশ্ন (সর্বোচ্চ ৯০ অক্ষর), যার উত্তর সাধারণ মানুষ নিজের অভিজ্ঞতা বা মত থেকে দিতে পারে।
কোনো দল, নেতা বা ব্যক্তিকে আক্রমণ বা সমর্থন করবে না, উসকানিমূলক বা পক্ষপাতমূলক শব্দ নয়। "লাইক দিন" বা "শেয়ার করুন" জাতীয় কথা নয়।
খবরটি যদি মৃত্যু, দুর্ঘটনা, অপরাধ, ধর্ষণ বা সহিংসতা নিয়ে হয়, অথবা নিরপেক্ষ প্রশ্ন করা না যায়, তাহলে শুধু SKIP লেখো।
শুধু প্রশ্নটা লেখো, আর কিছু না।`, 0.5);
  const q = out.replace(/\s+/g, ' ').replace(/^["“'‘]|["”'’]$/g, '').trim();
  return /SKIP/i.test(q) || q.length < 15 || q.length > 140 ? '' : q;
}
async function pollCard(browser, q, story, outFile, logo) {
  return shot(browser, `<style>${BRAND_CSS}
body{background:linear-gradient(160deg,#0b5e2a 0%,#12873d 46%,#c8202f 46.2%,#931624 100%)}
.qm{position:absolute;right:-40px;top:150px;font-size:700px;font-weight:900;color:rgba(255,255,255,.08);line-height:1}
.box{position:absolute;left:60px;right:60px;top:290px;height:820px;background:#fff;border-radius:40px;box-shadow:0 30px 70px rgba(0,0,0,.35);
  border-top:16px solid #12873d;border-bottom:16px solid #c8202f;padding:60px 56px;display:flex;flex-direction:column;justify-content:center;gap:40px}
.tag{align-self:flex-start;background:#c8202f;color:#fff;font-size:40px;font-weight:800;padding:8px 34px;border-radius:40px}
.q{font-size:64px;font-weight:900;color:#0b2a17;line-height:1.35}
.ctx{font-size:32px;color:#5b6b60;line-height:1.4;border-left:8px solid #12873d;padding-left:20px}
.ans{display:flex;align-items:center;gap:18px;font-size:44px;font-weight:800;color:#0b5e2a}
.ans i{font-style:normal;background:#12873d;color:#fff;width:76px;height:76px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:44px}
</style><div class="qm">?</div>${brandHead(logo, 'আপনার মত কী?', bnDate(dhakaNow()))}
<div class="box"><div class="tag">পাঠকের মতামত</div><div class="q">${esc(q)}</div>
<div class="ctx">প্রসঙ্গ: ${esc(story.title)}</div><div class="ans"><i>💬</i>কমেন্টে আপনার মতামত জানান</div></div>
<div class="ftr">www.utsabtv.com</div>`, outFile);
}

// The newest news of the last hours, newest first, with photo (for the breaking reel).
async function latestNews(n = 5) {
  const out = [];
  for (const u of (await homepageLinks()).slice(0, 25)) {
    const it = await readInfo(u).catch(() => null);
    if (it && /\/storage\/posts\//.test(it.image)) out.push(it);
    if (out.length >= n) break;
  }
  return out;
}
async function breakingReel(browser, items, outFile, logo) {
  const t = { head: 'সর্বশেষ সংবাদ', t1: 'এই মুহূর্তের', t2: 'সর্বশেষ খবর', small: true };
  const slides = [{ file: await reelSlide(browser, null, 0, items.length, `${outFile}-0.png`, logo, 'intro', t), sec: 2.5 }];
  for (const [i, it] of items.entries()) {
    const card = await makeCard(browser, it.url, `${outFile}-card-${i + 1}`);
    slides.push({ file: await reelSlide(browser, card, i + 1, items.length, `${outFile}-${i + 1}.png`, logo, 'card', t), sec: REEL_SLIDE_SEC });
  }
  slides.push({ file: await reelSlide(browser, null, 0, items.length, `${outFile}-end.png`, logo, 'end'), sec: 3 });
  return buildVideo(slides, outFile);
}

// MARKET=1: "আজকের বাজারদর" card from TCB's daily Dhaka retail price workbook (published around 12:30 on work days),
// posted once it is out for today, from MARKET_HOUR (13) to 18:00.
// Rows of the first sheet of an .xlsx (a zip of XML files), read with zlib only: [[cell text, ...], ...].
function xlsxRows(buf) {
  const zlib = require('zlib');
  const files = {};
  let e = buf.length - 22;
  while (e > 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  let p = buf.readUInt32LE(e + 16);
  for (let n = buf.readUInt16LE(e + 10); n--;) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nameLen = buf.readUInt16LE(p + 28);
    const extra = buf.readUInt16LE(p + 30), comment = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28), data = buf.subarray(start, start + size);
    files[name] = () => (method ? zlib.inflateRawSync(data) : data).toString('utf8');
    p += 46 + nameLen + extra + comment;
  }
  const unx = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  const shared = files['xl/sharedStrings.xml'] ? [...files['xl/sharedStrings.xml']().matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map(m => unx([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => t[1]).join(''))) : [];
  const sheet = files['xl/worksheets/sheet1.xml']();
  const col = ref => [...ref.replace(/\d+/g, '')].reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  return [...sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map(r => {
    const row = [];
    for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const v = (c[3] || '').match(/<v>([\s\S]*?)<\/v>/)?.[1], is = (c[3] || '').match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
      row[col(c[1])] = /t="s"/.test(c[2]) ? shared[Number(v)] : unx(v ?? is ?? '');
    }
    return Array.from(row, x => (x ?? '').trim());
  });
}
const MARKET_ITEMS = [
  ['চাল সরু (নাজির/মিনিকেট)', 'চাল (সরু)'], ['চাল (মোটা)', 'চাল (মোটা)'], ['আটা সাদা (খোলা)', 'আটা (খোলা)'],
  ['সয়াবিন তেল (লুজ)', 'সয়াবিন তেল (খোলা)', 'লিটার'], ['সয়াবিন তেল (বোতল)|১ লিটার', 'সয়াবিন তেল (১ লি. বোতল)', 'বোতল'], ['মশুর ডাল (বড় দানা)', 'মসুর ডাল (মোটা)'],
  ['আলু', 'আলু'], ['পিঁয়াজ (দেশী)', 'পেঁয়াজ (দেশি)'], ['রসুন (দেশী)', 'রসুন (দেশি)'], ['কাঁচামরিচ', 'কাঁচা মরিচ'], ['ডিম (ফার্ম)', 'ডিম (ফার্ম)', 'হালি'],
  ['মুরগী(ব্রয়লার)', 'ব্রয়লার মুরগি'], ['গরু', 'গরুর মাংস'], ['চিনি', 'চিনি'],
];
async function tcbPrices(browser) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, userAgent: UA });
  try {
    const pg = await ctx.newPage();
    await pg.goto('https://tcb.gov.bd/pages/daily-rmps', { timeout: 90000, waitUntil: 'domcontentloaded' });
    const detail = await (await pg.waitForSelector('a[href*="daily-rmps/"]', { timeout: 60000 })).evaluate(x => x.href);
    await pg.goto(detail, { timeout: 90000, waitUntil: 'domcontentloaded' });
    const file = await (await pg.waitForSelector('a[href*=".xls"]', { timeout: 60000, state: 'attached' })).evaluate(x => x.href);
    const rows = xlsxRows(Buffer.from(await (await ctx.request.get(file, { timeout: 90000 })).body()));
    const date = (rows.slice(0, 8).flat().join(' ').match(/তারিখঃ?\s*([০-৯\d]{2}-[০-৯\d]{2}-[০-৯\d]{4})/) || [])[1];
    const items = [];
    for (const [key, label, unit] of MARKET_ITEMS) {
      const [name, size] = key.split('|');
      // NFD: the sheet mixes precomposed and split forms of letters like য়.
      const k = t => String(t || '').normalize('NFD').replace(/\s+/g, '');
      const r = rows.find(x => x[0] && k(x[0]).startsWith(k(name)) && (!size || k(x[1]) === k(size)));
      if (!r || !Number(r[2])) continue;
      const now = (+r[2] + +r[3]) / 2, week = (+r[4] + +r[5]) / 2;
      items.push({ label, unit: unit || (/হালি/.test(r[1]) ? 'হালি' : /লিটার/.test(r[1]) ? 'লিটার' : 'কেজি'), lo: +r[2], hi: +r[3], trend: !week ? 0 : Math.sign(Math.round((now - week) / week * 100)) });
    }
    return { date: date ? toAscii(date).split('-').reverse().join('-') : '', items };
  } finally { await ctx.close(); }
}
async function marketCard(browser, m, outFile, logo) {
  const day = m.date ? new Date(`${m.date}T00:00:00Z`) : dhakaNow();
  const tr = t => t > 0 ? '<i class="up">▲ বেড়েছে</i>' : t < 0 ? '<i class="dn">▼ কমেছে</i>' : '<i class="eq">● স্থির</i>';
  const tiles = m.items.map(x => `<div class="tile">${tr(x.trend)}<div class="nm">${x.label}</div>
<div class="p">৳${bn(x.lo)}${x.hi !== x.lo ? `–${bn(x.hi)}` : ''}<small> / ${x.unit}</small></div></div>`).join('');
  return shot(browser, `<style>${BRAND_CSS}
.grid{position:absolute;left:34px;right:34px;top:246px;bottom:150px;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:12px 16px}
.tile{background:#fff;border-radius:18px;border-left:12px solid #12873d;box-shadow:0 5px 14px rgba(0,0,0,.08);padding:10px 20px;position:relative;
  display:flex;flex-direction:column;justify-content:center;gap:2px}
.tile:nth-child(4n+2),.tile:nth-child(4n+3){border-left-color:#c8202f}
.nm{font-size:33px;color:#0b2a17;line-height:1.25}
.p{font-size:42px;font-weight:900;color:#931624;line-height:1.2}.p small{font-size:26px;color:#5b6b60;font-weight:700}
i{position:absolute;right:14px;top:10px;font-style:normal;font-size:22px;font-weight:800;padding:2px 12px;border-radius:20px}
.up{color:#fff;background:#c8202f}.dn{color:#fff;background:#12873d}.eq{color:#7b8a80;background:#eef2ef}
.src{position:absolute;left:0;right:0;bottom:110px;text-align:center;font-size:26px;color:#4d5f53}
</style>${brandHead(logo, 'আজকের বাজারদর', `${BN_DAYS[day.getUTCDay()]}, ${bnDate(day)} · ঢাকা`)}
<div class="grid">${tiles}</div>
<div class="src">খুচরা দাম · তথ্য: টিসিবি · চিহ্ন গত সপ্তাহের তুলনায়</div><div class="ftr">www.utsabtv.com</div>`, outFile);
}
// One daily card per kind: [env flag, Dhaka minute from, minute to, maker]. State: state/extras.json ({date, done: {kind: [page ids]}, ...}).
async function extrasTick() {
  const now = dhakaNow(), today = now.toISOString().slice(0, 10), mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const at = (k, h) => Number(process.env[`${k}_HOUR`] || h) * 60;
  const due = [
    ['OTD', at('OTD', 9.5), 12 * 60], ['MARKET', at('MARKET', 13), 18 * 60], ['TOP5', at('TOP5', 19), 21 * 60], ['POLL', at('POLL', 20.5), 22 * 60],
    ['QUIZANS', at('QUIZANS', 15), 17 * 60], ['QUIZ', at('QUIZ', 16), 18 * 60],
  ].filter(([k, from, to]) => process.env[k] === '1' && mins >= from && mins < to);
  if (!due.length) return;
  let st = {};
  try { st = JSON.parse(fs.readFileSync(EXTRAS_FILE, 'utf8')); } catch {}
  if (st.date !== today) st = { date: today, done: {}, finished: [], usedPoll: st.usedPoll || [], quiz: st.quiz, usedQuiz: st.usedQuiz || [] };
  const save = () => { fs.mkdirSync(path.dirname(EXTRAS_FILE), { recursive: true }); fs.writeFileSync(EXTRAS_FILE, JSON.stringify(st, null, 2)); };
  const kind = due.map(d => d[0]).find(k => !st.finished.includes(k) && !(k === 'MARKET' && Date.now() < (st.marketCheckedAt || 0) + 15 * 60e3));
  if (!kind) return;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const finish = () => { st.finished.push(kind); save(); };
  try {
    const logo = await channelLogo(browser), file = path.join(OUT_DIR, `${kind.toLowerCase()}-${today}.png`);
    let caption, link = '';
    if (kind === 'OTD') {
      const pick = otdPick(await onThisDay(now));
      if (pick.events.length < 3) return finish();
      await otdCard(browser, pick, file, logo);
      caption = `ইতিহাসের এই দিনে, ${bn(now.getUTCDate())} ${BN_MONTHS[now.getUTCMonth()]}:\n${pick.events.map(x => `• ${x.year}: ${x.text}`).join('\n')}${pick.birth ? `\n• জন্ম, ${pick.birth.year}: ${pick.birth.text}` : ''}\n\n${hashtags('ইতিহাসের_এই_দিনে', 'আজকের_দিনে', 'ইতিহাস')}`;
    } else if (kind === 'MARKET') {
      st.marketCheckedAt = Date.now(); save();
      const m = await tcbPrices(browser);
      if (m.date !== today || m.items.length < 8) return log(`market: TCB list for ${m.date || '?'} (${m.items.length} items), waiting for today's`);
      await marketCard(browser, m, file, logo);
      caption = `আজকের বাজারদর (ঢাকার খুচরা বাজার, টিসিবির তথ্য):\n${m.items.map(x => `• ${x.label}: ${bn(x.lo)}${x.hi !== x.lo ? `-${bn(x.hi)}` : ''} টাকা/${x.unit}${x.trend > 0 ? ' (বেড়েছে)' : x.trend < 0 ? ' (কমেছে)' : ''}`).join('\n')}\n\n${hashtags('বাজারদর', 'দ্রব্যমূল্য', 'আজকের_বাজার')}`;
    } else if (kind === 'TOP5') {
      const top = await topToday(5);
      if (top.length < 5) return finish();
      await top5Card(browser, top, file, logo);
      caption = `আজকের শীর্ষ ৫ সংবাদ:\n${top.map((x, i) => `${bn(i + 1)}. ${x.title}`).join('\n')}\n\nবিস্তারিত পড়ুন www.utsabtv.com-এ\n\n${hashtags('শীর্ষ_সংবাদ', 'আজকের_খবর')}`;
    } else if (kind === 'POLL') {
      let q = '', story = null;
      for (const s of await topToday(6)) {
        if (st.usedPoll.includes(s.url)) continue;
        const info = await articleInfo(s.url).catch(() => ({}));
        q = await pollQuestion({ title: s.title, description: info.description }).catch(e => (log('poll:', e.message), ''));
        if (q) { story = s; break; }
      }
      if (!q) return finish();
      await pollCard(browser, q, story, file, logo);
      st.usedPoll = [...st.usedPoll, story.url].slice(-50);
      caption = `${q}\n\nআপনার মতামত কমেন্টে লিখুন। খবরটি পড়ুন প্রথম কমেন্টের লিংকে।\n\n${hashtags('পাঠকের_মতামত', 'আপনার_মত')}`;
      link = story.url;
    } else if (kind === 'QUIZANS') {
      // Yesterday's quiz answer (the question went out at 16:00 the day before).
      if (!st.quiz || st.quiz.date >= today) return finish();
      st.quiz.winners = await quizWinners(st.quiz).catch(e => (log('quiz winners:', e.message), []));
      await quizCard(browser, st.quiz, file, logo, true);
      caption = `গতকালের কুইজের উত্তর:\n${st.quiz.q}\nসঠিক উত্তর: ${'কখগ'[st.quiz.answer]}) ${st.quiz.options[st.quiz.answer]}\n${st.quiz.fact || ''}${st.quiz.winners?.length ? `\n\nসবার আগে সঠিক উত্তর দিয়েছেন: ${st.quiz.winners.join(', ')}। অভিনন্দন!` : ''}\n\nআজকের নতুন কুইজ আসছে বিকেল ৪টায়।\n\n${hashtags('কুইজ', 'সাধারণ_জ্ঞান')}`;
    } else if (kind === 'QUIZ') {
      let q = null;
      for (let t = 0; t < 3 && !q; t++) { q = await quizMake(); if (q && st.usedQuiz.includes(q.q)) q = null; }
      if (!q) return finish();
      await quizCard(browser, q, file, logo);
      st.quiz = { ...q, date: today }; st.usedQuiz = [...st.usedQuiz, q.q].slice(-200);
      caption = `আজকের কুইজ:\n${q.q}\nক) ${q.options[0]}\nখ) ${q.options[1]}\nগ) ${q.options[2]}\n\nআপনার উত্তর কমেন্টে লিখুন। সঠিক উত্তর কাল বিকেল ৩টায়।\n\n${hashtags('কুইজ', 'সাধারণ_জ্ঞান')}`;
    }
    const done = st.done[kind] = st.done[kind] || [];
    try { const ids = await postToFacebook(file, caption, link, done, browser, true); if (kind === 'QUIZ') st.quiz.posts = { ...(st.quiz.posts || {}), ...ids }; finish(); } finally { save(); }
  } catch (e) { event(`${kind.toLowerCase()} FAILED: ${e.message}`); } finally { await browser.close(); }
}

// Breaking reel (reel.yml, kind=breaking): the latest 5 news as a reel on every Page, at most once per slot.
async function breakingReelRun() {
  const demo = process.env.DEMO_REEL === '1';
  const file = path.join(__dirname, 'state', 'breaking-reel.json'), today = dhakaNow().toISOString().slice(0, 10);
  let st = {};
  try { st = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  const items = await latestNews(5);
  if (!demo && items.every(x => (st.urls || []).includes(x.url))) return log('breaking reel: nothing new since the last one');
  if (items.length < 3) return log('breaking reel: not enough news');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const video = await breakingReel(browser, items, path.join(OUT_DIR, `breaking-${today}.mp4`), await channelLogo(browser));
    if (demo) { fs.mkdirSync(path.join(__dirname, 'preview'), { recursive: true }); return fs.copyFileSync(video, path.join(__dirname, 'preview', 'breaking-reel-demo.mp4')); }
    const desc = `সর্বশেষ সংবাদ:\n${items.map((x, i) => `${bn(i + 1)}. ${x.title}`).join('\n')}\n\nবিস্তারিত পড়ুন www.utsabtv.com-এ\n\n${hashtags('সর্বশেষ_সংবাদ', 'ব্রেকিং_নিউজ')}`;
    for (const page of await pages()) {
      try { event(`breaking reel on Page ${page.id}: ${JSON.stringify(await postReel(page, video, desc))}`); } catch (e) { event(`breaking reel on Page ${page.id} FAILED: ${e.message}`); }
    }
    fs.writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), urls: items.map(x => x.url) }, null, 2));
  } finally { await browser.close(); }
}

// ------------------------------------------------------------------ voiced news reels and daily quiz (demo)
// Voice reel: AI writes a short Bangla script from one story, a Bangla TTS voice reads it sentence by sentence,
// each sentence is one 9:16 slide (photo, headline, subtitle) shown for as long as it is read.
const { spoken } = require('./bnwords');
async function newsText(url) {
  const html = await getText(url);
  const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => decodeEntities(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 60 && /[ঀ-৿]/.test(p));
  return { title: meta(html, 'og:title').replace(/\s*[|–-]\s*Utsab\s*TV\s*$/i, '').trim(), image: meta(html, 'og:image'), text: paras.join(' ').slice(0, 2500) };
}
async function voiceScript(story) {
  const out = await aiAsk(`তুমি একটি বাংলাদেশি টিভির সংবাদ পাঠক। নিচের খবর থেকে ফেসবুক রিলের জন্য ছোট একটি পাঠ লেখো।
নিয়ম: চলিত বাংলায় ৪-৬টি ছোট বাক্য, মোট ৬০-৯০ শব্দ। প্রথম বাক্যেই মূল খবর। শুধু খবরে থাকা তথ্য, নিজের মত নয়।
কোনো পত্রিকার নাম নয়, ইমোজি বা হ্যাশট্যাগ নয়। সংখ্যা বাংলা অঙ্কে লেখো। প্রতিটি বাক্য আলাদা লাইনে লেখো, আর কিছু নয়।

শিরোনাম: ${story.title}
খবর: ${story.text}`, 0.4);
  return out.split(/\n+/).map(s => s.replace(/^[-*•\d.)\s]+/, '').trim()).filter(s => s.length > 8).slice(0, 7);
}
// One sentence -> mp3/wav file. engine: 'edge:<voice>' (Microsoft Edge voices via the edge-tts tool) or 'gemini:<voice>'.
async function speak(text, engine, outBase, i = 0) {
  const { execFileSync } = require('child_process');
  const [kind, voice] = engine.split(':');
  if (kind === 'dir') return path.join(voice, `${i}.wav`); // already spoken (voice clone demo)
  if (kind === 'eleven') { // ElevenLabs voice (ELEVENLABS_API_KEY); eleven_v3 reads Bangla
    const errs = [];
    for (const model of (process.env.ELEVEN_MODEL || 'eleven_v4_turbo,eleven_v4').split(',')) {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, { method: 'POST', signal: AbortSignal.timeout(120000),
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: model, language_code: 'bn', voice_settings: { stability: 0.5, similarity_boost: 0.85 } }) });
      if (r.ok) { fs.writeFileSync(`${outBase}.mp3`, Buffer.from(await r.arrayBuffer())); return `${outBase}.mp3`; }
      errs.push(`${model}: ${r.status} ${(await r.text()).slice(0, 160)}`);
    }
    throw new Error(`ElevenLabs: ${errs.join(' | ')}`);
  }
  if (kind === 'edge') {
    execFileSync('edge-tts', ['--voice', voice, '--rate', '+8%', '--text', text, '--write-media', `${outBase}.mp3`]);
    return `${outBase}.mp3`;
  }
  const models = (process.env.TTS_MODEL || 'gemini-2.5-flash-preview-tts,gemini-2.5-pro-preview-tts').split(',');
  const errs = [];
  for (const model of models) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', signal: AbortSignal.timeout(60000), headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: `সংবাদ পাঠকের মতো স্পষ্ট ও স্বাভাবিক গতিতে পড়ো: ${text}` }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } }) });
    const body = await res.json().catch(() => ({}));
    const b64 = body.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (b64) {
      fs.writeFileSync(`${outBase}.pcm`, Buffer.from(b64, 'base64'));
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', `${outBase}.pcm`, `${outBase}.wav`]);
      return `${outBase}.wav`;
    }
    errs.push(`${model}: ${res.status} ${(body.error?.message || '').slice(0, 100)}`);
  }
  throw new Error(`Gemini TTS: ${errs.join(' | ')}`);
}
const audioSecs = f => Number(require('child_process').execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString()) || 3;
async function voiceSlide(browser, story, line, i, n, outFile, logo) {
  return shot(browser, `<style>${BRAND_CSS}
body{width:1080px;height:1920px;background:#0b2a17}
.hdr{height:230px}
.ph{position:absolute;left:0;right:0;top:230px;height:820px;background:#222 center/cover no-repeat;background-image:url('${esc(story.image)}')}
.ph:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 55%,#0b5e2a 100%)}
.hl{position:absolute;left:50px;right:50px;top:1010px;color:#fff;font-size:56px;font-weight:900;line-height:1.35;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.bg2{position:absolute;left:0;right:0;top:1050px;bottom:0;background:linear-gradient(180deg,#0b5e2a,#063d1b)}
.sub{position:absolute;left:50px;right:50px;top:1300px;height:400px;display:flex;align-items:center;justify-content:center;text-align:center}
.sub span{background:#fff;color:#0b2a17;font-size:54px;font-weight:800;line-height:1.5;padding:18px 30px;border-radius:24px;border-left:14px solid #c8202f;
  box-shadow:0 12px 30px rgba(0,0,0,.35)}
.bar{position:absolute;left:50px;right:50px;top:1250px;height:12px;border-radius:6px;background:rgba(255,255,255,.2)}
.bar i{display:block;height:100%;width:${Math.round((i + 1) / n * 100)}%;background:#ffd54f;border-radius:6px}
.ftr{height:130px;font-size:52px}
</style>${brandHead(logo, 'সংবাদ', bnDate(dhakaNow()))}<div class="bg2"></div><div class="ph"></div>
<div class="hl">${esc(story.title)}</div><div class="bar"><i></i></div><div class="sub"><span>${esc(line)}</span></div>
<div class="ftr">www.utsabtv.com</div>`, outFile, 1080, 1920);
}
async function voiceReel(browser, url, engine, outFile, logo, given) {
  const story = await newsText(url);
  const lines = given || await voiceScript(story);
  if (lines.length < 3) throw new Error('script too short');
  const { execFileSync } = require('child_process');
  const parts = [];
  for (const [i, line] of lines.entries()) {
    const audio = await speak(spoken(line), engine, `${outFile}-a${i}`, i);
    parts.push({ line, audio, sec: audioSecs(audio) + 0.35, slide: await voiceSlide(browser, story, line, i, lines.length, `${outFile}-s${i}.png`, logo) });
  }
  // Video: each slide for its sentence; audio: the sentences with a short pause, soft music under them.
  const ff = args => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
  const list = parts.map(p => `file '${p.slide}'\nduration ${p.sec.toFixed(2)}`).join('\n') + `\nfile '${parts[parts.length - 1].slide}'`;
  fs.writeFileSync(`${outFile}-v.txt`, list);
  ff(['-f', 'concat', '-safe', '0', '-i', `${outFile}-v.txt`, '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', `${outFile}-v.mp4`]);
  const pads = parts.map((p, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,apad=pad_dur=0.35,atrim=0:${p.sec.toFixed(2)}[p${i}]`);
  const total = parts.reduce((a, p) => a + p.sec, 0);
  const m = parts.length;
  ff([...parts.flatMap(p => ['-i', p.audio]), '-stream_loop', '-1', '-i', process.env.VOICE_MUSIC || path.join(__dirname, 'assets', 'weather-music.mp3'), '-filter_complex',
    `${pads.join(';')};${parts.map((_, i) => `[p${i}]`).join('')}concat=n=${m}:v=0:a=1[v];[${m}:a]atrim=0:${total},volume=0.12,afade=t=out:st=${total - 1.5}:d=1.5[bg];[v][bg]amix=inputs=2:normalize=0:duration=first[a]`,
    '-map', '[a]', '-c:a', 'aac', '-b:a', '160k', `${outFile}-a.m4a`]);
  ff(['-i', `${outFile}-v.mp4`, '-i', `${outFile}-a.m4a`, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', outFile]);
  return { file: outFile, lines, title: story.title };
}

// Daily quiz: one general-knowledge question with three options, asked twice to check the answer.
async function quizMake(topic = 'বাংলাদেশের ইতিহাস, ভূগোল, সংস্কৃতি, খেলা বা বিজ্ঞান') {
  const ask = async () => JSON.parse((await aiAsk(`সাধারণ জ্ঞানের একটি সহজ কিন্তু মজার প্রশ্ন বানাও, বিষয়: ${topic}।
নিয়ম: উত্তর নিয়ে কোনো বিতর্ক বা অনিশ্চয়তা থাকবে না, সুপরিচিত ও যাচাইযোগ্য তথ্য। রাজনীতি বা ধর্মীয় বিতর্ক নয়। প্রশ্ন সর্বোচ্চ ৯০ অক্ষর, তিনটি অপশন ছোট।
শুধু এই JSON দাও: {"q":"প্রশ্ন","options":["ক","খ","গ"],"answer":0,"fact":"উত্তরের পক্ষে এক লাইনের তথ্য"}`, 0.9)).replace(/^[^{]*|[^}]*$/g, ''));
  for (let t = 0; t < 4; t++) {
    try {
      const q = await ask();
      if (!q.q || q.options?.length !== 3 || !(q.answer >= 0 && q.answer < 3)) continue;
      // Second opinion: the answer must be picked again without being shown.
      const check = await aiAsk(`প্রশ্ন: ${q.q}\nঅপশন: ১) ${q.options[0]} ২) ${q.options[1]} ৩) ${q.options[2]}\nসঠিক অপশনের শুধু সংখ্যাটা (1, 2 বা 3) লেখো। নিশ্চিত না হলে 0 লেখো।`, 0);
      if (Number(toAscii(check.trim()).match(/\d/)?.[0]) === q.answer + 1) return q;
    } catch (e) { log('quiz:', e.message); }
  }
  return null;
}
async function quizCard(browser, q, outFile, logo, reveal = false) {
  const opt = (o, i) => `<div class="op${reveal && i === q.answer ? ' ok' : ''}"><b>${'কখগ'[i]}</b>${esc(o)}</div>`;
  return shot(browser, `<style>${BRAND_CSS}
body{background:linear-gradient(160deg,#0b5e2a 0%,#12873d 50%,#0b5e2a 100%)}
.box{position:absolute;left:60px;right:60px;top:280px;bottom:150px;background:#fff;border-radius:40px;box-shadow:0 30px 70px rgba(0,0,0,.35);
  border-top:16px solid #ffd54f;padding:50px 50px;display:flex;flex-direction:column;gap:30px}
.tag{align-self:flex-start;background:#c8202f;color:#fff;font-size:38px;font-weight:800;padding:6px 32px;border-radius:40px}
.q{font-size:60px;font-weight:900;color:#0b2a17;line-height:1.35}
.op{display:flex;align-items:center;gap:26px;font-size:48px;font-weight:800;color:#0b2a17;background:#f1f6f2;border-radius:24px;padding:16px 26px;border:4px solid #d6e6da}
.op b{width:78px;height:78px;flex:none;border-radius:50%;background:#0b5e2a;color:#fff;display:flex;align-items:center;justify-content:center}
.op.ok{background:#e3f7e8;border-color:#12873d}.op.ok:after{content:'✓';margin-left:auto;color:#12873d;font-size:56px}
.cta{margin-top:auto;font-size:40px;font-weight:800;color:#c8202f;text-align:center}
.win{font-size:34px;font-weight:800;color:#c8202f;text-align:center;background:#fff6d6;border-radius:18px;padding:10px 16px}
.fact{margin-top:auto;font-size:36px;color:#3d5446;line-height:1.45;border-left:8px solid #12873d;padding-left:20px}
</style>${brandHead(logo, reveal ? 'কুইজের উত্তর' : 'আজকের কুইজ', bnDate(dhakaNow()))}
<div class="box"><div class="tag">${reveal ? 'সঠিক উত্তর' : 'প্রশ্ন'}</div><div class="q">${esc(q.q)}</div>${q.options.map(opt).join('')}
${reveal ? `<div class="fact">${esc(q.fact || '')}</div>${q.winners?.length ? `<div class="win">সবার আগে সঠিক উত্তর: ${q.winners.map(esc).join(', ')}</div>` : ''}` : '<div class="cta">কমেন্টে উত্তর লিখুন: ক, খ নাকি গ? সঠিক উত্তর কাল</div>'}</div>
<div class="ftr">www.utsabtv.com</div>`, outFile);
}

// First 3 people (by comment time, any Page) whose comment picks the right option of the quiz.
async function quizWinners(q) {
  const right = [`${'কখগ'[q.answer]}`, String(q.answer + 1), q.options[q.answer]], wrong = q.options.filter((_, i) => i !== q.answer);
  const all = [];
  for (const page of await pages()) {
    const pid = q.posts?.[page.id];
    if (!pid) continue;
    const r = await (await fetch(`${GRAPH}/${pid}/comments?fields=from{name},message,created_time&order=chronological&filter=stream&limit=500&access_token=${encodeURIComponent(page.token)}`)).json();
    for (const c of r.data || []) all.push(c);
  }
  const ok = c => { const m = (c.message || '').trim(); return m.length < 120 && (right.some(x => m === x || m.startsWith(`${x})`) || m.startsWith(`${x} `) || m.includes(q.options[q.answer])) && !wrong.some(w => m.includes(w))); };
  const names = [];
  for (const c of all.sort((a, b) => a.created_time.localeCompare(b.created_time))) if (c.from?.name && ok(c) && !names.includes(c.from.name)) names.push(c.from.name);
  return names.slice(0, 3);
}
// COMMENT_LIKE=1: every COMMENT_EVERY_MIN, the Page likes the new comments on its posts of the last 6 hours, so people get a quick response.
async function commentTick() {
  if (process.env.COMMENT_LIKE !== '1' || DRY_RUN) return;
  const file = path.join(__dirname, 'state', 'comments.json');
  let st = {};
  try { st = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  if (Date.now() < (st.at || 0) + Number(process.env.COMMENT_EVERY_MIN || 15) * 60e3) return;
  st.at = Date.now();
  const since = Math.floor(Date.now() / 1000) - 6 * 3600;
  let liked = 0;
  for (const page of await pages()) {
    const t = encodeURIComponent(page.token);
    const r = await (await fetch(`${GRAPH}/${page.id}/published_posts?since=${since}&limit=60&fields=id,comments.limit(100){id,user_likes,can_like,from{id}}&access_token=${t}`)).json().catch(e => ({ error: { message: e.message } }));
    st.last = st.last || {};
    st.last[page.id] = r.error ? `E: ${r.error.message.slice(0, 150)}` : `${(r.data || []).length} posts, ${(r.data || []).reduce((n, p) => n + (p.comments?.data?.length || 0), 0)} comments`;
    for (const p of r.data || []) for (const c of p.comments?.data || []) {
      if (c.from?.id === page.id) continue; // the Page's own link comments
      if (liked >= 150 || c.user_likes || c.can_like === false) { if (c.can_like === false) st.last[page.id] += ' cant'; continue; }
      const fd = new FormData(); fd.append('access_token', page.token);
      try { await graph(`${c.id}/likes`, fd); liked++; } catch (e) { st.last[page.id] += ` E:${e.message.slice(0, 160)}`; }
    }
  }
  st.liked = (st.liked || 0) + liked;
  if (liked) log(`comments: liked ${liked}`);
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(st));
}

async function voiceDemo() {
  const preview = path.join(__dirname, 'preview');
  fs.mkdirSync(preview, { recursive: true }); fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const notes = {};
  try {
    const logo = await channelLogo(browser);
    const q = await quizMake();
    notes.quiz = q;
    if (q) { await quizCard(browser, q, path.join(preview, 'quiz-demo.png'), logo); await quizCard(browser, q, path.join(preview, 'quiz-answer-demo.png'), logo, true); }
    const url = process.env.VOICE_URL || (await latestNews(1))[0].url;
    notes.url = url;
    for (const [name, engine] of [['female', 'edge:bn-BD-NabanitaNeural'], ['male', 'edge:bn-BD-PradeepNeural'], ['gemini', 'gemini:Kore']]) {
      try { const r = await voiceReel(browser, url, engine, path.join(OUT_DIR, `voice-${name}.mp4`), logo); fs.copyFileSync(r.file, path.join(preview, `voice-reel-${name}.mp4`)); notes[name] = r.lines; }
      catch (e) { notes[name] = `FAILED ${e.message}`; }
    }
  } finally {
    fs.writeFileSync(path.join(preview, 'voice-demo.json'), JSON.stringify(notes, null, 2));
    await browser.close();
  }
}

async function extrasDemo() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const preview = path.join(__dirname, 'preview');
  fs.mkdirSync(preview, { recursive: true });
  const browser = await chromium.launch();
  const notes = {};
  try {
    const logo = await channelLogo(browser);
    const top = await topToday(5);
    notes.top5 = top.map(x => `${x.reads}: ${x.title}`);
    if (top.length) await top5Card(browser, top, path.join(preview, 'extra-top5.png'), logo);
    try {
      const o = await onThisDay(), pick = otdPick(o);
      notes.otd = { counts: [o.events.length, o.births.length, o.deaths.length], pick };
      await otdCard(browser, pick, path.join(preview, 'extra-otd.png'), logo);
    } catch (e) { notes.otd = e.message; }
    notes.poll = [];
    for (const s of top) {
      const info = await articleInfo(s.url).catch(() => ({}));
      const q = await pollQuestion({ title: s.title, description: info.description }).catch(e => `ERR ${e.message}`);
      notes.poll.push([s.title, q]);
      if (q && !q.startsWith('ERR') && !fs.existsSync(path.join(preview, 'extra-poll.png'))) await pollCard(browser, q, s, path.join(preview, 'extra-poll.png'), logo);
    }
    try {
      const m = await tcbPrices(browser);
      notes.market = m;
      await marketCard(browser, m, path.join(preview, 'extra-market.png'), logo);
    } catch (e) { notes.market = e.message; }
    if (process.env.DEMO_EXTRAS_REEL !== '0') {
      const items = await latestNews(5);
      notes.reel = items.map(x => x.title);
      const video = await breakingReel(browser, items, path.join(OUT_DIR, 'breaking.mp4'), logo);
      fs.copyFileSync(video, path.join(preview, 'extra-breaking-reel.mp4'));
    }
  } finally {
    fs.writeFileSync(path.join(preview, 'extras-demo.json'), JSON.stringify(notes, null, 2));
    await browser.close();
  }
}

// Voiced news reel (voice.yml): one fresh story read in the cloned voice (owner-approved speaker, 2026-10-28) and posted
// as a Reel on every Page. The reference recording is committed only encrypted for this repo's runners (tools/voice-clone-demo.js);
// without the runner key it falls back to a stock Edge voice so a slot is never lost.
async function cloneRef() {
  const { execSync } = require('child_process'), os = require('os');
  const priv = path.join(os.homedir(), '.vc-key', 'priv.pem'), W = '/tmp/vc';
  if (!fs.existsSync(priv) || !fs.existsSync(path.join(__dirname, 'tools/assets/ref-voice.enc'))) return null;
  fs.mkdirSync(W, { recursive: true });
  execSync(`openssl pkeyutl -decrypt -inkey ${priv} -pkeyopt rsa_padding_mode:oaep -in tools/assets/ref-voice.key -out ${W}/k`
    + ` && openssl enc -d -aes-256-cbc -pbkdf2 -in tools/assets/ref-voice.enc -out ${W}/ref.m4a -pass file:${W}/k`
    + ` && ffmpeg -y -loglevel error -i ${W}/ref.m4a -ss 1.75 -to 13.6 -ac 1 -ar 24000 ${W}/ref.wav && rm -f ${W}/k ${W}/ref.m4a`, { cwd: __dirname });
  for (const model of ['gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.5-flash']) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(90000),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: 'audio/wav', data: fs.readFileSync(`${W}/ref.wav`).toString('base64') } },
        { text: 'এই অডিওতে যা বলা হয়েছে হুবহু বাংলায় লিখে দাও। শুধু কথাগুলো, আর কিছু না।' }] }] }) }).catch(() => null);
    const b = r ? await r.json().catch(() => ({})) : {};
    const text = (b.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').replace(/\s+/g, ' ').trim();
    if (text) return { wav: `${W}/ref.wav`, text };
  }
  return null;
}
async function voiceRun() {
  const demo = process.env.DEMO_REEL === '1';
  const file = path.join(__dirname, 'state', 'voice-reel.json');
  let st = { used: [] };
  try { st = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  let albumUsed = [];
  try { albumUsed = JSON.parse(fs.readFileSync(path.join(__dirname, 'state', 'album.json'), 'utf8')).used || []; } catch {}
  let story = null, url = '';
  for (const x of await latestNews(10)) {
    if (st.used.includes(x.url) || albumUsed.includes(x.url)) continue;
    const s = await newsText(x.url).catch(() => null);
    if (s?.image && s.text.length > 300) { story = s; url = x.url; break; }
  }
  if (!story) return log('voice reel: no fresh story');
  const lines = await voiceScript(story);
  if (lines.length < 3) return log('voice reel: script too short');
  // ElevenLabs "Tanvir" voice on eleven_v4_turbo (owner's pick 2026-10-29). The cloned voice is no longer used: the owner
  // found it unnatural. Without ElevenLabs (no key, no voice or credits left) the slot is skipped rather than read badly.
  let el = {};
  try { el = JSON.parse(fs.readFileSync(path.join(__dirname, 'state', 'eleven.json'), 'utf8')); } catch {}
  if (!process.env.ELEVENLABS_API_KEY || !el.pick) return event('voice reel skipped: no ElevenLabs key or voice');
  const sub = await (await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } })).json().catch(() => ({}));
  const left = (sub.character_limit || 0) - (sub.character_count || 0), need = lines.map(spoken).join(' ').length;
  if (sub.character_limit && left < need + 200) return event(`voice reel skipped: ElevenLabs credits left ${left}, need ${need}`);
  const engine = `eleven:${el.pick}`;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const r = await voiceReel(browser, url, engine, path.join(OUT_DIR, 'voice-reel.mp4'), await channelLogo(browser), lines);
    if (demo) return log(`voice reel demo built (${engine.split(':')[0]}), not posted`);
    const desc = `${story.title}\n\n${lines.join(' ')}\n\nবিস্তারিত পড়ুন www.utsabtv.com-এ\n\n${hashtags('সংবাদ', 'আজকের_খবর')}`;
    const all = await pages();
    if (!all.length) throw new Error('no Pages configured');
    for (const page of all) {
      try { event(`voice reel on Page ${page.id}: ${JSON.stringify(await postReel(page, r.file, desc))}`); } catch (e) { event(`voice reel on Page ${page.id} FAILED: ${e.message}`); }
    }
    st.used = [...st.used, url].slice(-60); st.at = new Date().toISOString(); st.engine = engine.split(':')[0];
    fs.writeFileSync(file, JSON.stringify(st, null, 2));
  } finally { await browser.close(); }
}

// Album post (demo): the story's photocard first, then 3 "key facts" cards made from the story itself (own content, not a copy).
async function albumPoints(story) {
  const out = await aiAsk(`নিচের খবর থেকে ৩টি মূল তথ্য বের করো, ফেসবুক অ্যালবামের কার্ডের জন্য।
নিয়ম: শুধু খবরে থাকা তথ্য, নিজের মত নয়। প্রতিটির একটি ছোট শিরোনাম (সর্বোচ্চ ৫ শব্দ) আর ১-২টি ছোট বাক্য (সর্বোচ্চ ১৪০ অক্ষর)। সংখ্যা বাংলা অঙ্কে।
কোনো পত্রিকার নাম নয়। শুধু এই JSON দাও: [{"h":"শিরোনাম","t":"বাক্য"}]

শিরোনাম: ${story.title}
খবর: ${story.text}`, 0.3);
  return JSON.parse(out.replace(/^[^\[]*|[^\]]*$/g, '')).filter(p => p.h && p.t).slice(0, 3);
}
async function albumSlide(browser, story, pt, i, n, outFile, logo) {
  return shot(browser, `<style>${BRAND_CSS}
.ph{position:absolute;left:0;right:0;top:220px;height:560px;background:#222 center/cover no-repeat;background-image:url('${esc(story.image)}')}
.ph:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 60%,rgba(0,0,0,.45))}
.num{position:absolute;left:56px;top:700px;width:150px;height:150px;border-radius:50%;background:#c8202f;border:8px solid #fff;color:#fff;
  font-size:84px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px rgba(0,0,0,.3);z-index:2}
.box{position:absolute;left:0;right:0;top:780px;bottom:100px;padding:100px 60px 30px;display:flex;flex-direction:column;gap:22px}
.h{font-size:64px;font-weight:900;color:#0b5e2a;line-height:1.25}
.t{font-size:44px;color:#1d2b22;line-height:1.5;border-left:10px solid #ffd54f;padding-left:24px}
.pg{position:absolute;right:56px;top:810px;font-size:34px;color:#5b6b60}
</style>${brandHead(logo, 'মূল তথ্য', esc(story.title.length > 46 ? story.title.slice(0, 44) + '…' : story.title))}
<div class="ph"></div><div class="num">${bn(i)}</div><div class="pg">${bn(i)}/${bn(n)}</div>
<div class="box"><div class="h">${esc(pt.h)}</div><div class="t">${esc(pt.t)}</div></div><div class="ftr">www.utsabtv.com</div>`, outFile);
}
async function albumBuild(browser, url, logo, tag) {
  const story = await newsText(url), pts = await albumPoints(story);
  if (!story.image || pts.length < 3) throw new Error('album: no photo or too few points');
  const files = [await makeCard(browser, url, path.join(OUT_DIR, `album-${tag}-0`))];
  for (const [i, pt] of pts.entries()) files.push(await albumSlide(browser, story, pt, i + 1, pts.length, path.join(OUT_DIR, `album-${tag}-${i + 1}.png`), logo));
  return { story, pts, files };
}
async function albumDemo() {
  const preview = path.join(__dirname, 'preview');
  fs.mkdirSync(preview, { recursive: true }); fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const url = process.env.ALBUM_URL || ((await topToday(1))[0] || (await latestNews(1))[0]).url;
    const { story, pts, files } = await albumBuild(browser, url, await channelLogo(browser), 'demo');
    files.forEach((f, i) => fs.copyFileSync(f, path.join(preview, `album-demo-${i + 1}.png`)));
    // How the album shows in the feed: the first picture big, the rest in a row under it.
    const uri = f => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
    await shot(browser, `<style>body{margin:0;width:1080px;background:#fff;font-family:'Noto Serif Bengali',serif}
.cap{padding:24px 30px;font-size:34px;color:#111;line-height:1.4}.big{width:1080px;height:1350px;object-fit:cover;display:block}
.row{display:flex;gap:6px;margin-top:6px}.row img{flex:1;width:0;height:440px;object-fit:cover}</style>
<div class="cap">${esc(story.title)}</div><img class="big" src="${uri(files[0])}"><div class="row">${files.slice(1).map(f => `<img src="${uri(f)}">`).join('')}</div>`,
      path.join(preview, 'album-demo-feed.png'), 1080, 1350 + 6 + 440 + 110);
    fs.writeFileSync(path.join(preview, 'album-demo.json'), JSON.stringify({ url, title: story.title, points: pts }, null, 2));
  } finally { await browser.close(); }
}
// ALBUM=1: at ALBUM_SLOTS (Dhaka minutes, default 12:00, 16:00, 20:00) the day's most-read story not yet used, as a
// multi-photo post (photocard + 3 key-fact cards) on every Page, story link in the first comment. State: state/album.json.
async function albumTick() {
  if (process.env.ALBUM !== '1' || process.env.DRY_RUN === '1') return;
  const now = dhakaNow(), today = now.toISOString().slice(0, 10), mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const slot = (process.env.ALBUM_SLOTS || '720,960,1200').split(',').map(Number).find(m => mins >= m && mins < m + 120);
  if (slot === undefined) return;
  const file = path.join(__dirname, 'state', 'album.json');
  let st = {};
  try { st = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  st.used = st.used || [];
  if (st.date !== today) Object.assign(st, { date: today, done: {}, slotUrl: {} });
  const key = String(slot), done = st.done[key] = st.done[key] || [];
  const all = await pages();
  if (all.every(p => done.includes(p.id)) || st.failedAt > Date.now() - 20 * 60e3) return;
  const save = () => { st.used = st.used.slice(-100); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(st, null, 2)); };
  let url = st.slotUrl[key];
  if (!url) {
    let voiced = [];
    try { voiced = JSON.parse(fs.readFileSync(path.join(__dirname, 'state', 'voice-reel.json'), 'utf8')).used || []; } catch {}
    const pick = (await topToday(8)).find(x => !st.used.includes(x.url) && !voiced.includes(x.url)); // not the story a voice reel just told
    if (!pick) { done.push(...all.map(p => p.id)); return save(); }
    url = st.slotUrl[key] = pick.url; st.used.push(url); save();
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const { story, pts, files } = await albumBuild(browser, url, await channelLogo(browser), key);
    const caption = `${story.title}\n\n${pts.map(p => `• ${p.h}: ${p.t}`).join('\n')}\n\nবিস্তারিত পড়ুন প্রথম কমেন্টের লিংকে।\n\n${hashtags('সংবাদ', 'মূল_তথ্য')}`;
    for (const page of all) {
      if (done.includes(page.id)) continue;
      try {
        const ids = [];
        for (const f of files) {
          const fd = new FormData();
          fd.append('source', new Blob([fs.readFileSync(f)]), path.basename(f)); fd.append('published', 'false'); fd.append('access_token', page.token);
          ids.push((await graph(`${page.id}/photos`, fd)).id);
        }
        const post = new FormData();
        post.append('message', caption);
        ids.forEach((id, i) => post.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));
        post.append('access_token', page.token);
        const { id } = await graph(`${page.id}/feed`, post);
        done.push(page.id); save();
        const c = new FormData(); c.append('message', url); c.append('access_token', page.token);
        await graph(`${id}/comments`, c).catch(e => event(`album comment on ${id} FAILED: ${e.message}`));
        event(`album on Page ${page.id}: ${id} ${url}`);
      } catch (e) { st.failedAt = Date.now(); event(`album on Page ${page.id} FAILED: ${e.message}`); }
    }
  } catch (e) { st.failedAt = Date.now(); event(`album FAILED: ${e.message}`); } finally { save(); await browser.close(); }
}

(async () => {
  if ((process.env.DEMO_REEL === '1' || process.env.REEL_RUN === '1') && process.env.REEL_KIND === 'weather')
    return weatherReelRun().catch(e => { event(`weather reel FAILED: ${e.stack || e.message}`); process.exit(1); });
  if ((process.env.DEMO_REEL === '1' || process.env.REEL_RUN === '1') && process.env.REEL_KIND === 'prayer')
    return prayerReelRun().catch(e => { event(`prayer reel FAILED: ${e.stack || e.message}`); process.exit(1); });
  if ((process.env.DEMO_REEL === '1' || process.env.REEL_RUN === '1') && process.env.REEL_KIND === 'breaking')
    return breakingReelRun().catch(e => { event(`breaking reel FAILED: ${e.stack || e.message}`); process.exit(1); });
  if ((process.env.DEMO_REEL === '1' || process.env.REEL_RUN === '1') && process.env.REEL_KIND === 'voice')
    return voiceRun().catch(e => { event(`voice reel FAILED: ${e.stack || e.message}`); process.exit(1); });
  if (process.env.DEMO_REEL === '1' || process.env.REEL_RUN === '1') return reelRun().catch(e => { event(`reel FAILED: ${e.stack || e.message}`); process.exit(1); });
  if (process.env.DEMO_GM === '1') { const b = await chromium.launch(); try { fs.mkdirSync(path.join(__dirname, 'preview'), { recursive: true }); await goodMorningCard(b, path.join(__dirname, 'preview', 'gm-demo.png'), await channelLogo(b)); } finally { await b.close(); } return; }
  if (process.env.DEMO_PRAYER === '1') return prayerDemo();
  if (process.env.DEMO_SPORTS === '1') return sportsDemo();
  if (process.env.DEMO_ENT === '1') { for (const d of Object.values(DESKS)) await entDemo(d, d.key === 'ent' ? 4 : 3).catch(e => log(`${d.key} demo: ${e.message}`)); return; }
  if (process.env.DEMO_MUN === '1') return munDemo();
  if (process.env.DEMO_EXTRAS === '1') return extrasDemo();
  if (process.env.DEMO_LEAN === '1') { // combined prayer + weather cards into preview/ (posts nothing)
    const b = await chromium.launch();
    try {
      const logo = await channelLogo(b), data = {};
      for (const d of DIVISIONS) data[d.name] = await weatherFor(d);
      fs.mkdirSync(path.join(__dirname, 'preview'), { recursive: true });
      await prayerAllCard(b, path.join(__dirname, 'preview', 'lean-prayer.png'), logo);
      await weatherAllCard(b, data, path.join(__dirname, 'preview', 'lean-weather.png'), logo);
    } finally { await b.close(); }
    return;
  }
  if (process.env.DEMO_ALBUM === '1') return albumDemo();
  if (process.env.DEMO_INSIGHTS === '1') { // data for the reach-report / album demos; the repo is public, so the result is encrypted for the requester
    try { await insightsProbe(); } catch (e) { fs.writeFileSync(path.join(__dirname, 'state', 'insights-probe.json'), JSON.stringify({ error: e.stack.slice(0, 800) })); }
    return;
  }
  async function insightsProbe() {
    const out = { pages: {}, articles: [] }, get = async u => { try { return await (await fetch(`${GRAPH}/${u}`, { signal: AbortSignal.timeout(60000) })).json(); } catch (e) { return { error: { message: e.message } }; } };
    out.perms = ((await get(`me/permissions?access_token=${encodeURIComponent(process.env.FB_USER_TOKEN)}`)).data || []).filter(p => p.status === 'granted').map(p => p.permission);
    const since = Math.floor(Date.now() / 1000) - 7 * 86400;
    for (const page of await pages()) {
      const t = encodeURIComponent(page.token), posts = [];
      let u = `${page.id}/published_posts?fields=id,created_time,message,attachments{media_type,type},reactions.summary(total_count).limit(0),comments.summary(true).limit(0),shares&since=${since}&limit=100&access_token=${t}`;
      for (let i = 0; i < 15 && u; i++) { const r = await get(u); if (r.error) { out.pages[page.id] = { error: r.error }; break; } posts.push(...(r.data || [])); u = r.paging?.next ? r.paging.next.replace(`${GRAPH}/`, '') : ''; }
      const metrics = {};
      for (const m of ['post_impressions_unique', 'post_total_media_view_unique', 'post_media_view', 'post_impressions', 'post_clicks', 'post_reactions_by_type_total']) {
        const r = posts[0] ? await get(`${posts[0].id}/insights?metric=${m}&access_token=${t}`) : {};
        metrics[m] = r.error ? r.error.message.slice(0, 120) : 'ok';
      }
      const good = Object.keys(metrics).filter(m => metrics[m] === 'ok' && m !== 'post_reactions_by_type_total');
      for (const p of posts) {
        p.ins = {};
        for (const m of ['post_total_media_view_unique', 'post_media_view', 'post_clicks']) {
          const r = await get(`${p.id}/insights?metric=${m}&access_token=${t}`);
          p.ins[m] = r.error ? `E:${r.error.message.slice(0, 80)}` : r.data?.[0]?.values?.[0]?.value ?? JSON.stringify(r).slice(0, 200);
        }
        p.message = (p.message || '').slice(0, 160);
      }
      const fi = await get(`${page.id}?fields=followers_count,fan_count&access_token=${t}`);
      const pins = await get(`${page.id}/insights?metric=page_total_media_view_unique,page_post_engagements,page_follows&period=day&since=${since}&access_token=${t}`);
      out.pages[page.id] = { name: page.name, followers: fi.followers_count, fans: fi.fan_count, metrics, pageInsights: pins.error ? pins.error.message : (pins.data || []).map(d => ({ name: d.name, values: d.values })), posts };
    }
    for (const u of (await homepageLinks()).slice(0, 8)) {
      const html = await getText(u).catch(() => '');
      out.articles.push({ url: u, imgs: [...new Set([...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]).filter(x => /storage\/(posts|uploads|photos|images)|\/storage\//.test(x)))].slice(0, 12) });
    }
    const { execSync } = require('child_process'); fs.mkdirSync(OUT_DIR, { recursive: true }); fs.writeFileSync(path.join(OUT_DIR, 'ins.json'), JSON.stringify(out));
    execSync(`openssl rand -hex 32 > out/k && openssl enc -aes-256-cbc -pbkdf2 -salt -in out/ins.json -out preview/insights.enc -pass file:out/k && openssl pkeyutl -encrypt -pubin -inkey tools/assets/vc-local-pub.pem -pkeyopt rsa_padding_mode:oaep -in out/k -out preview/insights.key`, { cwd: __dirname });
    return;
  }
  if (process.env.DEMO_BRAND) { // check of the logo-photo filter on one headline: state/brand-probe.json
    const b = await chromium.launch(), out = {};
    try {
      const it = (await entItems({ feeds: [GN(process.env.DEMO_BRAND)] }))[0];
      out.first = { source: it.source, ...(await entResolve(b, it)) }; out.first.branded = out.first.image ? await entBranded(out.first.image, it.source) : null;
      out.defaultBranded = await entBranded('https://media.prothomalo.com/prothomalo-bangla%2F2025-11-23%2F1558a7oz%2Fdefaultog.webp', 'প্রথম আলো');
      if (out.first.image) fs.writeFileSync(path.join(__dirname, 'preview', 'brand-probe.jpg'), Buffer.from(await (await fetch(out.first.image)).arrayBuffer()));
      out.other = await entOtherPhoto(b, it);
      const pg = await b.newPage(); await pg.goto(out.first.url, { waitUntil: 'domcontentloaded', timeout: 45000 }); const html = await pg.content();
      out.raw = { og: meta(html, 'og:image'), tw: meta(html, 'twitter:image') };
      out.first.branded = out.first.image ? await entBranded(out.first.image) : null;
    } catch (e) { out.error = e.message; } finally { await b.close(); }
    return fs.writeFileSync(path.join(__dirname, 'state', 'brand-probe.json'), JSON.stringify(out, null, 2));
  }
  if (process.env.DEMO_VOICE === '1') return voiceDemo();
  if (process.env.CLONE_DEMO) {
    // Voice clone demo: lines already spoken into CLONE_DEMO.dir; the reel is encrypted for the public repo (tools/voice-clone-demo.js).
    const { dir, lines, engine } = JSON.parse(process.env.CLONE_DEMO), b = await chromium.launch();
    try {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      const r = await voiceReel(b, process.env.VOICE_URL, engine || `dir:${dir}`, path.join(OUT_DIR, 'clone.mp4'), await channelLogo(b), lines);
      // Encrypted for the requester only (random key wrapped with tools/assets/vc-local-pub.pem); the repo is public.
      const { execSync } = require('child_process'), k = path.join(OUT_DIR, 'clone.k');
      execSync(`openssl rand -hex 32 > ${k} && openssl enc -aes-256-cbc -pbkdf2 -salt -in ${r.file} -out preview/clone-demo.enc -pass file:${k}`
        + ` && openssl pkeyutl -encrypt -pubin -inkey tools/assets/vc-local-pub.pem -pkeyopt rsa_padding_mode:oaep -in ${k} -out preview/clone-demo.key`);
    } finally { await b.close(); }
    return;
  }
  if (process.env.DEMO_WEATHER) return weatherDemo();
  if (process.env.DEMO_LINK) return demoCard();
  if (process.env.CHECK === '1') return checkPages();
  await weatherTick().catch(e => event(`weather FAILED: ${e.message}`));
  await prayerTick().catch(e => event(`prayer FAILED: ${e.message}`));
  await gmTick().catch(e => event(`good morning FAILED: ${e.message}`));
  await sportsTick().catch(e => event(`sports FAILED: ${e.message}`));
  // One desk card per run at most, so entertainment, business and tech never land together.
  for (const d of Object.values(DESKS)) if (await entTick(d).catch(e => event(`${d.key} FAILED: ${e.message}`))) break;
  await munTick().catch(e => event(`missing FAILED: ${e.message}`));
  await extrasTick().catch(e => event(`extras FAILED: ${e.message}`));
  await albumTick().catch(e => event(`album FAILED: ${e.message}`));
  await commentTick().catch(e => event(`comments FAILED: ${e.message}`));
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
            await postToFacebook(card, info.title, link, done, browser); // no caption or hashtags: the full story is in the first comment
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
})().catch(e => { console.error(e); try { fs.writeFileSync(path.join(__dirname, 'state', 'last-error.json'), JSON.stringify({ at: new Date().toISOString(), error: String(e.stack || e).slice(0, 1500) }, null, 1)); } catch {} if (process.env.CLONE_DEMO) fs.writeFileSync(path.join(__dirname, "state", "demo-error-probe.json"), JSON.stringify({ error: String(e.stack || e).slice(0, 800) })); process.exit(1); });
