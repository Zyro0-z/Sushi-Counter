// Iconos propios: piezas (48×48), interfaz (24×24), medallas, alérgenos, mascota y bienvenida.

export const RICE = '#F7F2E8', GRAIN = '#E4D9C3', NORI = '#1F2D26', SAL = '#FF7F5C', SAL2 = '#FFC9B4', AVO = '#93C252', TUNA = '#D7374A', TUNA2 = '#EE7380';

/* Utilidades de color */
function hexRgb(hex) { const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim()); if (!m) return [128, 128, 128]; const v = parseInt(m[1], 16); return [v >> 16, v >> 8 & 255, v & 255]; }
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
export const lighten = (c, t) => mix(c, '#ffffff', t);
export const darken = (c, t) => mix(c, '#000000', t);

const SH = (cx = 24, rx = 15) => `<ellipse cx="${cx}" cy="42" rx="${rx}" ry="2.4" class="shd"/>`;
const dots = (pts, r, fill, extra = '') => pts.map(([x, y, rot = 0]) => `<ellipse cx="${x}" cy="${y}" rx="${r[0]}" ry="${r[1]}" fill="${fill}" transform="rotate(${rot} ${x} ${y})"${extra}/>`).join('');
const circ = (pts, r, fill, extra = '') => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${extra}/>`).join('');
const HL = (d, o = .6, w = 1.8) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const steam = (xs, y0 = 14) => `<g class="steam" stroke="#B9B9C2" stroke-width="1.6" fill="none" stroke-linecap="round">${xs.map(x => `<path d="M${x} ${y0}c-1.6-2 1.6-3 0-5.2s1.6-3 0-5"/>`).join('')}</g>`;
const sizzle = pts => `<g class="sizzle">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#F8D17D"/>`).join('')}</g>`;

const RICEBASE = `<rect x="9" y="22" width="30" height="17" rx="8.5" fill="${RICE}" class="rim"/>` + dots([[15,33,-20],[21,36,15],[27.5,33.5],[33.5,35.5,-25],[18,30],[31,30,30],[25,37.2,-10]],[1.7,1],GRAIN);
const FISH = 'M5.5 25C5.5 18 13.5 13.5 24 13.5S42.5 17.5 42.5 23.5c0 3-2.4 4.6-6 4.5L11.5 29.5C7.8 29.8 5.5 28.2 5.5 25Z';
const STRIPES = 'M13.5 15.8c2.4 3.4 3 8 2 13M21.5 14c2.4 3.6 3.1 8.6 2.1 14.4M29.5 14.4c2.3 3.4 3 8 2.2 13.4M37 17c1.6 2.6 2 6 1.3 10';
const nigiri = (fish, stripe, so = 1) => SH() + RICEBASE + `<path d="${FISH}" fill="${fish}"/><path d="${STRIPES}" fill="none" stroke="${stripe}" stroke-opacity="${so}" stroke-width="1.7" stroke-linecap="round"/>` + HL('M9.5 21c3-3.4 8-5 13.5-5.2');
const sashimi = (a, b, c, s) => SH() + `<path d="M7 37C5 23 17 9 41 8c2 17-11 30-34 29Z" fill="#5DAA47"/>
  <path d="M9 35C17 26 27 17 38 11M17 27.5l-1.5-5M24 21.5l-1-5.5M30 16.5l-.5-5" stroke="#4A8F38" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  <g transform="rotate(-30 24 24)"><rect x="10.5" y="12.5" width="9.5" height="24" rx="4.75" fill="${a}"/><rect x="19.3" y="11.5" width="9.5" height="24" rx="4.75" fill="${b}"/><rect x="28.1" y="10.5" width="9.5" height="24" rx="4.75" fill="${c}"/>
  <path d="M12.6 20l2.7 1.6 2.7-1.6M12.6 27l2.7 1.6 2.7-1.6M21.4 19l2.7 1.6 2.7-1.6M21.4 26l2.7 1.6 2.7-1.6M30.2 18l2.7 1.6 2.7-1.6M30.2 25l2.7 1.6 2.7-1.6" stroke="${s}" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M31 13.5v4" stroke="#fff" stroke-opacity=".7" stroke-width="1.5" stroke-linecap="round"/></g>`;
const bowl = (outer, inner, band) => `<path d="M6 22h36c0 9.4-8 17-18 17S6 31.4 6 22Z" fill="${outer}" class="rim"/>${band ? `<path d="M7.6 28.5c3.8 1.6 9.6 2.6 16.4 2.6s12.6-1 16.4-2.6" stroke="${band}" stroke-width="1.6" fill="none"/>` : ''}<rect x="17" y="38" width="14" height="3" rx="1.5" fill="${outer}"/><ellipse cx="24" cy="22" rx="18" ry="5" fill="${inner}"/>`;
const ROE_PTS = [[14.5,18.6],[19,17],[24,16.4],[29,17],[33.5,18.6],[16.8,21.6],[21.4,20.4],[26.6,20.4],[31.2,21.6],[24,22.8],[19.2,13.6],[24,12.4],[28.8,13.6],[21.6,9.6],[26.4,9.6]];
const roe = (c = '#FF8A1F') => ROE_PTS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.45" fill="${c}"/><circle cx="${x}" cy="${y}" r="2.45" fill="none" stroke="${darken(c, .2)}" stroke-width=".5"/><circle cx="${x - .8}" cy="${y - .9}" r=".75" fill="#FFF1D6"/>`).join('');
const gunkanBase = top => SH() + `<rect x="9" y="19" width="30" height="21" rx="9" fill="${NORI}" class="rim"/><path d="M12.5 27v6M17 28.5v7" stroke="#fff" stroke-opacity=".14" stroke-width="2" stroke-linecap="round"/><ellipse cx="24" cy="19.5" rx="15" ry="5.6" fill="${RICE}"/>` + top;
const skewer = (c, hi) => SH() + `<path d="M5 41L44 8" stroke="#D9B98A" stroke-width="2.4" stroke-linecap="round"/>`
  + [[13,33.5],[23.5,24.5],[34,15.5]].map(([x, y]) => `<rect x="${x-6}" y="${y-5}" width="12" height="10" rx="4.5" transform="rotate(-40 ${x} ${y})" fill="${c}"/><rect x="${x-4.5}" y="${y-4}" width="8" height="4" rx="2" transform="rotate(-40 ${x} ${y})" fill="${hi}"/><circle cx="${x-1.8}" cy="${y-2.6}" r="1" fill="#fff" opacity=".7"/>`).join('')
  + `<circle cx="18.2" cy="29" r="2.8" fill="#D6EAA6" stroke="#7FB04A" stroke-width="1"/><circle cx="28.8" cy="20" r="2.8" fill="#D6EAA6" stroke="#7FB04A" stroke-width="1"/>`;
