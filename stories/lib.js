// Drawing kit for the cartoon story episodes (stories/epNN-*/gen.js): flat 2D characters and props as SVG strings.
// Every character stands with its feet at (0,0) and is about 780 units tall; place it with translate(x,y) scale(s).
const fs = require('fs');
const path = require('path');

const O = '#3b2a20';
const pts = a => a.map(p => p.join(',')).join(' ');
const limb = (a, c, w) => `<polyline points="${pts(a)}" fill="none" stroke="${O}" stroke-width="${w + 12}" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${pts(a)}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

// A person: { skin, hair: 'long'|'bald'|'short', hairColor, beard: ''|'long'|'short', beardColor, outfit: 'robe'|'coat'|'tunic',
//   cloth, sash, trim, crown, legsColor }. face: { px, py, mouth: smile|o|grin|hmm|frown|shout, brows: normal|up|think|angry }
function person(c) {
  const C = Object.assign({ skin: '#f6cfa6', hair: 'short', hairColor: '#4a2c1a', beard: '', beardColor: '#fff', outfit: 'robe', cloth: '#f4f1e8', sash: '', trim: '', crown: false, legsColor: '#7a4a2a' }, c);
  function head({ px = 0, py = 0, mouth = 'smile', brows = 'normal' } = {}) {
    const hc = C.hairColor;
    const back = { long: `<path d="M-100 -640 Q-112 -770 0 -778 Q112 -770 100 -640 Q118 -575 96 -530 Q58 -548 66 -615 L-66 -615 Q-58 -548 -96 -530 Q-118 -575 -100 -640Z" fill="${hc}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>`,
      bald: `<path d="M-74 -690 Q-118 -690 -112 -640 Q-126 -600 -88 -592 Z M74 -690 Q118 -690 112 -640 Q126 -600 88 -592 Z" fill="${hc}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>`,
      short: '' }[C.hair];
    const front = { long: `<path d="M-82 -676 Q-72 -762 0 -758 Q76 -762 84 -676 Q46 -724 6 -706 Q-34 -728 -82 -676Z" fill="${hc}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>`,
      bald: `<ellipse cx="-20" cy="-712" rx="20" ry="9" fill="#fff" opacity=".5"/>`,
      short: `<path d="M-80 -660 Q-86 -752 0 -756 Q86 -752 80 -660 Q70 -700 30 -712 Q0 -690 -30 -712 Q-70 -700 -80 -660Z" fill="${hc}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>` }[C.hair];
    const bc = C.beardColor;
    const beard = { long: `<path d="M-74 -640 Q-96 -520 -40 -470 Q0 -440 40 -470 Q96 -520 74 -640 Q60 -600 30 -600 Q0 -590 -30 -600 Q-60 -600 -74 -640Z" fill="${bc}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>`,
      short: `<path d="M-72 -640 Q-80 -560 0 -548 Q80 -560 72 -640 Q56 -600 0 -598 Q-56 -600 -72 -640Z" fill="${bc}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>`, '': '' }[C.beard];
    const mus = C.beard ? `<path d="M-38 -616 Q-20 -630 0 -620 Q20 -630 38 -616 Q20 -604 0 -612 Q-20 -604 -38 -616Z" fill="${bc}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>` : '';
    const my = C.beard ? 8 : 0;
    const m = { smile: `<path d="M-22 ${-602 + my} Q0 ${-584 + my} 22 ${-602 + my}" fill="none" stroke="${O}" stroke-width="6" stroke-linecap="round"/>`,
      o: `<ellipse cx="0" cy="${-596 + my}" rx="14" ry="18" fill="#7a2a2a" stroke="${O}" stroke-width="5"/>`,
      shout: `<ellipse cx="0" cy="${-592 + my}" rx="24" ry="28" fill="#7a2a2a" stroke="${O}" stroke-width="5"/><ellipse cx="0" cy="${-582 + my}" rx="12" ry="8" fill="#e86a6a"/>`,
      grin: `<path d="M-32 ${-610 + my} Q0 ${-560 + my} 32 ${-610 + my} Z" fill="#7a2a2a" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><path d="M-22 ${-605 + my} Q0 ${-596 + my} 22 ${-605 + my}" fill="#fff"/>`,
      hmm: `<path d="M-18 ${-598 + my} Q4 ${-606 + my} 22 ${-596 + my}" fill="none" stroke="${O}" stroke-width="6" stroke-linecap="round"/>`,
      frown: `<path d="M-22 ${-590 + my} Q0 ${-606 + my} 22 ${-590 + my}" fill="none" stroke="${O}" stroke-width="6" stroke-linecap="round"/>` }[mouth];
    const b = { normal: 'M-52 -700 Q-30 -712 -10 -702 M10 -702 Q30 -712 52 -700', up: 'M-52 -714 Q-30 -732 -10 -718 M10 -718 Q30 -732 52 -714',
      think: 'M-52 -696 Q-30 -706 -10 -706 M10 -712 Q30 -728 52 -716', angry: 'M-54 -712 Q-30 -706 -10 -694 M10 -694 Q30 -706 54 -712' }[brows];
    const browCol = C.hair === 'bald' ? C.hairColor : O;
    const crown = C.crown ? `<path d="M-70 -730 L-76 -800 L-40 -766 L0 -820 L40 -766 L76 -800 L70 -730 Z" fill="#ffc93c" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><circle cx="0" cy="-760" r="10" fill="#e63946" stroke="${O}" stroke-width="4"/>` : '';
    return `<g>${back}<ellipse cx="0" cy="-648" rx="78" ry="90" fill="${C.skin}" stroke="${O}" stroke-width="6"/>${front}
<ellipse cx="-80" cy="-640" rx="12" ry="20" fill="${C.skin}" stroke="${O}" stroke-width="5"/><ellipse cx="80" cy="-640" rx="12" ry="20" fill="${C.skin}" stroke="${O}" stroke-width="5"/>
${beard}<g><ellipse cx="-30" cy="-656" rx="21" ry="25" fill="#fff" stroke="${O}" stroke-width="5"/><ellipse cx="30" cy="-656" rx="21" ry="25" fill="#fff" stroke="${O}" stroke-width="5"/>
<circle cx="${-30 + px}" cy="${-654 + py}" r="11" fill="#1d1d1d"/><circle cx="${30 + px}" cy="${-654 + py}" r="11" fill="#1d1d1d"/><circle cx="${-26 + px}" cy="${-658 + py}" r="4" fill="#fff"/><circle cx="${34 + px}" cy="${-658 + py}" r="4" fill="#fff"/></g>
<path d="${b}" fill="none" stroke="${browCol}" stroke-width="8" stroke-linecap="round"/>
<path d="M-4 -642 Q12 -624 -6 -618" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/>
${C.beard ? '' : `<circle cx="-52" cy="-618" r="14" fill="#f39a9a" opacity=".7"/><circle cx="52" cy="-618" r="14" fill="#f39a9a" opacity=".7"/>`}${mus}${m}${crown}</g>`;
  }
  const armCol = C.outfit === 'robe' ? C.skin : C.cloth;
  const arm = (sh, el, hand, cls = '') => `<g class="${cls}">${C.outfit === 'robe' ? limb([sh, el, hand], C.skin, 40) + limb([sh, [(sh[0] + el[0]) / 2, (sh[1] + el[1]) / 2]], C.cloth, 52) : limb([sh, el, hand], armCol, 44)}<circle cx="${hand[0]}" cy="${hand[1]}" r="29" fill="${C.skin}" stroke="${O}" stroke-width="6"/></g>`;
  const body = () => {
    if (C.outfit === 'robe') return `<rect x="-22" y="-600" width="44" height="44" fill="${C.skin}" stroke="${O}" stroke-width="6"/>
<path d="M-96 -566 Q-130 -300 -140 -40 L140 -40 Q130 -300 96 -566 Q0 -596 -96 -566Z" fill="${C.cloth}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>
${C.sash ? `<path d="M-90 -560 L-40 -566 L120 -260 L100 -200Z" fill="${C.sash}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>` : ''}
${C.trim ? `<path d="M-140 -60 L140 -60" stroke="${C.trim}" stroke-width="16"/>` : ''}
<path d="M-50 -300 Q-40 -150 -60 -50 M40 -320 Q50 -160 30 -50" stroke="${O}" stroke-width="4" fill="none" opacity=".35"/>`;
    return `<rect x="-22" y="-600" width="44" height="44" fill="${C.skin}" stroke="${O}" stroke-width="6"/>
<path d="M-96 -566 Q-126 -400 -136 -222 L136 -222 Q126 -400 96 -566 Q0 -596 -96 -566Z" fill="${C.cloth}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>
${C.sash ? `<path d="M-38 -562 L38 -562 L32 -300 L0 -272 L-32 -300Z" fill="${C.sash}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>` : ''}
${C.trim ? `<path d="M-130 -240 L130 -240" stroke="${C.trim}" stroke-width="14"/>` : ''}`;
  };
  const legs = () => C.outfit === 'robe'
    ? `<ellipse cx="-50" cy="-12" rx="46" ry="20" fill="#8a5a36" stroke="${O}" stroke-width="6"/><ellipse cx="50" cy="-12" rx="46" ry="20" fill="#8a5a36" stroke="${O}" stroke-width="6"/>`
    : `${limb([[-40, -230], [-44, -30]], C.legsColor, 46)}${limb([[40, -230], [40, -30]], C.legsColor, 46)}<ellipse cx="-50" cy="-12" rx="44" ry="20" fill="#2b2b2b" stroke="${O}" stroke-width="6"/><ellipse cx="46" cy="-12" rx="44" ry="20" fill="#2b2b2b" stroke="${O}" stroke-width="6"/>`;
  const ARMS = {
    stand: [[[-90, -540], [-118, -420], [-122, -310]], [[90, -540], [118, -420], [122, -310]]],
    think: [[[-90, -540], [-118, -420], [-122, -310]], [[90, -540], [150, -430], [52, -568]]],
    point: [[[-90, -540], [-118, -420], [-122, -310]], [[90, -540], [170, -640], [232, -742]]],
    cheer: [[[-90, -540], [-170, -650], [-196, -770]], [[90, -540], [170, -650], [196, -770]]],
    hold: [[[-90, -540], [-150, -440], [-60, -400]], [[90, -540], [150, -440], [60, -400]]],
    hips: [[[-90, -540], [-170, -440], [-110, -330]], [[90, -540], [170, -440], [110, -330]]],
    offer: [[[-90, -540], [-118, -420], [-122, -310]], [[90, -540], [170, -450], [250, -470]]],
  };
  // pose: one of ARMS; extra: SVG drawn on top (e.g. a prop at the hand); cls: classes for [left arm, right arm]
  function draw(pose = 'stand', face = {}, extra = '', cls = ['', '']) {
    const [l, r] = ARMS[pose];
    return `<g>${legs()}${arm(...l, cls[0])}${body()}${head(face)}${arm(...r, cls[1])}${extra}</g>`;
  }
  draw.head = head;
  draw.bust = (face = {}, arms = 'none') => `<g>${body()}${head(face)}${arms === 'up' ? arm([-90, -540], [-170, -650], [-196, -770]) + arm([90, -540], [170, -650], [196, -770]) : ''}</g>`;
  draw.C = C;
  return draw;
}

const props = {
  apple: (x, y, r = 34) => `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#e63b2e" stroke="${O}" stroke-width="5"/><path d="M${x} ${y - r + 4} q4 -20 14 -26" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${x + 6} ${y - r - 8} q22 -14 34 2 q-20 10 -34 -2z" fill="#5cb85c" stroke="${O}" stroke-width="4"/></g>`,
  crown: (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-70 40 L-80 -40 L-40 -6 L0 -60 L40 -6 L80 -40 L70 40 Z" fill="#ffc93c" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><rect x="-72" y="30" width="144" height="22" rx="6" fill="#f2a900" stroke="${O}" stroke-width="5"/><circle cx="0" cy="0" r="12" fill="#e63946" stroke="${O}" stroke-width="4"/><circle cx="-44" cy="18" r="8" fill="#3fa9f5" stroke="${O}" stroke-width="3"/><circle cx="44" cy="18" r="8" fill="#3fa9f5" stroke="${O}" stroke-width="3"/></g>`,
  cloud: (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-120 30 Q-130 -30 -70 -35 Q-50 -90 10 -75 Q60 -110 100 -50 Q150 -45 140 20 Q140 40 110 40 L-100 40 Q-125 40 -120 30Z" fill="#fff" stroke="${O}" stroke-width="5" opacity=".95"/></g>`,
  burst: (x, y, r, fill) => { let d = ''; for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, rr = i % 2 ? r * .72 : r; d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)} `; } return `<path d="${d}Z" fill="${fill}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>`; },
  stars: n => Array.from({ length: n }, (_, i) => { const x = (i * 197) % 1060 + 10, y = (i * 131) % 1150 + 60, r = 3 + (i % 3) * 2; return `<circle class="twinkle" style="animation-delay:${(i % 7) * .23}s" cx="${x}" cy="${y}" r="${r}" fill="#fff8c4"/>`; }).join(''),
  grad: (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`,
  rays: (cx, cy, color, op = .28) => `<g class="spin" style="transform-origin:${cx}px ${cy}px;transform-box:view-box;opacity:${op}">${Array.from({ length: 16 }, (_, i) => `<path d="M${cx} ${cy} L${cx + 1500 * Math.cos(i * Math.PI / 8)} ${cy + 1500 * Math.sin(i * Math.PI / 8)} L${cx + 1500 * Math.cos(i * Math.PI / 8 + .12)} ${cy + 1500 * Math.sin(i * Math.PI / 8 + .12)}Z" fill="${color}"/>`).join('')}</g>`,
  label: (x, y, t, { fs = 76, fill = '#e63946', bg = '#fff', rot = 0, delay = 0, w } = {}) => {
    const W = w || [...t].length * fs * 0.5 + 70;
    return `<g transform="translate(${x},${y}) rotate(${rot})"><g class="pop" style="animation-delay:${delay}s"><rect x="${-W / 2}" y="${-fs * .95}" width="${W}" height="${fs * 1.6}" rx="${fs * .35}" fill="${bg}" stroke="${O}" stroke-width="6"/><text x="0" y="${fs * .3}" text-anchor="middle" font-family="Baloo Da 2" font-weight="800" font-size="${fs}" fill="${fill}">${t}</text></g></g>`;
  },
  // Greek-style town: columns, white houses with terracotta roofs
  greekTown: (y = 1150) => `<g><rect x="0" y="${y - 420}" width="1080" height="420" fill="none"/>
<g transform="translate(40,${y - 330})"><rect x="0" y="80" width="250" height="250" fill="#fbf4e6" stroke="${O}" stroke-width="6"/><path d="M-20 90 L125 0 L270 90Z" fill="#d9734a" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><rect x="95" y="200" width="60" height="130" rx="30" fill="#8a5a36" stroke="${O}" stroke-width="6"/><rect x="30" y="130" width="50" height="50" fill="#5bb8e8" stroke="${O}" stroke-width="5"/><rect x="170" y="130" width="50" height="50" fill="#5bb8e8" stroke="${O}" stroke-width="5"/></g>
<g transform="translate(700,${y - 400})"><path d="M-10 70 L170 0 L350 70Z" fill="#fbf4e6" stroke="${O}" stroke-width="6" stroke-linejoin="round"/><rect x="0" y="70" width="340" height="30" fill="#fbf4e6" stroke="${O}" stroke-width="6"/>${[20, 100, 180, 260].map(x => `<rect x="${x}" y="100" width="44" height="300" fill="#fff" stroke="${O}" stroke-width="5"/>`).join('')}<rect x="-10" y="390" width="360" height="20" fill="#fbf4e6" stroke="${O}" stroke-width="6"/></g></g>`,
  ship: (x, y, s = 1, flag = '#e63946') => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-260 0 L260 0 L190 120 L-190 120Z" fill="#8a5a36" stroke="${O}" stroke-width="7" stroke-linejoin="round"/><path d="M-250 20 L250 20" stroke="#6b3f22" stroke-width="10"/><path d="M0 0 L0 -420 M-150 0 L-150 -260" stroke="${O}" stroke-width="12"/>
<path d="M10 -400 Q170 -300 10 -170Z" fill="#fff" stroke="${O}" stroke-width="6"/><path d="M-10 -380 Q-170 -250 -10 -60Z" fill="#fff" stroke="${O}" stroke-width="6"/><path d="M-140 -250 Q-40 -170 -140 -60Z" fill="#fff" stroke="${O}" stroke-width="6"/><path d="M-6 -300 L6 -300 M-8 -150 L8 -150" stroke="#e63946" stroke-width="10"/>
<path d="M0 -420 L80 -440 L0 -460Z" fill="${flag}" stroke="${O}" stroke-width="4"/><circle cx="-90" cy="60" r="16" fill="#ffd23f" stroke="${O}" stroke-width="4"/><circle cx="0" cy="60" r="16" fill="#ffd23f" stroke="${O}" stroke-width="4"/><circle cx="90" cy="60" r="16" fill="#ffd23f" stroke="${O}" stroke-width="4"/></g>`,
  sea: (y, c = '#2f7fd1', cls = 'wv') => `<g class="${cls}"><path d="M-900 ${y} ${Array.from({ length: 30 }, (_, i) => `Q${-850 + i * 100} ${y - 40} ${-800 + i * 100} ${y}`).join(' ')} L2200 1920 L-900 1920Z" fill="${c}" stroke="${O}" stroke-width="6"/></g>`,
  palm: (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-14 0 Q-30 -150 10 -300 L30 -296 Q0 -150 16 0Z" fill="#a8693c" stroke="${O}" stroke-width="6"/>${[-60, -20, 20, 60, 100].map(a => `<path d="M20 -300 Q${20 + 160 * Math.cos(a * Math.PI / 180)} ${-300 - 120 * Math.sin((a + 90) * Math.PI / 360)} ${20 + 200 * Math.cos(a * Math.PI / 180)} ${-260 + 60 * Math.sin(a * Math.PI / 180)} Q${20 + 100 * Math.cos(a * Math.PI / 180)} -300 20 -300Z" fill="#43a047" stroke="${O}" stroke-width="5"/>`).join('')}</g>`,
  palace: () => `<rect width="1080" height="1920" fill="#f6e7c8"/>${[-560, -250, 60, 900, 1210, 1520].map(x => `<rect x="${x}" y="0" width="120" height="1300" fill="#fff8ea" stroke="${O}" stroke-width="6"/><rect x="${x - 15}" y="0" width="150" height="50" fill="#e8d3a8" stroke="${O}" stroke-width="6"/>`).join('')}
<path d="M0 0 L300 0 Q240 260 280 520 Q120 420 0 520Z" fill="#c62828" stroke="${O}" stroke-width="6"/><path d="M1080 0 L780 0 Q840 260 800 520 Q960 420 1080 520Z" fill="#c62828" stroke="${O}" stroke-width="6"/>
<rect y="1250" width="1080" height="670" fill="#e9d9b8" stroke="${O}" stroke-width="6"/>${Array.from({ length: 16 }, (_, i) => i - 5).map(i => Array.from({ length: 4 }, (_, j) => (i + j + 10) % 2 ? `<rect x="${i * 180}" y="${1250 + j * 170}" width="180" height="170" fill="#dcc79e"/>` : '').join('')).join('')}
<path d="M420 1250 L660 1250 L780 1920 L300 1920Z" fill="#c62828" stroke="${O}" stroke-width="6"/>`,
  throne: (x, y) => `<g transform="translate(${x},${y})"><rect x="-170" y="-860" width="340" height="700" rx="60" fill="#ffc93c" stroke="${O}" stroke-width="7"/><rect x="-130" y="-820" width="260" height="620" rx="40" fill="#8e44ad" stroke="${O}" stroke-width="6"/><circle cx="0" cy="-900" r="40" fill="#ffc93c" stroke="${O}" stroke-width="6"/><rect x="-210" y="-230" width="420" height="80" rx="20" fill="#ffc93c" stroke="${O}" stroke-width="7"/><rect x="-190" y="-150" width="40" height="150" fill="#f2a900" stroke="${O}" stroke-width="6"/><rect x="150" y="-150" width="40" height="150" fill="#f2a900" stroke="${O}" stroke-width="6"/></g>`,
};

const BASE_CSS = `:where([class]:not([class=''])){transform-box:fill-box}
.drift{animation:drift 9s linear infinite}@keyframes drift{from{transform:translateX(-40px)}to{transform:translateX(60px)}}
.sway{transform-origin:50% 100%;animation:sway 3s ease-in-out infinite}@keyframes sway{50%{transform:rotate(2deg)}}
.breathe{transform-origin:50% 100%;animation:breathe 2.4s ease-in-out infinite}@keyframes breathe{50%{transform:scale(1.015,1.025)}}
.pop{transform-origin:center;animation:pop .6s cubic-bezier(.3,1.7,.5,1) both}@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
.twinkle{transform-origin:center;animation:tw 1.6s ease-in-out infinite}@keyframes tw{50%{transform:scale(.5);opacity:.4}}
.spin{transform-origin:center;animation:spin 20s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.bob{transform-origin:center;animation:bob 1.4s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-22px)}}
.shake{transform-origin:50% 100%;animation:shake .5s ease-in-out infinite}@keyframes shake{25%{transform:rotate(-2deg)}75%{transform:rotate(2deg)}}
.wave{transform-origin:20% 90%;animation:wave .6s ease-in-out infinite alternate}@keyframes wave{to{transform:rotate(8deg)}}`;
const svg = (css, body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1080 1920" width="1080" height="1920"><style>${BASE_CSS}
${css}</style>${body}</svg>`;

// Writes plan.json + s0.svg.. into dir. scenes: [{ narration, caption, highlight, svg }]
function writeEpisode(dir, meta, scenes) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (/^s\d+\.svg$/.test(f)) fs.unlinkSync(path.join(dir, f));
  scenes.forEach((s, i) => fs.writeFileSync(path.join(dir, `s${i}.svg`), s.svg));
  fs.writeFileSync(path.join(dir, 'plan.json'), JSON.stringify({ ...meta, scenes: scenes.map(({ svg: _, ...s }) => s) }, null, 2));
}

module.exports = { O, limb, person, props, svg, writeEpisode };
