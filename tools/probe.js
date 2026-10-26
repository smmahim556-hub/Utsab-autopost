// One-off: which AI keys the workflow can see (true/false only). Writes state/ai-probe.json.
const fs = require('fs');
fs.writeFileSync('state/ai-probe.json', JSON.stringify({ gemini: !!process.env.GEMINI_API_KEY, anthropic: !!process.env.ANTHROPIC_API_KEY }));
