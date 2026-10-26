// One-off: Gemini models this key can use for text (names only). Writes state/ai-probe.json.
const fs = require('fs');
(async () => {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY || '' } });
  const j = await r.json().catch(() => ({}));
  const names = (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace('models/', ''));
  const tries = {};
  for (const n of names.filter(n => /flash/.test(n) && !/image|tts|audio|live|preview-0/.test(n)).slice(0, 8)) {
    const t = Date.now();
    const x = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${n}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(40000),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'এক বাক্যে বলো: আকাশ কেন নীল?' }] }] }) }).then(async x => `${x.status} ${(await x.text()).length}b`).catch(e => e.message);
    tries[n] = `${x} ${Date.now() - t}ms`;
  }
  fs.writeFileSync('state/ai-probe.json', JSON.stringify({ status: r.status, names, tries }, null, 2));
})();
