// আবিষ্কারের গল্প · পর্ব ১২: টমাস আলভা এডিসন. Our own retelling (facts checked: born 1847 at Milan, Ohio, USA; phonograph
// 1877 that recorded and played back sound; practical long-lasting carbon-filament electric light bulb 1879 at Menlo Park;
// he held over a thousand patents; the Pearl Street power station in New York opened 1882).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const geo = person({ skin: '#e8b98e', hair: 'short', hairColor: '#5d4037', outfit: 'coat', cloth: '#455a64', legsColor: '#263238' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#2e7d32', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const bench = (y = 1330) => `<rect y="${y}" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/><rect x="120" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/><rect x="930" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/>`;
const bulb = (x, y, s = 1, lit = false) => `<g transform="translate(${x},${y}) scale(${s})">${lit ? `<circle r="150" fill="#fff59d" opacity=".55"/>` : ''}<path d="M-50 60 Q-110 0 -110 -60 A110 110 0 1 1 110 -60 Q110 0 50 60Z" fill="${lit ? '#fff9c4' : '#eceff1'}" stroke="${O}" stroke-width="6"/><rect x="-50" y="60" width="100" height="50" fill="#90a4ae" stroke="${O}" stroke-width="5"/><path d="M-20 -30 Q0 -70 20 -30" fill="none" stroke="${lit ? '#ff7043' : '#78909c'}" stroke-width="6"/></g>`;
const phono = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-150" y="-20" width="300" height="50" rx="10" fill="#6d4c41" stroke="${O}" stroke-width="6"/><circle cx="0" cy="-70" r="18" fill="#37474f" stroke="${O}" stroke-width="5"/><path d="M-60 -50 Q-120 -120 -150 -150 L-180 -110 Q-120 -60 -60 -20Z" fill="#ffca28" stroke="${O}" stroke-width="5"/><circle cx="0" cy="-30" r="70" fill="none" stroke="${O}" stroke-width="5"/></g>`;

