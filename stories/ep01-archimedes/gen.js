// আবিষ্কারের গল্প · পর্ব ১: আর্কিমিডিস. Our own retelling (facts from the owner's book), drawn as animated SVG scenes.
// node stories/ep01-archimedes/gen.js -> plan.json + s*.svg here; story.yml renders it.
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const arch = person({ skin: '#f2c49b', hair: 'bald', hairColor: '#f4f4f4', beard: 'long', beardColor: '#fafafa', outfit: 'robe', cloth: '#f4f1e8', sash: '#3f7fd1' });
const king = person({ skin: '#e0a878', hair: 'short', hairColor: '#2b1a10', beard: 'short', beardColor: '#2b1a10', outfit: 'robe', cloth: '#7b3fa0', sash: '#ffc93c', trim: '#ffc93c', crown: true });
const sky = (id = 'sky') => `<defs>${P.grad(id, '#8fd6ff', '#e9f8ff')}</defs><rect width="1080" height="1920" fill="url(#${id})"/>`;
const sun = `<circle cx="880" cy="300" r="90" fill="#ffd54f" stroke="${O}" stroke-width="6"/>`;
const ground = `<rect y="1150" width="1080" height="770" fill="#e8c98f" stroke="${O}" stroke-width="6"/><path d="M0 1300 L1080 1300 M0 1500 L1080 1500" stroke="#d4b077" stroke-width="6"/>`;
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const beaker = (x, y, w, h, level, inner = '', id = 'b') => `<g transform="translate(${x},${y})"><clipPath id="${id}"><rect x="${-w / 2 + 6}" y="${-h}" width="${w - 12}" height="${h - 6}"/></clipPath>
<g clip-path="url(#${id})"><rect x="${-w / 2}" y="${-h * level}" width="${w}" height="${h * level}" fill="#7cc8f2" opacity=".85"/>${inner}</g>
<path d="M${-w / 2} ${-h} L${-w / 2} 0 L${w / 2} 0 L${w / 2} ${-h}" fill="none" stroke="${O}" stroke-width="8" stroke-linejoin="round"/></g>`;

const scenes = [];
scenes.push({ narration: 'প্রায় সোয়া দুই হাজার বছর আগের কথা। গ্রিসের সিরাকিউস শহরে থাকতেন এক বিখ্যাত বিজ্ঞানী, আর্কিমিডিস।', caption: 'বিজ্ঞানী আর্কিমিডিস', highlight: ['আর্কিমিডিস'],
  svg: svg('', `${sky()}${sun}<g class="drift">${P.cloud(200, 450)}</g><g class="drift" style="animation-delay:-4s">${P.cloud(640, 430, .7)}</g>${P.greekTown(1160)}${ground}
${at(540, 1260, 1.1, arch('stand', { mouth: 'grin', brows: 'up' }), 'breathe')}${P.label(520, 250, 'সিরাকিউস, গ্রিস', { fill: '#3f7fd1', rot: -4, delay: .3, fs: 66 })}`) });

scenes.push({ narration: 'একদিন সেখানকার রাজা এক স্বর্ণকারকে দিয়ে খাঁটি সোনার একটা মুকুট বানালেন।', caption: 'রাজার সোনার মুকুট', highlight: ['সোনার'],
  svg: svg(`.glow{transform-origin:center;animation:glow 1.2s ease-in-out infinite}@keyframes glow{50%{transform:scale(1.12);opacity:.6}}`,
    `${P.palace()}${P.throne(540, 1250)}${at(540, 1280, 1.05, king('offer', { mouth: 'grin', brows: 'up', px: 8 }, `<g class="glow">${P.burst(250, -560, 90, '#fff3a0')}</g>${P.crown(250, -560, 1.1)}`), 'breathe')}`) });

