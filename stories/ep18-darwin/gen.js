// আবিষ্কারের গল্প · পর্ব ১৮: চার্লস ডারউইন. Our own retelling (facts checked: born 1809 in Shrewsbury, England; sailed on
// HMS Beagle 1831-1836 round the world; studied animals of the Galapagos Islands, including finches with different beaks
// and giant tortoises; published On the Origin of Species in 1859, explaining evolution by natural selection).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const geo = person({ skin: '#f1c28f', hair: 'short', hairColor: '#795548', outfit: 'coat', cloth: '#33691e', legsColor: '#263238' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#1565c0', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const ship = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-220 0 L220 0 L170 80 L-170 80 Z" fill="#6d4c41" stroke="${O}" stroke-width="6"/><rect x="-8" y="-300" width="16" height="300" fill="#5d4037" stroke="${O}" stroke-width="4"/><path d="M10 -280 L150 -60 L10 -60 Z" fill="#fafafa" stroke="${O}" stroke-width="5"/><path d="M-10 -260 L-140 -70 L-10 -70 Z" fill="#eeeeee" stroke="${O}" stroke-width="5"/></g>`;
const bird = (x, y, s = 1, beak = 'short') => `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="60" ry="42" fill="#8d6e63" stroke="${O}" stroke-width="5"/><circle cx="45" cy="-35" r="30" fill="#a1887f" stroke="${O}" stroke-width="5"/><circle cx="55" cy="-42" r="5" fill="${O}"/>${beak === 'long' ? `<path d="M72 -38 L140 -30 L72 -26 Z" fill="#ffb300" stroke="${O}" stroke-width="4"/>` : `<path d="M72 -46 L104 -34 L72 -20 Z" fill="#ffb300" stroke="${O}" stroke-width="4"/>`}<path d="M-20 40 L-25 70 M10 40 L10 70" stroke="${O}" stroke-width="5"/></g>`;
const tortoise = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="150" ry="90" fill="#8d6e63" stroke="${O}" stroke-width="6"/><path d="M-90 -40 L-30 -70 L30 -70 L90 -40 M-110 10 L110 10" stroke="${O}" stroke-width="4" fill="none"/><ellipse cx="170" cy="20" rx="45" ry="32" fill="#a1887f" stroke="${O}" stroke-width="5"/><rect x="-110" y="60" width="40" height="50" fill="#a1887f" stroke="${O}" stroke-width="4"/><rect x="70" y="60" width="40" height="50" fill="#a1887f" stroke="${O}" stroke-width="4"/></g>`;
const book = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-150" y="-200" width="300" height="400" rx="14" fill="#2e7d32" stroke="${O}" stroke-width="7"/><rect x="-120" y="-120" width="240" height="140" fill="#fffde7" stroke="${O}" stroke-width="4"/></g>`;

