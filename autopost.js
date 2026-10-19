// Utsab TV auto-poster.
// 1. Reads the utsabtv.com homepage and finds news links not seen before.
// 2. Makes the photocard on card.utsabtv.com (paste link -> Fetch -> Download).
// 3. Posts the card to the Facebook Page, then puts the news link in the first comment.
//
// Env:
//   FB_PAGE_ID, FB_PAGE_TOKEN  Facebook Page id and Page access token
//   DRY_RUN=1                  make cards into ./out but do not post (default unless DRY_RUN=0)
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

const log = (...a) => console.log(new Date().toISOString(), ...a);

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
  return { title: meta(html, 'og:title'), image: meta(html, 'og:image') };
}

async function makeCard(browser, url, file) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1000 }, userAgent: UA });
  const page = await ctx.newPage();
  try {
    await page.goto(CARD_SITE, { waitUntil: 'networkidle', timeout: 60000 });
    // Card size: 4:5 portrait (1080x1350) unless CARD_RATIO says otherwise.
    await page.click(`#ratioSelector [data-ratio="${process.env.CARD_RATIO || '4:5'}"]`);
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

async function postToFacebook(cardFile, caption, link) {
  const pageId = process.env.FB_PAGE_ID, token = process.env.FB_PAGE_TOKEN;
  if (!pageId || !token) throw new Error('FB_PAGE_ID / FB_PAGE_TOKEN missing');

  const photo = new FormData();
  photo.append('source', new Blob([fs.readFileSync(cardFile)]), path.basename(cardFile));
  photo.append('caption', caption);
  photo.append('access_token', token);
  const { post_id: postId, id: photoId } = await graph(`${pageId}/photos`, photo);
  const target = postId || `${pageId}_${photoId}`;

  const comment = new FormData();
  comment.append('message', link);
  comment.append('access_token', token);
  await graph(`${target}/comments`, comment);
  return target;
}

(async () => {
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
          const id = await postToFacebook(card, info.title, link);
          log('posted to Facebook:', id);
        }
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
