// আবিষ্কারের গল্প · পর্ব ৬: জেমস ওয়াট. Our own retelling (facts checked: born 1736 in Greenock, Scotland; instrument maker at
// Glasgow University; repaired a Newcomen engine model 1763-64; separate condenser idea 1765 on Glasgow Green; patent 1769;
// partnership with Matthew Boulton in Birmingham from 1775; the unit of power 'watt' is named after him). The kettle story is
// a popular legend, so it is told as one.
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const watt = person({ skin: '#f3c9a0', hair: 'long', hairColor: '#d8d2c4', outfit: 'coat', cloth: '#2e4a7d', sash: '#f4f1e8', legsColor: '#3b3b3b' });
const boy = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#7a4a2a', outfit: 'coat', cloth: '#c0392b', legsColor: '#4e342e' });
const aunt = person({ skin: '#f3c9a0', hair: 'long', hairColor: '#5d4037', outfit: 'robe', cloth: '#6d4c41', sash: '#f4f1e8' });
const boul = person({ skin: '#eec39a', hair: 'short', hairColor: '#9e9e9e', outfit: 'coat', cloth: '#5d2e46', sash: '#f4f1e8', legsColor: '#3e2723' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const room = (wall = '#efe2c4', floor = '#a1724c') => `<rect width="1080" height="1920" fill="${wall}"/><rect y="1150" width="1080" height="770" fill="${floor}" stroke="${O}" stroke-width="6"/>`;
const steamCss = `.steam{animation:st 2.2s ease-out infinite}@keyframes st{0%{transform:translateY(0) scale(.6);opacity:.9}100%{transform:translateY(-240px) scale(1.5);opacity:0}}`;
const puffs = (x, y, n = 3, r = 38) => Array.from({ length: n }, (_, i) => `<g class="steam" style="animation-delay:${(i * 2.2 / n).toFixed(2)}s"><circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".85"/></g>`).join('');
const kettle = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-180 0 Q-200 -170 0 -180 Q200 -170 180 0 Q180 60 0 60 Q-180 60 -180 0Z" fill="#9e9e9e" stroke="${O}" stroke-width="8"/><path d="M170 -60 Q300 -110 320 -230" fill="none" stroke="${O}" stroke-width="30" stroke-linecap="round"/><path d="M170 -60 Q300 -110 320 -230" fill="none" stroke="#bdbdbd" stroke-width="18" stroke-linecap="round"/><path d="M-120 -150 Q-200 -280 -60 -300" fill="none" stroke="${O}" stroke-width="14"/><g class="lid"><rect x="-70" y="-212" width="140" height="40" rx="18" fill="#757575" stroke="${O}" stroke-width="6"/><circle cx="0" cy="-222" r="16" fill="#424242" stroke="${O}" stroke-width="5"/></g></g>`;
const fire = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><g class="flick"><path d="M-110 0 Q-130 -90 -60 -150 Q-50 -90 -20 -100 Q-10 -190 50 -230 Q40 -140 90 -120 Q120 -170 110 -60 Q130 -20 110 0Z" fill="#ff7043" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><path d="M-60 0 Q-60 -60 -20 -80 Q0 -40 20 -60 Q60 -100 60 0Z" fill="#ffd23f"/></g></g>`;
// A simple beam engine: cylinder (left), rocking beam, pump rod (right).
const engine = (x, y, s = 1, hot = '#c62828', extra = '') => `<g transform="translate(${x},${y}) scale(${s})">
<rect x="-330" y="-60" width="660" height="60" fill="#6d4c41" stroke="${O}" stroke-width="7"/>
<rect x="-300" y="-430" width="150" height="370" rx="14" fill="${hot}" stroke="${O}" stroke-width="8"/><rect x="-286" y="-416" width="34" height="340" rx="12" fill="#fff" opacity=".25"/>
<path d="M-30 -60 L-30 -560 L30 -560 L30 -60" fill="#8d6e63" stroke="${O}" stroke-width="7"/>
<g class="rock" style="transform-origin:0px -580px"><rect x="-300" y="-600" width="600" height="44" rx="20" fill="#5d4037" stroke="${O}" stroke-width="8"/>
<path d="M-225 -560 L-225 -440" stroke="${O}" stroke-width="14"/><path d="M240 -560 L240 -160" stroke="${O}" stroke-width="14"/></g>
<circle cx="0" cy="-580" r="22" fill="#ffd23f" stroke="${O}" stroke-width="6"/>${extra}</g>`;

const scenes = [];
scenes.push({ narration: '১৭৩৬ সালে স্কটল্যান্ডের গ্রিনক শহরে জন্ম নেন জেমস ওয়াট। গল্প আছে, ছোট্ট জেমস চুলার পাশে বসে দেখত, ফুটন্ত কেটলির ঢাকনা কেমন লাফায়।', caption: 'লাফানো ঢাকনা', highlight: ['ঢাকনা'],
  svg: svg(`${steamCss}.lid{animation:lid .5s ease-in-out infinite alternate}@keyframes lid{to{transform:translateY(-26px) rotate(-5deg)}}.flick{transform-origin:0 0;animation:fl .4s ease-in-out infinite alternate}@keyframes fl{to{transform:scaleY(1.12)}}`,
    `${room('#f1dfc0', '#8d6e4f')}<rect x="300" y="420" width="480" height="730" fill="#8d6e63" stroke="${O}" stroke-width="8"/><rect x="360" y="760" width="360" height="390" fill="#3e2723" stroke="${O}" stroke-width="7"/>
${fire(540, 1140, .9)}${kettle(540, 900, .62)}${puffs(740, 740, 3, 34)}
${at(160, 1420, .62, boy('think', { mouth: 'o', brows: 'up', px: 8 }), 'breathe')}${at(930, 1420, .66, aunt('hips', { mouth: 'smile', brows: 'normal', px: -6 }), 'breathe')}
${P.label(540, 250, 'গ্রিনক, স্কটল্যান্ড', { fill: '#2e4a7d', rot: -3, delay: .3, fs: 62 })}`) });

scenes.push({ narration: 'বড় হয়ে তিনি হলেন যন্ত্র বানানোর কারিগর। গ্লাসগো বিশ্ববিদ্যালয়ে একটা ছোট্ট দোকানে বসে তিনি নানা যন্ত্র বানাতেন আর সারাতেন।', caption: 'যন্ত্রের কারিগর', highlight: ['কারিগর'],
  svg: svg(`.tap{transform-box:fill-box;transform-origin:100% 100%;animation:tap .5s ease-in-out infinite alternate}@keyframes tap{to{transform:rotate(-22deg)}}`,
    `${room('#e9dcc0', '#7d5a3c')}<rect x="-900" y="1000" width="2880" height="40" fill="#6d4c41" stroke="${O}" stroke-width="6"/>
${[120, 300, 780, 960].map((x, i) => `<g transform="translate(${x},${560 + (i % 2) * 70})"><circle r="70" fill="#ffd23f" stroke="${O}" stroke-width="7"/><circle r="40" fill="#fff8e1" stroke="${O}" stroke-width="5"/><path d="M0 0 L${i % 2 ? 26 : -20} -30" stroke="${O}" stroke-width="7" stroke-linecap="round"/></g>`).join('')}
<rect x="180" y="1040" width="720" height="60" fill="#8d6e63" stroke="${O}" stroke-width="7"/>
${at(540, 1330, .95, watt('hold', { mouth: 'smile', brows: 'think', py: 6 }, `<g class="tap"><rect x="40" y="-470" width="110" height="34" rx="10" fill="#9e9e9e" stroke="${O}" stroke-width="6"/><rect x="-10" y="-462" width="70" height="20" rx="6" fill="#6d4c41" stroke="${O}" stroke-width="5"/></g>`), 'breathe')}
${P.label(540, 230, 'গ্লাসগো বিশ্ববিদ্যালয়', { fill: '#2e4a7d', rot: 3, delay: .3, fs: 58 })}`) });

scenes.push({ narration: 'একদিন তাঁকে সারাতে দেওয়া হলো নিউকোমেনের বাষ্পইঞ্জিনের একটা মডেল। ইঞ্জিনটা চলত খুব ধীরে, আর গিলে খেত পাহাড় সমান কয়লা।', caption: 'কয়লা খেকো ইঞ্জিন', highlight: ['কয়লা'],
  svg: svg(`${steamCss}.rock{animation:rock 3s ease-in-out infinite alternate}@keyframes rock{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}`,
    `${room('#ece3d3', '#6d5644')}${engine(560, 1150, 1.05)}${puffs(330, 650, 2, 40)}
<g transform="translate(170,1150)">${Array.from({ length: 10 }, (_, i) => `<circle cx="${(i % 4) * 56 - 80 + (i > 3 ? 28 : 0) + (i > 6 ? 28 : 0)}" cy="${-30 - Math.floor(i / 4) * 48}" r="32" fill="#263238" stroke="${O}" stroke-width="5"/>`).join('')}</g>
${at(900, 1420, .62, watt('think', { mouth: 'hmm', brows: 'think' }), 'breathe')}${P.label(540, 240, 'ধীর আর খরুচে!', { fill: '#c62828', rot: -3, delay: .6, fs: 66 })}`) });

scenes.push({ narration: 'ওয়াট খেয়াল করলেন আসল গলদ। প্রতিবার একই সিলিন্ডারকে গরম করা হচ্ছে, আবার ঠান্ডা করা হচ্ছে। ফলে বেশিরভাগ তাপই নষ্ট হয়ে যাচ্ছে।', caption: 'তাপ নষ্ট হচ্ছে', highlight: ['নষ্ট'],
  svg: svg(`.hc{animation:hc 1.6s steps(1) infinite}@keyframes hc{50%{fill:#3f7fd1}}.drip{animation:dr 1.6s ease-in infinite}@keyframes dr{0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(260px);opacity:0}}`,
    `<defs>${P.grad('bg4', '#fff3e0', '#ffe0b2')}</defs><rect width="1080" height="1920" fill="url(#bg4)"/>${P.rays(540, 700, '#ffb74d', .18)}
<rect y="1250" width="1080" height="670" fill="#a1724c" stroke="${O}" stroke-width="6"/>
<g transform="translate(540,760)"><rect class="hc" x="-160" y="-360" width="320" height="640" rx="30" fill="#c62828" stroke="${O}" stroke-width="10"/><rect x="-136" y="-336" width="70" height="590" rx="24" fill="#fff" opacity=".22"/>
<rect x="-180" y="-420" width="360" height="70" rx="16" fill="#757575" stroke="${O}" stroke-width="8"/></g>
${[0, .5, 1].map(d => `<g class="drip" style="animation-delay:${d}s"><path d="M${400 + d * 140} 360 Q${426 + d * 140} 400 ${400 + d * 140} 430 Q${374 + d * 140} 400 ${400 + d * 140} 360Z" fill="#3f7fd1" stroke="${O}" stroke-width="5"/></g>`).join('')}
<text x="250" y="1180" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="60" fill="#c62828">গরম</text><text x="830" y="1180" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="60" fill="#3f7fd1">ঠান্ডা</text>
<path d="M330 1160 Q540 1260 750 1160" fill="none" stroke="${O}" stroke-width="8" stroke-dasharray="20 14"/><path d="M750 1120 Q540 1020 330 1120" fill="none" stroke="${O}" stroke-width="8" stroke-dasharray="20 14"/>
${P.label(540, 220, 'বারবার!', { fill: '#e65100', rot: 4, delay: .5, fs: 70 })}`) });

scenes.push({ narration: '১৭৬৫ সালের এক রবিবার, গ্লাসগোর মাঠে হাঁটতে হাঁটতে মাথায় এল দারুণ এক বুদ্ধি। বাষ্পকে ঠান্ডা করা হবে আলাদা একটা পাত্রে, যাতে সিলিন্ডার সবসময় গরম থাকে!', caption: 'আলাদা কনডেন্সার!', highlight: ['আলাদা'],
  svg: svg(`.bulb{transform-origin:center;animation:bl .9s ease-in-out infinite alternate}@keyframes bl{to{transform:scale(1.12)}}.walk{animation:wk 6s linear both}@keyframes wk{from{transform:translateX(-120px)}to{transform:translateX(60px)}}`,
    `<defs>${P.grad('sky5', '#9fd8ff', '#eef9ff')}</defs><rect width="1080" height="1920" fill="url(#sky5)"/><g class="drift">${P.cloud(220, 420, .9)}${P.cloud(860, 520, .7)}</g>
<rect y="1150" width="1080" height="770" fill="#7cb342" stroke="${O}" stroke-width="6"/><path d="M-900 1330 Q540 1250 2000 1330" stroke="#c8b98e" stroke-width="70" fill="none"/>
${[-300, 80, 960, 1300].map(x => `<g transform="translate(${x},1160)"><rect x="-18" y="-200" width="36" height="200" fill="#6d4c41" stroke="${O}" stroke-width="6"/><circle cx="0" cy="-250" r="110" fill="#43a047" stroke="${O}" stroke-width="6"/></g>`).join('')}
<g class="walk">${at(480, 1400, .95, watt('point', { mouth: 'grin', brows: 'up' }), 'breathe')}</g>
<g transform="translate(760,560)"><g class="bulb"><circle r="110" fill="#ffe066" stroke="${O}" stroke-width="8"/><rect x="-46" y="100" width="92" height="60" rx="10" fill="#9e9e9e" stroke="${O}" stroke-width="6"/><path d="M-40 10 Q0 -60 40 10" fill="none" stroke="#f57f17" stroke-width="10"/></g></g>
${P.label(540, 230, 'পেয়েছি!', { fill: '#2e7d32', rot: -4, delay: 1.2, fs: 74 })}`) });

scenes.push({ narration: 'কিন্তু টাকা ছিল না, কাজও এগোচ্ছিল না। শেষে পাশে দাঁড়ালেন বার্মিংহামের কারখানার মালিক ম্যাথু বোল্টন। দুজনে মিলে বানালেন নতুন ইঞ্জিন।', caption: 'ওয়াট আর বোল্টন', highlight: ['বোল্টন'],
  svg: svg(`.shake{transform-origin:center;animation:sh .6s ease-in-out infinite alternate}@keyframes sh{to{transform:translateY(-12px)}}`,
    `${room('#e3d6c0', '#6d5644')}${[-560, -250, 60, 900, 1210, 1520].map(x => `<rect x="${x}" y="300" width="120" height="850" fill="#bcaaa4" stroke="${O}" stroke-width="6"/>`).join('')}
<rect x="-900" y="250" width="2880" height="60" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${at(330, 1340, .9, watt('offer', { mouth: 'grin', brows: 'up', px: 8 }), 'breathe')}<g transform="translate(750,1340) scale(-.9,.9)"><g class="breathe">${boul('offer', { mouth: 'grin', brows: 'up', px: 8 })}</g></g>
${P.label(540, 470, 'বার্মিংহাম, ১৭৭৫', { fill: '#5d2e46', rot: 3, delay: .4, fs: 58 })}`) });

scenes.push({ narration: 'ওয়াটের ইঞ্জিন কয়লা লাগত অনেক কম, কাজ হতো অনেক বেশি। কারখানা, খনি, কাপড়ের কল, সবখানে চলতে লাগল তাঁর ইঞ্জিন। শুরু হলো শিল্পবিপ্লব!', caption: 'শিল্পবিপ্লব!', highlight: ['শিল্পবিপ্লব!'],
  svg: svg(`${steamCss}.spin2{transform-box:fill-box;transform-origin:center;animation:sp 3s linear infinite}.spin3{transform-box:fill-box;transform-origin:center;animation:sp 3s linear infinite reverse}@keyframes sp{to{transform:rotate(360deg)}}`,
    `<defs>${P.grad('sk7', '#ffcc80', '#fff3e0')}</defs><rect width="1080" height="1920" fill="url(#sk7)"/>
${[-700, -350, 0, 330, 660, 990, 1320, 1650].map((x, i) => `<g transform="translate(${x},1150)"><rect x="0" y="-${300 + (i % 3) * 60}" width="300" height="${300 + (i % 3) * 60}" fill="${['#8d6e63', '#a1887f', '#795548'][i % 3]}" stroke="${O}" stroke-width="6"/><rect x="200" y="-${560 + (i % 2) * 80}" width="60" height="${260 + (i % 2) * 80}" fill="#5d4037" stroke="${O}" stroke-width="6"/>${[40, 120].map(wx => `<rect x="${wx}" y="-${220 + (i % 3) * 40}" width="50" height="60" fill="#ffe082" stroke="${O}" stroke-width="5"/>`).join('')}</g>`).join('')}
${[230, 560, 890].map((x, i) => puffs(x, 520 - (i % 2) * 80, 2, 46)).join('')}
<rect y="1150" width="1080" height="770" fill="#6d5644" stroke="${O}" stroke-width="6"/>
<g transform="translate(400,1450)"><g class="spin2">${P.burst(0, 0, 150, '#ffd23f')}<circle r="60" fill="#f57f17" stroke="${O}" stroke-width="6"/></g></g>
<g transform="translate(640,1560)"><g class="spin3">${P.burst(0, 0, 110, '#90a4ae')}<circle r="42" fill="#546e7a" stroke="${O}" stroke-width="6"/></g></g>`) });

scenes.push({ narration: 'আজও তাঁকে মনে রাখি আমরা প্রতিদিন। বাল্ব বা পাখার গায়ে যে "ওয়াট" লেখা থাকে, ক্ষমতার সেই একক রাখা হয়েছে জেমস ওয়াটের নামেই।', caption: 'ওয়াট = ক্ষমতার একক', highlight: ['ওয়াট'],
  svg: svg(`.glow{transform-origin:center;animation:gl 1.2s ease-in-out infinite alternate}@keyframes gl{to{transform:scale(1.15);opacity:.55}}`,
    `<defs><radialGradient id="rg8" cx=".5" cy=".38" r=".8"><stop offset="0" stop-color="#fffde7"/><stop offset="1" stop-color="#ffe082"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#rg8)"/>${P.rays(540, 620, '#ffb300', .25)}
<rect y="1150" width="1080" height="770" fill="#b0855a" stroke="${O}" stroke-width="6"/>
<g transform="translate(400,620)"><g class="glow"><circle r="250" fill="#fff59d" opacity=".75"/></g><path d="M-150 -40 Q-150 -210 0 -210 Q150 -210 150 -40 Q150 50 80 120 L80 200 L-80 200 L-80 120 Q-150 50 -150 -40Z" fill="#fff9c4" stroke="${O}" stroke-width="9"/><rect x="-90" y="200" width="180" height="110" rx="14" fill="#9e9e9e" stroke="${O}" stroke-width="7"/><path d="M-50 120 L-30 0 L0 60 L30 0 L50 120" fill="none" stroke="#f57f17" stroke-width="9" stroke-linejoin="round"/>
<text x="0" y="-60" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="84" fill="#e65100">60W</text></g>
${at(820, 1400, .8, watt('point', { mouth: 'grin', brows: 'up', px: -8 }), 'breathe')}`) });

scenes.push({ narration: 'পরের পর্বে থাকছে লুইজি গ্যালভানির গল্প, ব্যাঙের পা হঠাৎ নড়ে উঠতে দেখে যিনি খুঁজে পেলেন বিদ্যুতের নতুন রহস্য। ফলো করে সঙ্গেই থাকুন!', caption: 'নড়ে উঠল ব্যাঙের পা!', highlight: ['ব্যাঙের'],
  svg: svg(`.kick{transform-box:fill-box;transform-origin:0% 0%;animation:kk .7s ease-in-out infinite alternate}@keyframes kk{to{transform:rotate(-26deg)}}.zap{animation:zp .7s steps(2) infinite}@keyframes zp{50%{opacity:0}}
.btn{transform-origin:center;animation:btn 1s ease-in-out infinite}@keyframes btn{50%{transform:scale(1.07)}}`,
    `<defs>${P.grad('dk6', '#0b1340', '#24124a')}</defs><rect width="1080" height="1920" fill="url(#dk6)"/>${P.stars(40)}
<text class="pop" x="540" y="330" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="120" fill="#ffd23f" stroke="${O}" stroke-width="6" paint-order="stroke">পরের পর্বে...</text>
<g transform="translate(540,880)"><ellipse cx="0" cy="0" rx="130" ry="90" fill="#7cb342" stroke="${O}" stroke-width="8"/><circle cx="-60" cy="-80" r="38" fill="#7cb342" stroke="${O}" stroke-width="7"/><circle cx="60" cy="-80" r="38" fill="#7cb342" stroke="${O}" stroke-width="7"/><circle cx="-60" cy="-84" r="16" fill="#1d1d1d"/><circle cx="60" cy="-84" r="16" fill="#1d1d1d"/>
<g class="kick"><path d="M90 40 L220 120 L170 220 L260 240" fill="none" stroke="${O}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/><path d="M90 40 L220 120 L170 220 L260 240" fill="none" stroke="#9ccc65" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/></g>
<path class="zap" d="M260 -40 L220 40 L270 40 L230 130" fill="none" stroke="#ffd23f" stroke-width="12" stroke-linejoin="round"/></g>
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'ওয়াটের বাষ্পের জাদু', series: 'আবিষ্কারের গল্প · পর্ব ৬', episode: 6, scientist: 'জেমস ওয়াট',
  summary: 'কেটলির বাষ্প থেকে কারখানার চাকা! জেমস ওয়াটের নতুন বাষ্পইঞ্জিন কম কয়লায় বেশি কাজ করে শুরু করল শিল্পবিপ্লব।' }, scenes);
console.log('ep06:', scenes.length, 'scenes');
