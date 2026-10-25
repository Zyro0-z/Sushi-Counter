// Red de la carta del restaurante: buscar sitios de comida, encontrar su web y leer su carta.
// Orden de lectura: lector propio (si está activado) → r.jina.ai → allorigins. La carta puede estar en la web,
// en un PDF (con texto o escaneado), en Google Drive o en fotos de la web: se prueba todo antes de rendirse.
import {S, save} from '../store.js';
import {parseMenu, findMenuLinks, findMenuImages, guessPaths, pickSite, linksFromSearch, directUrl, norm, webPlaces} from '../menu.js';
import {ocrMany} from './scan.js';

const PHOTON = 'https://photon.komoot.io/api/';
const OVERPASS = 'https://overpass-api.de/api/interpreter?data=';
const NOMINATIM = 'https://nominatim.openstreetmap.org/';
const JINA = 'https://r.jina.ai/';
const PROXY = 'https://api.allorigins.win/raw?url=';
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
const FOOD = /^(restaurant|fast_food|food_court|cafe)$/;
const ASIAN = /sushi|japanese|asian|chinese|wok|korean|thai|vietnamese|ramen|buffet|poke|noodle/i;
const CUISINE = {sushi:'Sushi', japanese:'Japonés', asian:'Asiático', chinese:'Chino', wok:'Wok', buffet:'Buffet', korean:'Coreano', thai:'Tailandés', vietnamese:'Vietnamita', ramen:'Ramen', poke:'Poke', pizza:'Pizza', burger:'Hamburguesas', spanish:'Español', regional:'Regional', italian:'Italiano', mexican:'Mexicano', indian:'Indio', kebab:'Kebab', tapas:'Tapas', mediterranean:'Mediterráneo'};

