// আবিষ্কারের গল্প · পর্ব ১৪: জগদীশচন্দ্র বসু. Our own retelling (facts checked: born 1858 at Mymensingh, now Bangladesh;
// physicist and botanist; studied in Kolkata and Cambridge; showed plants respond to stimuli; invented the crescograph to
// measure tiny plant growth; founded the Bose Institute in Kolkata in 1917).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const geo = person({ skin: '#c98e5f', hair: 'short', hairColor: '#2b1d14', outfit: 'coat', cloth: '#5d4037', legsColor: '#263238' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#2e7d32', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const bench = (y = 1330) => `<rect y="${y}" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/><rect x="120" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/><rect x="930" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/>`;
const plant = (x, y, s = 1, lean = 0) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M0 0 Q${lean * 0.5} -120 ${lean} -240" fill="none" stroke="#2e7d32" stroke-width="16" stroke-linecap="round"/><ellipse cx="${lean - 60}" cy="-150" rx="60" ry="24" fill="#66bb6a" stroke="${O}" stroke-width="5" transform="rotate(-25 ${lean - 60} -150)"/><ellipse cx="${lean + 60}" cy="-200" rx="60" ry="24" fill="#81c784" stroke="${O}" stroke-width="5" transform="rotate(25 ${lean + 60} -200)"/><circle cx="${lean}" cy="-245" r="18" fill="#ffeb3b" stroke="${O}" stroke-width="4"/></g>`;
const crescograph = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-120" y="-40" width="240" height="90" rx="10" fill="#607d8b" stroke="${O}" stroke-width="6"/><rect x="-100" y="-160" width="20" height="130" fill="#455a64" stroke="${O}" stroke-width="4"/><line x1="-90" y1="-150" x2="80" y2="-110" stroke="#e53935" stroke-width="8" stroke-linecap="round"/><circle cx="80" cy="-110" r="10" fill="#e53935"/></g>`;
const lamp = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><circle r="120" fill="#fff59d" opacity=".5"/><path d="M-30 40 L-30 -40 Q0 -90 30 -40 L30 40 Z" fill="#fff9c4" stroke="${O}" stroke-width="5"/></g>`;

const scenes = [];
// 1
scenes.push({ narration: 'জগদীশচন্দ্র বসু জন্মেছিলেন ১৮৫৮ সালে, বর্তমান বাংলাদেশের ময়মনসিংহে। তিনি ছিলেন একাধারে পদার্থবিজ্ঞানী ও উদ্ভিদবিজ্ঞানী।',
  svg: svg(``, `<defs>${P.grad('bo1', '#cfe9ff', '#f4fbff')}</defs><rect width="1080" height="1920" fill="url(#bo1)"/>
