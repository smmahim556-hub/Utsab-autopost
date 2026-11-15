// YouTube multi-channel uploader.
// 1. Watches a Google Drive folder for new video files (YouTube blocks downloads from GitHub's
//    servers, so the file comes from Drive instead of the main channel).
// 2. For each new video asks an AI for SEO (title, description, tags) per channel and uploads it
//    to every channel (main and targets), with the thumbnail image if one was put next to it.
//
// In the Drive folder, per video (same base name):
//   news.mp4   the video (required)
//   news.txt   optional: first line = title/topic, the rest = notes, links and credits for the description
//   news.jpg   optional thumbnail (.jpg or .png, under 2 MB)
// Without news.txt the file name is used as the topic.
//
// Env:
//   YT_CLIENT_ID, YT_CLIENT_SECRET     the Google Cloud OAuth client (see YOUTUBE-SETUP-GUIDE.md)
//   YT_MAIN_REFRESH_TOKEN              main channel; also reads the Drive folder (needs the drive.readonly scope)
//   YT_TARGET_REFRESH_TOKEN, _2, _3    the other channels
//   DRIVE_FOLDER_ID                    the Drive folder the videos are put in
//   DRIVE_REFRESH_TOKEN                optional other token to read the folder with
//   GEMINI_API_KEY or ANTHROPIC_API_KEY  AI for the SEO text; without one the title is the file name
//   AI_MODEL                           override the AI model
//   YT_PRIVACY                         public (default), unlisted or private
//   YT_CATEGORY (25 = News & Politics), YT_LANGUAGE (bn)
//   FILE_NAME                          upload only this Drive file now (manual run), done or not
//   CHECK=1                            only test the tokens and the folder, write the result to state/youtube-check.json
//   DRY_RUN=1                          make the SEO, but do not upload
//   MAX_PER_RUN                        at most this many videos per run (default 1; each upload costs 1600 of the 10000 daily quota)
const fs = require('fs');
const path = require('path');
const https = require('https');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const STATE_FILE = path.join(__dirname, 'state', 'youtube.json');
const EVENTS_FILE = path.join(__dirname, 'state', 'youtube-events.json');
const CHECK_FILE = path.join(__dirname, 'state', 'youtube-check.json');
const OUT_DIR = path.join(__dirname, 'out');
const DRY_RUN = process.env.DRY_RUN === '1';
const MAX_PER_RUN = Number(process.env.MAX_PER_RUN || 1);
const MAX_TRIES = 3;
const SETTLE_MS = 3 * 60 * 1000; // wait this long after a video lands so its .txt / thumbnail can follow
const API = 'https://www.googleapis.com/youtube/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/youtube/v3';
const DRIVE = 'https://www.googleapis.com/drive/v3/files';

const log = (...a) => console.log(new Date().toISOString(), ...a);
// Outcome of each upload, kept in the repo (last 40) so a failure can be read without the Actions logs.
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
  return { id: ch.id, title: ch.snippet.title };
}

// ---------- Drive ----------

const base = name => name.replace(/\.[^.]+$/, '');

async function folderFiles(token) {
  const q = `'${process.env.DRIVE_FOLDER_ID}' in parents and trashed = false`;
  const files = [];
  let page = '';
  do {
    const { json } = await yt(token, 'GET', `${DRIVE}?q=${encodeURIComponent(q)}&orderBy=createdTime&pageSize=200`
      + `&fields=nextPageToken,files(id,name,mimeType,size,createdTime)&supportsAllDrives=true&includeItemsFromAllDrives=true${page}`);
    files.push(...(json.files || []));
    page = json.nextPageToken ? `&pageToken=${json.nextPageToken}` : '';
  } while (page);
  return files;
}

async function driveGet(token, f) {
  const res = await fetch(`${DRIVE}/${f.id}?alt=media&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive download ${f.name}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res;
}

async function downloadVideo(token, f) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${f.id}.video`);
  if (fs.existsSync(file)) return file;
  await pipeline(Readable.fromWeb((await driveGet(token, f)).body), fs.createWriteStream(file));
  log(`got ${f.name} (${f.size} bytes) from Drive`);
  return file;
}

