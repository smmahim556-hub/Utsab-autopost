// আবিষ্কারের গল্প · পর্ব ১৩: রোনাল্ড রস. Our own retelling (facts checked: born 1857 at Almora, India; worked on malaria
// in India; on 20 August 1897 at Secunderabad he found malaria parasites in the stomach of a mosquito; Nobel Prize in
// Physiology or Medicine 1902; 20 August is observed as World Mosquito Day).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const geo = person({ skin: '#e8b98e', hair: 'short', hairColor: '#5d4037', outfit: 'coat', cloth: '#455a64', legsColor: '#263238' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#2e7d32', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const bench = (y = 1330) => `<rect y="${y}" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/><rect x="120" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/><rect x="930" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/>`;
const mos = (x, y, s = 1, inner = '') => `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="60" ry="22" fill="#37474f" stroke="${O}" stroke-width="5"/><ellipse cx="-70" cy="-6" rx="46" ry="16" fill="none" stroke="#90a4ae" stroke-width="4" transform="rotate(-20 -70 -6)"/><ellipse cx="-70" cy="10" rx="46" ry="16" fill="none" stroke="#90a4ae" stroke-width="4" transform="rotate(15 -70 10)"/><line x1="60" y1="0" x2="110" y2="-6" stroke="${O}" stroke-width="6"/><path d="M-20 14 L-30 50 M0 16 L0 52 M18 14 L30 50" stroke="${O}" stroke-width="5" fill="none"/>${inner}</g>`;
const scope = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-60" y="60" width="120" height="16" rx="6" fill="#455a64" stroke="${O}" stroke-width="5"/><path d="M-10 60 L-10 -40 Q-10 -70 20 -70" fill="none" stroke="#455a64" stroke-width="14" stroke-linecap="round"/><rect x="10" y="-100" width="18" height="40" fill="#607d8b" stroke="${O}" stroke-width="4"/><rect x="-40" y="0" width="70" height="20" fill="#37474f" stroke="${O}" stroke-width="4"/></g>`;
const net = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-170 120 Q-170 -150 0 -150 Q170 -150 170 120 Z" fill="#ffffff" fill-opacity=".45" stroke="${O}" stroke-width="6"/><path d="M-120 120 L-120 -70 M-60 120 L-60 -115 M0 120 L0 -130 M60 120 L60 -115 M120 120 L120 -70 M-170 0 L170 0 M-150 60 L150 60" stroke="${O}" stroke-width="2.5" opacity=".6"/></g>`;

