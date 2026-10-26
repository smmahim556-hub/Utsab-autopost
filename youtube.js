// YouTube channel copier.
// 1. Looks at the newest uploads of the main channel (YouTube Data API v3).
// 2. For each new public video: downloads it (yt-dlp), asks an AI for fresh SEO
//    (title, description, tags) per target channel, uploads it there and sets the same thumbnail.
//
// Env:
//   YT_CLIENT_ID, YT_CLIENT_SECRET     the Google Cloud OAuth client (see YOUTUBE-SETUP-GUIDE.md)
//   YT_MAIN_REFRESH_TOKEN              refresh token of the main channel (only read)
//   YT_TARGET_REFRESH_TOKEN, _2, _3    refresh tokens of the channels to copy to
//   GEMINI_API_KEY or ANTHROPIC_API_KEY  AI for the SEO text; without one the original title/description/tags are reused
//   AI_MODEL                           override the AI model
//   YT_COOKIES                         optional cookies.txt content for yt-dlp, if YouTube blocks the download
//   YT_PRIVACY                         public (default), unlisted or private
//   VIDEO_ID                           copy only this main-channel video now (manual run), seen or not
//   CHECK=1                            only test the tokens, write the channel names to state/youtube-check.json
//   DRY_RUN=1                          download and make the SEO, but do not upload
//   MAX_PER_RUN                        at most this many videos per run (default 1; an upload costs 1600 of the 10000 daily quota)
const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');

const STATE_FILE = path.join(__dirname, 'state', 'youtube.json');
const EVENTS_FILE = path.join(__dirname, 'state', 'youtube-events.json');
const CHECK_FILE = path.join(__dirname, 'state', 'youtube-check.json');
const OUT_DIR = path.join(__dirname, 'out');
const DRY_RUN = process.env.DRY_RUN === '1';
const MAX_PER_RUN = Number(process.env.MAX_PER_RUN || 1);
const MAX_TRIES = 3;
const API = 'https://www.googleapis.com/youtube/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/youtube/v3';

const log = (...a) => console.log(new Date().toISOString(), ...a);
// Outcome of each copy, kept in the repo (last 40) so a failure can be read without the Actions logs.
function event(text) {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8')); } catch {}
  list.push({ at: new Date().toISOString(), text: String(text).slice(0, 800) });
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

class QuotaError extends Error {}

async function accessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.YT_CLIENT_ID, client_secret: process.env.YT_CLIENT_SECRET,
      refresh_token: refreshToken, grant_type: 'refresh_token',
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`token refresh: ${JSON.stringify(body)}`);
  return body.access_token;
}

async function yt(token, method, url, body, headers = {}) {
  const res = await fetch(url.startsWith('http') ? url : `${API}/${url}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body && !headers['Content-Type'] ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body && !Buffer.isBuffer(body) ? JSON.stringify(body) : body,
  });
  const text = await res.text();
  let json = {};
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) {
    const reason = json.error?.errors?.[0]?.reason || '';
    const msg = `YouTube ${method} ${url.split('?')[0]}: HTTP ${res.status} ${reason} ${json.error?.message || text.slice(0, 300)}`;
    if (/quotaExceeded|uploadLimitExceeded|rateLimitExceeded/.test(reason)) throw new QuotaError(msg);
    throw new Error(msg);
  }
  return { json, res };
}

async function myChannel(token) {
  const { json } = await yt(token, 'GET', 'channels?part=snippet,contentDetails&mine=true');
  const ch = json.items?.[0];
  if (!ch) throw new Error('this Google account has no YouTube channel');
  return { id: ch.id, title: ch.snippet.title, uploads: ch.contentDetails.relatedPlaylists.uploads };
}

// Newest uploads of the main channel with full details (tags are only visible to the owner).
async function recentVideos(token, uploads, ids = []) {
  if (!ids.length) {
    const { json } = await yt(token, 'GET', `playlistItems?part=contentDetails&maxResults=10&playlistId=${uploads}`);
    ids = (json.items || []).map(i => i.contentDetails.videoId);
  }
  if (!ids.length) return [];
  const { json } = await yt(token, 'GET', `videos?part=snippet,status&id=${ids.join(',')}`);
  return json.items || [];
}

// Only finished, public, non-live videos are copied; scheduled and private ones wait until they go public.
const ready = v => v.status.privacyStatus === 'public' && v.status.uploadStatus === 'processed'
  && v.snippet.liveBroadcastContent === 'none';

function download(id) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${id}.mp4`);
  if (fs.existsSync(file)) return file;
  const args = ['-f', 'bv*+ba/b', '--merge-output-format', 'mp4', '--no-playlist', '-o', file];
  if (process.env.YT_COOKIES) {
    const cookies = path.join(OUT_DIR, 'cookies.txt');
    fs.writeFileSync(cookies, process.env.YT_COOKIES);
    args.push('--cookies', cookies);
  }
  args.push(`https://www.youtube.com/watch?v=${id}`);
  const r = spawnSync('yt-dlp', args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0 || !fs.existsSync(file)) {
    throw new Error(`download failed: ${(r.stderr || r.error?.message || '').trim().split('\n').slice(-3).join(' ')}`);
  }
  return file;
}

