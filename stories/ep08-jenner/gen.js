// আবিষ্কারের গল্প · পর্ব ৮: এডওয়ার্ড জেনার. Our own retelling (facts checked: born 1749 in Berkeley, Gloucestershire, England;
// doctor; many dairy maids who had caught cowpox (a mild cow disease) did not get smallpox; in 1796 he took fluid from a
// milkmaid's cowpox sore and put it into 8-year-old James Phipps, who got only a mild fever; later exposed him to smallpox
// and he stayed well; 1798 paper; 'vaccine' from Latin 'vacca' = cow; WHO declared smallpox eradicated in 1980).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const jen = person({ skin: '#f3c9a0', hair: 'short', hairColor: '#e8e4dc', outfit: 'coat', cloth: '#4e6b8c', legsColor: '#3b2a20' });
const maid = person({ skin: '#eec39a', hair: 'long', hairColor: '#2b1d14', outfit: 'tunic', cloth: '#d9826b', legsColor: '#4e342e' });
const boy = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#7cb342', legsColor: '#4e342e' });
const sick = person({ skin: '#e8b98e', hair: 'short', hairColor: '#5d4037', outfit: 'tunic', cloth: '#90a4ae', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const room = (wall = '#efe2c4', floor = '#a1724c') => `<rect width="1080" height="1920" fill="${wall}"/><rect y="1150" width="1080" height="770" fill="${floor}" stroke="${O}" stroke-width="6"/>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const cow = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="150" ry="90" fill="#fff" stroke="${O}" stroke-width="7"/><ellipse cx="-70" cy="-20" rx="40" ry="30" fill="#3b2a20"/><ellipse cx="60" cy="10" rx="32" ry="26" fill="#3b2a20"/><circle cx="-160" cy="-60" r="62" fill="#fff" stroke="${O}" stroke-width="7"/><circle cx="-180" cy="-70" r="10" fill="${O}"/><rect x="-110" y="60" width="26" height="90" fill="#fff" stroke="${O}" stroke-width="6"/><rect x="-30" y="60" width="26" height="90" fill="#fff" stroke="${O}" stroke-width="6"/><rect x="50" y="60" width="26" height="90" fill="#fff" stroke="${O}" stroke-width="6"/><rect x="110" y="60" width="26" height="90" fill="#fff" stroke="${O}" stroke-width="6"/></g>`;
const germ = (x, y, s = 1, cls = 'twinkle') => `<g transform="translate(${x},${y}) scale(${s})" class="${cls}"><circle r="34" fill="#c5e1a5" stroke="${O}" stroke-width="5"/><circle cx="-10" cy="-8" r="6" fill="${O}"/><circle cx="12" cy="6" r="6" fill="${O}"/><circle cx="-6" cy="14" r="5" fill="${O}"/></g>`;
const kickCss = `.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}.twinkle{animation:tw 1s steps(2) infinite}@keyframes tw{50%{opacity:.3}}`;

const scenes = [];
// 1
scenes.push({ narration: 'এডওয়ার্ড জেনার জন্মেছিলেন ১৭৪৯ সালে, ইংল্যান্ডের একটা গ্রামে। ছোটবেলা থেকেই তাঁর প্রকৃতির প্রতি টান ছিল, আর বড় হয়ে তিনি হলেন ডাক্তার।', caption: 'গ্রামের ছেলে', highlight: ['ডাক্তার'],
  svg: svg('', `${room('#dbeee0', '#8bc34a')}<rect y="1150" width="1080" height="770" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
<rect x="0" y="0" width="1080" height="1150" fill="url(#skyj)"/><defs>${P.grad('skyj', '#bfe6ff', '#e9f8ff')}</defs>
<g class="drift">${P.cloud(260, 360, .8)}${P.cloud(820, 300, .7)}</g>
<g transform="translate(830,1150)"><rect x="-200" y="-380" width="260" height="380" fill="#f3e3c3" stroke="${O}" stroke-width="7"/><path d="M-220 -380 L-70 -500 L80 -380Z" fill="#b5523b" stroke="${O}" stroke-width="7"/><rect x="-40" y="-260" width="60" height="70" fill="#8fd3ff" stroke="${O}" stroke-width="5"/></g>
${cow(260, 1330, .6)}${at(560, 1420, .85, jen('stand', { mouth: 'smile', brows: 'normal', px: 6 }), 'bob')}${at(880, 1450, .6, boy('stand', { mouth: 'smile', brows: 'up', px: -6 }), 'bob')}
${P.label(540, 230, 'ইংল্যান্ড, ১৭৪৯', { fill: '#2e5e3e', rot: -3, delay: .3, fs: 62 })}`) });
// 2
scenes.push({ narration: 'তখনকার দিনে বসন্ত রোগ ছিল ভয়ংকর। রোগীর গায়ে ফোসকা পড়ত, অনেকে মারা যেত, আর যারা বাঁচত তাদের মুখে থেকে যেত দাগ।', caption: 'ভয়ংকর বসন্ত', highlight: ['বসন্ত'],
  svg: svg(`${kickCss}`, `${room('#d9d4cc', '#6d6259')}
<rect x="120" y="980" width="840" height="170" rx="20" fill="#8d6e63" stroke="${O}" stroke-width="7"/>
${at(540, 960, .9, sick('stand', { mouth: 'frown', brows: 'up', px: 0 }), '')}
${[[330, 690], [470, 660], [620, 700], [760, 650], [240, 780]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" fill="#e57373" stroke="${O}" stroke-width="5"/>`).join('')}
<rect x="120" y="980" width="840" height="0" fill="none"/>
${T(540, 1290, 'বসন্ত রোগ', 96, '#e63946', 'class="pop"')}
${P.label(540, 230, 'মারাত্মক রোগ', { fill: '#b71c1c', rot: 2, delay: .2, fs: 66 })}`) });
// 3
scenes.push({ narration: 'জেনার লক্ষ্য করলেন, গরুর গোবসন্ত হলে মানুষের সাধারণত হালকা জ্বর হয়। কিন্তু যেসব দুধ দোহনকারী নারীর গোবসন্ত হয়েছিল, তাদের বসন্ত হতো না!', caption: 'দুধওয়ালীদের রহস্য', highlight: ['গোবসন্ত'],
  svg: svg(`${kickCss}`, `${room('#fbeed8', '#a1724c')}
${cow(560, 1290, .85)}${at(260, 1420, .9, maid('think', { mouth: 'smile', brows: 'normal', px: 6 }), 'bob')}
${at(880, 1420, .85, jen('think', { mouth: 'o', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'দুধওয়ালীরা বাঁচেন', { fill: '#2e5e3e', rot: -2, delay: .3, fs: 62 })}
${T(540, 720, 'গোবসন্ত → বসন্ত হয় না', 58, '#2e5e3e', 'class="pop"')}`) });
// 4
scenes.push({ narration: 'ঊনিশ শতকের ১৭৯৬ সালে জেনার একটা সাহসী পরীক্ষা করলেন। এক দুধওয়ালীর হাতের গোবসন্তের ফোসকা থেকে সামান্য রস নিয়ে তিনি আট বছরের এক ছেলে জেমস ফিপসের হাতে একটু আঁচড় দিয়ে লাগালেন।', caption: 'আট বছরের ছেলে', highlight: ['আঁচড়'],
  svg: svg(`${kickCss}`, `${room('#f2e6d0', '#a1724c')}
${at(330, 1380, .95, boy('stand', { mouth: 'grin', brows: 'normal', px: 4 }), 'bob')}${at(780, 1390, .9, jen('think', { mouth: 'hmm', brows: 'normal', px: -6 }), '')}
<g transform="translate(560,1000)"><rect x="-260" y="-30" width="180" height="26" rx="12" fill="#cfd8dc" stroke="${O}" stroke-width="6"/><rect x="-100" y="-16" width="200" height="22" fill="#eceff1" stroke="${O}" stroke-width="5"/><circle cx="-60" cy="-5" r="16" fill="#ffd23f" stroke="${O}" stroke-width="4"/></g>
${germ(120, 1010, .9)}
${P.label(540, 230, 'ছোট্ট একটা আঁচড়', { fill: '#2e5e3e', rot: 3, delay: .2, fs: 64 })}`) });
// 5
scenes.push({ narration: 'ছেলেটির হালকা জ্বর হলো, তারপর ভালো হয়ে গেল। কিছুদিন পর জেনার তাকে আসল বসন্তের জীবাণু দিলেন। কিন্তু ছেলেটির কোনো অসুখ হলো না!', caption: 'ছেলেটি সুস্থ', highlight: ['সুস্থ'],
  svg: svg(`${kickCss}`, `${room('#dff5e1', '#8bc34a')}
${at(540, 1420, 1, boy('stand', { mouth: 'grin', brows: 'up', px: 0 }), 'bob')}
<g transform="translate(540,760)"><path d="M-170 0 Q-170 -150 0 -150 Q170 -150 170 0 Q170 170 0 170 Q-170 170 -170 0Z" fill="#ffd23f" stroke="${O}" stroke-width="7" opacity="0"/></g>
<g transform="translate(860,600) scale(.6)"><path d="M-160 0 L-40 110 L170 -120" fill="none" stroke="#2e7d32" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/><path d="M-160 0 L-40 110 L170 -120" fill="none" stroke="#66bb6a" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/></g>
${P.label(540, 230, 'কোনো অসুখ নেই!', { fill: '#1b5e20', rot: -2, delay: .3, fs: 70 })}
${P.stars(14)}`) });
// 6
scenes.push({ narration: 'জেনার ১৭৯৮ সালে তাঁর ফলাফল বই আকারে প্রকাশ করলেন। অনেকে প্রথমে বিশ্বাস করেনি, কেউ কেউ ঠাট্টাও করেছিল। তবু চিকিৎসকরা ধীরে ধীরে এই পদ্ধতি মানতে শুরু করলেন।', caption: 'সবাই বিশ্বাস করেনি', highlight: ['বই'],
  svg: svg(`${kickCss}`, `${room('#efe2c4', '#8d6e63')}
${at(360, 1420, .9, jen('stand', { mouth: 'smile', brows: 'normal', px: 6 }), '')}
<rect x="600" y="1000" width="340" height="260" fill="#fff8e1" stroke="${O}" stroke-width="7"/>
${T(770, 1100, 'ভ্যাকসিন', 56, '#2e5e3e')}${T(770, 1180, 'প্রকাশ: ১৭৯৮', 40, '#3b2a20')}
${at(950, 1440, .62, maid('stand', { mouth: 'hmm', brows: 'normal', px: -6 }), '')}
${P.label(540, 230, 'নতুন বই, নতুন চিকিৎসা', { fill: '#2e5e3e', rot: -2, delay: .2, fs: 58 })}`) });
// 7
scenes.push({ narration: 'এই পদ্ধতির নাম হলো ভ্যাকসিন। নামটা এসেছে ল্যাটিন শব্দ "ভাক্কা" থেকে, যার মানে গরু। গরুর রোগ থেকেই তৈরি হলো মানুষকে বাঁচানোর উপায়।', caption: 'ভ্যাকসিন মানে গরু', highlight: ['ভ্যাকসিন'],
  svg: svg(`${kickCss}`, `${room('#fff3d6', '#a1724c')}
${cow(540, 1280, 1.05)}
${germ(230, 960, 1.1)}
${T(540, 760, 'ভ্যাকসিন', 150, '#e63946', 'class="pop"')}
${T(540, 880, 'ল্যাটিন "ভাক্কা" = গরু', 58, '#3b2a20')}`) });
// 8
scenes.push({ narration: 'ধীরে ধীরে ভ্যাকসিন ছড়িয়ে পড়ল সারা পৃথিবীতে। অনেক বছরের চেষ্টায় ১৯৮০ সালে বিশ্ব স্বাস্থ্য সংস্থা ঘোষণা করল, বসন্ত রোগ পৃথিবী থেকে সম্পূর্ণ নির্মূল হয়েছে।', caption: 'বসন্ত নির্মূল', highlight: ['নির্মূল'],
  svg: svg(`${kickCss}`, `${room('#e3f2fd', '#64b5f6')}
<g transform="translate(540,760)"><circle r="290" fill="#90caf9" stroke="${O}" stroke-width="8"/><path d="M-120 -180 Q-60 -220 -20 -150 Q-60 -100 -120 -120Z M80 -40 Q160 -80 200 20 Q140 110 60 80Z M-200 60 Q-120 40 -90 130 Q-160 190 -200 60Z" fill="#81c784" stroke="${O}" stroke-width="6"/></g>
${P.label(540, 1110, '১৯৮০: বসন্ত নির্মূল', { fill: '#2e5e3e', rot: -2, delay: .2, fs: 66 })}
${at(230, 1450, .75, jen('stand', { mouth: 'smile', brows: 'normal', px: 6 }), 'bob')}${at(860, 1450, .75, boy('stand', { mouth: 'grin', brows: 'up', px: -6 }), 'bob')}`) });
// 9
scenes.push({ narration: 'একটা গ্রামের দুধওয়ালীদের কথা থেকে শুরু হলো মানুষকে বাঁচানোর এক বিশাল যাত্রা। পরের পর্বে থাকছে আরেক বিজ্ঞানীর গল্প, যিনি খনির শ্রমিকদের বাঁচাতে নিরাপদ বাতি বানিয়েছিলেন।', caption: 'পরের পর্বে', highlight: ['পরের পর্বে'],
  svg: svg(`${kickCss}`, `<defs>${P.grad('sk9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#sk9)"/>${P.rays(540, 620, '#ffc93c', .32)}
${at(540, 1420, 1, jen('stand', { mouth: 'smile', brows: 'normal', px: 0 }), 'bob')}
${P.label(540, 300, 'জেনারের গল্প শেষ', { fill: '#2e5e3e', rot: -2, delay: .2, fs: 72 })}
${T(540, 1100, 'পরের পর্বে: হামফ্রি ডেভি', 66, '#3b2a20')}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'ভ্যাকসিনের জন্ম', series: 'আবিষ্কারের গল্প · পর্ব ৮', episode: 8, scientist: 'এডওয়ার্ড জেনার',
  summary: 'দুধওয়ালীদের একটা অদ্ভুত লক্ষণ থেকে শুরু হলো এক বড় আবিষ্কার। জেনার গোবসন্তের রস দিয়ে বসন্ত ঠেকানোর উপায় বের করলেন, জন্ম নিল ভ্যাকসিন।' }, scenes);
console.log('ep08:', scenes.length, 'scenes');
