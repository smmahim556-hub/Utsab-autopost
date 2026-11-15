// আবিষ্কারের গল্প · পর্ব ১৭: মাইকেল ফ্যারাডে. Our own retelling (facts checked: born 1791 in London to a poor family;
// apprenticed to a bookbinder and read the books he bound; attended Humphry Davy's lectures and became his assistant at the
// Royal Institution in 1813; showed electromagnetic rotation in 1821 (idea of the electric motor); discovered
// electromagnetic induction in 1831; gave Christmas lectures for young people at the Royal Institution).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const geo = person({ skin: '#f1c28f', hair: 'short', hairColor: '#6d4c41', outfit: 'coat', cloth: '#283593', legsColor: '#263238' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#2e7d32', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const bench = (y = 1330) => `<rect y="${y}" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/><rect x="120" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/><rect x="930" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/>`;
const books = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">${[['#c62828', 0], ['#1565c0', -60], ['#2e7d32', -120], ['#f9a825', -180]].map(([c, dy]) => `<rect x="-120" y="${dy - 55}" width="240" height="55" rx="6" fill="${c}" stroke="${O}" stroke-width="5"/>`).join('')}</g>`;
const coil = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-150" y="-60" width="300" height="120" rx="20" fill="#ffcc80" stroke="${O}" stroke-width="6"/>${[-110, -70, -30, 10, 50, 90].map(cx => `<ellipse cx="${cx + 10}" cy="0" rx="14" ry="62" fill="none" stroke="#bf360c" stroke-width="7"/>`).join('')}</g>`;
const magnet = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-70 -90 L-70 30 A70 70 0 0 0 70 30 L70 -90 L30 -90 L30 30 A30 30 0 0 1 -30 30 L-30 -90 Z" fill="#e53935" stroke="${O}" stroke-width="6"/><rect x="-70" y="-90" width="40" height="40" fill="#eceff1" stroke="${O}" stroke-width="5"/><rect x="30" y="-90" width="40" height="40" fill="#eceff1" stroke="${O}" stroke-width="5"/></g>`;
const meter = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-90" y="-70" width="180" height="130" rx="14" fill="#fafafa" stroke="${O}" stroke-width="6"/><path d="M-60 30 A70 70 0 0 1 60 30" fill="none" stroke="${O}" stroke-width="4"/><line x1="0" y1="30" x2="40" y2="-30" stroke="#e53935" stroke-width="7" stroke-linecap="round"/></g>`;
const spark = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><polygon points="0,-60 18,-14 60,-14 26,12 40,58 0,30 -40,58 -26,12 -60,-14 -18,-14" fill="#ffeb3b" stroke="${O}" stroke-width="5"/></g>`;

const scenes = [];
// 1
scenes.push({ narration: 'মাইকেল ফ্যারাডে জন্মেছিলেন ১৭৯১ সালে, লন্ডনের এক গরিব পরিবারে। স্কুলে বেশিদিন পড়ার সুযোগ পাননি।',
  svg: svg(``, `<defs>${P.grad('fa1', '#cfe9ff', '#f4fbff')}</defs><rect width="1080" height="1920" fill="url(#fa1)"/>
