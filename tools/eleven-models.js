// Demo (2026-10-29): the same Bangla lines read by the chosen ElevenLabs voice (state/eleven.json .pick) with every
// model that lists Bangla, newest first (up to 3), to compare pronunciation. Writes preview/model-<n>.mp4 + model-demo.json.
const fs = require('fs'), { execSync, execFileSync } = require('child_process');
const { spoken } = require('../bnwords');
const out = { models: [] };
const done = () => fs.writeFileSync('state/model-probe.json', JSON.stringify(out, null, 2));
(async () => {
  try {
    execSync('which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)', { stdio: 'inherit' });
    const H = { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' };
    const voice = JSON.parse(fs.readFileSync('state/eleven.json', 'utf8')).pick;
    const models = await (await fetch('https://api.elevenlabs.io/v1/models', { headers: H })).json();
    out.all = models.map(m => `${m.model_id}: ${m.can_do_text_to_speech ? 'tts' : ''} ${(m.languages || []).some(l => l.language_id === 'bn') ? 'bn' : ''}`);
    const bnModels = models.filter(m => m.can_do_text_to_speech && (m.languages || []).some(l => l.language_id === 'bn')).map(m => m.model_id);
    const pick = [...new Set([...bnModels.filter(m => /v4/.test(m)), ...bnModels.filter(m => /v3/.test(m)), ...bnModels])].slice(0, 3);
    const lines = JSON.parse(fs.readFileSync('preview/voice-demo.json', 'utf8')).female.map(spoken);
    fs.mkdirSync('/tmp/md', { recursive: true });
    for (const [n, model] of pick.entries()) {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, { method: 'POST', headers: H,
        body: JSON.stringify({ text: lines.join('\n'), model_id: model, language_code: 'bn', voice_settings: { stability: 0.5, similarity_boost: 0.85 } }) });
      if (!r.ok) { out.models.push({ model, error: `${r.status} ${(await r.text()).slice(0, 200)}` }); continue; }
      fs.writeFileSync(`/tmp/md/${n}.mp3`, Buffer.from(await r.arrayBuffer()));
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0x0b5e2a:s=720x720:r=10', '-i', `/tmp/md/${n}.mp3`,
        '-vf', `drawtext=text='${n + 1}  ${model}':fontcolor=white:fontsize=40:x=(w-tw)/2:y=(h-th)/2`, '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', `preview/model-${n + 1}.mp4`]);
      out.models.push({ n: n + 1, model });
    }
    out.text = lines;
  } catch (e) { out.error = e.message.slice(0, 400); }
  done();
})();
