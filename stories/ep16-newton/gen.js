// আবিষ্কারের গল্প · পর্ব ১৬: স্যার আইজ্যাক নিউটন. Our own retelling (facts checked: born 1642/43 at Woolsthorpe, Lincolnshire,
// England; laws of motion and universal gravitation published in Principia in 1687; white light splits into colours through
// a prism; built a reflecting telescope; the apple story is a traditional anecdote, told as such).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const geo = person({ skin: '#e8b98e', hair: 'short', hairColor: '#8d7b6a', outfit: 'coat', cloth: '#5d4037', legsColor: '#263238' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#2e7d32', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const bench = (y = 1330) => `<rect y="${y}" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/><rect x="120" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/><rect x="930" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/>`;
const tree = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-22" y="-240" width="44" height="240" fill="#6d4c41" stroke="${O}" stroke-width="5"/><circle cx="0" cy="-330" r="130" fill="#66bb6a" stroke="${O}" stroke-width="6"/><circle cx="-60" cy="-290" r="26" fill="#e53935" stroke="${O}" stroke-width="3"/><circle cx="50" cy="-360" r="24" fill="#e53935" stroke="${O}" stroke-width="3"/></g>`;
const apple = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><circle r="26" fill="#e53935" stroke="${O}" stroke-width="5"/><path d="M0 -26 Q6 -40 14 -38" fill="none" stroke="${O}" stroke-width="4"/></g>`;
const prism = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><polygon points="-90,60 0,-110 90,60" fill="#e1f5fe" stroke="${O}" stroke-width="6" opacity=".85"/><path d="M-160 -10 L-40 0" stroke="#ffffff" stroke-width="10"/><path d="M60 -20 L230 -110" stroke="#e53935" stroke-width="7"/><path d="M60 -10 L230 -50" stroke="#fb8c00" stroke-width="7"/><path d="M60 0 L230 10" stroke="#fdd835" stroke-width="7"/><path d="M60 10 L230 70" stroke="#43a047" stroke-width="7"/><path d="M60 20 L230 130" stroke="#1e88e5" stroke-width="7"/><path d="M60 30 L230 190" stroke="#8e24aa" stroke-width="7"/></g>`;
const telescope = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-130" y="-30" width="260" height="60" rx="18" fill="#8d6e63" stroke="${O}" stroke-width="6"/><circle cx="-130" cy="0" r="40" fill="#bcaaa4" stroke="${O}" stroke-width="6"/><rect x="-170" y="-20" width="60" height="40" fill="#607d8b" stroke="${O}" stroke-width="4"/></g>`;

