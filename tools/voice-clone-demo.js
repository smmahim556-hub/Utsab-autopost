// Demo (2026-10-27, owner confirmed the speaker agreed): news reel in a cloned voice. The repo is public, so no secret is
// shared: the reference recording (tools/assets/ref-voice.enc + .key) is encrypted for the runners' key pair (private key only
// in the Actions cache, see tools/vc-keygen.js) and the result is encrypted for the requester's public key
// (tools/assets/vc-local-pub.pem). Posts nothing.
const fs = require('fs'), os = require('os'), path = require('path');
const { execSync } = require('child_process');
const sh = cmd => execSync(cmd, { stdio: 'inherit' });
const W = '/tmp/vc', PRIV = path.join(os.homedir(), '.vc-key', 'priv.pem');
fs.mkdirSync(`${W}/out`, { recursive: true });
const status = {};
const done = () => fs.writeFileSync('state/clone-probe.json', JSON.stringify(status, null, 2));
(async () => {
  try {
    sh('which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)');
    status.key = fs.existsSync(PRIV);
    // Hybrid decryption: RSA-wrapped random key, then AES.
    sh(`openssl pkeyutl -decrypt -inkey ${PRIV} -pkeyopt rsa_padding_mode:oaep -in tools/assets/ref-voice.key -out ${W}/k`);
    sh(`openssl enc -d -aes-256-cbc -pbkdf2 -in tools/assets/ref-voice.enc -out ${W}/ref.m4a -pass file:${W}/k`);
    sh(`ffmpeg -y -loglevel error -i ${W}/ref.m4a -ss 2.6 -to 14.0 -ac 1 -ar 24000 ${W}/ref.wav`);
    status.decrypted = true;
    // Exact words of the reference clip, which the model needs alongside the audio.
    let refText = '';
    for (const model of ['gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.5-flash']) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: 'audio/wav', data: fs.readFileSync(`${W}/ref.wav`).toString('base64') } },
          { text: 'এই অডিওতে যা বলা হয়েছে হুবহু বাংলায় লিখে দাও। শুধু কথাগুলো, আর কিছু না।' }] }] }) });
      const b = await r.json().catch(() => ({}));
      refText = (b.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').replace(/\s+/g, ' ').trim();
      if (refText) break;
    }
    if (!refText) throw new Error('no transcript');
    status.transcript = true;
    const lines = JSON.parse(fs.readFileSync('preview/voice-demo.json', 'utf8')).female;
    fs.writeFileSync(`${W}/lines.json`, JSON.stringify(lines.map(require('../bnwords').spoken))); // the model can't read digits
    fs.writeFileSync(`${W}/reftext.txt`, refText);
    sh('python3 -m pip install -q --break-system-packages torch==2.7.1 torchaudio==2.7.1 --index-url https://download.pytorch.org/whl/cpu');
    sh('python3 -m pip install -q --break-system-packages git+https://github.com/ai4bharat/IndicF5.git soundfile');
    sh('python3 -m pip install -q --break-system-packages "pyarrow<18" "datasets<3" "transformers<4.50" torch==2.7.1 torchaudio==2.7.1 --extra-index-url https://download.pytorch.org/whl/cpu'); // IndicF5 pins NumPy 1.x (newer pyarrow/datasets need 2); newer transformers load it on the meta device
    try { execSync(`python3 tools/clone_tts.py ${W}/ref.wav "$(cat ${W}/reftext.txt)" ${W}/lines.json ${W}/out 2>&1`, { maxBuffer: 1 << 26 }); }
    catch (e) { status.pyLog = String(e.stdout || '').replace(/\/tmp\/vc\/[^\s]*/g, '').slice(-2500); throw new Error('clone model failed'); }
    status.spoken = fs.readdirSync(`${W}/out`).length;
    process.env.VOICE_URL = 'https://utsabtv.com/proposal-to-raise-soybean-oil-price-by-14-taka-per-litre-before-ramadan';
    process.env.CLONE_DEMO = JSON.stringify({ dir: `${W}/out`, lines });
    done();
    require('../autopost.js');
  } catch (e) { status.error = e.message.slice(0, 300); done(); process.exit(1); }
})();
