// আবিষ্কারের গল্প · পর্ব ২: কলম্বাস. Our own retelling (facts from the owner's book), drawn as animated SVG scenes.
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const col = person({ skin: '#f2c9a0', hair: 'long', hairColor: '#8a4b26', outfit: 'coat', cloth: '#8e2b2b', sash: '#e9b949', legsColor: '#3d2a1e' });
const queen = person({ skin: '#f6d2b0', hair: 'long', hairColor: '#d9a441', outfit: 'robe', cloth: '#c62828', sash: '#ffc93c', trim: '#ffc93c', crown: true });
const sailor = person({ skin: '#d9a273', hair: 'short', hairColor: '#2b1a10', beard: 'short', beardColor: '#2b1a10', outfit: 'coat', cloth: '#2f5f9e', legsColor: '#e9dcc0' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const SEA_CSS = `.wv{animation:wv 3s linear infinite}@keyframes wv{to{transform:translateX(-200px)}}.wv2{animation:wv 4.5s linear infinite}
.ship{transform-origin:50% 100%;animation:ship 2.4s ease-in-out infinite}@keyframes ship{50%{transform:rotate(2.5deg) translateY(-12px)}}`;
const dayBg = id => `<defs>${P.grad(id, '#8fd6ff', '#e9f8ff')}</defs><rect width="1080" height="1920" fill="url(#${id})"/>`;

const scenes = [];
scenes.push({ narration: '১৪৫১ সালে ইতালির জেনোয়া শহরে জন্ম নিলেন ক্রিস্টোফার কলম্বাস। ছোটবেলা থেকেই তাঁর স্বপ্ন ছিল সমুদ্রে ঘুরে বেড়ানো।', caption: 'স্বপ্ন সমুদ্রযাত্রা', highlight: ['সমুদ্রযাত্রা'],
  svg: svg(SEA_CSS, `${dayBg('s0')}<circle cx="880" cy="300" r="90" fill="#ffd54f" stroke="${O}" stroke-width="6"/><g class="drift">${P.cloud(250, 470)}</g>
${P.sea(860, '#3c8fdc', 'wv2')}<g class="ship">${P.ship(760, 820, .55)}</g>
<rect y="1000" width="1080" height="920" fill="#c9a26b" stroke="${O}" stroke-width="6"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${i * 170} 1000 L${i * 170} 1920" stroke="#a8824f" stroke-width="6"/>`).join('')}
<rect x="80" y="880" width="40" height="140" fill="#8a5a36" stroke="${O}" stroke-width="5"/>
${at(420, 1260, 1.1, col('point', { mouth: 'grin', brows: 'up', px: 10, py: -6 }), 'breathe')}${P.label(520, 250, 'জেনোয়া, ইতালি', { fill: '#8e2b2b', rot: -4, delay: .3, fs: 66 })}`) });

scenes.push({ narration: 'তিনি ভাবতেন, পৃথিবী তো গোল। তাহলে পশ্চিম দিকে জাহাজ চালালেই একদিন ভারতে পৌঁছানো যাবে।', caption: 'পশ্চিমে গেলেই ভারত?', highlight: ['ভারত?'],
  svg: svg(`.route{stroke-dasharray:28 22;animation:dash 1s linear infinite}@keyframes dash{to{stroke-dashoffset:-50}}
.globe{transform-box:view-box;transform-origin:540px 700px;animation:gl 8s ease-in-out infinite}@keyframes gl{50%{transform:rotate(8deg)}}`,
    `<defs>${P.grad('sp', '#2b2d6e', '#5b3b8c')}<clipPath id="gc"><circle cx="540" cy="700" r="330"/></clipPath><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#ffd23f"/></marker></defs>
<rect width="1080" height="1920" fill="url(#sp)"/>${P.stars(40)}
<g class="globe"><circle cx="540" cy="700" r="330" fill="#3fa9f5" stroke="${O}" stroke-width="8"/><g clip-path="url(#gc)"><path d="M560 470 Q640 420 720 470 Q760 540 700 600 Q620 620 580 560Z M640 650 Q720 640 760 720 Q730 820 650 800 Q600 740 640 650Z M300 520 Q360 470 420 520 Q440 620 380 700 Q330 760 300 680Z" fill="#6cc04a" stroke="${O}" stroke-width="5"/></g></g>
<text x="660" y="540" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="44" fill="#fff" stroke="${O}" stroke-width="4" paint-order="stroke">ইউরোপ</text>
<text x="700" y="760" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="44" fill="#fff" stroke="${O}" stroke-width="4" paint-order="stroke">ভারত</text>
<path class="route" d="M620 520 Q460 300 230 560 Q120 900 420 1080 Q640 1120 700 800" fill="none" stroke="#ffd23f" stroke-width="12" marker-end="url(#ah)"/>
${P.label(540, 1180, 'পশ্চিম দিকে ⟵', { fill: '#5b3b8c', fs: 64, delay: .4 })}
<rect y="1300" width="1080" height="620" fill="#3a2a6e" opacity=".6"/>`) });

scenes.push({ narration: 'কিন্তু জাহাজ আর টাকা কোথায়? অনেক ঘুরে শেষে স্পেনের রানি ইসাবেলা তাঁকে সাহায্য করতে রাজি হলেন।', caption: 'রানির সাহায্য', highlight: ['রানির'],
  svg: svg(`.bag{transform-origin:center;animation:bob 1.2s ease-in-out infinite}`, `${P.palace()}${P.throne(330, 1250)}
${at(330, 1280, .95, queen('offer', { mouth: 'smile', brows: 'normal', px: 10 }, `<g class="bag"><path d="M230 -500 Q300 -520 330 -480 Q380 -380 300 -350 Q200 -340 210 -430Z" fill="#c98b3a" stroke="${O}" stroke-width="6"/><path d="M250 -505 L310 -505" stroke="${O}" stroke-width="10"/><text x="285" y="-405" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="60" fill="#ffd23f" stroke="${O}" stroke-width="3">৳</text></g>`), 'breathe')}
${at(830, 1280, .95, col('stand', { mouth: 'grin', brows: 'up', px: -10 }), 'breathe')}${P.label(540, 260, 'স্পেনের রানি ইসাবেলা', { fill: '#c62828', fs: 60, delay: .3 })}`) });

scenes.push({ narration: '১৪৯২ সালের ৩ আগস্ট তিনটি জাহাজ আর ৮৮ জন নাবিক নিয়ে শুরু হলো অভিযান। বড় জাহাজটার নাম সান্তা মারিয়া।', caption: 'সান্তা মারিয়া', highlight: ['সান্তা'],
  svg: svg(SEA_CSS, `${dayBg('s3')}<circle cx="170" cy="330" r="80" fill="#ffd54f" stroke="${O}" stroke-width="6"/><g class="drift">${P.cloud(700, 300, .8)}</g>
${P.sea(1000, '#3c8fdc', 'wv2')}<g class="ship" style="animation-delay:-.8s">${P.ship(220, 980, .45)}</g><g class="ship" style="animation-delay:-1.6s">${P.ship(860, 990, .45)}</g>
${P.sea(1160, '#2f7fd1')}<g class="ship">${P.ship(540, 1180, .95)}</g>${P.sea(1290, '#2766b0', 'wv2')}
${P.label(540, 560, '১৪৯২ সাল', { fill: '#2f7fd1', fs: 70, delay: .3, rot: -3 })}`) });

const bolts = `<path class="flash" d="M820 180 L760 380 L820 380 L740 580" fill="none" stroke="#ffd23f" stroke-width="16" stroke-linejoin="round"/>`;
scenes.push({ narration: 'দিনের পর দিন শুধু পানি আর পানি। নাবিকেরা ভয় পেয়ে ফিরে যেতে চাইল, কিন্তু কলম্বাস হাল ছাড়লেন না।', caption: 'হাল ছাড়লেন না!', highlight: ['হাল'],
  svg: svg(`${SEA_CSS}.flash{animation:flash 1.8s steps(1) infinite}@keyframes flash{0%,100%{opacity:0}10%,20%{opacity:1}}
.rock{transform-origin:50% 100%;animation:rock 1.6s ease-in-out infinite}@keyframes rock{25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}`,
    `<defs>${P.grad('st', '#37474f', '#78909c')}</defs><rect width="1080" height="1920" fill="url(#st)"/>${bolts}
<g class="drift"><path d="M60 260 Q40 160 160 170 Q220 90 320 150 Q420 120 420 220 Q440 300 340 300 L120 300 Q50 300 60 260Z" fill="#546e7a" stroke="${O}" stroke-width="6"/></g>
<g class="rock"><rect x="60" y="1000" width="960" height="260" rx="40" fill="#a8693c" stroke="${O}" stroke-width="7"/><path d="M60 1060 L1020 1060" stroke="#7a4a2a" stroke-width="10"/>
${at(250, 1080, .8, sailor('hips', { mouth: 'frown', brows: 'angry', px: 10 }))}${at(470, 1080, .78, sailor('point', { mouth: 'shout', brows: 'angry', px: 10 }))}
${at(800, 1080, .85, col('point', { mouth: 'grin', brows: 'up', px: 8, py: -8 }))}</g>${P.sea(1250, '#2f5f8a')}
${P.label(380, 470, 'ফিরে চলো!', { fill: '#2f5f9e', fs: 62, delay: .3, rot: -5 })}`) });

scenes.push({ narration: 'অবশেষে ১২ অক্টোবর দূরে দেখা গেল ডাঙা! নতুন এক দ্বীপে নামলেন তাঁরা।', caption: 'ডাঙা! ডাঙা!', highlight: ['ডাঙা!'],
  svg: svg(`${SEA_CSS}.land{transform-origin:50% 100%;animation:land 2s ease-out .2s both}@keyframes land{from{transform:scaleY(0)}to{transform:scaleY(1)}}`,
    `${dayBg('s5')}<circle cx="880" cy="300" r="90" fill="#ffd54f" stroke="${O}" stroke-width="6"/>
<g class="land"><path d="M260 900 Q420 760 640 790 Q840 760 1000 900Z" fill="#f2d38a" stroke="${O}" stroke-width="6"/><path d="M340 860 Q520 740 720 780 Q860 800 920 860Z" fill="#7cb342" stroke="${O}" stroke-width="6"/>${P.palm(520, 830, .7)}${P.palm(700, 820, .85)}${P.palm(850, 860, .6)}</g>
${P.sea(900, '#3c8fdc', 'wv2')}<g class="ship">${P.ship(380, 1230, .95)}</g>${P.sea(1250, '#2f7fd1')}
<g transform="translate(330,520)"><g class="pop" style="animation-delay:.8s">${P.burst(0, 0, 150, '#ffd23f')}<text x="0" y="25" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#e63946">ডাঙা!</text></g></g>
${P.label(760, 1080, '১২ অক্টোবর', { fill: '#2f7fd1', fs: 54, delay: .4 })}`) });

scenes.push({ narration: 'কলম্বাস ভাবলেন, তিনি ভারতে পৌঁছে গেছেন। আসলে তিনি পৌঁছেছিলেন এক নতুন মহাদেশে, আমেরিকায়!', caption: 'নতুন মহাদেশ আমেরিকা!', highlight: ['আমেরিকা!'],
  svg: svg(`.route{stroke-dasharray:24 20;animation:dash 1s linear infinite}@keyframes dash{to{stroke-dashoffset:-44}}.glow{transform-origin:center;animation:glow 1.2s ease-in-out infinite}@keyframes glow{50%{opacity:.4}}`,
    `<rect width="1080" height="1920" fill="#f3e2b8"/><rect x="40" y="140" width="1000" height="1100" rx="30" fill="#bfe3f5" stroke="${O}" stroke-width="8"/>
<path class="glow" d="M140 330 Q260 260 380 330 Q420 430 330 520 Q300 600 360 700 Q420 820 380 960 Q330 1060 280 1000 Q250 860 220 760 Q180 640 160 520 Q120 420 140 330Z" fill="#ffd23f" opacity=".5"/>
<path d="M140 330 Q260 260 380 330 Q420 430 330 520 Q300 600 360 700 Q420 820 380 960 Q330 1060 280 1000 Q250 860 220 760 Q180 640 160 520 Q120 420 140 330Z" fill="#8bc34a" stroke="${O}" stroke-width="6"/>
<path d="M700 300 Q800 260 900 300 Q960 380 900 460 Q840 500 780 470 Q720 420 700 300Z M760 520 Q860 500 920 580 Q940 760 860 880 Q800 920 780 820 Q740 680 760 520Z" fill="#c5b07a" stroke="${O}" stroke-width="6"/>
<path class="route" d="M760 420 Q560 380 360 560" fill="none" stroke="#e63946" stroke-width="10"/>${P.ship(560, 470, .22)}
<text x="260" y="650" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="60" fill="#2e7d32" stroke="#fff" stroke-width="8" paint-order="stroke">আমেরিকা</text>
<text x="830" y="640" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="50" fill="#7a4a2a" stroke="#fff" stroke-width="8" paint-order="stroke">ইউরোপ</text>
${P.label(560, 1090, 'নতুন মহাদেশ!', { fill: '#e63946', fs: 70, delay: .8, rot: -4 })}`) });

scenes.push({ narration: 'পরে আরও তিনবার তিনি সমুদ্রে গেছেন। কলম্বাসের এই সাহসী যাত্রা পৃথিবীর মানচিত্রটাই বদলে দিল।', caption: 'বদলে গেল মানচিত্র', highlight: ['মানচিত্র'],
  svg: svg(`${SEA_CSS}.flag{transform-origin:0% 50%;animation:flag 1s ease-in-out infinite alternate}@keyframes flag{to{transform:skewY(-6deg) scaleX(.92)}}`,
    `<defs>${P.grad('sun', '#ffb74d', '#ffe0b2')}</defs><rect width="1080" height="1920" fill="url(#sun)"/><circle cx="540" cy="760" r="170" fill="#ff8a65" opacity=".85"/>
${P.sea(820, '#4a6fb5', 'wv2')}<g class="ship">${P.ship(870, 820, .4)}</g>
<path d="M-20 1000 Q300 920 640 980 Q900 940 1100 1000 L1100 1920 L-20 1920Z" fill="#f2d38a" stroke="${O}" stroke-width="6"/>${P.palm(130, 1180, .9)}
<rect x="790" y="700" width="16" height="560" fill="#6b3f22" stroke="${O}" stroke-width="4"/><g class="flag"><path d="M806 710 L1010 740 L806 860Z" fill="#c62828" stroke="${O}" stroke-width="5"/><circle cx="870" cy="780" r="22" fill="#ffd23f"/></g>
${at(500, 1290, 1.05, col('cheer', { mouth: 'grin', brows: 'up' }), 'breathe')}`) });

scenes.push({ narration: 'পরের পর্বে থাকছে কোপারনিকাসের গল্প, যিনি বলেছিলেন পৃথিবী নয়, সূর্যই কেন্দ্রে। ফলো করে সঙ্গেই থাকুন!', caption: 'সূর্যই কেন্দ্রে!', highlight: ['সূর্যই'],
  svg: svg(`.o1{transform-box:view-box;transform-origin:540px 760px;animation:orb 6s linear infinite}.o2{transform-box:view-box;transform-origin:540px 760px;animation:orb 10s linear infinite}@keyframes orb{to{transform:rotate(360deg)}}
.btn{transform-origin:center;animation:btn 1s ease-in-out infinite}@keyframes btn{50%{transform:scale(1.07)}}`,
    `<defs>${P.grad('dk', '#0b1340', '#24124a')}</defs><rect width="1080" height="1920" fill="url(#dk)"/>${P.stars(46)}
<text class="pop" x="540" y="330" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="120" fill="#ffd23f" stroke="${O}" stroke-width="6" paint-order="stroke">পরের পর্বে...</text>
<circle cx="540" cy="760" r="200" fill="none" stroke="#9fb4ff" stroke-width="4" stroke-dasharray="14 14"/><circle cx="540" cy="760" r="330" fill="none" stroke="#9fb4ff" stroke-width="4" stroke-dasharray="14 14"/>
<circle cx="540" cy="760" r="100" fill="#ffd23f" stroke="${O}" stroke-width="7"/>
<g class="o1"><circle cx="740" cy="760" r="38" fill="#3fa9f5" stroke="${O}" stroke-width="6"/></g><g class="o2"><circle cx="210" cy="760" r="30" fill="#ff7043" stroke="${O}" stroke-width="6"/></g>
<g transform="translate(540,1220)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'কলম্বাসের সমুদ্রযাত্রা', series: 'আবিষ্কারের গল্প · পর্ব ২', episode: 2, scientist: 'কলম্বাস',
  summary: 'পশ্চিমে জাহাজ চালিয়ে ভারতে যেতে চেয়েছিলেন কলম্বাস। কিন্তু পৌঁছে গেলেন এমন এক মহাদেশে, যার কথা ইউরোপের কেউ জানতই না!' }, scenes);
console.log('ep02:', scenes.length, 'scenes');
