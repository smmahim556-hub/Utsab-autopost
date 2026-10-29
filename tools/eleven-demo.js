// Demo (2026-10-29): the same news reel as the clone demo, read by an ElevenLabs instant clone of the approved speaker's
// voice (ELEVENLABS_API_KEY). Creates the voice once from the encrypted reference (tools/assets/ref-voice.enc) and keeps
// only its id in state/eleven.json. The reel is encrypted for the requester (the repo is public). Posts nothing.
const fs = require('fs'), os = require('os'), path = require('path');
const { execSync } = require('child_process');
const sh = cmd => execSync(cmd, { stdio: 'inherit' });
const W = '/tmp/vc', PRIV = path.join(os.homedir(), '.vc-key', 'priv.pem'), STATE = 'state/eleven.json';
fs.mkdirSync(W, { recursive: true });
const status = {};
const done = () => fs.writeFileSync('state/eleven-probe.json', JSON.stringify(status, null, 2));
(async () => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) throw new Error('no ELEVENLABS_API_KEY');
    const H = { 'xi-api-key': process.env.ELEVENLABS_API_KEY };
    const sub = await (await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: H })).json().catch(() => ({}));
    status.plan = { tier: sub.tier, used: sub.character_count, limit: sub.character_limit, voices: sub.voice_limit, clone: sub.can_use_instant_voice_cloning, reset: sub.next_character_count_reset_unix };
    let st = {};
    try { st = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch {}
    if (!st.voice_id) {
      sh('which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)');
      sh(`openssl pkeyutl -decrypt -inkey ${PRIV} -pkeyopt rsa_padding_mode:oaep -in tools/assets/ref-voice.key -out ${W}/k`);
      sh(`openssl enc -d -aes-256-cbc -pbkdf2 -in tools/assets/ref-voice.enc -out ${W}/ref.m4a -pass file:${W}/k && rm ${W}/k`);
      sh(`ffmpeg -y -loglevel error -i ${W}/ref.m4a -ac 1 -ar 44100 -b:a 192k ${W}/ref.mp3`);
      const fd = new FormData();
      fd.append('name', 'Utsab TV - Amin');
      fd.append('description', 'Utsab TV news reader (speaker consented, 2026-10-27)');
      fd.append('remove_background_noise', 'true');
      fd.append('files', new Blob([fs.readFileSync(`${W}/ref.mp3`)], { type: 'audio/mpeg' }), 'amin.mp3');
      const r = await fetch('https://api.elevenlabs.io/v1/voices/add', { method: 'POST', headers: H, body: fd });
      const b = await r.json().catch(() => ({}));
      if (!b.voice_id) throw new Error(`voice add: ${r.status} ${JSON.stringify(b).slice(0, 300)}`);
      st.voice_id = b.voice_id; st.created = new Date().toISOString();
      fs.writeFileSync(STATE, JSON.stringify(st, null, 2));
    }
    status.voice = true;
    const lines = JSON.parse(fs.readFileSync('preview/voice-demo.json', 'utf8')).female;
    process.env.VOICE_URL = 'https://utsabtv.com/proposal-to-raise-soybean-oil-price-by-14-taka-per-litre-before-ramadan';
    process.env.CLONE_DEMO = JSON.stringify({ engine: `eleven:${st.voice_id}`, lines });
    done();
    require('../autopost.js');
  } catch (e) { status.error = e.message.slice(0, 400); done(); process.exit(1); }
})();
