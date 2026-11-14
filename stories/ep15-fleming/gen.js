// আবিষ্কারের গল্প · পর্ব ১৫: আলেকজান্ডার ফ্লেমিং. Our own retelling (facts checked: born 1881 in Ayrshire, Scotland;
// in 1928 noticed a mould killing bacteria in a dish, which led to penicillin; shared the 1945 Nobel Prize in Physiology or
// Medicine with Howard Florey and Ernst Chain; warned that misuse of antibiotics lets germs become resistant).
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const geo = person({ skin: '#f1c28f', hair: 'short', hairColor: '#8d6e63', outfit: 'coat', cloth: '#37474f', legsColor: '#263238' });
const kid = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', outfit: 'coat', cloth: '#2e7d32', legsColor: '#4e342e' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}" ${extra}>${t}</text>`;
const bench = (y = 1330) => `<rect y="${y}" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/><rect x="120" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/><rect x="930" y="${y + 18}" width="30" height="300" fill="#6d4c41" stroke="${O}" stroke-width="5"/>`;
const dish = (x, y, s = 1, mould = false) => `<g transform="translate(${x},${y}) scale(${s})"><circle r="170" fill="#f5f5f5" stroke="${O}" stroke-width="8"/><circle r="140" fill="#e3f2fd" stroke="${O}" stroke-width="4"/>${mould ? `<circle cx="-40" cy="-30" r="50" fill="#7cb342" opacity=".9"/><circle cx="50" cy="20" r="42" fill="#9ccc65" opacity=".9"/><circle cx="-10" cy="60" r="30" fill="#558b2f" opacity=".9"/><circle r="70" fill="none" stroke="#fff176" stroke-width="10" stroke-dasharray="20 14" opacity=".8"/>` : `<circle cx="-50" cy="-20" r="16" fill="#8e24aa" opacity=".7"/><circle cx="40" cy="30" r="14" fill="#8e24aa" opacity=".7"/><circle cx="10" cy="-60" r="12" fill="#8e24aa" opacity=".7"/><circle cx="60" cy="-40" r="10" fill="#8e24aa" opacity=".7"/>`}</g>`;
const bottle = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-50" y="-120" width="100" height="170" rx="16" fill="#e3f2fd" stroke="${O}" stroke-width="6"/><rect x="-60" y="-160" width="120" height="50" rx="8" fill="#ef5350" stroke="${O}" stroke-width="5"/><rect x="-30" y="-20" width="60" height="50" fill="#ffffff" stroke="${O}" stroke-width="3"/></g>`;
const medal = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-40 -180 L-10 -40 M40 -180 L10 -40" stroke="#1565c0" stroke-width="16" fill="none"/><circle cy="20" r="110" fill="#ffc93c" stroke="${O}" stroke-width="8"/></g>`;