scenes.push({ narration: 'কিন্তু রাজার মনে সন্দেহ জাগল, স্বর্ণকার কি সোনার সাথে রুপা মিশিয়ে দিয়েছে?', caption: 'ভেজাল আছে কি?', highlight: ['ভেজাল'],
  svg: svg(`.q{animation:bob 1.1s ease-in-out infinite}`, `${P.palace()}${P.throne(540, 1250)}
<g class="pop" style="animation-delay:.2s"><path d="M150 180 Q130 90 260 80 L820 80 Q950 90 930 180 L930 420 Q950 500 820 500 L260 500 Q130 500 150 420Z" fill="#fff" stroke="${O}" stroke-width="7"/>
<circle cx="600" cy="560" r="28" fill="#fff" stroke="${O}" stroke-width="6"/><circle cx="640" cy="625" r="16" fill="#fff" stroke="${O}" stroke-width="6"/>
<path d="M230 360 L280 260 L440 260 L390 360Z" fill="#ffc93c" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><text x="335" y="440" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="46" fill="${O}">সোনা</text>
<text x="540" y="345" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="90" fill="${O}">+</text>
<path d="M640 360 L690 260 L850 260 L800 360Z" fill="#cfd8dc" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><text x="745" y="440" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="46" fill="${O}">রুপা</text>
<text class="q" x="860" y="250" font-family="Baloo Da 2" font-weight="800" font-size="110" fill="#e63946" stroke="${O}" stroke-width="4">?</text></g>
${at(540, 1330, .95, king('think', { mouth: 'hmm', brows: 'angry', px: -6, py: -10 }), 'breathe')}`) });

scenes.push({ narration: 'রাজা আর্কিমিডিসকে ডেকে বললেন, সত্যিটা বের করো। কিন্তু মুকুট ভাঙা যাবে না!', caption: 'মুকুট ভাঙা যাবে না!', highlight: ['ভাঙা'],
  svg: svg(``, `${P.palace()}${P.throne(270, 1250)}${at(270, 1280, .95, king('point', { mouth: 'shout', brows: 'angry', px: 10 }), 'breathe')}
${at(810, 1280, .95, arch('think', { mouth: 'o', brows: 'up', px: -10 }), 'breathe')}
<g class="pop" style="animation-delay:.4s">${P.crown(540, 560, 1.3)}<circle cx="540" cy="560" r="150" fill="none" stroke="#e63946" stroke-width="22"/><path d="M434 454 L646 666" stroke="#e63946" stroke-width="22" stroke-linecap="round"/></g>
${P.label(540, 290, 'ভাঙা যাবে না!', { fill: '#e63946', rot: -4, delay: .8, fs: 80 })}`) });