<rect y="1150" width="1080" height="770" fill="#b0bec5" stroke="${O}" stroke-width="6"/>
${at(540, 1420, 1, kid('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'লন্ডন, ১৭৯১', { fill: '#37474f', rot: -3, delay: .3, fs: 66 })}`) });
// 2
scenes.push({ narration: 'চৌদ্দ বছর বয়সে তিনি এক বই বাঁধাইয়ের দোকানে কাজ নিলেন। যে বই বাঁধতেন, সেগুলোই মন দিয়ে পড়তেন।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff8e1"/>
${bench(1330)}
<g transform="translate(400,1330)">${books(0, 0, 1)}</g>
${at(820, 1460, .8, kid('think', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'বই বাঁধাইয়ের দোকান', { fill: '#4e342e', rot: -2, delay: .2, fs: 56 })}`) });
// 3
scenes.push({ narration: 'বিজ্ঞানী হামফ্রি ডেভির বক্তৃতা শুনে তিনি মুগ্ধ হলেন। ১৮১৩ সালে রয়্যাল ইনস্টিটিউশনে ডেভির সহকারী হলেন।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#ede7f6"/>
<rect x="160" y="300" width="760" height="460" rx="20" fill="#ffffff" stroke="${O}" stroke-width="8"/>
${T(540, 480, 'রয়্যাল ইনস্টিটিউশন', 60, '#4527a0')}
${T(540, 620, '১৮১৩', 100, '#e65100')}
${at(540, 1460, .9, geo('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}`) });
// 4
scenes.push({ narration: 'ফ্যারাডে বিদ্যুৎ আর চুম্বক নিয়ে পরীক্ষা শুরু করলেন। ১৮২১ সালে দেখালেন, বিদ্যুৎ দিয়ে কোনো কিছুকে ঘোরানো যায়। এখান থেকেই এলো মোটরের ধারণা।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e3f2fd"/>
${bench(1330)}
<g transform="translate(420,1180)">${magnet(0, 0, 1.2)}</g>
<path d="M600 1060 A90 90 0 1 1 600 1061" fill="none" stroke="#1565c0" stroke-width="8" stroke-dasharray="20 12"/>
${at(880, 1460, .8, geo('point', { mouth: 'smile', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'ঘুরছে বিদ্যুতে, ১৮২১', { fill: '#0d47a1', rot: -2, delay: .2, fs: 56 })}`) });
// 5
scenes.push({ narration: 'তারপর তিনি উল্টো প্রশ্ন করলেন: চুম্বক দিয়ে কি বিদ্যুৎ বানানো যায়? তারের কুণ্ডলীর ভেতর চুম্বক নাড়িয়ে তিনি পরীক্ষা চালালেন।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff3e0"/>
${bench(1330)}
<g transform="translate(420,1220)">${coil(0, 0, 1)}</g>
<g transform="translate(420,980)">${magnet(0, 0, .8)}</g>
${at(860, 1460, .8, geo('think', { mouth: 'hmm', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'চুম্বক থেকে বিদ্যুৎ?', { fill: '#bf360c', rot: -2, delay: .2, fs: 60 })}`) });
// 6
scenes.push({ narration: '১৮৩১ সালে মিলল উত্তর। চুম্বক নড়লেই তারে বিদ্যুৎ তৈরি হয়। এর নাম তড়িৎচুম্বকীয় আবেশ।',
  svg: svg(``, `<defs>${P.grad('fa6', '#fff3c4', '#fffdf2')}</defs><rect width="1080" height="1920" fill="url(#fa6)"/>
${bench(1330)}
<g transform="translate(330,1220)">${coil(0, 0, .9)}</g>
<g transform="translate(720,1200)">${meter(0, 0, 1.1)}</g>
<g transform="translate(540,900)">${spark(0, 0, 1.4)}</g>
${P.label(540, 230, 'বিদ্যুৎ এলো, ১৮৩১', { fill: '#8d6e00', rot: -2, delay: .2, fs: 60 })}`) });
// 7
scenes.push({ narration: 'আজ বিদ্যুৎ কেন্দ্রের জেনারেটর এই নিয়মেই কাজ করে। ঘরে ঘরে যে বিদ্যুৎ আসে, তার পেছনে আছে ফ্যারাডের আবিষ্কার।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8f5e9"/>
<rect y="1150" width="1080" height="770" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${[[160, 1150], [360, 1100], [560, 1150], [760, 1100], [940, 1150]].map(([x, y]) => `<g transform="translate(${x},${y})"><rect x="-6" y="-200" width="12" height="200" fill="#6d4c41" stroke="${O}" stroke-width="3"/><line x1="-90" y1="-180" x2="90" y2="-180" stroke="#455a64" stroke-width="5"/></g>`).join('')}
${at(540, 1460, .85, kid('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${T(540, 700, 'ঘরে ঘরে বিদ্যুৎ', 80, '#1b5e20', 'class="pop"')}`) });
// 8
scenes.push({ narration: 'ফ্যারাডে ছোটদের জন্য বড়দিনে বিজ্ঞানের বক্তৃতা দিতেন। সহজ কথায় পরীক্ষা দেখিয়ে তিনি বিজ্ঞানকে সবার কাছে পৌঁছে দিতেন।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fce4ec"/>
${bench(1330)}
<g transform="translate(540,1200)">${coil(0, 0, .7)}</g>
${at(230, 1460, .8, geo('point', { mouth: 'smile', brows: 'up', px: 4 }), '')}${at(870, 1460, .75, kid('cheer', { mouth: 'grin', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'ছোটদের বিজ্ঞান', { fill: '#880e4f', rot: -2, delay: .2, fs: 66 })}`) });
// 9
scenes.push({ narration: 'বই বাঁধাইয়ের দোকান থেকে উঠে এসে যিনি বদলে দিলেন বিদ্যুতের দুনিয়া, সেই মাইকেল ফ্যারাডের গল্প এখানেই শেষ।', caption: 'মাইকেল ফ্যারাডের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('fa9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#fa9)"/>${P.rays(540, 620, '#ffc93c', .32)}
<g transform="translate(540,500)">${spark(0, 0, 1.3)}</g>
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 300, 'ফ্যারাডের গল্প শেষ', { fill: '#33691e', rot: -2, delay: .2, fs: 62 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'চুম্বক থেকে বিদ্যুৎ', series: 'আবিষ্কারের গল্প · পর্ব ১৭', episode: 17, scientist: 'মাইকেল ফ্যারাডে',
  summary: 'বই বাঁধাইয়ের দোকানে কাজ করা গরিব ঘরের ছেলে মাইকেল ফ্যারাডে দেখালেন, চুম্বক নাড়ালেই বিদ্যুৎ তৈরি হয়।' }, scenes);
console.log('ep17:', scenes.length, 'scenes');
