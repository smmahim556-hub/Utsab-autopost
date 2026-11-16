// আবিষ্কারের গল্প · পর্ব ১৯: আলফ্রেড নোবেল. Our own retelling (facts checked: born 1833 in Stockholm, Sweden; worked with
// nitroglycerin, a powerful but unstable liquid explosive; an 1864 explosion at the family works killed his younger brother
// Emil; in 1867 he patented dynamite, nitroglycerin soaked into kieselguhr earth, far safer to handle, used for tunnels, mines
// and roads; in 1888 a newspaper wrongly printed his obituary calling him a merchant of death; his 1895 will left most of his
// fortune for yearly prizes; died 1896; first Nobel Prizes 1901 in physics, chemistry, medicine, literature and peace).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const nob = person({ skin: '#f1c28f', hair: 'short', hairColor: '#5d4037', outfit: 'coat', cloth: '#37474f', legsColor: '#263238' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#6d4c41', outfit: 'coat', cloth: '#1565c0', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const flask = (x, y, s = 1, c = '#fff176') => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-30 -160 L30 -160 L30 -60 L110 90 Q120 120 90 120 L-90 120 Q-120 120 -110 90 L-30 -60 Z" fill="#e3f2fd" stroke="${O}" stroke-width="6"/><path d="M-70 40 L70 40 L105 100 Q110 115 90 115 L-90 115 Q-110 115 -105 100 Z" fill="${c}"/></g>`;
const stick = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-45" y="-170" width="90" height="300" rx="20" fill="#e53935" stroke="${O}" stroke-width="6"/><rect x="-45" y="-40" width="90" height="40" fill="#fdd835" stroke="${O}" stroke-width="4"/><path d="M0 -170 Q20 -230 -10 -270" fill="none" stroke="${O}" stroke-width="6"/></g>`;
const tunnel = () => `<path d="M0 1350 L0 700 Q540 380 1080 700 L1080 1350 Z" fill="#8d6e63" stroke="${O}" stroke-width="6"/><path d="M300 1350 L300 1000 Q540 760 780 1000 L780 1350 Z" fill="#3e2723" stroke="${O}" stroke-width="6"/>`;
const medal = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-60 -260 L-20 -90 L20 -90 L60 -260" fill="#1565c0" stroke="${O}" stroke-width="5"/><circle r="130" fill="#ffca28" stroke="${O}" stroke-width="8"/><circle r="95" fill="none" stroke="#ff8f00" stroke-width="8"/></g>`;
const paper = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-230" y="-170" width="460" height="340" fill="#fafafa" stroke="${O}" stroke-width="6"/><rect x="-200" y="-140" width="400" height="50" fill="#424242"/>${[0, 1, 2, 3].map(i => `<rect x="-200" y="${-60 + i * 50}" width="${i % 2 ? 300 : 400}" height="18" fill="#bdbdbd"/>`).join('')}</g>`;