// ---------- SEO ----------

function seoPrompt(v, channelTitle) {
  return `You write YouTube SEO for a video that is being re-uploaded on the channel "${channelTitle}".
Original title: ${v.snippet.title}
Original description:
${v.snippet.description}
Original tags: ${(v.snippet.tags || []).join(', ')}

Write NEW metadata in the same language as the original (Bangla stays Bangla). It must not copy the original word for word,
but keep the same meaning, and keep every URL, hashtag-style call to action and credit line from the original description.
Return only JSON: {"title": string (max 90 characters, catchy, main keyword first),
"description": string (2-4 short paragraphs, keywords in the first 2 lines, then the kept links, then 3-5 #hashtags),
"tags": array of 15-25 search phrases, mixing Bangla and English/Banglish spellings people actually search}`;
}

async function askAI(prompt) {
  if (process.env.GEMINI_API_KEY) {
    const model = process.env.AI_MODEL || 'gemini-3.5-flash';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.9 },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Gemini: ${JSON.stringify(body.error || body).slice(0, 300)}`);
    return body.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  }
  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'claude-haiku-5-5', max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Claude: ${JSON.stringify(body.error || body).slice(0, 300)}`);
    return (body.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  }
  return null;
}

// YouTube limits: title 100 chars, description 5000 bytes, tags 500 chars in all; no < or > anywhere.
const clean = s => String(s || '').replace(/[<>]/g, '').trim();
function fitTags(tags) {
  const out = [];
  let len = 0;
  for (let t of tags) {
    t = clean(t).replace(/,/g, ' ').slice(0, 100);
    if (!t || out.some(x => x.toLowerCase() === t.toLowerCase())) continue;
    const cost = t.length + (t.includes(' ') ? 2 : 0) + (out.length ? 1 : 0);
    if (len + cost > 480) break;
    out.push(t);
    len += cost;
  }
  return out;
}
function fitDescription(s) {
  s = clean(s);
  while (Buffer.byteLength(s) > 4900) s = s.slice(0, -50);
  return s;
}

async function makeSeo(v, channelTitle) {
  const fallback = { title: v.snippet.title, description: v.snippet.description, tags: v.snippet.tags || [], ai: false };
  let seo = fallback;
  try {
    const text = await askAI(seoPrompt(v, channelTitle));
    if (text) {
      const j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
      if (j.title && j.description) seo = { title: j.title, description: j.description, tags: [...(j.tags || []), ...fallback.tags], ai: true };
    }
  } catch (e) {
    event(`AI SEO failed for ${v.id}, using the original text: ${e.message}`);
  }
  return {
    title: clean(seo.title).slice(0, 100) || clean(fallback.title).slice(0, 100),
    description: fitDescription(seo.description),
    tags: fitTags(seo.tags),
    ai: seo.ai,
  };
}

// ---------- upload ----------

function putFile(url, file, size) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'PUT', headers: { 'Content-Type': 'video/mp4', 'Content-Length': size } }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(JSON.parse(data));
        const err = `upload: HTTP ${res.statusCode} ${data.slice(0, 300)}`;
        reject(/quotaExceeded|uploadLimitExceeded/.test(data) ? new QuotaError(err) : new Error(err));
      });
    });
    req.on('error', reject);
    fs.createReadStream(file).on('error', reject).pipe(req);
  });
}

async function upload(token, file, v, seo) {
  const size = fs.statSync(file).size;
  const meta = {
    snippet: {
      title: seo.title, description: seo.description, tags: seo.tags, categoryId: v.snippet.categoryId,
      ...(v.snippet.defaultLanguage && { defaultLanguage: v.snippet.defaultLanguage }),
      ...(v.snippet.defaultAudioLanguage && { defaultAudioLanguage: v.snippet.defaultAudioLanguage }),
    },
    status: { privacyStatus: process.env.YT_PRIVACY || 'public', selfDeclaredMadeForKids: !!v.status.madeForKids },
  };
  const { res } = await yt(token, 'POST', `${UPLOAD_API}/videos?uploadType=resumable&part=snippet,status`, meta, {
    'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Length': String(size), 'X-Upload-Content-Type': 'video/mp4',
  });
  const session = res.headers.get('location');
  if (!session) throw new Error('upload: no resumable session url');
  return putFile(session, file, size);
}

