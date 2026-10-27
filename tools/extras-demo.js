// Demo of the extra daily cards and the breaking-news reel: writes preview/extra-*.png, preview/extra-breaking-reel.mp4. Posts nothing.
require('child_process').execSync('which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)', { stdio: 'inherit' });
process.env.DEMO_EXTRAS = '1';
require('../autopost.js');
