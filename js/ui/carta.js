// Carta del restaurante: buscarlo en el mapa (OpenStreetMap), leer su carta desde su web, un PDF,
// una foto o un texto pegado, revisarla y añadir sus platos al contador, cada uno en su sección.
import {S, save} from '../store.js';
import {PRICE_SLOTS, CURRENCIES} from '../catalog.js';
import {ui, illu, iconInner} from '../icons.js';
import {parseMenu, menuType, findMenuLinks, MOD_NAME, norm} from '../menu.js';
import {money, fmtDec, parseNum, currentBuffet, typeById} from '../logic.js';
import {$, $$, esc, app, openSheet, closeSheet, twoStep, sw, seg, bindSeg} from './common.js';
import {feedback, hud, celebrate, announce} from '../fx.js';
import {ocrFile, pickImage} from './scan.js';

/* ---------- Red ---------- */
const PHOTON = 'https://photon.komoot.io/api/';
const OVERPASS = 'https://overpass-api.de/api/interpreter?data=';
const NOMINATIM = 'https://nominatim.openstreetmap.org/lookup?format=json&extratags=1&osm_ids=';
const READER = 'https://r.jina.ai/';
const PROXY = 'https://api.allorigins.win/raw?url=';
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
async function get(url, ms = 15000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, {signal:c.signal}); if (!r.ok) throw new Error('http ' + r.status); return r; } finally { clearTimeout(t); }
}
const host = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return u; } };
const fixUrl = u => { u = String(u || '').trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; try { return new URL(u).href; } catch (e) { return ''; } };
const dist = (a, b) => { const R = 6371e3, r = Math.PI / 180, x = (b.lon - a.lon) * r * Math.cos((a.lat + b.lat) / 2 * r), y = (b.lat - a.lat) * r; return Math.sqrt(x * x + y * y) * R; };
const fmtDist = m => m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
const CUISINE = {sushi:'Sushi', japanese:'Japonés', asian:'Asiático', chinese:'Chino', wok:'Wok', buffet:'Buffet', korean:'Coreano', thai:'Tailandés', vietnamese:'Vietnamita', ramen:'Ramen'};
const cuisineOf = c => { const k = String(c || '').split(/[;,]/).map(x => x.trim().toLowerCase()).find(x => CUISINE[x]); return k ? CUISINE[k] : ''; };

let geo = null;
const fromTags = (tg = {}) => ({website:fixUrl(tg['website:menu'] || tg['menu:url'] || tg.website || tg['contact:website'] || tg.url || tg['brand:website']) || null, cuisine:cuisineOf(tg.cuisine), phone:tg.phone || tg['contact:phone'] || ''});
async function searchPlaces(q) {
  const p = new URLSearchParams({q, limit:'15'}); if (geo) { p.set('lat', geo.lat); p.set('lon', geo.lon); }
  const run = async filt => { const u = new URLSearchParams(p); if (filt) u.set('osm_tag', 'amenity'); return (await (await get(PHOTON + '?' + u, 12000)).json()).features || []; };
  let f = await run(true); if (!f.length) f = await run(false);
  return f.filter(x => x.properties && x.properties.name).map(x => {
    const pr = x.properties, [lon, lat] = x.geometry.coordinates;
    return {name:pr.name, street:[pr.street, pr.housenumber].filter(Boolean).join(' '), city:pr.city || pr.town || pr.village || pr.county || '', kind:pr.osm_value, osm:pr.osm_type + pr.osm_id, lat, lon};
  }).sort((a, b) => (/restaurant|fast_food/.test(b.kind) ? 1 : 0) - (/restaurant|fast_food/.test(a.kind) ? 1 : 0)).slice(0, 10);
}
async function nearPlaces() {
  const c = await new Promise((res, rej) => { if (!navigator.geolocation) return rej(new Error('geo')); navigator.geolocation.getCurrentPosition(p => res(p.coords), rej, {timeout:12000, maximumAge:300000}); });
  geo = {lat:c.latitude, lon:c.longitude};
  const q = `[out:json][timeout:20];nwr(around:2500,${geo.lat},${geo.lon})["amenity"~"^(restaurant|fast_food)$"]["name"]["cuisine"~"sushi|japanese|asian|chinese|wok|buffet|korean|thai|vietnamese|ramen",i];out center tags 50;`;
  const j = await (await get(OVERPASS + encodeURIComponent(q), 25000)).json();
  return (j.elements || []).map(e => { const tg = e.tags || {}, lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
    return {name:tg.name, street:[tg['addr:street'], tg['addr:housenumber']].filter(Boolean).join(' '), city:tg['addr:city'] || '', kind:'restaurant', osm:e.type[0].toUpperCase() + e.id, lat, lon, ...fromTags(tg), d:dist(geo, {lat, lon})};
  }).sort((a, b) => a.d - b.d).slice(0, 25);
}
async function details(pl) {
  if (pl.website !== undefined) return pl;
  const type = {N:'node', W:'way', R:'relation'}[pl.osm[0]], id = pl.osm.slice(1);
  try { const j = await (await get(OVERPASS + encodeURIComponent(`[out:json][timeout:15];${type}(${id});out tags;`), 15000)).json(); return {...pl, ...fromTags((j.elements[0] || {}).tags)}; }
  catch (e) { const j = await (await get(NOMINATIM + pl.osm, 12000)).json(); return {...pl, ...fromTags((j[0] || {}).extratags)}; }
}

