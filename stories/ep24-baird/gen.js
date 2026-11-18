// আবিষ্কারের গল্প · পর্ব ২৪: জন লোগি বেয়ার্ড. Our own retelling (facts checked: born 1888 in Helensburgh, Scotland; often ill;
// in 1923 in Hastings built a television apparatus from scrap: a tea chest, a biscuit tin, a hatbox, bicycle-lamp lenses,
// darning needles and sealing wax, with a spinning Nipkow disc; on 2 October 1925 got the first clear moving image of a
// ventriloquist's dummy's head ('Stooky Bill'), then of office boy William Taynton; on 26 January 1926 showed it to members
// of the Royal Institution in his attic in Soho, London; 1928 sent television pictures across the Atlantic and showed colour
// television; died 1946).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const bai = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#8d6e63', outfit: 'coat', cloth: '#37474f', legsColor: '#263238' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#8d6e63', outfit: 'tunic', cloth: '#43a047', legsColor: '#4e342e' });
const boy = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#3e2723', outfit: 'tunic', cloth: '#1e88e5', legsColor: '#37474f' });
const guest = person({ skin: '#f1c28f', hair: 'bald', hairColor: '#9e9e9e', outfit: 'coat', cloth: '#5d4037', legsColor: '#263238' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}">${t}</text>`;
const disc = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><circle r="150" fill="#cfd8dc" stroke="${O}" stroke-width="8"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, r = 120 - i * 7; return `<circle cx="${(Math.cos(a) * r).toFixed(0)}" cy="${(Math.sin(a) * r).toFixed(0)}" r="9" fill="${O}"/>`; }).join('')}<circle r="16" fill="#e53935" stroke="${O}" stroke-width="4"/></g>`;
const tv = (x, y, s, inner) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-200" y="-150" width="400" height="300" rx="24" fill="#6d4c41" stroke="${O}" stroke-width="8"/><rect x="-160" y="-115" width="250" height="230" rx="14" fill="#ffb74d" stroke="${O}" stroke-width="5"/><g transform="translate(-35,0)">${inner}</g><circle cx="140" cy="-50" r="18" fill="#ffca28" stroke="${O}" stroke-width="4"/><circle cx="140" cy="20" r="18" fill="#ffca28" stroke="${O}" stroke-width="4"/></g>`;
const dummy = `<circle r="60" fill="#ffe0b2" stroke="${O}" stroke-width="5"/><circle cx="-20" cy="-10" r="8" fill="${O}"/><circle cx="20" cy="-10" r="8" fill="${O}"/><path d="M-22 25 Q0 40 22 25" stroke="${O}" stroke-width="5" fill="none"/>`;

