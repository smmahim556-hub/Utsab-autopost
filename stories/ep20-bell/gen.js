// আবিষ্কারের গল্প · পর্ব ২০: আলেকজান্ডার গ্রাহাম বেল. Our own retelling (facts checked: born 1847 in Edinburgh, Scotland;
// his mother was hard of hearing and his father taught speech; the family moved to Canada in 1870 and Bell taught deaf
// students in Boston; worked with assistant Thomas Watson on sending the voice over wire; patent granted 7 March 1876; on
// 10 March 1876 the first call: 'Mr. Watson, come here, I want to see you'; Bell Telephone Company founded 1877).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const bell = person({ skin: '#f1c28f', hair: 'short', hairColor: '#3e2723', outfit: 'coat', cloth: '#4e342e', legsColor: '#263238' });
const wat = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#8d6e63', outfit: 'coat', cloth: '#1565c0', legsColor: '#37474f' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#3e2723', outfit: 'coat', cloth: '#00897b', legsColor: '#4e342e' });
const mom = person({ skin: '#f1c28f', hair: 'long', hairColor: '#5d4037', outfit: 'robe', cloth: '#8e24aa', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const phone = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-90" y="-60" width="180" height="200" rx="16" fill="#795548" stroke="${O}" stroke-width="6"/><circle cx="0" cy="20" r="45" fill="#3e2723" stroke="${O}" stroke-width="5"/><path d="M-20 -60 L-20 -150 Q-20 -180 20 -180 L80 -180" fill="none" stroke="${O}" stroke-width="10"/></g>`;
const wire = (x1, x2, y) => `<path d="M${x1} ${y} Q${(x1 + x2) / 2} ${y + 120} ${x2} ${y}" fill="none" stroke="#212121" stroke-width="8"/>`;
const wave = (x, y) => `<g transform="translate(${x},${y})" stroke="#1e88e5" stroke-width="8" fill="none"><path d="M0 -40 Q30 0 0 40"/><path d="M30 -70 Q75 0 30 70"/><path d="M60 -100 Q120 0 60 100"/></g>`;
const wall = `<rect x="525" y="380" width="30" height="1000" fill="#8d6e63" stroke="${O}" stroke-width="5"/>`;

const scenes = [];
// 1
scenes.push({ narration: 'আলেকজান্ডার গ্রাহাম বেল জন্মেছিলেন ১৮৪৭ সালে, স্কটল্যান্ডের এডিনবরায়। তাঁর মা কানে কম শুনতেন, আর বাবা মানুষকে কথা বলা শেখাতেন।',
  svg: svg(``, `<defs>${P.grad('gb1', '#d6ecff', '#f5fbff')}</defs><rect width="1080" height="1920" fill="url(#gb1)"/>
<rect y="1150" width="1080" height="770" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${at(380, 1440, .9, mom('stand', { mouth: 'smile', brows: 'normal', px: 4 }), '')}${at(720, 1460, .75, kid('stand', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'এডিনবরা, ১৮৪৭', { fill: '#0d47a1', rot: -3, delay: .3, fs: 66 })}`) });
// 2
scenes.push({ narration: 'তাই ছোটবেলা থেকেই শব্দ আর কণ্ঠস্বর নিয়ে তাঁর দারুণ কৌতূহল। কীভাবে শব্দ তৈরি হয়, কীভাবে কানে পৌঁছায়।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff8e1"/>
<rect y="1330" width="1080" height="590" fill="#ffe082" stroke="${O}" stroke-width="6"/>
${at(380, 1460, .9, kid('point', { mouth: 'o', brows: 'up', px: 4 }), '')}${wave(560, 700)}
${P.label(540, 230, 'শব্দের রহস্য', { fill: '#e65100', rot: -2, delay: .2, fs: 66 })}`) });
// 3
scenes.push({ narration: 'বড় হয়ে তিনি চলে গেলেন আমেরিকায়। বোস্টনে কানে না শোনা ছাত্রছাত্রীদের কথা বলা শেখাতেন।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8f5e9"/>
<rect x="200" y="380" width="680" height="380" rx="10" fill="#2e7d32" stroke="${O}" stroke-width="8"/>
<text x="540" y="600" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="120" fill="#fff">A B C</text>
<rect y="1330" width="1080" height="590" fill="#bcaaa4" stroke="${O}" stroke-width="6"/>
${at(540, 1460, .9, bell('point', { mouth: 'smile', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'বোস্টনের শিক্ষক', { fill: '#1b5e20', rot: -2, delay: .2, fs: 66 })}`) });
// 4
scenes.push({ narration: 'রাতে তিনি সহকারী টমাস ওয়াটসনকে নিয়ে কাজ করতেন এক স্বপ্নে: তারের ভেতর দিয়ে মানুষের কণ্ঠ পাঠানো।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e3f2fd"/>
<rect y="1330" width="1080" height="590" fill="#90a4ae" stroke="${O}" stroke-width="6"/>
${phone(540, 760, 1.1)}
${at(260, 1460, .8, bell('think', { mouth: 'hmm', brows: 'up', px: 4 }), '')}${at(820, 1460, .8, wat('stand', { mouth: 'smile', brows: 'normal', px: -4 }), '')}
${P.label(540, 230, 'তারের ভেতর কণ্ঠ', { fill: '#0d47a1', rot: -2, delay: .2, fs: 66 })}`) });
// 5
scenes.push({ narration: 'শব্দ থেকে বিদ্যুতের ঢেউ, আবার বিদ্যুৎ থেকে শব্দ। বহুবার চেষ্টা, বহুবার ব্যর্থতা।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fffde7"/>
<rect y="1330" width="1080" height="590" fill="#dce775" stroke="${O}" stroke-width="6"/>
${phone(260, 520, .8)}${phone(820, 520, .8)}${wire(330, 750, 620)}
<path d="M420 640 L480 600 L520 660 L580 610 L640 660" fill="none" stroke="#fbc02d" stroke-width="10"/>
${at(540, 1460, .85, bell('think', { mouth: 'frown', brows: 'think', px: 0 }), '')}
${P.label(540, 230, 'চেষ্টা আর চেষ্টা', { fill: '#827717', rot: -2, delay: .2, fs: 66 })}`) });
// 6
scenes.push({ narration: '১৮৭৬ সালের মার্চে টেলিফোনের পেটেন্ট পেলেন বেল। এর তিন দিন পর এল সেই বিখ্যাত মুহূর্ত।',
  svg: svg(``, `<defs>${P.grad('gb6', '#fff3c4', '#fffdf2')}</defs><rect width="1080" height="1920" fill="url(#gb6)"/>
<rect x="290" y="420" width="500" height="340" rx="10" fill="#fffde7" stroke="${O}" stroke-width="6"/>
${[0, 1, 2, 3].map(i => `<rect x="340" y="${480 + i * 60}" width="${i % 2 ? 300 : 400}" height="20" fill="#bcaaa4"/>`).join('')}
<circle cx="720" cy="720" r="50" fill="#e53935" stroke="${O}" stroke-width="5"/>
${at(540, 1460, .9, bell('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'পেটেন্ট, ১৮৭৬', { fill: '#e65100', rot: -2, delay: .2, fs: 66 })}`) });
// 7
scenes.push({ narration: 'এক ঘরে বেল যন্ত্রে বললেন, ওয়াটসন, এখানে এসো, তোমাকে দরকার। পাশের ঘরে ওয়াটসন স্পষ্ট শুনলেন সেই কথা!',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e1f5fe"/>
${wall}<rect y="1330" width="1080" height="590" fill="#bcaaa4" stroke="${O}" stroke-width="6"/>
${phone(260, 600, .7)}${phone(820, 600, .7)}
${at(260, 1460, .8, bell('point', { mouth: 'shout', brows: 'up', px: 4 }), '')}${at(820, 1460, .8, wat('stand', { mouth: 'o', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'প্রথম ফোন কল', { fill: '#01579b', rot: -2, delay: .2, fs: 66 })}`) });
// 8
scenes.push({ narration: 'এক বছরের মধ্যেই তৈরি হলো বেল টেলিফোন কোম্পানি। ধীরে ধীরে শহর থেকে শহরে তার টানা হলো, দূরের মানুষ কাছে এল।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8f5e9"/>
<rect y="1330" width="1080" height="590" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${[160, 540, 920].map(x => `<rect x="${x - 12}" y="700" width="24" height="630" fill="#6d4c41" stroke="${O}" stroke-width="4"/><rect x="${x - 70}" y="720" width="140" height="18" fill="#6d4c41" stroke="${O}" stroke-width="3"/>`).join('')}
${wire(160, 540, 730)}${wire(540, 920, 730)}
${P.label(540, 230, 'শহর থেকে শহরে', { fill: '#1b5e20', rot: -2, delay: .2, fs: 66 })}`) });
// 9
scenes.push({ narration: 'আজ পকেটের মোবাইল ফোনের গল্পও শুরু সেই তারের কণ্ঠ থেকে। আলেকজান্ডার গ্রাহাম বেলের গল্প এখানেই শেষ।', caption: 'গ্রাহাম বেলের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('gb9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#gb9)"/>${P.rays(540, 470, '#ffc93c', .32)}
${phone(540, 470, .8)}
${at(540, 1420, 1, bell('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 200, 'বেলের গল্প শেষ', { fill: '#4e342e', rot: -2, delay: .2, fs: 64 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'তারের ভেতর কণ্ঠ', series: 'আবিষ্কারের গল্প · পর্ব ২০', episode: 20, scientist: 'আলেকজান্ডার গ্রাহাম বেল',
  summary: 'শব্দ আর কণ্ঠের প্রতি কৌতূহল থেকে আলেকজান্ডার গ্রাহাম বেল বানালেন টেলিফোন, তারের ভেতর দিয়ে গেল মানুষের কণ্ঠ।' }, scenes);
console.log('ep20:', scenes.length, 'scenes');
