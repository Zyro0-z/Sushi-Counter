// Ilustraciones de comida (48×48) con luz, sombra y textura, mascota e ilustraciones de los juegos.
// La luz se consigue con capas superpuestas (ovL = brillo, ovD = sombra, ovB = volumen esférico),
// así cualquier color, incluidos los de las piezas personalizadas, tiene volumen.

/* ---------- Color ---------- */
function hexRgb(hex) { const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim()); if (!m) return [128, 128, 128]; const v = parseInt(m[1], 16); return [v >> 16, v >> 8 & 255, v & 255]; }
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
export const lighten = (c, t) => mix(c, '#ffffff', t);
export const darken = (c, t) => mix(c, '#000000', t);

/* ---------- Capas de luz compartidas ---------- */
export const ICON_DEFS = `
<linearGradient id="ovL" x1="0" y1="0" x2=".75" y2=".85"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="ovD" x1=".25" y1=".2" x2=".9" y2="1"><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>
<linearGradient id="ovV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
<radialGradient id="ovB" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>
<radialGradient id="ovG" cx=".4" cy=".3" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="ovS" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1E140A" stop-opacity=".34"/><stop offset=".7" stop-color="#1E140A" stop-opacity=".1"/><stop offset="1" stop-color="#1E140A" stop-opacity="0"/></radialGradient>
<linearGradient id="glassG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".25" stop-color="#fff" stop-opacity=".1"/><stop offset=".8" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/></linearGradient>`;

/* ---------- Ayudas de dibujo ---------- */
let seed = 1;
const srand = s => { seed = s; };
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const f1 = v => Math.round(v * 10) / 10;
// Forma iluminada: base + sombra + brillo
const L = (el, fill, o = 'LD') => `<${el} fill="${fill}"/>` + (o.includes('D') ? `<${el} fill="url(#ovD)"/>` : '') + (o.includes('V') ? `<${el} fill="url(#ovV)"/>` : '') + (o.includes('L') ? `<${el} fill="url(#ovL)"/>` : '') + (o.includes('G') ? `<${el} fill="url(#ovG)"/>` : '');
const SH = (cx = 24, cy = 42.4, rx = 17, ry = 3.2) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#ovS)"/>`;
const sphere = (cx, cy, r, c, spec = .85) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#ovB)"/><ellipse cx="${f1(cx - r * .32)}" cy="${f1(cy - r * .38)}" rx="${f1(r * .34)}" ry="${f1(r * .22)}" fill="#fff" opacity="${spec}" transform="rotate(-28 ${f1(cx - r * .32)} ${f1(cy - r * .38)})"/>`;
const grain = (x, y, r, i) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="1.45" ry=".82" transform="rotate(${Math.round(r)} ${f1(x)} ${f1(y)})" fill="${i % 3 ? '#FFFFFF' : '#EDE3CF'}" stroke="#D5C7AB" stroke-width=".3"/>`;
function grainsRect(x, y, w, h, n, s) { srand(s); let o = ''; for (let i = 0; i < n; i++) o += grain(x + rand() * w, y + rand() * h, rand() * 180, i); return o; }
function grainsRing(cx, cy, rx, ry, irx, iry, n, s) { srand(s); let o = ''; for (let i = 0; i < n; i++) { const a = rand() * 6.283, t = .15 + rand() * .7; o += grain(cx + Math.cos(a) * (irx + (rx - irx) * t), cy + Math.sin(a) * (iry + (ry - iry) * t), a * 57 + 90, i); } return o; }
function flecks(cx, cy, rx, ry, n, s, c = '#fff', op = .12) { srand(s); let o = ''; for (let i = 0; i < n; i++) { const a = rand() * 6.283, t = Math.sqrt(rand()); o += `<circle cx="${f1(cx + Math.cos(a) * rx * t)}" cy="${f1(cy + Math.sin(a) * ry * t)}" r="${f1(.25 + rand() * .35)}" fill="${c}" opacity="${op}"/>`; } return o; }
function seeds(pts, light = true) { return pts.map(([x, y, r = 0], i) => `<ellipse cx="${x}" cy="${y}" rx="1.05" ry=".55" transform="rotate(${r} ${x} ${y})" fill="${light || i % 2 ? '#F6ECD2' : '#2A2522'}" stroke="${light || i % 2 ? '#CDB78F' : '#000'}" stroke-width=".25"/>`).join(''); }
const HL = (d, o = .7, w = 1.4) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const steam = (xs, y0 = 14) => `<g class="steam" stroke="#B9B9C2" stroke-width="1.5" fill="none" stroke-linecap="round">${xs.map(x => `<path d="M${x} ${y0}c-1.6-2 1.6-3 0-5.2s1.6-3 0-5"/>`).join('')}</g>`;
const sizzle = pts => `<g class="sizzle">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#F8D17D"/>`).join('')}</g>`;

/* Colores base */
export const RICE = '#F8F2E6', GRAIN = '#E4D9C3', NORI = '#1E2B23', SAL = '#FF7D57', SAL2 = '#FFE1D4', AVO = '#9BC94F', TUNA = '#D2304A', TUNA2 = '#F28A97';

/* ---------- Bases reutilizables ---------- */
const FISH = 'M5.5 25C5.5 18 13.5 13.5 24 13.5S42.5 17.5 42.5 23.5c0 3-2.4 4.6-6 4.5L11.5 29.5C7.8 29.8 5.5 28.2 5.5 25Z';
const STRIPES = ['M13.5 15.8c2.4 3.4 3 8 2 13', 'M21.5 14c2.4 3.6 3.1 8.6 2.1 14.4', 'M29.5 14.4c2.3 3.4 3 8 2.2 13.4', 'M37 17c1.6 2.6 2 6 1.3 10'];
function riceBlock(s = 3) {
  return L('rect x="8.5" y="22" width="31" height="17.5" rx="8.75"', RICE, 'V') + `<rect x="8.5" y="22" width="31" height="17.5" rx="8.75" fill="none" class="rim"/>`
    + grainsRect(11, 25.5, 26, 12, 20, s)
    + `<path d="M9.4 31.5c3 4.8 26.2 4.8 29.2 0 0 4.4-3.5 8-7.9 8H17.3c-4.4 0-7.9-3.6-7.9-8z" fill="#8A6A3A" opacity=".1"/>`;
}
function nigiriOf(fish, fat, {fatOp = .9, s = 3, extra = ''} = {}) {
  return SH() + riceBlock(s) + `<ellipse cx="24" cy="28.4" rx="16" ry="2.8" fill="#3A2510" opacity=".12"/>`
    + L(`path d="${FISH}"`, fish, 'DL')
    + STRIPES.map(d => `<path d="${d}" fill="none" stroke="${darken(fish, .22)}" stroke-opacity=".4" stroke-width=".8" stroke-linecap="round" transform="translate(1.1 .2)"/><path d="${d}" fill="none" stroke="${fat}" stroke-opacity="${fatOp}" stroke-width="2" stroke-linecap="round"/>`).join('')
    + extra + HL('M8.6 22.6c3.2-4.6 9-7 16-7.4', .75, 1.5) + `<ellipse cx="31" cy="17.6" rx="3.4" ry="1.1" fill="#fff" opacity=".5" transform="rotate(10 31 17.6)"/>`;
}
function cylinder({outer, side = darken(outer, .25), rice = RICE, rx = 17, ry = 13.6, cy = 22, h = 5.6, s = 5, ring = .8, sesame = false, roe = false}) {
  const top = `ellipse cx="24" cy="${cy}" rx="${rx}" ry="${ry}"`;
  const irx = rx * ring, iry = ry * ring;
  let o = SH(24, cy + ry + h - 1.6, rx + 1, 3.2);
  o += L(`path d="M${24 - rx} ${cy}v${h}c0 ${f1(ry * 1.02)} ${f1(rx * .45)} ${f1(ry * .98)} ${rx} ${f1(ry * .98)}s${rx} ${f1(-ry * .02)} ${rx} ${f1(-ry * .98)}V${cy}z"`, side, 'D');
  o += L(top, outer, 'L');
  if (outer === NORI) o += flecks(24, cy, rx * .95, ry * .95, 18, s, '#9FB5A5', .2);
  if (sesame) o += seeds(Array.from({length:16}, (_, i) => { const a = i / 16 * 6.283 + .2; return [f1(24 + Math.cos(a) * rx * .9), f1(cy + Math.sin(a) * ry * .88), Math.round(a * 57)]; }), false);
  if (roe) { srand(s + 9); for (let i = 0; i < 46; i++) { const a = rand() * 6.283, t = .82 + rand() * .16; o += `<circle cx="${f1(24 + Math.cos(a) * rx * t)}" cy="${f1(cy + Math.sin(a) * ry * t)}" r="1.05" fill="#FF8A1F" stroke="#E0600B" stroke-width=".25"/><circle cx="${f1(24 + Math.cos(a) * rx * t - .35)}" cy="${f1(cy + Math.sin(a) * ry * t - .35)}" r=".3" fill="#fff" opacity=".8"/>`; } }
  if (rice) { o += L(`ellipse cx="24" cy="${cy}" rx="${f1(irx)}" ry="${f1(iry)}"`, rice, 'D') + grainsRing(24, cy, irx * .96, iry * .96, irx * .45, iry * .45, 26, s); }
  o += HL(`M${f1(24 - rx * .82)} ${f1(cy - ry * .45)}a${rx} ${ry} 0 0 1 ${f1(rx * .6)} ${f1(-ry * .52)}`, .35, 1.4);
  return o;
}
function bowlOf(outer, inner, band = null) {
  return SH(24, 41.6, 17, 2.8) + L('path d="M6 22h36c0 9.4-8 17-18 17S6 31.4 6 22Z"', outer, 'DL') + `<path d="M6 22h36c0 9.4-8 17-18 17S6 31.4 6 22Z" fill="none" class="rim"/>`
    + (band ? `<path d="M7.6 28.5c3.8 1.6 9.6 2.6 16.4 2.6s12.6-1 16.4-2.6" stroke="${band}" stroke-width="1.5" fill="none"/><path d="M10 31.6l1.6-1.2 1.6 1.2 1.6-1.2 1.6 1.2M31.6 31.6l1.6-1.2 1.6 1.2 1.6-1.2 1.6 1.2" stroke="${band}" stroke-width=".9" fill="none"/>` : '')
    + L('rect x="16.5" y="37.6" width="15" height="3.2" rx="1.6"', darken(outer, .1), 'D') + L('ellipse cx="24" cy="22" rx="18" ry="5"', inner, 'D') + `<ellipse cx="24" cy="22" rx="18" ry="5" fill="none" stroke="${lighten(outer, .4)}" stroke-width="1"/>`;
}