/* ---------- Leer una web o un PDF ---------- */
let pdfP = null;
function loadPdf() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return pdfP = pdfP || new Promise((res, rej) => { const s = document.createElement('script'); s.src = PDFJS + 'pdf.min.js'; s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; res(window.pdfjsLib); }; s.onerror = () => { pdfP = null; rej(new Error('pdf')); }; document.head.appendChild(s); });
}
async function pdfText(buf) {
  const lib = await loadPdf(), doc = await lib.getDocument({data:buf}).promise; let out = '';
  for (let i = 1; i <= Math.min(doc.numPages, 12); i++) {
    const items = (await (await doc.getPage(i)).getTextContent()).items; let y0 = null, line = '';
    for (const it of items) { const y = Math.round(it.transform[5]); if (y0 !== null && Math.abs(y - y0) > 3) { out += line + '\n'; line = ''; } line += (line && !/\s$/.test(line) ? '   ' : '') + it.str; y0 = y; }
    out += line + '\n# \n';
  }
  return out;
}
function htmlToText(html, base) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,noscript,svg,iframe,form').forEach(n => n.remove());
  doc.querySelectorAll('a[href]').forEach(a => { try { a.textContent = ` [${a.textContent.trim()}](${new URL(a.getAttribute('href'), base).href}) `; } catch (e) {} });
  doc.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
  doc.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => { h.textContent = `\n## ${h.textContent.trim()}\n`; });
  doc.querySelectorAll('p,li,div,tr,td,th,dt,dd,section,article').forEach(n => n.append('\n'));
  return (doc.body ? doc.body.textContent : '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
}
async function readUrl(url) {
  // 1) Lector que devuelve el texto limpio, también de PDF y de webs hechas con JavaScript
  try { const t = await (await get(READER + url, 35000)).text(); if (t && t.trim().length > 20 && !/^\s*\{\s*"(code|error)"/.test(t)) return t; } catch (e) {}
  // 2) Pasarela pública: la página o el PDF tal cual
  const r = await get(PROXY + encodeURIComponent(url), 30000), ct = r.headers.get('content-type') || '';
  if (/pdf/i.test(ct) || /\.pdf(\?|#|$)/i.test(url)) return pdfText(await r.arrayBuffer());
  return htmlToText(await r.text(), url);
}
async function readMenu(url, step) {
  step(1, 'Abriendo ' + host(url));
  const pages = [await readUrl(url)];
  let res = parseMenu(pages[0]);
  for (const l of findMenuLinks(pages[0], url)) {
    if (res.items.length >= 30) break;
    step(1, /\.pdf/i.test(l) ? 'Abriendo la carta en PDF' : 'Abriendo ' + decodeURIComponent(new URL(l).pathname).slice(0, 32));
    try { pages.push(await readUrl(l)); res = parseMenu(pages.join('\n\n# \n\n')); } catch (e) {}
  }
  return res;
}

/* ---------- 1. Buscar el restaurante ---------- */
let lastQ = '';
const resultRow = (p, i) => `<button class="row fd-r" data-i="${i}" style="--ins:66px"><span class="fd-ic">${illu('buffet')}</span><span class="row-main"><span class="row-t">${esc(p.name)}</span><span class="row-d">${esc([p.street, p.city].filter(Boolean).join(', ') || 'Sin dirección')}</span></span>${p.cuisine ? `<em class="fd-tag">${esc(p.cuisine)}</em>` : ''}${p.d != null ? `<span class="row-v num">${fmtDist(p.d)}</span>` : ''}${ui('chev', 'chev')}</button>`;
const skeleton = () => `<div class="group">${Array.from({length:4}, () => '<div class="row sk-row"><i class="sk sk-ic"></i><span class="row-main"><i class="sk sk-t"></i><i class="sk sk-d"></i></span></div>').join('')}</div>`;
export function openFinder(q = '') {
  let list = [], seq = 0, tm = 0;
  openSheet({title:'Carta del restaurante', cancel:'Cerrar', cls:'fd-sheet', body:`
    <div class="sh-hero">${illu('carta', 'hero-illu')}<h4>Cuenta con su carta</h4><p>Busca el restaurante: leemos su carta y añadimos sus platos al contador, cada uno en su sección.</p></div>
    <label class="search">${ui('search')}<input id="fdQ" type="search" placeholder="Nombre y ciudad" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" value="${esc(q || lastQ)}" aria-label="Buscar restaurante por nombre y ciudad"></label>
    <button class="btn plain" id="fdNear">${ui('pin')}Buscar cerca de mí</button>
    <div id="fdRes" class="fd-res" aria-live="polite"></div>
    <div class="gsec"><div class="glabel">Otras formas de añadir la carta</div><div class="group">
      <button class="row nav-row" id="fdLink" style="--ins:58px"><span class="ri" style="--rc:#0A84FF">${ui('link')}</span><span class="row-l">Pegar el enlace de la carta<span class="sub">De su web o un PDF</span></span>${ui('chev', 'chev')}</button>
      <button class="row nav-row" id="fdPhoto" style="--ins:58px"><span class="ri" style="--rc:#30A46C">${ui('camera')}</span><span class="row-l">Hacer foto a la carta<span class="sub">Si la tienes en la mesa</span></span>${ui('chev', 'chev')}</button>
      <button class="row nav-row" id="fdText" style="--ins:58px"><span class="ri" style="--rc:#8E8E93">${ui('doc')}</span><span class="row-l">Pegar el texto de la carta<span class="sub">Copiado de cualquier sitio</span></span>${ui('chev', 'chev')}</button>
    </div><p class="gfoot">La búsqueda usa OpenStreetMap. La carta se lee de la web del restaurante; si solo la tiene en foto, usa la cámara.</p></div>`,
    mount(el) {
      const box = $('#fdRes', el), inp = $('#fdQ', el);
      const paint = (msg) => { box.innerHTML = msg || (list.length ? `<div class="group">${list.map(resultRow).join('')}</div>` : ''); };
      const run = async () => {
        const v = inp.value.trim(); lastQ = v; if (v.length < 3) { list = []; paint(); return; }
        const my = ++seq; paint(skeleton());
        try { const r = await searchPlaces(v); if (my !== seq) return; list = r; paint(r.length ? '' : `<div class="empty fd-empty"><b>Sin resultados</b>Prueba con el nombre y la ciudad, por ejemplo «Sushi He Barcelona».</div>`); announce(`${r.length} resultados`); }
        catch (e) { if (my === seq) paint(`<div class="empty fd-empty"><b>No hay conexión con el buscador</b>Puedes pegar el enlace de la carta o hacerle una foto.</div>`); }
      };
      inp.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(run, 450); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(tm); run(); inp.blur(); } });
      $('#fdNear', el).onclick = async () => {
        const my = ++seq; paint(skeleton()); feedback('tick');
        try { const r = await nearPlaces(); if (my !== seq) return; list = r; paint(r.length ? `<div class="glabel">Cerca de ti</div><div class="group">${r.map(resultRow).join('')}</div>` : `<div class="empty fd-empty"><b>No hay restaurantes asiáticos cerca</b>Búscalo por su nombre.</div>`); }
        catch (e) { if (my === seq) paint(`<div class="empty fd-empty"><b>No sabemos dónde estás</b>Permite la ubicación en Ajustes del iPhone › Safari, o búscalo por su nombre.</div>`); }
      };
      box.addEventListener('click', e => { const r = e.target.closest('[data-i]'); if (r) { feedback('tick'); importPlace(list[+r.dataset.i]); } });
      $('#fdLink', el).onclick = () => linkSheet();
      $('#fdPhoto', el).onclick = () => photoFlow();
      $('#fdText', el).onclick = () => textSheet();
      if (inp.value) run();
    }});
}