const makiOf = (fill, wedge) => SH() + `<circle cx="24" cy="23" r="17" fill="${NORI}" class="rim"/>` + HL('M10.8 16a15.6 15.6 0 0 1 9.4-8', .2, 2) + `<circle cx="24" cy="23" r="13" fill="${RICE}"/>`
  + dots([[17,15.5,-30],[30.5,15,20],[35,23,80],[31,31,-40],[18,31.5,30],[13.5,23,90],[24,12.5],[24.5,34]],[1.6,.9],GRAIN)
  + `<circle cx="24" cy="23" r="6.4" fill="${fill}"/><path d="M24 16.6a6.4 6.4 0 0 1 6.4 6.4H24Z" fill="${wedge}"/>` + HL('M20.2 20.6a4.2 4.2 0 0 1 2.4-2.2', .65, 1.4);
const balls = (a, b) => SH() + `<circle cx="31" cy="25" r="10.5" fill="${b}"/><circle cx="17.5" cy="28" r="11" fill="${a}"/>`
  + dots([[11,30],[15,34],[21,33.5],[24,27],[19,22],[13,25],[34,20],[37,26],[33,30.5],[28.5,22]],[.6,.6],'#fff',' opacity=".9"') + dots([[13.5,23.5,-30],[28,19.5,-30]],[3,1.9],'#fff',' opacity=".55"');
const sideRoll = top => SH() + `<rect x="5" y="22" width="38" height="16" rx="8" fill="${RICE}" class="rim"/>` + dots([[10,32],[17,34,20],[24,32],[31,34,-20],[38,32]],[1.5,.9],GRAIN)
  + `<path d="M12.6 23.5v14M20.2 23.5v14M27.8 23.5v14M35.4 23.5v14" stroke="${GRAIN}" stroke-width=".9"/>`
  + [8,14.5,21,27.5,34].map((x, i) => `<ellipse cx="${x+3}" cy="21.5" rx="6.6" ry="5" fill="${i % 2 ? darken(top, .1) : top}"/><path d="M${x-3.2} 20.6c2-3.6 7-4.6 10.6-2" stroke="${lighten(top, .45)}" stroke-width="1" fill="none" stroke-linecap="round"/>`).join('');