const scenes = [];
// 1
scenes.push({ narration: 'আলফ্রেড নোবেল জন্মেছিলেন ১৮৩৩ সালে, সুইডেনের স্টকহোমে। বাবার কারখানায় ছোটবেলা থেকেই রসায়ন আর যন্ত্রের প্রতি টান জন্মায়।',
  svg: svg(``, `<defs>${P.grad('nb1', '#d6ecff', '#f5fbff')}</defs><rect width="1080" height="1920" fill="url(#nb1)"/>
<rect y="1150" width="1080" height="770" fill="#b0bec5" stroke="${O}" stroke-width="6"/>
${at(540, 1420, 1, kid('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'স্টকহোম, ১৮৩৩', { fill: '#0d47a1', rot: -3, delay: .3, fs: 66 })}`) });
// 2
scenes.push({ narration: 'বড় হয়ে তিনি কাজ শুরু করলেন নাইট্রোগ্লিসারিন নিয়ে। এটা খুব শক্তিশালী তরল, কিন্তু সামান্য ঝাঁকুনিতেই ফেটে যেতে পারত।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff8e1"/>
<rect y="1330" width="1080" height="590" fill="#d7ccc8" stroke="${O}" stroke-width="6"/>
${flask(300, 1180, 1.1)}
${at(760, 1460, .85, nob('think', { mouth: 'hmm', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'বিপজ্জনক তরল', { fill: '#e65100', rot: -2, delay: .2, fs: 66 })}`) });
// 3
scenes.push({ narration: '১৮৬৪ সালে তাঁদের কারখানায় এক বিস্ফোরণে মারা যান তাঁর ছোট ভাই এমিল। নোবেল ঠিক করলেন, এই শক্তিকে নিরাপদ করতেই হবে।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#eceff1"/>
<rect y="1330" width="1080" height="590" fill="#b0bec5" stroke="${O}" stroke-width="6"/>
${at(540, 1460, .95, nob('stand', { mouth: 'frown', brows: 'think', px: 0 }), '')}
${P.label(540, 230, 'কঠিন এক দিন, ১৮৬৪', { fill: '#37474f', rot: -2, delay: .2, fs: 60 })}`) });
// 4
scenes.push({ narration: 'অনেক পরীক্ষার পর তিনি দেখলেন, তরলটা এক ধরনের নরম মাটিতে শুষে নিলে সেটা অনেক বেশি নিরাপদে বহন করা যায়।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fffde7"/>
<rect y="1330" width="1080" height="590" fill="#dce775" stroke="${O}" stroke-width="6"/>
${flask(260, 1180, .9)}
<g transform="translate(560,1220)"><ellipse rx="130" ry="70" fill="#d7ccc8" stroke="${O}" stroke-width="6"/><circle cx="-40" cy="-10" r="12" fill="#a1887f"/><circle cx="30" cy="10" r="10" fill="#a1887f"/></g>
${at(860, 1460, .8, nob('point', { mouth: 'smile', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'নিরাপদ করার উপায়', { fill: '#827717', rot: -2, delay: .2, fs: 60 })}`) });
// 5
scenes.push({ narration: '১৮৬৭ সালে এল তাঁর আবিষ্কার, ডিনামাইট। কাঠির মতো দেখতে, আগের চেয়ে নিরাপদ, কিন্তু দারুণ শক্তিশালী।',
  svg: svg(``, `<defs>${P.grad('nb5', '#fff3c4', '#fffdf2')}</defs><rect width="1080" height="1920" fill="url(#nb5)"/>
${stick(420, 560, .95)}${stick(640, 575, .9)}
${at(540, 1460, .9, nob('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${P.label(540, 210, 'ডিনামাইট, ১৮৬৭', { fill: '#c62828', rot: -2, delay: .3, fs: 72 })}`) });
// 6
scenes.push({ narration: 'ডিনামাইট দিয়ে পাহাড় কেটে সুড়ঙ্গ, খনি আর রাস্তা বানানো সহজ হলো। নোবেল হয়ে উঠলেন বিশাল ধনী।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e1f5fe"/>
${tunnel()}
<rect y="1350" width="1080" height="570" fill="#a1887f" stroke="${O}" stroke-width="6"/>
${P.label(540, 230, 'সুড়ঙ্গ, খনি, রাস্তা', { fill: '#4e342e', rot: -2, delay: .2, fs: 64 })}`) });
// 7
scenes.push({ narration: '১৮৮৮ সালে এক পত্রিকা ভুল করে তাঁরই মৃত্যুসংবাদ ছাপল, আর লিখল মৃত্যুর ব্যবসায়ী। পড়ে নোবেল খুব কষ্ট পেলেন।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#f5f5f5"/>
${paper(540, 520, 1.1)}
${at(540, 1460, .9, nob('think', { mouth: 'frown', brows: 'think', px: 0 }), '')}
${P.label(540, 230, 'ভুল খবর, ১৮৮৮', { fill: '#424242', rot: -2, delay: .2, fs: 66 })}`) });
// 8
scenes.push({ narration: 'তিনি চাইলেন মানুষ তাঁকে ভালো কাজের জন্য মনে রাখুক। উইলে লিখে গেলেন, তাঁর সম্পদ দিয়ে প্রতি বছর পুরস্কার দেওয়া হবে।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8f5e9"/>
<rect x="300" y="360" width="480" height="380" rx="10" fill="#fffde7" stroke="${O}" stroke-width="6"/>
${[0, 1, 2, 3, 4].map(i => `<rect x="350" y="${420 + i * 62}" width="${i % 2 ? 300 : 380}" height="20" fill="#bcaaa4"/>`).join('')}
${at(540, 1460, .9, nob('point', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'উইল, ১৮৯৫', { fill: '#1b5e20', rot: -2, delay: .2, fs: 66 })}`) });
// 9
scenes.push({ narration: '১৯০১ সাল থেকে পদার্থ, রসায়ন, চিকিৎসা, সাহিত্য আর শান্তিতে দেওয়া হচ্ছে নোবেল পুরস্কার। আলফ্রেড নোবেলের গল্প এখানেই শেষ।', caption: 'আলফ্রেড নোবেলের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('nb9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#nb9)"/>${P.rays(540, 560, '#ffc93c', .32)}
${medal(540, 510, .75)}
${at(540, 1420, 1, nob('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 200, 'নোবেল পুরস্কার, ১৯০১', { fill: '#e65100', rot: -2, delay: .2, fs: 60 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'ডিনামাইট থেকে পুরস্কার', series: 'আবিষ্কারের গল্প · পর্ব ১৯', episode: 19, scientist: 'আলফ্রেড নোবেল',
  summary: 'বিপজ্জনক নাইট্রোগ্লিসারিনকে নিরাপদ করে আলফ্রেড নোবেল বানালেন ডিনামাইট, আর নিজের সম্পদ দিয়ে শুরু করলেন নোবেল পুরস্কার।' }, scenes);
console.log('ep19:', scenes.length, 'scenes');