const scenes = [];
// 1
scenes.push({ narration: 'চার্লস ডারউইন জন্মেছিলেন ১৮০৯ সালে, ইংল্যান্ডের শ্রুসবেরিতে। ছোটবেলা থেকেই পোকামাকড়, পাথর আর গাছপালা জমাতে ভালোবাসতেন।',
  svg: svg(``, `<defs>${P.grad('dw1', '#cfe9ff', '#f4fbff')}</defs><rect width="1080" height="1920" fill="url(#dw1)"/>
<rect y="1150" width="1080" height="770" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
${at(540, 1420, 1, kid('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'ইংল্যান্ড, ১৮০৯', { fill: '#33691e', rot: -3, delay: .3, fs: 66 })}`) });
// 2
scenes.push({ narration: '১৮৩১ সালে তরুণ ডারউইন বিগল নামের এক জাহাজে চড়ে পৃথিবী ঘুরতে বের হলেন। সেই যাত্রা চলেছিল প্রায় পাঁচ বছর।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e1f5fe"/>
<rect y="1100" width="1080" height="820" fill="#4fc3f7" stroke="${O}" stroke-width="6"/>
<path d="M0 1180 Q135 1140 270 1180 T540 1180 T810 1180 T1080 1180" fill="none" stroke="#ffffff" stroke-width="8"/>
${ship(540, 1080, 1.3)}
${P.label(540, 230, 'বিগল জাহাজ, ১৮৩১', { fill: '#01579b', rot: -2, delay: .2, fs: 62 })}`) });
// 3
scenes.push({ narration: 'যাত্রায় তিনি নানা দেশের প্রাণী, গাছ আর পাথর দেখলেন, নোট লিখলেন, নমুনা জমালেন।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff8e1"/>
<rect y="1330" width="1080" height="590" fill="#d7ccc8" stroke="${O}" stroke-width="6"/>
<rect x="160" y="1100" width="260" height="200" rx="10" fill="#ffffff" stroke="${O}" stroke-width="6"/>
<path d="M190 1150 L390 1150 M190 1200 L390 1200 M190 1250 L340 1250" stroke="#90a4ae" stroke-width="6"/>
${at(760, 1460, .85, geo('think', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'নোট আর নমুনা', { fill: '#4e342e', rot: -2, delay: .2, fs: 66 })}`) });
// 4
scenes.push({ narration: 'গালাপাগোস দ্বীপে তিনি দেখলেন বিশাল কচ্ছপ। আর দেখলেন একই রকম পাখি, কিন্তু একেক দ্বীপে ঠোঁট একেক রকম।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8f5e9"/>
<rect y="1330" width="1080" height="590" fill="#c5e1a5" stroke="${O}" stroke-width="6"/>
${tortoise(540, 1230, 1.2)}
${bird(260, 820, 1.1, 'short')}${bird(780, 820, 1.1, 'long')}
${P.label(540, 230, 'গালাপাগোস দ্বীপ', { fill: '#1b5e20', rot: -2, delay: .2, fs: 66 })}`) });
// 5
scenes.push({ narration: 'তিনি ভাবলেন, যে পাখির ঠোঁট খাবার খাওয়ার জন্য বেশি উপযোগী, সেই পাখি টিকে থাকে আর বংশ বাড়ায়।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fffde7"/>
<rect y="1330" width="1080" height="590" fill="#dce775" stroke="${O}" stroke-width="6"/>
${bird(380, 1000, 1.4, 'long')}
<g transform="translate(700,1020)"><circle r="22" fill="#6d4c41"/><circle cx="40" cy="20" r="18" fill="#6d4c41"/><circle cx="-30" cy="30" r="16" fill="#6d4c41"/></g>
${at(860, 1460, .8, geo('think', { mouth: 'hmm', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'যে উপযোগী, সে টেকে', { fill: '#827717', rot: -2, delay: .2, fs: 58 })}`) });
// 6
scenes.push({ narration: 'বিশ বছরেরও বেশি সময় ধরে তিনি প্রমাণ জোগাড় করলেন, ভাবলেন, লিখলেন।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#efebe9"/>
<rect y="1330" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/>
${[[300, 1290], [420, 1290], [540, 1290]].map(([x, y]) => `<rect x="${x - 50}" y="${y - 220}" width="100" height="220" fill="#ffffff" stroke="${O}" stroke-width="5"/>`).join('')}
${at(820, 1460, .85, geo('stand', { mouth: 'smile', brows: 'normal', px: -4 }), '')}
${P.label(540, 230, 'বছরের পর বছর', { fill: '#4e342e', rot: -2, delay: .2, fs: 66 })}`) });
// 7
scenes.push({ narration: '১৮৫৯ সালে প্রকাশিত হলো তাঁর বিখ্যাত বই, অন দ্য অরিজিন অব স্পিসিস। এতে তিনি প্রাকৃতিক নির্বাচনের ধারণা তুলে ধরলেন।',
  svg: svg(``, `<defs>${P.grad('dw7', '#fff3c4', '#fffdf2')}</defs><rect width="1080" height="1920" fill="url(#dw7)"/>
${book(540, 560, 1)}
${T(540, 500, 'Origin of', 44, '#3b2a20')}${T(540, 560, 'Species', 44, '#3b2a20')}
${T(540, 310, '১৮৫৯', 90, '#e65100')}
${at(540, 1460, .9, geo('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}`) });
// 8
scenes.push({ narration: 'তাঁর ধারণা নিয়ে তখন অনেক তর্ক হয়েছিল। তবে আজ জীববিজ্ঞানের মূল ভিত্তিগুলোর একটি এই বিবর্তনের ধারণা।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e0f2f1"/>
<rect y="1330" width="1080" height="590" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${bird(540, 880, 1.2, 'short')}
${at(230, 1460, .8, geo('point', { mouth: 'smile', brows: 'up', px: 4 }), '')}${at(870, 1460, .75, kid('think', { mouth: 'o', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'বিবর্তনের ধারণা', { fill: '#004d40', rot: -2, delay: .2, fs: 66 })}`) });
// 9
scenes.push({ narration: 'পাখির ঠোঁট থেকে প্রাণের ইতিহাস বোঝার পথ। চার্লস ডারউইনের গল্প এখানেই শেষ।', caption: 'চার্লস ডারউইনের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('dw9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#dw9)"/>${P.rays(540, 620, '#ffc93c', .32)}
${bird(540, 560, 1.1, 'short')}
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 300, 'ডারউইনের গল্প শেষ', { fill: '#33691e', rot: -2, delay: .2, fs: 62 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'বিগলের যাত্রা', series: 'আবিষ্কারের গল্প · পর্ব ১৮', episode: 18, scientist: 'চার্লস ডারউইন',
  summary: 'বিগল জাহাজে পৃথিবী ঘুরে চার্লস ডারউইন দেখলেন প্রাণীরা পরিবেশের সঙ্গে বদলায়, আর দিলেন প্রাকৃতিক নির্বাচনের ধারণা।' }, scenes);
console.log('ep18:', scenes.length, 'scenes');