const scenes = [];
scenes.push({ narration: 'জন লোগি বেয়ার্ড জন্মেছিলেন ১৮৮৮ সালে, স্কটল্যান্ডের হেলেন্সবার্গে। প্রায়ই অসুখে ভুগতেন, কিন্তু যন্ত্র বানানোর নেশা ছিল ছোটবেলা থেকেই।',
  svg: svg(``, `<defs>${P.grad('gb1', '#d6ecff', '#f5fbff')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gb1)"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
<g transform="translate(260,1220)"><rect x="-90" y="-60" width="180" height="120" rx="10" fill="#8d6e63" stroke="${O}" stroke-width="6"/><circle cx="-30" cy="0" r="22" fill="#ffca28" stroke="${O}" stroke-width="4"/><path d="M40 -60 L40 -200" stroke="${O}" stroke-width="7"/></g>
${at(680, 1460, .8, kid('point', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'হেলেন্সবার্গ, ১৮৮৮', { fill: '#0d47a1', rot: -3, delay: .3, fs: 62 })}`) });
scenes.push({ narration: 'তাঁর স্বপ্ন ছিল, রেডিওতে যেমন দূরের কথা শোনা যায়, তেমনি দূরের ছবিও চলন্ত অবস্থায় দেখা যাবে।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff8e1"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#ffe082" stroke="${O}" stroke-width="6"/>
${tv(540, 600, 1, `<g transform="scale(.9)">${dummy}</g>`)}
${at(540, 1460, .85, bai('think', { mouth: 'hmm', brows: 'think', px: 0 }), '')}
${P.label(540, 230, 'ছবিও যাবে দূরে?', { fill: '#e65100', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: '১৯২৩ সালে হেস্টিংসে, টাকা ছিল না। তাই চায়ের বাক্স, বিস্কুটের টিন, টুপির বাক্স, সাইকেলের বাতির লেন্স আর সেলাইয়ের সুই দিয়েই বানালেন যন্ত্র।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#d7ccc8"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
<rect x="120" y="1080" width="240" height="250" fill="#a1887f" stroke="${O}" stroke-width="6"/>${T(240, 1225, 'চা', 60, '#4e342e')}
<rect x="380" y="1180" width="160" height="150" rx="10" fill="#b0bec5" stroke="${O}" stroke-width="6"/>
<ellipse cx="250" cy="1050" rx="110" ry="30" fill="#5d4037" stroke="${O}" stroke-width="5"/>
<circle cx="460" cy="1130" r="40" fill="#e1f5fe" stroke="${O}" stroke-width="6"/>
${at(800, 1460, .8, bai('point', { mouth: 'grin', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'ফেলনা জিনিসে যন্ত্র', { fill: '#4e342e', rot: -2, delay: .2, fs: 62 })}`) });
scenes.push({ narration: 'যন্ত্রের মূল ছিল ফুটো করা একটা ঘুরন্ত চাকতি। চাকতি ঘুরলে ছবিটা সারি সারি আলোর বিন্দুতে ভাগ হয়ে যেত, আর অন্য প্রান্তে আবার জোড়া লাগত।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#e8eaf6"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#9fa8da" stroke="${O}" stroke-width="6"/>
<g class="spin" style="transform-origin:540px 520px;transform-box:view-box">${disc(540, 520, 1.2)}</g>
${at(540, 1460, .8, bai('stand', { mouth: 'smile', brows: 'up', px: 0 }), '')}
${P.label(540, 200, 'ঘুরন্ত চাকতি', { fill: '#283593', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: '১৯২৫ সালের ২ অক্টোবর। পর্দায় ফুটে উঠল একটা কাঠের পুতুলের মুখ, স্পষ্ট আর চলন্ত! আনন্দে তিনি নিচতলা থেকে এক অফিস-বালককে ডেকে আনলেন।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff3e0"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#bcaaa4" stroke="${O}" stroke-width="6"/>
${tv(540, 600, 1.1, `<g transform="scale(.9)">${dummy}</g>`)}
${at(300, 1460, .75, bai('point', { mouth: 'shout', brows: 'up', px: 4 }), '')}${at(800, 1460, .65, boy('stand', { mouth: 'o', brows: 'up', px: -4 }), '')}
${P.label(540, 200, '২ অক্টোবর, ১৯২৫', { fill: '#bf360c', rot: -2, delay: .2, fs: 64 })}`) });
scenes.push({ narration: 'সেই বালক উইলিয়াম টেইনটন হলেন টেলিভিশনে দেখা প্রথম জীবন্ত মানুষ। পর্দায় তাঁর মুখ নড়ছে, হাসছে!',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#e1f5fe"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#90caf9" stroke="${O}" stroke-width="6"/>
${tv(540, 640, 1.3, `<circle r="60" fill="#f6cfa6" stroke="${O}" stroke-width="5"/><path d="M-60 -10 Q-55 -70 0 -70 Q55 -70 60 -10 Q30 -45 -60 -10 Z" fill="#3e2723"/><circle cx="-20" cy="0" r="7" fill="${O}"/><circle cx="20" cy="0" r="7" fill="${O}"/><path d="M-22 25 Q0 42 22 25" stroke="${O}" stroke-width="5" fill="none"/>`)}
${P.label(540, 200, 'প্রথম মানুষ পর্দায়', { fill: '#01579b', rot: -2, delay: .2, fs: 64 })}`) });
scenes.push({ narration: '১৯২৬ সালের জানুয়ারিতে লন্ডনের ছোট্ট চিলেকোঠায় বিজ্ঞানীদের ডেকে দেখালেন তাঁর টেলিভিশন। সবাই অবাক!',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#d7ccc8"/>
<path d="M-800 560 L540 300 L1880 560" fill="none" stroke="${O}" stroke-width="8"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${tv(540, 760, .8, `<g transform="scale(.8)">${dummy}</g>`)}
${at(170, 1460, .62, guest('stand', { mouth: 'o', brows: 'up', px: 4 }), '')}${at(910, 1460, .62, guest('point', { mouth: 'grin', brows: 'up', px: -4 }), '')}
${P.label(540, 200, 'লন্ডন, ১৯২৬', { fill: '#4e342e', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: '১৯২৮ সালে তিনি আটলান্টিক মহাসাগর পেরিয়ে লন্ডন থেকে নিউ ইয়র্কে টেলিভিশনের ছবি পাঠালেন। একই বছরে দেখালেন রঙিন টেলিভিশনও।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#e3f2fd"/>
<rect x="-800" y="1100" width="2680" height="820" fill="#4fc3f7" stroke="${O}" stroke-width="6"/>
${tv(170, 820, .55, `<g transform="scale(.8)">${dummy}</g>`)}${tv(910, 820, .55, `<g transform="scale(.8)">${dummy}</g>`)}
<path d="M200 620 Q540 330 880 620" fill="none" stroke="#e53935" stroke-width="10" stroke-dasharray="24 18"/>
${T(540, 720, '১৯২৮', 90, '#e53935')}
${P.label(540, 230, 'আটলান্টিক পার', { fill: '#01579b', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'আজ ঘরে ঘরে টেলিভিশন, ফোনে ফোনে ভিডিও। সবকিছুর শুরু বিস্কুটের টিন আর ফেলনা জিনিসে গড়া এক স্বপ্ন থেকে। বেয়ার্ডের গল্প এখানেই শেষ।', caption: 'বেয়ার্ডের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('gb9', '#ffe0a3', '#fff7e0')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gb9)"/>${P.rays(540, 520, '#ffc93c', .32)}
${tv(540, 470, .7, `<g transform="scale(.8)">${dummy}</g>`)}
${at(540, 1420, 1, bai('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 200, 'বেয়ার্ডের গল্প শেষ', { fill: '#4e342e', rot: -2, delay: .2, fs: 62 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'টিনের বাক্সে টেলিভিশন', series: 'আবিষ্কারের গল্প · পর্ব ২৪', episode: 24, scientist: 'জন লোগি বেয়ার্ড',
  summary: 'চায়ের বাক্স, বিস্কুটের টিন আর সাইকেলের লেন্স দিয়ে প্রথম চলন্ত ছবি দূরে পাঠালেন জন লোগি বেয়ার্ড।' }, scenes);
console.log('ep24:', scenes.length, 'scenes');
