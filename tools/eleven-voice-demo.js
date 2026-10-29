// Demo (2026-10-29): the same news reel read by an ElevenLabs voice the owner picked by name (ELEVEN_PICK, default Tanvir):
// looked up in the account's voices, then in the public Voice Library (added to the account if found there).
// Its id goes to state/eleven.json (pick). The reel is encrypted for the requester. Posts nothing.
const fs = require('fs');
const NAME = process.env.ELEVEN_PICK || 'Tanvir', STATE = 'state/eleven.json';
const status = { name: NAME };
const done = () => fs.writeFileSync('state/eleven-probe.json', JSON.stringify(status, null, 2));
process.on('unhandledRejection', e => { status.error = String(e && e.stack || e).slice(0, 600); done(); process.exit(1); });
(async () => {
  try {
    require('child_process').execSync('which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)', { stdio: 'inherit' });
    const H = { 'xi-api-key': process.env.ELEVENLABS_API_KEY };
    const j = async (u, o) => (await fetch(`https://api.elevenlabs.io${u}`, { headers: H, ...o })).json();
    const mine = (await j('/v1/voices')).voices || [];
    status.mine = mine.map(v => `${v.name} [${v.category}] ${v.labels?.language || v.labels?.accent || ''}`).slice(0, 40);
    let v = mine.find(x => new RegExp(NAME, 'i').test(x.name));
    if (!v) {
      const lib = (await j(`/v1/shared-voices?page_size=30&search=${encodeURIComponent(NAME)}`)).voices || [];
      status.library = lib.map(x => `${x.name} | ${x.language} ${x.accent || ''} | ${x.gender} ${x.age} | ${x.use_case} | ${x.descriptive || ''} | used ${x.cloned_by_count}`);
      const pick = lib.filter(x => /bn|bengali|bangla/i.test(`${x.language} ${x.accent} ${x.description}`)).sort((a, b) => (b.cloned_by_count || 0) - (a.cloned_by_count || 0))[0] || lib[0];
      if (!pick) throw new Error(`no voice named ${NAME}`);
      status.picked = `${pick.name} (${pick.language})`;
      const fd = new FormData(); fd.append('new_name', `${pick.name} (Utsab)`);
      const r = await fetch(`https://api.elevenlabs.io/v1/voices/add/${pick.public_owner_id}/${pick.voice_id}`, { method: 'POST', headers: H, body: fd });
      const b = await r.json().catch(() => ({}));
      if (!b.voice_id) throw new Error(`library add: ${r.status} ${JSON.stringify(b).slice(0, 300)}`);
      v = { voice_id: b.voice_id, name: pick.name };
    } else status.picked = `${v.name} (in account)`;
    let st = {};
    try { st = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch {}
    st.pick = v.voice_id; st.pickName = v.name;
    fs.writeFileSync(STATE, JSON.stringify(st, null, 2));
    const lines = JSON.parse(fs.readFileSync('preview/voice-demo.json', 'utf8')).female;
    process.env.VOICE_URL = 'https://utsabtv.com/proposal-to-raise-soybean-oil-price-by-14-taka-per-litre-before-ramadan';
    process.env.CLONE_DEMO = JSON.stringify({ engine: `eleven:${v.voice_id}`, lines });
    done();
    require('../autopost.js');
  } catch (e) { status.error = e.message.slice(0, 400); done(); process.exit(1); }
})();
