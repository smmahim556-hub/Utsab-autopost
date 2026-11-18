// আবিষ্কারের গল্প · পর্ব ২৩: আলবার্ট আইনস্টাইন. Our own retelling (facts checked: born 1879 in Ulm, Germany; a compass his
// father showed him at about age 5 made him wonder about invisible forces; worked as a clerk at the patent office in Bern;
// in 1905 published papers on the photoelectric effect, special relativity and E = mc²; general relativity in 1915, gravity
// as curved space-time; the 1919 solar eclipse showed starlight bending near the Sun; Nobel Prize in Physics 1921 for the
// photoelectric effect; moved to Princeton, USA, in 1933; died 1955).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const ein = person({ skin: '#f1c28f', hair: 'long', hairColor: '#cfd8dc', outfit: 'coat', cloth: '#6d4c41', legsColor: '#37474f' });
const young = person({ skin: '#f1c28f', hair: 'short', hairColor: '#3e2723', outfit: 'coat', cloth: '#455a64', legsColor: '#263238' });
const kid = person({ skin: '#f1c28f', hair: 'short', hairColor: '#3e2723', outfit: 'tunic', cloth: '#1e88e5', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}">${t}</text>`;
const compass = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><circle r="120" fill="#ffecb3" stroke="${O}" stroke-width="8"/><circle r="95" fill="#fffde7" stroke="${O}" stroke-width="4"/><path d="M0 -80 L18 0 L-18 0 Z" fill="#e53935" stroke="${O}" stroke-width="4"/><path d="M0 80 L18 0 L-18 0 Z" fill="#90a4ae" stroke="${O}" stroke-width="4"/><circle r="9" fill="${O}"/>${T(0, -100 + 0, '', 1, '#000')}</g>`;
const board = (x, y, inner) => `<g transform="translate(${x},${y})"><rect x="-330" y="-170" width="660" height="340" rx="14" fill="#2e7d32" stroke="${O}" stroke-width="8"/><rect x="-310" y="-150" width="620" height="300" fill="#1b5e20"/>${inner}</g>`;
const sun = (x, y, r = 120) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffca28" stroke="${O}" stroke-width="6"/>`;
const star = (x, y, s = 1) => `<path transform="translate(${x},${y}) scale(${s})" d="M0 -30 L9 -9 L30 0 L9 9 L0 30 L-9 9 L-30 0 L-9 -9 Z" fill="#fff59d" stroke="${O}" stroke-width="3"/>`;

const scenes = [];
scenes.push({ narration: 'আলবার্ট আইনস্টাইন জন্মেছিলেন ১৮৭৯ সালে, জার্মানির উলম শহরে। পাঁচ বছর বয়সে বাবা তাঁকে একটা কম্পাস দেখালেন।',
  svg: svg(``, `<defs>${P.grad('ge1', '#d6ecff', '#f5fbff')}</defs><rect x="-800" width="2680" height="1920" fill="url(#ge1)"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${compass(540, 640, 1.1)}${at(540, 1460, .8, kid('point', { mouth: 'o', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'উলম, ১৮৭৯', { fill: '#0d47a1', rot: -3, delay: .3, fs: 66 })}`) });
scenes.push({ narration: 'কম্পাসের কাঁটা যেদিকেই ঘোরানো হোক, উত্তর দিকেই ফেরে। ছোট্ট আলবার্ট ভাবলেন, কোন অদৃশ্য শক্তি একে টানছে?',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff8e1"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#ffe082" stroke="${O}" stroke-width="6"/>
${compass(540, 560, 1.4)}
${at(540, 1460, .8, kid('think', { mouth: 'hmm', brows: 'think', px: 0 }), '')}
${P.label(540, 200, 'অদৃশ্য শক্তি?', { fill: '#e65100', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'বড় হয়ে তিনি চাকরি নিলেন সুইজারল্যান্ডের বার্নে, পেটেন্ট অফিসে। দিনে অন্যের আবিষ্কার পরীক্ষা করতেন, আর অবসরে ভাবতেন আলো আর সময় নিয়ে।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#eceff1"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#b0bec5" stroke="${O}" stroke-width="6"/>
<rect x="80" y="1080" width="480" height="40" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${[0, 1, 2].map(i => `<rect x="${130 + i * 50}" y="${960 - i * 20}" width="180" height="${120 + i * 20}" fill="#fffde7" stroke="${O}" stroke-width="5"/>`).join('')}
${at(800, 1460, .8, young('think', { mouth: 'smile', brows: 'think', px: -4 }), '')}
${P.label(540, 230, 'বার্নের পেটেন্ট অফিস', { fill: '#37474f', rot: -2, delay: .2, fs: 60 })}`) });
scenes.push({ narration: 'তিনি কল্পনা করতেন, যদি আলোর রশ্মির পাশে পাশে ছুটতে পারতাম, তাহলে কেমন দেখাত? এই প্রশ্ন থেকেই এল নতুন ভাবনা।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#1a237e"/>
${[[-500, 300], [-200, 500], [1300, 400], [1600, 650], [150, 380], [900, 330]].map(([x, y]) => star(x, y, 1)).join('')}
<path d="M-800 820 L1880 820" stroke="#fff59d" stroke-width="22"/><path d="M-800 820 L1880 820" stroke="#ffca28" stroke-width="8"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#283593" stroke="${O}" stroke-width="6"/>
${at(540, 1460, .85, young('point', { mouth: 'o', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'আলোর সঙ্গে দৌড়', { fill: '#283593', rot: -2, delay: .2, fs: 64 })}`) });
scenes.push({ narration: '১৯০৫ সাল, এক বছরেই কয়েকটি যুগান্তকারী গবেষণা। তার একটিতে এল বিখ্যাত সূত্র, ই সমান এম সি স্কয়ার। অল্প ভরেও লুকিয়ে আছে বিপুল শক্তি।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff3e0"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#bcaaa4" stroke="${O}" stroke-width="6"/>
${board(540, 620, T(0, 45, 'E = mc²', 150, '#ffffff'))}
${at(540, 1460, .8, young('point', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${P.label(540, 230, '১৯০৫: বিস্ময়ের বছর', { fill: '#bf360c', rot: -2, delay: .2, fs: 62 })}`) });
scenes.push({ narration: '১৯১৫ সালে তিনি বললেন, ভারী বস্তু চারপাশের জায়গা আর সময়কে বাঁকিয়ে দেয়। এটাই মহাকর্ষ। এর নাম আপেক্ষিকতার সাধারণ তত্ত্ব।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#e8eaf6"/>
${[0, 1, 2, 3, 4, 5].map(i => `<path d="M-800 ${420 + i * 90} Q540 ${560 + i * 90 + (3 - Math.abs(i - 2.5)) * 70} 1880 ${420 + i * 90}" fill="none" stroke="#7986cb" stroke-width="6"/>`).join('')}
<circle cx="540" cy="760" r="110" fill="#ffb300" stroke="${O}" stroke-width="7"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#9fa8da" stroke="${O}" stroke-width="6"/>
${at(860, 1460, .7, ein('point', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'বাঁকা স্থান-কাল, ১৯১৫', { fill: '#283593', rot: -2, delay: .2, fs: 60 })}`) });
scenes.push({ narration: '১৯১৯ সালের সূর্যগ্রহণে বিজ্ঞানীরা দেখলেন, সূর্যের পাশ দিয়ে আসা তারার আলো সত্যিই বেঁকে যায়। রাতারাতি বিশ্বজুড়ে বিখ্যাত হলেন আইনস্টাইন।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#0d1b3e"/>
<circle cx="540" cy="700" r="170" fill="#ffca28" opacity=".5"/><circle cx="540" cy="700" r="140" fill="#111" stroke="#ffe082" stroke-width="10"/>
${star(1400, 380, 1.4)}<path d="M1380 400 Q760 470 560 920 L120 1220" fill="none" stroke="#fff59d" stroke-width="7" stroke-dasharray="20 14"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#1a237e" stroke="${O}" stroke-width="6"/>
${P.label(540, 230, 'সূর্যগ্রহণ, ১৯১৯', { fill: '#1a237e', rot: -2, delay: .2, fs: 64 })}`) });
scenes.push({ narration: '১৯২১ সালে আলোর কণা নিয়ে কাজের জন্য তিনি পদার্থবিজ্ঞানে নোবেল পুরস্কার পেলেন। সেই কাজ থেকেই পরে এসেছে সোলার প্যানেলের মতো প্রযুক্তি।',
  svg: svg(``, `<defs>${P.grad('ge8', '#fff3c4', '#fffdf2')}</defs><rect x="-800" width="2680" height="1920" fill="url(#ge8)"/>
<g transform="translate(540,520) scale(.85)"><path d="M-50 -220 L-20 -80 L20 -80 L50 -220" fill="#1565c0" stroke="${O}" stroke-width="5"/><circle r="110" fill="#ffca28" stroke="${O}" stroke-width="8"/>${T(0, 30, '১৯২১', 80, '#e65100')}</g>
${at(540, 1460, .9, ein('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${P.label(540, 200, 'নোবেল পুরস্কার', { fill: '#e65100', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: 'আইনস্টাইন বলতেন, কল্পনা জ্ঞানের চেয়েও বড়। একটা কম্পাস দেখে শুরু হওয়া প্রশ্নই বদলে দিল মহাবিশ্বকে দেখার চোখ। আইনস্টাইনের গল্প এখানেই শেষ।', caption: 'আইনস্টাইনের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('ge9', '#ffe0a3', '#fff7e0')}</defs><rect x="-800" width="2680" height="1920" fill="url(#ge9)"/>${P.rays(540, 520, '#ffc93c', .32)}
${compass(540, 420, .7)}
${at(540, 1420, 1, ein('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 200, 'আইনস্টাইনের গল্প শেষ', { fill: '#4e342e', rot: -2, delay: .2, fs: 58 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'কল্পনার শক্তি', series: 'আবিষ্কারের গল্প · পর্ব ২৩', episode: 23, scientist: 'আলবার্ট আইনস্টাইন',
  summary: 'ছোটবেলার একটা কম্পাস থেকে ই সমান এম সি স্কয়ার আর বাঁকা স্থান-কাল, কল্পনা দিয়ে মহাবিশ্বকে নতুন করে বোঝালেন আলবার্ট আইনস্টাইন।' }, scenes);
console.log('ep23:', scenes.length, 'scenes');
