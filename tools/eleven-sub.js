// One-off: ElevenLabs credits left and the last generations (no speech made). Writes state/eleven-sub-probe.json.
const fs = require('fs');
(async () => {
  const h = { 'xi-api-key': process.env.ELEVENLABS_API_KEY };
  const sub = await (await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: h })).json().catch(e => ({ error: e.message }));
  const hist = await (await fetch('https://api.elevenlabs.io/v1/history?page_size=12', { headers: h })).json().catch(e => ({ error: e.message }));
  fs.writeFileSync('state/eleven-sub-probe.json', JSON.stringify({ used: sub.character_count, tier: sub.tier, status: sub.status, invoice: sub.open_invoices || sub.next_invoice || null, raw: Object.fromEntries(Object.entries(sub).filter(([k]) => /status|tier|invoice|currency|billing|extra/.test(k))), limit: sub.character_limit, reset: sub.next_character_count_reset_unix, err: sub.detail || sub.error,
    history: (hist.history || []).map(x => ({ at: new Date(x.date_unix * 1000).toISOString(), model: x.model_id, voice: x.voice_name, chars: x.character_count_change_to - x.character_count_change_from, text: (x.text || '').slice(0, 60) })), herr: hist.detail || hist.error }, null, 2));
})();
