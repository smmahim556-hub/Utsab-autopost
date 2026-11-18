// সাফল্যের গল্প · পর্ব ৩: ছোট্ট মেয়ে আর পঞ্চাশ সেন্ট. From 'Think and Grow Rich' (owner's book), own words. As the book tells it:
// at Darby's uncle's old grist mill a tenant farmer's little daughter came in and said her mother had sent her for fifty cents; the
// uncle told her roughly to go home; she did not move; he got angry and stepped toward her; she stepped forward, looked him in the
// eye and cried 'My mother has to have that fifty cents!'; he stopped, gave her the half dollar and sat stunned; Darby, who saw it,
// later said many of his best sales came after people first said no.
const { O, person, props: P, svg, writeEpisode } = require('../lib');

const unc = person({ skin: '#f1c28f', hair: 'bald', hairColor: '#9e9e9e', outfit: 'tunic', cloth: '#c62828', legsColor: '#4e342e' });
const girl = person({ skin: '#8d5524', hair: 'long', hairColor: '#212121', outfit: 'robe', cloth: '#f06292', legsColor: '#5d4037' });
const dar = person({ skin: '#f6cfa6', hair: 'short', hairColor: '#6d4c41', outfit: 'coat', cloth: '#1565c0', legsColor: '#263238' });
const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x},${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
const T = (x, y, t, fs, c) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${c}">${t}</text>`;
const mill = `<rect x="-800" width="2680" height="1920" fill="#d7ccc8"/>${[-700, -350, 0, 350, 700, 1050, 1400].map(x => `<rect x="${x}" y="0" width="340" height="1330" fill="none" stroke="#a1887f" stroke-width="6"/>`).join('')}
<g transform="translate(150,900)"><circle r="160" fill="#9e9e9e" stroke="${O}" stroke-width="8"/><circle r="30" fill="#616161" stroke="${O}" stroke-width="6"/></g>
<rect x="-800" y="1330" width="2680" height="590" fill="#8d6e63" stroke="${O}" stroke-width="6"/>`;
const coin = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><circle r="70" fill="#cfd8dc" stroke="${O}" stroke-width="7"/>${T(0, 22, '৫০', 60, '#455a64')}</g>`;

const scenes = [];
scenes.push({ narration: 'ডার্বির চাচার ছিল একটা পুরোনো গম ভাঙানোর কল। একদিন সেখানে এল এক গরিব চাষির ছোট্ট মেয়ে।',
  svg: svg(``, `${mill}
${at(380, 1460, .8, unc('stand', { mouth: 'hmm', brows: 'normal', px: 4 }), '')}${at(800, 1460, .55, girl('stand', { mouth: 'smile', brows: 'normal', px: -4 }), '')}
${P.label(540, 230, 'পুরোনো কলঘর', { fill: '#4e342e', rot: -3, delay: .3, fs: 70 })}`) });
scenes.push({ narration: 'মেয়েটি চুপচাপ দাঁড়িয়ে বলল, মা পঞ্চাশ সেন্ট চেয়ে পাঠিয়েছে।',
  svg: svg(``, `${mill}${coin(800, 640)}
${at(380, 1460, .8, unc('stand', { mouth: 'frown', brows: 'think', px: 4 }), '')}${at(800, 1460, .55, girl('point', { mouth: 'o', brows: 'normal', px: -4 }), '')}
${P.label(540, 230, 'পঞ্চাশ সেন্ট', { fill: '#455a64', rot: -2, delay: .2, fs: 70 })}`) });
scenes.push({ narration: 'চাচা কড়া গলায় বললেন, না! বাড়ি যাও! কিন্তু মেয়েটি একচুলও নড়ল না।',
  svg: svg(``, `${mill}${P.burst(330, 560, 120, '#ffcdd2')}${T(330, 585, 'না!', 70, '#c62828')}
${at(380, 1460, .8, unc('point', { mouth: 'shout', brows: 'angry', px: 4 }), '')}${at(800, 1460, .55, girl('stand', { mouth: 'hmm', brows: 'normal', px: -4 }), '')}
${P.label(540, 230, 'বাড়ি যাও!', { fill: '#c62828', rot: -2, delay: .2, fs: 72 })}`) });
scenes.push({ narration: 'চাচা রেগে গিয়ে তার দিকে এগিয়ে গেলেন। সবাই ভাবল, এবার মেয়েটি ভয়ে পালাবে।',
  svg: svg(``, `${mill}
${at(500, 1460, .85, unc('point', { mouth: 'shout', brows: 'angry', px: 4 }), '')}${at(860, 1460, .55, girl('stand', { mouth: 'hmm', brows: 'up', px: -4 }), '')}
${P.label(540, 230, 'রেগে গেলেন চাচা', { fill: '#b71c1c', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'কিন্তু মেয়েটি উল্টো এক পা এগিয়ে এল। চোখে চোখ রেখে চিৎকার করে বলল, আমার মায়ের পঞ্চাশ সেন্ট লাগবেই!',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#fff3e0"/>${P.rays(700, 700, '#ffcc80', .35)}
<rect x="-800" y="1330" width="2680" height="590" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${at(260, 1460, .8, unc('stand', { mouth: 'o', brows: 'up', px: 4 }), '')}${at(720, 1460, .7, girl('point', { mouth: 'shout', brows: 'angry', px: -4 }), '')}
${P.label(540, 230, 'লাগবেই!', { fill: '#e65100', rot: -2, delay: .2, fs: 80 })}`) });
scenes.push({ narration: 'চাচা থমকে গেলেন। চুপচাপ পকেট থেকে আধা ডলার বের করে মেয়েটির হাতে দিলেন।',
  svg: svg(``, `${mill}${coin(600, 760, .8)}
${at(400, 1460, .8, unc('point', { mouth: 'hmm', brows: 'normal', px: 4 }), '')}${at(800, 1460, .55, girl('stand', { mouth: 'smile', brows: 'normal', px: -4 }), '')}
${P.label(540, 230, 'হার মানলেন চাচা', { fill: '#4e342e', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'মেয়েটি চলে গেল। আর চাচা অনেকক্ষণ জানালার দিকে তাকিয়ে বসে রইলেন। ছোট্ট একটা মেয়ে তাঁকে হারিয়ে দিল, শুধু অটল ইচ্ছা দিয়ে!',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#d7ccc8"/>
<rect x="340" y="420" width="400" height="380" fill="#bbdefb" stroke="${O}" stroke-width="8"/><path d="M540 420 L540 800 M340 610 L740 610" stroke="${O}" stroke-width="6"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#8d6e63" stroke="${O}" stroke-width="6"/>
${at(540, 1460, .85, unc('think', { mouth: 'hmm', brows: 'think', px: 0 }), '')}
${P.label(540, 230, 'অবাক চাচা', { fill: '#37474f', rot: -2, delay: .2, fs: 72 })}`) });
scenes.push({ narration: 'ঘটনাটা দেখেছিলেন ডার্বি। পরে বিমা বিক্রির কাজে তিনি বুঝলেন, প্রথম না-টাই শেষ কথা নয়। তাঁর অনেক বড় বিক্রি হয়েছিল ঠিক না শোনার পরেই।',
  svg: svg(``, `<rect x="-800" width="2680" height="1920" fill="#e3f2fd"/>
<rect x="-800" y="1330" width="2680" height="590" fill="#90caf9" stroke="${O}" stroke-width="6"/>
<g transform="translate(300,620)"><rect x="-150" y="-110" width="300" height="220" rx="16" fill="#fff" stroke="${O}" stroke-width="7"/>${T(0, 30, 'না', 100, '#c62828')}</g>
<path d="M480 620 L600 620" stroke="${O}" stroke-width="12"/><path d="M600 620 L560 590 M600 620 L560 650" stroke="${O}" stroke-width="12"/>
<g transform="translate(780,620)"><rect x="-150" y="-110" width="300" height="220" rx="16" fill="#fff" stroke="${O}" stroke-width="7"/>${T(0, 30, 'হ্যাঁ', 100, '#2e7d32')}</g>
${at(540, 1460, .85, dar('point', { mouth: 'smile', brows: 'up', px: 0 }), '')}
${P.label(540, 230, 'না-এর পরেই হ্যাঁ', { fill: '#0d47a1', rot: -2, delay: .2, fs: 66 })}`) });
scenes.push({ narration: 'যা চান, তা নিয়ে অটল থাকুন। ভয় না পেয়ে আরেকবার চাইলে অনেক সময় না-ও হ্যাঁ হয়ে যায়। এই গল্প এখানেই শেষ।', caption: 'পঞ্চাশ সেন্টের গল্প শেষ',
  svg: svg(``, `<defs>${P.grad('gf9', '#ffe0a3', '#fff7e0')}</defs><rect x="-800" width="2680" height="1920" fill="url(#gf9)"/>${P.rays(540, 520, '#ffc93c', .32)}
${coin(540, 450, 1.2)}
${at(540, 1420, .8, girl('stand', { mouth: 'smile', brows: 'normal', px: 0 }), '')}
${P.label(540, 200, 'পঞ্চাশ সেন্টের গল্প শেষ', { fill: '#4e342e', rot: -2, delay: .2, fs: 56 })}
<g transform="translate(540,1240)"><g class="btn"><rect x="-230" y="-70" width="460" height="130" rx="65" fill="#e63946" stroke="#fff" stroke-width="7"/><text x="0" y="22" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="72" fill="#fff">ফলো করুন ▸</text></g></g>`) });

writeEpisode(__dirname, { title: 'ছোট্ট মেয়ে আর পঞ্চাশ সেন্ট', series: 'সাফল্যের গল্প · পর্ব ৩', episode: 3, scientist: 'অটল ইচ্ছা', tags: ['#অনুপ্রেরণা', '#সাফল্য'],
  summary: 'বড়দের ধমকেও এক পা পিছু হটেনি ছোট্ট মেয়েটি। তার অটল ইচ্ছার কাছে হার মানলেন কলের মালিক।' }, scenes);
console.log('ep27:', scenes.length, 'scenes');