/* ---------- 2. Leer su carta, con los pasos a la vista ---------- */
function progressSheet(title, sub) {
  openSheet({title:'Leyendo la carta', cancel:'Cancelar', body:`
    <div class="sh-hero">${illu('carta', 'hero-illu imp-anim')}<h4>${esc(title)}</h4><p>${esc(sub || '')}</p></div>
    <ol class="imp-steps">
      <li data-s="0"><i aria-hidden="true"></i><span>Buscando su web</span><small></small></li>
      <li data-s="1"><i aria-hidden="true"></i><span>Leyendo la carta</span><small></small></li>
      <li data-s="2"><i aria-hidden="true"></i><span>Reconociendo los platos</span><small></small></li>
    </ol>`, onClose() { cancelled = true; }});
  let cancelled = false;
  const step = (i, note, state = 'on') => {
    $$('.imp-steps li').forEach(li => { const n = +li.dataset.s; li.className = n < i ? 'done' : n === i ? state : ''; });
    const sm = $(`.imp-steps li[data-s="${i}"] small`); if (sm && note != null) sm.textContent = note;
    if (note) announce(note);
  };
  return {step, alive:() => !cancelled && $('.imp-steps')};
}
async function importPlace(pl) {
  const pr = progressSheet(pl.name, [pl.street, pl.city].filter(Boolean).join(', '));
  pr.step(0, '');
  let full = pl;
  try { full = await details(pl); } catch (e) {}
  if (!pr.alive()) return;
  if (!full.website) { failSheet(full, 'noweb'); return; }
  pr.step(0, host(full.website), 'done');
  let res;
  try { res = await readMenu(full.website, pr.step); } catch (e) { if (pr.alive()) failSheet(full, 'read'); return; }
  if (!pr.alive()) return;
  pr.step(2, `${res.items.length} platos`);
  if (res.items.length < 3) { failSheet(full, 'empty'); return; }
  setTimeout(() => { if (pr.alive()) reviewSheet({...res, place:full, src:full.website}); }, 500);
}
function failSheet(pl, why) {
  const t = {noweb:['No tenemos su web', 'El mapa no tiene la web de este restaurante.'], read:['No se ha podido abrir su web', 'Puede que no tenga conexión o que su web no deje leerla.'], empty:['Su web no tiene la carta en texto', 'Seguramente la tiene en foto. Hazle una foto a la carta o pega el enlace si la encuentras.']}[why];
  const g = `https://www.google.com/search?q=${encodeURIComponent(`${pl.name} ${pl.city || ''} carta`)}`;
  openSheet({title:pl.name, cancel:'Cerrar', body:`
    <div class="sh-hero">${illu('carta', 'hero-illu')}<h4>${t[0]}</h4><p>${t[1]}</p></div>
    <div class="group">
      <button class="row nav-row" id="fsPhoto" style="--ins:58px"><span class="ri" style="--rc:#30A46C">${ui('camera')}</span><span class="row-l">Hacer foto a la carta<span class="sub">Lo más rápido si estás en la mesa</span></span>${ui('chev', 'chev')}</button>
      <a class="row nav-row" href="${g}" target="_blank" rel="noopener" style="--ins:58px"><span class="ri" style="--rc:#0A84FF">${ui('globe')}</span><span class="row-l">Buscar su carta en Google<span class="sub">Copia el enlace y vuelve aquí</span></span>${ui('chev', 'chev')}</a>
      <button class="row nav-row" id="fsLink" style="--ins:58px"><span class="ri" style="--rc:#5E5CE6">${ui('link')}</span><span class="row-l">Pegar el enlace de la carta</span>${ui('chev', 'chev')}</button>
      <button class="row nav-row" id="fsText" style="--ins:58px"><span class="ri" style="--rc:#8E8E93">${ui('doc')}</span><span class="row-l">Pegar el texto de la carta</span>${ui('chev', 'chev')}</button>
    </div>
    <button class="btn plain" id="fsPlain">Usar este restaurante sin carta</button>`,
    mount(el) {
      $('#fsPhoto', el).onclick = () => photoFlow(pl); $('#fsLink', el).onclick = () => linkSheet(pl); $('#fsText', el).onclick = () => textSheet(pl);
      $('#fsPlain', el).onclick = () => { const b = upsertBuffet(pl, null); S.buffetId = b.id; S.session.buffetId = b.id; save(); closeSheet(); app.buildGrid(); app.updateCounter(); hud(`Buffet: ${b.name}`); };
    }});
}
function linkSheet(pl = null) {
  openSheet({title:'Enlace de la carta', cancel:'Cancelar', ok:'Leer', body:`
    <div class="sh-hero">${illu('carta', 'hero-illu')}<p>Pega la dirección de su web o de la carta en PDF.</p></div>
    <div class="group"><label class="row"><input class="row-in" id="lkU" type="url" inputmode="url" placeholder="https://…" autocomplete="off" autocapitalize="off" style="text-align:left" value="${esc(pl && pl.website || '')}"></label></div>`,
    mount(el) { setTimeout(() => $('#lkU', el).focus(), 450); },
    onOk(el) {
      const u = fixUrl($('#lkU', el).value); if (!u) { hud('Escribe un enlace válido'); return false; }
      const p = {...(pl || {name:host(u), osm:null}), website:u};
      setTimeout(async () => {
        const pr = progressSheet(p.name, host(u)); pr.step(0, host(u), 'done');
        try { const res = await readMenu(u, pr.step); if (!pr.alive()) return; pr.step(2, `${res.items.length} platos`);
          if (res.items.length < 3) failSheet(p, 'empty'); else setTimeout(() => pr.alive() && reviewSheet({...res, place:p, src:u}), 500);
        } catch (e) { if (pr.alive()) failSheet(p, 'read'); }
      }, 520);
    }});
}
function textSheet(pl = null) {
  openSheet({title:'Texto de la carta', cancel:'Cancelar', ok:'Leer', body:`
    <p class="hub-intro">Pega la carta tal cual: nombres de platos, secciones y precios. Reconocemos el resto.</p>
    <div class="group"><textarea class="tx-in" id="txT" rows="10" placeholder="NIGIRIS&#10;Nigiri de salmón flambeado&#10;Nigiri de atún&#10;&#10;MAKIS&#10;Maki frito de salmón con queso (8u)…"></textarea></div>`,
    mount(el) { setTimeout(() => $('#txT', el).focus(), 450); },
    onOk(el) {
      const res = parseMenu($('#txT', el).value); if (res.items.length < 1) { hud('No reconocemos platos en ese texto'); return false; }
      setTimeout(() => reviewSheet({...res, place:pl || {name:'', osm:null}, src:null}), 520);
    }});
}
function photoFlow(pl = null, merge = null) {
  pickImage(async file => {
    openSheet({title:'Leyendo la foto', cancel:'Cancelar', body:`<div class="sh-hero">${illu('carta', 'hero-illu imp-anim')}<h4>Leyendo la carta…</h4><p id="ocrMsg">Preparando el lector</p></div>
      <div class="meter lg"><i id="ocrBar" style="width:4%"></i></div><p class="gfoot">La primera vez descarga el lector de texto (unos 5 MB). Funciona mejor con la carta recta y con buena luz.</p>`});
    const set = (m, p) => { const a = $('#ocrMsg'), b = $('#ocrBar'); if (a) a.textContent = m; if (b && p != null) b.style.width = Math.max(4, p * 100) + '%'; };
    let res;
    try { res = parseMenu(await ocrFile(file, set, 2400)); } catch (e) { hud('No se pudo leer la foto'); closeSheet(); return; }
    if (merge) { const seen = new Set(merge.items.map(i => norm(i.name))); const add = res.items.filter(i => !seen.has(norm(i.name))); res.items = [...merge.items, ...add]; res.prices = {...res.prices, ...merge.prices}; res.place = merge.place; res.sel = [...(merge.sel || merge.items.map(() => true)), ...add.map(() => true)]; res.src = merge.src; }
    if (!res.items.length) { hud('No reconocemos platos en la foto. Prueba más cerca y con luz.'); if (merge) reviewSheet(merge); else closeSheet(); return; }
    reviewSheet({place:pl || {name:'', osm:null}, src:null, ...res});
  });
}