/* ---------- Piezas ---------- */
const sashimiOf = (c, fat, garnish = true) => SH(24, 42, 18, 3)
  + (garnish ? `<g stroke="#F4F1EA" stroke-width="1.1" stroke-linecap="round" fill="none">${Array.from({length:14}, (_, i) => `<path d="M${8 + i * 2.3} ${40 - (i % 3)}c2-3 3-6 2.5-9"/>`).join('')}</g>` : '')
  + L('path d="M7 37C5 23 17 9 41 8c2 17-11 30-34 29Z"', '#5DAA47', 'DL') + `<path d="M9 35C17 26 27 17 38 11M17 27.5l-1.5-5M24 21.5l-1-5.5M30 16.5l-.5-5M13 31l-4-1.5M20 25l-4.5-1M27 19.5l-4-.8" stroke="#3F8A30" stroke-width="1" fill="none" stroke-linecap="round"/>`
  + `<g transform="rotate(-30 24 24)">${[[10.5, 12.5, darken(c, .1)], [19.3, 11.5, c], [28.1, 10.5, lighten(c, .12)]].map(([x, y, col]) => L(`rect x="${x}" y="${y}" width="9.5" height="24" rx="4.75"`, col, 'DL')
    + `<path d="M${x + 2.1} ${y + 7.5}l2.7 1.6 2.7-1.6M${x + 2.1} ${y + 14.5}l2.7 1.6 2.7-1.6M${x + 2.1} ${y + 21}l2.7 1.4 2.7-1.4" stroke="${fat}" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>` + HL(`M${x + 2.4} ${y + 2.6}v4`, .7, 1.2)).join('')}</g>`
  + (garnish ? L('path d="M33 39.5c-1.2-3.2 1.4-5.6 4.4-5.2 2.8.4 4.6 3 3.4 5.4-1 1.6-6.4 1.6-7.8-.2z"', '#9ACD4A', 'DL') + flecks(37.5, 37.5, 3, 2, 8, 41, '#6E9A2A', .7)
    + L('path d="M5.5 40c.5-2.6 2.6-4 4.8-3.6-.2 2.3-2.2 3.8-4.8 3.6z"', '#F7B6B0', 'L') + L('path d="M8.5 41c1-2.4 3.3-3.4 5.3-2.7-.6 2.2-2.9 3.3-5.3 2.7z"', '#F4A7A0', 'L') : '');