const scenes = [];
// 1
scenes.push({ narration: 'আলেকজান্ডার ফ্লেমিং জন্মেছিলেন ১৮৮১ সালে, স্কটল্যান্ডের আয়রশায়ারে। বড় হয়ে তিনি হলেন ডাক্তার ও গবেষক।',
  svg: svg(``, `<defs>${P.grad('fl1', '#cfe9ff', '#f4fbff')}</defs><rect width="1080" height="1920" fill="url(#fl1)"/>
<rect y="1150" width="1080" height="770" fill="#9ccc65" stroke="${O}" stroke-width="6"/>
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 230, 'স্কটল্যান্ড, ১৮৮১', { fill: '#33691e', rot: -3, delay: .3, fs: 62 })}`) });
// 2
scenes.push({ narration: 'ফ্লেমিং ল্যাবে ব্যাকটেরিয়া নিয়ে কাজ করতেন। তাঁর টেবিলে থাকত অনেক কাচের থালা, যাতে ব্যাকটেরিয়া বাড়ানো হতো।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e8f5e9"/>
${bench(1330)}
<g transform="translate(540,1180)">${dish(0, 0, 1.2, false)}</g>
${at(860, 1460, .8, geo('think', { mouth: 'hmm', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'ব্যাকটেরিয়ার থালা', { fill: '#1b5e20', rot: -2, delay: .2, fs: 56 })}`) });
// 3
scenes.push({ narration: 'ছুটি থেকে ফিরে ১৯২৮ সালে তিনি দেখলেন, একটা থালায় ছাঁচ জন্মেছে, আর তার চারপাশের ব্যাকটেরিয়া মরে গেছে।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#f3e5f5"/>
${bench(1330)}
<g transform="translate(540,1180)">${dish(0, 0, 1.2, true)}</g>
${at(230, 1460, .8, geo('stand', { mouth: 'o', brows: 'up', px: 6 }), '')}
${P.label(540, 230, 'ছাঁচ আর ফাঁকা জায়গা', { fill: '#4a148c', rot: -2, delay: .2, fs: 56 })}`) });
// 4
scenes.push({ narration: 'এই ছাঁচ থেকেই তৈরি হলো পেনিসিলিন, মানুষের প্রথম বড় জীবাণু-বিরোধী ওষুধগুলোর একটি।',
  svg: svg(``, `<defs>${P.grad('fl4', '#fff3c4', '#fffdf2')}</defs><rect width="1080" height="1920" fill="url(#fl4)"/>
${bench(1330)}
<g transform="translate(540,1180)">${bottle(0, 0, 1.6)}</g>
${at(860, 1460, .8, geo('stand', { mouth: 'smile', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'পেনিসিলিন', { fill: '#8d6e00', rot: -2, delay: .2, fs: 66 })}`) });
// 5
scenes.push({ narration: 'যুদ্ধের সময় আর পরে এই ওষুধ অসংখ্য মানুষের জীবন বাঁচাল। যেসব ক্ষত আগে মারাত্মক ছিল, সেগুলো সেরে উঠতে লাগল।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e1f5fe"/>
<rect y="1330" width="1080" height="18" fill="#8d6e63" stroke="${O}" stroke-width="5"/>
${at(340, 1460, .85, kid('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}${at(740, 1460, .85, geo('stand', { mouth: 'grin', brows: 'up', px: 0 }), '')}
${T(540, 760, 'জীবন বাঁচল', 84, '#01579b', 'class="pop"')}`) });
// 6
scenes.push({ narration: 'ফ্লেমিং, হাওয়ার্ড ফ্লোরি আর আর্নস্ট চেইন ১৯৪৫ সালে যৌথভাবে নোবেল পুরস্কার পেলেন।',
  svg: svg(``, `<defs>${P.grad('fl6', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#fl6)"/>${P.rays(540, 620, '#ffc93c', .25)}
${medal(540, 540, 1)}
${T(540, 585, '১৯৪৫', 80, '#5d4037')}
${at(540, 1460, .9, geo('stand', { mouth: 'smile', brows: 'up', px: 0 }), '')}
${P.label(540, 300, 'নোবেল পুরস্কার, ১৯৪৫', { fill: '#8d6e00', rot: -2, delay: .2, fs: 56 })}`) });
// 7
scenes.push({ narration: 'ফ্লেমিং নিজেই সতর্ক করেছিলেন। ওষুধ ঠিকমতো না খেলে জীবাণু ধীরে ধীরে তার বিরুদ্ধে প্রতিরোধ গড়ে তোলে।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#fff8e1"/>
${bench(1330)}
<polygon points="540,760 680,1000 400,1000" fill="#ffca28" stroke="${O}" stroke-width="8"/>
${T(540, 930, '!', 120, '#b71c1c')}
${at(860, 1460, .8, geo('think', { mouth: 'hmm', brows: 'up', px: -6 }), '')}
${P.label(540, 230, 'সাবধান!', { fill: '#b71c1c', rot: -2, delay: .2, fs: 66 })}`) });
// 8
scenes.push({ narration: 'আজও বিজ্ঞানে দরকার ধৈর্য আর খেয়াল রাখা। একটা থালার ছাঁচও হয়ে উঠতে পারে নতুন আবিষ্কারের শুরু।',
  svg: svg(``, `<rect width="1080" height="1920" fill="#e0f2f1"/>
${bench(1330)}
<g transform="translate(540,1180)">${dish(0, 0, 1, true)}</g>
${at(230, 1460, .8, geo('stand', { mouth: 'smile', brows: 'normal', px: 4 }), '')}${at(870, 1460, .75, kid('think', { mouth: 'smile', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'খেয়াল রাখো', { fill: '#004d40', rot: -2, delay: .2, fs: 66 })}`) });
// 9
scenes.push({ narration: 'একটা ভুলে পড়ে থাকা ছাঁচ থেকে শুরু হলো নতুন যুগ। আলেকজান্ডার ফ্লেমিংয়ের গল্প এখানেই শেষ।', caption: 'আলেকজান্ডার ফ্লেমিংয়ের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('fl9', '#ffe0a3', '#fff7e0')}</defs><rect width="1080" height="1920" fill="url(#fl9)"/>${P.rays(540, 620, '#ffc93c', .32)}
<g transform="translate(540,600)">${bottle(0, 0, 1.2)}</g>
${at(540, 1420, 1, geo('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 300, 'ফ্লেমিংয়ের গল্প শেষ', { fill: '#33691e', rot: -2, delay: .2, fs: 62 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'ছাঁচের জাদু', series: 'আবিষ্কারের গল্প · পর্ব ১৫', episode: 15, scientist: 'আলেকজান্ডার ফ্লেমিং',
  summary: 'একটা থালায় জন্মানো ছাঁচ থেকে আলেকজান্ডার ফ্লেমিং আবিষ্কার করলেন পেনিসিলিন, যা বহু মানুষের জীবন বাঁচিয়েছে।' }, scenes);
console.log('ep15:', scenes.length, 'scenes');