export const ICON = {
  nigiri: nigiri(SAL, SAL2),
  nigiri_atun: nigiri(TUNA, TUNA2, .6),
  nigiri_anguila: SH() + RICEBASE + `<path d="${FISH}" fill="#8E4B22"/><path d="M8 24c5-3 10-5 16-5.5M14 27c6-2.4 13-3.6 22-3.6" stroke="#5A2A0F" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    + HL('M9.5 21c3-3.4 8-5 13.5-5.2', .45) + `<rect x="21" y="12.8" width="6.4" height="27" rx="1.2" fill="${NORI}" class="rim"/>` + dots([[12,22,30],[16,25,-20],[33,19,40],[36,23,-10]],[1.1,.6],'#F4E6C8'),
  ebi: SH() + RICEBASE + `<path d="M6 24.5C6 18.5 13 15 22 15s15 2.5 17 6c1 2 0 4-3 4.4L11 28.6C8 29 6 27.4 6 24.5Z" fill="#FFF1E8"/>
    <path d="M12 16.6c2 3.2 2.4 7.4 1.6 11.6M18.5 15.3c2 3.4 2.6 8 1.8 12.5M25 15.2c2 3.3 2.5 7.6 1.8 11.8M31.5 16.4c1.7 2.8 2.2 6.4 1.6 9.8" stroke="#FF6B3D" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M37.5 19.5l7-5.5-.8 7.2 1.4 6.4-7-4.2Z" fill="#EE4B2B"/><path d="M38.5 21.5l5.5-5" stroke="#B9301A" stroke-width=".8"/>` + HL('M9 21.5c3-3.2 7.5-4.6 12-4.8', .7),
  sashimi: sashimi('#EE6447', SAL, '#FF9673', SAL2),
  sashimi_atun: sashimi('#C42C40', TUNA, '#E2505F', TUNA2),
  tataki: SH() + `<rect x="4" y="26" width="40" height="13" rx="6.5" fill="#F2EEE8" class="rim"/><rect x="7" y="28" width="34" height="9" rx="4.5" fill="#E4DED4"/>`
    + [[8,15,-8],[18.8,13.5,-4],[29.6,14.5,6]].map(([x, y, r]) => `<g transform="rotate(${r} ${x+5} ${y+8})"><rect x="${x}" y="${y}" width="10.4" height="16" rx="2.2" fill="#5E4A40"/><rect x="${x+1.5}" y="${y+1.5}" width="7.4" height="13" rx="1.4" fill="${TUNA}"/><rect x="${x+2.6}" y="${y+2.6}" width="2" height="7" rx="1" fill="#fff" opacity=".35"/></g>`).join('')
    + dots([[11,14.6,20],[14,14.2,-30],[22,12.8,10],[25,13,-20],[33,13.8,30],[36.5,14.5,0]],[1,.55],'#F4E8CF')
    + circ([[16,23],[27.5,21],[35,24]],1.4,'none',' stroke="#8CC152" stroke-width="1"'),
  maki: makiOf(SAL, AVO),
  uramaki: SH() + `<circle cx="24" cy="23" r="17" fill="${RICE}" class="rim"/>`
    + dots([[13,17,30],[26,8.5,-10],[38,19,60],[32,35,-30],[15,34,40],[10.5,26,80]],[1.4,.75],'#D8B377')
    + dots([[18.5,10.5,-40],[33,11.5,20],[37.5,28,100],[23,37.5,0],[11,20.5,60]],[1.4,.75],'#2A2522')
    + `<circle cx="24" cy="23" r="9.6" fill="${NORI}"/><circle cx="24" cy="23" r="7.6" fill="#FFF6EE"/><path d="M24 15.4a7.6 7.6 0 0 0 0 15.2Z" fill="${SAL}"/><path d="M24 15.4a7.6 7.6 0 0 1 7.6 7.6H24Z" fill="${AVO}"/>`,
  california: SH() + `<circle cx="24" cy="23" r="17" fill="#FF9A3C" class="rim"/>`
    + circ([[24,7.6],[30,8.8],[35.4,12],[38.8,17.2],[39.6,23],[38.6,29],[35.2,34],[30,37.4],[24,38.4],[18,37.4],[12.8,34],[9.4,29],[8.4,23],[9.2,17.2],[12.6,12],[18,8.8],[27,8],[21,8],[33,10.2],[15,10.2],[37.4,14.5],[10.6,14.5],[39.4,20],[8.6,20],[39.4,26],[8.6,26],[37,31.6],[11,31.6],[33,36],[15,36],[27,38],[21,38]],1.35,'#FF7A1A')
    + `<circle cx="24" cy="23" r="12" fill="${RICE}"/><circle cx="24" cy="23" r="7.4" fill="${NORI}"/><circle cx="24" cy="23" r="6" fill="#FFF6EE"/>
      <rect x="19" y="19.5" width="10" height="3.6" rx="1.2" fill="#F2564A"/><rect x="19" y="21.6" width="10" height="1.5" fill="#fff"/><path d="M19.5 24.6h5l-1 3.6h-3Z" fill="${AVO}"/><rect x="25.5" y="24.4" width="3.2" height="3.6" rx=".8" fill="#B5DB8A"/>`,
  futomaki: SH() + `<circle cx="24" cy="23" r="18" fill="${NORI}" class="rim"/><circle cx="24" cy="23" r="14.6" fill="${RICE}"/>` + dots([[14,18,-30],[34,18,30],[16,31,40],[32,31,-40],[24,10.5]],[1.6,.9],GRAIN)
    + `<rect x="17.5" y="15.5" width="7" height="6.4" rx="1.2" fill="#FFD84A"/><rect x="25" y="15.5" width="6" height="6.4" rx="1.2" fill="#F2564A"/><rect x="25" y="17.6" width="6" height="1.2" fill="#fff" opacity=".8"/>
      <rect x="16.5" y="22.5" width="6" height="7.5" rx="1.2" fill="#7CC04B"/><rect x="23" y="22.5" width="4.6" height="7.5" rx="1.2" fill="#F07B2C"/><rect x="28.2" y="22.5" width="4" height="7.5" rx="1.2" fill="#7A4A2A"/>`,
  dragon: sideRoll('#9CCB55') + `<path d="M7 19l4.2 2.4 4.2-2.4 4.2 2.4 4.2-2.4 4.2 2.4 4.2-2.4 4.2 2.4 4.2-2.4" stroke="#5A2A0F" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M41 22l5.5-4-1 5.2 1.2 4.6-5.4-3Z" fill="#EE4B2B"/>` + dots([[12,17.5],[22,17],[31,17.5]],[.9,.5],'#F4E6C8'),
  gunkan: gunkanBase(`<ellipse cx="35" cy="13" rx="4.4" ry="2.6" transform="rotate(-25 35 13)" fill="#7FB85A"/><ellipse cx="35" cy="13" rx="2.6" ry="1.4" transform="rotate(-25 35 13)" fill="#C7E3A6"/>` + roe()),
  temaki: SH(25,13) + `<path d="M11.5 17.5L29.5 41.5c1 1.4 3 1.1 3.4-.6L39.5 15Z" fill="${NORI}" class="rim"/><path d="M17 21.5l11.5 15.5" stroke="#fff" stroke-opacity=".15" stroke-width="2" stroke-linecap="round"/>
      <rect x="28" y="3.5" width="3.2" height="12" rx="1.6" transform="rotate(22 29.6 9.5)" fill="#86C25C"/><rect x="32.4" y="5.5" width="3.2" height="11" rx="1.6" transform="rotate(40 34 11)" fill="#A9D67E"/>
      <ellipse cx="25.5" cy="16.2" rx="14" ry="5.2" transform="rotate(-5 25.5 16.2)" fill="${RICE}"/><path d="M15.2 15.2c1.4-6.6 8.6-9.8 13.2-6.6-1 4.6-7 7.8-13.2 6.6Z" fill="${SAL}"/>
      <path d="M18.6 11.6c2.3-1.6 5-2.1 7.2-1.3" stroke="${SAL2}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M29.5 17.2c2-3.2 6.2-4.2 8.8-2.6-1.5 2.8-5.2 3.8-8.8 2.6Z" fill="#E9F3C8"/>`,
  gyoza: SH() + `<path d="M5.5 31C5.5 21.5 13.8 14 24 14s18.5 7.5 18.5 17c0 2.8-1.8 4.2-4.8 4.2H10.3c-3 0-4.8-1.4-4.8-4.2Z" fill="#F3DDAE"/>
      <path d="M6 31.6c3.6 2.2 9 3.2 18 3.2s14.4-1 18-3.2c.2 2.4-1.6 3.6-4.4 3.6H10.4C7.6 35.2 5.8 34 6 31.6Z" fill="#C88A3E"/>
      <path d="M13 19l2.4 5.2M18.4 15.8l1.5 5.6M24 14.6v5.8M29.6 15.8l-1.5 5.6M35 19l-2.4 5.2" stroke="#D6AF6F" stroke-width="2" stroke-linecap="round"/>` + HL('M10 27.5c2-3 5-5 8-6') + sizzle([[4,33],[44,33],[8,37],[40,37],[24,38]]),
  tempura: SH() + `<path d="M38.5 15.5c2.4-4.4 6.6-5.4 8.4-3.2-1.4 1.2-1.6 3.4-.4 5.4-2.4 1.4-5.6 1-8-2.2Z" fill="#E8503A"/><path d="M41 14.5l3.5 1" stroke="#B8321F" stroke-width="1" stroke-linecap="round"/>
      <path d="M8.5 35c-3-11 4.5-21.5 17-23.5 7.5-1.2 12.4 1.6 14 5.5-6.4-.6-12.4 1.6-16.4 6.4-3 3.7-4.2 7.8-4.4 12-3.6 1.4-8.2 1.4-10.2-.4Z" fill="#E7A646"/>`
    + dots([[13,30.5],[16,24],[21,18.5],[27,15],[33,15],[11.5,25.5],[18,29.5],[23.5,22],[29.5,19],[14.5,34.5],[36,16.5]],[1.5,1.3],'#F8D17D')
    + dots([[19,26],[25.5,18],[13.8,28.3],[30,15.8]],[.9,.8],'#B8742A') + HL('M11 29c1-6 5-11 11-13.5', .45, 1.7) + sizzle([[6,38],[20,38],[42,20]]),
  pollo_teriyaki: skewer('#A8521E', '#D07A35') + dots([[12,31,20],[23,22,-20],[34,13,30],[15,35],[26,26]],[.9,.5],'#FFF4DC'),
  karaage: SH() + `<path d="M30 14.6a7.5 7.5 0 0 1 14 0Z" fill="#FFE066" class="rim"/><path d="M31.6 14.2a5.6 5.6 0 0 1 10.8 0" stroke="#FFF6B8" stroke-width="1.6" fill="none"/><path d="M37 8.5v5.6M33.5 10.5l3 3.6M40.5 10.5l-3 3.6" stroke="#E8C02E" stroke-width=".8"/>
      <path d="M19 24c0-6.4 5-10 11-9.4 5.4.4 9.4 4.6 8.6 9.6-.6 5-5.4 8-10.6 7.8C22 31.8 19 29 19 24Z" fill="#D58A36"/>
      <path d="M6.5 32c-.8-5.4 3.4-9.6 8.6-9.6 4.6-.6 8.6 2.4 8.6 6.6.6 4.4-2.8 8.4-7.8 8.6-4.6.6-8.8-1.6-9.4-5.6Z" fill="#C67828"/>
      <path d="M24 35.4c-1-4.2 2-7.6 6.2-7.6 4.2-.6 7.4 2.2 7.4 5.6s-3 6.2-7.4 6.2c-3.4.2-5.6-1.6-6.2-4.2Z" fill="#DE9640"/>`
    + dots([[10,29],[14,26],[18,30],[12,34],[22,21],[27,18],[33,20],[30,25],[27,33],[32,31],[35,35]],[1.2,1],'#F0B865') + dots([[16,33],[25,22],[29,36],[11,31.5]],[.8,.7],'#8E4E14') + sizzle([[5,36],[40,38],[22,16]]),
  pato: SH() + `<g transform="rotate(-24 24 26)"><rect x="5" y="20" width="31" height="13" rx="6.5" fill="#F5E6C6" class="rim"/><path d="M12 21.5c3 3 3 7 0 10" stroke="#E2CC9C" stroke-width="1.2" fill="none"/>
      <path d="M36 21h6.5v2H36zM36 25h8v2.2h-8zM36 29h6v2h-6z" fill="#7CC04B"/><path d="M36 23h7v1.8h-7z" fill="#F4F9EC"/><path d="M36 27.2h5.6v1.8H36z" fill="#9C3A1A"/>
      <ellipse cx="36" cy="26.5" rx="3.6" ry="6.5" fill="#E8D2A3"/><ellipse cx="36" cy="26.5" rx="2.4" ry="5" fill="#8E3B1C"/><path d="M35 23.6c.8-.6 1.6-.6 2.2 0" stroke="#D9773A" stroke-width="1" fill="none"/></g>` + HL('M10 31c4-1.6 10-4.4 15-7', .55, 1.6) + circ([[10,38],[13,39.5]],1.3,'#4A1E12'),
  rollito: SH() + `<ellipse cx="38" cy="36" rx="7" ry="3.4" fill="#F2EEE8" class="rim"/><ellipse cx="38" cy="35.4" rx="5.2" ry="2.2" fill="#E8442E"/>`
    + `<g transform="rotate(-22 22 24)"><rect x="5" y="15" width="32" height="10" rx="5" fill="#D9963B"/><rect x="7" y="26" width="32" height="10" rx="5" fill="#E7A84C"/><ellipse cx="37" cy="20" rx="2.6" ry="5" fill="#B8742A"/><ellipse cx="39" cy="31" rx="2.6" ry="5" fill="#C98535"/></g>`
    + circ([[10,25],[15,21.5],[21,20],[27,16],[12,33],[18,31],[24,28],[30,24.5],[34,22]],1.3,'#F4C877') + HL('M9 22.5c5-3 12-6 20-8.5', .5, 1.5),
  bao: SH() + `<path d="M5 30c0 4.4 3.4 7.6 7.6 7.6h22.8c4.2 0 7.6-3.2 7.6-7.6Z" fill="#F6EFE0" class="rim"/>
      <path d="M8 28.5c4-1.4 9-1.6 16-1.6s12 .4 16 1.6l-1 3H9Z" fill="#9C4A23"/><path d="M10 29.6c4-1 9-1.2 14-1.2" stroke="#F2D2B6" stroke-width="1" fill="none"/>
      <path d="M9 27.4l5-2.6 3 2.6 4-3 3 2.8 4-3 3 2.6 4-2.6 4 3.2" stroke="#6DB33F" stroke-width="2.4" fill="none" stroke-linejoin="round"/>
      <path d="M7 26c1.6-8 9-12.6 17-12.6S39.4 18 41 26c-5-2.2-10.6-3.2-17-3.2S12 23.8 7 26Z" fill="#FFFBF4" class="rim"/>` + HL('M12 19.5c3-2.6 7-4 11-4.2', .9, 1.6) + circ([[18,26.4],[30,26]],1.2,'#E3B26B'),
  takoyaki: SH() + `<path d="M4 28h40l-4.4 9.4c-.6 1.2-1.8 2-3.2 2H11.6c-1.4 0-2.6-.8-3.2-2Z" fill="#C9A06A" class="rim"/><path d="M4 28h40" stroke="#E6C38E" stroke-width="1.6"/>`
    + [[13.5,24],[24,22],[34.5,24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.2" fill="#C8803A"/><path d="M${x-6} ${y-1}c1.6-5 10.4-5 12 0-3 1.4-9 1.4-12 0Z" fill="#5A2A0F"/>`).join('')
    + `<path d="M8 19.5l3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2 3 2" stroke="#FFF8EE" stroke-width="1.2" fill="none" stroke-linejoin="round"/>` + circ([[12,18],[20,16],[27,15.6],[35,18],[16,22],[31,21]],.8,'#3E8E3A')
    + `<g class="bonito"><path d="M22 13c1.4-1 3-1 4 .2M30 16c1.2-1.2 3-1 3.8.4M14 16.6c1-1 2.6-.8 3.2.4" stroke="#F2B39A" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`,
  yakisoba: SH() + bowl('#EDE8DE', '#C79B57', '#3E6FB0') + `<path d="M9 21c2 2 4-1.6 6 0s4-1.6 6 0 4-1.6 6 0 4-1.6 6 0 4-1.6 6 0M10 23.6c2 1.6 4-1.4 6 0s4-1.4 6 0 4-1.4 6 0 4-1.4 6 0 4-1.4 5 0M12 19c2 1.4 4-1.4 6 0s4-1.4 6 0 4-1.4 6 0 4-1.4 5 0" stroke="#E7BB6E" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M15 20.5l3 1M28 22l3.4-.6M21 18.6l2.6 1.2" stroke="#F07B2C" stroke-width="1.8" stroke-linecap="round"/><path d="M33 19.4l2.6 1.4M17 23.4l2.4-.8" stroke="#7CC04B" stroke-width="2" stroke-linecap="round"/>
      <path d="M17 18L43 5M20.5 19.2L45 8.6" stroke="#A5713E" stroke-width="2" stroke-linecap="round"/>` + steam([10, 15], 16),
  arroz_frito: SH() + bowl('#EDE8DE', '#E9C878', '#3E6FB0') + `<path d="M8.5 22c1.8-7.6 8-11.4 15.5-11.4S37.7 14.4 39.5 22c-4.4 1.6-9.6 2.4-15.5 2.4S12.9 23.6 8.5 22Z" fill="#F0D488"/>`
    + circ([[15,18],[22,15],[30,16.6],[33,20.4],[19,21.4]],1.4,'#6DB33F') + dots([[18,16.4,30],[27,19,-20],[34,17.4,10],[13,21]],[1.6,1],'#F07B2C') + dots([[24,18.6],[28,14],[16,19.6],[31,21.6]],[1.8,1.2],'#FFD84A') + dots([[21,13.6],[25.5,22.2]],[1.5,1],'#F29BA0') + steam([19, 24, 29], 10),
  miso: SH() + `<path d="M6 22h36c0 9.4-8 17-18 17S6 31.4 6 22Z" fill="#3A1F1A" class="rim"/><rect x="17" y="38" width="14" height="3" rx="1.5" fill="#3A1F1A"/><ellipse cx="24" cy="22" rx="18" ry="5" fill="#B9352A"/>
      <ellipse cx="24" cy="22.2" rx="16" ry="4" fill="#C9935A"/><path d="M14 21.6c3-1.4 6 1 9-.4s6-1 8.6.6" stroke="#DDB27C" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <rect x="15" y="19.6" width="3.6" height="3.2" rx=".6" fill="#FBF7EE"/><rect x="27" y="21" width="3.6" height="3.2" rx=".6" fill="#FBF7EE"/><rect x="22" y="18.6" width="3" height="2.6" rx=".5" fill="#FBF7EE"/>
      <path d="M31.5 19.4c1.6.4 3 1.4 3.6 2.6M18.8 23.6c1.4-.2 2.6.2 3.4 1" stroke="#2F6B2E" stroke-width="1.8" fill="none" stroke-linecap="round"/>` + circ([[34,23.4],[12.6,22.6]],1.1,'none',' stroke="#7FC04B" stroke-width="1"') + steam([17, 24, 31], 15),
  wakame: SH() + `<ellipse cx="24" cy="33" rx="18" ry="7.4" fill="#EEF2F5" class="rim"/><ellipse cx="24" cy="32.4" rx="14.6" ry="5.2" fill="#D5DFE7"/>
      <g class="sway"><path d="M12 31c2-8 4-12 6-14M16 32c1-7 4-12 8-15M21 32c0-7 3-13 6-16M25 32c1-6 4-11 9-14M29 32c2-5 5-9 8-11M33 31c1-3 3-6 5-7M14 28c4-2 7-6 9-10M24 30c2-4 6-8 10-10" stroke="#3FAE49" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M18 30c2-5 4-9 7-11M27 30c2-4 4-7 7-9" stroke="#6FD06B" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>` + dots([[17,22],[22,19],[28,20],[31,24],[20,26],[25,25.6]],[1,.55],'#FFFFFF') + `<path d="M26 16.6l3.6-2.4M19.6 20l2.6-3" stroke="#E8442E" stroke-width=".9" stroke-linecap="round"/>`,
  edamame: SH() + `<path d="M7.5 33c-1.4-5.6 2.6-9.4 7.6-10.4 2.6-5.2 7.8-8.6 13-8.4 3.6-3.6 9.6-4.4 12.4-.8 2.6 3.4.6 8-4 9.6-1.6 4.6-5.6 7.8-10.8 8.8-3.6 4-9.6 6.6-14 5-2.2-.8-3.6-2-4.2-3.8Z" fill="#6FAF3E"/>
      <circle cx="14.5" cy="30.5" r="5" fill="#8CC759"/><circle cx="23.5" cy="23.5" r="5.3" fill="#8CC759"/><circle cx="33" cy="17" r="5" fill="#8CC759"/>`
    + dots([[12.8,28.6,-40],[21.7,21.4,-40],[31.3,15,-40]],[1.8,1],'#fff',' opacity=".55"') + `<path d="M40.5 12.5c1.4-2 3-3 5-3" stroke="#5E9634" stroke-width="2" stroke-linecap="round" fill="none"/>` + circ([[11,35],[19,33],[27,27],[36,21]],.6,'#fff',' opacity=".8"'),
  mochi: balls('#F7B9CC', '#BFDC9A'),
  helado: SH() + `<path d="M10 26h28l-3.4 10.4c-.6 1.8-2.2 3-4 3H17.4c-1.8 0-3.4-1.2-4-3Z" fill="#CFE3EF" class="rim"/><path d="M13 29.5h22" stroke="#fff" stroke-opacity=".6" stroke-width="1.4"/>
      <rect x="31" y="6" width="3.4" height="17" rx="1.7" transform="rotate(24 32.7 14.5)" fill="#E8C27A"/><path d="M31.4 9.4l3 1.4M30.4 12.4l3 1.4M29.4 15.4l3 1.4" stroke="#C99A4A" stroke-width=".8"/>
      <circle cx="18.5" cy="22.5" r="8" fill="#FFF3D6"/><circle cx="29" cy="21.5" r="8" fill="#F6A6B8"/><path d="M11 25c2 1.6 3 0 4.4 1.4s3-.4 4.6 1M22 24.4c2 1.4 3.4-.2 5 1.2s3-.2 4.4.8 2.4-.4 3.6.4" stroke="#fff" stroke-opacity=".8" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    + dots([[16,19,-30],[26.6,18,-30]],[2.4,1.4],'#fff',' opacity=".7"') + circ([[30,24.4],[33,21],[27,20.4]],.7,'#C83E62'),
  fruta: SH() + `<path d="M24 37L41 15.6c1.6 3.6 2 8 1 12.4L41 37Z" fill="#FFD84A"/><path d="M41 15.6c1.6 3.6 2 8 1 12.4L41 37" stroke="#8A6A2A" stroke-width="3" fill="none" stroke-linejoin="round"/>
      <path d="M27 33.4l3-3.6M31 33.6l3.6-4.4M35 32.4l3.4-4.2M30.6 27.6l4.4-4.6" stroke="#F2B620" stroke-width=".9"/>
      <path d="M5 37a13 13 0 0 1 26 0Z" fill="#FF9F1C" class="rim"/><path d="M7.4 37a10.6 10.6 0 0 1 21.2 0Z" fill="#FFC15E"/>
      <path d="M18 37V26.6M18 37l-7.4-5.6M18 37l7.4-5.6M18 37l-9.6-1.4M18 37l9.6-1.4" stroke="#FFE7B0" stroke-width="1.1"/><path d="M14 15c3-5 9-6 12-4-2 4-7 6-12 4Z" fill="#5DAA47"/><path d="M15 14.6c3-1.4 6-2.2 9.6-2.6" stroke="#4A8F38" stroke-width=".9" fill="none"/>`,
};
// Animación en reposo de algunos iconos
export const ICON_ANIM = {mochi:'bob', takoyaki:'bob', edamame:'wiggle', helado:'bob', gunkan:'shine', temaki:'wiggle'};

// Plantillas para piezas personalizadas (color principal → icono)
export const TPL = {
  nigiri: c => nigiri(c, lighten(c, .5)),
  sashimi: c => sashimi(darken(c, .12), c, lighten(c, .15), lighten(c, .55)),
  maki: c => makiOf(c, lighten(c, .35)),
  gunkan: c => gunkanBase(roe(c)),
  brocheta: c => skewer(c, lighten(c, .25)),
  bol: c => SH() + bowl('#EDE8DE', c, '#3E6FB0') + `<path d="M9 21.5c3 1.4 6-1 9 0s6-1.2 9 0 6-1 9 0" stroke="${lighten(c, .35)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` + steam([18, 24, 30], 14),
  bola: c => balls(c, lighten(c, .45)),
  roll: c => sideRoll(c),
};
export function iconInner(k, t) {
  if (ICON[k]) return ICON[k];
  if (t && t.tpl && TPL[t.tpl]) return TPL[t.tpl](t.color || SAL);
  return ICON.maki;
}

/* Iconos de interfaz (trazo) */
export const UI = {
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5.5 12h13"/>',
  plus2:'<path d="M8 6v8M4 10h8"/><path d="M15 12.5a2.5 2.5 0 1 1 4.3 1.7L15 19h5"/>',
  plus4:'<path d="M8 6v8M4 10h8"/><path d="M18.5 19v-8.5l-4.5 6h6"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', chev:'<path d="M9 5l7 7-7 7"/>', chevL:'<path d="M15 5l-7 7 7 7"/>', chevD:'<path d="M5 9l7 7 7-7"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  list:'<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.6" cy="6.5" r=".9" fill="currentColor"/><circle cx="4.6" cy="12" r=".9" fill="currentColor"/><circle cx="4.6" cy="17.5" r=".9" fill="currentColor"/>',
  more:'<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>',
  trash:'<path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l.9 12.6a1.6 1.6 0 0 0 1.6 1.4h6a1.6 1.6 0 0 0 1.6-1.4l.9-12.6M10 10.5v6M14 10.5v6"/>',
  star:'<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z"/>',
  starf:'<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" fill="currentColor"/>',
  pencil:'<path d="M15.5 4.5l4 4L9 19l-5 1 1-5z"/><path d="M13.5 6.5l4 4"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bolt:'<path d="M13 3L5.5 13.2h5.8L10.5 21 18.5 10.8h-5.8z"/>',
  flame:'<path d="M12 21c-3.9 0-6.4-2.7-6.4-6.2 0-3.3 2.4-5 3.5-8 1.5 1.6 2 3 2 4.6 1.2-1 2.6-3.4 2.3-6.4 3.4 2.2 5.2 5.9 5.2 9.8 0 3.5-2.6 6.2-6.6 6.2z"/>',
  dice:'<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>',
  info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
  share:'<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M8 10.5H6.5a1.5 1.5 0 0 0-1.5 1.5v7a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16"/>',
  wheel:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
  swords:'<path d="M4 4l9.5 9.5M4 4h3.5L15 11.5M4 4v3.5L11.5 15"/><path d="M20 4l-9.5 9.5M20 4h-3.5M20 4v3.5"/><path d="M14.5 16.5l3 3M16 14l4 4M6.5 19.5l3-3M4 18l4-4"/>',
  timer:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M9.5 2.8h5M18.5 6.5l1.4-1.4"/>',
  cloud:'<path d="M7 18.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 8.6a4.9 4.9 0 0 1-.8 9.9z"/>',
  people:'<circle cx="9" cy="8.5" r="3"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M14.5 14.6c2.6-.4 5 1 5.8 4.4"/>',
  camera:'<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3L9.2 5h5.6l1.4 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.4"/>',
  doc:'<path d="M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h6"/>',
  table:'<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16M4 14.5h16M10 5v14"/>',
  paint:'<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 1.6-2.1-.5-1.3.3-2.4 1.7-2.4h1.8a3.4 3.4 0 0 0 3.4-3.4C20.5 7.3 16.7 3.5 12 3.5z"/><circle cx="8" cy="11" r="1.2" fill="currentColor"/><circle cx="11" cy="7.6" r="1.2" fill="currentColor"/><circle cx="15.4" cy="8.4" r="1.2" fill="currentColor"/>',
  access:'<circle cx="12" cy="4.8" r="1.6"/><path d="M5 8.5c4.5 1 9.5 1 14 0M12 9.5v5M12 14.5l-3.5 6M12 14.5l3.5 6"/>',
  speaker:'<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  leaf:'<path d="M5 19C5 10 11 5 20 5c0 9-5 14-14 14z"/><path d="M5 19L13 11"/>',
  pin:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  chart:'<path d="M4 20h16"/><rect x="5.5" y="12" width="3" height="6" rx="1"/><rect x="10.5" y="7" width="3" height="11" rx="1"/><rect x="15.5" y="10" width="3" height="8" rx="1"/>',
  user:'<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/>',
  sparkles:'<path d="M10 3.5l1.6 4.4 4.4 1.6-4.4 1.6L10 15.5l-1.6-4.4L4 9.5l4.4-1.6zM17.5 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  book:'<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  play:'<path d="M7 4.5v15l12-7.5z"/>', pause:'<path d="M8 5v14M16 5v14"/>',
  warn:'<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17v.2"/>',
  tCount:'<circle class="fillsel" cx="10.5" cy="14" r="7.5"/><circle cx="10.5" cy="14" r="7.5"/><circle cx="10.5" cy="14" r="3.4"/><path d="M15.5 2.5l5.5 10.5M19.5 2l3.2 10.8"/>',
  tCh:'<path class="fillsel" d="M7.5 3.5h9v6a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 3.5h9v6a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 5.5H4.5a3 3 0 0 0 3.3 4.4M16.5 5.5h3a3 3 0 0 1-3.3 4.4M12 14v3.5M8 20.5h8M9.5 17.5h5"/>',
  tHist:'<circle class="fillsel" cx="12" cy="12" r="8.5"/><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3 3.8V8h4.2"/><path d="M12 7.5V12l3.2 2"/>',
  tSet:'<path d="M4 7h8.5M17.5 7H20M4 17h2.5M11.5 17H20"/><circle class="fillsel" cx="15" cy="7" r="2.4"/><circle cx="15" cy="7" r="2.4"/><circle class="fillsel" cx="9" cy="17" r="2.4"/><circle cx="9" cy="17" r="2.4"/>',
};
export const ui = (k, cls = '', st = '') => `<svg viewBox="0 0 24 24" class="mono ${cls}" aria-hidden="true"${st ? ` style="${st}"` : ''}>${UI[k] || ''}</svg>`;

/* Alérgenos (trazo 24×24) */
export const ALG = {
  gluten:'<path d="M12 21V7"/><path d="M12 8c-2-1-3-3-3-5 2 0 3 2 3 5zM12 8c2-1 3-3 3-5-2 0-3 2-3 5zM12 13c-2.5-.5-4-2.5-4-5 2.5.5 4 2.5 4 5zM12 13c2.5-.5 4-2.5 4-5-2.5.5-4 2.5-4 5zM12 18c-2.5-.5-4-2.5-4-5 2.5.5 4 2.5 4 5zM12 18c2.5-.5 4-2.5 4-5-2.5.5-4 2.5-4 5z"/>',
  crustaceos:'<path d="M6 8c4-3 11-3 13 3 1.5 4.5-1.5 9-6 9H9"/><path d="M9 20l-3 1.5L7 18M10 11c1 2 1 4 0 6M14 10c1.5 2.5 1.5 5 0 7"/><path d="M6 8L3 5M7 7L5 3.5"/>',
  moluscos:'<path d="M12 4c-5 0-8.5 4-8.5 8.5 0 1.5.5 3 1.5 4.5h14c1-1.5 1.5-3 1.5-4.5C20.5 8 17 4 12 4z"/><path d="M12 4v13M8 5.5l2 11.5M16 5.5l-2 11.5M5 9l4 8M19 9l-4 8"/><path d="M8 17v2.5h8V17"/>',
  pescado:'<path d="M7 12c2.5-4 6-6 9.5-6 2.5 0 4 2.5 4.5 6-.5 3.5-2 6-4.5 6-3.5 0-7-2-9.5-6z"/><path d="M7 12L3 8.5v7z"/><circle cx="16.5" cy="10.5" r=".9" fill="currentColor"/>',
  huevo:'<path d="M12 3.5c3.6 0 6.5 5.4 6.5 10a6.5 6.5 0 0 1-13 0c0-4.6 2.9-10 6.5-10z"/>',
  lacteos:'<path d="M9 3.5h6M9.5 3.5v3L7 10v10.5h10V10l-2.5-3.5v-3"/><path d="M7 13h10"/>',
  soja:'<path d="M5 18c-1-3 1-5 3.5-5.5C10 9.5 13 7.5 16 8c2-2.5 5-2.5 5.5 0 .5 2.5-1.5 4.5-4 5-1 3-3.5 5-6.5 5.5-2 2-5 2.5-6 .5z"/><circle cx="9" cy="15.5" r="1.6"/><circle cx="13.5" cy="12" r="1.6"/><circle cx="18" cy="9.5" r="1.4"/>',
  sesamo:'<path d="M8 5c1.6 1.6 1.6 4.4 0 6-1.6-1.6-1.6-4.4 0-6zM16 8c1.6 1.6 1.6 4.4 0 6-1.6-1.6-1.6-4.4 0-6zM10 13.5c1.6 1.6 1.6 4.4 0 6-1.6-1.6-1.6-4.4 0-6z"/>',
  cacahuete:'<path d="M12 3.5c2.5 0 4.2 2 4.2 4.3 0 1.4-.8 2.4-.8 4.2s.8 2.8.8 4.2c0 2.3-1.7 4.3-4.2 4.3s-4.2-2-4.2-4.3c0-1.4.8-2.4.8-4.2S7.8 9.2 7.8 7.8c0-2.3 1.7-4.3 4.2-4.3z"/><path d="M10 7.5h.1M14 9h.1M10.5 15h.1M13.5 16.5h.1"/>',
};
export const alg = (k, st = '') => `<svg viewBox="0 0 24 24" class="mono" aria-hidden="true"${st ? ` style="${st}"` : ''}>${ALG[k] || ''}</svg>`;

/* Glifos de medallas (trazo blanco) */
export const GLYPH = {
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8" fill="#fff"/>',
  layers:'<path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/>',
  balance:'<path d="M12 4v15M7 20h10M5 7.5h14"/><path d="M5 7.5l-2.6 6h5.2zM19 7.5l-2.6 6h5.2z"/>',
  bolt:'<path d="M13 3L5.5 13.2h5.8L10.5 21 18.5 10.8h-5.8z" fill="#fff" fill-opacity=".25"/>',
  flame:'<path d="M12 21c-3.9 0-6.4-2.7-6.4-6.2 0-3.3 2.4-5 3.5-8 1.5 1.6 2 3 2 4.6 1.2-1 2.6-3.4 2.3-6.4 3.4 2.2 5.2 5.9 5.2 9.8 0 3.5-2.6 6.2-6.6 6.2z" fill="#fff" fill-opacity=".25"/>',
  coin:'<circle cx="12" cy="12" r="8.5"/><path d="M15.2 8.6a4.4 4.4 0 1 0 0 6.8M7.6 11h6M7.6 13.5h6"/>',
  down:'<path d="M4 6l6 6 3.5-3.5L20 15"/><path d="M15 15h5v-5"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>',
  crown:'<path d="M4.5 17.5L3.5 8l5 4 3.5-6 3.5 6 5-4-1 9.5z" fill="#fff" fill-opacity=".25"/><path d="M5 20.5h14"/>',
  star:'<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" fill="#fff" fill-opacity=".25"/>',
  compass:'<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="#fff" fill-opacity=".3"/>',
  rainbow:'<path d="M3.5 17a8.5 8.5 0 0 1 17 0M7 17a5 5 0 0 1 10 0"/>',
  moon:'<path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z" fill="#fff" fill-opacity=".2"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  cal:'<rect x="4" y="5.5" width="16" height="14" rx="3"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  people:'<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.4"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M14.5 14.6c2.6-.4 5 1 5.8 4.4"/>',
  map:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  stack:'<rect x="5" y="14" width="14" height="5" rx="2"/><rect x="6.5" y="9" width="11" height="5" rx="2"/><rect x="8" y="4" width="8" height="5" rx="2"/>',
  gem:'<path d="M6 4h12l3 5-9 11L3 9z" fill="#fff" fill-opacity=".2"/><path d="M3 9h18M9 4l3 16M15 4l-3 16"/>',
  trend:'<path d="M3.5 17l5-5 4 3.5 7.5-8"/><path d="M15 7.5h5v5"/>',
  heart:'<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="#fff" fill-opacity=".2"/>',
  rocket:'<path d="M12 3c3 2.4 4.5 5.6 4.5 9.6l-2 3.4h-5l-2-3.4C7.5 8.6 9 5.4 12 3z" fill="#fff" fill-opacity=".2"/><circle cx="12" cy="10" r="1.6"/><path d="M9.5 16l-1.5 4M14.5 16l1.5 4M12 16v5"/>',
  medal:'<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 3.5l3.5 5.5 3.5-5.5"/>',
  dish:'<path d="M3.5 12h17a8.5 8.5 0 0 1-17 0z" fill="#fff" fill-opacity=".2"/><path d="M8 20h8M12 4v4M9 5.5l1 2.5M15 5.5l-1 2.5"/>',
  swords:UI.swords, timer:UI.timer, wheel:UI.wheel, cloud:UI.cloud, sparkles:UI.sparkles, camera:UI.camera,
};
export const TIER_XP = {bronze:10, silver:25, gold:50, plat:100, accent:20};
export const TIER_NAME = {bronze:'Bronce', silver:'Plata', gold:'Oro', plat:'Platino', accent:'Personalizado'};
export function medal(ch, locked, cls = '', inner = null) {
  const g = ch.g || {};
  const fill = locked ? 'style="fill:var(--medal-off);stroke:var(--medal-off)"' : `fill="url(#g-${ch.tier})" stroke="url(#g-${ch.tier})"`;
  let mid = '';
  if (g.txt) mid = `<text class="mg" x="28" y="${g.txt.length > 2 ? 33 : 34.5}" text-anchor="middle" font-family="ui-rounded,'SF Pro Rounded',Nunito,system-ui,sans-serif" font-weight="900" font-size="${g.txt.length > 3 ? 12 : g.txt.length > 2 ? 15 : 19}" fill="#fff">${g.txt}</text>`;
  else if (g.p) mid = `<g class="mg" transform="translate(16 16)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GLYPH[g.p] || ''}</g>`;
  else if (g.icon) mid = `<g class="mi" transform="translate(12.5 11.5) scale(.65)">${inner || ICON[g.icon] || ''}</g>`;
  return `<svg viewBox="0 0 56 56" class="medal ${locked ? 'locked' : ''} ${cls}" aria-hidden="true">
    <path d="M28 5l20 11.5v23L28 51 8 39.5v-23z" ${fill} stroke-width="5" stroke-linejoin="round"/>
    ${locked ? '' : '<path d="M28 9.2l16.4 9.4v18.8L28 46.8 11.6 37.4V18.6z" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1.3" stroke-linejoin="round"/><path d="M10 17.5L28 7l18 10.5v6C35 19 21 19 10 23.5z" fill="#fff" opacity=".16"/>'}
    ${mid}</svg>`;
}

/* Mascota: Shari, un nigiri con cara. El ánimo se cambia con data-mood. */
export const MASCOT = `<svg viewBox="0 0 64 64" class="mascot-svg" aria-hidden="true">
  <ellipse cx="32" cy="59" rx="17" ry="2.6" class="shd"/>
  <g class="m-body">
    <g class="m-arms-down" stroke="#E6DCC8" stroke-width="4.2" stroke-linecap="round" fill="none"><path d="M13 43c-4 1.5-6 4.5-6 7.5"/><path d="M51 43c4 1.5 6 4.5 6 7.5"/></g>
    <g class="m-arms-up" stroke="#E6DCC8" stroke-width="4.2" stroke-linecap="round" fill="none"><path d="M13 40c-4-2-6-6-5.5-10"/><path d="M51 40c4-2 6-6 5.5-10"/></g>
    <rect x="11" y="27" width="42" height="29" rx="14.5" fill="${RICE}" class="rim"/>
    ${dots([[18,51,-20],[46,50,20],[24,54],[40,54,-10]],[1.8,1],GRAIN)}
    <path d="M6.5 31C6.5 21 17.5 15 32 15s25.5 5 25.5 13.5c0 4-3 6-8 6L15 35.5c-5.2.5-8.5-1.2-8.5-4.5Z" fill="${SAL}"/>
    <path d="M17 17.5c3 4.5 3.6 10 2.4 16M28 15.6c3 4.6 3.8 10.6 2.6 17.6M39.5 16c2.8 4.4 3.6 9.6 2.6 15.6M49.5 19.5c2 3.2 2.4 7.4 1.6 11.6" fill="none" stroke="${SAL2}" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 24c4-4.5 10-6.5 17-7" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.2" stroke-linecap="round"/>
    <g class="m-eyes-open"><ellipse cx="25" cy="43" rx="2.7" ry="3.3" fill="#2A211D"/><ellipse cx="39" cy="43" rx="2.7" ry="3.3" fill="#2A211D"/><circle cx="25.9" cy="41.8" r=".9" fill="#fff"/><circle cx="39.9" cy="41.8" r=".9" fill="#fff"/></g>
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

/* Palillos para la bienvenida */
export const CHOPSTICKS = `<svg viewBox="0 0 200 200" class="cs-svg" aria-hidden="true">
  <defs><linearGradient id="cs-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C98A4B"/><stop offset=".5" stop-color="#E2A866"/><stop offset="1" stop-color="#B9773A"/></linearGradient></defs>
  <g class="cs-l"><rect x="94" y="-10" width="9" height="150" rx="4.5" fill="url(#cs-wood)"/><rect x="94" y="-10" width="9" height="26" rx="4.5" fill="#7A3F1D"/></g>
  <g class="cs-r"><rect x="97" y="-10" width="9" height="150" rx="4.5" fill="url(#cs-wood)"/><rect x="97" y="-10" width="9" height="26" rx="4.5" fill="#7A3F1D"/></g>
  <g class="cs-piece" transform="translate(64 112) scale(1.5)">${ICON.nigiri}</g>
</svg>`;
