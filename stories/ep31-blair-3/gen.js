// সাফল্যের গল্প · পর্ব ৭: ব্লেয়ার, প্রথমবার মায়ের গলা শোনা. From 'Think and Grow Rich' (owner's book), retold in our own words.
// As the book tells it: years later, in college, Blair was sent an electrical hearing aid to try; he put it on and, for the first
// time, heard his mother's voice clearly; he wrote to the maker, was invited to New York, and went on to work with them, using
// his experience to bring hope to many hard-of-hearing people. Hill's point: the 'handicap' became the means of his success.
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const mom = person({ skin: '#f6cfa6', hair: 'long', hairColor: '#5d4037', outfit: 'tunic', cloth: '#ad1457', legsColor: '#4e342e' });
const hill = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#757575', outfit: 'coat', cloth: '#37474f', legsColor: '#263238' });
const blair = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#6d4c41', outfit: 'coat', cloth: '#2e7d32', legsColor: '#37474f', noEars: true }); // born without ears
const man = person({ skin: '#e0ac69', hair: 'short', hairColor: '#212121', outfit: 'coat', cloth: '#455a64', legsColor: '#263238' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}">${t}</text>`;
const floor = (c = '#bcaaa4') => `<rect x="-800" y="1330" width="2680" height="590" fill="${c}" stroke="${O}" stroke-width="6"/>`;
const wall = (c, id) => `<defs>${P.grad(id, c, '#ffffff')}</defs><rect x="-800" width="2680" height="1920" fill="url(#${id})"/>`;
const box = (x, y) => `<g transform="translate(${x},${y})"><rect x="-130" y="-100" width="260" height="100" fill="#d7a86e" stroke="${O}" stroke-width="6"/><path d="M-130 -100 L-100 -140 L100 -140 L130 -100" fill="#e6bf8a" stroke="${O}" stroke-width="6"/><rect x="-20" y="-100" width="40" height="100" fill="#c62828"/></g>`;
// a small hearing aid: receiver at the head + cord + battery box (drawn at the person's head position)
const aid = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><circle cx="-84" cy="-640" r="20" fill="#424242" stroke="${O}" stroke-width="5"/><path d="M-84 -620 Q-140 -560 -90 -470" stroke="#424242" stroke-width="7" fill="none"/><rect x="-120" y="-480" width="60" height="44" rx="8" fill="#616161" stroke="${O}" stroke-width="5"/></g>`;
const waves = (x, y) => `<g class="sway">${[0, 1, 2].map(i => `<path d="M${x + i * 40} ${y - 50 - i * 25} Q${x + 30 + i * 40} ${y} ${x + i * 40} ${y + 50 + i * 25}" stroke="#ad1457" stroke-width="10" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
const heart = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M0 30 C-60 -20 -40 -70 0 -40 C40 -70 60 -20 0 30Z" fill="#e63946" stroke="${O}" stroke-width="5"/></g>`;
const city = `<defs>${P.grad('ny', '#bbdefb', '#e3f2fd')}</defs><rect x="-800" width="2680" height="1920" fill="url(#ny)"/>${[[-780, 260, 900], [-500, 240, 1100], [-240, 260, 820], [40, 220, 1200], [280, 260, 960], [560, 240, 1150], [820, 260, 880], [1100, 240, 1050], [1360, 260, 920], [1640, 240, 1000]].map(([x, w, h], i) => `<rect x="${x}" y="${1330 - h}" width="${w}" height="${h}" fill="${['#90a4ae', '#78909c', '#b0bec5'][i % 3]}" stroke="${O}" stroke-width="6"/>${Array.from({ length: Math.floor(h / 120) }, (_, j) => `<rect x="${x + 40}" y="${1330 - h + 40 + j * 120}" width="${w - 80}" height="56" fill="#fff9c4" stroke="${O}" stroke-width="3"/>`).join('')}`).join('')}${floor('#9e9e9e')}`;

const scenes = [];
scenes.push({ narration: 'বছর কেটে গেল। কান ছাড়া জন্মানো সেই ব্লেয়ার এখন কলেজে পড়ে।',
  svg: svg(``, `${wall('#e8eaf6', 'd1')}${floor('#9fa8da')}
${at(540, 1460, .9, blair('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'কলেজে ব্লেয়ার', { fill: '#283593', rot: -3, delay: .3, fs: 72 })}`) });
scenes.push({ narration: 'একদিন তার কাছে এল একটা পার্সেল। ভেতরে শোনার একটা নতুন যন্ত্র, পরখ করে দেখার জন্য।',
  svg: svg(``, `${wall('#fff8e1', 'd2')}${floor('#bcaaa4')}
<g class="pop">${box(330, 1330)}</g>${at(720, 1460, .85, blair('point', { mouth: 'o', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'শোনার যন্ত্র', { fill: '#e65100', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'অনেকবার আশা ভেঙেছে, তাই একটু দ্বিধা নিয়েই সে যন্ত্রটা পরল।',
  svg: svg(``, `${wall('#eceff1', 'd3')}${floor('#b0bec5')}
${at(540, 1460, .95, blair('think', { mouth: 'hmm', brows: 'think', px: 0 }), '')}${aid(540, 1460, .95)}
${P.label(540, 230, 'একটু দ্বিধা', { fill: '#455a64', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'ঠিক তখন পাশের ঘর থেকে মা ডাকলেন। আর ব্লেয়ার স্পষ্ট শুনতে পেল মায়ের গলা!',
  svg: svg(``, `${wall('#fce4ec', 'd4')}${floor('#bcaaa4')}
${at(300, 1460, .9, mom('offer', { mouth: 'o', brows: 'up', px: 6 }), '')}${waves(450, 820)}${at(780, 1460, .9, blair('stand', { mouth: 'o', brows: 'up', px: -6 }), '')}${aid(780, 1460, .9)}
${P.label(540, 230, 'মায়ের গলা!', { fill: '#ad1457', rot: -2, delay: .2, fs: 78 })}`) });
scenes.push({ narration: 'জীবনে প্রথমবার এত পরিষ্কার শোনা। খুশিতে তার চোখে জল এসে গেল।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff3e0"/>${P.rays(540, 700, '#ffcc80', .35)}${floor('#d7ccc8')}
${at(540, 1460, .95, blair('cheer', { mouth: 'grin', brows: 'up', px: 0 }), '')}${aid(540, 1460, .95)}<g class="pop">${heart(330, 640, 1.2)}${heart(760, 600, 1)}</g>
${P.label(540, 230, 'প্রথমবার শোনা', { fill: '#e65100', rot: -2, delay: .2, fs: 72 })}`) });
scenes.push({ narration: 'সে যন্ত্রের নির্মাতাদের চিঠি লিখল। তারা তাকে ডেকে নিল নিউইয়র্কে।',
  svg: svg(``, `${city}
${at(330, 1460, .85, man('offer', { mouth: 'smile', brows: 'normal', px: 6 }), '')}${at(760, 1460, .85, blair('offer', { mouth: 'smile', brows: 'up', px: -6 }), '')}
${P.label(540, 160, 'নিউইয়র্কে ডাক', { fill: '#1565c0', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'তারপর ব্লেয়ার কাজ শুরু করল তাদের সাথে, তার মতো কম শোনা হাজারো মানুষের কাছে আশার খবর পৌঁছে দিতে।',
  svg: svg(``, `${city}
${at(540, 1460, .85, blair('point', { mouth: 'grin', brows: 'up', px: 0 }), '')}${at(200, 1460, .6, man('stand', { mouth: 'smile', brows: 'up', px: 4 }), '')}${at(880, 1460, .6, mom('stand', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 160, 'হাজারো মানুষের আশা', { fill: '#2e7d32', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'বাবা যে কথা ছোটবেলা থেকে বলতেন, তা-ই সত্যি হলো। যা নেই, সেটাই হয়ে উঠল তার শক্তি।',
  svg: svg(``, `${wall('#e3f2fd', 'd8')}${floor('#bcaaa4')}
${at(340, 1440, .9, hill('stand', { mouth: 'smile', brows: 'up', px: 4 }), '')}${at(740, 1460, .9, blair('stand', { mouth: 'smile', brows: 'normal', px: -4 }), '')}
<g transform="translate(540,640)"><rect x="-330" y="-90" width="660" height="180" rx="20" fill="#fff" stroke="${O}" stroke-width="7"/>${T(0, 30, 'ঘাটতিই শক্তি', 78, '#1565c0')}</g>
${P.label(540, 230, 'বাবার কথাই সত্যি', { fill: '#1565c0', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: 'মন থেকে কিছু চাইলে, অসম্ভবও পথ ছেড়ে দেয়। ব্লেয়ারের গল্প এখানেই শেষ।', caption: 'ব্লেয়ারের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('d9', '#ffe0a3', '#fff7e0')}</defs><rect x="-800" width="2680" height="1920" fill="url(#d9)"/>${P.rays(540, 520, '#ffc93c', .32)}
${at(540, 1420, 1, blair('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}${aid(540, 1420, 1)}
${P.label(540, 200, 'ব্লেয়ারের গল্প শেষ', { fill: '#4e342e', rot: -2, delay: .2, fs: 64 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'প্রথমবার মায়ের গলা', series: 'সাফল্যের গল্প · পর্ব ৭', episode: 7, scientist: 'ব্লেয়ার হিল', tags: ['#অনুপ্রেরণা', '#সাফল্য'],
  summary: 'কান ছাড়া জন্মানো ব্লেয়ার একদিন জীবনে প্রথমবার স্পষ্ট শুনল মায়ের গলা। তারপর সেই অভিজ্ঞতাই হলো তার কাজের শক্তি।' }, scenes);
console.log('ep31:', scenes.length, 'scenes');
