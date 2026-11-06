// One-off: which Gemini image models this key can use, with one sample cartoon frame each (preview/img-probe-*.png). Writes state/img-probe.json.
const fs = require('fs');
const K = process.env.GEMINI_API_KEY, B = 'https://generativelanguage.googleapis.com/v1beta';
(async () => {
  const out = { models: [], tries: {} };
  let u = `${B}/models?pageSize=200&key=${K}`;
  const all = await (await fetch(u)).json();
  out.models = (all.models || []).map(m => m.name).filter(n => /image|imagen|banana/i.test(n));
  const prompt = 'Flat 2D vector cartoon illustration, vertical 9:16, bright warm colours, thick clean outlines, cute big-eyed characters, simple background. Scene: an old bearded scientist in a white robe jumps out of a wooden bathtub with water splashing, very excited. No text.';
  for (const m of out.models.filter(n => !/imagen/.test(n)).slice(0, 6)) {
    try {
      const r = await fetch(`${B}/${m}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': K },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: '9:16' } } }) });
      const b = await r.json();
      const img = (b.candidates?.[0]?.content?.parts || []).find(p => p.inlineData || p.inline_data);
      if (img) { const d = img.inlineData || img.inline_data; fs.mkdirSync('preview', { recursive: true }); fs.writeFileSync(`preview/img-probe-${m.split('/').pop()}.png`, Buffer.from(d.data, 'base64')); out.tries[m] = 'ok'; }
      else out.tries[m] = (b.error?.message || JSON.stringify(b)).slice(0, 200);
    } catch (e) { out.tries[m] = e.message; }
  }
  for (const m of out.models.filter(n => /imagen/.test(n)).slice(0, 2)) {
    try {
      const r = await fetch(`${B}/${m}:predict`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': K },
        body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: '9:16' } }) });
      const b = await r.json(); const d = b.predictions?.[0]?.bytesBase64Encoded;
      if (d) { fs.writeFileSync(`preview/img-probe-${m.split('/').pop()}.png`, Buffer.from(d, 'base64')); out.tries[m] = 'ok'; } else out.tries[m] = (b.error?.message || JSON.stringify(b)).slice(0, 200);
    } catch (e) { out.tries[m] = e.message; }
  }
  fs.writeFileSync('state/img-probe.json', JSON.stringify(out, null, 2));
})();
