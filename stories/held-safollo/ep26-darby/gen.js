// সাফল্যের গল্প · পর্ব ২: সোনা থেকে তিন ফুট দূরে. From 'Think and Grow Rich' (owner's book), retold in our own words. Facts as
// the book states them: R.U. Darby's uncle caught gold fever and went West to Colorado; dug with pick and shovel and found gold
// ore; covered the mine, went home to Williamsburg, Maryland, and borrowed from relatives and neighbours for machinery; the first
// ore showed one of Colorado's richest mines; then the vein vanished; they drilled on, failed, and sold the machinery to a junk
// man; the junk man called a mining engineer who said the vein lay beyond a fault line, just three feet from where they stopped;
// the junk man made millions; Darby repaid everyone, later sold life insurance and said: 'I stopped three feet from gold, but
// I will never stop because people say no' - and sold over a million dollars of insurance a year.
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const dar = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#6d4c41', outfit: 'tunic', cloth: '#1e88e5', legsColor: '#4e342e' });
const unc = person({ skin: '#f1c28f', hair: 'bald', hairColor: '#9e9e9e', outfit: 'tunic', cloth: '#c62828', legsColor: '#4e342e' });
const junk = person({ skin: '#e0ac69', hair: 'short', hairColor: '#212121', outfit: 'coat', cloth: '#5d4037', legsColor: '#37474f' });
const eng = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#8d6e63', outfit: 'coat', cloth: '#00897b', legsColor: '#263238' });
const darS = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#6d4c41', outfit: 'coat', cloth: '#1565c0', legsColor: '#263238' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}">${t}</text>`;
const nug = (x, y, s = 1) => `<path transform="translate(${x},${y}) scale(${s})" d="M-40 0 L-20 -30 L20 -34 L44 -6 L30 26 L-24 28 Z" fill="#ffca28" stroke="${O}" stroke-width="5"/>`;
const mountains = `<path d="M-800 1330 L-300 700 L100 1100 L600 600 L1100 1050 L1500 720 L1880 1330 Z" fill="#a1887f" stroke="${O}" stroke-width="6"/>`;
const rock = (y0 = 1330) => `<rect x="-800" y="${y0}" width="2680" height="${1920 - y0}" fill="#795548" stroke="${O}" stroke-width="6"/>`;

