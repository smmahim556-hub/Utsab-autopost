// আবিষ্কারের গল্প · পর্ব ৩: কোপারনিকাস. Our own retelling (facts from the owner's book), drawn as animated SVG scenes.
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const cop = person({ skin: '#f2c9a0', hair: 'long', hairColor: '#3b2416', outfit: 'coat', cloth: '#5d2a2a', sash: '#2b2b2b', legsColor: '#2b2b2b' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const night = id => `<defs>${P.grad(id, '#0d1b4c', '#29407a')}</defs><rect width="1080" height="1920" fill="url(#${id})"/>${P.stars(44)}`;
const ORB = `.oa{transform-box:view-box;transform-origin:540px 760px;animation:orb 6s linear infinite}.ob{transform-box:view-box;transform-origin:540px 760px;animation:orb 9s linear infinite}.oc{transform-box:view-box;transform-origin:540px 760px;animation:orb 14s linear infinite}@keyframes orb{to{transform:rotate(360deg)}}`;
const sunAt = (x, y, r) => `<g class="spin" style="transform-origin:${x}px ${y}px;transform-box:view-box">${Array.from({ length: 12 }, (_, i) => `<rect x="${x - 5}" y="${y - r - 50}" width="10" height="36" rx="5" fill="#ffd23f" transform="rotate(${i * 30} ${x} ${y})"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="${r}" fill="#ffd23f" stroke="${O}" stroke-width="7"/>`;
const earth = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#3fa9f5" stroke="${O}" stroke-width="6"/><path d="M${x - r * .5} ${y - r * .3} q${r * .4} ${-r * .4} ${r * .7} 0 q${-r * .1} ${r * .4} ${-r * .5} ${r * .3}z" fill="#6cc04a" stroke="${O}" stroke-width="4"/>`;
const rings = (rs, cx = 540, cy = 760) => rs.map(r => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#9fb4ff" stroke-width="4" stroke-dasharray="14 14"/>`).join('');

const scenes = [];
scenes.push({ narration: 'প্রায় পাঁচশো বছর আগে সবাই ভাবত, পৃথিবী স্থির হয়ে আছে মাঝখানে, আর সূর্য ঘুরছে পৃথিবীর চারদিকে।', caption: 'সূর্য ঘোরে পৃথিবীকে?', highlight: ['ঘোরে'],
  svg: svg(ORB, `${night('n0')}${rings([300])}${earth(540, 760, 110)}<g class="ob">${sunAt(840, 760, 60)}</g>
${P.label(540, 300, 'পুরনো ধারণা', { fill: '#5d2a2a', fs: 72, delay: .3, rot: -3 })}`) });

scenes.push({ narration: '১৪৭৩ সালে পোল্যান্ডের তোরুন শহরে জন্ম নিলেন নিকোলাস কোপারনিকাস।', caption: 'নিকোলাস কোপারনিকাস', highlight: ['কোপারনিকাস'],
  svg: svg('', `<defs>${P.grad('s1', '#9fd8ff', '#eef9ff')}</defs><rect width="1080" height="1920" fill="url(#s1)"/><g class="drift">${P.cloud(220, 470)}</g>
${[[60, 760, 180, 400, '#c0563b'], [250, 700, 140, 460, '#a14a32'], [760, 640, 120, 520, '#c0563b'], [890, 760, 170, 400, '#8a3d2a']].map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" stroke="${O}" stroke-width="6"/><path d="M${x - 10} ${y} L${x + w / 2} ${y - 120} L${x + w + 10} ${y}Z" fill="#455a64" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><rect x="${x + w / 2 - 25}" y="${y + 60}" width="50" height="70" rx="25" fill="#ffe082" stroke="${O}" stroke-width="5"/>`).join('')}
<rect y="1150" width="1080" height="770" fill="#b0a089" stroke="${O}" stroke-width="6"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${i * 150} 1150 L${i * 150 - 60} 1920" stroke="#958670" stroke-width="5"/>`).join('')}
${at(540, 1270, 1.1, cop('stand', { mouth: 'smile', brows: 'normal' }), 'breathe')}${P.label(520, 250, 'তোরুন, পোল্যান্ড', { fill: '#5d2a2a', rot: -4, delay: .3, fs: 66 })}`) });

scenes.push({ narration: 'ছোটবেলায় বাবাকে হারিয়ে মামার কাছে বড় হন। পরে পড়াশোনা করেন গণিত, চিকিৎসা আর জ্যোতির্বিদ্যা নিয়ে।', caption: 'গণিত আর তারার পড়া', highlight: ['তারার'],
  svg: svg(`.fl{transform-origin:50% 100%;animation:fl .5s ease-in-out infinite alternate}@keyframes fl{to{transform:scale(.85,1.1)}}`,
    `<rect width="1080" height="1920" fill="#f3e2c0"/><rect x="620" y="200" width="360" height="440" rx="20" fill="#1d2a5c" stroke="${O}" stroke-width="8"/>${[[680, 280], [900, 330], [760, 470], [880, 560], [700, 580]].map(([x, y]) => `<circle class="twinkle" cx="${x}" cy="${y}" r="9" fill="#fff8c4"/>`).join('')}<path d="M800 200 L800 640 M620 420 L980 420" stroke="${O}" stroke-width="7"/>
${[[60, 260], [60, 420], [60, 580]].map(([x, y]) => `<rect x="${x}" y="${y}" width="360" height="20" fill="#8a5a36" stroke="${O}" stroke-width="5"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${x + 10 + i * 56}" y="${y - 110 + (i % 2) * 14}" width="44" height="${110 - (i % 2) * 14}" fill="${['#c62828', '#3f7fd1', '#2e7d32', '#e9b949', '#6a1b9a', '#ef6c00'][i]}" stroke="${O}" stroke-width="4"/>`).join('')}`).join('')}
<rect y="1150" width="1080" height="770" fill="#a8693c" stroke="${O}" stroke-width="6"/>
${at(380, 1270, 1.05, cop('hold', { mouth: 'smile', brows: 'up', py: 8 }, `<path d="M-90 -420 L0 -400 L90 -420 L90 -330 L0 -310 L-90 -330Z" fill="#fff" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><path d="M0 -400 L0 -310" stroke="${O}" stroke-width="5"/><path d="M-70 -390 L-20 -380 M-70 -365 L-20 -355 M20 -380 L70 -390 M20 -355 L70 -365" stroke="#90a4ae" stroke-width="5"/>`), 'breathe')}
<g transform="translate(840,1140)"><rect x="-120" y="-20" width="240" height="30" fill="#6b3f22" stroke="${O}" stroke-width="5"/><circle cx="0" cy="-140" r="110" fill="#3fa9f5" stroke="${O}" stroke-width="6"/><path d="M-60 -170 q40 -40 80 0 q-10 40 -50 30z M10 -100 q40 -10 60 30 q-40 20 -60 -30z" fill="#6cc04a" stroke="${O}" stroke-width="4"/><path d="M0 -250 L0 -20" stroke="#8a5a36" stroke-width="10"/></g>`) });

scenes.push({ narration: 'রাতের পর রাত তিনি আকাশ দেখতেন, গ্রহদের চলাফেরা মাপতেন আর অঙ্ক কষতেন।', caption: 'রাতভর আকাশ দেখা', highlight: ['আকাশ'],
  svg: svg(`.pl{animation:pl 6s ease-in-out infinite alternate}@keyframes pl{to{transform:translate(180px,-60px)}}`,
    `${night('n3')}<circle cx="820" cy="330" r="80" fill="#fff3b0" stroke="${O}" stroke-width="6"/><g class="pl"><circle cx="300" cy="520" r="22" fill="#ff8a65" stroke="${O}" stroke-width="5"/></g>
<path d="M300 520 Q450 440 480 460" stroke="#ffd23f" stroke-width="4" stroke-dasharray="10 10" fill="none" opacity=".7"/>
<rect x="0" y="1100" width="1080" height="820" fill="#5d4037" stroke="${O}" stroke-width="6"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${i * 190}" y="1040" width="110" height="80" fill="#6d4c41" stroke="${O}" stroke-width="6"/>`).join('')}
${at(540, 1250, 1.05, cop('point', { mouth: 'o', brows: 'up', px: 10, py: -12 }), 'breathe')}
<g transform="translate(220,1250)"><path d="M0 0 L0 -260" stroke="#8a5a36" stroke-width="12"/><path d="M0 -260 L180 -260 A180 180 0 0 0 0 -440Z" fill="#e9b949" stroke="${O}" stroke-width="6"/><path d="M0 -260 L130 -380" stroke="${O}" stroke-width="6"/></g>`) });

scenes.push({ narration: 'অঙ্ক কষে তিনি বুঝলেন, পুরনো ধারণাটা ভুল। পৃথিবী নয়, সূর্যই আছে মাঝখানে।', caption: 'সূর্যই মাঝখানে!', highlight: ['সূর্যই'],
  svg: svg(`${ORB}.x{transform-origin:center;animation:x .5s cubic-bezier(.3,1.7,.5,1) .3s both}@keyframes x{from{transform:scale(0)}to{transform:scale(1)}}
.new{transform-origin:center;animation:pop .6s cubic-bezier(.3,1.7,.5,1) 1.3s both}`,
    `${night('n4')}<g transform="translate(43,141) scale(.42)" style="opacity:.75">${rings([300], 540, 760)}${earth(540, 760, 110)}${sunAt(840, 760, 60)}</g>
<g class="x"><path d="M140 310 L400 610 M400 310 L140 610" stroke="#e63946" stroke-width="22" stroke-linecap="round"/></g>
<g class="new">${rings([190, 300], 540, 980)}${sunAt(540, 980, 95)}<g style="transform-box:view-box;transform-origin:540px 980px;animation:orb 6s linear infinite">${earth(730, 980, 40)}</g><g style="transform-box:view-box;transform-origin:540px 980px;animation:orb 11s linear infinite"><circle cx="240" cy="980" r="30" fill="#ff7043" stroke="${O}" stroke-width="6"/></g></g>
${P.label(800, 330, 'সূর্যই কেন্দ্রে ✓', { fill: '#2e7d32', fs: 52, delay: 1.6, w: 440 })}`) });

scenes.push({ narration: 'পৃথিবী আর অন্য গ্রহরা সূর্যের চারদিকে ঘোরে। আর পৃথিবী নিজেও ঘোরে বলেই দিন আর রাত হয়।', caption: 'তাই দিন আর রাত', highlight: ['দিন', 'রাত'],
  svg: svg(`.rot{transform-box:view-box;transform-origin:640px 760px;animation:orb 5s linear infinite}@keyframes orb{to{transform:rotate(360deg)}}`,
    `${night('n5')}${sunAt(140, 760, 100)}<path d="M240 620 L520 640 M240 760 L500 760 M240 900 L520 880" stroke="#ffd23f" stroke-width="8" stroke-dasharray="20 14" opacity=".8"/>
<defs><clipPath id="ec"><circle cx="640" cy="760" r="250"/></clipPath></defs>
<g class="rot"><circle cx="640" cy="760" r="250" fill="#3fa9f5" stroke="${O}" stroke-width="8"/><g clip-path="url(#ec)"><path d="M520 600 Q600 540 700 600 Q740 680 660 730 Q580 720 520 600Z M640 820 Q740 790 800 870 Q770 960 680 940Z M430 780 Q480 740 520 800 Q500 880 440 860Z" fill="#6cc04a" stroke="${O}" stroke-width="5"/></g>
<g transform="translate(640,510)"><rect x="-24" y="-50" width="48" height="50" fill="#fff" stroke="${O}" stroke-width="5"/><path d="M-32 -48 L0 -78 L32 -48Z" fill="#e63946" stroke="${O}" stroke-width="5"/></g></g>
<path d="M640 510 A250 250 0 0 1 640 1010 Z" fill="#0b1030" opacity=".55"/>
<text x="460" y="1110" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="62" fill="#ffd23f" stroke="${O}" stroke-width="5" paint-order="stroke">দিন</text>
<text x="830" y="1110" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="62" fill="#9fb4ff" stroke="${O}" stroke-width="5" paint-order="stroke">রাত</text>`) });

scenes.push({ narration: 'কিন্তু তিনি ভয় পেতেন, মানুষ এই নতুন কথা বিশ্বাস করবে না। তাই বইটা লিখেও বহু বছর লুকিয়ে রাখলেন।', caption: 'বই রইল লুকানো', highlight: ['লুকানো'],
  svg: svg(`.lock{transform-origin:50% 0%;animation:sway 1.6s ease-in-out infinite}`,
    `<rect width="1080" height="1920" fill="#e8d5b0"/><rect x="0" y="0" width="1080" height="1150" fill="#d9c094"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 130} 0 L${i * 130} 1150" stroke="#c9ad7c" stroke-width="6"/>`).join('')}
<rect y="1150" width="1080" height="770" fill="#8a5a36" stroke="${O}" stroke-width="6"/>
<g transform="translate(760,1120)"><rect x="-200" y="-260" width="400" height="260" rx="20" fill="#a1683a" stroke="${O}" stroke-width="7"/><rect x="-210" y="-300" width="420" height="70" rx="20" fill="#8a5a36" stroke="${O}" stroke-width="7"/><path d="M-200 -150 L200 -150" stroke="#6b3f22" stroke-width="10"/>
<g class="lock"><path d="M-30 -230 Q-30 -290 0 -290 Q30 -290 30 -230" fill="none" stroke="#9e9e9e" stroke-width="12"/><rect x="-45" y="-235" width="90" height="80" rx="12" fill="#ffc93c" stroke="${O}" stroke-width="6"/><circle cx="0" cy="-200" r="10" fill="${O}"/></g></g>
<g transform="translate(760,560) rotate(-8)"><g class="pop" style="animation-delay:.3s"><rect x="-130" y="-170" width="260" height="340" rx="14" fill="#5d2a2a" stroke="${O}" stroke-width="7"/><rect x="-100" y="-130" width="200" height="90" fill="#e9b949" stroke="${O}" stroke-width="5"/><text x="0" y="-70" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="50" fill="#5d2a2a">আবর্তন</text>${sunAt(0, 60, 40)}</g></g>
${at(300, 1270, 1.0, cop('think', { mouth: 'frown', brows: 'think', px: 12 }), 'breathe')}`) });

scenes.push({ narration: '১৫৪৩ সালে বইটি অবশেষে ছাপা হলো। পরে প্রমাণ হলো, কোপারনিকাসই ঠিক বলেছিলেন!', caption: 'কোপারনিকাসই ঠিক!', highlight: ['ঠিক!'],
  svg: svg(`.glow{transform-origin:center;animation:glow 1.4s ease-in-out infinite}@keyframes glow{50%{transform:scale(1.08)}}`,
    `<defs><radialGradient id="rg" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#ffc46b"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#rg)"/>${P.rays(540, 760, '#ff9800', .3)}
<g transform="translate(540,780)"><g class="glow"><path d="M-330 -200 Q-160 -250 0 -190 Q160 -250 330 -200 L330 200 Q160 150 0 210 Q-160 150 -330 200Z" fill="#fff" stroke="${O}" stroke-width="8" stroke-linejoin="round"/><path d="M0 -190 L0 210" stroke="${O}" stroke-width="6"/>
${sunAt(-165, 0, 50)}<circle cx="-165" cy="0" r="110" fill="none" stroke="#9fb4ff" stroke-width="4" stroke-dasharray="10 10"/><circle cx="-55" cy="0" r="16" fill="#3fa9f5" stroke="${O}" stroke-width="4"/>
${[-120, -70, -20, 30, 80, 130].map(y => `<path d="M60 ${y} L${280 - (y % 3) * 10} ${y}" stroke="#90a4ae" stroke-width="10" stroke-linecap="round"/>`).join('')}</g></g>
${P.label(540, 330, '১৫৪৩ সাল', { fill: '#5d2a2a', fs: 72, delay: .2, rot: -3 })}
<g transform="translate(860,1100)"><g class="pop" style="animation-delay:1.2s"><circle r="90" fill="#2e7d32" stroke="${O}" stroke-width="7"/><path d="M-40 0 L-10 30 L45 -35" stroke="#fff" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></g>`) });

scenes.push({ narration: 'পরের পর্বে থাকছে গ্যালিলিওর গল্প, যিনি দূরবিন দিয়ে আকাশের রহস্য খুলে দিয়েছিলেন। ফলো করে সঙ্গেই থাকুন!', caption: 'গ্যালিলিওর দূরবিন!', highlight: ['দূরবিন!'],
  svg: svg(`.btn{transform-origin:center;animation:btn 1s ease-in-out infinite}@keyframes btn{50%{transform:scale(1.07)}}.scope{transform-origin:20% 80%;animation:sc 3s ease-in-out infinite}@keyframes sc{50%{transform:rotate(-4deg)}}`,
    `<defs>${P.grad('dk', '#0b1340', '#24124a')}</defs><rect width="1080" height="1920" fill="url(#dk)"/>${P.stars(46)}
<text class="pop" x="540" y="330" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="120" fill="#ffd23f" stroke="${O}" stroke-width="6" paint-order="stroke">পরের পর্বে...</text>
<circle cx="820" cy="560" r="80" fill="#fff3b0" stroke="${O}" stroke-width="6"/><circle cx="790" cy="540" r="16" fill="#f0dc8a"/><circle cx="845" cy="590" r="12" fill="#f0dc8a"/>
<g transform="translate(380,880)"><path d="M0 0 L-90 160 M0 0 L90 160 M0 0 L0 170" stroke="#8a5a36" stroke-width="14" stroke-linecap="round"/><g class="scope"><g transform="rotate(-35)"><rect x="-60" y="-34" width="360" height="68" rx="20" fill="#c98b3a" stroke="${O}" stroke-width="7"/><rect x="280" y="-46" width="50" height="92" rx="12" fill="#a1683a" stroke="${O}" stroke-width="7"/><rect x="-100" y="-24" width="50" height="48" rx="10" fill="#6b3f22" stroke="${O}" stroke-width="6"/></g></g></g>
<g transform="translate(540,1250)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'কোপারনিকাসের সূর্য', series: 'আবিষ্কারের গল্প · পর্ব ৩', episode: 3, scientist: 'কোপারনিকাস',
  summary: 'হাজার বছর ধরে মানুষ ভাবত সূর্যই পৃথিবীকে ঘিরে ঘোরে। কোপারনিকাস অঙ্ক কষে দেখালেন, আসলে উল্টোটা!' }, scenes);
console.log('ep03:', scenes.length, 'scenes');
