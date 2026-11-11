// আবিষ্কারের গল্প · পর্ব ৯: হামফ্রি ডেভি. Our own retelling (facts checked: born 1778 in Penzance, Cornwall; chemist who
// experimented with laughing gas (nitrous oxide); in 1815 invented the safety lamp: a flame inside a fine wire mesh cannot
// set fire to the gas outside, because the metal cools it; saved many coal miners from firedamp (methane) explosions;
// in 1807 he also isolated sodium and potassium with electricity).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const dav = person({ skin: '#f3c9a0', hair: 'short', hairColor: '#6d4c41', outfit: 'coat', cloth: '#5d4037', legsColor: '#3b2a20' });
const miner = person({ skin: '#e0ad84', hair: 'short', hairColor: '#2b1d14', outfit: 'tunic', cloth: '#6d6d6d', legsColor: '#37474f' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#2e7d32', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const flame = (x, y, s = 1, cls = 'zap') => `<g transform="translate(${x},${y}) scale(${s})"><path class="${cls}" d="M0 -90 Q60 -30 30 30 Q0 70 -30 30 Q-60 -30 0 -90Z" fill="#ff9800" stroke="${O}" stroke-width="6"/><path d="M0 -40 Q25 0 10 30 Q0 45 -10 30 Q-25 0 0 -40Z" fill="#ffe082"/></g>`;
const lamp = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-70" y="-40" width="140" height="20" rx="8" fill="#6d4c41" stroke="${O}" stroke-width="6"/><rect x="-60" y="-130" width="120" height="90" fill="#cfd8dc" fill-opacity=".45" stroke="${O}" stroke-width="6"/>${[-40, -20, 0, 20, 40].map(i => `<line x1="${i}" y1="-130" x2="${i}" y2="-40" stroke="#78909c" stroke-width="3"/>`).join('')}<path d="M0 -115 Q18 -90 0 -60 Q-18 -90 0 -115Z" fill="#ff9800" stroke="${O}" stroke-width="3"/><path d="M-70 -130 Q0 -170 70 -130" fill="none" stroke="${O}" stroke-width="8"/></g>`;
const cloud = (x, y, s = 1) => P.cloud(x, y, s);
const kickCss = `.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}.zap{animation:zp .4s steps(2) infinite}@keyframes zp{50%{opacity:.6}}.twinkle{animation:tw 1s steps(2) infinite}@keyframes tw{50%{opacity:.3}}`;

const scenes = [];
// 1
scenes.push({ narration: 'হামফ্রি ডেভি জন্মেছিলেন ১৭৭৮ সালে, ইংল্যান্ডের কর্নওয়াল এলাকার পেনজান্স শহরে। ছোটবেলা থেকেই তাঁর রসায়নের প্রতি ভীষণ কৌতূহল ছিল।', caption: 'কৌতূহলী ছেলে', highlight: ['রসায়ন'],
  svg: svg(`${kickCss}`, `<defs>${P.grad('skd1', '#cfe9ff', '#f4fbff')}</defs><rect width="1080" height="1920" fill="url(#skd1)"/>
<g class="drift">${cloud(230, 380, .8)}${cloud(860, 460, .7)}</g>
<rect y="1150" width="1080" height="770" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
<g transform="translate(180,1150)"><rect x="0" y="-360" width="260" height="360" fill="#f3e3c3" stroke="${O}" stroke-width="7"/><path d="M-20 -360 L130 -470 L280 -360Z" fill="#8d4f36" stroke="${O}" stroke-width="7"/></g>
${at(640, 1400, .9, dav('stand', { mouth: 'o', brows: 'up', px: 6 }), 'bob')}${at(900, 1430, .7, kid('think', { mouth: 'smile', brows: 'normal', px: -6 }), 'bob')}
${P.label(540, 230, 'পেনজান্স, ১৭৭৮', { fill: '#4e342e', rot: -3, delay: .3, fs: 62 })}`) });
// 2
scenes.push({ narration: 'ডেভি রসায়ন নিয়ে নানা পরীক্ষা করতেন। একবার তিনি একটা গ্যাস শুকে দেখলেন, যার নাম হাসির গ্যাস। সেই গ্যাসে মানুষ হাসতে হাসতে আনন্দে মাতত!', caption: 'হাসির গ্যাস', highlight: ['হাসির গ্যাস'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#fff3e0"/><rect y="1150" width="1080" height="770" fill="#bcaaa4" stroke="${O}" stroke-width="6"/>
<g transform="translate(540,1000)"><path d="M-160 80 L-100 -120 L100 -120 L160 80 Z" fill="#b3e5fc" stroke="${O}" stroke-width="7" fill-opacity=".8"/><rect x="-120" y="-150" width="240" height="40" rx="8" fill="#eceff1" stroke="${O}" stroke-width="6"/></g>
${at(330, 1440, .9, dav('stand', { mouth: 'grin', brows: 'up', px: 4 }), 'bob')}${at(780, 1450, .8, kid('stand', { mouth: 'grin', brows: 'up', px: -4 }), 'bob')}
${T(540, 720, 'হা হা হা!', 110, '#e63946', 'class="pop"')}
${P.label(540, 230, 'মজার পরীক্ষা', { fill: '#4e342e', rot: 2, delay: .2, fs: 66 })}`) });
// 3
scenes.push({ narration: 'তখনকার দিনে কয়লার খনিতে বিপদ ছিল ভয়ংকর। খনির ভেতরে একটা দাহ্য গ্যাস জমত। একটু আগুন লাগলেই বিস্ফোরণ, আর তাতে মারা যেতেন অনেক শ্রমিক।', caption: 'খনির বিপদ', highlight: ['বিস্ফোরণ'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#37474f"/><rect y="1150" width="1080" height="770" fill="#4e342e" stroke="${O}" stroke-width="6"/>
<path d="M0 0 L1080 0 L1080 260 L0 260Z" fill="#263238"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${60 + i * 170}" y="260" width="30" height="200" fill="#6d4c41" stroke="${O}" stroke-width="4"/>`).join('')}
${flame(540, 1020, 1.6)}${at(250, 1420, .85, miner('stand', { mouth: 'shout', brows: 'angry', px: 4 }), 'bob')}${at(840, 1420, .85, miner('stand', { mouth: 'o', brows: 'up', px: -4 }), 'bob')}
${T(540, 800, 'বিস্ফোরণ!', 120, '#ffab00', 'class="pop"')}
${P.label(540, 300, 'খনিতে আগুন', { fill: '#b71c1c', rot: -2, delay: .2, fs: 64 })}`) });
// 4
scenes.push({ narration: 'শ্রমিকরা কাজ করতেন মোমবাতি বা খোলা বাতির আলোয়। কিন্তু খোলা আলো পেলেই গ্যাস জ্বলে উঠত। ডেভি ভাবলেন, এমন বাতি বানানো যায় কিনা, যার আগুন বাইরের গ্যাসকে জ্বালাতে পারবে না।', caption: 'একটা বুদ্ধি', highlight: ['বাতি'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#fff8e1"/><rect y="1150" width="1080" height="770" fill="#a1887f" stroke="${O}" stroke-width="6"/>
${at(540, 1440, .9, dav('think', { mouth: 'smile', brows: 'up', px: 6 }), 'bob')}
<g transform="translate(830,1040)"><circle r="130" fill="#ffe082" fill-opacity=".5"/></g>
${flame(830, 1010, 1, 'zap')}${lamp(260, 980, 1.2)}
${P.label(540, 230, 'নিরাপদ বাতি?', { fill: '#4e342e', rot: -2, delay: .3, fs: 70 })}
${T(540, 600, 'আগুন ভেতরে, বাইরে নিরাপদ', 52, '#4e342e', 'class="pop"')}`) });
// 5
scenes.push({ narration: 'ডেভি একটা অদ্ভুত পরীক্ষা করলেন। একটা মোমবাতির শিখাকে সূক্ষ্ম তারের জালের ভেতর রাখলেন। দেখা গেল, জালের বাইরের গ্যাস জ্বলছে না, কারণ ধাতুর জাল গ্যাসকে এত ঠান্ডা করে দেয় যে আগুন ছড়াতে পারে না!', caption: 'তারের জাল', highlight: ['তারের জাল'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#e8f5e9"/><rect y="1150" width="1080" height="770" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
<g transform="translate(540,1000)"><rect x="-130" y="-160" width="260" height="300" fill="#cfd8dc" fill-opacity=".5" stroke="${O}" stroke-width="7"/>${[-100, -60, -20, 20, 60, 100].map(x => `<line x1="${x}" y1="-160" x2="${x}" y2="140" stroke="#78909c" stroke-width="4"/>`).join('')}${[-120, -80, -40, 0, 40, 80, 120].map(y => `<line x1="-130" y1="${y}" x2="130" y2="${y}" stroke="#78909c" stroke-width="4"/>`).join('')}</g>
${flame(540, 1010, .8, 'zap')}
${T(540, 760, 'জাল = ঠান্ডা করে', 58, '#2e5e3e', 'class="pop"')}
${at(900, 1450, .75, dav('think', { mouth: 'smile', brows: 'normal', px: -6 }), 'bob')}`) });
// 6
scenes.push({ narration: '১৮১৫ সালে ডেভি তৈরি করলেন এক নিরাপদ বাতি। ধাতুর জালে ঘেরা এই বাতি হাতে নিয়ে শ্রমিকরা অনেক নিরাপদে খনির ভেতর কাজ করতে পারতেন। অসংখ্য প্রাণ বেঁচে গেল।', caption: 'নিরাপদ বাতি', highlight: ['নিরাপদ বাতি'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#fff3e0"/><rect y="1150" width="1080" height="770" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${lamp(540, 1000, 2.2)}
${at(230, 1430, .85, miner('stand', { mouth: 'grin', brows: 'normal', px: 4 }), 'bob')}${at(850, 1430, .85, miner('stand', { mouth: 'smile', brows: 'up', px: -4 }), 'bob')}
${P.label(540, 260, 'ডেভির লণ্ঠন', { fill: '#2e5e3e', rot: -2, delay: .2, fs: 66 })}`) });
// 7
scenes.push({ narration: 'এই আবিষ্কার অনেক বছর ধরে খনির শ্রমিকদের বাঁচিয়েছে। ডেভি আরেকটা বড় কাজও করেছিলেন। ১৮০৭ সালে তিনি বিদ্যুৎ দিয়ে সোডিয়াম আর পটাসিয়াম নামের দুটি নতুন ধাতু আলাদা করেছিলেন।', caption: 'নতুন ধাতু', highlight: ['সোডিয়াম', 'পটাসিয়াম'],
  svg: svg(`${kickCss}`, `<defs>${P.grad('skd7', '#d1c4e9', '#f3e5f5')}</defs><rect width="1080" height="1920" fill="url(#skd7)"/>${P.stars(20)}
${at(540, 1450, .9, dav('stand', { mouth: 'smile', brows: 'normal', px: 0 }), 'bob')}
<g transform="translate(540,500)"><rect x="-260" y="-70" width="520" height="150" rx="16" fill="#ffffff" stroke="${O}" stroke-width="6"/>${T(-120, 30, 'Na', 90, '#5e35b1')}${T(120, 30, 'K', 90, '#e65100')}</g>
${T(540, 700, 'সোডিয়াম ও পটাসিয়াম', 62, '#3b2a20', 'class="pop"')}`) });
// 8
scenes.push({ narration: 'একটা ছোট বাতি বাঁচিয়েছে অসংখ্য মানুষের জীবন। সেই নিরাপদ বাতির আলো আজও মনে করিয়ে দেয়, যে বিজ্ঞান সবচেয়ে বড় উপকার করে বিপদের সময়ই।', caption: 'একটা আলো', highlight: ['আলো'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#1f1d3a"/>${P.stars(26)}
${lamp(540, 900, 2.6)}
<g transform="translate(540,900)"><circle r="260" fill="#ffd54f" fill-opacity=".18"/></g>
${T(540, 380, 'একটা বাতি, অনেক প্রাণ', 70, '#ffd54f', 'class="pop"')}
${at(300, 1520, .6, miner('stand', { mouth: 'smile', brows: 'normal', px: 4 }), 'bob')}${at(780, 1520, .6, dav('stand', { mouth: 'smile', brows: 'up', px: -4 }), 'bob')}`) });
// 9
scenes.push({ narration: 'ডেভির নিরাপদ বাতি দেখাল, বিজ্ঞানের একটা ছোট্ট চিন্তা কীভাবে অনেক প্রাণ বাঁচাতে পারে। পরের পর্বে থাকছে রেল ইঞ্জিনের পথিকৃৎ, জর্জ স্টিফেনসনের গল্প।', caption: 'পরের পর্বে', highlight: ['স্টিফেনসনের'],
  svg: svg(`${kickCss}`, `<defs>${P.grad('sk9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#sk9)"/>${P.rays(540, 620, '#ffc93c', .32)}
${at(540, 1420, 1, dav('stand', { mouth: 'smile', brows: 'normal', px: 0 }), 'bob')}
${P.label(540, 300, 'ডেভির গল্প শেষ', { fill: '#4e342e', rot: -2, delay: .2, fs: 72 })}
${T(540, 1100, 'পরের পর্বে: জর্জ স্টিফেনসন', 66, '#3b2a20')}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'খনির আলো', series: 'আবিষ্কারের গল্প · পর্ব ৯', episode: 9, scientist: 'হামফ্রি ডেভি',
  summary: 'হাসির গ্যাস নিয়ে মজার পরীক্ষা থেকে শুরু। খনির বিপদ থামাতে ডেভি বানালেন তারের জালে ঘেরা নিরাপদ বাতি, যা বাঁচাল অসংখ্য শ্রমিকের প্রাণ।' }, scenes);
console.log('ep09:', scenes.length, 'scenes');