/* ---------- 3. Revisar y añadir ---------- */
function upsertBuffet(pl, prices) {
  let b = (pl.osm && S.buffets.find(x => x.place && x.place.osm === pl.osm)) || S.buffets.find(x => norm(x.name) === norm(pl.name || ''));
  if (!b) { b = {id:'b' + Date.now().toString(36), name:(pl.name || 'Restaurante').slice(0, 28), prices:prices || {...currentBuffet().prices}}; S.buffets.push(b); }
  else if (prices) b.prices = prices;
  if (pl.osm || pl.website) b.place = {osm:pl.osm || null, street:pl.street || '', city:pl.city || '', lat:pl.lat ?? null, lon:pl.lon ?? null, website:pl.website || null};
  return b;
}
function reviewSheet(data) {
  const {items, prices = {}, place, src} = data;
  const sel = data.sel || items.map(() => true);
  const cur = currentBuffet().prices, found = ['noon', 'night', 'weekend'].some(k => prices[k] != null);
  const secs = []; items.forEach((it, i) => { let s = secs.find(x => x.name === it.sec); if (!s) secs.push(s = {name:it.sec, list:[]}); s.list.push(i); });
  const tmp = items.map((it, i) => menuType(it, 'tmp', i));
  const count = () => sel.filter(Boolean).length;
  openSheet({title:'Revisar la carta', cancel:'Cancelar', ok:'Añadir', cls:'rv-sheet', body:`
    <div class="rv-hero card"><span class="rv-ill">${illu('carta')}</span><span class="rv-tx"><small>${items.length} platos · ${secs.length} ${secs.length === 1 ? 'sección' : 'secciones'}${src ? ' · ' + esc(host(src)) : ''}</small>
      <input class="rv-name" id="rvName" maxlength="28" placeholder="Nombre del restaurante" value="${esc(place.name || '')}" aria-label="Nombre del restaurante"></span></div>
    <p class="hub-intro">Quita lo que no quieras contar. Los platos tienen el dibujo de la pieza más parecida y sus detalles: flambeado, crujiente, picante…</p>
    <div class="gsec"><div class="glabel">Precio del buffet por persona</div><div class="group">
      ${PRICE_SLOTS.map(s => `<label class="row"><span class="row-l" style="flex:0 0 auto">${s.name}</span><input class="row-in num" id="rv-${s.id}" inputmode="decimal" value="${fmtDec(prices[s.id] ?? cur[s.id])}"><span class="row-v">${CURRENCIES[S.settings.cur]}</span></label>`).join('')}
    </div><p class="gfoot">${found ? 'Lo hemos leído de su carta: compruébalo.' : 'No venía en la carta: escribe lo que cuesta.'}</p></div>
    ${secs.map((sc, si) => `<div class="gsec"><div class="glabel rv-sec"><span>${esc(sc.name)} · ${sc.list.length}</span><button class="link" data-all="${si}">${sc.list.every(i => sel[i]) ? 'Quitar todos' : 'Poner todos'}</button></div><div class="group">
      ${sc.list.map(i => { const it = items[i]; return `<label class="row rv-row" style="--ins:70px"><span class="rv-ic"><svg viewBox="0 0 48 48" class="pi" aria-hidden="true">${iconInner(tmp[i].id, tmp[i])}</svg></span><span class="row-main"><span class="row-t">${esc(it.name)}</span>
        ${it.mods.length || it.pieces || it.desc ? `<span class="rv-mods">${it.mods.map(m => `<em class="mtag m-${m}">${MOD_NAME[m]}</em>`).join('')}${it.pieces ? `<em class="mtag">${it.pieces} uds</em>` : ''}${it.desc && !it.mods.length ? `<span class="rv-desc">${esc(it.desc)}</span>` : ''}</span>` : ''}</span>
        <span class="ck"><input type="checkbox" data-i="${i}" ${sel[i] ? 'checked' : ''} aria-label="Añadir ${esc(it.name)}"><span>${ui('check')}</span></span></label>`; }).join('')}
    </div></div>`).join('')}
    <div class="group"><div class="row"><span class="row-l">Mostrar también las piezas de serie<span class="sub">Si no, el contador solo enseña esta carta</span></span>${sw('rvMix', false)}</div></div>
    <button class="btn" id="rvAdd">${ui('plus')}Añadir <span id="rvN">${count()}</span> platos al contador</button>
    <button class="btn plain" id="rvMore">${ui('camera')}Añadir otra página con una foto</button>`,
    mount(el) {
      const upd = () => { $('#rvN', el).textContent = count(); $$('[data-all]', el).forEach(b => { b.textContent = secs[+b.dataset.all].list.every(i => sel[i]) ? 'Quitar todos' : 'Poner todos'; }); };
      el.addEventListener('change', e => { const c = e.target.closest('[data-i]'); if (c) { sel[+c.dataset.i] = c.checked; feedback('tick'); upd(); } });
      el.addEventListener('click', e => { const a = e.target.closest('[data-all]'); if (!a) return; e.preventDefault(); const l = secs[+a.dataset.all].list, on = !l.every(i => sel[i]); l.forEach(i => { sel[i] = on; const c = el.querySelector(`[data-i="${i}"]`); if (c) c.checked = on; }); feedback('tick'); upd(); });
      $('#rvAdd', el).onclick = () => { if (commit(el) !== false) closeSheet(); };
      $('#rvMore', el).onclick = () => { data.sel = sel; data.place = {...place, name:$('#rvName', el).value.trim() || place.name}; photoFlow(data.place, data); };
    },
    onOk(el) { return commit(el); }});
  function commit(el) {
    const name = $('#rvName', el).value.trim(); if (!name) { hud('Escribe el nombre del restaurante'); $('#rvName', el).focus(); return false; }
    const chosen = items.filter((_, i) => sel[i]); if (!chosen.length) { hud('Elige al menos un plato'); return false; }
    const pr = Object.fromEntries(PRICE_SLOTS.map(s => [s.id, Math.max(0, parseNum($('#rv-' + s.id, el).value))]));
    const b = upsertBuffet({...place, name, website:src || place.website}, pr);
    b.name = name.slice(0, 28); b.useMenu = true; b.mix = $('#rvMix', el).checked; b.src = src || b.src || null; b.menuAt = Date.now();
    // Vuelve a usar los platos que ya existían con el mismo nombre, para no perder lo contado
    const old = new Map(S.types.filter(t => t.menu === b.id).map(t => [norm(t.name), t]));
    S.types.forEach(t => { if (t.menu === b.id) t.deleted = true; });
    const stamp = Date.now().toString(36);
    chosen.forEach((it, i) => {
      const t = menuType(it, b.id, stamp + i), prev = old.get(norm(t.name));
      // Si ya existía, se conserva tal cual (con lo que hayas editado) y solo se recoloca en su sección
      if (prev) Object.assign(prev, {sec:t.sec, cat:t.cat, deleted:false}); else S.types.push(t);
    });
    S.buffetId = b.id; S.session.buffetId = b.id; save();
    app.buildGrid(); app.updateCounter(); if (app.cur !== 'count') app.go('count');
    setTimeout(() => { celebrate('confetti'); feedback('mission'); hud(`Carta de ${b.name}: ${chosen.length} platos`); }, 450);
  }
}

