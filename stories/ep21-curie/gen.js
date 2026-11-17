// আবিষ্কারের গল্প · পর্ব ২১: মাদাম কুরি. Our own retelling (facts checked: Maria Sklodowska born 1867 in Warsaw, Poland;
// women could not attend university there, so she studied in secret and in 1891 went to Paris (Sorbonne); married Pierre
// Curie 1895; studied the rays from uranium, named radioactivity; in 1898 with Pierre discovered polonium (named after Poland)
// and radium, processing tonnes of pitchblende in a shed; Nobel Prize in Physics 1903 (with Pierre and Becquerel), the first
// woman to win; Nobel Prize in Chemistry 1911, the first person to win two; died 1934).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const marie = person({ skin: '#f6d3b0', hair: 'long', hairColor: '#6d4c41', outfit: 'robe', cloth: '#37474f', legsColor: '#263238' });
const girl = person({ skin: '#f6d3b0', hair: 'long', hairColor: '#8d6e63', outfit: 'robe', cloth: '#5c6bc0', legsColor: '#4e342e' });
const pierre = person({ skin: '#f1c28f', hair: 'short', hairColor: '#4e342e', beard: 'short', beardColor: '#4e342e', outfit: 'coat', cloth: '#455a64', legsColor: '#263238' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}">${t}</text>`;
const books = (x, y) => `<g transform="translate(${x},${y})">${[['#c62828', 0], ['#1565c0', 60], ['#2e7d32', 120]].map(([c, d]) => `<rect x="${-90}" y="${-d - 50}" width="180" height="50" rx="6" fill="${c}" stroke="${O}" stroke-width="5"/>`).join('')}</g>`;
const tube = (x, y, glow = false) => `<g transform="translate(${x},${y})">${glow ? `<circle r="90" fill="#b2ff59" opacity=".35"/>` : ''}<rect x="-26" y="-110" width="52" height="170" rx="26" fill="#e3f2fd" stroke="${O}" stroke-width="6"/><rect x="-20" y="-10" width="40" height="64" rx="20" fill="${glow ? '#76ff03' : '#90caf9'}"/></g>`;
const shed = `<path d="M60 760 L540 500 L1020 760 Z" fill="#8d6e63" stroke="${O}" stroke-width="6"/><rect x="100" y="760" width="880" height="570" fill="#a1887f" stroke="${O}" stroke-width="6"/>`;
const pot = (x, y) => `<g transform="translate(${x},${y})"><path d="M-120 -60 L120 -60 L95 70 L-95 70 Z" fill="#424242" stroke="${O}" stroke-width="6"/><path d="M-40 -60 Q-20 -130 0 -60 M20 -60 Q40 -150 60 -60" fill="none" stroke="#bdbdbd" stroke-width="6"/></g>`;
const medal = (x, y, s, n) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-50 -220 L-20 -80 L20 -80 L50 -220" fill="#1565c0" stroke="${O}" stroke-width="5"/><circle r="110" fill="#ffca28" stroke="${O}" stroke-width="8"/>${T(0, 30, n, 90, '#e65100')}</g>`;

const scenes = [];
scenes.push({ narration: 'মারি স্ক্লদোভস্কা জন্মেছিলেন ১৮৬৭ সালে, পোল্যান্ডের ওয়ারশতে। ছোটবেলা থেকেই পড়াশোনায় দারুণ মেধাবী।',
  svg: svg(``, `<defs>${P.grad('mc1', '#d6ecff', '#f5fbff')}</defs><rect width="1080" height="1920" fill="url(#mc1)"/>
<rect y="1330" width="1080" height="590" fill="#bcaaa4" stroke="${O}" stroke-width="6"/>
${books(260, 1320)}${at(640, 1460, .85, girl('stand', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'ওয়ারশ, ১৮৬৭', { fill: '#0d47a1', rot: -3, delay: .3, fs: 66 })}`) });
scenes.push({ narration: 'তখন সেখানে মেয়েদের বিশ্ববিদ্যালয়ে পড়ার সুযোগ ছিল না। তাই তিনি গোপনে পড়তেন, আর স্বপ্ন দেখতেন বিজ্ঞানী হওয়ার।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#3e4a61"/>
<circle cx="900" cy="440" r="70" fill="#fff9c4" stroke="${O}" stroke-width="5"/>
<rect y="1330" width="1080" height="590" fill="#5d4037" stroke="${O}" stroke-width="6"/>
${books(300, 1320)}${at(640, 1460, .85, girl('think', { mouth: 'hmm', brows: 'think', px: -4 }), '')}
${P.label(540, 230, 'গোপনে পড়াশোনা', { fill: '#4527a0', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: '১৮৯১ সালে তিনি পড়তে গেলেন ফ্রান্সের প্যারিসে। কম খেয়ে, ঠান্ডা ঘরে থেকেও পড়া ছাড়েননি।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e1f5fe"/>
<path d="M540 380 L470 1000 L610 1000 Z" fill="#78909c" stroke="${O}" stroke-width="6"/><path d="M450 760 L630 760" stroke="${O}" stroke-width="8"/>
<rect y="1330" width="1080" height="590" fill="#b0bec5" stroke="${O}" stroke-width="6"/>
${at(820, 1460, .85, marie('stand', { mouth: 'smile', brows: 'normal', px: -4 }), '')}
${P.label(540, 230, 'প্যারিস, ১৮৯১', { fill: '#01579b', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'সেখানে পরিচয় হলো বিজ্ঞানী পিয়ের কুরির সঙ্গে। দুজনে বিয়ে করলেন, আর একসঙ্গে গবেষণা শুরু করলেন।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff3e0"/>
<rect y="1330" width="1080" height="590" fill="#d7ccc8" stroke="${O}" stroke-width="6"/>
${tube(540, 760)}
${at(300, 1460, .85, marie('stand', { mouth: 'smile', brows: 'normal', px: 4 }), '')}${at(800, 1460, .85, pierre('point', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'মারি ও পিয়ের কুরি', { fill: '#e65100', rot: -2, delay: .2, fs: 64 })}`) });
scenes.push({ narration: 'ইউরেনিয়াম থেকে এক অদৃশ্য রশ্মি বের হয়। মারি এর নাম দিলেন তেজস্ক্রিয়তা, আর খুঁজতে লাগলেন এর রহস্য।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#ede7f6"/>
<rect y="1330" width="1080" height="590" fill="#b39ddb" stroke="${O}" stroke-width="6"/>
<g transform="translate(540,640)"><rect x="-90" y="-90" width="180" height="180" rx="20" fill="#9e9e9e" stroke="${O}" stroke-width="6"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M0 0 L${Math.cos(a * Math.PI / 180) * 260} ${Math.sin(a * Math.PI / 180) * 260}" stroke="#7c4dff" stroke-width="6" stroke-dasharray="16 14" opacity=".8"/>`).join('')}</g>
${at(540, 1460, .8, marie('think', { mouth: 'o', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'তেজস্ক্রিয়তা', { fill: '#4527a0', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'এক পুরোনো ছাউনিতে টনের পর টন খনিজ গলিয়ে, বছরের পর বছর খেটে তাঁরা খুঁজে পেলেন দুটি নতুন মৌল।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#cfd8dc"/>${shed}
${pot(300, 1260)}
<rect y="1330" width="1080" height="590" fill="#795548" stroke="${O}" stroke-width="6"/>
${at(720, 1460, .7, marie('point', { mouth: 'smile', brows: 'normal', px: -4 }), '')}
${P.label(540, 230, 'পুরোনো ছাউনির ল্যাব', { fill: '#3e2723', rot: -2, delay: .2, fs: 62 })}`) });
scenes.push({ narration: 'একটির নাম রাখলেন পোলোনিয়াম, প্রিয় দেশ পোল্যান্ডের নামে। আরেকটি রেডিয়াম, যা অন্ধকারে আলো ছড়ায়।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#1a237e"/>
${tube(360, 700, true)}${tube(720, 700, true)}
${T(360, 920, 'পোলোনিয়াম', 54, '#ffffff')}${T(720, 920, 'রেডিয়াম', 54, '#ffffff')}
<rect y="1330" width="1080" height="590" fill="#283593" stroke="${O}" stroke-width="6"/>
${P.label(540, 230, 'দুটি নতুন মৌল, ১৮৯৮', { fill: '#1a237e', rot: -2, delay: .2, fs: 62 })}`) });
scenes.push({ narration: '১৯০৩ সালে পদার্থবিজ্ঞানে নোবেল পেলেন, প্রথম নারী হিসেবে। ১৯১১ সালে আবার নোবেল, এবার রসায়নে।',
  svg: svg(``, `<defs>${P.grad('mc8', '#fff3c4', '#fffdf2')}</defs><rect width="1080" height="1920" fill="url(#mc8)"/>
${medal(330, 560, .85, '১৯০৩')}${medal(750, 560, .85, '১৯১১')}
${at(540, 1460, .9, marie('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${P.label(540, 210, 'দুইবার নোবেল', { fill: '#e65100', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'দুই বিষয়ে নোবেল পাওয়া প্রথম মানুষ তিনিই। অধ্যবসায় দিয়ে বাধা জয় করার গল্প, মাদাম কুরির গল্প এখানেই শেষ।', caption: 'মাদাম কুরির গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('mc9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#mc9)"/>${P.rays(540, 520, '#ffc93c', .32)}
${tube(540, 540, true)}
${at(540, 1420, 1, marie('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 200, 'মাদাম কুরির গল্প শেষ', { fill: '#4527a0', rot: -2, delay: .2, fs: 60 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'অন্ধকারে আলো', series: 'আবিষ্কারের গল্প · পর্ব ২১', episode: 21, scientist: 'মাদাম কুরি',
  summary: 'বাধা পেরিয়ে পড়াশোনা করে মাদাম কুরি আবিষ্কার করলেন পোলোনিয়াম আর রেডিয়াম, আর হলেন দুই বিষয়ে নোবেলজয়ী প্রথম মানুষ।' }, scenes);
console.log('ep21:', scenes.length, 'scenes');
