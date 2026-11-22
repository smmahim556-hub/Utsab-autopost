// সাফল্যের গল্প · পর্ব ৫: কান ছাড়া জন্মানো ছেলে ব্লেয়ার (১ম অংশ: বাবার জেদ). From 'Think and Grow Rich' (owner's book), retold in
// our own words. As the book tells it: Napoleon Hill's son Blair was born without ears; the doctors said he would likely be deaf
// and mute all his life; Hill refused to accept it and resolved that the boy would hear; he planted that wish in the child,
// telling him bedtime stories in which his difference would one day be an advantage; then they found that the boy, biting the
// edge of a phonograph (Victrola) while music played, could take in the sound - the first sign that some hearing was possible.
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const hill = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4e342e', outfit: 'coat', cloth: '#37474f', legsColor: '#263238' });
const doc = person({ skin: '#f1c28f', hair: 'bald', hairColor: '#9e9e9e', outfit: 'coat', cloth: '#eceff1', legsColor: '#455a64' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#6d4c41', outfit: 'tunic', cloth: '#43a047', legsColor: '#4e342e', noEars: true }); // Blair was born without ears
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}">${t}</text>`;
const floor = (c = '#bcaaa4') => `<rect x="-800" y="1330" width="2680" height="590" fill="${c}" stroke="${O}" stroke-width="6"/>`;
const wall = (c, id) => `<defs>${P.grad(id, c, '#ffffff')}</defs><rect x="-800" width="2680" height="1920" fill="url(#${id})"/>`;
// a swaddled baby, no ears drawn
const baby = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="40" rx="120" ry="70" fill="#bbdefb" stroke="${O}" stroke-width="6"/><circle cx="-60" cy="0" r="62" fill="#f6cfa6" stroke="${O}" stroke-width="6"/>
<path d="M-82 -6 q8 -8 16 0 M-52 -6 q8 -8 16 0" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-72 22 q12 8 24 0" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-60 -62 q-10 -20 6 -26" stroke="#6d4c41" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
const bed = (x, y) => `<g transform="translate(${x},${y})"><rect x="-300" y="-160" width="600" height="160" rx="20" fill="#8d6e63" stroke="${O}" stroke-width="7"/><rect x="-300" y="-320" width="60" height="320" rx="16" fill="#6d4c41" stroke="${O}" stroke-width="7"/>
<rect x="-240" y="-210" width="520" height="70" rx="30" fill="#e3f2fd" stroke="${O}" stroke-width="6"/><ellipse cx="-170" cy="-215" rx="80" ry="40" fill="#fff" stroke="${O}" stroke-width="6"/></g>`;
const lamp = (x, y) => `<g transform="translate(${x},${y})"><rect x="-10" y="-200" width="20" height="200" fill="#5d4037" stroke="${O}" stroke-width="5"/><path d="M-80 -200 L80 -200 L50 -300 L-50 -300 Z" fill="#ffe082" stroke="${O}" stroke-width="6"/><circle cx="0" cy="-160" r="160" fill="#fff59d" opacity=".25"/></g>`;
const phono = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-200" y="-220" width="400" height="220" rx="16" fill="#8d6e63" stroke="${O}" stroke-width="7"/><ellipse cx="0" cy="-232" rx="170" ry="34" fill="#212121" stroke="${O}" stroke-width="6"/>
<path d="M120 -240 Q160 -420 60 -560 L220 -700 Q330 -560 180 -240 Z" fill="#ffc93c" stroke="${O}" stroke-width="7" stroke-linejoin="round"/></g>`;
const notes = (x, y) => `<g class="sway">${['♪', '♫', '♪'].map((n, i) => `<text x="${x + i * 90}" y="${y - (i % 2) * 70}" font-size="90" fill="#6a1b9a" font-weight="800">${n}</text>`).join('')}</g>`;

const scenes = [];
scenes.push({ narration: 'নেপোলিয়ন হিলের ঘরে জন্ম নিল এক ছেলে, নাম ব্লেয়ার। কিন্তু খুশির মধ্যেই এল বড় এক ধাক্কা।',
  svg: svg(``, `${wall('#e1f5fe', 'b1')}${floor('#cfd8dc')}
${at(330, 1460, .85, hill('hold', { mouth: 'smile', brows: 'up', px: 4 }), '')}${baby(420, 1130, .95)}
${P.label(540, 230, 'ছেলে ব্লেয়ার', { fill: '#0277bd', rot: -3, delay: .3, fs: 70 })}`) });
scenes.push({ narration: 'ছেলেটি জন্মেছে কান ছাড়াই। ডাক্তাররা বললেন, সে হয়তো সারাজীবন কিছুই শুনতে পাবে না, কথাও বলতে পারবে না।',
  svg: svg(``, `${wall('#eceff1', 'b2')}${floor('#b0bec5')}
${at(300, 1460, .85, doc('offer', { mouth: 'frown', brows: 'think', px: 4 }), '')}${at(790, 1460, .85, hill('stand', { mouth: 'o', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'কখনো শুনবে না?', { fill: '#455a64', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'হিল চুপ করে শুনলেন। তারপর মনে মনে বললেন, না, এটা আমি মেনে নেব না।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff3e0"/>${P.rays(540, 700, '#ffcc80', .3)}${floor('#a1887f')}
${at(540, 1460, .95, hill('think', { mouth: 'hmm', brows: 'angry', px: 0 }), '')}
${P.label(540, 230, 'মেনে নেব না!', { fill: '#e65100', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'তিনি ঠিক করলেন, তাঁর ছেলে শুনবে। কীভাবে, তা তিনি জানেন না। কিন্তু চাওয়াটা হবে পুরো মন দিয়ে।',
  svg: svg(``, `<defs>${P.grad('b4', '#ede7f6', '#fff')}</defs><rect x="-800" width="2680" height="1920" fill="url(#b4)"/>${floor('#9575cd')}
<g transform="translate(540,640)"><rect x="-330" y="-90" width="660" height="180" rx="20" fill="#fff" stroke="${O}" stroke-width="7"/>${T(0, 30, 'আমার ছেলে শুনবে', 72, '#4527a0')}</g>
${at(540, 1460, .85, hill('point', { mouth: 'hmm', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'বাবার জেদ', { fill: '#4527a0', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'রোজ রাতে ছেলের বিছানার পাশে বসে তিনি গল্প বলতেন। গল্পগুলো সব একটা কথাই বলত।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#1a237e"/>${P.stars(30)}<rect x="-800" y="560" width="2680" height="770" fill="#283593"/>${floor('#5d4037')}
${lamp(120, 1330)}${bed(560, 1330)}<g transform="translate(400,1110)"><circle r="56" fill="#f6cfa6" stroke="${O}" stroke-width="6"/><path d="M-20 -6 q8 -8 16 0 M14 -6 q8 -8 16 0" stroke="${O}" stroke-width="5" fill="none"/><path d="M-10 22 q12 8 24 0" stroke="${O}" stroke-width="5" fill="none"/></g>
${at(910, 1460, .8, hill('offer', { mouth: 'smile', brows: 'normal', px: -4 }), '')}
${P.label(540, 230, 'রাতের গল্প', { fill: '#283593', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'তোমার এই আলাদা হওয়াটাই একদিন হবে তোমার শক্তি। তুমি শুনবে, আর অনেক বড় হবে।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fffde7"/>${P.rays(540, 760, '#fff176', .35)}${floor('#c5e1a5')}
${at(540, 1460, .8, kid('cheer', { mouth: 'grin', brows: 'up', px: 0 }), '')}${P.cloud(250, 500, .9)}${P.cloud(840, 440, .8)}
${P.label(540, 230, 'তুমি পারবে', { fill: '#f57f17', rot: -2, delay: .2, fs: 76 })}`) });
scenes.push({ narration: 'ব্লেয়ার একটু বড় হলো। একদিন ঘরে গ্রামোফোনে গান বাজছিল।',
  svg: svg(``, `${wall('#fce4ec', 'b7')}${floor('#bcaaa4')}
${phono(300, 1330, 1)}${notes(160, 560)}${at(780, 1460, .75, kid('stand', { mouth: 'hmm', brows: 'think', px: -6 }), '')}
${P.label(540, 230, 'গ্রামোফোনে গান', { fill: '#ad1457', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'ছোট্ট ব্লেয়ার যন্ত্রটার কিনারায় দাঁত লাগিয়ে কামড়ে ধরল। আর অবাক কাণ্ড, গানের কাঁপুনি সে টের পেল!',
  svg: svg(``, `${wall('#f3e5f5', 'b8')}${floor('#bcaaa4')}
${phono(300, 1330, 1.3)}${notes(80, 460)}${P.burst(575, 1020, 34, '#ffca28')}${at(660, 1460, .75, kid('hold', { mouth: 'o', brows: 'up', px: -8 }), '')}
${P.label(540, 230, 'সে টের পেল!', { fill: '#6a1b9a', rot: -2, delay: .2, fs: 74 })}`) });
scenes.push({ narration: 'বাবার অটল বিশ্বাস প্রথম আলো দেখল। ব্লেয়ারের গল্প চলবে পরের পর্বে।', caption: 'ব্লেয়ারের গল্প চলবে',
  svg: svg(``, `<defs>${P.grad('b9', '#ffe0a3', '#fff7e0')}</defs><rect x="-800" width="2680" height="1920" fill="url(#b9)"/>${P.rays(540, 520, '#ffc93c', .32)}${floor('#d7ccc8')}
${at(380, 1440, .9, hill('stand', { mouth: 'smile', brows: 'normal', px: 4 }), '')}${at(720, 1460, .7, kid('cheer', { mouth: 'grin', brows: 'up', px: -4 }), '')}
${P.label(540, 200, 'চলবে পরের পর্বে', { fill: '#4e342e', rot: -2, delay: .2, fs: 64 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'বাবার জেদ', series: 'সাফল্যের গল্প · পর্ব ৫', episode: 5, scientist: 'ব্লেয়ার হিল', tags: ['#অনুপ্রেরণা', '#সাফল্য'],
  summary: 'কান ছাড়া জন্মানো ছেলে কখনো শুনবে না, বললেন ডাক্তাররা। বাবা নেপোলিয়ন হিল তা মেনে নিলেন না।' }, scenes);
console.log('ep29:', scenes.length, 'scenes');
