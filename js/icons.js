// Iconos de interfaz (trazo), alérgenos y medallas. Las ilustraciones de comida viven en art.js.
import {ICON, ICON_ANIM, TPL, iconInner, ICON_DEFS, ILLU, illu, MASCOT, CHOPSTICKS, RICE, GRAIN, NORI, SAL, SAL2, AVO, TUNA, TUNA2, mix, lighten, darken} from './art.js';
export {ICON, ICON_ANIM, TPL, iconInner, ICON_DEFS, ILLU, illu, MASCOT, CHOPSTICKS, RICE, GRAIN, NORI, SAL, SAL2, AVO, TUNA, TUNA2, mix, lighten, darken};

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
  play:'<path d="M7 4.5v15l12-7.5z"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4l4.6 4.6"/>',
  globe:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z"/>',
  grid:'<rect x="4" y="4" width="7" height="7" rx="2.2"/><rect x="13" y="4" width="7" height="7" rx="2.2"/><rect x="4" y="13" width="7" height="7" rx="2.2"/><rect x="13" y="13" width="7" height="7" rx="2.2"/>',
  help:'<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2.2-2.5 3.8M12 16.6v.2"/>',
  bell:'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>', pause:'<path d="M8 5v14M16 5v14"/>',
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
const RIBBON = {bronze:['#C2552B', '#8E3A18'], silver:['#4F78B8', '#335A94'], gold:['#E0413A', '#A82626'], plat:['#7A55D6', '#5233A8'], accent:['var(--accent)', 'color-mix(in srgb,var(--accent) 70%,#000)']};
const HEX = 'M28 5l20 11.5v23L28 51 8 39.5v-23z', HEX_IN = 'M28 11l14.8 8.5v17L28 45l-14.8-8.5v-17z';
// Laurel: hojas a lo largo de un arco; la derecha es el espejo de la izquierda
function laurel(c) {
  let o = '';
  for (let i = 0; i < 7; i++) {
    const th = 118 + i * 18, a = th * Math.PI / 180, x = 28 + 25 * Math.cos(a), y = 29 + 25 * Math.sin(a), r = th + 90 + 32;
    const leaf = (X, R) => `<ellipse cx="${X.toFixed(1)}" cy="${y.toFixed(1)}" rx="3.7" ry="1.5" transform="rotate(${R.toFixed(0)} ${X.toFixed(1)} ${y.toFixed(1)})" fill="${c}"/>`;
    o += leaf(x, r) + leaf(56 - x, 180 - r);
  }
  return o;
}
export function medal(ch, locked, cls = '', inner = null) {
  const g = ch.g || {}, t = ch.tier || 'bronze';
  const fill = locked ? 'var(--medal-off)' : `url(#g-${t})`;
  const rich = !locked && (t === 'gold' || t === 'plat');
  let mid = '';
  if (g.txt) {
    const y = g.txt.length > 2 ? 33 : 34.5, fs = g.txt.length > 3 ? 12 : g.txt.length > 2 ? 15 : 19;
    const tx = (f, dy = 0, op = 1) => `<text x="28" y="${y + dy}" text-anchor="middle" font-family="ui-rounded,'SF Pro Rounded',Nunito,system-ui,sans-serif" font-weight="900" font-size="${fs}" fill="${f}" opacity="${op}">${g.txt}</text>`;
    mid = `<g class="mg">${locked ? '' : tx('#000', 1.2, .22)}${tx('#fff')}</g>`;
  } else if (g.p) {
    const gl = (st, dy = 0, op = 1) => `<g transform="translate(16 ${16 + dy})" fill="none" stroke="${st}" stroke-opacity="${op}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${GLYPH[g.p] || ''}</g>`;
    mid = `<g class="mg">${locked ? '' : gl('#000', 1.2, .22)}${gl('#fff')}</g>`;
  } else if (g.icon) mid = `<g class="mi" transform="translate(12.5 11.5) scale(.65)">${inner || ICON[g.icon] || ''}</g>`;
  const [r1, r2] = RIBBON[t] || RIBBON.bronze;
  return `<svg viewBox="0 0 56 56" class="medal ${locked ? 'locked' : ''} ${cls}" aria-hidden="true">
    ${locked ? '' : `<g class="m-rib"><path d="M17.5 38l-5 14.5 5.4-2.4 3.6 4.6 5-13.4z" fill="${r1}"/><path d="M38.5 38l5 14.5-5.4-2.4-3.6 4.6-5-13.4z" fill="${r1}"/><path d="M17.5 38l-5 14.5 5.4-2.4 3.6 4.6 5-13.4z" fill="url(#ovD)"/><path d="M38.5 38l5 14.5-5.4-2.4-3.6 4.6-5-13.4z" fill="${r2}" opacity=".55"/></g>`}
    ${rich ? `<g class="m-laurel" opacity=".95">${laurel(t === 'plat' ? '#B9A6F7' : '#E7B53A')}</g>` : ''}
    <g transform="translate(28 28) scale(${rich ? .86 : 1}) translate(-28 -28)">
      <path d="${HEX}" fill="${fill}" stroke="${fill}" stroke-width="5" stroke-linejoin="round"/>
      ${locked ? `<path d="${HEX}" fill="none" stroke="url(#g-${t})" stroke-opacity=".6" stroke-width="1.8" stroke-linejoin="round"/><path d="${HEX_IN}" fill="#000" fill-opacity=".04" stroke="#000" stroke-opacity=".07" stroke-width="1.2" stroke-linejoin="round"/>` : `<path d="${HEX}" fill="url(#ovD)" stroke="none"/>
      <path d="${HEX_IN}" fill="${fill}" stroke="#000" stroke-opacity=".14" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="${HEX_IN}" fill="url(#ovV)"/>
      <path d="M28 8.6l17.4 10v20.8L28 49.4 10.6 39.4V18.6z" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M10 17.5L28 7l18 10.5v5C35 18 21 18 10 22.5z" fill="#fff" opacity=".2"/>`}
      ${mid}
    </g>
    ${locked ? '<g class="m-lock" transform="translate(37.5 37.5)"><circle cx="6.5" cy="6.5" r="7.2" fill="#8E8E93" stroke="#fff" stroke-width="1.6"/><path d="M4.6 6V4.8a1.9 1.9 0 0 1 3.8 0V6" stroke="#fff" stroke-width="1.3" fill="none"/><rect x="3.4" y="5.8" width="6.2" height="4.6" rx="1.1" fill="#fff"/></g>' : ''}
    ${rich ? '<path class="m-spk" d="M45.5 6.5l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1z" fill="#fff"/><path class="m-spk m-spk2" d="M9 44l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#fff"/>' : ''}
  </svg>`;
}
