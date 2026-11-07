// আবিষ্কারের গল্প · পর্ব ৪: গ্যালিলিও. Our own retelling (facts from the owner's book, birth year corrected to 1564).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const gal = person({ skin: '#f0c49a', hair: 'bald', hairColor: '#8a4b26', beard: 'short', beardColor: '#8a4b26', outfit: 'coat', cloth: '#2b2b2b', sash: '#f4f1e8', legsColor: '#2b2b2b' });
const kid = c => person({ skin: c, hair: 'short', hairColor: '#2b1a10', outfit: 'coat', cloth: ['#3f7fd1', '#c62828', '#2e7d32'][c.length % 3], legsColor: '#5d4037' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const day = id => `<defs>${P.grad(id, '#8fd6ff', '#e9f8ff')}</defs><rect width="1080" height="1920" fill="url(#${id})"/>`;
const night = id => `<defs>${P.grad(id, '#0d1b4c', '#29407a')}</defs><rect width="1080" height="1920" fill="url(#${id})"/>${P.stars(44)}`;
// Leaning tower: base centre (x,y), height h, tilt in degrees
const tower = (x, y, h, tilt = 5) => `<g transform="translate(${x},${y}) rotate(${tilt})"><rect x="-110" y="${-h}" width="220" height="${h}" rx="10" fill="#f7f1e3" stroke="${O}" stroke-width="7"/>
${Array.from({ length: 7 }, (_, i) => { const yy = -h + i * h / 7; return `<rect x="-120" y="${yy - 8}" width="240" height="18" rx="6" fill="#e8dcc0" stroke="${O}" stroke-width="5"/>${[-70, -25, 20, 65].map(a => `<rect x="${a}" y="${yy + 25}" width="26" height="${h / 7 - 45}" rx="13" fill="#cbbd9c" stroke="${O}" stroke-width="4"/>`).join('')}`; }).join('')}
<rect x="-80" y="${-h - 70}" width="160" height="70" rx="8" fill="#f7f1e3" stroke="${O}" stroke-width="6"/></g>`;
const scope = (x, y, s = 1, ang = -35) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M0 0 L-90 160 M0 0 L90 160 M0 0 L0 170" stroke="#8a5a36" stroke-width="14" stroke-linecap="round"/><g transform="rotate(${ang})"><rect x="-60" y="-34" width="360" height="68" rx="20" fill="#c98b3a" stroke="${O}" stroke-width="7"/><rect x="280" y="-46" width="50" height="92" rx="12" fill="#a1683a" stroke="${O}" stroke-width="7"/><rect x="-100" y="-24" width="50" height="48" rx="10" fill="#6b3f22" stroke="${O}" stroke-width="6"/></g></g>`;
const ball = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${O}" stroke-width="6"/><ellipse cx="${x - r * .35}" cy="${y - r * .35}" rx="${r * .25}" ry="${r * .15}" fill="#fff" opacity=".5"/>`;

const scenes = [];
scenes.push({ narration: '১৫৬৪ সালে ইতালির পিসা শহরে জন্ম নেন গ্যালিলিও গ্যালিলেই। মাত্র পঁচিশ বছর বয়সে তিনি হলেন গণিতের অধ্যাপক।', caption: 'গ্যালিলিও গ্যালিলেই', highlight: ['গ্যালিলিও'],
  svg: svg('', `${day('s0')}<g class="drift">${P.cloud(260, 480, .9)}</g>${tower(820, 1160, 760, 5)}
<rect x="40" y="880" width="260" height="280" fill="#f0d9b5" stroke="${O}" stroke-width="6"/><path d="M20 890 L170 790 L320 890Z" fill="#d9734a" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>
<rect y="1150" width="1080" height="770" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
${at(470, 1270, 1.1, gal('stand', { mouth: 'smile', brows: 'normal' }), 'breathe')}${P.label(470, 250, 'পিসা, ইতালি', { fill: '#2b2b2b', rot: -4, delay: .3, fs: 70 })}`) });

scenes.push({ narration: 'তখন সবাই মানত, ভারী জিনিস হালকা জিনিসের আগে মাটিতে পড়ে। দুই হাজার বছর আগে অ্যারিস্টটল এমনটাই বলেছিলেন।', caption: 'ভারী আগে পড়ে?', highlight: ['ভারী'],
  svg: svg(`.fa{animation:fa 1.6s cubic-bezier(.5,0,1,1) .4s infinite}@keyframes fa{0%{transform:translateY(0)}70%,100%{transform:translateY(560px)}}
.fb{animation:fb 1.6s cubic-bezier(.5,0,1,1) .4s infinite}@keyframes fb{0%{transform:translateY(0)}70%,100%{transform:translateY(300px)}}`,
    `<defs><radialGradient id="rg" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#ffd59a"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#rg)"/>${P.rays(540, 700, '#ffb74d', .22)}
<rect y="1150" width="1080" height="770" fill="#c98b5a" stroke="${O}" stroke-width="6"/>
<g class="fa">${ball(330, 470, 110, '#5d4037')}<text x="330" y="490" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="48" fill="#fff">ভারী</text></g>
<g class="fb">${ball(760, 520, 55, '#90caf9')}<text x="760" y="440" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="42" fill="${O}">হালকা</text></g>
<path d="M150 1150 L930 1150" stroke="${O}" stroke-width="8"/>
<g transform="translate(540,300) rotate(-3)"><g class="pop" style="animation-delay:.2s"><rect x="-210" y="-90" width="420" height="160" rx="16" fill="#8d6e63" stroke="${O}" stroke-width="7"/><rect x="-190" y="-70" width="380" height="120" rx="8" fill="#fff8e1" stroke="${O}" stroke-width="4"/><text x="0" y="5" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="50" fill="#5d4037">অ্যারিস্টটল</text></g></g>`) });

scenes.push({ narration: 'গ্যালিলিও ভাবলেন, পরীক্ষা না করে মানব কেন? গল্প আছে, তিনি পিসার হেলানো মিনার থেকে দুটো ভিন্ন ওজনের বল একসাথে ফেলেছিলেন।', caption: 'পিসার হেলানো মিনার', highlight: ['মিনার'],
  svg: svg(`.drop{animation:drop 2.4s cubic-bezier(.5,0,1,1) 1.2s both}@keyframes drop{from{transform:translateY(0)}to{transform:translateY(780px)}}`,
    `${day('s2')}<g class="drift">${P.cloud(200, 380, .8)}</g>${tower(600, 1180, 900, 6)}
<g transform="translate(600,1180) rotate(6) translate(0,-900)">${at(0, -70, .22, gal('point', { mouth: 'grin', brows: 'up' }))}</g>
<g class="drop">${ball(820, 330, 40, '#5d4037')}${ball(900, 340, 22, '#90caf9')}</g>
<rect y="1170" width="1080" height="750" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
${at(130, 1350, .55, kid('#e0a878')('point', { mouth: 'o', brows: 'up', py: -10 }))}${at(270, 1360, .5, kid('#f6cfa6')('stand', { mouth: 'o', brows: 'up', py: -10 }))}${at(980, 1350, .55, kid('#c98f63')('think', { mouth: 'hmm', brows: 'think', py: -10 }))}`) });

scenes.push({ narration: 'দেখা গেল, দুটো বলই একসাথে মাটিতে পড়ল! পুরনো ধারণা ভুল প্রমাণিত হলো।', caption: 'একসাথে পড়ল!', highlight: ['একসাথে'],
  svg: svg(`.land{animation:land .9s cubic-bezier(.5,0,1,1) .2s both}@keyframes land{0%{transform:translateY(-700px)}80%{transform:translateY(0)}90%{transform:translateY(-30px)}100%{transform:translateY(0)}}
.thud{transform-origin:center;animation:pop .5s cubic-bezier(.3,1.7,.5,1) 1s both}`,
    `${day('s3')}<rect y="1050" width="1080" height="870" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
<g class="land">${ball(400, 990, 70, '#5d4037')}${ball(680, 1020, 38, '#90caf9')}</g>
<g transform="translate(540,640)"><g class="thud">${P.burst(0, 0, 200, '#ffd23f')}<text x="0" y="28" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="90" fill="#e63946">ধপ!</text></g></g>
${at(150, 1330, .55, kid('#e0a878')('cheer', { mouth: 'grin', brows: 'up' }))}${at(930, 1330, .55, kid('#c98f63')('cheer', { mouth: 'grin', brows: 'up' }))}
${P.label(540, 300, 'অ্যারিস্টটল ভুল!', { fill: '#e63946', rot: -4, delay: 1.3, fs: 66 })}`) });

scenes.push({ narration: 'এরপর তিনি নিজেই বানালেন শক্তিশালী এক দূরবিন, আর সেটা তাক করলেন আকাশের দিকে।', caption: 'নিজের হাতে দূরবিন', highlight: ['দূরবিন'],
  svg: svg(``, `${night('n4')}<circle cx="850" cy="330" r="80" fill="#fff3b0" stroke="${O}" stroke-width="6"/>
<rect y="1150" width="1080" height="770" fill="#3e2723" stroke="${O}" stroke-width="6"/>
${scope(620, 960, 1.1, -38)}${at(320, 1270, 1.05, gal('point', { mouth: 'grin', brows: 'up', px: 10, py: -10 }), 'breathe')}`) });

scenes.push({ narration: 'দূরবিনে তিনি দেখলেন চাঁদের গায়ে পাহাড় আর গর্ত, আর বৃহস্পতির চারপাশে ঘুরছে চারটা উপগ্রহ!', caption: 'বৃহস্পতির চার চাঁদ', highlight: ['চার'],
  svg: svg(`.m1{animation:m 3s ease-in-out infinite alternate}.m2{animation:m 4.4s ease-in-out infinite alternate-reverse}.m3{animation:m 6s ease-in-out infinite alternate}.m4{animation:m 8s ease-in-out infinite alternate-reverse}@keyframes m{from{transform:translateX(-1px)}to{transform:translateX(var(--d))}}`,
    `<rect width="1080" height="1920" fill="#06081a"/><defs><clipPath id="lens"><circle cx="540" cy="760" r="420"/></clipPath></defs>
<g clip-path="url(#lens)"><rect width="1080" height="1920" fill="#0d1440"/>${P.stars(30)}
<circle cx="540" cy="760" r="120" fill="#e8b98a" stroke="${O}" stroke-width="7"/><path d="M425 720 Q540 700 655 720 M420 770 Q540 790 660 770 M430 815 Q540 835 650 815" stroke="#b97d4b" stroke-width="16" fill="none"/><ellipse cx="590" cy="800" rx="26" ry="14" fill="#c0603a"/>
${[[1, 210, 22], [2, 300, 18], [3, 380, 20], [4, -260, 16]].map(([k, dx, r]) => `<g class="m${k}" style="--d:${-dx * 2}px"><circle cx="${540 + dx}" cy="760" r="${r}" fill="#fff8e1" stroke="${O}" stroke-width="5"/></g>`).join('')}</g>
<circle cx="540" cy="760" r="420" fill="none" stroke="#c98b3a" stroke-width="30"/><circle cx="540" cy="760" r="440" fill="none" stroke="${O}" stroke-width="8"/>
${P.label(540, 250, 'বৃহস্পতি', { fill: '#c0603a', fs: 64, delay: .3 })}`) });

const orbit = `.o1{transform-box:view-box;transform-origin:540px 780px;animation:orb 6s linear infinite}.o2{transform-box:view-box;transform-origin:540px 780px;animation:orb 10s linear infinite}@keyframes orb{to{transform:rotate(360deg)}}`;
scenes.push({ narration: 'এসব দেখে তিনি বুঝলেন, কোপারনিকাসই ঠিক। পৃথিবী সূর্যের চারদিকে ঘোরে।', caption: 'কোপারনিকাসই ঠিক!', highlight: ['ঠিক!'],
  svg: svg(orbit, `${night('n6')}<circle cx="540" cy="780" r="230" fill="none" stroke="#9fb4ff" stroke-width="4" stroke-dasharray="14 14"/><circle cx="540" cy="780" r="360" fill="none" stroke="#9fb4ff" stroke-width="4" stroke-dasharray="14 14"/>
<circle cx="540" cy="780" r="110" fill="#ffd23f" stroke="${O}" stroke-width="7"/>
<g class="o1"><circle cx="770" cy="780" r="42" fill="#3fa9f5" stroke="${O}" stroke-width="6"/></g><g class="o2"><circle cx="180" cy="780" r="34" fill="#ff7043" stroke="${O}" stroke-width="6"/></g>
<g transform="translate(860,320)"><g class="pop" style="animation-delay:.6s"><circle r="90" fill="#2e7d32" stroke="${O}" stroke-width="7"/><path d="M-40 0 L-10 30 L45 -35" stroke="#fff" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></g>`) });

scenes.push({ narration: 'কিন্তু সেকালের ক্ষমতাবানরা রেগে গেলেন। তাঁকে শাস্তি পেতে হলো, তবু সত্যিটা থেমে থাকেনি।', caption: 'সত্য থামে না', highlight: ['সত্য'],
  svg: svg(`.beam{animation:beam 3s ease-in-out infinite alternate}@keyframes beam{to{opacity:.55}}.fl{transform-origin:50% 100%;animation:fl .5s ease-in-out infinite alternate}@keyframes fl{to{transform:scale(.85,1.12)}}`,
    `<rect width="1080" height="1920" fill="#5d5a6e"/>${Array.from({ length: 8 }, (_, j) => Array.from({ length: 5 }, (_, i) => `<rect x="${i * 230 + (j % 2) * 115 - 60}" y="${j * 140}" width="220" height="130" rx="8" fill="#6b6880" stroke="#4a4759" stroke-width="5"/>`).join('')).join('')}
<rect x="700" y="230" width="240" height="300" rx="16" fill="#1d2a5c" stroke="${O}" stroke-width="8"/>${[[750, 300], [880, 360], [790, 450]].map(([x, y]) => `<circle class="twinkle" cx="${x}" cy="${y}" r="9" fill="#fff8c4"/>`).join('')}<path d="M760 230 L760 530 M820 230 L820 530 M880 230 L880 530" stroke="#3a3a3a" stroke-width="10"/>
<path class="beam" d="M700 530 L940 530 L620 1250 L200 1250Z" fill="#fff8c4" opacity=".25"/>
<rect y="1150" width="1080" height="770" fill="#4a4759" stroke="${O}" stroke-width="6"/>
${at(400, 1270, 1.0, gal('think', { mouth: 'frown', brows: 'think', px: 12, py: -12 }), 'breathe')}
<g transform="translate(820,1120)"><rect x="-90" y="0" width="180" height="40" fill="#8a5a36" stroke="${O}" stroke-width="5"/><rect x="-16" y="-80" width="32" height="80" fill="#fff" stroke="${O}" stroke-width="5"/><g class="fl"><path d="M0 -130 Q22 -100 0 -82 Q-22 -100 0 -130Z" fill="#ffb300" stroke="${O}" stroke-width="4"/></g></g>`) });

scenes.push({ narration: 'পরের পর্বে থাকছে উইলিয়াম হার্ভের গল্প, যিনি জানিয়েছিলেন আমাদের শরীরে রক্ত কীভাবে ঘোরে। ফলো করে সঙ্গেই থাকুন!', caption: 'রক্তের রহস্য!', highlight: ['রক্তের'],
  svg: svg(`.beat{transform-origin:center;animation:beat .9s ease-in-out infinite}@keyframes beat{15%{transform:scale(1.12)}30%{transform:scale(1)}45%{transform:scale(1.08)}}
.flow{stroke-dasharray:30 24;animation:dash 1s linear infinite}@keyframes dash{to{stroke-dashoffset:-54}}.btn{transform-origin:center;animation:btn 1s ease-in-out infinite}@keyframes btn{50%{transform:scale(1.07)}}`,
    `<defs>${P.grad('dk', '#0b1340', '#24124a')}</defs><rect width="1080" height="1920" fill="url(#dk)"/>${P.stars(40)}
<text class="pop" x="540" y="330" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="120" fill="#ffd23f" stroke="${O}" stroke-width="6" paint-order="stroke">পরের পর্বে...</text>
<ellipse class="flow" cx="540" cy="780" rx="380" ry="300" fill="none" stroke="#ef5350" stroke-width="14"/>
<g class="beat"><path d="M540 920 C380 810 330 700 380 630 C430 560 520 580 540 650 C560 580 650 560 700 630 C750 700 700 810 540 920Z" fill="#e63946" stroke="${O}" stroke-width="8"/><ellipse cx="470" cy="660" rx="30" ry="18" fill="#fff" opacity=".45"/></g>
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'গ্যালিলিওর দূরবিন', series: 'আবিষ্কারের গল্প · পর্ব ৪', episode: 4, scientist: 'গ্যালিলিও',
  summary: 'হেলানো মিনার থেকে দুটো বল, আর আকাশে তাক করা এক দূরবিন। গ্যালিলিও দেখিয়ে দিলেন, বিজ্ঞান মানে নিজে পরীক্ষা করে দেখা!' }, scenes);
console.log('ep04:', scenes.length, 'scenes');