const scenes = [];
// 1
scenes.push({ narration: 'রোনাল্ড রস জন্মেছিলেন ১৮৫৭ সালে, ভারতের আলমোড়ায়। বড় হয়ে তিনি ডাক্তার হলেন।',
  svg: svg(``, `<defs>${P.grad('ro1', '#cfe9ff', '#f4fbff')}</defs><rect width="1080" height="1920" fill="url(#ro1)"/>
<rect y="1150" width="1080" height="770" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'আলমোড়া, ১৮৫৭', { fill: '#33691e', rot: -3, delay: .3, fs: 66 })}`) });
// 2
scenes.push({ narration: 'তখনকার দিনে ম্যালেরিয়া ছিল ভয়ংকর রোগ। মানুষ ভাবত, খারাপ বাতাস থেকে এই জ্বর হয়।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#dcedc8"/>
<ellipse cx="260" cy="1000" rx="320" ry="90" fill="#c5e1a5" opacity=".8"/><ellipse cx="800" cy="1120" rx="360" ry="110" fill="#aed581" opacity=".7"/>
${bench(1330)}
${mos(780, 900, 1.2, '')}
${at(300, 1460, .85, geo('think', { mouth: 'hmm', brows: 'up', px: 4 }), '')}
${P.label(540, 230, 'খারাপ বাতাস?', { fill: '#33691e', rot: -2, delay: .2, fs: 66 })}`) });
// 3
scenes.push({ narration: 'রস বুঝতে চাইলেন, রোগটা আসলে কোথা থেকে আসে। ভারতে কাজ করতে করতেই তিনি গবেষণা চালিয়ে গেলেন।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e3f2fd"/>
${bench(1330)}
<g transform="translate(540,1180)">${scope(0, 0, 1.6)}</g>
${at(860, 1460, .8, geo('stand', { mouth: 'smile', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'গবেষণাগার', { fill: '#1565c0', rot: -2, delay: .2, fs: 66 })}`) });
// 4
scenes.push({ narration: 'অনেক দিনের ধৈর্যের কাজ। মশা ধরা, তাদের খাওয়ানো, আর প্রতিটি ধাপ খাতায় লিখে রাখা।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#f3e5f5"/>
${bench(1330)}
${net(540, 1150, 1.4)}
${at(230, 1460, .8, geo('think', { mouth: 'smile', brows: 'up', px: 6 }), '')}${at(860, 1460, .75, kid('stand', { mouth: 'o', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'মশা নিয়ে গবেষণা', { fill: '#4a148c', rot: -2, delay: .2, fs: 62 })}`) });
// 5
scenes.push({ narration: 'ঊনবিংশ শতকের শেষ। ১৮৯৭ সালের ২০ আগস্ট, হায়দরাবাদের সেকান্দরাবাদে রস একটি মশার পেট খুলে দেখলেন।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff8e1"/>
${bench(1330)}
<g transform="translate(540,1180)">${scope(0, 0, 1.6)}</g>
${at(900, 1460, .8, geo('stand', { mouth: 'grin', brows: 'up', px: -6 }), '')}
${P.label(540, 230, '২০ আগস্ট, ১৮৯৭', { fill: '#e65100', rot: -2, delay: .2, fs: 66 })}`) });
// 6
scenes.push({ narration: 'মশার পেটের ভেতর তিনি খুঁজে পেলেন ম্যালেরিয়ার পরজীবী। এটাই ছিল বড় প্রমাণ।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8f5e9"/>
<circle cx="540" cy="640" r="330" fill="#ffffff" stroke="${O}" stroke-width="8"/>
${mos(540, 640, 2.6, `<circle cx="-10" cy="0" r="10" fill="#e53935"/><circle cx="8" cy="-6" r="9" fill="#e53935"/>`)}
${at(540, 1460, .85, geo('stand', { mouth: 'smile', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'মশার পেটে পরজীবী', { fill: '#1b5e20', rot: -2, delay: .2, fs: 60 })}`) });
// 7
scenes.push({ narration: 'এই আবিষ্কার প্রমাণ করল, মশার কামড়েই ম্যালেরিয়া ছড়ায়। এজন্য ১৯০২ সালে রোনাল্ড রস পেলেন নোবেল পুরস্কার।',
  svg: svg(``, `<defs>${P.grad('ro7', '#fff3c4', '#fffdf2')}</defs><rect width="1080" height="1920" fill="url(#ro7)"/>
<circle cx="540" cy="820" r="230" fill="#ffc93c" stroke="${O}" stroke-width="8"/>
<circle cx="540" cy="820" r="180" fill="none" stroke="#fff3c4" stroke-width="6"/>
${T(540, 850, '১৯০২', 110, '#5d4037')}
${at(540, 1460, .9, geo('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${P.label(540, 300, 'নোবেল পুরস্কার', { fill: '#8d6e00', rot: -2, delay: .2, fs: 66 })}`) });
// 8
scenes.push({ narration: 'আজ ২০ আগস্ট পালিত হয় বিশ্ব মশা দিবস। এই দিনটি মনে করিয়ে দেয়, ছোট একটা মশাও বড় রোগ ছড়াতে পারে।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e1f5fe"/>
<rect x="240" y="500" width="600" height="420" rx="30" fill="#ffffff" stroke="${O}" stroke-width="8"/>
<rect x="240" y="500" width="600" height="110" rx="30" fill="#e53935" stroke="${O}" stroke-width="8"/>
${T(540, 580, '২০ আগস্ট', 70, '#ffffff')}
${T(540, 760, 'বিশ্ব মশা দিবস', 72, '#01579b', 'class="pop"')}
${mos(540, 1000, 1.4, '')}
${at(230, 1460, .8, geo('think', { mouth: 'smile', brows: 'up', px: 4 }), '')}${at(870, 1460, .75, kid('stand', { mouth: 'grin', brows: 'up', px: -4 }), '')}`) });
// 9
scenes.push({ narration: 'মশারি ব্যবহার করুন, জমা পানি রাখবেন না। রোনাল্ড রসের গল্প এখানেই শেষ।', caption: 'রোনাল্ড রসের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('ro9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#ro9)"/>${P.rays(540, 620, '#ffc93c', .32)}
${net(540, 760, 1.2)}
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 300, 'রোনাল্ড রসের গল্প শেষ', { fill: '#33691e', rot: -2, delay: .2, fs: 62 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'মশার কামড়', series: 'আবিষ্কারের গল্প · পর্ব ১৩', episode: 13, scientist: 'রোনাল্ড রস',
  summary: 'ম্যালেরিয়ার আসল কারণ খুঁজতে রোনাল্ড রস মশার পেট পরীক্ষা করলেন, আর প্রমাণ করলেন মশার কামড়েই এই রোগ ছড়ায়।' }, scenes);
console.log('ep13:', scenes.length, 'scenes');
