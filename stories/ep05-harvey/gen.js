// আবিষ্কারের গল্প · পর্ব ৫: উইলিয়াম হার্ভে. Our own retelling of the book's chapter (facts checked: born 1578 in Folkestone,
// studied at Padua under Fabricius, De Motu Cordis 1628).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const har = person({ skin: '#f3c9a0', hair: 'short', hairColor: '#3b2a20', beard: 'short', beardColor: '#3b2a20', outfit: 'coat', cloth: '#1f2a44', sash: '#f4f1e8', legsColor: '#1f2a44' });
const prof = person({ skin: '#eec39a', hair: 'bald', hairColor: '#9e9e9e', beard: 'long', beardColor: '#e0e0e0', outfit: 'coat', cloth: '#6a1b9a', sash: '#f4f1e8', legsColor: '#4a148c' });
const man = c => person({ skin: c, hair: 'short', hairColor: '#2b1a10', beard: 'short', beardColor: '#2b1a10', outfit: 'coat', cloth: ['#5d4037', '#455a64', '#7b1fa2'][c.length % 3], legsColor: '#3e2723' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const day = id => `<defs>${P.grad(id, '#9fd8ff', '#eef9ff')}</defs><rect width="1080" height="1920" fill="url(#${id})"/>`;
const room = (wall = '#efe2c4', floor = '#a1724c') => `<rect width="1080" height="1920" fill="${wall}"/><rect y="1150" width="1080" height="770" fill="${floor}" stroke="${O}" stroke-width="6"/>`;
const heart = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M0 140 C-160 30 -210 -80 -160 -150 C-110 -220 -20 -200 0 -130 C20 -200 110 -220 160 -150 C210 -80 160 30 0 140Z" fill="#e63946" stroke="${O}" stroke-width="9"/><ellipse cx="-80" cy="-120" rx="34" ry="20" fill="#fff" opacity=".45"/><path d="M-40 -170 L-40 -250 M40 -175 L40 -240" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M-40 -170 L-40 -250" stroke="#e63946" stroke-width="22" stroke-linecap="round" opacity=".9"/><path d="M40 -175 L40 -240" stroke="#3f7fd1" stroke-width="22" stroke-linecap="round" opacity=".9"/></g>`;
const house = (x, y, w, h, c, roof) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" stroke="${O}" stroke-width="6"/><path d="M${x - 20} ${y + 6} L${x + w / 2} ${y - h * .45} L${x + w + 20} ${y + 6}Z" fill="${roof}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><rect x="${x + w / 2 - 28}" y="${y + h - 100}" width="56" height="100" rx="26" fill="#6b3f22" stroke="${O}" stroke-width="5"/><rect x="${x + 22}" y="${y + 40}" width="46" height="46" fill="#7cc6f0" stroke="${O}" stroke-width="5"/><rect x="${x + w - 68}" y="${y + 40}" width="46" height="46" fill="#7cc6f0" stroke="${O}" stroke-width="5"/>`;
const book = (x, y, s, title, c = '#8e2a2a') => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-150" y="-200" width="300" height="400" rx="16" fill="${c}" stroke="${O}" stroke-width="8"/><rect x="-120" y="-170" width="240" height="340" rx="10" fill="none" stroke="#ffd23f" stroke-width="5"/><text x="0" y="-60" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="46" fill="#ffd23f">${title}</text>${heart(0, 60, .38)}</g>`;

const scenes = [];
scenes.push({ narration: '১৫৭৮ সালে ইংল্যান্ডের ছোট্ট শহর ফোকস্টোনে জন্ম নেন উইলিয়াম হার্ভে। ছোটবেলা থেকেই তাঁর মন ছিল মানুষের শরীর নিয়ে।', caption: 'উইলিয়াম হার্ভে', highlight: ['হার্ভে'],
  svg: svg('', `${day('s0')}<g class="drift">${P.cloud(230, 430, .9)}${P.cloud(880, 560, .7)}</g>
${house(-260, 860, 230, 290, '#f3e1c2', '#8d4b3a')}${house(40, 900, 250, 250, '#e8d3b0', '#a0522d')}${house(760, 880, 260, 270, '#f0dcc0', '#7b3f2e')}${house(1100, 900, 230, 250, '#e8d3b0', '#8d4b3a')}
<rect y="1150" width="1080" height="770" fill="#8bc34a" stroke="${O}" stroke-width="6"/><path d="M-900 1300 L2000 1300" stroke="#c8b98e" stroke-width="60"/>
${at(540, 1290, 1.1, har('stand', { mouth: 'smile', brows: 'normal' }), 'breathe')}${P.label(540, 250, 'ফোকস্টোন, ইংল্যান্ড', { fill: '#1f2a44', rot: -3, delay: .3, fs: 64 })}`) });

scenes.push({ narration: 'ডাক্তারি পড়তে তিনি গেলেন ইতালির পাদুয়ায়। সেখানে তাঁর শিক্ষক দেখালেন, শিরার ভেতরে ছোট ছোট দরজার মতো ভাল্ব থাকে।', caption: 'শিরার ভেতর ছোট দরজা', highlight: ['দরজা'],
  svg: svg(`.flap{transform-box:fill-box;transform-origin:0 50%;animation:flap 1.2s ease-in-out infinite alternate}@keyframes flap{to{transform:rotate(28deg)}}.go{stroke-dasharray:26 22;animation:go 1s linear infinite}@keyframes go{to{stroke-dashoffset:-48}}`,
    `${room('#f1e6cc', '#8d6e4f')}<rect x="80" y="300" width="920" height="540" rx="20" fill="#2e4a3a" stroke="${O}" stroke-width="10"/>
<rect x="160" y="470" width="760" height="180" rx="90" fill="#bcdcff" stroke="${O}" stroke-width="7"/>
<path class="go" d="M190 560 L890 560" stroke="#3f7fd1" stroke-width="18" stroke-linecap="round"/>
${[380, 640].map(x => `<g><path class="flap" d="M${x} 482 L${x + 70} 540" stroke="#ffd23f" stroke-width="14" stroke-linecap="round"/><path class="flap" d="M${x} 638 L${x + 70} 580" stroke="#ffd23f" stroke-width="14" stroke-linecap="round"/></g>`).join('')}
<text x="540" y="380" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="56" fill="#fff">শিরা</text><text x="820" y="760" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="44" fill="#ffd23f">ভাল্ব</text>
${at(250, 1300, .9, prof('point', { mouth: 'o', brows: 'up', px: 8 }), 'breathe')}${at(820, 1300, .9, har('think', { mouth: 'hmm', brows: 'think' }), 'breathe')}${P.label(540, 190, 'পাদুয়া, ইতালি', { fill: '#6a1b9a', rot: 3, delay: .4, fs: 56 })}`) });

scenes.push({ narration: 'তখন সবাই মানত, যকৃৎ প্রতিদিন নতুন রক্ত বানায়, আর শরীর সেই রক্ত খরচ করে ফেলে। হাজার বছর ধরে এটাই ছিল নিয়ম।', caption: 'রক্ত খরচ হয়ে যায়?', highlight: ['খরচ'],
  svg: svg(`.dr{animation:dr 2s ease-in infinite}@keyframes dr{0%{transform:translateY(0);opacity:1}100%{transform:translateY(380px);opacity:0}}`,
    `<defs><radialGradient id="rg2" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#fff3e0"/><stop offset="1" stop-color="#ffcc80"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#rg2)"/>${P.rays(540, 640, '#ffa726', .2)}
<rect y="1250" width="1080" height="670" fill="#c98b5a" stroke="${O}" stroke-width="6"/>
<path d="M300 560 Q300 420 520 420 Q800 420 800 560 Q800 700 600 720 Q420 740 300 560Z" fill="#8d3b2e" stroke="${O}" stroke-width="9"/><ellipse cx="450" cy="500" rx="60" ry="26" fill="#fff" opacity=".3"/>
<text x="550" y="600" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="62" fill="#fff">যকৃৎ</text>
${[[460, 0], [560, .6], [660, 1.2]].map(([x, d]) => `<g class="dr" style="animation-delay:${d}s"><path d="M${x} 760 Q${x + 26} 800 ${x} 830 Q${x - 26} 800 ${x} 760Z" fill="#e63946" stroke="${O}" stroke-width="5"/></g>`).join('')}
<g transform="translate(540,250) rotate(-3)"><g class="pop" style="animation-delay:.2s"><rect x="-260" y="-80" width="520" height="140" rx="16" fill="#8d6e63" stroke="${O}" stroke-width="7"/><rect x="-240" y="-62" width="480" height="104" rx="8" fill="#fff8e1" stroke="${O}" stroke-width="4"/><text x="0" y="8" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="50" fill="#5d4037">পুরনো ধারণা</text></g></g>`) });

scenes.push({ narration: 'হার্ভে হিসাব করে দেখলেন, হৃৎপিণ্ড আধা ঘণ্টায় যত রক্ত পাঠায়, তা পুরো শরীরের রক্তের চেয়েও অনেক বেশি। এত রক্ত রোজ নতুন করে বানানো অসম্ভব!', caption: 'এত রক্ত কোথা থেকে?', highlight: ['এত', 'রক্ত'],
  svg: svg(`.beat{transform-origin:center;animation:beat .8s ease-in-out infinite}@keyframes beat{15%{transform:scale(1.1)}30%{transform:scale(1)}45%{transform:scale(1.06)}}
.up{animation:up 3s steps(12) both .3s}@keyframes up{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}}`,
    `${room('#e8eef7', '#7d6450')}<rect x="40" y="200" width="1000" height="40" fill="#d6dde8"/>
<g transform="translate(330,640)"><g class="beat">${heart(0, 0, 1.05)}</g></g>
<g transform="translate(780,380)"><rect x="-110" y="0" width="220" height="560" rx="24" fill="#fff" stroke="${O}" stroke-width="8"/><rect class="up" x="-90" y="20" width="180" height="520" rx="16" fill="#e63946"/>${[1, 2, 3, 4].map(i => `<path d="M-110 ${i * 112} L-70 ${i * 112}" stroke="${O}" stroke-width="6"/>`).join('')}</g>
<text x="780" y="1010" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="50" fill="${O}">আধা ঘণ্টায়</text>
${at(160, 1340, .62, har('think', { mouth: 'o', brows: 'up', px: 6 }), 'breathe')}${P.label(540, 1210, 'অসম্ভব!', { fill: '#e63946', rot: -4, delay: 2.4, fs: 70 })}`) });

scenes.push({ narration: 'তিনি একজনের হাতে শক্ত করে বাঁধন দিলেন। দেখা গেল, শিরা ফুলে উঠছে, আর রক্ত চলছে শুধু হৃৎপিণ্ডের দিকে, উল্টো দিকে নয়।', caption: 'রক্ত চলে একদিকেই', highlight: ['একদিকেই'],
  svg: svg(`.swell{transform-box:fill-box;transform-origin:center;animation:sw 1.6s ease-in-out .6s infinite alternate}@keyframes sw{from{transform:scale(1,.6)}to{transform:scale(1,1.25)}}.go{stroke-dasharray:30 26;animation:go .9s linear infinite}@keyframes go{to{stroke-dashoffset:56}}`,
    `${room('#f4ead6', '#8d6e4f')}
<path d="M-900 520 L1900 520" stroke="#e7d7b8" stroke-width="8"/>
<rect x="-120" y="560" width="1100" height="230" rx="115" fill="#f3c9a0" stroke="${O}" stroke-width="9"/>
<circle cx="1000" cy="675" r="140" fill="#f3c9a0" stroke="${O}" stroke-width="9"/>${[0, 1, 2, 3].map(i => `<rect x="${1080 + i * 6}" y="${590 + i * 44}" width="120" height="40" rx="20" fill="#f3c9a0" stroke="${O}" stroke-width="7"/>`).join('')}
<path class="go" d="M900 675 L40 675" stroke="#3f7fd1" stroke-width="22" stroke-linecap="round"/>
${[260, 470, 680].map(x => `<ellipse class="swell" cx="${x}" cy="675" rx="34" ry="30" fill="#3f7fd1" stroke="${O}" stroke-width="5"/>`).join('')}
<rect x="800" y="548" width="56" height="254" rx="12" fill="#c62828" stroke="${O}" stroke-width="7"/>
<path d="M40 860 L-40 860 M-40 860 L0 830 M-40 860 L0 890" stroke="#e63946" stroke-width="14" stroke-linecap="round" fill="none"/><text x="230" y="880" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="46" fill="${O}">হৃৎপিণ্ডের দিকে</text>
${at(540, 1330, .7, har('point', { mouth: 'grin', brows: 'up' }), 'breathe')}`) });

scenes.push({ narration: 'তখন তিনি বুঝলেন আসল রহস্য। হৃৎপিণ্ড একটা পাম্প। ধমনী দিয়ে রক্ত সারা শরীরে যায়, আর শিরা দিয়ে আবার ফিরে আসে। রক্ত ঘুরছে একটা চক্রে!', caption: 'রক্ত ঘোরে চক্রে!', highlight: ['চক্রে!'],
  svg: svg(`.ar{stroke-dasharray:34 26;animation:fl 1s linear infinite}.vn{stroke-dasharray:34 26;animation:fl 1s linear infinite reverse}@keyframes fl{to{stroke-dashoffset:-60}}
.beat{transform-origin:center;animation:beat .8s ease-in-out infinite}@keyframes beat{15%{transform:scale(1.1)}30%{transform:scale(1)}}`,
    `<defs>${P.grad('bg5', '#fff1f1', '#ffe0d6')}</defs><rect width="1080" height="1920" fill="url(#bg5)"/>${P.rays(540, 760, '#ff8a80', .16)}
<path d="M540 260 m-80 0 a80 80 0 1 0 160 0 a80 80 0 1 0 -160 0 M470 360 Q380 380 360 560 L330 980 Q330 1040 380 1040 L420 1040 L430 1380 L520 1380 L540 1080 L560 1380 L650 1380 L660 1040 L700 1040 Q750 1040 750 980 L720 560 Q700 380 610 360Z" fill="#fde3cf" stroke="${O}" stroke-width="8" stroke-linejoin="round"/>
<path class="ar" d="M560 560 Q760 520 700 900 Q660 1250 600 1340" fill="none" stroke="#e63946" stroke-width="18" stroke-linecap="round"/>
<path class="vn" d="M480 1340 Q420 1250 380 900 Q320 520 520 560" fill="none" stroke="#3f7fd1" stroke-width="18" stroke-linecap="round"/>
<path class="ar" d="M560 540 Q600 380 540 330" fill="none" stroke="#e63946" stroke-width="14" stroke-linecap="round"/>
<g transform="translate(540,600)"><g class="beat">${heart(0, 0, .42)}</g></g>
<text x="860" y="820" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="50" fill="#e63946">ধমনী</text><text x="220" y="820" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="50" fill="#3f7fd1">শিরা</text>`) });

scenes.push({ narration: '১৬২৮ সালে তিনি বই লিখে এই আবিষ্কারের কথা জানালেন। কিন্তু প্রথমে অনেকেই তাঁকে নিয়ে হাসাহাসি করল।', caption: 'প্রথমে হাসাহাসি', highlight: ['হাসাহাসি'],
  svg: svg(`.bob{transform-origin:center;animation:bob 1.4s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-18px)}}`,
    `${room('#efe2c4', '#8d6e4f')}${[-560, -250, 60, 900, 1210, 1520].map(x => `<rect x="${x}" y="0" width="120" height="1150" fill="#fff8ea" stroke="${O}" stroke-width="6"/>`).join('')}
<g transform="translate(540,560)"><g class="bob">${book(0, 0, 1, '১৬২৮')}</g></g>
${at(170, 1320, .7, man('#e0a878')('point', { mouth: 'grin', brows: 'up' }))}${at(910, 1320, .7, man('#c98f63')('hips', { mouth: 'grin', brows: 'angry' }))}
${at(540, 1330, .72, har('stand', { mouth: 'frown', brows: 'think' }), 'breathe')}
${P.label(180, 960, 'হা হা!', { fill: '#e65100', rot: -6, delay: .5, fs: 54 })}${P.label(900, 940, 'ভুল কথা!', { fill: '#e65100', rot: 5, delay: 1, fs: 54 })}`) });

scenes.push({ narration: 'কিন্তু সত্যি কখনো চাপা থাকে না। ধীরে ধীরে সবাই মেনে নিল তাঁর কথা, আর এখান থেকেই শুরু হলো আধুনিক চিকিৎসার নতুন পথ।', caption: 'আধুনিক চিকিৎসার শুরু', highlight: ['চিকিৎসার'],
  svg: svg(`.beat{transform-origin:center;animation:beat .8s ease-in-out infinite}@keyframes beat{15%{transform:scale(1.08)}30%{transform:scale(1)}}`,
    `<defs><radialGradient id="rg7" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#fffde7"/><stop offset="1" stop-color="#ffe082"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#rg7)"/>${P.rays(540, 620, '#ffb300', .25)}
<rect y="1150" width="1080" height="770" fill="#b0855a" stroke="${O}" stroke-width="6"/>
<g transform="translate(540,560)"><g class="beat">${heart(0, 0, .9)}</g></g>
<g transform="translate(860,330)"><g class="pop" style="animation-delay:.6s"><circle r="90" fill="#2e7d32" stroke="${O}" stroke-width="7"/><path d="M-40 0 L-10 30 L45 -35" stroke="#fff" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></g>
${at(540, 1310, 1, har('cheer', { mouth: 'grin', brows: 'up' }), 'breathe')}`) });

scenes.push({ narration: 'পরের পর্বে থাকছে জেমস ওয়াটের গল্প, কেটলির বাষ্প দেখে যিনি বদলে দিয়েছিলেন পুরো দুনিয়া। ফলো করে সঙ্গেই থাকুন!', caption: 'বাষ্পের শক্তি!', highlight: ['বাষ্পের'],
  svg: svg(`.steam{animation:st 2.2s ease-out infinite}@keyframes st{0%{transform:translateY(0) scale(.6);opacity:.9}100%{transform:translateY(-260px) scale(1.4);opacity:0}}
.btn{transform-origin:center;animation:btn 1s ease-in-out infinite}@keyframes btn{50%{transform:scale(1.07)}}`,
    `<defs>${P.grad('dk5', '#0b1340', '#24124a')}</defs><rect width="1080" height="1920" fill="url(#dk5)"/>${P.stars(40)}
<text class="pop" x="540" y="330" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="120" fill="#ffd23f" stroke="${O}" stroke-width="6" paint-order="stroke">পরের পর্বে...</text>
<g transform="translate(540,900)"><path d="M-180 0 Q-200 -170 0 -180 Q200 -170 180 0 Q180 60 0 60 Q-180 60 -180 0Z" fill="#9e9e9e" stroke="${O}" stroke-width="8"/><path d="M170 -60 Q300 -110 320 -230" fill="none" stroke="${O}" stroke-width="30" stroke-linecap="round"/><path d="M170 -60 Q300 -110 320 -230" fill="none" stroke="#bdbdbd" stroke-width="18" stroke-linecap="round"/><path d="M-120 -150 Q-200 -280 -60 -300" fill="none" stroke="${O}" stroke-width="14"/><rect x="-60" y="-210" width="120" height="40" rx="18" fill="#757575" stroke="${O}" stroke-width="6"/>
${[0, .7, 1.4].map(d => `<g class="steam" style="animation-delay:${d}s"><circle cx="330" cy="-260" r="40" fill="#fff" opacity=".85"/></g>`).join('')}</g>
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'হার্ভের রক্তের রহস্য', series: 'আবিষ্কারের গল্প · পর্ব ৫', episode: 5, scientist: 'উইলিয়াম হার্ভে',
  summary: 'রক্ত কি খরচ হয়ে যায়, নাকি ঘুরে ঘুরে ফেরে? উইলিয়াম হার্ভে দেখালেন, হৃৎপিণ্ড একটা পাম্প আর রক্ত চলে এক বিরাট চক্রে!' }, scenes);
console.log('ep05:', scenes.length, 'scenes');
