// One-off: free image sources for cartoon story frames (Pollinations, Hugging Face). Writes preview/img2-*.png and state/img2-probe.json.
const fs = require('fs');
const prompt = 'Flat 2D vector cartoon illustration, vertical 9:16, bright warm colours, thick clean outlines, cute big-eyed characters, simple background. Scene: an old bearded scientist in a white robe jumps out of a wooden bathtub with water splashing, very excited. No text.';
(async () => {
  const out = {};
  fs.mkdirSync('preview', { recursive: true });
  for (const [k, url] of [['poll-turbo', `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&model=turbo&nologo=true&seed=7`],
                          ['poll-default', `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=1344&nologo=true&seed=7`]]) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(180000) }); const b = Buffer.from(await r.arrayBuffer());
      out[k] = `${r.status} ${r.headers.get('content-type')} ${b.length}`; if (r.ok && /image/.test(r.headers.get('content-type') || '')) fs.writeFileSync(`preview/img2-${k}.jpg`, b); } catch (e) { out[k] = e.message; }
  }
  for (const m of ['black-forest-labs/FLUX.1-schnell', 'stabilityai/stable-diffusion-xl-base-1.0']) {
    try {
      const r = await fetch(`https://router.huggingface.co/hf-inference/models/${m}`, { method: 'POST', signal: AbortSignal.timeout(180000),
        headers: { Authorization: `Bearer ${process.env.HF_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs: prompt, parameters: { width: 768, height: 1344 } }) });
      const b = Buffer.from(await r.arrayBuffer()); out[m] = `${r.status} ${r.headers.get('content-type')} ${b.length} ${/json|text/.test(r.headers.get('content-type') || '') ? b.toString().slice(0, 200) : ''}`;
      if (r.ok && /image/.test(r.headers.get('content-type') || '')) fs.writeFileSync(`preview/img2-${m.split('/').pop()}.jpg`, b);
    } catch (e) { out[m] = e.message; }
    out.hfToken = !!process.env.HF_TOKEN;
  }
  fs.writeFileSync('state/img2-probe.json', JSON.stringify(out, null, 2));
})();
