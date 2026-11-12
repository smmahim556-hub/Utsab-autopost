// আবিষ্কারের গল্প · পর্ব ১১: লুই পাস্তুর. Our own retelling (facts checked: born 1822 at Dole, France; chemist; showed that
// microbes cause fermentation and spoilage, which disproved spontaneous generation with swan-neck flasks; pasteurisation of
// wine and milk, 1860s; anthrax vaccine for animals 1881; rabies vaccine given to a boy bitten by a rabid dog, 1885).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const geo = person({ skin: '#e8b98e', hair: 'short', hairColor: '#5d4037', outfit: 'coat', cloth: '#37474f', legsColor: '#263238' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#2e7d32', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const bench = (y = 1330) => `<rect y="${y}" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/><rect x="120" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/><rect x="930" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/>`;
// Flask with a long S-shaped neck, open to the air (swan-neck flask).
const flask = (x, y, s = 1, liquid = '#c8e6c9') => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-70 0 Q-70 -110 -40 -150 Q-20 -200 -60 -240 Q-30 -270 40 -250 L60 -248 L60 -230 Q0 -230 22 -200 Q-14 -160 -6 -120 Q0 -110 30 -110 L70 -110 L70 0Z" fill="#e3f2fd" stroke="${O}" stroke-width="6"/><path d="M-66 -10 L-66 -60 L66 -60 L66 -10Z" fill="${liquid}"/><path d="M-70 0 L70 0 L70 -110 L30 -110 Q0 -110 -6 -120 Q-14 -160 22 -200 Q0 -230 60 -230 L60 -248 L40 -250 Q-30 -270 -60 -240 Q-20 -200 -40 -150 Q-70 -110 -70 0Z" fill="none" stroke="${O}" stroke-width="6"/></g>`;
const micro = (x, y, r = 10) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7cb342" stroke="${O}" stroke-width="3"/>`;