export const ICON = {
  nigiri: nigiriOf(SAL, SAL2),
  nigiri_atun: nigiriOf(TUNA, TUNA2, {fatOp:.45, s:7}),
  nigiri_anguila: nigiriOf('#8E4B22', '#5A2A0F', {fatOp:.0, s:11, extra:
    `<path d="M9 23.5l4-6M15 22l4.6-7.2M22 21l4.2-7M29 21l3.6-6M35 22.4l2.6-4" stroke="#4A230C" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`
    + `<path d="${FISH}" fill="url(#ovG)"/>` + L('rect x="21" y="12.6" width="6.6" height="27.4" rx="1.2"', NORI, 'L') + `<path d="M22.4 14v24M24.3 14v24M26.2 14v24" stroke="#fff" stroke-opacity=".07" stroke-width=".6"/>`
    + seeds([[12, 21.8, 30], [16, 24.6, -20], [33, 19.2, 40], [36.2, 23, -10], [14.5, 19.6, 70]])}),
  ebi: SH() + riceBlock(13) + `<ellipse cx="24" cy="28.4" rx="16" ry="2.6" fill="#3A2510" opacity=".12"/>`
    + `<path d="M37.4 19.6l7.4-6-1 7.4 1.6 6.8-7.4-4.4Z" fill="#E8442A"/><path d="M37.4 19.6l7.4-6-1 7.4 1.6 6.8-7.4-4.4Z" fill="url(#ovD)"/><path d="M38.6 21.6l5.6-5.2M38.6 21.6l6.2.4M38.6 21.6l5.4 4.6" stroke="#9E2512" stroke-width=".7"/>`
    + L('path d="M6 24.5C6 18.5 13 15 22 15s15 2.5 17 6c1 2 0 4-3 4.4L11 28.6C8 29 6 27.4 6 24.5Z"', '#FFF4EC', 'D')
    + ['M12 16.6c2 3.2 2.4 7.4 1.6 11.6', 'M18.5 15.3c2 3.4 2.6 8 1.8 12.5', 'M25 15.2c2 3.3 2.5 7.6 1.8 11.8', 'M31.5 16.4c1.7 2.8 2.2 6.4 1.6 9.8'].map(d => `<path d="${d}" stroke="#E2521F" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#FF8A5C" stroke-width="1.4" fill="none" stroke-linecap="round" transform="translate(-.5 -.3)"/>`).join('')
    + `<path d="M6 24.5C6 18.5 13 15 22 15s15 2.5 17 6c1 2 0 4-3 4.4L11 28.6C8 29 6 27.4 6 24.5Z" fill="url(#ovL)"/>` + HL('M9 21.5c3-3.2 7.5-4.6 12-4.8', .8),
  sashimi: sashimiOf(SAL, SAL2),
  sashimi_atun: sashimiOf(TUNA, TUNA2),
  tataki: SH(24, 42, 19, 3) + L('ellipse cx="24" cy="33.5" rx="20" ry="7.6"', '#F4F1EC', 'D') + `<ellipse cx="24" cy="33.5" rx="20" ry="7.6" fill="none" class="rim"/>` + `<ellipse cx="24" cy="33" rx="15.5" ry="5" fill="#B9874C" opacity=".45"/>`
    + [[7.6, 14.6, -9], [18.6, 13, -3], [29.6, 14, 7]].map(([x, y, r], i) => `<g transform="rotate(${r} ${x + 5.4} ${y + 8.5})">${L(`rect x="${x}" y="${y}" width="10.8" height="17" rx="2.2"`, '#5C4338', 'DL')}${L(`rect x="${x + 1.5}" y="${y + 1.5}" width="7.8" height="14" rx="1.4"`, TUNA, 'DL')}<path d="M${x + 3} ${y + 5}c2 1 3 .6 4.6-.4M${x + 3} ${y + 10}c2 1 3 .6 4.6-.4" stroke="${TUNA2}" stroke-width=".7" opacity=".5" fill="none"/>${flecks(x + 5.4, y + .9, 5, .7, 6, 70 + i, '#1A0F0A', .8)}</g>`).join('')
    + seeds([[11, 14.2, 20], [14, 13.6, -30], [22, 12.4, 10], [25, 12.6, -20], [33, 13.6, 30], [36.5, 14.6, 0]])
    + [[15.6, 34], [27.6, 35.6], [34.6, 33.6], [21, 36.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="none" stroke="#6DB33F" stroke-width="1.1"/><circle cx="${x}" cy="${y}" r=".5" fill="#C9E89A"/>`).join(''),
  maki: cylinder({outer:NORI, s:5}) + L('ellipse cx="22.6" cy="22.6" rx="5.6" ry="4.6"', SAL, 'DL') + `<path d="M19.5 21c2 .8 4 .8 6 0M19.6 24c2 .7 4 .7 6 0" stroke="${SAL2}" stroke-width=".9" fill="none" opacity=".9"/>`
    + L('path d="M26 17.4c3.4.2 5.6 2.6 5.4 5.6h-5.4z"', AVO, 'DL') + `<path d="M26 17.4c3.4.2 5.6 2.6 5.4 5.6" stroke="#5E8A27" stroke-width=".9" fill="none"/>` + L('rect x="25.2" y="23.8" width="4.4" height="3.6" rx=".8"', '#7CB342', 'L') + `<circle cx="26.6" cy="25.6" r=".4" fill="#E8F5C8"/><circle cx="28.2" cy="25.4" r=".4" fill="#E8F5C8"/>`,
  uramaki: cylinder({outer:RICE, side:'#E4D7BD', rice:null, s:15, sesame:true}) + grainsRing(24, 22, 16, 12.8, 9.6, 7.6, 22, 16)
    + L('ellipse cx="24" cy="22" rx="9.4" ry="7.6"', NORI, 'L') + L('ellipse cx="24" cy="22" rx="7.6" ry="6"', '#FFF8F0', 'D')
    + L('path d="M24 16a7.6 6 0 0 0 0 12z"', SAL, 'DL') + L('path d="M24 16a7.6 6 0 0 1 7.6 6H24z"', AVO, 'DL') + `<path d="M21 19.4c1.3.5 2.3.5 3 .2M21 22.8c1.3.5 2.3.5 3 .2" stroke="${SAL2}" stroke-width=".8" fill="none"/>`,
  california: cylinder({outer:'#FF8F2E', side:'#D9661A', rice:null, s:21, roe:true}) + L('ellipse cx="24" cy="22" rx="13" ry="10.4"', RICE, 'D') + grainsRing(24, 22, 12.4, 9.9, 8, 6.4, 18, 22)
    + L('ellipse cx="24" cy="22" rx="7.6" ry="6.1"', NORI, 'L') + L('ellipse cx="24" cy="22" rx="6.2" ry="4.9"', '#FFF8F0', 'D')
    + L('rect x="19.4" y="18.4" width="9.4" height="3.4" rx="1.2"', '#EF4B3F', 'L') + `<rect x="19.4" y="20.6" width="9.4" height="1.4" fill="#fff"/>` + L('path d="M19.8 23h4.8l-.9 3.4h-3z"', AVO, 'DL') + L('rect x="25.4" y="22.8" width="3.2" height="3.4" rx=".8"', '#B5DB8A', 'L'),
  futomaki: cylinder({outer:NORI, s:31, rx:18, ry:14.6, ring:.84}) + L('rect x="17.4" y="14.6" width="7" height="6" rx="1.2"', '#FFD84A', 'DL') + `<rect x="17.4" y="14.6" width="7" height="1.4" rx=".7" fill="#C98A1C" opacity=".6"/>`
    + L('rect x="25" y="14.8" width="6.2" height="6" rx="1.2"', '#F2564A', 'L') + `<rect x="25" y="16.8" width="6.2" height="1.1" fill="#fff" opacity=".8"/>`
    + L('rect x="16" y="21.6" width="6" height="7.4" rx="1.2"', '#7CC04B', 'DL') + L('rect x="22.6" y="21.6" width="4.6" height="7.4" rx="1.2"', '#F07B2C', 'DL') + L('rect x="27.8" y="21.6" width="4.2" height="7.4" rx="1.2"', '#7A4A2A', 'DL') + `<path d="M28.6 23.4h2.6M28.6 25.4h2.6M28.6 27.4h2.6" stroke="#A8764A" stroke-width=".5"/>`,
  dragon: SH(24, 42, 20, 3) + L('rect x="4.5" y="22" width="39" height="16.4" rx="8.2"', RICE, 'V') + `<rect x="4.5" y="22" width="39" height="16.4" rx="8.2" fill="none" class="rim"/>` + grainsRect(7, 26, 34, 10, 18, 40)
    + `<path d="M12.4 24v14M20 24v14M27.6 24v14M35.2 24v14" stroke="#CDBE9E" stroke-width=".8"/>`
    + [7.5, 14, 20.5, 27, 33.5].map((x, i) => L(`ellipse cx="${x + 3.2}" cy="21.4" rx="6.8" ry="5.2"`, i % 2 ? '#86BC48' : '#A0CF58', 'DL') + `<path d="M${x - 3.4} 21.4a6.8 5.2 0 0 1 13.4-1" stroke="#466B1E" stroke-width=".9" fill="none"/><path d="M${x - 2} 19.6c2.4-2.8 6.2-3.2 9-1.6" stroke="#E5F4C2" stroke-width=".9" fill="none" stroke-linecap="round"/>`).join('')
    + `<path d="M6.8 18.8l4.2 2.4 4.2-2.4 4.2 2.4 4.2-2.4 4.2 2.4 4.2-2.4 4.2 2.4 4.2-2.4" stroke="#3C1A08" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 18.4l4 2.2 4-2.2" stroke="#B0683A" stroke-width=".6" fill="none" opacity=".8"/>`
    + `<path d="M41 22l5.5-4-1 5.2 1.2 4.6-5.4-3Z" fill="#EE4B2B"/><path d="M41 22l5.5-4-1 5.2 1.2 4.6-5.4-3Z" fill="url(#ovL)"/>` + seeds([[12, 17.2], [22, 16.6, 30], [31, 17.2, -20], [17, 18.6, 60]]),
  gunkan: SH(24, 42, 16, 3) + L('rect x="8.5" y="19" width="31" height="21.4" rx="9"', NORI, 'DL') + `<path d="M12 24v13M15.5 22.6v15.4M19 22v16" stroke="#fff" stroke-opacity=".08" stroke-width=".7"/>` + flecks(24, 30, 14, 9, 14, 51, '#9FB5A5', .18)
    + L('ellipse cx="24" cy="19.6" rx="15.2" ry="5.6"', RICE, 'D')
    + L('ellipse cx="35.4" cy="13" rx="4.6" ry="2.8" transform="rotate(-25 35.4 13)"', '#6EAE48', 'L') + `<ellipse cx="35.4" cy="13" rx="3" ry="1.6" transform="rotate(-25 35.4 13)" fill="#D6EDB8"/><circle cx="34.6" cy="13.4" r=".35" fill="#7FB85A"/><circle cx="36.2" cy="12.6" r=".35" fill="#7FB85A"/>`
    + [[14.5, 18.6], [19, 17], [24, 16.4], [29, 17], [33.5, 18.6], [16.8, 21.6], [21.4, 20.4], [26.6, 20.4], [31.2, 21.6], [24, 22.8], [19.2, 13.6], [24, 12.4], [28.8, 13.6], [21.6, 9.6], [26.4, 9.6]].map(([x, y]) => sphere(x, y, 2.5, '#FF7A12', .9)).join(''),
  temaki: SH(25, 42.4, 13, 2.8) + L('path d="M11.5 17.5L29.5 41.5c1 1.4 3 1.1 3.4-.6L39.5 15Z"', NORI, 'DL') + `<path d="M15 20l12.6 17M19 18.6l10.4 18M23.4 17.6l7.8 17.4" stroke="#fff" stroke-opacity=".07" stroke-width=".8"/>`
    + `<path d="M28.6 15L27 4.4c-.2-1.2 1.4-1.6 1.9-.5L33 14z" fill="#86C25C"/><path d="M31.6 15.2l2.4-9.4c.3-1.1 1.9-.8 1.8.4l-1 9.4z" fill="#A9D67E"/>`
    + L('ellipse cx="25.5" cy="16.2" rx="14.2" ry="5.4" transform="rotate(-5 25.5 16.2)"', RICE, 'D') + grainsRing(25.5, 16.2, 13.4, 4.8, 3, 1, 12, 61)
    + `<path d="M12.4 14.2c3-2.6 7-4 10.4-3.6-.4 2.8-4.4 4.6-10.4 3.6z" fill="#E9F3C8"/>` + L('path d="M15.2 15.2c1.4-6.6 8.6-9.8 13.2-6.6-1 4.6-7 7.8-13.2 6.6Z"', SAL, 'DL')
    + `<path d="M18.6 11.6c2.3-1.6 5-2.1 7.2-1.3M17.4 13.6c2.6-1 5.4-1.2 7.6-.4" stroke="${SAL2}" stroke-width="1.1" fill="none" stroke-linecap="round"/>` + L('path d="M29.5 17.2c2-3.2 6.2-4.2 8.8-2.6-1.5 2.8-5.2 3.8-8.8 2.6Z"', '#9BC94F', 'L')
    + [[30, 12.6], [32, 13.6], [28.6, 14.4]].map(([x, y]) => sphere(x, y, .9, '#FF8A1F', .7)).join(''),
  gyoza: SH(24, 41.8, 19, 3)
    + `<g transform="translate(9 -4) scale(.78)">${L('path d="M5.5 31C5.5 21.5 13.8 14 24 14s18.5 7.5 18.5 17c0 2.8-1.8 4.2-4.8 4.2H10.3c-3 0-4.8-1.4-4.8-4.2Z"', '#EED7A6', 'DL')}${L('path d="M6 31.6c3.6 2.2 9 3.2 18 3.2s14.4-1 18-3.2c.2 2.4-1.6 3.6-4.4 3.6H10.4C7.6 35.2 5.8 34 6 31.6Z"', '#B9762E', 'D')}</g>`
    + L('path d="M4.5 33C4.5 23.5 12.8 16 23 16s18.5 7.5 18.5 17c0 2.8-1.8 4.2-4.8 4.2H9.3c-3 0-4.8-1.4-4.8-4.2Z"', '#F5E1B4', 'DL')
    + L('path d="M5 33.6c3.6 2.2 9 3.2 18 3.2s14.4-1 18-3.2c.2 2.4-1.6 3.6-4.4 3.6H9.4C6.6 37.2 4.8 36 5 33.6Z"', '#C0802F', 'D') + flecks(23, 36.2, 16, 1, 16, 77, '#7A4A12', .5)
    + `<g stroke-linecap="round" fill="none">${['M12 21l2.4 5.2', 'M17.4 17.8l1.5 5.6', 'M23 16.6v5.8', 'M28.6 17.8l-1.5 5.6', 'M34 21l-2.4 5.2'].map(d => `<path d="${d}" stroke="#C8A061" stroke-width="2.2"/><path d="${d}" stroke="#FFF4D8" stroke-width=".8" transform="translate(-.7 0)"/>`).join('')}</g>`
    + HL('M8.6 29c2-3 5-5 8-6', .7, 1.6) + `<ellipse cx="30" cy="24" rx="2.4" ry="1" fill="#fff" opacity=".45" transform="rotate(-20 30 24)"/>` + sizzle([[3, 35], [43, 35], [7, 39], [39, 39], [23, 40]]),
  tempura: SH(24, 42, 18, 3) + `<path d="M38.5 15.5c2.4-4.4 6.6-5.4 8.4-3.2-1.4 1.2-1.6 3.4-.4 5.4-2.4 1.4-5.6 1-8-2.2Z" fill="#E8442A"/><path d="M38.5 15.5c2.4-4.4 6.6-5.4 8.4-3.2-1.4 1.2-1.6 3.4-.4 5.4-2.4 1.4-5.6 1-8-2.2Z" fill="url(#ovL)"/><path d="M40 15.2l5.4-1.4M40.6 16.6l5 1.6" stroke="#A52512" stroke-width=".7"/>`
    + L('path d="M8.5 35c-3-11 4.5-21.5 17-23.5 7.5-1.2 12.4 1.6 14 5.5-6.4-.6-12.4 1.6-16.4 6.4-3 3.7-4.2 7.8-4.4 12-3.6 1.4-8.2 1.4-10.2-.4Z"', '#E3A143', 'DL')
    + (() => { srand(91); let o = ''; const P = [[13, 30.5], [16, 24], [21, 18.5], [27, 15], [33, 15], [11.5, 25.5], [18, 29.5], [23.5, 22], [29.5, 19], [14.5, 34.5], [36, 16.5], [10, 31], [19, 21], [25, 17.4], [31, 17.2], [12.6, 28], [16.4, 32.6]]; P.forEach(([x, y], i) => { const r = .9 + rand() * 1.1; o += `<circle cx="${x}" cy="${y}" r="${f1(r)}" fill="${i % 3 ? '#F6C86E' : '#C9852E'}"/><circle cx="${f1(x - r * .3)}" cy="${f1(y - r * .3)}" r="${f1(r * .4)}" fill="#FFE7AE" opacity=".8"/>`; }); return o; })()
    + HL('M11 29c1-6 5-11 11-13.5', .5, 1.6) + sizzle([[6, 38], [20, 38], [42, 20]]),
  pollo_teriyaki: SH(24, 42, 18, 3) + L('path d="M4.4 41.4L44.4 7.6l1 1.2L5.4 42.6z"', '#D9B98A', 'L')
    + [[13, 33.5], [23.5, 24.5], [34, 15.5]].map(([x, y], i) => `<g transform="rotate(-40 ${x} ${y})">${L(`path d="M${x - 6.4} ${y - 3.6}c1-1.8 3-2.4 6.4-2.2 3.6 0 5.8.6 6.2 2.4.6 2-.2 5.4-1 6.2-1.4 1.2-3.8 1.4-6 1.2-2.4 0-4.6-.4-5.4-1.6-.8-1.4-.8-4.2-.2-6z"`, '#9C4719', 'DL')}<path d="M${x - 4.6} ${y - 3.6}v8M${x - 1} ${y - 4.2}v9M${x + 2.6} ${y - 4}v8.6" stroke="#4A1E08" stroke-width="1.1" opacity=".55"/><ellipse cx="${x - 1}" cy="${y - 2.2}" rx="3.6" ry="1.2" fill="#fff" opacity=".35"/></g>`).join('')
    + [[18.2, 29], [28.8, 20]].map(([x, y]) => `<g transform="rotate(-40 ${x} ${y})">${L(`rect x="${x - 2}" y="${y - 3}" width="4" height="6" rx="1.4"`, '#D8EDA6', 'D')}<ellipse cx="${x + 2}" cy="${y}" rx="1" ry="3" fill="#EAF6CF" stroke="#7FB04A" stroke-width=".6"/></g>`).join('')
    + seeds([[12, 31, 20], [23, 22, -20], [34, 13, 30], [15, 35], [26, 26], [31.6, 17.6, 50]]),
  karaage: SH(24, 42, 19, 3) + L('path d="M4 37c2-4 6-4 9-6 3 2 6 1 9-1 3 2 7 2 10 0 3 2 6 2 10 2-1 4-4 6-8 7H11c-3 0-6-1-7-2z"', '#7CC04B', 'L') + `<path d="M8 36.6c3-1.4 6-2.2 9-2.4M28 35c3 0 6 .4 9 1.4" stroke="#4E8F2A" stroke-width=".8" fill="none"/>`
    + L('path d="M29.6 14.6a7.5 7.5 0 0 1 14.4 0Z"', '#FFE066', 'DL') + `<path d="M29.6 14.6a7.5 7.5 0 0 1 14.4 0" stroke="#F2BE2B" stroke-width="1.4" fill="none"/><path d="M36.8 8.4v6.2M33 10.4l3.6 4M40.6 10.4l-3.6 4" stroke="#F8E6A0" stroke-width=".8"/>`
    + [['M19 24c0-6.4 5-10 11-9.4 5.4.4 9.4 4.6 8.6 9.6-.6 5-5.4 8-10.6 7.8C22 31.8 19 29 19 24Z', '#D08734', 101], ['M6.5 32c-.8-5.4 3.4-9.6 8.6-9.6 4.6-.6 8.6 2.4 8.6 6.6.6 4.4-2.8 8.4-7.8 8.6-4.6.6-8.8-1.6-9.4-5.6Z', '#C27426', 102], ['M24 35.4c-1-4.2 2-7.6 6.2-7.6 4.2-.6 7.4 2.2 7.4 5.6s-3 6.2-7.4 6.2c-3.4.2-5.6-1.6-6.2-4.2Z', '#DA953F', 103]]
      .map(([d, c, s]) => L(`path d="${d}"`, c, 'DLG')).join('')
    + flecks(30, 23, 7, 6, 12, 111, '#F6C878', .9) + flecks(15, 30, 6.5, 5, 12, 112, '#F2B865', .9) + flecks(31, 34, 5.5, 3.6, 10, 113, '#F8CB80', .9) + flecks(22, 29, 14, 9, 14, 114, '#7A3E0E', .5)
    + sizzle([[5, 36], [40, 38], [22, 16]]),
  pato: SH(24, 42, 18, 3) + `<g transform="rotate(-24 24 26)">${L('rect x="5" y="20" width="31" height="13" rx="6.5"', '#F3E3C0', 'DL')}<path d="M12 21c3 3 3 8 0 11.6M20 20.4c2 2 2.4 7 .4 12" stroke="#DCC492" stroke-width="1" fill="none"/>${flecks(18, 26, 12, 5, 10, 121, '#C9A86A', .5)}
      ${L('rect x="35" y="20.8" width="7.6" height="2.2" rx="1"', '#6DB33F', 'L')}${L('rect x="35" y="25" width="9" height="2.4" rx="1"', '#7CC04B', 'L')}${L('rect x="35" y="29" width="6.6" height="2.2" rx="1"', '#5FA032', 'L')}<rect x="35" y="23" width="7.6" height="2" rx="1" fill="#F4F9EC"/><rect x="35" y="27.4" width="6" height="1.6" rx=".8" fill="#9C3A1A"/>
      ${L('ellipse cx="36" cy="26.5" rx="3.8" ry="6.6"', '#E8D2A3', 'D')}${L('ellipse cx="36" cy="26.5" rx="2.6" ry="5.2"', '#8A341A', 'DLG')}<path d="M35 23.4c.9-.6 1.8-.6 2.4 0M34.6 26.6c1-.5 2-.5 2.8 0" stroke="#D9773A" stroke-width=".9" fill="none"/></g>`
    + HL('M10 31c4-1.6 10-4.4 15-7', .55, 1.4) + [[10, 38.4], [13, 39.8], [8, 40.4]].map(([x, y]) => sphere(x, y, 1.3, '#4A1E12', .6)).join(''),
  rollito: SH(24, 42, 19, 3) + L('ellipse cx="37.6" cy="36" rx="7.4" ry="3.6"', '#F4F0EA', 'D') + `<ellipse cx="37.6" cy="36" rx="7.4" ry="3.6" fill="none" class="rim"/>` + L('ellipse cx="37.6" cy="35.4" rx="5.6" ry="2.4"', '#E33D24', 'L') + flecks(37.6, 35.4, 4.6, 1.8, 8, 131, '#FFD3A8', .9)
    + `<g transform="rotate(-22 22 24)">${L('rect x="5" y="14.6" width="32" height="10.4" rx="5.2"', '#D58F34', 'DL')}${L('rect x="7" y="26" width="32" height="10.4" rx="5.2"', '#E5A445', 'DL')}${L('ellipse cx="37" cy="19.8" rx="2.8" ry="5.2"', '#A9692A', 'D')}<path d="M36 17.6c1.4.8 1.6 3.6 0 4.6" stroke="#D99A4A" stroke-width=".7" fill="none"/>${L('ellipse cx="39" cy="31.2" rx="2.8" ry="5.2"', '#B8782E', 'D')}</g>`
    + (() => { srand(133); let o = ''; for (let i = 0; i < 22; i++) { const t = rand(), lane = i % 2; const x = 8 + t * 26, y = (lane ? 31 : 21) - t * 9 + rand() * 3; o += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(.8 + rand())}" ry="${f1(.6 + rand() * .6)}" fill="#F6CC80" opacity=".9"/>`; } return o; })()
    + HL('M9 22.5c5-3 12-6 20-8.5', .5, 1.4),
  bao: SH(24, 42.2, 19, 3) + L('path d="M5 30c0 4.4 3.4 7.6 7.6 7.6h22.8c4.2 0 7.6-3.2 7.6-7.6Z"', '#F6EFE0', 'D') + `<path d="M5 30c0 4.4 3.4 7.6 7.6 7.6h22.8c4.2 0 7.6-3.2 7.6-7.6Z" fill="none" class="rim"/>`
    + L('path d="M8 28.5c4-1.4 9-1.6 16-1.6s12 .4 16 1.6l-1 3.4H9Z"', '#8E3F1C', 'DL') + `<path d="M9.4 29.6c4-1 9-1.2 14.6-1.2s10 .2 14 1.2M9.6 31c4-.8 9-1 14.4-1" stroke="#EBC7A6" stroke-width=".8" fill="none"/>`
    + `<path d="M8.6 27.2l5-2.6 3 2.6 4-3 3 2.8 4-3 3 2.6 4-2.6 4 3.2" stroke="#4E9A2A" stroke-width="2.6" fill="none" stroke-linejoin="round"/><path d="M8.6 26.8l5-2.6 3 2.6 4-3" stroke="#A9DC7C" stroke-width=".8" fill="none"/>`
    + [[14, 24.6], [27.6, 24.2], [33, 25.6]].map(([x, y]) => `<path d="M${x} ${y}c-1.6-1.6-.4-3.6 1.4-3.2.6-1.6 2.8-1.2 2.6.6 1.6.4 1 2.6-.6 2.4z" fill="#3E9E3A"/>`).join('')
    + L('path d="M7 26c1.6-8 9-12.6 17-12.6S39.4 18 41 26c-5-2.2-10.6-3.2-17-3.2S12 23.8 7 26Z"', '#FFFBF4', 'DL') + `<path d="M7 26c1.6-8 9-12.6 17-12.6S39.4 18 41 26" fill="none" class="rim"/>`
    + HL('M12 19.5c3-2.6 7-4 11-4.2', .9, 1.5) + [[18, 26.4], [30, 26], [23, 27.6], [35, 27.2]].map(([x, y]) => `<path d="M${x - 1} ${y}l1-1 1.2.6-.3 1.2z" fill="#E3B26B"/>`).join(''),
  takoyaki: SH(24, 42, 20, 3) + L('path d="M3.6 28h40.8l-4.4 9.6c-.6 1.2-1.8 2-3.2 2H11.2c-1.4 0-2.6-.8-3.2-2Z"', '#C9A06A', 'DL') + `<path d="M3.6 28h40.8" stroke="#E6C38E" stroke-width="1.6"/><path d="M8 31.6h32M9.6 34.6h28.8M11 37.4h26" stroke="#A97E48" stroke-width=".5" opacity=".7"/>`
    + `<path d="M38 26L46 6.6" stroke="#E2C99A" stroke-width="1.4" stroke-linecap="round"/>`
    + [[13.5, 23.6], [24, 21.6], [34.5, 23.6]].map(([x, y]) => sphere(x, y, 7.3, '#C47A35', .45) + L(`path d="M${x - 6.2} ${y - 1}c1.6-5 10.8-5 12.4 0-3 1.6-9.4 1.6-12.4 0Z"`, '#4E220C', 'G')).join('')
    + `<path d="M7.6 19.4l3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2" stroke="#000" stroke-opacity=".12" stroke-width="1.6" fill="none" stroke-linejoin="round" transform="translate(0 .6)"/><path d="M7.6 19.4l3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2" stroke="#FFF8EE" stroke-width="1.3" fill="none" stroke-linejoin="round"/>`
    + flecks(24, 17.6, 13, 3, 16, 141, '#2E7D32', .9)
    + `<g class="bonito"><path d="M22 13c1.4-1 3-1 4 .2M30 16c1.2-1.2 3-1 3.8.4M14 16.6c1-1 2.6-.8 3.2.4M26 11.4c1-.8 2.4-.6 3 .4" stroke="#E7A38A" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>`,
  yakisoba: SH() + bowlOf('#EFEAE0', '#B98A48', '#3E6FB0')
    + `<g fill="none" stroke-linecap="round"><path d="M9 21c2 2 4-1.6 6 0s4-1.6 6 0 4-1.6 6 0 4-1.6 6 0 4-1.6 6 0M10 23.6c2 1.6 4-1.4 6 0s4-1.4 6 0 4-1.4 6 0 4-1.4 6 0 4-1.4 5 0M12 19c2 1.4 4-1.4 6 0s4-1.4 6 0 4-1.4 6 0 4-1.4 5 0" stroke="#C99550" stroke-width="2"/><path d="M9 21c2 2 4-1.6 6 0s4-1.6 6 0 4-1.6 6 0 4-1.6 6 0 4-1.6 6 0M12 19c2 1.4 4-1.4 6 0s4-1.4 6 0 4-1.4 6 0 4-1.4 5 0" stroke="#F2CF8C" stroke-width=".8"/></g>`
    + `<path d="M15 20.5l3 1M28 22l3.4-.6M21 18.6l2.6 1.2" stroke="#F07B2C" stroke-width="1.8" stroke-linecap="round"/><path d="M33 19.4l2.6 1.4M17 23.4l2.4-.8" stroke="#8CC659" stroke-width="2.2" stroke-linecap="round"/><path d="M25 23.6l1.6-.8M11.6 21.6l1.4.6" stroke="#E8445A" stroke-width="1.2" stroke-linecap="round"/>`
    + L('path d="M16.4 17.4L42.6 4.4l.8 1.4L17.2 18.8z"', '#A5713E', 'L') + L('path d="M20 18.6L44.6 8l.6 1.4L20.6 20z"', '#9A6634', 'L') + steam([10, 15], 16),
  arroz_frito: SH() + bowlOf('#EFEAE0', '#E3C06E', '#3E6FB0') + L('path d="M8.5 22c1.8-7.6 8-11.4 15.5-11.4S37.7 14.4 39.5 22c-4.4 1.6-9.6 2.4-15.5 2.4S12.9 23.6 8.5 22Z"', '#F0D488', 'DL')
    + (() => { srand(151); let o = ''; for (let i = 0; i < 26; i++) { const a = rand() * 3.14, t = Math.sqrt(rand()); const x = 24 + Math.cos(a) * 13 * t * (rand() < .5 ? -1 : 1), y = 22 - Math.sin(a) * 10 * t; o += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="1.3" ry=".7" fill="#FFF3C8" transform="rotate(${Math.round(rand() * 180)} ${f1(x)} ${f1(y)})" opacity=".9"/>`; } return o; })()
    + [[15, 18], [22, 15], [30, 16.6], [33, 20.4], [19, 21.4], [26, 20]].map(([x, y]) => sphere(x, y, 1.4, '#5FA732', .6)).join('')
    + [[18, 16.4], [27, 19], [34, 17.4], [13, 21]].map(([x, y]) => L(`rect x="${x - 1.2}" y="${y - 1}" width="2.4" height="2" rx=".4"`, '#F07B2C', 'L')).join('')
    + [[24, 18.6], [28, 14], [16, 19.6], [31, 21.6]].map(([x, y]) => L(`path d="M${x - 2} ${y}c.4-1.4 3.2-1.6 3.8 0-.6 1.2-3.2 1.2-3.8 0z"`, '#FFD84A', 'L')).join('') + steam([19, 24, 29], 10),
  miso: SH(24, 41.6, 17, 2.8) + L('path d="M6 22h36c0 9.4-8 17-18 17S6 31.4 6 22Z"', '#3A1F1A', 'DLG') + L('rect x="16.5" y="37.6" width="15" height="3.2" rx="1.6"', '#2A1512', 'D') + L('ellipse cx="24" cy="22" rx="18" ry="5"', '#B9352A', 'L')
    + L('ellipse cx="24" cy="22.2" rx="16" ry="4"', '#C08A50', 'D') + `<path d="M12 21.6c3-1.4 6 1 9-.4s6-1 8.6.6 4.6-.2 7.4.6" stroke="#E0B985" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>`
    + [[15, 19.4, 3.6], [27, 20.8, 3.6], [22, 18.4, 3]].map(([x, y, s]) => `<path d="M${x} ${y + 1}l${s / 2} -1h${s}l-${s / 2} 1z" fill="#FFFDF5"/><rect x="${x}" y="${y + 1}" width="${s}" height="${s * .7}" fill="#EFE7D6"/>`).join('')
    + `<path d="M31.5 19.4c1.6.4 3 1.4 3.6 2.6M18.8 23.6c1.4-.2 2.6.2 3.4 1M10.4 22.4c1-.6 2.2-.6 3 0" stroke="#24552A" stroke-width="2" fill="none" stroke-linecap="round"/>`
    + [[34, 23.4], [12.6, 22.6], [25, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="none" stroke="#7FC04B" stroke-width="1"/>`).join('')
    + `<path d="M8 25.5c3 5 9 9.6 16 9.6" stroke="#fff" stroke-opacity=".25" stroke-width="1.4" fill="none" stroke-linecap="round"/>` + steam([17, 24, 31], 15),
  wakame: SH(24, 41, 19, 3) + L('ellipse cx="24" cy="33" rx="19" ry="7.8"', '#F1F4F7', 'D') + `<ellipse cx="24" cy="33" rx="19" ry="7.8" fill="none" class="rim"/>` + L('ellipse cx="24" cy="32.4" rx="15.4" ry="5.6"', '#D8E1E8', 'D')
    + `<g class="sway" fill="none" stroke-linecap="round"><path d="M12 31c2-8 4-12 6-14M16 32c1-7 4-12 8-15M21 32c0-7 3-13 6-16M25 32c1-6 4-11 9-14M29 32c2-5 5-9 8-11M33 31c1-3 3-6 5-7M14 28c4-2 7-6 9-10M24 30c2-4 6-8 10-10" stroke="#2E8C3A" stroke-width="2.6"/>
      <path d="M18 30c2-5 4-9 7-11M27 30c2-4 4-7 7-9M13 29c2-4 3-8 5-10" stroke="#5CC45E" stroke-width="1.6"/><path d="M22 28c1-4 3-8 5-10M30 29c1.6-3 3.6-6 6-8" stroke="#A6E39A" stroke-width=".6"/></g>`
    + seeds([[17, 22, 20], [22, 19], [28, 20, 60], [31, 24], [20, 26, -30], [25, 25.6], [15, 26, 40], [33, 21, -20]]) + `<path d="M26 16.6l3.6-2.4M19.6 20l2.6-3M31 18.4l2-2.8" stroke="#E33D24" stroke-width=".8" stroke-linecap="round"/>`,
  edamame: SH(24, 42, 18, 3)
    + `<g transform="translate(4 6) rotate(12 24 24) scale(.85)">${L('path d="M7.5 33c-1.4-5.6 2.6-9.4 7.6-10.4 2.6-5.2 7.8-8.6 13-8.4 3.6-3.6 9.6-4.4 12.4-.8 2.6 3.4.6 8-4 9.6-1.6 4.6-5.6 7.8-10.8 8.8-3.6 4-9.6 6.6-14 5-2.2-.8-3.6-2-4.2-3.8Z"', '#5E9C32', 'DL')}</g>`
    + L('path d="M7.5 33c-1.4-5.6 2.6-9.4 7.6-10.4 2.6-5.2 7.8-8.6 13-8.4 3.6-3.6 9.6-4.4 12.4-.8 2.6 3.4.6 8-4 9.6-1.6 4.6-5.6 7.8-10.8 8.8-3.6 4-9.6 6.6-14 5-2.2-.8-3.6-2-4.2-3.8Z"', '#6FAF3E', 'DL')
    + [[14.5, 30.5, 5], [23.5, 23.5, 5.3], [33, 17, 5]].map(([x, y, r]) => L(`circle cx="${x}" cy="${y}" r="${r}"`, '#88C455', 'DLG')).join('')
    + flecks(24, 24, 15, 10, 24, 161, '#D8F0B8', .5) + `<path d="M40.5 12.5c1.4-2 3-3 5-3" stroke="#4E8628" stroke-width="2" stroke-linecap="round" fill="none"/>`
    + [[12, 26], [20, 20.6], [28, 15.6], [36, 22], [18, 33]].map(([x, y]) => `<rect x="${x}" y="${y}" width="1.3" height="1.3" fill="#fff" transform="rotate(30 ${x} ${y})" opacity=".95"/>`).join(''),
  mochi: SH(24, 41.6, 19, 3) + L('ellipse cx="24" cy="36.4" rx="19" ry="5"', '#A7C964', 'D') + `<path d="M8 36.6c5-1 10-1.4 16-1.4M24 35.2c6 0 11 .4 16 1.4" stroke="#6E9A2A" stroke-width=".8" fill="none"/>`
    + sphere(31.4, 25.4, 9.6, '#BFDC9A', .5) + sphere(17, 27.2, 10.4, '#F7B9CC', .55) + sphere(26.4, 32, 6.8, '#FAF4EA', .6)
    + flecks(17, 27, 9, 9, 18, 171, '#fff', .9) + flecks(31.4, 25.4, 8, 8, 14, 172, '#fff', .8) + flecks(26.4, 32, 6, 5, 8, 173, '#fff', .9),
  helado: SH(24, 42, 15, 2.8) + `<path d="M12.6 39.6h22.8" stroke="#BCD3E2" stroke-width="2" stroke-linecap="round"/>` + `<path d="M22 34h4v5.6h-4z" fill="#D7E7F1"/>`
    + `<path d="M10 25h28l-3.4 8.6c-.6 1.6-2.2 2.6-4 2.6H17.4c-1.8 0-3.4-1-4-2.6Z" fill="#CFE3EF" opacity=".9"/><path d="M10 25h28l-3.4 8.6c-.6 1.6-2.2 2.6-4 2.6H17.4c-1.8 0-3.4-1-4-2.6Z" fill="url(#glassG)"/>`
    + L('rect x="30.6" y="4.6" width="3.6" height="18" rx="1.8" transform="rotate(24 32.4 13.6)"', '#E8C27A', 'DL') + `<path d="M31.4 8.4l3 1.4M30.4 11.4l3 1.4M29.4 14.4l3 1.4" stroke="#B9883A" stroke-width=".8"/>`
    + sphere(18.4, 21.6, 8.2, '#FFF1D2', .6) + sphere(29, 20.6, 8.2, '#F6A0B6', .6) + `<path d="M10.6 24.4c2 1.6 3 0 4.4 1.4s3-.4 4.6 1M21.6 23.6c2 1.4 3.4-.2 5 1.2s3-.2 4.4.8 2.4-.4 3.6.4" stroke="#fff" stroke-opacity=".9" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    + `<path d="M24 14.4c2 1 3 3 2.6 5.4M26.6 13.6c1.6 1.6 2 3.4 1.4 5.6" stroke="#6B3A1E" stroke-width="1.4" fill="none" stroke-linecap="round"/>` + L('path d="M20 12.6c1.2-2.6 4-3.4 5.8-2-1.2 2.4-3.6 3.2-5.8 2z"', '#4CAF50', 'L') + circ2([[30, 23.6], [33, 20.2], [27, 19.6]], .7, '#C83E62'),
  fruta: SH(24, 41.6, 19, 3) + L('ellipse cx="24" cy="36.6" rx="19" ry="4.8"', '#F5F2EC', 'D') + `<ellipse cx="24" cy="36.6" rx="19" ry="4.8" fill="none" class="rim"/>`
    + L('path d="M24 36L41 14.6c1.6 3.6 2 8 1 12.4L41 36Z"', '#FFD84A', 'DL') + `<path d="M41 14.6c1.6 3.6 2 8 1 12.4L41 36" stroke="#8A6A2A" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="M41.6 16l-1.2 2M42 20l-1.2 2M42.2 24l-1.2 2M42 28l-1.2 2M41.6 32l-1.2 2" stroke="#5E4618" stroke-width=".8"/>`
    + `<path d="M27 32.4l3-3.6M31 32.6l3.6-4.4M35 31.4l3.4-4.2M30.6 26.6l4.4-4.6M34.8 22l3.6-4M28.6 29.4l6.6 0M32 25l6.4 0" stroke="#E9B020" stroke-width=".8" opacity=".9"/>`
    + L('path d="M4 36a13 13 0 0 1 26 0Z"', '#FF961C', 'DL') + L('path d="M6.4 36a10.6 10.6 0 0 1 21.2 0Z"', '#FFC15E', 'L') + `<path d="M17 36V25.6M17 36l-7.4-5.6M17 36l7.4-5.6M17 36l-9.6-1.4M17 36l9.6-1.4" stroke="#FFEBC0" stroke-width="1.1"/>`
    + flecks(17, 31, 8, 4, 10, 181, '#FFE7A0', .8) + L('path d="M13 14c3-5 9-6 12-4-2 4-7 6-12 4Z"', '#5DAA47', 'L') + `<path d="M14 13.6c3-1.4 6-2.2 9.6-2.6" stroke="#3F8A30" stroke-width=".9" fill="none"/>`,
  onigiri: SH(24, 42.4, 17, 3.2) + L('path d="M24 5.6c2 0 3.6 1.2 4.8 3.2l11 18.4c2.6 4.4.4 11.6-6 11.6H14.2c-6.4 0-8.6-7.2-6-11.6l11-18.4c1.2-2 2.8-3.2 4.8-3.2z"', RICE, 'DL')
    + `<path d="M24 5.6c2 0 3.6 1.2 4.8 3.2l11 18.4c2.6 4.4.4 11.6-6 11.6H14.2c-6.4 0-8.6-7.2-6-11.6l11-18.4c1.2-2 2.8-3.2 4.8-3.2z" fill="none" class="rim"/>`
    + grainsRect(13, 10, 22, 16, 22, 191)
    + L('path d="M23.2 15.4c-1.6 1-2.4 3-1.6 4.6 1.2 2 4.4 2 5.6-.2.8-1.6 0-3.6-1.4-4.4-.8-.4-1.8-.4-2.6 0z"', SAL, 'DL') + flecks(24.4, 18, 2, 1.6, 6, 192, '#FFD0C0', .9)
    + L('path d="M15.6 26h16.8v12.8H15.6z"', NORI, 'DL') + `<path d="M17.4 26.6v12M19.6 26.6v12M21.8 26.6v12M26.2 26.6v12M28.4 26.6v12M30.6 26.6v12" stroke="#fff" stroke-opacity=".07" stroke-width=".7"/>` + flecks(24, 32, 8, 6, 10, 193, '#9FB5A5', .2)
    + seeds([[12.4, 30, 40], [35.6, 30.4, -40], [24, 24, 0], [19.6, 22.6, 60], [28.4, 22.8, -60]]) + HL('M16.6 14.2l4.2-7', .8, 1.5),
};
function circ2(pts, r, fill) { return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join(''); }
// Animación en reposo
export const ICON_ANIM = {mochi:'bob', takoyaki:'bob', edamame:'wiggle', helado:'bob', gunkan:'shine', temaki:'wiggle', onigiri:'bob'};

/* ---------- Plantillas para piezas personalizadas ---------- */
export const TPL = {
  nigiri: c => nigiriOf(c, lighten(c, .55)),
  sashimi: c => sashimiOf(c, lighten(c, .55)),
  maki: c => cylinder({outer:NORI, s:5}) + L('ellipse cx="24" cy="22.4" rx="6.4" ry="5.2"', c, 'DLG') + flecks(24, 22.4, 5, 4, 8, 7, lighten(c, .5), .8),
  gunkan: c => SH(24, 42, 16, 3) + L('rect x="8.5" y="19" width="31" height="21.4" rx="9"', NORI, 'DL') + L('ellipse cx="24" cy="19.6" rx="15.2" ry="5.6"', RICE, 'D')
    + [[14.5, 18.6], [19, 17], [24, 16.4], [29, 17], [33.5, 18.6], [16.8, 21.6], [21.4, 20.4], [26.6, 20.4], [31.2, 21.6], [24, 22.8], [19.2, 13.6], [24, 12.4], [28.8, 13.6]].map(([x, y]) => sphere(x, y, 2.5, c, .8)).join(''),
  brocheta: c => SH(24, 42, 18, 3) + L('path d="M4.4 41.4L44.4 7.6l1 1.2L5.4 42.6z"', '#D9B98A', 'L')
    + [[13, 33.5], [23.5, 24.5], [34, 15.5]].map(([x, y]) => `<g transform="rotate(-40 ${x} ${y})">${L(`rect x="${x - 6}" y="${y - 5}" width="12" height="10" rx="4"`, c, 'DLG')}</g>`).join(''),
  bol: c => SH() + bowlOf('#EFEAE0', c, '#3E6FB0') + `<path d="M9 21.5c3 1.4 6-1 9 0s6-1.2 9 0 6-1 9 0" stroke="${lighten(c, .35)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` + steam([18, 24, 30], 14),
  bola: c => SH(24, 41.6, 18, 3) + sphere(31, 25, 10, lighten(c, .45), .5) + sphere(17.5, 28, 11, c, .55) + flecks(17.5, 28, 10, 10, 16, 3, '#fff', .9),
  roll: c => SH(24, 42, 20, 3) + L('rect x="4.5" y="22" width="39" height="16.4" rx="8.2"', RICE, 'V') + grainsRect(7, 26, 34, 10, 16, 9)
    + [7.5, 14, 20.5, 27, 33.5].map((x, i) => L(`ellipse cx="${x + 3.2}" cy="21.4" rx="6.8" ry="5.2"`, i % 2 ? darken(c, .08) : c, 'DL')).join(''),
};
export function iconInner(k, t) {
  if (ICON[k]) return ICON[k];
  if (t && t.tpl && TPL[t.tpl]) return TPL[t.tpl](t.color || SAL);
  return ICON.maki;
}

/* ---------- Ilustraciones de los juegos y herramientas (64×64) ---------- */
const IS = (cx = 32, cy = 57, rx = 22, ry = 3.4) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#ovS)"/>`;
export const ILLU = {
  ruleta: IS() + (() => { const cols = ['#E5484D', '#F5A524', '#3E7BFA', '#30A46C', '#E879B5', '#F5A524', '#3E7BFA', '#30A46C']; let o = ''; for (let i = 0; i < 8; i++) { const a0 = (i * 45 - 90) * Math.PI / 180, a1 = ((i + 1) * 45 - 90) * Math.PI / 180; o += `<path d="M32 31L${f1(32 + 22 * Math.cos(a0))} ${f1(31 + 22 * Math.sin(a0))}A22 22 0 0 1 ${f1(32 + 22 * Math.cos(a1))} ${f1(31 + 22 * Math.sin(a1))}Z" fill="${cols[i]}" stroke="#fff" stroke-width="1.4"/>`; } return o; })()
    + `<circle cx="32" cy="31" r="23" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="32" cy="31" r="22" fill="url(#ovB)"/>` + sphere(32, 31, 5.4, '#FFFFFF', .9)
    + `<path d="M32 13.6l-4.4-8h8.8z" fill="#2B2B33"/><path d="M32 13.6l-4.4-8h8.8z" fill="url(#ovL)"/><circle cx="32" cy="5.6" r="2.2" fill="#2B2B33"/>`,
  duelo: IS() + `<g transform="translate(4 14) scale(.55)">${ICON.nigiri}</g><g transform="translate(34 14) scale(.55)">${ICON.maki}</g>`
    + `<path d="M28 10l6 8-4 1 5 9-9-9 4-1-5-7z" fill="#FFC21A" stroke="#E08A00" stroke-width="1" stroke-linejoin="round"/><path d="M28 10l6 8-4 1 5 9-9-9 4-1-5-7z" fill="url(#ovL)"/>`
    + `<rect x="21" y="42" width="22" height="11" rx="5.5" fill="#1C1C1E"/><text x="32" y="50.6" text-anchor="middle" font-family="ui-rounded,Nunito,system-ui" font-weight="900" font-size="9" fill="#fff">VS</text>`,
  reloj: IS() + `<rect x="27" y="4" width="10" height="5" rx="2" fill="#5B5B66"/><rect x="29.6" y="8" width="4.8" height="4" fill="#5B5B66"/><path d="M47 12.6l3 3" stroke="#5B5B66" stroke-width="3.4" stroke-linecap="round"/>`
    + L('circle cx="32" cy="34" r="21"', '#FF5E3A', 'DL') + L('circle cx="32" cy="34" r="16.6"', '#FFFFFF', 'D')
    + `<path d="M32 34V17.4A16.6 16.6 0 0 1 47.4 28.4z" fill="#FF5E3A" opacity=".22"/>` + Array.from({length:12}, (_, i) => { const a = i * 30 * Math.PI / 180; return `<line x1="${f1(32 + 14.4 * Math.sin(a))}" y1="${f1(34 - 14.4 * Math.cos(a))}" x2="${f1(32 + 15.8 * Math.sin(a))}" y2="${f1(34 - 15.8 * Math.cos(a))}" stroke="#8E8E99" stroke-width="${i % 3 ? 1 : 1.8}" stroke-linecap="round"/>`; }).join('')
    + `<path d="M32 34l8.6-6" stroke="#FF5E3A" stroke-width="2.4" stroke-linecap="round"/><path d="M32 34V22.6" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round"/>` + sphere(32, 34, 2.4, '#1C1C1E', .5),
  mesa: IS(32, 58, 26, 3.4) + [[10, 22, -8, '#0A84FF'], [36, 18, 8, '#FA5D3C']].map(([x, y, r, c]) => `<g transform="rotate(${r} ${x + 9} ${y + 16})">${L(`rect x="${x}" y="${y}" width="18" height="32" rx="4"`, '#2B2B33', 'L')}<rect x="${x + 1.6}" y="${y + 3}" width="14.8" height="25.6" rx="2" fill="${c}"/><rect x="${x + 1.6}" y="${y + 3}" width="14.8" height="25.6" rx="2" fill="url(#ovL)"/><text x="${x + 9}" y="${y + 19.6}" text-anchor="middle" font-family="ui-rounded,Nunito,system-ui" font-weight="900" font-size="10" fill="#fff">${x < 20 ? 12 : 15}</text><rect x="${x + 6}" y="${y + 29.6}" width="6" height="1.2" rx=".6" fill="#8E8E99"/></g>`).join('')
    + L('path d="M20 13.4a5.4 5.4 0 0 1 .6-10.6 7.2 7.2 0 0 1 13.6-.4 5.8 5.8 0 0 1 2.2 11z"', '#FFFFFF', 'D') + `<path d="M20 13.4a5.4 5.4 0 0 1 .6-10.6 7.2 7.2 0 0 1 13.6-.4 5.8 5.8 0 0 1 2.2 11z" fill="none" stroke="#C7C7CC" stroke-width=".8" transform="translate(0 0)"/>`
    + `<path d="M24 8.4h7.6M28.6 5.6l3 2.8-3 2.8" stroke="#0A84FF" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  ticket: IS() + `<g transform="rotate(-6 32 30)">${L('path d="M16 6h32v44l-3.2-2.4-3.2 2.4-3.2-2.4-3.2 2.4-3.2-2.4-3.2 2.4-3.2-2.4-3.2 2.4-3.2-2.4L16 50z"', '#FFFFFF', 'D')}<path d="M16 6h32v44l-3.2-2.4-3.2 2.4-3.2-2.4-3.2 2.4-3.2-2.4-3.2 2.4-3.2-2.4-3.2 2.4-3.2-2.4L16 50z" fill="none" stroke="#D1D1D6" stroke-width=".8"/>
      <rect x="21" y="11" width="22" height="3" rx="1.5" fill="#1C1C1E"/><path d="M21 19h13M21 23h10M21 27h14M21 31h9" stroke="#C7C7CC" stroke-width="1.6" stroke-linecap="round"/><path d="M38 19h5M38 23h5M38 27h5M38 31h5" stroke="#C7C7CC" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M21 37h22" stroke="#1C1C1E" stroke-width=".8" stroke-dasharray="1.6 1.4"/><rect x="21" y="40.4" width="9" height="3.2" rx="1.2" fill="#1C1C1E"/><text x="43" y="44" text-anchor="end" font-family="ui-rounded,Nunito,system-ui" font-weight="900" font-size="5.6" fill="#FA5D3C">37,80</text></g>`
    + `<path d="M8 14V8h6M50 8h6v6M56 46v6h-6M14 52H8v-6" stroke="#0A84FF" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect class="scanline" x="9" y="28" width="46" height="2" rx="1" fill="#0A84FF" opacity=".7"/>`,
  registro: IS() + `<g transform="rotate(-4 32 30)">${L('rect x="14" y="8" width="36" height="44" rx="5"', '#C8954E', 'DL')}${L('rect x="17" y="12" width="30" height="37" rx="2"', '#FFFFFF', 'D')}${L('rect x="25" y="5" width="14" height="7" rx="2.4"', '#8E8E99', 'L')}
      ${[0, 1, 2, 3].map(i => `<circle cx="22" cy="${19 + i * 8}" r="2.6" fill="${i < 3 ? '#34C759' : '#E5E5EA'}"/>${i < 3 ? `<path d="M20.8 ${19 + i * 8}l.9 .9 1.6-1.8" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round"/>` : ''}<path d="M27 ${19 + i * 8}h${14 - i * 2}" stroke="#C7C7CC" stroke-width="1.8" stroke-linecap="round"/>`).join('')}</g>`,
  buffet: IS() + L('path d="M10 24h44v28H10z"', '#F4E7D3', 'DL') + L('path d="M6 18l6-10h40l6 10z"', '#5B3A1E', 'DL') + L('rect x="6" y="18" width="52" height="6" rx="1.4"', '#7A4E28', 'L')
    + [0, 1, 2, 3, 4].map(i => `<path d="M${13 + i * 8} 24h7v11c0 1-1 1.6-2 1.6h-3c-1 0-2-.6-2-1.6z" fill="${i % 2 ? '#2B4C8C' : '#3E6FB0'}"/>`).join('') + `<circle cx="32" cy="29.4" r="3.4" fill="#fff" opacity=".9"/><circle cx="32" cy="29.4" r="1.6" fill="#E5484D"/>`
    + L('rect x="27" y="40" width="10" height="12" rx="1"', '#7A4E28', 'L') + `<rect x="14" y="40" width="9" height="7" rx="1" fill="#BFE3FF"/><rect x="41" y="40" width="9" height="7" rx="1" fill="#BFE3FF"/>`
    + L('ellipse cx="51" cy="10" rx="2.6" ry="3.6"', '#E5484D', 'DL') + `<path d="M51 13.6v2" stroke="#2B2B33" stroke-width="1"/>`,
};
ILLU.ayuda = IS() + L('path d="M10 14c0-4.4 3.6-8 8-8h28c4.4 0 8 3.6 8 8v18c0 4.4-3.6 8-8 8H30l-10 9v-9h-2c-4.4 0-8-3.6-8-8z"', '#0A84FF', 'DL')
  + `<text x="32" y="32" text-anchor="middle" font-family="ui-rounded,Nunito,system-ui" font-weight="900" font-size="22" fill="#fff">?</text>`;
export const illu = (k, cls = '') => `<svg viewBox="0 0 64 64" class="illu ${cls}" aria-hidden="true">${ILLU[k] || ''}</svg>`;

/* ---------- Mascota: Shari, un nigiri con cara (ánimo por data-mood) ---------- */
export const MASCOT = `<svg viewBox="0 0 64 64" class="mascot-svg" aria-hidden="true">
  <ellipse cx="32" cy="59" rx="18" ry="3" fill="url(#ovS)"/>
  <g class="m-body">
    <g class="m-arms-down" stroke="#E6DCC8" stroke-width="4.2" stroke-linecap="round" fill="none"><path d="M13 43c-4 1.5-6 4.5-6 7.5"/><path d="M51 43c4 1.5 6 4.5 6 7.5"/></g>
    <g class="m-arms-up" stroke="#E6DCC8" stroke-width="4.2" stroke-linecap="round" fill="none"><path d="M13 40c-4-2-6-6-5.5-10"/><path d="M51 40c4-2 6-6 5.5-10"/></g>
    ${L('rect x="11" y="27" width="42" height="29" rx="14.5"', RICE, 'V')}<rect x="11" y="27" width="42" height="29" rx="14.5" fill="none" class="rim"/>
    ${grainsRect(15, 46, 34, 8, 12, 201)}
    ${L('path d="M6.5 31C6.5 21 17.5 15 32 15s25.5 5 25.5 13.5c0 4-3 6-8 6L15 35.5c-5.2.5-8.5-1.2-8.5-4.5Z"', SAL, 'DL')}
    <path d="M17 17.5c3 4.5 3.6 10 2.4 16M28 15.6c3 4.6 3.8 10.6 2.6 17.6M39.5 16c2.8 4.4 3.6 9.6 2.6 15.6M49.5 19.5c2 3.2 2.4 7.4 1.6 11.6" fill="none" stroke="${SAL2}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M12 24c4-4.5 10-6.5 17-7" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>
    <g class="m-eyes-open"><ellipse cx="25" cy="43" rx="2.8" ry="3.4" fill="#2A211D"/><ellipse cx="39" cy="43" rx="2.8" ry="3.4" fill="#2A211D"/><circle cx="26" cy="41.7" r="1" fill="#fff"/><circle cx="40" cy="41.7" r="1" fill="#fff"/><circle cx="24.4" cy="44.4" r=".5" fill="#fff" opacity=".6"/><circle cx="38.4" cy="44.4" r=".5" fill="#fff" opacity=".6"/></g>
    <g class="m-eyes-closed" stroke="#2A211D" stroke-width="2" fill="none" stroke-linecap="round"><path d="M22 43.5q3 2.6 6 0M36 43.5q3 2.6 6 0"/></g>
    <g class="m-eyes-happy" stroke="#2A211D" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M22 44q3-3.6 6 0M36 44q3-3.6 6 0"/></g>
    <ellipse class="m-blush" cx="19.5" cy="48" rx="3.2" ry="1.9" fill="#FF8FA0" opacity=".55"/><ellipse class="m-blush" cx="44.5" cy="48" rx="3.2" ry="1.9" fill="#FF8FA0" opacity=".55"/>
    <path class="m-mouth-smile" d="M29 48.5q3 3 6 0" stroke="#2A211D" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path class="m-mouth-open" d="M28.6 48c0 3.6 1.6 5 3.4 5s3.4-1.4 3.4-5z" fill="#B23A3A" stroke="#2A211D" stroke-width="1.2" stroke-linejoin="round"/>
    <path class="m-mouth-flat" d="M29.5 49.5h5" stroke="#2A211D" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g class="m-zzz" fill="#8E8E99" font-family="ui-rounded,Nunito,system-ui,sans-serif" font-weight="900"><text x="50" y="18" font-size="9">z</text><text x="55" y="11" font-size="7">z</text></g>
  <g class="m-stars" fill="#FFC83A"><path d="M8 12l1.4 3 3 1.4-3 1.4L8 21l-1.4-3.2-3-1.4 3-1.4zM56 6l1 2.2 2.2 1-2.2 1L56 12.4l-1-2.2-2.2-1 2.2-1z"/></g>
</svg>`;

/* ---------- Palillos de la bienvenida ---------- */
export const CHOPSTICKS = `<svg viewBox="0 0 200 200" class="cs-svg" aria-hidden="true">
  <defs><linearGradient id="cs-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C98A4B"/><stop offset=".5" stop-color="#E2A866"/><stop offset="1" stop-color="#B9773A"/></linearGradient></defs>
  <g class="cs-l"><rect x="94" y="-10" width="9" height="150" rx="4.5" fill="url(#cs-wood)"/><rect x="94" y="-10" width="9" height="26" rx="4.5" fill="#7A3F1D"/></g>
  <g class="cs-r"><rect x="97" y="-10" width="9" height="150" rx="4.5" fill="url(#cs-wood)"/><rect x="97" y="-10" width="9" height="26" rx="4.5" fill="#7A3F1D"/></g>
  <g class="cs-piece" transform="translate(64 112) scale(1.5)">${ICON.nigiri}</g>
</svg>`;
