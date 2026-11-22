// সাফল্যের গল্প · পর্ব ৬: ব্লেয়ার, খবরের কাগজের ব্যবসা. From 'Think and Grow Rich' (owner's book), retold in our own words.
// As the book tells it: the father kept telling Blair his handicap would be an asset, e.g. people would be kind to a boy with no
// ears and buy his papers; Blair wanted to sell newspapers; his mother did not agree; he slipped out with six cents borrowed from
// the household cook, bought papers, sold them, bought more, and kept going until evening, coming home with his first profit.
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const hill = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4e342e', outfit: 'coat', cloth: '#37474f', legsColor: '#263238' });
const mom = person({ skin: '#f6cfa6', hair: 'long', hairColor: '#5d4037', outfit: 'tunic', cloth: '#ad1457', legsColor: '#4e342e' });
const cook = person({ skin: '#e0ac69', hair: 'short', hairColor: '#212121', outfit: 'tunic', cloth: '#eceff1', legsColor: '#455a64' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#6d4c41', outfit: 'tunic', cloth: '#43a047', legsColor: '#4e342e', noEars: true }); // Blair was born without ears
const man = person({ skin: '#f1c28f', hair: 'bald', hairColor: '#757575', outfit: 'coat', cloth: '#6d4c41', legsColor: '#37474f' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const floor = (c = '#bcaaa4') => `<rect x="-800" y="1330" width="2680" height="590" fill="${c}" stroke="${O}" stroke-width="6"/>`;
const wall = (c, id) => `<defs>${P.grad(id, c, '#ffffff')}</defs><rect x="-800" width="2680" height="1920" fill="url(#${id})"/>`;
const paper = (x, y, s = 1, r = 0) => `<g transform="translate(${x},${y}) rotate(${r}) scale(${s})"><rect x="-90" y="-60" width="180" height="120" fill="#fafafa" stroke="${O}" stroke-width="5"/><rect x="-74" y="-46" width="148" height="22" fill="#424242"/>${[0, 1, 2].map(i => `<rect x="-74" y="${-12 + i * 20}" width="${i === 2 ? 90 : 148}" height="8" fill="#9e9e9e"/>`).join('')}</g>`;
const stack = (x, y) => `<g>${[0, 1, 2, 3].map(i => paper(x, y - i * 22, 1, (i % 2 ? 3 : -3))).join('')}</g>`;
const coin = (x, y, r = 30) => `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#ffca28" stroke="${O}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="${r * .62}" fill="none" stroke="#f57f17" stroke-width="4"/></g>`;
const town = `<defs>${P.grad('tw', '#bbdefb', '#e3f2fd')}</defs><rect x="-800" width="2680" height="1920" fill="url(#tw)"/>${[[-780, 300, 640, '#90a4ae'], [-440, 300, 820, '#a1887f'], [-100, 280, 700, '#b0bec5'], [220, 300, 880, '#8d6e63'], [560, 300, 720, '#90a4ae'], [900, 300, 800, '#a1887f'], [1240, 300, 680, '#b0bec5'], [1580, 300, 860, '#8d6e63']].map(([x, w, h, c]) => `<rect x="${x}" y="${1330 - h}" width="${w}" height="${h}" fill="${c}" stroke="${O}" stroke-width="6"/>${Array.from({ length: Math.floor(h / 160) }, (_, i) => `<rect x="${x + 50}" y="${1330 - h + 50 + i * 160}" width="${w - 100}" height="80" fill="#fff9c4" stroke="${O}" stroke-width="4"/>`).join('')}`).join('')}${floor('#9e9e9e')}`;

const scenes = [];
scenes.push({ narration: 'ব্লেয়ার বড় হচ্ছিল। বাবা তাকে বারবার বলতেন, তোমার যা নেই, সেটাই একদিন তোমার সুবিধা হবে।',
  svg: svg(``, `${wall('#e8f5e9', 'c1')}${floor('#a1887f')}
${at(330, 1460, .9, hill('offer', { mouth: 'smile', brows: 'normal', px: 4 }), '')}${at(760, 1460, .75, kid('stand', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'বাবার কথা', { fill: '#2e7d32', rot: -3, delay: .3, fs: 74 })}`) });
scenes.push({ narration: 'যেমন, তুমি কাগজ বিক্রি করতে গেলে মানুষ তোমাকে বেশি ভালোবাসবে, তোমার কাছ থেকেই কিনবে।',
  svg: svg(``, `${town}
${at(540, 1460, .8, kid('hold', { mouth: 'grin', brows: 'up', px: 0 }), '')}${paper(540, 1120, 1.1)}
${P.label(540, 230, 'সবাই কিনবে', { fill: '#1565c0', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'একদিন ব্লেয়ার বলল, আমি খবরের কাগজ বিক্রি করব। কিন্তু মা রাজি হলেন না।',
  svg: svg(``, `${wall('#fce4ec', 'c3')}${floor('#bcaaa4')}
${at(320, 1460, .9, mom('stand', { mouth: 'frown', brows: 'think', px: 4 }), '')}${at(760, 1460, .75, kid('point', { mouth: 'shout', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'মা রাজি নন', { fill: '#ad1457', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'ব্লেয়ার দমে গেল না। বাড়ির রাঁধুনির কাছ থেকে ধার নিল মাত্র ছয় সেন্ট।',
  svg: svg(``, `${wall('#fff8e1', 'c4')}${floor('#a1887f')}
${at(320, 1460, .9, cook('offer', { mouth: 'smile', brows: 'up', px: 4 }), '')}${at(740, 1460, .75, kid('hold', { mouth: 'grin', brows: 'up', px: -4 }), '')}
<g class="pop">${coin(460, 920)}${coin(520, 900)}${coin(580, 920)}</g>
${P.label(540, 230, 'ছয় সেন্ট ধার', { fill: '#e65100', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'সেই টাকায় কিনল কয়েকটা খবরের কাগজ, আর নেমে পড়ল রাস্তায়।',
  svg: svg(``, `${town}
${stack(300, 1300)}${at(660, 1460, .8, kid('hold', { mouth: 'grin', brows: 'normal', px: -4 }), '')}${paper(660, 1120, 1)}
${P.label(540, 230, 'রাস্তায় নামল', { fill: '#37474f', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'কাগজ বিক্রি হয়ে গেল। সেই টাকায় আবার কাগজ কিনল, আবার বিক্রি করল। চলল সারাদিন।',
  svg: svg(``, `${town}
${at(330, 1460, .85, man('offer', { mouth: 'smile', brows: 'normal', px: 4 }), '')}${at(740, 1460, .8, kid('offer', { mouth: 'grin', brows: 'up', px: -4 }), '')}${paper(560, 1060, .9, -8)}
<g class="sway">${coin(420, 820, 26)}${coin(640, 760, 26)}</g>
${P.label(540, 230, 'কিনে আবার বেচা', { fill: '#2e7d32', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'সন্ধ্যায় ধার শোধ করে সে বাড়ি ফিরল, পকেটে নিজের আয়ের প্রথম টাকা।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#ffccbc"/>${P.rays(540, 700, '#ffab91', .3)}${floor('#a1887f')}
${at(540, 1460, .85, kid('cheer', { mouth: 'grin', brows: 'up', px: 0 }), '')}<g class="pop">${coin(380, 760)}${coin(540, 700)}${coin(700, 760)}</g>
${P.label(540, 230, 'প্রথম আয়', { fill: '#bf360c', rot: -2, delay: .2, fs: 76 })}`) });
scenes.push({ narration: 'বাবা বুঝলেন, যে ছেলেকে সবাই অসহায় ভেবেছিল, তার মনের জোর কারও চেয়ে কম নয়।',
  svg: svg(``, `${wall('#e3f2fd', 'c8')}${floor('#bcaaa4')}
${at(360, 1440, .9, hill('stand', { mouth: 'smile', brows: 'up', px: 4 }), '')}${at(740, 1460, .75, kid('stand', { mouth: 'smile', brows: 'normal', px: -4 }), '')}
${P.label(540, 230, 'মনের জোর', { fill: '#1565c0', rot: -2, delay: .2, fs: 76 })}`) });
scenes.push({ narration: 'নিজেকে ছোট না ভাবলে কোনো ঘাটতিই পথ আটকাতে পারে না। ব্লেয়ারের গল্প চলবে পরের পর্বে।', caption: 'ব্লেয়ারের গল্প চলবে',
  svg: svg(``, `<defs>${P.grad('c9', '#ffe0a3', '#fff7e0')}</defs><rect x="-800" width="2680" height="1920" fill="url(#c9)"/>${P.rays(540, 520, '#ffc93c', .32)}
${at(540, 1420, .95, kid('cheer', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${P.label(540, 200, 'চলবে পরের পর্বে', { fill: '#4e342e', rot: -2, delay: .2, fs: 64 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'ছয় সেন্টের ব্যবসা', series: 'সাফল্যের গল্প · পর্ব ৬', episode: 6, scientist: 'ব্লেয়ার হিল', tags: ['#অনুপ্রেরণা', '#সাফল্য'],
  summary: 'মা রাজি নন, পকেটে টাকা নেই। ছয় সেন্ট ধার করে খবরের কাগজ বিক্রিতে নেমে পড়ল কান ছাড়া জন্মানো ব্লেয়ার।' }, scenes);
console.log('ep30:', scenes.length, 'scenes');