// The video's topic and notes: its .txt next to it (first line = title), else the file name.
async function videoInfo(token, f, files) {
  const txt = files.find(x => base(x.name) === base(f.name) && /\.txt$/i.test(x.name));
  const thumb = files.find(x => base(x.name) === base(f.name) && /^image\/(jpeg|png)$/.test(x.mimeType));
  let title = base(f.name).replace(/[_]+/g, ' ').trim();
  let notes = '';
  if (txt) {
    const lines = (await (await driveGet(token, txt)).text()).replace(/^\uFEFF/, '').trim().split(/\r?\n/);
    title = lines.shift().trim() || title;
    notes = lines.join('\n').trim();
  }
  return { title, notes, thumb };
}

// ---------- SEO ----------

function seoPrompt(info, channelTitle, others) {
  return `You write YouTube SEO for a video uploaded on the channel "${channelTitle}".
Topic / working title: ${info.title}
Notes from the uploader (keep every URL, call to action and credit line from these):
${info.notes || '(none)'}
${others.length ? `The same video also goes to other channels with these titles, so write a clearly different one: ${others.join(' | ')}` : ''}

Write in the language of the topic (Bangla stays Bangla).
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

async function makeSeo(info, channelTitle, others) {
  let seo = { title: info.title, description: info.notes, tags: [], ai: false };
  try {
    const text = await askAI(seoPrompt(info, channelTitle, others));
    if (text) {
      const j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
      if (j.title && j.description) seo = { title: j.title, description: j.description, tags: j.tags || [], ai: true };
    }
  } catch (e) {
    event(`AI SEO failed for "${info.title}", using the file's own title: ${e.message}`);
  }
  return {
    title: clean(seo.title).slice(0, 100) || clean(info.title).slice(0, 100) || 'Video',
    description: fitDescription(seo.description),
    tags: fitTags(seo.tags),
    ai: seo.ai,
  };
}

// ---------- upload ----------