const scenes = [];
// 1
scenes.push({ narration: 'স্যার আইজ্যাক নিউটন জন্মেছিলেন ১৭শ শতকে, ইংল্যান্ডের লিংকনশায়ারের একটি গ্রামে। ছোটবেলা থেকেই তিনি ছিলেন কৌতূহলী।',
  svg: svg(``, `<defs>${P.grad('nw1', '#cfe9ff', '#f4fbff')}</defs><rect width="1080" height="1920" fill="url(#nw1)"/>
<rect y="1150" width="1080" height="770" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'লিংকনশায়ার, ১৭শ শতক', { fill: '#33691e', rot: -3, delay: .3, fs: 56 })}`) });
// 2
scenes.push({ narration: 'তিনি নানা রকম যন্ত্র আর মডেল বানাতে পছন্দ করতেন। হাত দিয়ে জিনিস বানানো আর তা পরখ করা ছিল তাঁর আনন্দ।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff8e1"/>
${bench(1330)}
<g transform="translate(540,1180)">${telescope(0, 0, .9)}</g>
${at(860, 1460, .8, kid('think', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'যন্ত্র বানানো', { fill: '#4e342e', rot: -2, delay: .2, fs: 66 })}`) });
// 3
scenes.push({ narration: 'একটা গল্প প্রচলিত আছে, এক বাগানে গাছ থেকে একটা আপেল পড়তে দেখে তিনি ভাবলেন, সব কিছু নিচের দিকেই পড়ে কেন?',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8f5e9"/>
<rect y="1330" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/>
${tree(760, 1330, 1.2)}
${apple(720, 1140, 1)}
${at(300, 1460, .85, geo('think', { mouth: 'hmm', brows: 'up', px: 4 }), '')}
${P.label(540, 230, 'পড়ল আপেল', { fill: '#1b5e20', rot: -2, delay: .2, fs: 66 })}`) });
// 4
scenes.push({ narration: 'এই প্রশ্ন থেকেই তিনি মাধ্যাকর্ষণের ধারণা বিকশিত করেন। পৃথিবী যেমন আপেলকে টানে, তেমনই চাঁদকেও টানে।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e1f5fe"/>
<circle cx="540" cy="900" r="260" fill="#90caf9" stroke="${O}" stroke-width="6"/>
${apple(540, 480, 1.3)}
<path d="M540 600 L540 720" stroke="#e53935" stroke-width="8" stroke-dasharray="18 12"/>
${at(540, 1460, .9, geo('point', { mouth: 'smile', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'মাধ্যাকর্ষণ', { fill: '#01579b', rot: -2, delay: .2, fs: 66 })}`) });
// 5
scenes.push({ narration: 'তিনি বললেন বস্তুর গতির তিনটি সূত্র। এগুলো দিয়ে বোঝা গেল, কীভাবে জিনিস চলে আর থামে।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#f3e5f5"/>
${bench(1330)}
<rect x="340" y="1000" width="240" height="120" rx="16" fill="#90a4ae" stroke="${O}" stroke-width="6"/>
<path d="M480 1060 L700 1060" stroke="#e53935" stroke-width="8"/><polygon points="700,1040 730,1060 700,1080" fill="#e53935"/>
${at(860, 1460, .85, geo('stand', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'গতির তিনটি সূত্র', { fill: '#4a148c', rot: -2, delay: .2, fs: 56 })}`) });
// 6
scenes.push({ narration: '১৬৮৭ সালে প্রকাশিত হলো তাঁর বিখ্যাত বই প্রিন্সিপিয়া। এই বইতে বিজ্ঞানের বড় নিয়মগুলো গুছিয়ে লেখা ছিল।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff3e0"/>
<rect x="250" y="120" width="580" height="560" rx="18" fill="#ffffff" stroke="${O}" stroke-width="8"/>
${T(540, 260, 'Principia', 80, '#5d4037')}
${T(540, 390, '১৬৮৭', 110, '#e65100')}
${at(540, 1460, .9, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}`) });
// 7
scenes.push({ narration: 'তিনি একটা প্রিজমের ভেতর দিয়ে সাদা আলো পাঠিয়ে দেখালেন, সেই আলো সাতটি রঙে ভাগ হয়ে যায়।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8eaf6"/>
${bench(1330)}
<g transform="translate(360,1060)">${prism(0, 0, 1.4)}</g>
${at(860, 1460, .8, geo('point', { mouth: 'grin', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'আলোর সাতটি রঙ', { fill: '#283593', rot: -2, delay: .2, fs: 60 })}`) });
// 8
scenes.push({ narration: 'নিউটন নিজে একটি প্রতিফলন টেলিস্কোপও বানিয়েছিলেন। তিনি বলেছিলেন, যদি আমি বেশি দূর দেখে থাকি, তা অন্যদের কাঁধে ভর দিয়ে।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e0f2f1"/>
${bench(1330)}
<g transform="translate(540,1180)">${telescope(0, 0, 1.4)}</g>
${at(230, 1460, .8, geo('cheer', { mouth: 'smile', brows: 'up', px: 4 }), '')}${at(870, 1460, .75, kid('stand', { mouth: 'o', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'কাঁধের উপর দাঁড়িয়ে', { fill: '#004d40', rot: -2, delay: .2, fs: 54 })}`) });
// 9
scenes.push({ narration: 'একটা আপেলের পতন থেকে শুরু হলো মহাবিশ্বের নিয়ম বোঝার পথ। স্যার আইজ্যাক নিউটনের গল্প এখানেই শেষ।', caption: 'স্যার আইজ্যাক নিউটনের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('nw9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#nw9)"/>${P.rays(540, 620, '#ffc93c', .32)}
<g transform="translate(540,620)">${apple(0, 0, 1.6)}</g>
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 300, 'নিউটনের গল্প শেষ', { fill: '#33691e', rot: -2, delay: .2, fs: 62 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'আপেল আর মহাকর্ষ', series: 'আবিষ্কারের গল্প · পর্ব ১৬', episode: 16, scientist: 'স্যার আইজ্যাক নিউটন',
  summary: 'একটা পড়ন্ত আপেল থেকে নিউটন ভাবলেন, সব কিছু কেন নিচে পড়ে। সেই প্রশ্ন থেকেই তিনি মাধ্যাকর্ষণের নিয়ম আর আলোর রহস্য ব্যাখ্যা করলেন।' }, scenes);
console.log('ep16:', scenes.length, 'scenes');
