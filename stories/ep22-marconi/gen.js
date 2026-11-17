// আবিষ্কারের গল্প · পর্ব ২২: গুলিয়েলমো মার্কনি. Our own retelling (facts checked: born 1874 in Bologna, Italy; as a young man
// experimented with electromagnetic (Hertzian) waves in the attic of the family villa; around 1895 sent signals across the
// garden and over a hill; moved to England in 1896 and patented wireless telegraphy; in 1899 signals crossed the English
// Channel; on 12 December 1901 the Morse letter S was received in St John's, Newfoundland, from Poldhu, Cornwall, across the
// Atlantic; ships used wireless to call for help (Titanic, 1912); Nobel Prize in Physics 1909 shared with Ferdinand Braun).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const mar = person({ skin: '#f1c28f', hair: 'short', hairColor: '#3e2723', outfit: 'coat', cloth: '#5d4037', legsColor: '#263238' });
const kid = person({ skin: '#f1c28f', hair: 'short', hairColor: '#3e2723', outfit: 'coat', cloth: '#00897b', legsColor: '#4e342e' });
const helper = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#8d6e63', outfit: 'coat', cloth: '#1565c0', legsColor: '#37474f' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}">${t}</text>`;
const box = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-110" y="-70" width="220" height="140" rx="12" fill="#6d4c41" stroke="${O}" stroke-width="6"/><circle cx="-50" cy="0" r="22" fill="#ffca28" stroke="${O}" stroke-width="4"/><rect x="10" y="-20" width="70" height="40" rx="6" fill="#263238"/><path d="M60 -70 L60 -240" stroke="${O}" stroke-width="8"/><circle cx="60" cy="-250" r="14" fill="#e53935" stroke="${O}" stroke-width="4"/></g>`;
const waves = (x, y, dir = 1) => `<g transform="translate(${x},${y}) scale(${dir},1)" stroke="#1e88e5" stroke-width="9" fill="none" opacity=".9"><path d="M0 -50 Q40 0 0 50"/><path d="M40 -90 Q100 0 40 90"/><path d="M80 -130 Q160 0 80 130"/></g>`;
const tower = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-60 0 L0 -420 L60 0 Z" fill="none" stroke="#455a64" stroke-width="10"/><path d="M-45 -100 L45 -100 M-30 -220 L30 -220 M-15 -330 L15 -330" stroke="#455a64" stroke-width="8"/><circle cx="0" cy="-430" r="16" fill="#e53935" stroke="${O}" stroke-width="4"/></g>`;
const ship = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-240 0 L240 0 L190 90 L-190 90 Z" fill="#37474f" stroke="${O}" stroke-width="6"/><rect x="-140" y="-90" width="240" height="90" fill="#eceff1" stroke="${O}" stroke-width="5"/><rect x="40" y="-170" width="50" height="80" fill="#e53935" stroke="${O}" stroke-width="5"/><path d="M-200 -90 L-200 -260" stroke="${O}" stroke-width="6"/></g>`;

