// সাফল্যের গল্প · পর্ব ১: এডউইন বার্নস. New series (owner 2026-11-18) from the stories in Napoleon Hill's 'Think and Grow Rich'
// (owner's Bengali translation by Anish Das Apu), retold in our own words. Facts as the book states them: Barnes wanted to work
// WITH Edison, not for him; with no train fare he rode a freight train to East Orange, New Jersey; Edison thought he looked like
// a tramp but saw his determination and gave him an ordinary office job; about five years later Edison's new dictating machine
// (the Ediphone) came out and the salesmen didn't want it; Barnes said he could sell it, did, and got the right to sell it across
// the country ('Made by Edison and installed by Barnes'); a partnership of 30+ years that made him rich.
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const bar = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#5d4037', outfit: 'coat', cloth: '#8d6e63', legsColor: '#4e342e' });
const barS = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#5d4037', outfit: 'coat', cloth: '#1565c0', legsColor: '#263238' });
const edi = person({ skin: '#f1c28f', hair: 'short', hairColor: '#e0e0e0', outfit: 'coat', cloth: '#37474f', legsColor: '#263238' });
const sales = person({ skin: '#e0ac69', hair: 'short', hairColor: '#212121', outfit: 'coat', cloth: '#6a1b9a', legsColor: '#37474f' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}">${t}</text>`;
const bulb = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><circle r="90" fill="#fff59d" stroke="${O}" stroke-width="7"/><rect x="-40" y="80" width="80" height="60" fill="#90a4ae" stroke="${O}" stroke-width="6"/><path d="M-30 20 Q0 -40 30 20" stroke="#ff8f00" stroke-width="8" fill="none"/></g>`;
const wagon = (x, y, s = 1, c = '#8d4a2f') => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-260" y="-230" width="520" height="230" fill="${c}" stroke="${O}" stroke-width="7"/>${[-170, -60, 50, 160].map(v => `<path d="M${v} -230 L${v} 0" stroke="${O}" stroke-width="4" opacity=".5"/>`).join('')}<circle cx="-170" cy="20" r="45" fill="#424242" stroke="${O}" stroke-width="6"/><circle cx="170" cy="20" r="45" fill="#424242" stroke="${O}" stroke-width="6"/></g>`;
const machine = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-150" y="-60" width="300" height="120" rx="12" fill="#6d4c41" stroke="${O}" stroke-width="6"/><rect x="-110" y="-150" width="170" height="90" rx="40" fill="#212121" stroke="${O}" stroke-width="6"/><path d="M80 -60 Q160 -200 60 -260" stroke="${O}" stroke-width="10" fill="none"/><path d="M40 -290 L90 -230 L20 -220 Z" fill="#ffca28" stroke="${O}" stroke-width="5"/></g>`;

const scenes = [];
scenes.push({ narration: 'এডউইন বার্নসের মনে ছিল একটাই জেদ। তিনি বিখ্যাত বিজ্ঞানী টমাস এডিসনের কর্মচারী হতে চান না, হতে চান তাঁর অংশীদার!',
  svg: svg(``, `<defs>${P.grad('gs1', '#d6ecff', '#f5fbff')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gs1)"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
${P.cloud(260, 640, 1.6)}${bulb(260, 600, .7)}
${at(700, 1460, .85, bar('think', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'এক অদ্ভুত জেদ', { fill: '#0d47a1', rot: -3, delay: .3, fs: 68 })}`) });
scenes.push({ narration: 'কিন্তু তিনি এডিসনকে চিনতেন না, পকেটে ট্রেনের ভাড়াও ছিল না। তাই মালগাড়িতে চড়েই রওনা দিলেন নিউ জার্সির ইস্ট অরেঞ্জে।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#ffe0b2"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#bcaaa4" stroke="${O}" stroke-width="6"/>
<path d="M-800 1300 L1880 1300" stroke="#5d4037" stroke-width="14"/>
<g class="drift">${wagon(-300, 1255, 1)}${wagon(300, 1255, 1, '#6d4c41')}${wagon(900, 1255, 1)}${wagon(1500, 1255, 1, '#6d4c41')}
${at(300, 1030, .55, bar('point', { mouth: 'grin', brows: 'up', px: 4 }), '')}</g>
${P.label(540, 230, 'মালগাড়িতে চড়ে', { fill: '#bf360c', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: 'এডিসনের সামনে দাঁড়ালেন ময়লা, ছেঁড়া জামায়। দেখতে ভবঘুরের মতো। কিন্তু তাঁর চোখে এমন জেদ ছিল যে এডিসন চোখ ফেরাতে পারলেন না।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#eceff1"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#b0bec5" stroke="${O}" stroke-width="6"/>
${bulb(540, 560, .9)}
${at(260, 1460, .78, bar('stand', { mouth: 'smile', brows: 'angry', px: 4 }), '')}${at(820, 1460, .78, edi('think', { mouth: 'hmm', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'এডিসনের সামনে', { fill: '#37474f', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: 'এডিসন তাঁকে অংশীদার করলেন না, দিলেন অফিসের সাধারণ একটা কাজ, সামান্য বেতনে। বার্নস মন খারাপ করলেন না। স্বপ্নটা আঁকড়ে ধরে কাজ চালিয়ে গেলেন।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff8e1"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#d7ccc8" stroke="${O}" stroke-width="6"/>
<rect x="100" y="1080" width="480" height="40" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${[0, 1, 2].map(i => `<rect x="${150 + i * 40}" y="${960 - i * 25}" width="200" height="${120 + i * 25}" fill="#fffde7" stroke="${O}" stroke-width="5"/>`).join('')}
${at(800, 1460, .8, bar('stand', { mouth: 'smile', brows: 'normal', px: -4 }), '')}
${P.label(540, 230, 'সামান্য চাকরি', { fill: '#4e342e', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: 'দিন গেল, মাস গেল, বছর গেল। প্রায় পাঁচ বছর। বাইরে থেকে কিছুই বদলাল না, কিন্তু বার্নস অপেক্ষা করছিলেন একটা সুযোগের।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#e8eaf6"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#9fa8da" stroke="${O}" stroke-width="6"/>
${[0, 1, 2, 3, 4].map(i => `<g transform="translate(${180 + i * 180},${620 + (i % 2) * 40}) rotate(${(i - 2) * 6})"><rect x="-75" y="-90" width="150" height="180" rx="10" fill="#fff" stroke="${O}" stroke-width="6"/><rect x="-75" y="-90" width="150" height="45" fill="#e53935" stroke="${O}" stroke-width="6"/>${T(0, 50, ['১', '২', '৩', '৪', '৫'][i], 80, '#283593')}</g>`).join('')}
${at(540, 1460, .8, bar('think', { mouth: 'hmm', brows: 'think', px: 0 }), '')}
${P.label(540, 230, 'পাঁচ বছর অপেক্ষা', { fill: '#283593', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'তারপর এডিসন বানালেন কথা রেকর্ড করার নতুন এক যন্ত্র। কিন্তু বিক্রেতারা মুখ ফিরিয়ে নিলেন। বললেন, এ জিনিস কেউ কিনবে না।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff3e0"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#bcaaa4" stroke="${O}" stroke-width="6"/>
${machine(540, 700, 1.2)}
${at(220, 1460, .72, sales('stand', { mouth: 'frown', brows: 'angry', px: 4 }), '')}${at(860, 1460, .72, sales('stand', { mouth: 'frown', brows: 'think', px: -4 }), '')}
${P.label(540, 230, 'কেউ কিনবে না!', { fill: '#bf360c', rot: -2, delay: .2, fs: 68 })}`) });
scenes.push({ narration: 'বার্নস এগিয়ে এসে বললেন, আমি বিক্রি করব! আর সত্যিই করলেন। একের পর এক অফিসে যন্ত্রটা পৌঁছে দিলেন।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#e1f5fe"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#90caf9" stroke="${O}" stroke-width="6"/>
${machine(220, 620, .7)}${machine(860, 620, .7)}
${at(540, 1460, .85, barS('point', { mouth: 'shout', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'আমি বিক্রি করব!', { fill: '#01579b', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'এডিসন তাঁকে দিলেন সারা দেশে যন্ত্রটা বিক্রির অধিকার। স্লোগান হলো, এডিসনের তৈরি, বার্নসের বসানো। ত্রিশ বছরের বেশি টিকে থাকা এই অংশীদারিতে বার্নস হলেন ধনী।',
  svg: svg(``, `<defs>${P.grad('gs8', '#fff3c4', '#fffdf2')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gs8)"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#ffe082" stroke="${O}" stroke-width="6"/>
<g transform="translate(540,620)"><rect x="-380" y="-110" width="760" height="220" rx="20" fill="#fff" stroke="${O}" stroke-width="7"/>${T(0, -15, 'এডিসনের তৈরি', 70, '#c62828')}${T(0, 75, 'বার্নসের বসানো', 70, '#1565c0')}</g>
${at(320, 1460, .78, edi('stand', { mouth: 'smile', brows: 'normal', px: 4 }), '')}${at(760, 1460, .78, barS('point', { mouth: 'grin', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'অবশেষে অংশীদার!', { fill: '#e65100', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'পরিষ্কার একটা চাওয়া, আর হাল না ছাড়া। বার্নস দেখালেন, স্বপ্ন সত্যি হতে সময় লাগে, কিন্তু হয়। বার্নসের গল্প এখানেই শেষ।', caption: 'বার্নসের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('gs9', '#ffe0a3', '#fff7e0')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gs9)"/>${P.rays(540, 520, '#ffc93c', .32)}
${bulb(540, 440, .8)}
${at(540, 1420, 1, barS('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 200, 'বার্নসের গল্প শেষ', { fill: '#4e342e', rot: -2, delay: .2, fs: 62 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'এডিসনের অংশীদার', series: 'সাফল্যের গল্প · পর্ব ১', episode: 1, scientist: 'এডউইন বার্নস', tags: ['#অনুপ্রেরণা', '#সাফল্য'],
  summary: 'ট্রেনের ভাড়া ছিল না, ছিল শুধু জেদ। মালগাড়িতে চড়ে এসে একদিন টমাস এডিসনের অংশীদার হলেন এডউইন বার্নস।' }, scenes);
console.log('ep25:', scenes.length, 'scenes');
