// আবিষ্কারের গল্প · পর্ব ৭: লুইজি গ্যালভানি. Our own retelling (facts checked: born 1737 in Bologna, Italy; doctor and anatomy
// teacher at the University of Bologna; in the 1780s saw dissected frog legs twitch when touched with metal near an electric
// machine, and with two different metals; published 'animal electricity' in 1791; Volta disagreed and, looking for the
// answer, built the first battery in 1800; 'galvanize' and the galvanometer carry Galvani's name).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const gal = person({ skin: '#eec39a', hair: 'short', hairColor: '#e8e4dc', outfit: 'coat', cloth: '#5d2e46', sash: '#f4f1e8', legsColor: '#3b2a20' });
const volta = person({ skin: '#f3c9a0', hair: 'short', hairColor: '#3b2a20', outfit: 'coat', cloth: '#1f4e5f', sash: '#f4f1e8', legsColor: '#263238' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#2e7d32', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const room = (wall = '#efe2c4', floor = '#a1724c') => `<rect width="1080" height="1920" fill="${wall}"/><rect y="1150" width="1080" height="770" fill="${floor}" stroke="${O}" stroke-width="6"/>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
// A friendly cartoon frog leg (no gore): green leg on a little stand.
const leg = (x, y, s = 1, cls = 'kick') => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-90" y="20" width="180" height="26" rx="10" fill="#8d6e63" stroke="${O}" stroke-width="6"/><rect x="-10" y="-200" width="20" height="220" fill="#8d6e63" stroke="${O}" stroke-width="5"/><path d="M0 -200 L60 -200" stroke="${O}" stroke-width="8"/>
<g class="${cls}"><path d="M60 -200 L70 -110 L20 -40 L80 -10" fill="none" stroke="${O}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 -200 L70 -110 L20 -40 L80 -10" fill="none" stroke="#9ccc65" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/><path d="M80 -10 l26 -14 M80 -10 l30 4 M80 -10 l20 20" stroke="${O}" stroke-width="6" stroke-linecap="round"/></g></g>`;
const zap = (x, y, s = 1, cls = 'zap') => `<g transform="translate(${x},${y}) scale(${s})"><path class="${cls}" d="M0 -60 L-30 10 L10 10 L-20 80 L40 -10 L0 -10 L20 -60Z" fill="#ffd23f" stroke="${O}" stroke-width="6" stroke-linejoin="round"/></g>`;
const kickCss = `.kick{transform-box:fill-box;transform-origin:0% 0%;animation:kk .5s ease-in-out infinite alternate}@keyframes kk{to{transform:rotate(-24deg)}}.zap{animation:zp .5s steps(2) infinite}@keyframes zp{50%{opacity:0}}`;
const machine = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-150" y="-20" width="300" height="40" fill="#6d4c41" stroke="${O}" stroke-width="7"/><g class="spin2"><circle cx="0" cy="-200" r="150" fill="#cfe8ff" stroke="${O}" stroke-width="8" opacity=".9"/><path d="M-150 -200 L150 -200 M0 -350 L0 -50" stroke="${O}" stroke-width="4" opacity=".4"/></g><rect x="-14" y="-200" width="28" height="200" fill="#8d6e63" stroke="${O}" stroke-width="6"/><circle cx="0" cy="-200" r="22" fill="#ffd23f" stroke="${O}" stroke-width="6"/><circle cx="210" cy="-280" r="36" fill="#bdbdbd" stroke="${O}" stroke-width="6"/><path d="M150 -220 L190 -260" stroke="${O}" stroke-width="10"/></g>`;

const scenes = [];
scenes.push({ narration: '১৭৩৭ সালে ইতালির বোলোনিয়া শহরে জন্ম নেন লুইজি গ্যালভানি। বড় হয়ে তিনি হলেন ডাক্তার, আর বিশ্ববিদ্যালয়ে পড়াতেন মানুষের শরীরের গঠন।', caption: 'লুইজি গ্যালভানি', highlight: ['গ্যালভানি'],
  svg: svg('', `<defs>${P.grad('sk1', '#ffd9a0', '#fff4e0')}</defs><rect width="1080" height="1920" fill="url(#sk1)"/><g class="drift">${P.cloud(220, 380, .8)}${P.cloud(880, 480, .7)}</g>
${[-700, -380, -80, 760, 1060, 1380].map((x, i) => `<g transform="translate(${x},1150)"><rect x="0" y="-${380 + (i % 3) * 70}" width="300" height="${380 + (i % 3) * 70}" fill="${['#e07a5f', '#f2cc8f', '#d98e64'][i % 3]}" stroke="${O}" stroke-width="6"/>${[40, 170].map(wx => `<path d="M${wx} -${250 + (i % 3) * 40} q40 -50 80 0 v90 h-80z" fill="#6d4c41" stroke="${O}" stroke-width="5"/>`).join('')}</g>`).join('')}
<g transform="translate(540,1150)"><rect x="-90" y="-760" width="180" height="760" fill="#c96f4a" stroke="${O}" stroke-width="7"/><path d="M-110 -760 L0 -860 L110 -760Z" fill="#a0522d" stroke="${O}" stroke-width="7"/>${[0, 1, 2, 3].map(i => `<rect x="-40" y="${-700 + i * 170}" width="80" height="100" rx="40" fill="#6d4c41" stroke="${O}" stroke-width="5"/>`).join('')}</g>
<rect y="1150" width="1080" height="770" fill="#d7b98e" stroke="${O}" stroke-width="6"/>
${at(300, 1420, .85, gal('stand', { mouth: 'smile', brows: 'normal', px: 6 }), 'breathe')}${at(800, 1420, .7, kid('think', { mouth: 'o', brows: 'up', px: -6 }), 'breathe')}
${P.label(540, 230, 'বোলোনিয়া, ইতালি', { fill: '#5d2e46', rot: -3, delay: .3, fs: 62 })}`) });

scenes.push({ narration: 'একদিন তাঁর পরীক্ষাগারে টেবিলে রাখা ছিল ব্যাঙের পা। পাশেই ঘুরছিল একটা বিদ্যুৎ তৈরির যন্ত্র, আর তা থেকে ছিটকে বেরোচ্ছিল ছোট ছোট স্ফুলিঙ্গ।', caption: 'পরীক্ষাগারে একদিন', highlight: ['পরীক্ষাগারে'],
  svg: svg(`${kickCss}.spin2{transform-origin:0px -200px;animation:sp 2s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}`,
    `${room('#e7dcc6', '#7d5a3c')}<rect x="-900" y="1000" width="2880" height="60" fill="#8d6e63" stroke="${O}" stroke-width="7"/>
${[-500, -250, 1080, 1330].map(x => `<rect x="${x}" y="380" width="170" height="260" fill="#cfe8ff" stroke="${O}" stroke-width="6"/>`).join('')}
${machine(300, 1000, .9)}${zap(520, 700, .8)}${zap(470, 600, .5)}
${leg(800, 1000, .9, '')}
${P.label(540, 230, 'স্ফুলিঙ্গ!', { fill: '#e65100', rot: 3, delay: .4, fs: 66 })}`) });

scenes.push({ narration: 'তাঁর একজন সহকারী ধাতুর ছুরি দিয়ে ব্যাঙের পা ছুঁতেই ঘটল অবাক কাণ্ড। মরা ব্যাঙের পা হঠাৎ লাফিয়ে উঠল, যেন জ্যান্ত!', caption: 'পা নড়ে উঠল!', highlight: ['নড়ে'],
  svg: svg(`${kickCss}`, `<defs><radialGradient id="rg3" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="#fffde7"/><stop offset="1" stop-color="#ffe082"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#rg3)"/>${P.rays(540, 760, '#ffb300', .22)}
<rect y="1150" width="1080" height="770" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${leg(470, 1140, 1.5)}${zap(760, 700, 1.1)}${zap(250, 760, .7)}
<g transform="translate(820,980) rotate(-30)"><rect x="-12" y="-160" width="24" height="170" rx="8" fill="#b0bec5" stroke="${O}" stroke-width="6"/><rect x="-20" y="0" width="40" height="110" rx="10" fill="#6d4c41" stroke="${O}" stroke-width="6"/></g>
${P.label(540, 260, 'আরে! লাফাল!', { fill: '#2e7d32', rot: -4, delay: .3, fs: 72 })}`) });

scenes.push({ narration: 'গ্যালভানি অবাক হয়ে বারবার পরীক্ষা করলেন। দেখলেন, দুই রকম ধাতু, যেমন তামা আর লোহা, একসাথে ব্যাঙের পা ছুঁলেও পা কেঁপে ওঠে।', caption: 'দুই রকম ধাতু', highlight: ['ধাতু'],
  svg: svg(`${kickCss}`, `${room('#efe4cf', '#7d5a3c')}<rect x="-900" y="1000" width="2880" height="60" fill="#8d6e63" stroke="${O}" stroke-width="7"/>
${leg(540, 1000, 1.05)}
<path d="M260 980 Q300 760 560 790" fill="none" stroke="${O}" stroke-width="26" stroke-linecap="round"/><path d="M260 980 Q300 760 560 790" fill="none" stroke="#e07a3c" stroke-width="14" stroke-linecap="round"/>
<path d="M820 980 Q780 760 640 860" fill="none" stroke="${O}" stroke-width="26" stroke-linecap="round"/><path d="M820 980 Q780 760 640 860" fill="none" stroke="#90a4ae" stroke-width="14" stroke-linecap="round"/>
${T(250, 730, 'তামা', 56, '#c25e1e')}${T(850, 730, 'লোহা', 56, '#546e7a')}${zap(600, 620, .6)}
${at(150, 1500, .6, gal('think', { mouth: 'o', brows: 'up', px: 8 }), 'breathe')}`) });

scenes.push({ narration: 'তিনি ভাবলেন, প্রাণীর শরীরের ভেতরেই লুকিয়ে আছে বিদ্যুৎ। ১৭৯১ সালে তিনি এর নাম দিলেন "প্রাণী বিদ্যুৎ", আর বই লিখে সবাইকে জানালেন।', caption: 'প্রাণী বিদ্যুৎ', highlight: ['বিদ্যুৎ'],
  svg: svg(`.bob{transform-origin:center;animation:bob 1.4s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-16px)}}.zap{animation:zp .6s steps(2) infinite}@keyframes zp{50%{opacity:.2}}`,
    `<defs>${P.grad('bg5', '#1a237e', '#3949ab')}</defs><rect width="1080" height="1920" fill="url(#bg5)"/>${P.stars(30)}
<rect y="1150" width="1080" height="770" fill="#5d4037" stroke="${O}" stroke-width="6"/>
<g transform="translate(540,560)"><g class="bob"><rect x="-170" y="-220" width="340" height="440" rx="18" fill="#2e7d32" stroke="${O}" stroke-width="8"/><rect x="-140" y="-190" width="280" height="380" rx="10" fill="none" stroke="#ffd23f" stroke-width="5"/>${T(0, -100, '১৭৯১', 60, '#ffd23f')}${zap(0, 50, .9)}</g></g>
${at(540, 1400, .9, gal('cheer', { mouth: 'grin', brows: 'up' }), 'breathe')}`) });

scenes.push({ narration: 'কিন্তু আরেক বিজ্ঞানী আলেসান্দ্রো ভোল্টা মানলেন না। তিনি বললেন, বিদ্যুৎ আসছে ব্যাঙ থেকে নয়, ওই দুই ধাতুর ছোঁয়া থেকে!', caption: 'ভোল্টার প্রশ্ন', highlight: ['ভোল্টার'],
  svg: svg('', `${room('#e9e0cc', '#6d5644')}${[-560, -250, 60, 900, 1210, 1520].map(x => `<rect x="${x}" y="300" width="120" height="850" fill="#d7ccc8" stroke="${O}" stroke-width="6"/>`).join('')}
${at(300, 1380, .9, gal('hips', { mouth: 'frown', brows: 'think', px: 8 }), 'breathe')}<g transform="translate(780,1380) scale(-.9,.9)"><g class="breathe">${volta('point', { mouth: 'shout', brows: 'angry', px: 8 })}</g></g>
${P.label(300, 520, 'ব্যাঙ থেকে!', { fill: '#5d2e46', rot: -4, delay: .3, fs: 54 })}${P.label(780, 600, 'না, ধাতু থেকে!', { fill: '#1f4e5f', rot: 4, delay: 1.2, fs: 54 })}`) });

scenes.push({ narration: 'এই তর্কের উত্তর খুঁজতে গিয়েই ভোল্টা ১৮০০ সালে বানালেন পৃথিবীর প্রথম ব্যাটারি। আর আজ সেই ব্যাটারি চলে আমাদের মোবাইল থেকে গাড়ি পর্যন্ত সবকিছুতে।', caption: 'প্রথম ব্যাটারি!', highlight: ['ব্যাটারি!'],
  svg: svg(`.glow{transform-origin:center;animation:gl 1s ease-in-out infinite alternate}@keyframes gl{to{transform:scale(1.12);opacity:.5}}.fill{animation:fi 2.4s steps(4) infinite}@keyframes fi{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}`,
    `<defs><radialGradient id="rg7" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#e8f5e9"/><stop offset="1" stop-color="#a5d6a7"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#rg7)"/>${P.rays(540, 640, '#66bb6a', .2)}
<rect y="1150" width="1080" height="770" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
<g transform="translate(330,1100)">${Array.from({ length: 8 }, (_, i) => `<rect x="-90" y="${-60 - i * 70}" width="180" height="34" rx="8" fill="${i % 2 ? '#b0bec5' : '#e07a3c'}" stroke="${O}" stroke-width="6"/><rect x="-80" y="${-26 - i * 70}" width="160" height="36" fill="#fff3e0" stroke="${O}" stroke-width="4"/>`).join('')}${T(0, 90, '১৮০০', 54, O)}</g>
<g transform="translate(760,700)"><g class="glow"><circle r="200" fill="#fff59d" opacity=".6"/></g><rect x="-120" y="-220" width="240" height="440" rx="36" fill="#263238" stroke="${O}" stroke-width="8"/><rect x="-96" y="-180" width="192" height="340" rx="16" fill="#81d4fa"/><rect x="-60" y="-40" width="120" height="60" rx="10" fill="#fff" stroke="${O}" stroke-width="5"/><rect class="fill" x="-52" y="-32" width="104" height="44" fill="#43a047"/><rect x="60" y="-24" width="10" height="28" fill="${O}"/></g>`) });

scenes.push({ narration: 'গ্যালভানির ব্যাঙের পা খুলে দিয়েছিল বিদ্যুতের নতুন দুনিয়ার দরজা। আজও তাঁর নামে আছে "গ্যালভানোমিটার", যা দিয়ে ছোট্ট বিদ্যুৎও মাপা যায়।', caption: 'গ্যালভানোমিটার', highlight: ['গ্যালভানোমিটার'],
  svg: svg(`.needle{transform-origin:0px 0px;animation:nd 1.6s ease-in-out infinite alternate}@keyframes nd{from{transform:rotate(-40deg)}to{transform:rotate(40deg)}}`,
    `<defs><radialGradient id="rg8" cx=".5" cy=".38" r=".8"><stop offset="0" stop-color="#fffde7"/><stop offset="1" stop-color="#ffe082"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#rg8)"/>${P.rays(540, 600, '#ffb300', .22)}
<rect y="1150" width="1080" height="770" fill="#b0855a" stroke="${O}" stroke-width="6"/>
<g transform="translate(400,700)"><rect x="-260" y="-200" width="520" height="360" rx="30" fill="#5d4037" stroke="${O}" stroke-width="8"/><path d="M-200 60 A200 200 0 0 1 200 60" fill="#fff8e1" stroke="${O}" stroke-width="6"/>${[-60, -30, 0, 30, 60].map(a => `<path d="M${(170 * Math.sin(a * Math.PI / 180)).toFixed(0)} ${(60 - 170 * Math.cos(a * Math.PI / 180)).toFixed(0)} L${(195 * Math.sin(a * Math.PI / 180)).toFixed(0)} ${(60 - 195 * Math.cos(a * Math.PI / 180)).toFixed(0)}" stroke="${O}" stroke-width="5"/>`).join('')}
<g transform="translate(0,60)"><g class="needle"><path d="M0 0 L0 -170" stroke="#e63946" stroke-width="10" stroke-linecap="round"/></g><circle r="18" fill="${O}"/></g>${T(0, 130, 'G', 50, '#ffd23f')}</g>
${at(830, 1420, .8, gal('point', { mouth: 'grin', brows: 'up', px: -8 }), 'breathe')}`) });

scenes.push({ narration: 'পরের পর্বে থাকছে এডওয়ার্ড জেনারের গল্প, গোয়ালিনীদের দেখে যিনি খুঁজে পেলেন গুটিবসন্ত ঠেকানোর টিকা। ফলো করে সঙ্গেই থাকুন!', caption: 'প্রথম টিকা!', highlight: ['টিকা!'],
  svg: svg(`.btn{transform-origin:center;animation:btn 1s ease-in-out infinite}@keyframes btn{50%{transform:scale(1.07)}}.bob{transform-origin:center;animation:bob 1.4s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-14px)}}`,
    `<defs>${P.grad('dk7', '#0b1340', '#24124a')}</defs><rect width="1080" height="1920" fill="url(#dk7)"/>${P.stars(40)}
<text class="pop" x="540" y="330" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="120" fill="#ffd23f" stroke="${O}" stroke-width="6" paint-order="stroke">পরের পর্বে...</text>
<g transform="translate(400,880)"><g class="bob"><ellipse cx="0" cy="0" rx="190" ry="110" fill="#fff" stroke="${O}" stroke-width="8"/>${[[-90, -20, 50], [40, 30, 40], [110, -40, 34]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .8}" fill="#3e2723"/>`).join('')}<circle cx="-200" cy="-40" r="70" fill="#fff" stroke="${O}" stroke-width="7"/><circle cx="-220" cy="-55" r="10" fill="${O}"/><path d="M-170 -100 l20 -40 M-230 -100 l-14 -40" stroke="${O}" stroke-width="10" stroke-linecap="round"/>${[-120, -40, 60, 140].map(x => `<rect x="${x}" y="90" width="26" height="100" fill="#fff" stroke="${O}" stroke-width="6"/>`).join('')}</g></g>
<g transform="translate(780,880) rotate(-35)"><rect x="-26" y="-150" width="52" height="220" rx="12" fill="#e3f2fd" stroke="${O}" stroke-width="7"/><rect x="-26" y="-20" width="52" height="90" fill="#90caf9"/><rect x="-6" y="70" width="12" height="80" fill="#9e9e9e" stroke="${O}" stroke-width="4"/><rect x="-40" y="-170" width="80" height="24" rx="8" fill="#9e9e9e" stroke="${O}" stroke-width="5"/></g>
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'গ্যালভানির নাচুনে ব্যাঙ', series: 'আবিষ্কারের গল্প · পর্ব ৭', episode: 7, scientist: 'লুইজি গ্যালভানি',
  summary: 'মরা ব্যাঙের পা হঠাৎ লাফিয়ে উঠল! গ্যালভানির এই অবাক পরীক্ষা থেকেই শুরু হলো বিদ্যুতের নতুন খোঁজ, আর জন্ম নিল প্রথম ব্যাটারি।' }, scenes);
console.log('ep07:', scenes.length, 'scenes');
