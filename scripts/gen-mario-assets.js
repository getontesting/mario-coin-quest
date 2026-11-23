/* Generate original 8-bit platformer-style SVG assets (no external tools needed). */
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '..', 'assets');

const C = {
  sky: '#5c94fc', skyLight: '#8fc6ff', cloud: '#ffffff', cloudShade: '#d7e6ff',
  hill: '#3cb54a', hillDark: '#268a37', ground: '#c96b32', brick: '#d98c4a',
  brickDark: '#8b4a21', pipe: '#2fbf4f', pipeDark: '#187a33', pipeLight: '#7ee08f',
  coin: '#ffd23f', coinDark: '#d99a12', question: '#f6b928', questionDark: '#a86a0d',
  star: '#fff36b', red: '#e52521', redDark: '#9d1410', blue: '#2d6cf5', white: '#fff',
  ink: '#2b1a0f', brown: '#7a4a21', gold: '#ffd23f', green: '#4bbf47'
};
const px = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const cloud = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" shape-rendering="crispEdges">
${px(16,0,48,16,C.cloud)}${px(0,16,96,24,C.cloud)}${px(16,40,64,12,C.cloudShade)}${px(80,16,16,16,C.cloudShade)}</g>`;
const coin = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" shape-rendering="crispEdges">
${px(6,0,12,4,C.coinDark)}${px(2,4,20,4,C.coin)}${px(0,8,24,12,C.coin)}${px(2,20,20,4,C.coin)}${px(6,24,12,4,C.coinDark)}
${px(10,6,4,16,C.coinDark)}</g>`;
const brickRow = (x, y, n, s = 1) => Array.from({length:n}, (_,i) => `<g transform="translate(${x+i*64*s} ${y}) scale(${s})" shape-rendering="crispEdges">
${px(0,0,64,28,C.brick)}${px(0,26,64,4,C.brickDark)}${px(30,0,4,28,C.brickDark)}${px(0,14,64,3,C.brickDark)}${px(14,0,3,14,C.brickDark)}${px(46,14,3,14,C.brickDark)}</g>`).join('');
const pipe = (x, y, h = 60) => `<g transform="translate(${x} ${y})" shape-rendering="crispEdges">
${px(0,0,64,18,C.pipe)}${px(6,0,52,14,C.pipeLight)}${px(58,0,6,18,C.pipeDark)}
${px(10,18,44,h,C.pipe)}${px(44,18,10,h,C.pipeDark)}</g>`;
const question = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" shape-rendering="crispEdges">
${px(0,0,48,48,C.questionDark)}${px(3,3,42,42,C.question)}${px(8,8,32,32,'#ffd764')}
${px(18,12,12,6,C.questionDark)}${px(24,16,6,10,C.questionDark)}${px(18,24,12,6,C.questionDark)}${px(18,34,12,5,C.questionDark)}
${px(4,44,6,6,C.white)}${px(38,44,6,6,C.white)}</g>`;
const star = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" shape-rendering="crispEdges">
${px(18,0,12,10,C.star)}${px(10,10,28,10,C.star)}${px(0,12,48,14,C.star)}${px(8,26,32,10,C.star)}
${px(16,36,8,10,C.star)}${px(26,36,8,10,C.star)}${px(10,16,8,8,'#fffbe0')}</g>`;
const cap = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" shape-rendering="crispEdges">
${px(28,8,52,10,C.redDark)}${px(20,18,72,12,C.red)}${px(12,30,92,12,C.red)}${px(4,42,60,10,C.redDark)}
${px(36,18,24,12,C.white)}${px(42,21,12,8,C.red)}</g>`;

function svg(w, h, body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${defs}${body}</svg>`;
}
function skyScene(h = 300, opts = {}) {
  const w = 960;
  const defs = `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.sky}"/><stop offset="1" stop-color="${C.skyLight}"/></linearGradient></defs>`;
  let b = px(0, 0, w, h, 'url(#s)');
  b += cloud(90, 40, 1.2) + cloud(560, 26, 1) + cloud(760, 96, 0.75);
  b += `<ellipse cx="180" cy="250" rx="150" ry="90" fill="${C.hill}"/><ellipse cx="430" cy="270" rx="180" ry="100" fill="${C.hillDark}"/><ellipse cx="800" cy="250" rx="190" ry="95" fill="${C.hill}"/>`;
  b += brickRow(0, 248, 15) + brickRow(0, 276, 15);
  b += pipe(690, 188, 60) + pipe(830, 218, 30);
  b += question(300, 170, 1.4) + question(380, 170, 1.4);
  b += coin(520, 150, 1.6) + coin(566, 150, 1.6) + coin(612, 150, 1.6);
  b += star(110, 120, 0.8);
  if (opts.extra) b += opts.extra;
  return svg(w, h, b, defs);
}
function cave() {
  const w = 960, h = 300;
  let b = px(0, 0, w, h, '#3a2418');
  for (let y = 0; y < h; y += 32) b += brickRow((y / 32) % 2 ? -32 : 0, y, 16, 1);
  b += px(0, 0, w, 70, '#241710');
  b += coin(120, 96, 1.8) + coin(170, 96, 1.8) + coin(640, 110, 1.8) + coin(690, 110, 1.8);
  b += star(430, 96, 1.1) + question(760, 160, 1.5);
  b += px(280, 190, 120, 16, '#7a4a21') + px(300, 174, 30, 16, C.gold) + px(350, 174, 30, 16, C.gold);
  return svg(w, h, b);
}
function factory() {
  const w = 960, h = 300;
  let b = px(0, 0, w, h, '#1b2f52');
  b += cloud(80, 36, 1.3) + cloud(620, 20, 1);
  b += px(0, 210, w, 90, '#6b4a2a') + brickRow(0, 226, 15) + brickRow(0, 262, 15);
  b += pipe(120, 130, 90) + pipe(300, 166, 54) + pipe(700, 120, 100);
  b += `<g shape-rendering="crispEdges">${px(470, 120, 80, 80, '#d9d9e6')}${px(486, 136, 48, 48, '#9aa3b8')}${px(500, 150, 20, 20, '#f0f0ff')}</g>`;
  b += coin(500, 76, 1.6) + question(820, 160, 1.3);
  return svg(w, h, b);
}
function blocks() {
  const w = 960, h = 300;
  let b = px(0, 0, w, h, '#2a1c12');
  for (let x = 40; x < 920; x += 110) b += question(x, 60 + (x % 220 ? 70 : 0), 2);
  b += brickRow(0, 250, 15);
  b += coin(460, 220, 1.5) + star(140, 220, 0.9);
  return svg(w, h, b);
}
function coinScene() {
  const w = 960, h = 300;
  let b = px(0, 0, w, h, '#123a2a');
  b += brickRow(0, 250, 15);
  for (let i = 0; i < 8; i++) b += coin(60 + i * 110, 130 - (i % 3) * 24, 2.2);
  b += star(760, 80, 1.4) + question(420, 200, 1.4);
  return svg(w, h, b);
}
function starScene() {
  const w = 960, h = 300;
  let b = skyScene(h);
  b += star(180, 70, 1.4) + star(620, 120, 1.1) + star(800, 60, 0.9);
  b += question(470, 80, 1.6);
  return b;
}
function trophyScene() {
  const w = 960, h = 300;
  let b = px(0, 0, w, h, '#1d1636');
  b += `<g shape-rendering="crispEdges">${px(430, 70, 100, 90, C.gold)}${px(450, 160, 60, 26, C.gold)}${px(410, 186, 140, 20, C.coinDark)}${px(430, 206, 100, 24, C.coinDark)}${px(450, 88, 60, 60, '#fff2a8')}</g>`;
  b += star(250, 110, 1.3) + star(680, 110, 1.3) + coin(120, 180, 1.6) + coin(800, 180, 1.6);
  b += brickRow(0, 252, 15);
  return svg(w, h, b);
}
function friendsScene() {
  const w = 960, h = 300;
  let b = skyScene(h);
  b += cap(120, 130, 1.6) + cap(360, 150, 1.2) + cap(600, 130, 1.4) + cap(820, 155, 1.1);
  return b;
}