/* ---------- Gestionar la carta de un buffet ---------- */
export const menuCount = bid => S.types.filter(t => t.menu === bid && !t.deleted).length;
export function menuSheet(bid) {
  const b = S.buffets.find(x => x.id === bid); if (!b) return;
  const list = S.types.filter(t => t.menu === bid && !t.deleted), secs = [];
  list.forEach(t => { let s = secs.find(x => x.name === t.sec); if (!s) secs.push(s = {name:t.sec, list:[]}); s.list.push(t); });
  openSheet({title:'Carta', cancel:'Cerrar', body:`
    <div class="rv-hero card"><span class="rv-ill">${illu('carta')}</span><span class="rv-tx"><small>${list.length} platos${b.src ? ' · ' + esc(host(b.src)) : ''}</small><b>${esc(b.name)}</b></span></div>
    <div class="group"><div class="row">${seg('mnUse', [['only', 'Solo la carta'], ['mix', 'Carta y de serie'], ['off', 'Desactivada']], b.useMenu === false ? 'off' : b.mix ? 'mix' : 'only')}</div></div>
    ${secs.map(sc => `<div class="gsec"><div class="glabel">${esc(sc.name)} · ${sc.list.length}</div><div class="group">${sc.list.map(t => `<div class="row tap" style="--ins:64px;cursor:pointer" data-type="${t.id}" role="button" tabindex="0"><span class="ricon"><svg viewBox="0 0 48 48" class="pi" aria-hidden="true">${iconInner(t.id, t)}</svg></span><span class="row-l">${esc(t.name)}<span class="sub">${money(t.cost)} coste · ${t.kcal} kcal${(t.mods || []).length ? ' · ' + t.mods.map(m => MOD_NAME[m].toLowerCase()).join(', ') : ''}</span></span>
      <label class="sw" aria-label="Mostrar ${esc(t.name)}"><input type="checkbox" data-mon="${t.id}" ${t.on ? 'checked' : ''}><span></span></label></div>`).join('')}</div></div>`).join('')}
    ${b.src || b.place ? `<button class="btn plain" id="mnAgain">${ui('undo')}Volver a leer la carta</button>` : ''}
    <button class="btn plain" id="mnPhoto">${ui('camera')}Añadir platos con una foto</button>
    <button class="btn ghost" id="mnDel">Borrar la carta</button>
    <p class="gfoot">Toca un plato para cambiar su nombre, coste, calorías o alérgenos. Lo que ya hayas contado se conserva aunque borres la carta.</p>`,
    mount(el) {
      bindSeg(el, 'mnUse', v => { b.useMenu = v !== 'off'; b.mix = v === 'mix'; save(); app.buildGrid(); app.updateCounter(); });
      el.addEventListener('change', e => { const c = e.target.closest('[data-mon]'); if (c) { typeById(c.dataset.mon).on = c.checked; save(); app.buildGrid(); feedback('tick'); } });
      el.addEventListener('click', e => { if (e.target.closest('.sw')) return; const r = e.target.closest('[data-type]'); if (r) app.typeSheet(r.dataset.type); });
      const ag = $('#mnAgain', el); if (ag) ag.onclick = () => { if (b.src) { const p = {...(b.place || {}), name:b.name, website:b.src}; const pr = progressSheet(b.name, host(b.src)); pr.step(0, host(b.src), 'done'); readMenu(b.src, pr.step).then(res => { if (!pr.alive()) return; if (res.items.length < 3) failSheet(p, 'empty'); else reviewSheet({...res, place:p, src:b.src}); }).catch(() => pr.alive() && failSheet(p, 'read')); } else importPlace({...b.place, name:b.name}); };
      $('#mnPhoto', el).onclick = () => { const cur = S.types.filter(t => t.menu === bid && !t.deleted); photoFlow({...(b.place || {}), name:b.name}, {items:cur.map(t => ({name:t.name, sec:t.sec, cat:t.cat, like:t.like, base:t.base, mods:t.mods || [], tpl:t.tpl, color:t.color, prot:null, costF:1, price:null, pieces:null, desc:t.desc || ''})), prices:b.prices, place:{...(b.place || {}), name:b.name}, src:b.src}); };
      twoStep($('#mnDel', el), 'Toca otra vez para borrar la carta', () => { S.types.forEach(t => { if (t.menu === bid) t.deleted = true; }); b.useMenu = false; save(); closeSheet(); app.buildGrid(); app.updateCounter(); hud('Carta borrada'); });
    }});
}