<rect y="1150" width="1080" height="770" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'ময়মনসিংহ, ১৮৫৮', { fill: '#33691e', rot: -3, delay: .3, fs: 62 })}`) });
// 2
scenes.push({ narration: 'ছোটবেলা থেকেই তাঁর প্রশ্ন ছিল, গাছপালা কি সত্যিই নিঃশব্দ? না কি তারাও সাড়া দেয়?',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8f5e9"/>
<rect y="1330" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/>
${plant(540, 1330, 1.4, 0)}
${at(230, 1460, .8, geo('think', { mouth: 'hmm', brows: 'up', px: 4 }), '')}${at(860, 1460, .75, kid('stand', { mouth: 'o', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'গাছ কি সাড়া দেয়?', { fill: '#1b5e20', rot: -2, delay: .2, fs: 62 })}`) });
// 3
scenes.push({ narration: 'কেমব্রিজ থেকে পড়াশোনা শেষ করে তিনি কলকাতার প্রেসিডেন্সি কলেজে পদার্থবিজ্ঞান পড়াতেন। সেখানেই চলত তাঁর গবেষণা।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e3f2fd"/>
${bench(1330)}
<g transform="translate(540,1180)">${crescograph(0, 0, 1)}</g>
${at(900, 1460, .8, geo('stand', { mouth: 'smile', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'পরীক্ষাগার', { fill: '#1565c0', rot: -2, delay: .2, fs: 66 })}`) });
// 4
scenes.push({ narration: 'তিনি এমন যন্ত্র বানালেন, যা গাছের অতি সামান্য বৃদ্ধিও মাপতে পারে। যন্ত্রটির নাম দিলেন ক্রেসকোগ্রাফ।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#f3e5f5"/>
${bench(1330)}
<g transform="translate(540,1180)">${crescograph(0, 0, 1.4)}</g>
${plant(860, 1330, .9, 0)}
${P.label(540, 230, 'ক্রেসকোগ্রাফ', { fill: '#4a148c', rot: -2, delay: .2, fs: 66 })}`) });
// 5
scenes.push({ narration: 'গাছকে আলো, তাপ বা ঝাঁকুনি দিলে তার বৃদ্ধি বদলে যায়। বসু দেখালেন গাছও অনুভব করে, সাড়া দেয়।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff8e1"/>
<rect y="1330" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/>
${lamp(850, 420, 1)}
${plant(540, 1330, 1.5, 40)}
${at(230, 1460, .8, geo('think', { mouth: 'smile', brows: 'up', px: 4 }), '')}
${P.label(540, 230, 'গাছও সাড়া দেয়', { fill: '#e65100', rot: -2, delay: .2, fs: 62 })}`) });
// 6
scenes.push({ narration: 'বিদ্যুৎ-চৌম্বক তরঙ্গ নিয়েও তিনি কাজ করলেন। অনেক ক্ষেত্রে তাঁর কাজ ছিল বিজ্ঞানের সীমানা বাড়ানোর মতো।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e0f7fa"/>
${bench(1330)}
<path d="M120 1000 Q270 880 420 1000 T720 1000 T1020 1000" fill="none" stroke="#00838f" stroke-width="10" stroke-linecap="round"/>
<path d="M120 1080 Q270 960 420 1080 T720 1080 T1020 1080" fill="none" stroke="#4dd0e1" stroke-width="8" stroke-linecap="round" opacity=".7"/>
${at(540, 1460, .9, geo('stand', { mouth: 'smile', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'তরঙ্গের গবেষণা', { fill: '#006064', rot: -2, delay: .2, fs: 60 })}`) });
// 7
scenes.push({ narration: 'তিনি মনে করতেন, বিজ্ঞান কোনো একটা দেশের নয়, সবার। তাই নিজের দেশে ভালো গবেষণার সুযোগ তৈরি করতে চাইলেন।',
  svg: svg(``, `<defs>${P.grad('bo7', '#fff3c4', '#fffdf2')}</defs><rect width="1080" height="1920" fill="url(#bo7)"/>
<rect x="240" y="250" width="600" height="420" rx="30" fill="#ffffff" stroke="${O}" stroke-width="8"/>
${T(540, 390, 'বিজ্ঞান সবার জন্য', 66, '#5d4037')}
${T(540, 530, 'জন্ম: ১৮৫৮', 54, '#8d6e00')}
${at(540, 1460, .9, kid('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}`) });
// 8
scenes.push({ narration: 'ঊনবিংশ শতকের শেষে একটি গবেষণা প্রতিষ্ঠান দরকার ছিল। ১৯১৭ সালে তিনি কলকাতায় প্রতিষ্ঠা করলেন বসু ইনস্টিটিউট।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8f5e9"/>
<rect x="180" y="800" width="720" height="420" fill="#ffffff" stroke="${O}" stroke-width="8"/>
<polygon points="160,800 540,640 920,800" fill="#c62828" stroke="${O}" stroke-width="8"/>
${[260, 400, 540, 680, 820].map(x => `<rect x="${x - 22}" y="860" width="44" height="320" fill="#eceff1" stroke="${O}" stroke-width="4"/>`).join('')}
${T(540, 580, 'বসু ইনস্টিটিউট, ১৯১৭', 54, '#1b5e20')}
${at(540, 1460, .85, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}`) });
// 9
scenes.push({ narration: 'গাছের নিঃশব্দ বৃদ্ধি মাপতে গিয়ে যিনি জানালেন গাছও সাড়া দেয়, সেই জগদীশচন্দ্র বসুর গল্প এখানেই শেষ।', caption: 'জগদীশচন্দ্র বসুর গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('bo9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#bo9)"/>${P.rays(540, 620, '#ffc93c', .32)}
${plant(540, 1200, 1.2, 0)}
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 300, 'জগদীশচন্দ্র বসুর গল্প শেষ', { fill: '#33691e', rot: -2, delay: .2, fs: 56 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'সাড়া দেয় গাছ', series: 'আবিষ্কারের গল্প · পর্ব ১৪', episode: 14, scientist: 'জগদীশচন্দ্র বসু',
  summary: 'গাছ কি সাড়া দেয়? এই প্রশ্নের উত্তর খুঁজতে জগদীশচন্দ্র বসু ক্রেসকোগ্রাফ বানালেন, আর দেখালেন উদ্ভিদও অনুভব করে।' }, scenes);
console.log('ep14:', scenes.length, 'scenes');