/* ---- item, crate, medal, task and avatar sprites ---- */
function mushroom() {
  return svg(64, 64, px(8, 26, 48, 30, '#f6dfb0') + px(12, 52, 40, 8, '#d8b87a') +
    px(4, 16, 56, 16, C.red) + px(10, 6, 44, 12, C.red) + px(18, 2, 28, 6, C.redDark) +
    px(14, 18, 12, 10, '#fff') + px(38, 16, 12, 10, '#fff') + px(28, 8, 10, 8, '#fff') +
    px(20, 34, 8, 6, '#e8c98f') + px(38, 36, 6, 6, '#e8c98f'));
}
function flower(petal = C.red, center = '#ffe98a') {
  return svg(64, 64, px(30, 34, 6, 26, C.hillDark) + px(16, 42, 18, 8, C.hill) + px(34, 48, 16, 8, C.hill) +
    px(22, 6, 20, 12, petal) + px(10, 14, 44, 18, petal) + px(18, 28, 28, 10, petal) +
    px(24, 14, 16, 16, center) + px(28, 18, 8, 8, C.questionDark));
}
function leaf() {
  return svg(64, 64, px(30, 40, 6, 20, C.hillDark) +
    `<path d="M14 44 Q6 14 50 6 Q58 34 28 48 Z" fill="${C.hill}" stroke="#187a33" stroke-width="3"/>` +
    `<path d="M20 40 Q30 26 46 12" stroke="#187a33" stroke-width="3" fill="none"/>`);
}
function crateTile(color, label) {
  return svg(96, 96, px(2, 2, 92, 92, '#7a4a21') + px(6, 6, 84, 84, color) +
    px(12, 12, 72, 72, '#fff2c4') + px(28, 26, 40, 40, color) +
    `<text x="48" y="56" font-family="monospace" font-size="30" font-weight="bold" text-anchor="middle" fill="#fff">${label}</text>` +
    px(8, 84, 12, 8, '#fff') + px(76, 84, 12, 8, '#fff'));
}
function medalIcon(color, label) {
  return svg(96, 96,
    `<path d="M24 8h14l10 30-14 8Z" fill="#3b82f6"/><path d="M58 8h14l-10 38-14-8Z" fill="#e52521"/>` +
    `<rect x="12" y="34" width="72" height="54" rx="6" fill="#7a4a21"/>` +
    `<rect x="18" y="40" width="60" height="42" rx="4" fill="${color}"/>` +
    `<circle cx="48" cy="61" r="14" fill="#fff2c4"/>` +
    `<text x="48" y="68" font-family="monospace" font-size="18" font-weight="bold" text-anchor="middle" fill="#5a3617">${label}</text>`);
}
function taskIcon(kind) {
  const base = px(2, 2, 60, 60, '#fff3d1');
  if (kind === 'streak') return svg(64, 64, base + star(10, 12, 0.9));
  if (kind === 'social') return svg(64, 64, base + `<text x="32" y="44" font-size="34" text-anchor="middle">★</text>`);
  if (kind === 'referrals') return svg(64, 64, base + cap(8, 20, 0.45) + cap(30, 26, 0.35));
  if (kind === 'holding') return svg(64, 64, base + coin(20, 18, 1));
  if (kind === 'operations') return svg(64, 64, base + `<text x="32" y="45" font-size="32" text-anchor="middle">⚙</text>`);
  return svg(64, 64, base + star(12, 14, 0.85) + coin(34, 34, 0.7));
}
function plumberAvatar() {
  return svg(96, 96,
    px(0, 0, 96, 96, '#5c94fc') +
    px(18, 26, 60, 54, '#f6c9a0') + px(12, 8, 72, 22, C.red) + px(6, 28, 84, 12, C.redDark) +
    px(30, 12, 16, 16, '#fff') + `<text x="38" y="26" font-family="monospace" font-size="14" font-weight="bold" fill="${C.red}">M</text>` +
    px(26, 46, 12, 8, '#2b1a0f') + px(58, 46, 12, 8, '#2b1a0f') +
    px(24, 60, 48, 10, '#3b2a1a') + px(30, 60, 36, 5, '#3b2a1a') +
    px(30, 78, 36, 18, C.blue));
}