const scenes = [];
scenes.push({ narration: 'অনেক বছর আগে আমেরিকায় সোনার খোঁজে ছুটছিল মানুষ। আর ডার্বির চাচাও সোনার নেশায় পড়ে গেলেন কলোরাডোর পাহাড়ে।',
  svg: svg(``, `<defs>${P.grad('gd1', '#ffe0b2', '#fff8e1')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gd1)"/>${mountains}
<rect x="-800" y="1330" width="2680" height="590" fill="#d7ccc8" stroke="${O}" stroke-width="6"/>
${at(540, 1460, .85, unc('point', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'কলোরাডোর পাহাড়ে', { fill: '#bf360c', rot: -3, delay: .3, fs: 64 })}`) });
scenes.push({ narration: 'গাঁইতি আর বেলচা দিয়ে দিনের পর দিন খুঁড়লেন। তারপর একদিন, চকচক করে উঠল সোনা!',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff3e0"/>${rock(1150)}
${nug(380, 1300, 1.4)}${nug(540, 1350, 1.1)}${nug(700, 1290, 1.3)}${P.burst(330, 430, 130, '#ffe082')}${T(330, 457, 'সোনা!', 70, '#bf360c')}
${at(540, 1180, .7, unc('point', { mouth: 'shout', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'সোনার দেখা', { fill: '#e65100', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'খনি ঢেকে রেখে ফিরলেন মেরিল্যান্ডে। আত্মীয় আর প্রতিবেশীদের কাছ থেকে টাকা ধার করে কিনলেন যন্ত্র। ভাতিজা ডার্বিও যোগ দিলেন।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#e8f5e9"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${[[300, 650], [540, 560], [780, 650]].map(([x, y]) => `<g transform="translate(${x},${y})"><circle r="70" fill="#fff59d" stroke="${O}" stroke-width="6"/>${T(0, 25, '$', 80, '#2e7d32')}</g>`).join('')}
${at(320, 1460, .78, unc('stand', { mouth: 'smile', brows: 'normal', px: 4 }), '')}${at(760, 1460, .72, dar('point', { mouth: 'grin', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'ধার করে যন্ত্র', { fill: '#1b5e20', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: 'প্রথম চালানেই বোঝা গেল, এটা কলোরাডোর সবচেয়ে ধনী খনিগুলোর একটা! আর কয়েক গাড়ি তুললেই সব ধার শোধ।',
  svg: svg(``, `<defs>${P.grad('gd4', '#fff3c4', '#fffdf2')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gd4)"/>${P.rays(540, 700, '#ffc93c', .3)}
<rect x="-800" y="1330" width="2680" height="590" fill="#d7ccc8" stroke="${O}" stroke-width="6"/>
<g transform="translate(540,620)"><path d="M-220 -40 L220 -40 L180 120 L-180 120 Z" fill="#6d4c41" stroke="${O}" stroke-width="7"/>${[-120, -40, 40, 120].map(x => nug(x, -60, 1.1)).join('')}<circle cx="-130" cy="140" r="40" fill="#424242" stroke="${O}" stroke-width="6"/><circle cx="130" cy="140" r="40" fill="#424242" stroke="${O}" stroke-width="6"/></g>
${at(200, 1460, .7, unc('point', { mouth: 'grin', brows: 'up', px: 4 }), '')}${at(880, 1460, .66, dar('stand', { mouth: 'grin', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'ধনী খনি!', { fill: '#e65100', rot: -2, delay: .2, fs: 72 })}`) });
scenes.push({ narration: 'তারপর হঠাৎ, সোনার শিরা উধাও! তাঁরা খুঁড়েই চললেন, খুঁড়েই চললেন, কিন্তু আর এক কণাও সোনা নেই।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#cfd8dc"/>${rock(1150)}
${P.cloud(300, 520, 1.1)}${P.cloud(820, 600, .9)}
${at(330, 1180, .66, unc('think', { mouth: 'frown', brows: 'think', px: 4 }), '')}${at(760, 1180, .62, dar('stand', { mouth: 'frown', brows: 'think', px: -4 }), '')}
${P.label(540, 230, 'সোনা উধাও!', { fill: '#37474f', rot: -2, delay: .2, fs: 72 })}`) });
scenes.push({ narration: 'শেষে হাল ছেড়ে দিলেন। সব যন্ত্র অল্প দামে বেচে দিলেন এক পুরোনো জিনিসের ব্যবসায়ীর কাছে, আর বাড়ি ফিরে গেলেন।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#eceff1"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#b0bec5" stroke="${O}" stroke-width="6"/>
<g transform="translate(540,780)"><rect x="-200" y="-80" width="400" height="160" rx="12" fill="#78909c" stroke="${O}" stroke-width="6"/><circle cx="-110" cy="100" r="40" fill="#424242" stroke="${O}" stroke-width="6"/><circle cx="110" cy="100" r="40" fill="#424242" stroke="${O}" stroke-width="6"/><path d="M-60 -80 L-60 -200 L60 -200" stroke="${O}" stroke-width="10" fill="none"/></g>
${at(240, 1460, .72, unc('stand', { mouth: 'frown', brows: 'normal', px: 4 }), '')}${at(840, 1460, .72, junk('point', { mouth: 'grin', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'হাল ছেড়ে দেওয়া', { fill: '#455a64', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'ব্যবসায়ী কিন্তু হাল ছাড়লেন না। ডাকলেন এক খনি-প্রকৌশলী। তিনি মেপে দেখে বললেন, সোনার শিরা মাটির ভাঁজে সরে গেছে, ঠিক তিন ফুট দূরে!',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff3e0"/>${rock(1000)}
<path d="M560 1000 L500 1920" stroke="${O}" stroke-width="8" stroke-dasharray="26 16"/>
${nug(700, 1600, 1.6)}${nug(800, 1700, 1.2)}
<path d="M300 1500 L640 1500" stroke="#e53935" stroke-width="12"/><path d="M640 1500 L600 1470 M640 1500 L600 1530" stroke="#e53935" stroke-width="12"/>${T(470, 1460, '৩ ফুট', 70, '#ffeb3b')}
${at(260, 1030, .6, eng('point', { mouth: 'o', brows: 'up', px: 4 }), '')}${at(820, 1030, .6, junk('stand', { mouth: 'grin', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'মাত্র তিন ফুট!', { fill: '#bf360c', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'সেখানেই মিলল সোনা, আর ব্যবসায়ী হলেন লাখপতি। ডার্বি সব ধার শোধ করলেন, কিন্তু শিক্ষাটা ভুললেন না। পরে বিমা বিক্রি করতে গিয়ে কেউ না বললেই মনে করতেন, আমি সোনা থেকে তিন ফুট দূরে থেমেছিলাম, আর থামব না।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#e3f2fd"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#90caf9" stroke="${O}" stroke-width="6"/>
<g transform="translate(300,620)"><rect x="-150" y="-110" width="300" height="220" rx="16" fill="#fff" stroke="${O}" stroke-width="7"/>${T(0, 30, 'না!', 100, '#c62828')}</g>
<g transform="translate(780,620)"><rect x="-150" y="-110" width="300" height="220" rx="16" fill="#fff" stroke="${O}" stroke-width="7"/>${T(0, 30, 'হ্যাঁ!', 100, '#2e7d32')}</g>
${at(540, 1460, .85, darS('point', { mouth: 'smile', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'আর থামব না', { fill: '#0d47a1', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'হার মেনে নেওয়ার আগে আরেকবার চেষ্টা করুন। হয়তো আপনিও সাফল্য থেকে মাত্র তিন ফুট দূরে। এই গল্প এখানেই শেষ।', caption: 'তিন ফুটের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('gd9', '#ffe0a3', '#fff7e0')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gd9)"/>${P.rays(540, 520, '#ffc93c', .32)}
${nug(540, 460, 2.2)}
${at(540, 1420, 1, darS('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 200, 'তিন ফুটের গল্প শেষ', { fill: '#4e342e', rot: -2, delay: .2, fs: 60 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'সোনা থেকে তিন ফুট দূরে', series: 'সাফল্যের গল্প · পর্ব ২', episode: 2, scientist: 'আর ইউ ডার্বি', tags: ['#অনুপ্রেরণা', '#সাফল্য'],
  summary: 'খুঁড়তে খুঁড়তে হাল ছেড়ে দিলেন ডার্বিরা, অথচ সোনা ছিল মাত্র তিন ফুট দূরে। সেই শিক্ষাই বদলে দিল ডার্বির জীবন।' }, scenes);
console.log('ep26:', scenes.length, 'scenes');