const drops = Array.from({ length: 10 }, (_, i) => `<ellipse class="drop" style="animation-delay:${-(i * .23).toFixed(2)}s" cx="${i % 2 ? 170 + i * 8 : 900 - i * 8}" cy="1020" rx="16" ry="22" fill="#7cc8f2" stroke="${O}" stroke-width="4"/>`).join('');
scenes.push({ narration: 'অনেক দিন ভেবেও উত্তর মেলে না। একদিন পানিভর্তি টবে গোসল করতে নামতেই খানিকটা পানি উপচে পড়ল।', caption: 'পানি উপচে পড়ল!', highlight: ['পানি'],
  svg: svg(`.drop{animation:drop 1.4s ease-in infinite}@keyframes drop{0%{transform:translate(0,0);opacity:1}100%{transform:translate(0,260px);opacity:0}}
.dip{animation:dip 1.6s cubic-bezier(.4,0,.3,1.4) both}@keyframes dip{from{transform:translateY(-260px)}to{transform:translateY(0)}}`,
    `<rect width="1080" height="1920" fill="#d9f1fb"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${i * 160} 0 L${i * 160} 1250" stroke="#b8e0f2" stroke-width="6"/>`).join('')}${Array.from({ length: 9 }, (_, j) => `<path d="M0 ${j * 150} L1080 ${j * 150}" stroke="#b8e0f2" stroke-width="6"/>`).join('')}
<rect x="760" y="200" width="240" height="300" rx="20" fill="#bfe7ff" stroke="${O}" stroke-width="7"/><path d="M880 200 L880 500 M760 350 L1000 350" stroke="${O}" stroke-width="6"/>
<rect y="1250" width="1080" height="670" fill="#e9eef0" stroke="${O}" stroke-width="6"/><ellipse cx="540" cy="1290" rx="470" ry="70" fill="#7cc8f2" opacity=".8" stroke="${O}" stroke-width="5"/>
<g class="dip">${at(540, 1470, 1.25, arch.bust({ mouth: 'o', brows: 'up', py: 6 }, 'up'))}</g>
<path d="M200 980 L880 980 L820 1300 L260 1300Z" fill="#a8693c" stroke="${O}" stroke-width="7" stroke-linejoin="round"/><path d="M230 1080 L850 1080 M245 1190 L835 1190" stroke="#7a4a2a" stroke-width="12"/>
<ellipse cx="540" cy="985" rx="345" ry="40" fill="#7cc8f2" stroke="${O}" stroke-width="6"/>${drops}
${P.burst(870, 760, 150, '#ffd23f')}<text x="870" y="782" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="62" fill="#3f7fd1">ছলাৎ!</text>`) });

scenes.push({ narration: 'আর তখনই তাঁর মাথায় এল, পানিতে কিছু ডোবালে সেটা নিজের আয়তনের সমান পানি সরিয়ে দেয়।', caption: 'সমান পানি সরে যায়', highlight: ['সমান'],
  svg: svg(`.sink{animation:sink 2.2s ease-in-out .3s both}@keyframes sink{from{transform:translateY(-300px)}to{transform:translateY(0)}}
.fill{transform-origin:50% 100%;animation:fill 2s ease-in-out 1.2s both}@keyframes fill{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.flow{animation:flow 2s linear 1.1s both}@keyframes flow{0%{opacity:0}10%,85%{opacity:1}100%{opacity:0}}`,
    `<defs><radialGradient id="rg" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#ffd59a"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#rg)"/>${P.rays(540, 700, '#ffb74d', .22)}
<rect y="1250" width="1080" height="670" fill="#c98b5a" stroke="${O}" stroke-width="6"/>
${P.label(540, 300, 'আয়তন = সরানো পানি', { fill: '#3f7fd1', fs: 72, delay: .2 })}
<g transform="translate(390,1250)"><rect x="-190" y="-560" width="380" height="560" fill="#7cc8f2" opacity=".85"/><rect x="150" y="-575" width="110" height="26" fill="#fff" stroke="${O}" stroke-width="6"/>
<g class="sink"><rect x="-80" y="-300" width="160" height="160" fill="#c98b5a" stroke="${O}" stroke-width="7"/></g>
<path d="M-200 -640 L-200 0 L200 0 L200 -560 L260 -575" fill="none" stroke="${O}" stroke-width="9" stroke-linejoin="round"/>
<path class="flow" d="M262 -560 Q300 -520 300 -330" stroke="#5bb4e8" stroke-width="18" fill="none" stroke-linecap="round"/></g>
<g transform="translate(830,1250)"><g class="fill"><rect x="-100" y="-160" width="200" height="160" fill="#7cc8f2" opacity=".9"/></g><path d="M-110 -330 L-110 0 L110 0 L110 -330" fill="none" stroke="${O}" stroke-width="9" stroke-linejoin="round"/></g>`) });

scenes.push({ narration: 'খুশিতে তিনি চিৎকার করে উঠলেন, ইউরেকা! ইউরেকা! মানে, আমি পেয়ে গেছি!', caption: 'ইউরেকা!', highlight: ['ইউরেকা!'],
  svg: svg(`.run{animation:run .45s ease-in-out infinite alternate}@keyframes run{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-30px) rotate(3deg)}}
.big{transform-origin:center;animation:big .7s cubic-bezier(.3,1.8,.5,1) .3s both, puls 1s ease-in-out 1s infinite}@keyframes big{from{transform:scale(0) rotate(-20deg)}to{transform:scale(1) rotate(0)}}@keyframes puls{50%{transform:scale(1.08)}}`,
    `${sky('sky2')}${P.greekTown(1160)}${ground}${at(540, 1310, 1.0, arch('cheer', { mouth: 'shout', brows: 'up' }), 'run')}