export async function get(url, ms = 15000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, {signal:c.signal}); if (!r.ok) throw new Error('http ' + r.status); return r; } finally { clearTimeout(t); }
}
export const host = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return String(u); } };
export const fixUrl = u => { u = String(u || '').trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; try { return new URL(u).href; } catch (e) { return ''; } };
export const dist = (a, b) => { const r = Math.PI / 180, x = (b.lon - a.lon) * r * Math.cos((a.lat + b.lat) / 2 * r), y = (b.lat - a.lat) * r; return Math.sqrt(x * x + y * y) * 6371e3; };
export const mapsUrl = pl => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([pl.name, pl.street, pl.city].filter(Boolean).join(', '))}${pl.gid ? '&query_place_id=' + encodeURIComponent(pl.gid) : ''}`;

/* ---------- Lector propio (Vercel) ---------- */
export const ownReader = () => (S.settings.reader || '').trim().replace(/\/+$/, '');
const own = (q) => `${ownReader()}/api/leer?${q}`;
export async function testReader(base) {
  base = fixUrl(base).replace(/\/+$/, ''); if (!base) return false;
  try {
    const j = await (await get(`${base}/api/leer?ping=1`, 10000)).json();
    if (!j || !j.ok) return false;
    S.settings.readerGoogle = !!j.google; S.settings.readerAt = Date.now(); save();
    return base;
  } catch (e) { return false; }
}
// Una vez al día se comprueba si el lector tiene activada la búsqueda de Google
export function refreshReader() { const b = ownReader(); if (b && Date.now() - (S.settings.readerAt || 0) > 12 * 3600e3) testReader(b); }
const googleOn = () => !!(ownReader() && S.settings.readerGoogle);

/* ---------- Lugares de comida ---------- */
let geo = null;
export const geoNow = () => geo;
export function locate(timeout = 12000) {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('geo'));
    navigator.geolocation.getCurrentPosition(p => { geo = {lat:p.coords.latitude, lon:p.coords.longitude}; res(geo); }, rej, {timeout, maximumAge:300000, enableHighAccuracy:false});
  });
}
const cuisineOf = c => { const ks = String(c || '').split(/[;,]/).map(x => x.trim().toLowerCase()); const k = ks.find(x => CUISINE[x] && ASIAN.test(x)) || ks.find(x => CUISINE[x]); return k ? CUISINE[k] : ''; };
const fromTags = (tg = {}) => ({
  website:fixUrl(tg.website || tg['contact:website'] || tg.url || tg['brand:website']) || null,
  menuUrl:fixUrl(tg['website:menu'] || tg['menu:url'] || (/^https?:/.test(tg.menu || '') ? tg.menu : '')) || null,
  cuisine:cuisineOf(tg.cuisine), asian:ASIAN.test(tg.cuisine || '') || ASIAN.test(tg.name || ''),
});
const place = (o) => ({name:o.name, street:o.street || '', city:o.city || '', osm:o.osm || null, gid:o.gid || null, lat:o.lat, lon:o.lon, website:o.website, menuUrl:o.menuUrl, cuisine:o.cuisine || '', asian:!!o.asian, d:geo && o.lat != null ? dist(geo, o) : null});
// Búsqueda: nombres en OpenStreetMap mientras escribes; al pulsar Buscar, además Nominatim, todos los asiáticos
// de la ciudad (se llamen como se llamen) y Google Maps si el lector propio tiene clave. Solo sitios de comida.
const CUISINE_Q = /\b(sushi|japones|japonesa|japo|asiatico|asiatica|chino|china|oriental|wok|buffet|bufet|ramen|poke|coreano|tailandes|vietnamita|nikkei)\b/;
export async function searchPlaces(q, exact = false) {
  const base = new URLSearchParams({q, limit:'15'}); if (geo) { base.set('lat', geo.lat); base.set('lon', geo.lon); }
  const photon = tag => { const u = new URLSearchParams(base); u.set('osm_tag', 'amenity:' + tag); return get(PHOTON + '?' + u, 12000).then(r => r.json()).then(j => j.features || []).catch(() => []); };
  const byCuisine = CUISINE_Q.test(norm(q));
  const lists = await Promise.all([photon('restaurant'), photon('fast_food'), exact ? nominatim(q) : [], exact || byCuisine ? cuisineInArea(q) : [], exact && googleOn() ? googlePlaces(q) : []]);
  const osm = new Map();
  lists[0].concat(lists[1]).forEach(f => {
    const p = f.properties || {}; if (p.osm_key !== 'amenity' || !FOOD.test(p.osm_value || '') || !p.name) return;
    const [lon, lat] = f.geometry.coordinates;
    osm.set(p.osm_type + p.osm_id, place({name:p.name, street:[p.street, p.housenumber].filter(Boolean).join(' '), city:p.city || p.town || p.village || p.county || '', osm:p.osm_type + p.osm_id, lat, lon, asian:ASIAN.test(p.name)}));
  });
  [...lists[2], ...lists[3]].forEach(p => { if (!osm.has(p.osm)) osm.set(p.osm, p); });
  return merge(lists[4], await enrich([...osm.values()]));
}
// Google primero (tiene casi todos); los del mapa libre que no estén ya, detrás
function merge(google, osm) {
  const same = (a, b) => norm(a.name) === norm(b.name) && (a.lat == null || b.lat == null || dist(a, b) < 300);
  return sortPlaces([...google, ...osm.filter(o => !google.some(g => same(g, o)))]);
}
async function nominatim(q) {
  try {
    const j = await (await get(`${NOMINATIM}search?format=jsonv2&addressdetails=1&extratags=1&limit=15&accept-language=es&q=${encodeURIComponent(q)}`, 12000)).json();
    return j.filter(x => x.category === 'amenity' && FOOD.test(x.type) && x.name).map(x => { const a = x.address || {};
      return place({name:x.name, street:[a.road, a.house_number].filter(Boolean).join(' '), city:a.city || a.town || a.village || '', osm:x.osm_type[0].toUpperCase() + x.osm_id, lat:+x.lat, lon:+x.lon, ...fromTags({...x.extratags, name:x.name})}); });
  } catch (e) { return []; }
}
// «sushi palencia»: todos los restaurantes asiáticos de la ciudad, aunque su nombre no diga «sushi»
async function cuisineInArea(q) {
  const rest = norm(q).replace(CUISINE_Q, ' ').replace(/\b(restaurantes?|en|de|del|la|el|los|las|libre|comida|cerca|y)\b/g, ' ').replace(/\s+/g, ' ').trim();
  let box = null;
  try {
    if (rest.length >= 3) {
      const f = ((await (await get(`${PHOTON}?q=${encodeURIComponent(rest)}&limit=1&osm_tag=place`, 10000)).json()).features || [])[0];
      if (f) { const e = f.properties.extent, [lon, lat] = f.geometry.coordinates; box = e ? [e[3], e[0], e[1], e[2]] : [lat - .05, lon - .07, lat + .05, lon + .07]; }
    } else if (geo) box = [geo.lat - .045, geo.lon - .06, geo.lat + .045, geo.lon + .06];
    if (!box) return [];
    const bb = box.map(v => v.toFixed(5)).join(','), F = '["amenity"~"^(restaurant|fast_food|food_court)$"]["name"]';
    const oq = `[out:json][timeout:25];(nwr${F}["cuisine"~"sushi|japanese|asian|chinese|wok|buffet|korean|thai|vietnamese|ramen|poke|nikkei",i](${bb});nwr${F}["name"~"sushi|wok|asia|japo|china|chino|orient|buffet|tokyo|tokio|kyoto|osaka|sakura|nippon|ramen|poke|udon|kami|zen|koi|oishi|nikkei|maki|panda|dragon|bambu|bamboo|fuji|hana|yuki|kirin|lotus|loto",i](${bb}););out center tags 120;`;
    const j = await (await get(OVERPASS + encodeURIComponent(oq), 30000)).json();
    return (j.elements || []).map(e => { const tg = e.tags || {};
      return place({name:tg.name, street:[tg['addr:street'], tg['addr:housenumber']].filter(Boolean).join(' '), city:tg['addr:city'] || '', osm:e.type[0].toUpperCase() + e.id, lat:e.lat ?? e.center?.lat, lon:e.lon ?? e.center?.lon, ...fromTags(tg), asian:true}); });
  } catch (e) { return []; }
}
// Google Maps a través del lector propio (solo si tiene clave): casi todos los restaurantes, con su web
const GTYPE = {sushi_restaurant:'Sushi', japanese_restaurant:'Japonés', chinese_restaurant:'Chino', asian_restaurant:'Asiático', buffet_restaurant:'Buffet', ramen_restaurant:'Ramen', korean_restaurant:'Coreano', thai_restaurant:'Tailandés', vietnamese_restaurant:'Vietnamita',
  italian_restaurant:'Italiano', spanish_restaurant:'Español', pizza_restaurant:'Pizza', hamburger_restaurant:'Hamburguesas', fast_food_restaurant:'Comida rápida', seafood_restaurant:'Marisco', mediterranean_restaurant:'Mediterráneo', mexican_restaurant:'Mexicano', indian_restaurant:'Indio'};
async function googlePlaces(q, near = null, radio = 20000) {
  try {
    const c = near || geo, u = `lugares=${encodeURIComponent(q)}${c ? `&lat=${c.lat}&lon=${c.lon}&radio=${radio}` : ''}`;
    const j = await (await get(own(u), 15000)).json(); if (!Array.isArray(j)) return [];
    return j.filter(p => p.name && (p.types || []).some(t => /restaurant|food|meal|cafe|bar$/.test(t))).map(p => {
      const types = (p.types || []).join(' '), asian = /sushi|japanese|chinese|asian|buffet|ramen|korean|thai|vietnamese/.test(types) || ASIAN.test(p.name);
      const [street, ...rest] = String(p.address || '').split(',');
      return place({name:p.name, street:street || '', city:rest.join(',').trim(), gid:p.gid, lat:p.lat, lon:p.lon, cuisine:GTYPE[p.type] || Object.keys(GTYPE).filter(k => types.includes(k)).map(k => GTYPE[k])[0] || '', asian});
    });
  } catch (e) { return []; }
}
// Pide al mapa la web y el tipo de cocina de todos los resultados de una vez
async function enrich(list) {
  const ask = list.filter(p => p.osm && p.website === undefined);
  if (!ask.length) return sortPlaces(list);
  const ids = {N:[], W:[], R:[]}; ask.forEach(p => ids[p.osm[0]] && ids[p.osm[0]].push(p.osm.slice(1)));
  const q = `[out:json][timeout:15];(${ids.N.length ? `node(id:${ids.N});` : ''}${ids.W.length ? `way(id:${ids.W});` : ''}${ids.R.length ? `relation(id:${ids.R});` : ''});out tags;`;
  try {
    const j = await (await get(OVERPASS + encodeURIComponent(q), 15000)).json();
    const tags = new Map((j.elements || []).map(e => [e.type[0].toUpperCase() + e.id, e.tags || {}]));
    list = list.map(p => { const tg = tags.get(p.osm); if (!tg) return p; const t = fromTags(tg); return {...p, website:p.website || t.website, menuUrl:p.menuUrl || t.menuUrl, cuisine:t.cuisine || p.cuisine, asian:p.asian || t.asian}; });
  } catch (e) {}
  return sortPlaces(list);
}
export const sortPlaces = list => list.slice().sort((a, b) => (b.asian - a.asian) || ((a.d ?? 1e9) - (b.d ?? 1e9)));
export async function nearPlaces(radius = 1500) {
  await locate();
  const q = `[out:json][timeout:20];nwr(around:${radius},${geo.lat},${geo.lon})["amenity"~"^(restaurant|fast_food|food_court)$"]["name"];out center tags 80;`;
  const [osm, g] = await Promise.all([
    get(OVERPASS + encodeURIComponent(q), 25000).then(r => r.json()).then(j => (j.elements || []).map(e => { const tg = e.tags || {};
      return place({name:tg.name, street:[tg['addr:street'], tg['addr:housenumber']].filter(Boolean).join(' '), city:tg['addr:city'] || '', osm:e.type[0].toUpperCase() + e.id, lat:e.lat ?? e.center?.lat, lon:e.lon ?? e.center?.lon, ...fromTags(tg)}); })).catch(() => []),
    googleOn() && radius > 300 ? googlePlaces('restaurante sushi japonés asiático buffet', geo, Math.max(radius, 2500)) : [],
  ]);
  if (!osm.length && !g.length) throw new Error('vacío');
  return merge(g, osm);
}

/* ---------- Leer páginas, PDF e imágenes ---------- */
let pdfP = null;
function loadPdf() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return pdfP = pdfP || new Promise((res, rej) => { const s = document.createElement('script'); s.src = PDFJS + 'pdf.min.js'; s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; res(window.pdfjsLib); }; s.onerror = () => { pdfP = null; rej(new Error('pdf')); }; document.head.appendChild(s); });
}
async function pdfDoc(buf) { const lib = await loadPdf(); return lib.getDocument({data:buf}).promise; }
async function pdfText(doc) {
  let out = '';
  for (let i = 1; i <= Math.min(doc.numPages, 12); i++) {
    const items = (await (await doc.getPage(i)).getTextContent()).items; let y0 = null, line = '';
    for (const it of items) { const y = Math.round(it.transform[5]); if (y0 !== null && Math.abs(y - y0) > 3) { out += line + '\n'; line = ''; } line += (line && !/\s$/.test(line) ? '   ' : '') + it.str; y0 = y; }
    out += line + '\n# \n';
  }
  return out;
}
// PDF escaneado: se dibujan las páginas para leerlas con OCR
async function pdfCanvases(doc, max = 3) {
  const out = [];
  for (let i = 1; i <= Math.min(doc.numPages, max); i++) {
    const pg = await doc.getPage(i), v0 = pg.getViewport({scale:1}), vp = pg.getViewport({scale:Math.min(3, 2200 / Math.max(v0.width, v0.height))});
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    await pg.render({canvasContext:c.getContext('2d'), viewport:vp}).promise; out.push(c);
  }
  return out;
}
export function htmlToText(html, base) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,noscript,svg,form').forEach(n => n.remove());
  doc.querySelectorAll('iframe[src],embed[src],object[data]').forEach(n => { const s = n.getAttribute('src') || n.getAttribute('data'); try { n.replaceWith(` [carta](${new URL(s, base).href}) `); } catch (e) { n.remove(); } });
  doc.querySelectorAll('img').forEach(i => { const s = i.getAttribute('data-src') || i.getAttribute('data-lazy-src') || i.getAttribute('src'); try { i.replaceWith(s ? ` ![${(i.getAttribute('alt') || '').replace(/[[\]]/g, '')}](${new URL(s, base).href}) ` : ''); } catch (e) { i.remove(); } });
  doc.querySelectorAll('a[href]').forEach(a => { try { a.replaceWith(` [${a.textContent.trim().replace(/[[\]]/g, '')}](${new URL(a.getAttribute('href'), base).href}) `); } catch (e) {} });
  doc.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
  // Una fila de tabla es un plato con su descripción o su precio: se junta en una sola línea
  doc.querySelectorAll('tr').forEach(tr => { const cells = [...tr.children].map(c => c.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean); if (cells.length > 1) tr.textContent = cells.join(' – '); });
  doc.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => { h.textContent = `\n## ${h.textContent.trim()}\n`; });
  doc.querySelectorAll('p,li,div,tr,td,th,dt,dd,section,article').forEach(n => n.append('\n'));
  return (doc.body ? doc.body.textContent : '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
}
const isPdf = (u, ct = '') => /pdf/i.test(ct) || /\.pdf(\?|#|$)/i.test(u) || /drive\.google\.com\/uc/.test(u);
const isImg = (u, ct = '') => /^image\//i.test(ct) || /\.(jpe?g|png|webp)(\?|#|$)/i.test(u);
// Descarga el archivo tal cual (PDF o imagen)
export async function fetchBlob(url) {
  const tries = ownReader() ? [own('url=' + encodeURIComponent(url)), PROXY + encodeURIComponent(url)] : [PROXY + encodeURIComponent(url)];
  for (const u of tries) { try { const r = await get(u, 30000); const b = await r.blob(); if (b.size > 500) return b; } catch (e) {} }
  throw new Error('descarga');
}
// Devuelve {text, scanned} de una dirección: página, PDF (con texto) o null si no se pudo
export async function readUrl(url) {
  url = directUrl(url);
  if (isImg(url)) return {text:'', image:url};
  let thin = null;
  if (ownReader()) {
    try {
      const r = await get(own('url=' + encodeURIComponent(url)), 30000), ct = r.headers.get('content-type') || '', fin = r.headers.get('x-final-url') || url;
      if (isPdf(fin, ct)) { const doc = await pdfDoc(await r.arrayBuffer()); const text = await pdfText(doc); return text.replace(/[#\s]/g, '').length > 80 ? {text} : {text, scanned:doc}; }
      if (isImg(fin, ct)) return {text:'', image:url};
      const text = htmlToText(await r.text(), fin);
      // Una web hecha con JavaScript llega casi vacía: entonces se prueba el lector que la abre como un navegador
      if (text.replace(/\s/g, '').length > 150 || /\]\(https?:/.test(text)) return {text};
      thin = {text};
    } catch (e) {}
  }
  try { const t = await (await get(JINA + url, 35000)).text(); if (t && t.trim().length > 20 && !/^\s*\{\s*"(code|error)"/.test(t)) return {text:t}; } catch (e) {}
  if (thin) return thin;
  const r = await get(PROXY + encodeURIComponent(url), 30000), ct = r.headers.get('content-type') || '';
  if (isPdf(url, ct)) { const doc = await pdfDoc(await r.arrayBuffer()); const text = await pdfText(doc); return text.replace(/[#\s]/g, '').length > 80 ? {text} : {text, scanned:doc}; }
  return {text:htmlToText(await r.text(), url)};
}

/* ---------- Buscar en la web ---------- */
export async function webSearch(q) {
  if (ownReader()) { try { const j = await (await get(own('buscar=' + encodeURIComponent(q)), 15000)).json(); if (Array.isArray(j) && j.length) return j; } catch (e) {} }
  for (const u of ['https://html.duckduckgo.com/html/?kl=es-es&q=', 'https://www.bing.com/search?setlang=es&cc=ES&q=']) {
    try { const md = await (await get(JINA + u + encodeURIComponent(q), 25000)).text(); const l = linksFromSearch(md); if (l.length >= 2) return l; } catch (e) {}
  }
  return [];
}
// Restaurantes que no están en el mapa: su web, buscando el nombre en internet
export async function findOnWeb(q) { try { return webPlaces(await webSearch(q), q); } catch (e) { return []; } }
export async function details(pl) {
  if (pl.website !== undefined) return pl;
  // Restaurante de Google Maps: su web, a través del lector propio
  if (pl.gid && googleOn()) { try { const j = await (await get(own('ficha=' + encodeURIComponent(pl.gid)), 12000)).json(); return {...pl, website:fixUrl(j.website) || null}; } catch (e) { return {...pl, website:null}; } }
  const type = {N:'node', W:'way', R:'relation'}[pl.osm && pl.osm[0]]; if (!type) return {...pl, website:null};
  try { const j = await (await get(OVERPASS + encodeURIComponent(`[out:json][timeout:15];${type}(${pl.osm.slice(1)});out tags;`), 15000)).json(); return {...pl, ...fromTags((j.elements[0] || {}).tags)}; }
  catch (e) { try { const j = await (await get(`${NOMINATIM}lookup?format=json&extratags=1&osm_ids=${pl.osm}`, 12000)).json(); return {...pl, ...fromTags((j[0] || {}).extratags)}; } catch (e2) { return {...pl, website:null}; } }
}

/* ---------- Encontrar y leer la carta de un sitio ---------- */
const SEP = '\n\n# \n\n';
// step(n, nota): 0 buscar web · 1 leer carta · 2 fotos de la carta · 3 reconocer platos. alive() corta si se cancela.
export async function findMenu(pl, step, alive = () => true) {
  step(0, 'Mirando el mapa');
  pl = await details(pl);
  const sources = [];   // [{url, text}]
  const seen = new Set(), scans = [], images = new Set();
  let site = pl.website, extra = pl.menuUrl ? [pl.menuUrl] : [];
  // Solo cuentan los platos seguros (con palabra de pieza); las portadas y los avisos legales no suman
  const sure = t => parseMenu(t).items.filter(i => !i.unsure).length;
  const items = () => sources.reduce((a, x) => a + (x.n ?? (x.n = sure(x.text))), 0);
  const read = async u => {
    u = directUrl(u); if (seen.has(u) || !alive()) return; seen.add(u);
    step(1, /\.pdf|drive\.google/i.test(u) ? 'Abriendo la carta en PDF' : 'Abriendo ' + host(u) + decodeURIComponent(new URL(u).pathname).replace(/\/$/, '').slice(0, 28));
    try {
      const r = await readUrl(u);
      if (r.image) { images.add(r.image); return; }
      sources.push({url:u, text:r.text});
      if (r.scanned) scans.push(r.scanned);
      findMenuImages(r.text, u).forEach(i => images.add(i));
      return r.text;
    } catch (e) {}
  };
  // 1. La web: la del mapa o, si no la tiene, la que sale al buscarla
  let searched = false;
  const search = async () => { searched = true; const f = pickSite(await webSearch(`${pl.name} ${pl.city} carta`), pl); if (!site) site = f.site; return f.menus; };
  if (!site) { step(0, `Buscando «${pl.name}» en internet`); extra = [...extra, ...await search()]; }
  if (!site && !extra.length) return {fail:'noweb', place:pl};
  step(0, host(site || extra[0]), 'done');
  // 2. Primero lo que ya parece la carta; después la portada y sus enlaces
  for (const u of extra) { if (items() >= 30) break; await read(u); }
  if (site && items() < 30) {
    const home = await read(site);
    for (const l of home ? findMenuLinks(home, site) : []) { if (items() >= 30 || !alive()) break; const t = await read(l); if (t && items() < 8) for (const l2 of findMenuLinks(t, l).slice(0, 2)) await read(l2); }
    if (items() < 5) for (const g of guessPaths(site).slice(0, 4)) { if (!alive()) break; await read(g); if (items() >= 5) break; }
  }
  // Su web no tenía la carta a la vista: se busca en internet un PDF o una página con ella
  if (items() < 5 && !searched && alive()) { step(1, 'Buscando su carta en internet'); for (const u of await search()) { await read(u); if (items() >= 30) break; } }
  if (!alive()) return {fail:'cancel', place:pl};
  // 3. La carta en fotos de la web o en un PDF escaneado: se lee con OCR
  let ocrText = '';
  if (items() < 5 && (images.size || scans.length)) {
    step(2, 'Preparando las fotos');
    const canv = [];
    for (const d of scans.slice(0, 2)) { try { canv.push(...await pdfCanvases(d, 3)); } catch (e) {} }
    for (const i of [...images].slice(0, 4)) { try { canv.push(await fetchBlob(i)); } catch (e) {} }
    if (canv.length && alive()) ocrText = (await ocrMany(canv.slice(0, 6), (m) => step(2, m))).join(SEP);
  }
  step(3, '');
  // Se juntan solo las páginas que de verdad tienen carta (3 platos seguros o más)
  const good = sources.filter(x => x.n >= 3);
  const all = (good.length ? good : sources).map(x => x.text).join(SEP) + (ocrText ? SEP + ocrText : '');
  const res = parseMenu(all), nSure = res.items.filter(i => !i.unsure).length;
  // Muchos dudosos frente a pocos seguros: es una web, no una carta; se quedan solo los seguros
  if (res.items.length > nSure * 3) res.items = res.items.filter(i => !i.unsure);
  const best = sources.slice().sort((a, b) => b.n - a.n)[0];
  return {...res, place:{...pl, website:site || pl.website}, src:best && best.n ? best.url : (site || null), fail:nSure < 3 ? (sources.length ? 'empty' : 'read') : null};
}