function putFile(url, file, size) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'PUT', headers: { 'Content-Type': 'video/*', 'Content-Length': size } }, res => {
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

async function upload(token, file, seo) {
  const size = fs.statSync(file).size;
  const lang = process.env.YT_LANGUAGE || 'bn';
  const meta = {
    snippet: {
      title: seo.title, description: seo.description, tags: seo.tags, categoryId: process.env.YT_CATEGORY || '25',
      defaultLanguage: lang, defaultAudioLanguage: lang,
    },
    status: { privacyStatus: process.env.YT_PRIVACY || 'public', selfDeclaredMadeForKids: false },
  };
  const { res } = await yt(token, 'POST', `${UPLOAD_API}/videos?uploadType=resumable&part=snippet,status`, meta, {
    'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Length': String(size), 'X-Upload-Content-Type': 'video/*',
  });
  const session = res.headers.get('location');
  if (!session) throw new Error('upload: no resumable session url');
  return putFile(session, file, size);
}

// Custom thumbnails need a phone-verified channel; a failure here does not undo the upload.
async function setThumbnail(token, img, mime, videoId) {
  await yt(token, 'POST', `${UPLOAD_API}/thumbnails/set?videoId=${videoId}&uploadType=media`, img, { 'Content-Type': mime });
}

// ---------- main ----------

async function main() {
  // Not set up yet (see YOUTUBE-SETUP-GUIDE.md): skip quietly instead of failing every 15 minutes.
  if (!process.env.YT_CLIENT_ID) return log('YouTube secrets not set yet, skipping');
  for (const k of ['YT_CLIENT_SECRET', 'YT_MAIN_REFRESH_TOKEN', 'DRIVE_FOLDER_ID']) {
    if (!process.env[k]) throw new Error(`missing secret ${k}`);
  }
  const channels = [];
  for (const k of ['YT_MAIN_REFRESH_TOKEN', 'YT_TARGET_REFRESH_TOKEN', 'YT_TARGET_REFRESH_TOKEN_2', 'YT_TARGET_REFRESH_TOKEN_3']) {
    if (!process.env[k]) continue;
    const token = await accessToken(process.env[k]);
    channels.push({ token, ...(await myChannel(token)) });
  }
  const driveToken = process.env.DRIVE_REFRESH_TOKEN ? await accessToken(process.env.DRIVE_REFRESH_TOKEN) : channels[0].token;
  log(`channels: ${channels.map(c => c.title).join(', ')}`);

  if (process.env.CHECK === '1') {
    const check = { at: new Date().toISOString(), channels: channels.map(c => c.title),
      ai: process.env.GEMINI_API_KEY ? 'gemini' : process.env.ANTHROPIC_API_KEY ? 'claude' : 'none (file name used as title)' };
    if (new Set(channels.map(c => c.id)).size < channels.length) check.warning = 'two tokens belong to the same channel';
    try {
      const { json } = await yt(driveToken, 'GET', `${DRIVE}/${process.env.DRIVE_FOLDER_ID}?fields=name&supportsAllDrives=true`);
      check.drive_folder = json.name;
      check.videos_in_folder = (await folderFiles(driveToken)).filter(f => f.mimeType.startsWith('video/')).length;
    } catch (e) {
      check.drive_folder = `not readable: ${e.message}`;
    }
    fs.writeFileSync(CHECK_FILE, JSON.stringify(check, null, 2));
    log('check ok', JSON.stringify(check));
    return;
  }

  const files = await folderFiles(driveToken);
  const videos = files.filter(f => f.mimeType.startsWith('video/'));
  let state = loadState();
  if (!state?.done) {
    // First run: remember the videos already in the folder so they are not uploaded again.
    state = { done: Object.fromEntries(videos.map(f => [f.id, true])), uploads: {}, tries: {} };
    saveState(state);
    event(`first run: ${videos.length} videos already in the Drive folder, nothing uploaded. Put a new video there to upload it.`);
    return;
  }

  const forced = (process.env.FILE_NAME || '').trim();
  const todo = videos.filter(f => forced ? f.name === forced || base(f.name) === forced
    : !state.done[f.id] && Date.now() - Date.parse(f.createdTime) > SETTLE_MS).slice(0, MAX_PER_RUN);
  if (!todo.length) return log(forced ? `no video named ${forced} in the folder` : 'no new videos');

  for (const f of todo) {
    const done = state.uploads[f.id] || {};
    try {
      const info = await videoInfo(driveToken, f, files);
      const file = await downloadVideo(driveToken, f);
      const img = info.thumb && Buffer.from(await (await driveGet(driveToken, info.thumb)).arrayBuffer());
      const titles = [];
      for (const c of channels) {
        if (done[c.id]) continue;
        const seo = await makeSeo(info, c.title, titles);
        titles.push(seo.title);
        if (DRY_RUN) {
          event(`dry run "${f.name}" -> ${c.title}: ${JSON.stringify(seo)}`);
          continue;
        }
        const up = await upload(c.token, file, seo);
        done[c.id] = up.id;
        state.uploads[f.id] = done;
        saveState(state);
        event(`uploaded "${f.name}" -> ${c.title}: https://youtu.be/${up.id} (${up.status?.privacyStatus}${seo.ai ? ', AI SEO' : ''})`);
        if (img) {
          try {
            await setThumbnail(c.token, img, info.thumb.mimeType, up.id);
          } catch (e) {
            event(`thumbnail not set on ${up.id}: ${e.message}`);
          }
        }
      }
      if (DRY_RUN) continue;
      state.done[f.id] = true;
      delete state.tries[f.id];
      fs.rmSync(file, { force: true });
    } catch (e) {
      if (e instanceof QuotaError) {
        event(`daily YouTube quota used up, will continue tomorrow: ${e.message}`);
        break;
      }
      if (DRY_RUN) {
        event(`dry run "${f.name}" failed: ${e.message}`);
        continue;
      }
      state.tries[f.id] = (state.tries[f.id] || 0) + 1;
      event(`failed "${f.name}" (try ${state.tries[f.id]}/${MAX_TRIES}): ${e.message}`);
      if (state.tries[f.id] >= MAX_TRIES) state.done[f.id] = true;
    } finally {
      saveState(state);
    }
  }
}

main().catch(e => {
  event(`run failed: ${e.message}`);
  process.exit(1);
});