const files = {
  'mario-logo.svg': svg(128, 128,
    px(4, 4, 120, 120, '#2b1a0f') + px(8, 8, 112, 112, '#fff8e7') + cap(20, 18, 1.5) +
    `<text x="64" y="96" font-family="monospace" font-size="34" font-weight="bold" text-anchor="middle" fill="#b31612">M</text>`),
  'mario-part-chip.svg': mushroom(),
  'mario-part-power.svg': flower(C.red),
  'mario-part-cooler.svg': leaf(),
  'mario-part-crystal.svg': flower('#b06be0', '#ffe98a'),
  'mario-crate-small.svg': crateTile('#e52521', '?'),
  'mario-crate-medium.svg': crateTile('#f6b928', '?'),
  'mario-crate-large.svg': crateTile('#3cb54a', '?'),
  'mario-crate-mega.svg': crateTile('#a346c9', '★'),
  'mario-crate-cpu.svg': crateTile('#2d6cf5', 'C'),
  'mario-crate-power.svg': crateTile('#e52521', 'P'),
  'mario-crate-quantum.svg': crateTile('#7a3fd6', 'Q'),
  'mario-crate-rare.svg': crateTile('#f6b928', 'R'),
  'mario-medal-bronze.svg': medalIcon('#c9772f', 'B'),
  'mario-medal-silver.svg': medalIcon('#b9c4d4', 'S'),
  'mario-medal-gold.svg': medalIcon('#ffd23f', 'G'),
  'mario-medal-platinum.svg': medalIcon('#7ee0d8', 'P'),
  'mario-medal-legendary.svg': medalIcon('#ef5da8', 'L'),
  'mario-task-achievement.svg': taskIcon('achievement'),
  'mario-task-holding.svg': taskIcon('holding'),
  'mario-task-operations.svg': taskIcon('operations'),
  'mario-task-referrals.svg': taskIcon('referrals'),
  'mario-task-social.svg': taskIcon('social'),
  'mario-task-streak.svg': taskIcon('streak'),
  'mario-profile-avatar.svg': plumberAvatar(),
  'mario-home.svg': skyScene(),
  'mario-mining.svg': cave(),
  'mario-station.svg': factory(),
  'mario-crates.svg': blocks(),
  'mario-coins.svg': coinScene(),
  'mario-tasks.svg': starScene(),
  'mario-leagues.svg': trophyScene(),
  'mario-friends.svg': friendsScene()
};
for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), content);
  console.log('wrote', name, content.length);
}