<g transform="translate(590,315) rotate(-6)"><g class="big">${P.burst(0, 0, 240, '#ffd23f')}<text x="0" y="28" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="80" fill="#e63946">ইউরেকা!</text></g></g>
<path d="M260 1100 L170 1100 M280 1040 L150 1040 M260 980 L190 980" stroke="${O}" stroke-width="8" stroke-linecap="round"/>`) });

scenes.push({ narration: 'এরপর একই ওজনের খাঁটি সোনা আর মুকুট পানিতে ডোবানো হলো। মুকুট সরাল বেশি পানি, ধরা পড়ল ভেজাল!', caption: 'ধরা পড়ল ভেজাল!', highlight: ['ভেজাল!'],
  svg: svg(`.fillA{transform-origin:50% 100%;animation:fill 1.6s ease-out .5s both}.fillB{transform-origin:50% 100%;animation:fill 1.6s ease-out .5s both}@keyframes fill{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.stamp{transform-origin:center;animation:stamp .5s cubic-bezier(.3,1.8,.5,1) 2.3s both}@keyframes stamp{from{transform:scale(2.4) rotate(-30deg);opacity:0}to{transform:scale(1) rotate(-10deg);opacity:1}}`,
    `<defs><radialGradient id="rg2" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#ffd59a"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#rg2)"/>
<rect y="1250" width="1080" height="670" fill="#c98b5a" stroke="${O}" stroke-width="6"/>
${[[290, 'খাঁটি সোনা', 70, `<path d="M-60 -90 L-30 -150 L60 -150 L30 -90Z" fill="#ffc93c" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>`, 'fillA'], [790, 'মুকুট', 190, P.crown(0, -140, .8), 'fillB']].map(([x, t, h, obj, cls]) => `
<g transform="translate(${x},900)"><rect x="-150" y="-330" width="300" height="330" fill="#7cc8f2" opacity=".85"/>${obj}<path d="M-160 -380 L-160 0 L160 0 L160 -330 L210 -345" fill="none" stroke="${O}" stroke-width="9" stroke-linejoin="round"/></g>
<g transform="translate(${x + 60},1250)"><g class="${cls}"><rect x="-80" y="${-h}" width="160" height="${h}" fill="#7cc8f2"/></g><path d="M-90 -230 L-90 0 L90 0 L90 -230" fill="none" stroke="${O}" stroke-width="8" stroke-linejoin="round"/></g>
${P.label(x, 440, t, { fs: 60, fill: '#7a4a2a', delay: .2 })}`).join('')}
<g transform="translate(540,640)"><g class="stamp"><rect x="-210" y="-80" width="420" height="150" rx="24" fill="#fff" stroke="#e63946" stroke-width="12"/><text x="0" y="35" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="100" fill="#e63946">ভেজাল!</text></g></g>`) });

scenes.push({ narration: 'পরের পর্বে থাকছে কলম্বাসের সমুদ্রযাত্রার গল্প। ফলো করে সঙ্গেই থাকুন!', caption: 'কলম্বাসের অভিযান!', highlight: ['কলম্বাসের'],
  svg: svg(`.ship{transform-origin:50% 100%;animation:ship 2.2s ease-in-out infinite}@keyframes ship{50%{transform:rotate(3deg) translateY(-14px)}}
.wv{animation:wv 3s linear infinite}@keyframes wv{to{transform:translateX(-200px)}}.btn{transform-origin:center;animation:btn 1s ease-in-out infinite}@keyframes btn{50%{transform:scale(1.07)}}`,
    `<defs>${P.grad('dk', '#0b1340', '#24124a')}</defs><rect width="1080" height="1920" fill="url(#dk)"/>${P.stars(46)}
<circle cx="830" cy="560" r="90" fill="#fff3b0" stroke="${O}" stroke-width="6"/>
<text class="pop" x="540" y="330" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="120" fill="#ffd23f" stroke="${O}" stroke-width="6" paint-order="stroke">পরের পর্বে...</text>
<g class="ship"><g transform="translate(540,1000)"><path d="M-260 0 L260 0 L190 120 L-190 120Z" fill="#8a5a36" stroke="${O}" stroke-width="7" stroke-linejoin="round"/><path d="M0 0 L0 -420" stroke="${O}" stroke-width="12"/>
<path d="M10 -400 Q160 -300 10 -170Z" fill="#fff" stroke="${O}" stroke-width="6"/><path d="M-10 -380 Q-200 -250 -10 -60Z" fill="#fff" stroke="${O}" stroke-width="6"/><path d="M0 -420 L80 -440 L0 -460Z" fill="#e63946" stroke="${O}" stroke-width="4"/><circle cx="-90" cy="60" r="16" fill="#ffd23f" stroke="${O}" stroke-width="4"/><circle cx="0" cy="60" r="16" fill="#ffd23f" stroke="${O}" stroke-width="4"/><circle cx="90" cy="60" r="16" fill="#ffd23f" stroke="${O}" stroke-width="4"/></g></g>
<g class="wv"><path d="M-100 1100 ${Array.from({ length: 14 }, (_, i) => `Q${-50 + i * 100} 1060 ${i * 100} 1100`).join(' ')} L1400 1920 L-100 1920Z" fill="#1e4f8a" stroke="${O}" stroke-width="6"/></g>
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'আর্কিমিডিসের ইউরেকা', series: 'আবিষ্কারের গল্প · পর্ব ১', episode: 1, scientist: 'আর্কিমিডিস' }, scenes);
console.log('ep01:', scenes.length, 'scenes');