const scenes = [];
// 1
scenes.push({ narration: 'লুই পাস্তুর জন্মেছিলেন ১৮২২ সালে, ফ্রান্সের ছোট শহর ডোলে। তিনি ছিলেন একজন রসায়নবিদ, যিনি পরে বিজ্ঞানের ইতিহাস বদলে দিলেন।', caption: 'ফ্রান্স, ১৮২২',
  svg: svg(`.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}`, `<defs>${P.grad('pa1', '#cfe9ff', '#f4fbff')}</defs><rect width="1080" height="1920" fill="url(#pa1)"/>
<rect y="1150" width="1080" height="770" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), 'bob')}
${P.label(540, 230, 'ফ্রান্স, ১৮২২', { fill: '#33691e', rot: -3, delay: .3, fs: 66 })}`) });
// 2
scenes.push({ narration: 'তখনকার অনেকেই বিশ্বাস করতেন, পচা মাংস বা টক দুধ নিজে থেকেই তৈরি হয়। পাস্তুর ভাবলেন, আসলে বাতাস থেকে ছোট্ট জীবাণু এসে এসব নষ্ট করে।', caption: 'জীবাণু কোথা থেকে?',
  svg: svg(`.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}`, `<rect width="1080" height="1920" fill="#fff8e1"/>
${bench(1330)}
${micro(300, 1000, 14)}${micro(420, 900, 10)}${micro(640, 940, 12)}${micro(780, 860, 9)}${micro(520, 1060, 11)}${micro(860, 1010, 13)}
${at(540, 1460, .9, geo('think', { mouth: 'smile', brows: 'up', px: 6 }), 'bob')}
${P.label(540, 230, 'জীবাণু কোথা থেকে?', { fill: '#4e342e', rot: -2, delay: .2, fs: 66 })}
${T(540, 720, 'বাতাসে ভাসা জীবাণু', 76, '#e63946', 'class="pop"')}`) });
// 3
scenes.push({ narration: 'তিনি একটা কাঁচের ফ্লাস্ক নিলেন, যার গলা ছিল রাজহাঁসের গলার মতো বাঁকানো। ফ্লাস্কে ছিল পুষ্টিকর ঝোল, আর বাইরের ধুলো সেই বাঁকে আটকে যেত।', caption: 'বাঁকানো গলা',
  svg: svg(`.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}`, `<rect width="1080" height="1920" fill="#e8f5e9"/>
${bench(1330)}
<g transform="translate(540,1000)">${flask(0, 0, 1.6)}</g>
${at(900, 1460, .8, geo('stand', { mouth: 'smile', brows: 'normal', px: -6 }), 'bob')}
${P.label(540, 230, 'রাজহাঁসের গলার ফ্লাস্ক', { fill: '#1b5e20', rot: -2, delay: .2, fs: 54 })}`) });
// 4
scenes.push({ narration: 'ফ্লাস্ক কয়েক সপ্তাহ পড়ে থাকল, কিন্তু ঝোল পচল না। ধুলো আটকে ছিল বলেই ভেতরের জীবাণু ঢুকতে পারেনি। তাহলে জীবাণু বাতাস থেকেই আসে, নিজে থেকে জন্মায় না।', caption: 'পচল না কেন?',
  svg: svg(`.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}`, `<rect width="1080" height="1920" fill="#e3f2fd"/>
${bench(1330)}
<g transform="translate(540,1000)">${flask(0, 0, 1.6, '#dcedc8')}</g>
${at(200, 1460, .8, kid('think', { mouth: 'o', brows: 'up', px: 4 }), 'bob')}
${T(540, 470, 'ঝোল পরিষ্কার!', 84, '#1565c0', 'class="pop"')}`) });
// 5
scenes.push({ narration: 'এরপর পাস্তুর দেখালেন, দুধ আর মদকে কিছুক্ষণ গরম করলে ভেতরের ক্ষতিকর জীবাণু মরে যায়। এই পদ্ধতির নাম হলো পাস্তুরাইজেশন। আজও বহু দুধের প্যাকেটে এই প্রক্রিয়া চলে।', caption: 'পাস্তুরাইজেশন',
  svg: svg(`.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}`, `<rect width="1080" height="1920" fill="#fff3e0"/>
${bench(1330)}
<g transform="translate(540,1200)"><rect x="-120" y="-120" width="240" height="250" rx="20" fill="#ffffff" stroke="${O}" stroke-width="6"/><rect x="-100" y="-40" width="200" height="130" fill="#fff9c4" stroke="${O}" stroke-width="4"/><rect x="-60" y="-190" width="120" height="50" rx="8" fill="#e53935" stroke="${O}" stroke-width="5"/></g>
${at(900, 1460, .8, geo('stand', { mouth: 'grin', brows: 'up', px: -6 }), 'bob')}
${P.label(540, 230, 'পাস্তুরাইজেশন', { fill: '#e65100', rot: -2, delay: .2, fs: 70 })}
${T(540, 720, 'জীবাণু মরে যায়', 76, '#e63946', 'class="pop"')}`) });
// 6
scenes.push({ narration: 'পাস্তুর গবাদি পশু আর ভেড়ার অ্যানথ্রাক্স রোগের জন্য টিকা বানালেন। ১৮৮১ সালে তাঁর পরীক্ষায় টিকা নেওয়া ভেড়ারা বেঁচে গেল, অথচ টিকা না নেওয়াগুলো মারা গেল।', caption: 'প্রথম টিকা',
  svg: svg(`.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}`, `<rect width="1080" height="1920" fill="#f3e5f5"/>
<rect y="1150" width="1080" height="770" fill="#a5d6a7" stroke="${O}" stroke-width="6"/>
<g transform="translate(260,1300)"><ellipse rx="130" ry="90" fill="#fafafa" stroke="${O}" stroke-width="6"/><circle cx="-120" cy="-60" r="50" fill="#fafafa" stroke="${O}" stroke-width="6"/></g>
<g transform="translate(820,1300)"><ellipse rx="130" ry="90" fill="#fafafa" stroke="${O}" stroke-width="6"/><circle cx="120" cy="-60" r="50" fill="#fafafa" stroke="${O}" stroke-width="6"/></g>
${at(540, 1440, .7, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), 'bob')}
${P.label(540, 230, 'ভেড়ার টিকা, ১৮৮১', { fill: '#4a148c', rot: -2, delay: .2, fs: 60 })}
${T(540, 760, 'টিকা নেওয়া ভেড়া বাঁচল!', 66, '#2e7d32', 'class="pop"')}`) });
// 7
scenes.push({ narration: 'ক্ষিপ্ত কুকুরের কামড়ে জলাতঙ্ক রোগ হয়, আর তখন তার কোনো চিকিৎসা ছিল না। ১৮৮৫ সালে পাস্তুর নয় বছরের এক ছেলে জোসেফ মাইস্টারকে নিজের বানানো টিকা দিলেন। ছেলেটি বেঁচে গেল।', caption: 'জলাতঙ্কের টিকা',
  svg: svg(`.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}`, `<rect width="1080" height="1920" fill="#fbe9e7"/>
<rect y="1150" width="1080" height="770" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${at(330, 1440, .8, kid('think', { mouth: 'o', brows: 'up', px: 6 }), 'bob')}${at(720, 1440, .9, geo('stand', { mouth: 'smile', brows: 'normal', px: -6 }), 'bob')}
${P.label(540, 230, 'জলাতঙ্ক, ১৮৮৫', { fill: '#bf360c', rot: -2, delay: .2, fs: 66 })}
${T(540, 760, 'ছেলেটি বেঁচে গেল', 80, '#2e7d32', 'class="pop"')}`) });
// 8
scenes.push({ narration: 'পাস্তুরের কাজ থেকেই প্রমাণ হলো, অনেক রোগ জীবাণুর কারণে হয়। এ থেকে এল জীবাণু তত্ত্ব, আর হাসপাতালে সার্জারির আগে হাত ধোয়া ও যন্ত্র জীবাণুমুক্ত রাখার নিয়ম।', caption: 'জীবাণু তত্ত্ব',
  svg: svg(`.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}`, `<rect width="1080" height="1920" fill="#e8f5e9"/>
${bench(1330)}
<g transform="translate(540,1080)"><rect x="-190" y="-120" width="380" height="220" rx="16" fill="#ffffff" stroke="${O}" stroke-width="6"/>${micro(-120, -40, 14)}${micro(-40, -60, 12)}${micro(40, -30, 15)}${micro(110, -70, 11)}${micro(-80, 30, 10)}${micro(20, 40, 13)}${micro(120, 20, 12)}</g>
${at(900, 1460, .8, geo('think', { mouth: 'smile', brows: 'up', px: -6 }), 'bob')}
${P.label(540, 230, 'জীবাণু তত্ত্ব', { fill: '#1b5e20', rot: -2, delay: .2, fs: 70 })}`) });
// 9
scenes.push({ narration: 'একজন রসায়নবিদের কৌতূহল থেকে জন্মাল আধুনিক চিকিৎসার এক বড় ভিত্তি। পাস্তুরের গল্প এখানেই শেষ।', caption: 'পাস্তুরের গল্প শেষ',
  svg: svg(`.bob{animation:bb 1.2s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-14px)}}`, `<defs>${P.grad('pa9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#pa9)"/>${P.rays(540, 620, '#ffc93c', .32)}
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), 'bob')}
${P.label(540, 300, 'পাস্তুরের গল্প শেষ', { fill: '#33691e', rot: -2, delay: .2, fs: 66 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'জীবাণুর জগৎ', series: 'আবিষ্কারের গল্প · পর্ব ১১', episode: 11, scientist: 'লুই পাস্তুর',
  summary: 'ফ্লাস্কের বাঁকানো গলায় ধুলো আটকে গেল, আর ঝোল পচল না। এই পরীক্ষা থেকেই পাস্তুর প্রমাণ করলেন রোগের পেছনে জীবাণু।' }, scenes);
console.log('ep11:', scenes.length, 'scenes');
