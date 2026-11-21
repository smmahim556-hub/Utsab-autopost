// সাফল্যের গল্প · পর্ব ৪: মার্শাল ফিল্ড. From 'Think and Grow Rich' (owner's book), own words. As the book tells it: after a great
// fire in Chicago the State Street merchants watched their stores burn; they met and decided to leave Chicago and start elsewhere,
// all except one: Marshall Field pointed at the ruins of his store and said that on that very spot he would build the world's
// greatest store, no matter how many times it burned; the store was built and still stood as a monument decades later.
// (Historical: the Great Chicago Fire of 1871.)
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const field = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#9e9e9e', outfit: 'coat', cloth: '#263238', legsColor: '#212121' });
const m1 = person({ skin: '#f1c28f', hair: 'short', hairColor: '#5d4037', outfit: 'coat', cloth: '#6d4c41', legsColor: '#37474f' });
const m2 = person({ skin: '#e0ac69', hair: 'bald', hairColor: '#757575', outfit: 'coat', cloth: '#455a64', legsColor: '#263238' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}">${t}</text>`;
const shop = (x, w, h, c) => `<g transform="translate(${x},1330)"><rect x="0" y="${-h}" width="${w}" height="${h}" fill="${c}" stroke="${O}" stroke-width="6"/>${Array.from({ length: Math.floor(h / 130) }, (_, i) => `<rect x="30" y="${-h + 40 + i * 130}" width="${w - 60}" height="70" fill="#fff59d" stroke="${O}" stroke-width="4"/>`).join('')}</g>`;
const street = [[-800, 300, 700, '#a1887f'], [-480, 320, 860, '#8d6e63'], [-140, 320, 760, '#bcaaa4'], [200, 360, 900, '#8d6e63'], [580, 320, 780, '#a1887f'], [920, 320, 840, '#bcaaa4'], [1260, 320, 720, '#8d6e63'], [1600, 300, 800, '#a1887f']];
const flames = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M0 0 Q-80 -120 -20 -260 Q0 -160 40 -200 Q30 -300 90 -360 Q130 -200 80 -100 Q120 -60 100 0 Z" fill="#ff7043" stroke="${O}" stroke-width="5"/><path d="M20 -10 Q-10 -90 30 -170 Q60 -100 70 -10 Z" fill="#ffca28"/></g>`;
const ruins = `<rect x="-800" width="2680" height="1920" fill="#9e9e9e"/>${street.map(([x, w, h]) => `<path d="M${x} 1330 L${x} ${1330 - h * .35} L${x + w * .3} ${1330 - h * .45} L${x + w * .55} ${1330 - h * .25} L${x + w * .8} ${1330 - h * .4} L${x + w} ${1330 - h * .2} L${x + w} 1330 Z" fill="#616161" stroke="${O}" stroke-width="6"/>`).join('')}
<rect x="-800" y="1330" width="2680" height="590" fill="#757575" stroke="${O}" stroke-width="6"/>`;

const scenes = [];
scenes.push({ narration: 'আমেরিকার শিকাগো শহরের স্টেট স্ট্রিট। সারি সারি দোকান, ব্যবসায়ীদের জমজমাট ব্যবসা।',
  svg: svg(``, `<defs>${P.grad('gm1', '#d6ecff', '#f5fbff')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gm1)"/>${street.map(([x, w, h, c]) => shop(x, w, h, c)).join('')}
<rect x="-800" y="1330" width="2680" height="590" fill="#bdbdbd" stroke="${O}" stroke-width="6"/>
${P.label(540, 230, 'শিকাগো, স্টেট স্ট্রিট', { fill: '#0d47a1', rot: -3, delay: .3, fs: 62 })}`) });
scenes.push({ narration: 'তারপর একদিন ভয়াবহ আগুন। চোখের সামনে পুড়ে ছাই হয়ে গেল একের পর এক দোকান।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#ffccbc"/>${street.map(([x, w, h, c]) => shop(x, w, h, c)).join('')}
<g class="sway">${street.map(([x, w, h]) => flames(x + w / 2 - 30, 1330 - h + 40, 1.2)).join('')}</g>
<rect x="-800" y="1330" width="2680" height="590" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${P.label(540, 230, 'ভয়াবহ আগুন', { fill: '#bf360c', rot: -2, delay: .2, fs: 72 })}`) });
scenes.push({ narration: 'পরদিন ব্যবসায়ীরা দাঁড়িয়ে রইলেন ধ্বংসস্তূপের সামনে। কারও মুখে কথা নেই।',
  svg: svg(``, `${ruins}
${at(220, 1460, .7, m1('stand', { mouth: 'frown', brows: 'think', px: 4 }), '')}${at(540, 1460, .7, field('stand', { mouth: 'hmm', brows: 'normal', px: 0 }), '')}${at(860, 1460, .7, m2('stand', { mouth: 'frown', brows: 'think', px: -4 }), '')}
${P.label(540, 230, 'ধ্বংসস্তূপ', { fill: '#424242', rot: -2, delay: .2, fs: 72 })}`) });
scenes.push({ narration: 'সবাই মিলে ঠিক করলেন, এই শহরে আর নয়। অন্য কোথাও গিয়ে নতুন করে শুরু করবেন।',
  svg: svg(``, `${ruins}
<g transform="translate(540,640)"><rect x="-300" y="-80" width="600" height="160" rx="16" fill="#fff" stroke="${O}" stroke-width="7"/>${T(0, 25, 'শহর ছাড়ব!', 80, '#455a64')}</g>
${at(240, 1460, .7, m1('point', { mouth: 'frown', brows: 'angry', px: 4 }), '')}${at(840, 1460, .7, m2('point', { mouth: 'frown', brows: 'think', px: -4 }), '')}
${P.label(540, 230, 'সবাই চলে যাবে', { fill: '#455a64', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: 'শুধু একজন ছাড়া। মার্শাল ফিল্ড তাঁর পোড়া দোকানের দিকে আঙুল তুলে বললেন,',
  svg: svg(``, `${ruins}
${at(540, 1460, .9, field('point', { mouth: 'hmm', brows: 'angry', px: 0 }), '')}
${P.label(540, 230, 'শুধু একজন ছাড়া', { fill: '#263238', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: 'ঠিক এই জায়গায় আমি গড়ব পৃথিবীর সবচেয়ে বড় দোকান। যতবার পুড়ুক, ততবার গড়ব!',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff3e0"/>${P.rays(540, 700, '#ffcc80', .35)}
<rect x="-800" y="1330" width="2680" height="590" fill="#757575" stroke="${O}" stroke-width="6"/>
${at(540, 1460, .95, field('point', { mouth: 'shout', brows: 'angry', px: 0 }), '')}
${P.label(540, 230, 'আমি আবার গড়ব!', { fill: '#e65100', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'এবং তিনি সত্যিই গড়লেন। ছাইয়ের ওপর দাঁড়াল বিশাল এক দোকান।',
  svg: svg(``, `<defs>${P.grad('gm7', '#d6ecff', '#f5fbff')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gm7)"/>
<g class="pop">${shop(140, 800, 1000, '#c62828')}<rect x="140" y="270" width="800" height="90" fill="#ffca28" stroke="${O}" stroke-width="6"/>${T(540, 335, 'ফিল্ড', 64, '#b71c1c')}</g>
<rect x="-800" y="1330" width="2680" height="590" fill="#bdbdbd" stroke="${O}" stroke-width="6"/>
${P.label(540, 160, 'নতুন দোকান', { fill: '#b71c1c', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'বহু বছর পরেও সেই দোকান দাঁড়িয়ে ছিল, এক মানুষের অটল সিদ্ধান্তের স্মারক হয়ে।',
  svg: svg(``, `<defs>${P.grad('gm8', '#fff3c4', '#fffdf2')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gm8)"/>
${shop(140, 800, 1000, '#c62828')}<rect x="140" y="270" width="800" height="90" fill="#ffca28" stroke="${O}" stroke-width="6"/>${T(540, 335, 'ফিল্ড', 64, '#b71c1c')}
<rect x="-800" y="1330" width="2680" height="590" fill="#bdbdbd" stroke="${O}" stroke-width="6"/>
${at(540, 1460, .75, field('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 160, 'অটল সিদ্ধান্তের স্মারক', { fill: '#4e342e', rot: -2, delay: .2, fs: 58 })}`) });
scenes.push({ narration: 'সবাই যখন হাল ছাড়ে, তখন যে থেকে যায়, জেতে সে-ই। মার্শাল ফিল্ডের গল্প এখানেই শেষ।', caption: 'মার্শাল ফিল্ডের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('gm9', '#ffe0a3', '#fff7e0')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gm9)"/>${P.rays(540, 520, '#ffc93c', .32)}
${at(540, 1420, 1, field('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 200, 'মার্শাল ফিল্ডের গল্প শেষ', { fill: '#4e342e', rot: -2, delay: .2, fs: 56 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'ছাইয়ের ওপর নতুন দোকান', series: 'সাফল্যের গল্প · পর্ব ৪', episode: 4, scientist: 'মার্শাল ফিল্ড', tags: ['#অনুপ্রেরণা', '#সাফল্য'],
  summary: 'আগুনে সব পুড়ে গেলে সবাই শহর ছাড়ল, ছাড়লেন না শুধু মার্শাল ফিল্ড। ছাইয়ের ওপরেই গড়লেন বিশাল দোকান।' }, scenes);
console.log('ep28:', scenes.length, 'scenes');
