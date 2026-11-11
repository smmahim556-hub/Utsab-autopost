// আবিষ্কারের গল্প · পর্ব ১০: জর্জ স্টিফেনসন. Our own retelling (facts checked: born 1781 at Wylam, Northumberland, England,
// son of a colliery fireman; built early steam locomotives for coal mines; 1825 Stockton & Darlington railway, the first
// public steam railway carrying passengers; 1829 'Rocket' won the Rainhill trials; 1830 Liverpool & Manchester railway opened).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const geo = person({ skin: '#e8b98e', hair: 'short', hairColor: '#5d4037', outfit: 'coat', cloth: '#6d4c41', legsColor: '#37474f' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#2e7d32', legsColor: '#4e342e' });
const crowd = person({ skin: '#f3c9a0', hair: 'short', hairColor: '#3b2a20', outfit: 'coat', cloth: '#5c6bc0', legsColor: '#263238' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const loco = (x, y, s = 1, color = '#e53935', smoke = true) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-190" y="-150" width="260" height="150" rx="14" fill="${color}" stroke="${O}" stroke-width="7"/><rect x="-40" y="-260" width="110" height="120" rx="12" fill="${color}" stroke="${O}" stroke-width="7"/><rect x="-60" y="-300" width="70" height="46" fill="#37474f" stroke="${O}" stroke-width="6"/><circle cx="-150" cy="10" r="48" fill="#37474f" stroke="${O}" stroke-width="7"/><circle cx="20" cy="10" r="48" fill="#37474f" stroke="${O}" stroke-width="7"/><circle cx="-150" cy="10" r="16" fill="#cfd8dc"/><circle cx="20" cy="10" r="16" fill="#cfd8dc"/><rect x="-230" y="-40" width="400" height="22" fill="#607d8b" stroke="${O}" stroke-width="5"/>${smoke ? `<g class="drift">${P.cloud(-40, -380, .5)}</g>` : ''}</g>`;
const track = (y = 1300) => `<rect x="-100" y="${y}" width="1280" height="16" fill="#607d8b" stroke="${O}" stroke-width="5"/>${Array.from({ length: 22 }, (_, i) => `<rect x="${-100 + i * 60}" y="${y + 16}" width="22" height="50" fill="#8d6e63" stroke="${O}" stroke-width="3"/>`).join('')}`;
const kickCss = `.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}.drift{animation:dr 6s linear infinite}@keyframes dr{from{transform:translateX(-40px)}to{transform:translateX(60px)}}`;

const scenes = [];
// 1
scenes.push({ narration: 'জর্জ স্টিফেনসন জন্মেছিলেন ১৭৮১ সালে, ইংল্যান্ডের উইলাম গ্রামে। তাঁর বাবা ছিলেন কয়লা খনির একজন কর্মী। ছোটবেলা থেকেই যন্ত্র নিয়ে কাজ করতে তাঁর ভীষণ ভালো লাগত।', caption: 'খনির ছেলে', highlight: ['খনির'],
  svg: svg(`${kickCss}`, `<defs>${P.grad('skg1', '#cfe9ff', '#f4fbff')}</defs><rect width="1080" height="1920" fill="url(#skg1)"/>
<g class="drift">${P.cloud(260, 380, .8)}${P.cloud(840, 300, .7)}</g>
<rect y="1150" width="1080" height="770" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
<g transform="translate(820,1150)"><rect x="-120" y="-300" width="200" height="300" fill="#8d6e63" stroke="${O}" stroke-width="7"/><path d="M-140 -300 L-20 -400 L100 -300Z" fill="#5d4037" stroke="${O}" stroke-width="7"/></g>
${at(330, 1420, .9, geo('stand', { mouth: 'smile', brows: 'normal', px: 6 }), 'bob')}${at(560, 1450, .6, kid('stand', { mouth: 'grin', brows: 'up', px: -6 }), 'bob')}
${P.label(540, 230, 'উইলাম, ১৭৮১', { fill: '#33691e', rot: -3, delay: .3, fs: 62 })}`) });
// 2
scenes.push({ narration: 'সেই সময় কয়লা খনি থেকে কয়লা টেনে আনা ছিল খুব কঠিন কাজ। ঘোড়া দিয়ে ভারী কয়লার গাড়ি টানতে হতো, আর অনেক সময় লাগত। স্টিফেনসন ভাবলেন, বাষ্পের শক্তি দিয়ে গাড়ি টানা যায় না?', caption: 'ভারী কয়লার গাড়ি', highlight: ['বাষ্পের শক্তি'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#efe9dc"/><rect y="1150" width="1080" height="770" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${track(1330)}
<g transform="translate(560,1210)"><rect x="-120" y="-60" width="240" height="90" fill="#455a64" stroke="${O}" stroke-width="6"/>${[-80, 0, 80].map(x => `<rect x="${x - 25}" y="-100" width="50" height="40" fill="#263238" stroke="${O}" stroke-width="4"/>`).join('')}</g>
${at(230, 1420, .8, geo('think', { mouth: 'smile', brows: 'up', px: 6 }), 'bob')}
${P.label(540, 230, 'ঘোড়ার টানা', { fill: '#4e342e', rot: -2, delay: .2, fs: 66 })}
${T(540, 780, 'বাষ্পের শক্তি?', 90, '#e63946', 'class="pop"')}`) });
// 3
scenes.push({ narration: 'স্টিফেনসন বানালেন একটা বাষ্প-ইঞ্জিন, যা নিজে কয়লা পুড়িয়ে চলতে পারত। তাঁর প্রথম ইঞ্জিনগুলো খনির ভেতরে কয়লার গাড়ি টানত। এগুলোকে বলা হতো লোকোমোটিভ।', caption: 'প্রথম ইঞ্জিন', highlight: ['লোকোমোটিভ'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#fff8e1"/><rect y="1150" width="1080" height="770" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${track(1330)}
<g transform="translate(540,1290) scale(.9)">${loco(0, 0, 1, '#1e88e5')}</g>
${at(930, 1420, .7, geo('stand', { mouth: 'grin', brows: 'up', px: -6 }), 'bob')}
${P.label(540, 230, 'লোকোমোটিভ', { fill: '#1e88e5', rot: -2, delay: .3, fs: 70 })}`) });
// 4
scenes.push({ narration: 'ঊনিশ শতকের শুরুতে বেশিরভাগ মানুষ বাইরে যাতায়াত করত পায়ে হেঁটে বা ঘোড়ায় চড়ে। স্টিফেনসন চাইলেন, এমন একটা লাইনের ওপর ইঞ্জিন চলবে, যাতে অনেক মানুষ একসাথে দ্রুত যেতে পারে।', caption: 'রেললাইনের স্বপ্ন', highlight: ['রেললাইন'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#e3f2fd"/><rect y="1150" width="1080" height="770" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${track(1330)}
${at(540, 1440, .95, geo('think', { mouth: 'smile', brows: 'up', px: 6 }), 'bob')}
${at(880, 1440, .7, kid('stand', { mouth: 'o', brows: 'up', px: -4 }), 'bob')}
${T(540, 560, 'সবার জন্য রেল', 90, '#1565c0', 'class="pop"')}`) });
// 5
scenes.push({ narration: 'ইংল্যান্ডের স্টকটন থেকে ডার্লিংটন পর্যন্ত ১৮২৫ সালে প্রথম রেললাইন খোলা হলো। স্টিফেনসনের বানানো লোকোমোটিভ "লোকোমোশন" যাত্রী আর কয়লা টেনে নিয়ে গেল। এটাই ছিল প্রথম সাধারণ যাত্রী-রেল।', caption: 'প্রথম যাত্রী-রেল', highlight: ['প্রথম'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#fff3e0"/><rect y="1150" width="1080" height="770" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${track(1330)}
<g transform="translate(540,1290) scale(.95)">${loco(0, 0, 1, '#e53935')}</g>
${at(170, 1440, .5, crowd('stand', { mouth: 'o', brows: 'up', px: 4 }), 'bob')}${at(960, 1440, .5, crowd('stand', { mouth: 'grin', brows: 'up', px: -4 }), 'bob')}
${P.label(540, 230, 'স্টকটন থেকে ডার্লিংটন', { fill: '#b71c1c', rot: -2, delay: .2, fs: 56 })}`) });
// 6
scenes.push({ narration: 'তখন অনেকে ভাবতেন, ইঞ্জিন এত জোরে চললে মানুষের ক্ষতি হবে। কিন্তু স্টিফেনসন প্রমাণ করলেন, একটা শক্তিশালী ইঞ্জিন দ্রুত আর নিরাপদে চলতে পারে।', caption: 'সন্দেহ ভাঙলেন', highlight: ['প্রমাণ'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#f3e5f5"/><rect y="1150" width="1080" height="770" fill="#b39ddb" stroke="${O}" stroke-width="6"/>
${track(1330)}
<g transform="translate(540,1290) scale(1.05)">${loco(0, 0, 1, '#ff7043')}</g>
${at(180, 1440, .6, crowd('think', { mouth: 'o', brows: 'up', px: 4 }), 'bob')}${at(900, 1440, .6, crowd('think', { mouth: 'hmm', brows: 'normal', px: -4 }), 'bob')}
${P.label(540, 230, 'সন্দেহ? না, নিরাপদ!', { fill: '#4a148c', rot: -2, delay: .3, fs: 60 })}`) });
// 7
scenes.push({ narration: 'ব্যাপক প্রতিযোগিতার পর ১৮২৯ সালে স্টিফেনসনের ইঞ্জিন "রকেট" জিতল। ১৮৩০ সালে লিভারপুল থেকে ম্যানচেস্টার পর্যন্ত রেললাইন খোলা হলো, আর বিশ্বজুড়ে রেলের যুগ শুরু হলো।', caption: 'রকেট জিতল', highlight: ['রকেট'],
  svg: svg(`${kickCss}`, `<defs>${P.grad('skg7', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#skg7)"/>${P.rays(540, 640, '#ffc93c', .3)}
${track(1330)}
<g transform="translate(540,1290) scale(1.1)">${loco(0, 0, 1, '#e53935')}</g>
${P.label(540, 230, 'রকেট জিতল!', { fill: '#b71c1c', rot: -3, delay: .2, fs: 80 })}
${T(540, 760, '১৮৩০: রেলের যুগ', 84, '#3b2a20', 'class="pop"')}`) });
// 8
scenes.push({ narration: 'স্টিফেনসনের রেল ধীরে ধীরে সারা পৃথিবীতে ছড়িয়ে পড়ল। শহর, বন্দর আর কারখানার মধ্যে মানুষ আর পণ্য দ্রুত যাতায়াত করতে শুরু করল। একটা গ্রামের ছেলের স্বপ্ন দেশকে বদলে দিল।', caption: 'রেলে বিশ্ব', highlight: ['বিশ্বে', 'রেল'],
  svg: svg(`${kickCss}`, `<rect width="1080" height="1920" fill="#e8f5e9"/><rect y="1150" width="1080" height="770" fill="#8bc34a" stroke="${O}" stroke-width="6"/>
${[[150, 900], [520, 860], [860, 920]].map(([x, y]) => `<g transform="translate(${x},${y})"><rect x="-70" y="-120" width="140" height="180" fill="#f3e3c3" stroke="${O}" stroke-width="6"/><path d="M-90 -120 L0 -200 L90 -120Z" fill="#b5523b" stroke="${O}" stroke-width="6"/></g>`).join('')}
${track(1330)}
<g transform="translate(540,1290) scale(.8)">${loco(0, 0, 1, '#1e88e5')}</g>
${at(230, 1500, .55, geo('stand', { mouth: 'smile', brows: 'normal', px: 4 }), 'bob')}${at(880, 1500, .55, kid('stand', { mouth: 'grin', brows: 'up', px: -4 }), 'bob')}
${P.label(540, 230, 'সারা দুনিয়ায় রেল', { fill: '#33691e', rot: -2, delay: .2, fs: 64 })}`) });
// 9
scenes.push({ narration: 'একজন কয়লা খনির ছেলের স্বপ্ন থেকেই জন্ম নিল রেলের পথ। পরের পর্বে থাকছে আরেক বিজ্ঞানীর গল্প, যিনি জীবাণুর জগৎ খুলে দিয়েছিলেন: লুই পাস্তুর।', caption: 'পরের পর্বে', highlight: ['পাস্তুর'],
  svg: svg(`${kickCss}`, `<defs>${P.grad('sk9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#sk9)"/>${P.rays(540, 620, '#ffc93c', .32)}
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), 'bob')}
${P.label(540, 300, 'স্টিফেনসনের গল্প শেষ', { fill: '#33691e', rot: -2, delay: .2, fs: 66 })}
${T(540, 1100, 'পরের পর্বে: লুই পাস্তুর', 66, '#3b2a20')}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'বাষ্পের ইঞ্জিনে রেলপথ', series: 'আবিষ্কারের গল্প · পর্ব ১০', episode: 10, scientist: 'জর্জ স্টিফেনসন',
  summary: 'কয়লা খনির এক ছেলে ভাবলেন, বাষ্প দিয়ে কেন গাড়ি টানা যাবে না। তাঁর ইঞ্জিন "রকেট" জিতল, আর শুরু হলো রেলের যুগ।' }, scenes);
console.log('ep10:', scenes.length, 'scenes');