const scenes = [];
// 1
scenes.push({ narration: 'টমাস আলভা এডিসন জন্মেছিলেন ১৮৪৭ সালে, আমেরিকার ওহাইওর মিলান শহরে। ছোটবেলায় তিনি স্কুলে বেশিদিন থাকেননি, তবু নিজে নিজে শিখতে ভালোবাসতেন।', caption: 'আমেরিকা, ১৮৪৭',
  svg: svg(``, `<defs>${P.grad('ed1', '#cfe9ff', '#f4fbff')}</defs><rect width="1080" height="1920" fill="url(#ed1)"/>
<rect y="1150" width="1080" height="770" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'আমেরিকা, ১৮৪৭', { fill: '#33691e', rot: -3, delay: .3, fs: 66 })}`) });
// 2
scenes.push({ narration: 'এডিসন ছিলেন কৌতূহলী। বাড়িতে নিজের ছোট্ট ল্যাব বানিয়ে নানা রাসায়নিক নিয়ে পরীক্ষা করতেন। মানুষ তাঁকে ডাকত ছোট্ট পরীক্ষক।', caption: 'ছোট্ট ল্যাব',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff8e1"/>
${bench(1330)}
<g transform="translate(540,1080)"><rect x="-200" y="-120" width="400" height="200" fill="#ffffff" stroke="${O}" stroke-width="6"/><rect x="-170" y="-60" width="60" height="100" fill="#4fc3f7" stroke="${O}" stroke-width="4"/><rect x="-80" y="-80" width="60" height="120" fill="#ff8a65" stroke="${O}" stroke-width="4"/><rect x="10" y="-40" width="60" height="80" fill="#aed581" stroke="${O}" stroke-width="4"/></g>
${at(900, 1460, .8, kid('think', { mouth: 'o', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'ছোট্ট পরীক্ষক', { fill: '#4e342e', rot: -2, delay: .2, fs: 66 })}`) });
// 3
scenes.push({ narration: 'ক্ষুদ্র টেলিগ্রাফ অপারেটর হিসেবে কাজ করার সময় তিনি নিজে নানা যন্ত্র উন্নত করতে শুরু করেন। এখান থেকেই তাঁর উদ্ভাবনের যাত্রা শুরু।', caption: 'টেলিগ্রাফ',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e3f2fd"/>
${bench(1330)}
<g transform="translate(540,1200)"><rect x="-140" y="-60" width="280" height="120" rx="12" fill="#8d6e63" stroke="${O}" stroke-width="6"/><circle cx="-60" cy="-10" r="22" fill="#eceff1" stroke="${O}" stroke-width="5"/><circle cx="60" cy="-10" r="22" fill="#eceff1" stroke="${O}" stroke-width="5"/><rect x="-30" y="-100" width="60" height="40" fill="#455a64" stroke="${O}" stroke-width="5"/></g>
${at(860, 1460, .8, geo('stand', { mouth: 'grin', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'টেলিগ্রাফ অপারেটর', { fill: '#1565c0', rot: -2, delay: .2, fs: 60 })}`) });
// 4
scenes.push({ narration: 'ক্রমাগত চেষ্টার পর ১৮৭৭ সালে তিনি ফনোগ্রাফ বানালেন। এই যন্ত্র কথা আর গান রেকর্ড করে আবার বাজাতে পারত। মানুষ প্রথমবার নিজের কণ্ঠ ফিরে শুনল।', caption: 'ফনোগ্রাফ, ১৮৭৭',
  svg: svg(``, `<rect width="1080" height="1920" fill="#f3e5f5"/>
${bench(1330)}
<g transform="translate(540,1270)">${phono(0, 0, 1.2)}</g>
${at(230, 1460, .8, geo('think', { mouth: 'smile', brows: 'up', px: 6 }), '')}${at(860, 1460, .75, kid('stand', { mouth: 'o', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'ফনোগ্রাফ, ১৮৭৭', { fill: '#4a148c', rot: -2, delay: .2, fs: 66 })}`) });
// 5
scenes.push({ narration: 'তখন আলো ছিল গ্যাসের বাতি বা মোমবাতি, যা বিপজ্জনক আর ধোঁয়াটে ছিল। এডিসন চাইলেন এমন একটা বাতি, যা অনেকদিন জ্বলবে আর সস্তায় সবাই কিনতে পারবে।', caption: 'আলোর সমস্যা',
  svg: svg(``, `<rect width="1080" height="1920" fill="#1a237e"/>
<rect y="1330" width="1080" height="590" fill="#283593" stroke="${O}" stroke-width="6"/>
${bulb(540, 900, 1.2, false)}
${at(540, 1460, .9, geo('think', { mouth: 'hmm', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'সস্তা ও টেকসই আলো', { fill: '#ffeb3b', rot: -2, delay: .2, fs: 58 })}`) });
// 6
scenes.push({ narration: 'নিউ জার্সির মেনলো পার্কে তিনি বিশাল গবেষণাগার বানালেন। সেখানে অনেক রকম সুতো পরীক্ষা করে ১৮৭৯ সালে একটা কার্বন ফিলামেন্টের বাল্ব তৈরি করলেন, যা অনেকক্ষণ জ্বলত।', caption: 'মেনলো পার্ক, ১৮৭৯',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff3e0"/>
${bench(1330)}
<g transform="translate(540,1000)">${bulb(0, 0, 1.6, true)}</g>
${at(900, 1460, .8, geo('stand', { mouth: 'grin', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'বাল্ব জ্বলে উঠল!', { fill: '#e65100', rot: -2, delay: .2, fs: 66 })}`) });
// 7
scenes.push({ narration: 'এডিসন শুধু বাল্ব বানিয়েই থামেননি। বিদ্যুৎ যেন ঘরে ঘরে পৌঁছায়, সেজন্য বিদ্যুৎ কেন্দ্র আর তার বসানোর ব্যবস্থাও করলেন। ১৮৮২ সালে নিউ ইয়র্কে তাঁর প্রথম বিদ্যুৎ কেন্দ্র চালু হলো।', caption: 'বিদ্যুতের নেটওয়ার্ক',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8f5e9"/>
<rect y="1150" width="1080" height="770" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${[[160, 1150], [360, 1100], [560, 1150], [760, 1100], [940, 1150]].map(([x, y]) => `<g transform="translate(${x},${y})"><rect x="-6" y="-200" width="12" height="200" fill="#6d4c41" stroke="${O}" stroke-width="3"/><line x1="-90" y1="-180" x2="90" y2="-180" stroke="#455a64" stroke-width="5"/></g>`).join('')}
${at(540, 1460, .85, kid('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${T(540, 760, 'ঘরে ঘরে বিদ্যুৎ', 80, '#1b5e20', 'class="pop"')}`) });
// 8
scenes.push({ narration: 'এডিসনের নামে আছে এক হাজারের বেশি পেটেন্ট। কিন্তু তিনি বিশ্বাস করতেন, বিজ্ঞান মানে অনেক ব্যর্থতার পর আরেকবার চেষ্টা করা। তাঁর বিখ্যাত একটা কথা, প্রতিভা হলো এক শতাংশ অনুপ্রেরণা আর নিরানব্বই শতাংশ ঘাম।', caption: 'এক শতাংশ অনুপ্রেরণা',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff8e1"/>
${bench(1330)}
<g transform="translate(540,1000)">${bulb(0, 0, 1.2, false)}</g>
${at(230, 1460, .8, geo('stand', { mouth: 'smile', brows: 'normal', px: 4 }), '')}${at(870, 1460, .75, kid('think', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'অনুপ্রেরণা ও ঘাম', { fill: '#4e342e', rot: -2, delay: .2, fs: 62 })}`) });
// 9
scenes.push({ narration: 'একটা বাতির আলো থেকে শুরু হলো আধুনিক বিদ্যুতের যুগ। এডিসনের গল্প এখানেই শেষ।', caption: 'এডিসনের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('ed9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#ed9)"/>${P.rays(540, 620, '#ffc93c', .32)}
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 300, 'এডিসনের গল্প শেষ', { fill: '#33691e', rot: -2, delay: .2, fs: 66 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'আলোর বাতি', series: 'আবিষ্কারের গল্প · পর্ব ১২', episode: 12, scientist: 'টমাস আলভা এডিসন',
  summary: 'টেলিগ্রাফের কাজ থেকে শুরু করে এডিসন ফনোগ্রাফ আর টেকসই বাল্ব বানালেন, আর ঘরে ঘরে বিদ্যুৎ পৌঁছানোর পথ খুলে দিলেন।' }, scenes);
console.log('ep12:', scenes.length, 'scenes');