// Custom thumbnails need a phone-verified channel; a failure here does not undo the upload.
async function copyThumbnail(token, v, newId) {
  const t = v.snippet.thumbnails || {};
  const src = (t.maxres || t.standard || t.high || t.default)?.url;
  if (!src) return;
  const img = Buffer.from(await (await fetch(src)).arrayBuffer());
  await yt(token, 'POST', `${UPLOAD_API}/thumbnails/set?videoId=${newId}&uploadType=media`, img, { 'Content-Type': 'image/jpeg' });
}

// ---------- main ----------

async function main() {
  for (const k of ['YT_CLIENT_ID', 'YT_CLIENT_SECRET', 'YT_MAIN_REFRESH_TOKEN']) {
    if (!process.env[k]) throw new Error(`missing secret ${k}`);
  }
  const targetTokens = ['', '_2', '_3'].map(s => process.env[`YT_TARGET_REFRESH_TOKEN${s}`]).filter(Boolean);
  if (!targetTokens.length) throw new Error('missing secret YT_TARGET_REFRESH_TOKEN');

  const mainToken = await accessToken(process.env.YT_MAIN_REFRESH_TOKEN);
  const main = await myChannel(mainToken);
  const targets = [];
  for (const rt of targetTokens) {
    const token = await accessToken(rt);
    targets.push({ token, ...(await myChannel(token)) });
  }
  log(`main: ${main.title}; targets: ${targets.map(t => t.title).join(', ')}`);

  if (process.env.CHECK === '1') {
    const check = { at: new Date().toISOString(), main: main.title, targets: targets.map(t => t.title),
      ai: process.env.GEMINI_API_KEY ? 'gemini' : process.env.ANTHROPIC_API_KEY ? 'claude' : 'none (original text reused)' };
    if (targets.some(t => t.id === main.id)) check.warning = 'a target token belongs to the main channel';
    fs.writeFileSync(CHECK_FILE, JSON.stringify(check, null, 2));
    log('check ok', JSON.stringify(check));
    return;
  }

  const forced = (process.env.VIDEO_ID || '').trim();
  const videos = await recentVideos(mainToken, main.uploads, forced ? [forced] : []);
  let state = loadState();
  if (!state) {
    // First run: remember what is already there so old videos are not copied.
    state = { seen: videos.map(v => v.id), copies: {}, tries: {} };
    saveState(state);
    event(`first run: recorded ${videos.length} existing videos of ${main.title}, nothing copied`);
    return;
  }

  // The playlist is newest first; copy oldest first.
  const todo = videos.filter(v => forced ? v.id === forced : !state.seen.includes(v.id) && ready(v)).reverse().slice(0, MAX_PER_RUN);
  if (!todo.length) return log('no new videos');

  for (const v of todo) {
    const copies = state.copies[v.id] || {};
    try {
      const file = download(v.id);
      for (const t of targets) {
        if (copies[t.id]) continue;
        const seo = await makeSeo(v, t.title);
        if (DRY_RUN) {
          event(`dry run ${v.id} -> ${t.title}: ${JSON.stringify(seo)}`);
          continue;
        }
        const up = await upload(t.token, file, v, seo);
        copies[t.id] = up.id;
        state.copies[v.id] = copies;
        saveState(state);
        event(`copied ${v.id} "${v.snippet.title}" -> ${t.title}: https://youtu.be/${up.id} (${up.status?.privacyStatus}${seo.ai ? ', AI SEO' : ''})`);
        try {
          await copyThumbnail(t.token, v, up.id);
        } catch (e) {
          event(`thumbnail not set on ${up.id}: ${e.message}`);
        }
      }
      if (DRY_RUN) continue;
      state.seen.push(v.id);
      delete state.tries[v.id];
      fs.rmSync(file, { force: true });
    } catch (e) {
      if (e instanceof QuotaError) {
        event(`daily YouTube quota used up, will continue tomorrow: ${e.message}`);
        break;
      }
      state.tries[v.id] = (state.tries[v.id] || 0) + 1;
      event(`failed ${v.id} (try ${state.tries[v.id]}/${MAX_TRIES}): ${e.message}`);
      if (state.tries[v.id] >= MAX_TRIES) state.seen.push(v.id);
    } finally {
      saveState(state);
    }
  }
}

main().catch(e => {
  event(`run failed: ${e.message}`);
  process.exit(1);
});
