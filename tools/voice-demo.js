// Demo: voiced news reels (two Microsoft voices and one Gemini voice) and a quiz card. Writes preview/voice-* and quiz-*. Posts nothing.
require('child_process').execSync('(which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)) && (which edge-tts || pipx install edge-tts || python3 -m pip install --user --break-system-packages edge-tts)', { stdio: 'inherit' });
process.env.PATH = `${process.env.HOME}/.local/bin:${process.env.PATH}`;
process.env.DEMO_VOICE = '1';
require('../autopost.js');