const scenes = [];
scenes.push({ narration: 'গুলিয়েলমো মার্কনি জন্মেছিলেন ১৮৭৪ সালে, ইতালির বোলোনিয়ায়। ছোটবেলা থেকেই বিদ্যুৎ আর যন্ত্র নিয়ে খেলতে ভালোবাসতেন।',
  svg: svg(``, `<defs>${P.grad('gm1', '#d6ecff', '#f5fbff')}</defs><rect width="1080" height="1920" fill="url(#gm1)"/>
<rect y="1330" width="1080" height="590" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${box(300, 1250, .8)}${at(700, 1460, .8, kid('point', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'বোলোনিয়া, ১৮৭৪', { fill: '#0d47a1', rot: -3, delay: .3, fs: 66 })}`) });
scenes.push({ narration: 'তিনি পড়লেন, বাতাসে অদৃশ্য বিদ্যুৎ-চুম্বকীয় তরঙ্গ ছোটে। ভাবলেন, এই তরঙ্গ দিয়ে কি তার ছাড়াই খবর পাঠানো যায়?',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff8e1"/>
<rect y="1330" width="1080" height="590" fill="#ffe082" stroke="${O}" stroke-width="6"/>
${waves(380, 640)}${waves(700, 640, -1)}
${at(540, 1460, .85, mar('think', { mouth: 'hmm', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'তার ছাড়া খবর?', { fill: '#e65100', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: 'বাড়ির চিলেকোঠায় বানালেন যন্ত্র। এক কোণে বোতাম চাপলেন, ঘরের অন্য কোণে ঘণ্টা বেজে উঠল, কোনো তার ছাড়াই!',
  svg: svg(``, `<rect width="1080" height="1920" fill="#d7ccc8"/>
<path d="M0 520 L540 300 L1080 520" fill="none" stroke="${O}" stroke-width="8"/>
<rect y="1330" width="1080" height="590" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${box(220, 1250, .7)}${waves(330, 1050)}
<g transform="translate(860,1150)"><path d="M-60 60 Q-60 -60 0 -70 Q60 -60 60 60 Z" fill="#ffca28" stroke="${O}" stroke-width="6"/><circle cy="70" r="14" fill="${O}"/></g>
${at(560, 1460, .75, mar('point', { mouth: 'grin', brows: 'up', px: 4 }), '')}
${P.label(540, 200, 'চিলেকোঠার পরীক্ষা', { fill: '#4e342e', rot: -2, delay: .2, fs: 64 })}`) });
scenes.push({ narration: 'তারপর বাগান পেরিয়ে, পাহাড়ের ওপারে সংকেত পাঠালেন। ওপারে সহকারী সংকেত পেয়ে বন্দুক ছুড়ে জানালেন, পৌঁছেছে!',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e1f5fe"/>
<path d="M300 1330 Q540 700 780 1330 Z" fill="#81c784" stroke="${O}" stroke-width="6"/>
<rect y="1330" width="1080" height="590" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${waves(300, 700)}
${at(160, 1460, .65, mar('point', { mouth: 'smile', brows: 'up', px: 4 }), '')}${at(920, 1460, .65, helper('point', { mouth: 'shout', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'পাহাড়ের ওপারে', { fill: '#1b5e20', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'ইতালিতে আগ্রহ না পেয়ে তিনি গেলেন ইংল্যান্ডে, ১৮৯৬ সালে পেলেন বেতার টেলিগ্রাফের পেটেন্ট।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#eceff1"/>
<rect x="290" y="420" width="500" height="340" rx="10" fill="#fffde7" stroke="${O}" stroke-width="6"/>
${[0, 1, 2, 3].map(i => `<rect x="340" y="${480 + i * 60}" width="${i % 2 ? 300 : 400}" height="20" fill="#bcaaa4"/>`).join('')}
<circle cx="720" cy="720" r="50" fill="#e53935" stroke="${O}" stroke-width="5"/>
<rect y="1330" width="1080" height="590" fill="#b0bec5" stroke="${O}" stroke-width="6"/>
${at(540, 1460, .9, mar('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'ইংল্যান্ড, ১৮৯৬', { fill: '#37474f', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'সবাই বলল, পৃথিবী গোল, তরঙ্গ এত দূরে যাবে না। কিন্তু ১৯০১ সালে আটলান্টিক মহাসাগর পেরিয়ে পৌঁছল মোর্স কোডের তিনটি টুক।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e3f2fd"/>
<rect y="1100" width="1080" height="820" fill="#4fc3f7" stroke="${O}" stroke-width="6"/>
${tower(140, 1100, .9)}${tower(940, 1100, .9)}
<path d="M160 620 Q540 300 920 620" fill="none" stroke="#1e88e5" stroke-width="10" stroke-dasharray="24 18"/>
${T(540, 560, '• • •', 110, '#e53935')}
${P.label(540, 230, 'আটলান্টিক পার, ১৯০১', { fill: '#01579b', rot: -2, delay: .2, fs: 60 })}`) });
scenes.push({ narration: 'এরপর জাহাজে জাহাজে বসল বেতার যন্ত্র। মাঝসমুদ্রে বিপদে পড়লে জাহাজ সাহায্য চাইতে পারত, বাঁচল অনেক প্রাণ।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e1f5fe"/>
<rect y="1150" width="1080" height="770" fill="#4fc3f7" stroke="${O}" stroke-width="6"/>
${ship(540, 1120, 1.2)}${waves(320, 640, -1)}${waves(330, 640)}
${P.label(540, 230, 'জাহাজে বেতার', { fill: '#0d47a1', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: '১৯০৯ সালে এই কাজের জন্য তিনি পদার্থবিজ্ঞানে নোবেল পুরস্কার পেলেন।',
  svg: svg(``, `<defs>${P.grad('gm8', '#fff3c4', '#fffdf2')}</defs><rect width="1080" height="1920" fill="url(#gm8)"/>
<g transform="translate(540,520) scale(.85)"><path d="M-50 -220 L-20 -80 L20 -80 L50 -220" fill="#1565c0" stroke="${O}" stroke-width="5"/><circle r="110" fill="#ffca28" stroke="${O}" stroke-width="8"/>${T(0, 30, '১৯০৯', 80, '#e65100')}</g>
${at(540, 1460, .9, mar('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${P.label(540, 200, 'নোবেল পুরস্কার', { fill: '#e65100', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: 'আজ রেডিও, মোবাইল, ওয়াইফাই, সবই সেই তার ছাড়া তরঙ্গের পথে। মার্কনির গল্প এখানেই শেষ।', caption: 'মার্কনির গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('gm9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#gm9)"/>${P.rays(540, 520, '#ffc93c', .32)}
${tower(540, 700, .7)}${waves(600, 420)}${waves(480, 420, -1)}
${at(540, 1420, 1, mar('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 200, 'মার্কনির গল্প শেষ', { fill: '#4e342e', rot: -2, delay: .2, fs: 62 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'তার ছাড়া খবর', series: 'আবিষ্কারের গল্প · পর্ব ২২', episode: 22, scientist: 'গুলিয়েলমো মার্কনি',
  summary: 'চিলেকোঠার পরীক্ষা থেকে আটলান্টিক পার, তার ছাড়াই খবর পাঠানোর পথ দেখালেন গুলিয়েলমো মার্কনি।' }, scenes);
console.log('ep22:', scenes.length, 'scenes');
