// সাফল্যের গল্প · পর্ব ৮: আদালতে "অজ্ঞ" হেনরি ফোর্ডের জবাব. From 'Think and Grow Rich' (owner's book), retold in our own words.
// As the book tells it: during World War I a Chicago newspaper called Henry Ford an 'ignorant pacifist'; Ford sued for libel; in
// court the paper's lawyers tried to prove him ignorant with general-knowledge questions (e.g. how many soldiers Britain sent to
// put down the rebellion in the colonies in 1776); tired of it, Ford said that if he really wanted an answer to such a question,
// he had a row of buttons on his desk and could call men who knew; so why clutter his mind with it, when he had people to supply
// any knowledge he needed? Hill's point: knowledge is power only when organised and used; knowing where to get it is enough.
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const ford = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#9e9e9e', outfit: 'coat', cloth: '#263238', legsColor: '#212121' });
const law = person({ skin: '#f1c28f', hair: 'bald', hairColor: '#757575', outfit: 'coat', cloth: '#5d4037', legsColor: '#3e2723' });
const judge = person({ skin: '#e0ac69', hair: 'short', hairColor: '#eeeeee', outfit: 'robe', cloth: '#212121', legsColor: '#212121' });
const aide = person({ skin: '#f1c28f', hair: 'short', hairColor: '#4e342e', outfit: 'coat', cloth: '#1565c0', legsColor: '#263238' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}">${t}</text>`;
const floor = (c = '#8d6e63') => `<rect x="-800" y="1330" width="2680" height="590" fill="${c}" stroke="${O}" stroke-width="6"/>`;
const court = `<rect x="-800" width="2680" height="1920" fill="#d7ccc8"/>${[-700, -350, 0, 350, 700, 1050, 1400].map(x => `<rect x="${x + 60}" y="0" width="90" height="1330" fill="#bcaaa4" stroke="${O}" stroke-width="5"/>`).join('')}${floor()}`;
const bench = `<g transform="translate(540,1330)"><rect x="-260" y="-300" width="520" height="300" fill="#6d4c41" stroke="${O}" stroke-width="7"/><rect x="-280" y="-330" width="560" height="40" fill="#8d6e63" stroke="${O}" stroke-width="6"/></g>`;
const paper = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-220" y="-150" width="440" height="300" fill="#fafafa" stroke="${O}" stroke-width="6"/><rect x="-190" y="-120" width="380" height="60" fill="#424242"/>${T(0, 40, 'অজ্ঞ ফোর্ড!', 64, '#c62828')}${[0, 1].map(i => `<rect x="-190" y="${70 + i * 26}" width="380" height="12" fill="#9e9e9e"/>`).join('')}</g>`;
const desk = `<g transform="translate(540,1330)"><rect x="-360" y="-260" width="720" height="260" fill="#795548" stroke="${O}" stroke-width="7"/><rect x="-380" y="-290" width="760" height="40" fill="#a1887f" stroke="${O}" stroke-width="6"/>${[-180, -90, 0, 90, 180].map(x => `<circle cx="${x}" cy="-310" r="26" fill="#e53935" stroke="${O}" stroke-width="5"/>`).join('')}</g>`;
const q = (x, y) => `<g class="pop">${T(x, y, '?', 140, '#5d4037')}</g>`;

const scenes = [];
scenes.push({ narration: 'প্রথম বিশ্বযুদ্ধের সময়। শিকাগোর এক পত্রিকা হেনরি ফোর্ডকে বলল, অজ্ঞ মানুষ।',
  svg: svg(``, `<defs>${P.grad('f1', '#eceff1', '#fff')}</defs><rect x="-800" width="2680" height="1920" fill="url(#f1)"/>${floor('#b0bec5')}
${paper(540, 760, 1.2)}${at(540, 1460, .7, ford('stand', { mouth: 'frown', brows: 'angry', px: 0 }), '')}
${P.label(540, 230, 'পত্রিকার খোঁচা', { fill: '#c62828', rot: -3, delay: .3, fs: 72 })}`) });
scenes.push({ narration: 'ফোর্ড মামলা করলেন। কিন্তু আদালতে পত্রিকার উকিলরা ঠিক করলেন, প্রমাণ করবেন ফোর্ড সত্যিই অজ্ঞ।',
  svg: svg(``, `${court}${at(540, 1250, .6, judge('stand', { mouth: 'hmm', brows: 'normal', px: 0 }), '')}${bench}
${at(210, 1460, .8, law('point', { mouth: 'grin', brows: 'angry', px: 6 }), '')}${at(870, 1460, .8, ford('stand', { mouth: 'hmm', brows: 'think', px: -6 }), '')}
${P.label(540, 200, 'আদালতে মামলা', { fill: '#4e342e', rot: -2, delay: .2, fs: 72 })}`) });
scenes.push({ narration: 'একের পর এক প্রশ্ন। ইতিহাসের সাল, যুদ্ধের সৈন্যসংখ্যা, নানা খুঁটিনাটি।',
  svg: svg(``, `${court}
${at(300, 1460, .85, law('point', { mouth: 'shout', brows: 'up', px: 6 }), '')}${at(800, 1460, .85, ford('think', { mouth: 'hmm', brows: 'think', px: -6 }), '')}${q(560, 700)}${q(700, 560)}${q(440, 520)}
${P.label(540, 200, 'প্রশ্নের পর প্রশ্ন', { fill: '#5d4037', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'যেমন, সতেরোশো ছিয়াত্তরে আমেরিকায় বিদ্রোহ দমাতে ব্রিটেন কত সৈন্য পাঠিয়েছিল?',
  svg: svg(``, `${court}
<g transform="translate(540,700)"><rect x="-380" y="-110" width="760" height="220" rx="24" fill="#fff" stroke="${O}" stroke-width="7"/>${T(0, -10, '১৭৭৬ সালে', 64, '#5d4037')}${T(0, 70, 'কত সৈন্য?', 70, '#c62828')}</g>
${at(540, 1460, .85, law('point', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${P.label(540, 200, 'খুঁটিনাটি প্রশ্ন', { fill: '#5d4037', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'শেষে বিরক্ত হয়ে ফোর্ড বললেন, এসব জানার দরকার হলে আমার টেবিলে একসারি বোতাম আছে।',
  svg: svg(``, `${court}
${at(540, 1460, .95, ford('point', { mouth: 'hmm', brows: 'angry', px: 0 }), '')}
${P.label(540, 200, 'ফোর্ডের জবাব', { fill: '#263238', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'একটা বোতাম টিপলেই চলে আসবে এমন মানুষ, যে এই প্রশ্নের উত্তর জানে।',
  svg: svg(``, `<defs>${P.grad('f6', '#e3f2fd', '#fff')}</defs><rect x="-800" width="2680" height="1920" fill="url(#f6)"/>${floor('#a1887f')}
${at(300, 1300, .8, ford('point', { mouth: 'smile', brows: 'normal', px: 6 }), '')}${desk}<g class="pop">${at(820, 1300, .8, aide('offer', { mouth: 'smile', brows: 'up', px: -6 }), '')}</g>
${P.label(540, 200, 'বোতাম টিপলেই উত্তর', { fill: '#1565c0', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'তাহলে মাথায় এত তথ্য বোঝাই করে রাখব কেন, যখন যে কোনো জ্ঞান এনে দেওয়ার লোক আমার আছে?',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff8e1"/>${P.rays(540, 700, '#ffe082', .35)}${floor('#a1887f')}
${at(540, 1460, .95, ford('hips', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${P.label(540, 200, 'মাথায় বোঝাই কেন?', { fill: '#e65100', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'আদালত চুপ। সবাই বুঝল, এ মানুষ অজ্ঞ নন। কোথায় জ্ঞান পাওয়া যায়, আর কীভাবে কাজে লাগাতে হয়, তিনি তা জানেন।',
  svg: svg(``, `${court}${at(540, 1250, .6, judge('stand', { mouth: 'smile', brows: 'up', px: 0 }), '')}${bench}
${at(210, 1460, .8, law('stand', { mouth: 'o', brows: 'up', px: 6 }), '')}${at(870, 1460, .8, ford('stand', { mouth: 'smile', brows: 'normal', px: -6 }), '')}
${P.label(540, 200, 'অজ্ঞ নন', { fill: '#2e7d32', rot: -2, delay: .2, fs: 76 })}`) });
scenes.push({ narration: 'সব জানা জরুরি নয়। জানতে হয় কোথায় পাওয়া যায়, আর কাজে লাগাতে হয়। ফোর্ডের গল্প এখানেই শেষ।', caption: 'ফোর্ডের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('f9', '#ffe0a3', '#fff7e0')}</defs><rect x="-800" width="2680" height="1920" fill="url(#f9)"/>${P.rays(540, 520, '#ffc93c', .32)}
${at(540, 1420, 1, ford('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 200, 'ফোর্ডের গল্প শেষ', { fill: '#4e342e', rot: -2, delay: .2, fs: 64 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'অজ্ঞ ফোর্ডের জবাব', series: 'সাফল্যের গল্প · পর্ব ৮', episode: 8, scientist: 'হেনরি ফোর্ড', tags: ['#অনুপ্রেরণা', '#সাফল্য'],
  summary: 'পত্রিকা বলল হেনরি ফোর্ড অজ্ঞ। আদালতে প্রশ্নের পর প্রশ্নের জবাবে ফোর্ড যা বললেন, তাতে সবাই চুপ।' }, scenes);
console.log('ep32:', scenes.length, 'scenes');
