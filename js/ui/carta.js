// Carta del restaurante (pantallas): buscar el sitio, leer su carta, revisarla, verla después con tu ranking,
// puntuar platos, detectar dónde estás, recibir la carta que comparte alguien de la mesa y activar el lector propio.
import {S, save} from '../store.js';
import {PRICE_SLOTS, CURRENCIES} from '../catalog.js';
import {ui, illu, iconInner} from '../icons.js';
import {parseMenu, menuType, MOD_NAME, norm} from '../menu.js';
import {money, fmtDec, parseNum, currentBuffet, typeById, ctx, lifetime} from '../logic.js';
import {$, $$, esc, app, openSheet, closeSheet, twoStep, sw, seg, bindSeg, isSheetOpen} from './common.js';
import {feedback, hud, celebrate, announce} from '../fx.js';
import {ocrMany, pickImage} from './scan.js';
import {searchPlaces, nearPlaces, findMenu, host, fixUrl, mapsUrl, ownReader, testReader, locate, dist} from './lector.js';

const fmtDist = m => m == null ? '' : m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
export const menuCount = bid => S.types.filter(t => t.menu === bid && !t.deleted).length;
const chev = () => ui('chev', 'chev');
const navRow = (id, ic, color, label, sub = '', tag = 'button', attrs = '') => `<${tag} class="row nav-row" id="${id}" style="--ins:58px" ${attrs}><span class="ri" style="--rc:${color}">${ui(ic)}</span><span class="row-l">${label}${sub ? `<span class="sub">${sub}</span>` : ''}</span>${chev()}</${tag}>`;

/* ---------- 1. Buscar el restaurante ---------- */
let lastQ = '';
const resultRow = (p, i) => `<button class="row fd-r" data-i="${i}" style="--ins:66px"><span class="fd-ic${p.asian ? ' asian' : ''}">${illu(p.asian ? 'carta' : 'buffet')}</span><span class="row-main"><span class="row-t">${esc(p.name)}</span>
  <span class="row-d">${esc([p.street, p.city].filter(Boolean).join(', ') || 'Sin dirección')}</span>
  <span class="fd-tags">${p.cuisine ? `<em class="fd-tag${p.asian ? '' : ' plain'}">${esc(p.cuisine)}</em>` : ''}${p.website || p.menuUrl ? `<em class="fd-tag web">${ui('globe')}Web</em>` : ''}</span></span>${p.d != null ? `<span class="row-v num">${fmtDist(p.d)}</span>` : ''}${chev()}</button>`;
const skeleton = () => `<div class="group">${Array.from({length:4}, () => '<div class="row sk-row"><i class="sk sk-ic"></i><span class="row-main"><i class="sk sk-t"></i><i class="sk sk-d"></i></span></div>').join('')}</div>`;
const webRow = q => q ? `<div class="group fd-web"><button class="row fd-r" data-i="web" style="--ins:66px"><span class="fd-ic">${ui('globe')}</span><span class="row-main"><span class="row-t">¿No sale? Buscar «${esc(q)}» en internet</span><span class="row-d">Buscamos su web y su carta por el nombre</span></span>${chev()}</button></div>` : '';
const groupsHTML = (list, q = '') => {
  const a = list.filter(p => p.asian), o = list.filter(p => !p.asian);
  const g = (t, l, off) => l.length ? `<div class="glabel">${t} · ${l.length}</div><div class="group">${l.map((p, i) => resultRow(p, i + off)).join('')}</div>` : '';
  return (a.length && o.length ? g('Sushi, asiáticos y buffets', a, 0) + g('Otros restaurantes', o, a.length) : `<div class="group">${list.map(resultRow).join('')}</div>`) + webRow(q);
};
export function openFinder(q = '') {
  let list = [], seq = 0, tm = 0;
  openSheet({title:'Carta del restaurante', cancel:'Cerrar', cls:'fd-sheet', body:`
    <div class="sh-hero">${illu('carta', 'hero-illu')}<h4>Cuenta con su carta</h4><p>Busca el restaurante: encontramos su carta y añadimos sus platos al contador, cada uno en su sección.</p></div>
    <label class="search">${ui('search')}<input id="fdQ" type="search" placeholder="Nombre y ciudad" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" value="${esc(q || lastQ)}" aria-label="Buscar restaurante por nombre y ciudad"></label>
    <button class="btn plain" id="fdNear">${ui('pin')}Restaurantes cerca de mí</button>
    <div id="fdRes" class="fd-res" aria-live="polite"></div>
    <div class="gsec"><div class="glabel">Otras formas de añadir la carta</div><div class="group">
      ${navRow('fdShots', 'camera', '#30A46C', 'Fotos o capturas de la carta', 'Por ejemplo, de Google Maps o de la mesa')}
      ${navRow('fdLink', 'link', '#0A84FF', 'Pegar el enlace de la carta', 'De su web o un PDF')}
      ${navRow('fdText', 'doc', '#8E8E93', 'Pegar el texto de la carta', 'Copiado de cualquier sitio')}
    </div><p class="gfoot">Escribe el tipo y la ciudad («sushi Palencia») para ver todos los asiáticos de la ciudad, o el nombre del restaurante. ${ownReader() && S.settings.readerGoogle ? 'Con los datos de Google Maps.' : 'Con los datos de OpenStreetMap: si falta alguno, búscalo por internet.'}</p></div>`,
    mount(el) {
      const box = $('#fdRes', el), inp = $('#fdQ', el);
      const paint = msg => { box.innerHTML = msg || (list.length ? groupsHTML(list, inp.value.trim()) : ''); };
      const run = async exact => {
        const v = inp.value.trim(); lastQ = v; if (v.length < 3) { list = []; paint(); return; }
        const my = ++seq; paint(skeleton());
        try { const r = await searchPlaces(v, exact); if (my !== seq) return; list = r;
          paint(r.length ? '' : `<div class="empty fd-empty"><b>No está en el mapa</b>${exact ? 'Muchos restaurantes no están en el mapa libre. Búscalo por internet:' : 'Pulsa Buscar en el teclado para buscar a fondo.'}</div>${exact ? webRow(v) : ''}`); announce(`${r.length} restaurantes`); }
        catch (e) { if (my === seq) paint(`<div class="empty fd-empty"><b>No hay conexión con el buscador</b>Puedes añadir la carta con fotos o con su enlace.</div>`); }
      };
      inp.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => run(false), 450); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(tm); run(true); inp.blur(); } });
      $('#fdNear', el).onclick = async () => {
        const my = ++seq; paint(skeleton()); feedback('tick');
        try { const r = await nearPlaces(); if (my !== seq) return; list = r.slice(0, 40); paint(r.length ? '' : `<div class="empty fd-empty"><b>No hay restaurantes cerca</b>Búscalo por su nombre.</div>`); }
        catch (e) { if (my === seq) paint(`<div class="empty fd-empty"><b>No sabemos dónde estás</b>Permite la ubicación (Ajustes del iPhone › Privacidad › Localización) o búscalo por su nombre.</div>`); }
      };
      box.addEventListener('click', e => {
        const r = e.target.closest('[data-i]'); if (!r) return; feedback('tick');
        if (r.dataset.i === 'web') { const q = inp.value.trim(); importPlace({name:q, city:'', osm:null, gid:null}); return; }
        importPlace(list[+r.dataset.i]);
      });
      $('#fdShots', el).onclick = () => shotsSheet();
      $('#fdLink', el).onclick = () => linkSheet();
      $('#fdText', el).onclick = () => textSheet();
      if (inp.value) run(false);
    }});
}

/* ---------- 2. Leer su carta, con los pasos a la vista ---------- */
function progressSheet(title, sub) {
  let cancelled = false;
  openSheet({title:'Buscando la carta', cancel:'Cancelar', body:`
    <div class="sh-hero">${illu('carta', 'hero-illu imp-anim')}<h4>${esc(title)}</h4><p>${esc(sub || '')}</p></div>
    <ol class="imp-steps">${['Buscando su web', 'Leyendo la carta', 'Mirando las fotos de la carta', 'Reconociendo los platos'].map((t, i) => `<li data-s="${i}"><i aria-hidden="true"></i><span>${t}</span><small></small></li>`).join('')}</ol>
    <p class="gfoot">Puede tardar hasta un minuto: probamos su web, sus PDF y las fotos de la carta.</p>`, onClose() { cancelled = true; }});
  const step = (i, note, state = 'on') => {
    $$('.imp-steps li').forEach(li => { const n = +li.dataset.s; li.className = n < i ? 'done' : n === i ? state : ''; });
    const sm = $(`.imp-steps li[data-s="${i}"] small`); if (sm && note != null) sm.textContent = note;
  };
  return {step, alive:() => !cancelled && !!$('.imp-steps')};
}
async function importPlace(pl) {
  const pr = progressSheet(pl.name, [pl.street, pl.city].filter(Boolean).join(', '));
  let res;
  try { res = await findMenu(pl, pr.step, pr.alive); } catch (e) { res = {fail:'read', place:pl}; }
  if (!pr.alive()) return;
  if (res.fail) { failSheet(res.place || pl, res.fail); return; }
  pr.step(3, `${res.items.length} platos`);
  setTimeout(() => { if (pr.alive()) reviewSheet(res); }, 450);
}
const GM_STEPS = [['pin', 'Abre el restaurante en Google Maps con el botón de abajo.'], ['doc', 'Entra en «Carta» (o en sus fotos) y abre cada foto de la carta.'], ['camera', 'Haz una captura de cada una y vuelve aquí: elige las capturas y las leemos.']];
function failSheet(pl, why) {
  const t = {noweb:['No encontramos su web', 'Ni el mapa ni internet tienen la web de este restaurante.'], read:['No se ha podido abrir su web', 'Puede que no haya conexión o que su web no deje leerla.'], empty:['Su web no tiene la carta en texto', 'Seguramente la tiene en fotos.']}[why] || ['No hemos encontrado la carta', ''];
  openSheet({title:pl.name, cancel:'Cerrar', body:`
    <div class="sh-hero">${illu('carta', 'hero-illu')}<h4>${t[0]}</h4><p>${t[1]} Casi todos los restaurantes tienen la carta en Google Maps: la leemos de tus capturas.</p></div>
    <ol class="gm-steps">${GM_STEPS.map(([ic, s], i) => `<li><span class="how-n">${i + 1}</span><span class="how-ic">${ui(ic)}</span><span>${s}</span></li>`).join('')}</ol>
    <a class="btn gm-btn" href="${mapsUrl(pl)}" target="_blank" rel="noopener">${ui('pin')}Abrir en Google Maps</a>
    <button class="btn plain" id="fsShots">${ui('camera')}Elegir las capturas de la carta</button>
    <div class="gsec"><div class="glabel">Otras formas</div><div class="group">
      ${navRow('fsLink', 'link', '#5E5CE6', 'Pegar el enlace de la carta', 'Si la encuentras en su web o en un PDF')}
      ${navRow('fsText', 'doc', '#8E8E93', 'Pegar el texto de la carta')}
      ${ownReader() ? '' : navRow('fsReader', 'bolt', '#FF9500', 'Activar el lector propio', 'Lee muchas más webs y PDF')}
      ${navRow('fsPlain', 'check', '#34C759', 'Usar este restaurante sin carta', 'Con las piezas de serie')}
    </div></div>`,
    mount(el) {
      $('#fsShots', el).onclick = () => shotsFlow(pl); $('#fsLink', el).onclick = () => linkSheet(pl); $('#fsText', el).onclick = () => textSheet(pl);
      const rd = $('#fsReader', el); if (rd) rd.onclick = () => readerSheet();
      $('#fsPlain', el).onclick = () => { const b = upsertBuffet(pl, null); S.buffetId = b.id; S.session.buffetId = b.id; save(); closeSheet(); app.buildGrid(); app.updateCounter(); hud(`Buffet: ${b.name}`); };
    }});
}
function shotsSheet(pl = null) {
  openSheet({title:'Fotos de la carta', cancel:'Cerrar', body:`
    <div class="sh-hero">${illu('carta', 'hero-illu')}<h4>Desde fotos o capturas</h4><p>Puedes elegir varias a la vez: fotos de la carta en la mesa o capturas de Google Maps.</p></div>
    <ol class="gm-steps">${GM_STEPS.map(([ic, s], i) => `<li><span class="how-n">${i + 1}</span><span class="how-ic">${ui(ic)}</span><span>${s}</span></li>`).join('')}</ol>
    ${pl ? `<a class="btn plain gm-btn" href="${mapsUrl(pl)}" target="_blank" rel="noopener">${ui('pin')}Abrir en Google Maps</a>` : ''}
    <button class="btn" id="shGo">${ui('camera')}Elegir fotos o capturas</button>
    <p class="gfoot">Las fotos no salen de tu móvil: el texto se lee aquí mismo. Mejor rectas, enteras y con buena luz.</p>`,
    mount(el) { $('#shGo', el).onclick = () => shotsFlow(pl); }});
}
function linkSheet(pl = null) {
  openSheet({title:'Enlace de la carta', cancel:'Cancelar', ok:'Leer', body:`
    <div class="sh-hero">${illu('carta', 'hero-illu')}<p>Pega la dirección de su web, de la carta en PDF o de Google Drive.</p></div>
    <div class="group"><label class="row"><input class="row-in" id="lkU" type="url" inputmode="url" placeholder="https://…" autocomplete="off" autocapitalize="off" style="text-align:left" value="${esc(pl && (pl.menuUrl || pl.website) || '')}"></label></div>`,
    mount(el) { setTimeout(() => $('#lkU', el).focus(), 450); },
    onOk(el) {
      const u = fixUrl($('#lkU', el).value); if (!u) { hud('Escribe un enlace válido'); return false; }
      const p = {...(pl || {name:host(u), osm:null}), website:pl && pl.website || null, menuUrl:u};
      setTimeout(() => importPlace(p), 520);
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
// Varias fotos o capturas a la vez; con merge se añaden a una revisión ya abierta
function shotsFlow(pl = null, merge = null) {
  pickImage(async files => {
    openSheet({title:'Leyendo las fotos', cancel:'Cancelar', body:`<div class="sh-hero">${illu('carta', 'hero-illu imp-anim')}<h4>Leyendo ${files.length > 1 ? `${files.length} fotos` : 'la foto'}…</h4><p id="ocrMsg">Preparando el lector</p></div>
      <div class="meter lg"><i id="ocrBar" style="width:4%"></i></div><p class="gfoot">La primera vez descarga el lector de texto (unos 5 MB).</p>`});
    const set = (m, p) => { const a = $('#ocrMsg'), b = $('#ocrBar'); if (a) a.textContent = m; if (b && p != null) b.style.width = Math.max(4, p * 100) + '%'; };
    let res;
    try { res = parseMenu((await ocrMany(files.slice(0, 12), set, 2400)).join('\n\n# \n\n')); } catch (e) { hud('No se pudieron leer las fotos'); closeSheet(); return; }
    if (merge) { const seen = new Set(merge.items.map(i => norm(i.name))); const add = res.items.filter(i => !seen.has(norm(i.name))); res = {...merge, items:[...merge.items, ...add], prices:{...res.prices, ...merge.prices}, sel:[...(merge.sel || merge.items.map(() => true)), ...add.map(() => true)]}; }
    if (!res.items.length) { hud('No reconocemos platos. Prueba con fotos más cerca y con luz.'); if (merge) reviewSheet(merge); else closeSheet(); return; }
    reviewSheet({place:pl || {name:'', osm:null}, src:null, ...res});
  }, true);
}

/* ---------- 3. Revisar y añadir ---------- */
function upsertBuffet(pl, prices) {
  let b = (pl.osm && S.buffets.find(x => x.place && x.place.osm === pl.osm)) || (pl.gid && S.buffets.find(x => x.place && x.place.gid === pl.gid)) || S.buffets.find(x => norm(x.name) === norm(pl.name || ''));
  if (!b) { b = {id:'b' + Date.now().toString(36), name:(pl.name || 'Restaurante').slice(0, 28), prices:prices || {...currentBuffet().prices}}; S.buffets.push(b); }
  else if (prices) b.prices = prices;
  if (pl.osm || pl.gid || pl.website || pl.lat != null) b.place = {...(b.place || {}), osm:pl.osm || null, gid:pl.gid || null, street:pl.street || '', city:pl.city || '', lat:pl.lat ?? null, lon:pl.lon ?? null, website:pl.website || null};
  return b;
}
// Pone una carta en un buffet (desde la revisión o desde la mesa compartida). types: platos ya convertidos.
export function applyMenu(meta, types, {mix = false, silent = false} = {}) {
  const b = upsertBuffet(meta.place || {name:meta.name}, meta.prices);
  b.name = (meta.name || b.name).slice(0, 28); b.useMenu = true; b.mix = mix; b.src = meta.src || b.src || null; b.menuAt = Date.now();
  // Los platos que ya existían con el mismo nombre se conservan (con su puntuación y lo contado)
  const old = new Map(S.types.filter(t => t.menu === b.id).map(t => [norm(t.name), t]));
  S.types.forEach(t => { if (t.menu === b.id) t.deleted = true; });
  const stamp = Date.now().toString(36);
  types.forEach((t0, i) => {
    const prev = old.get(norm(t0.name));
    if (prev) Object.assign(prev, {sec:t0.sec, cat:t0.cat, deleted:false});
    else S.types.push({...t0, id:`mn_${b.id}_${stamp}${i}`, menu:b.id, on:true, fav:false, deleted:false});
  });
  S.buffetId = b.id; S.session.buffetId = b.id; save();
  app.buildGrid(); app.updateCounter(); if (app.cur !== 'count') app.go('count');
  if (!silent) setTimeout(() => { celebrate('confetti'); feedback('mission'); hud(`Carta de ${b.name}: ${types.length} platos`); }, 450);
  return b;
}
function reviewSheet(data) {
  const {items, prices = {}, place = {}, src} = data;
  // Lo dudoso (sin palabra de pieza) empieza sin marcar
  const sel = data.sel || items.map(it => !it.unsure);
  const cur = currentBuffet().prices, found = ['noon', 'night', 'weekend'].some(k => prices[k] != null);
  const secs = []; items.forEach((it, i) => { let s = secs.find(x => x.name === it.sec); if (!s) secs.push(s = {name:it.sec, list:[]}); s.list.push(i); });
  const tmp = items.map((it, i) => menuType(it, 'tmp', i));
  const count = () => sel.filter(Boolean).length;
  openSheet({title:'Revisar la carta', cancel:'Cancelar', ok:'Añadir', cls:'rv-sheet', body:`
    <div class="rv-hero card"><span class="rv-ill">${illu('carta')}</span><span class="rv-tx"><small>${items.length} platos · ${secs.length} ${secs.length === 1 ? 'sección' : 'secciones'}${src ? ' · ' + esc(host(src)) : ''}</small>
      <input class="rv-name" id="rvName" maxlength="28" placeholder="Nombre del restaurante" value="${esc(place.name || '')}" aria-label="Nombre del restaurante"></span></div>
    <p class="hub-intro">Quita lo que no quieras contar. Cada plato lleva el dibujo de la pieza más parecida y sus detalles: flambeado, crujiente, picante…${items.some(i => i.unsure) ? ` Lo marcado como «¿Es un plato?» empieza sin marcar: actívalo si lo es.` : ''}</p>
    <div class="gsec"><div class="glabel">Precio del buffet por persona</div><div class="group">
      ${PRICE_SLOTS.map(s => `<label class="row"><span class="row-l" style="flex:0 0 auto">${s.name}</span><input class="row-in num" id="rv-${s.id}" inputmode="decimal" value="${fmtDec(prices[s.id] ?? cur[s.id])}"><span class="row-v">${CURRENCIES[S.settings.cur]}</span></label>`).join('')}
    </div><p class="gfoot">${found ? 'Lo hemos leído de su carta: compruébalo.' : 'No venía en la carta: escribe lo que cuesta.'}</p></div>
    ${secs.map((sc, si) => `<div class="gsec"><div class="glabel rv-sec"><span>${esc(sc.name)} · ${sc.list.length}</span><button class="link" data-all="${si}">${sc.list.every(i => sel[i]) ? 'Quitar todos' : 'Poner todos'}</button></div><div class="group">
      ${sc.list.map(i => { const it = items[i]; return `<label class="row rv-row" style="--ins:70px"><span class="rv-ic"><svg viewBox="0 0 48 48" class="pi" aria-hidden="true">${iconInner(tmp[i].id, tmp[i])}</svg></span><span class="row-main"><span class="row-t">${esc(it.name)}</span>
        ${it.unsure || it.mods.length || it.pieces || it.desc ? `<span class="rv-mods">${it.unsure ? '<em class="mtag unsure">¿Es un plato?</em>' : ''}${it.mods.map(m => `<em class="mtag m-${m}">${MOD_NAME[m]}</em>`).join('')}${it.pieces ? `<em class="mtag">${it.pieces} uds</em>` : ''}${it.desc && !it.mods.length ? `<span class="rv-desc">${esc(it.desc)}</span>` : ''}</span>` : ''}</span>
        <span class="ck"><input type="checkbox" data-i="${i}" ${sel[i] ? 'checked' : ''} aria-label="Añadir ${esc(it.name)}"><span>${ui('check')}</span></span></label>`; }).join('')}
    </div></div>`).join('')}
    <div class="group"><div class="row"><span class="row-l">Mostrar también las piezas de serie<span class="sub">Si no, el contador solo enseña esta carta</span></span>${sw('rvMix', false)}</div></div>
    <button class="btn" id="rvAdd">${ui('plus')}Añadir <span id="rvN">${count()}</span> platos al contador</button>
    <button class="btn plain" id="rvMore">${ui('camera')}Añadir más páginas con fotos</button>`,
    mount(el) {
      const upd = () => { $('#rvN', el).textContent = count(); $$('[data-all]', el).forEach(b => { b.textContent = secs[+b.dataset.all].list.every(i => sel[i]) ? 'Quitar todos' : 'Poner todos'; }); };
      el.addEventListener('change', e => { const c = e.target.closest('[data-i]'); if (c) { sel[+c.dataset.i] = c.checked; feedback('tick'); upd(); } });
      el.addEventListener('click', e => { const a = e.target.closest('[data-all]'); if (!a) return; e.preventDefault(); const l = secs[+a.dataset.all].list, on = !l.every(i => sel[i]); l.forEach(i => { sel[i] = on; const c = el.querySelector(`[data-i="${i}"]`); if (c) c.checked = on; }); feedback('tick'); upd(); });
      $('#rvAdd', el).onclick = () => { if (commit(el) !== false) closeSheet(); };
      $('#rvMore', el).onclick = () => { const p = {...place, name:$('#rvName', el).value.trim() || place.name}; shotsFlow(p, {...data, sel, place:p}); };
    },
    onOk(el) { return commit(el); }});
  function commit(el) {
    const name = $('#rvName', el).value.trim(); if (!name) { hud('Escribe el nombre del restaurante'); $('#rvName', el).focus(); return false; }
    const chosen = items.filter((_, i) => sel[i]); if (!chosen.length) { hud('Elige al menos un plato'); return false; }
    const pr = Object.fromEntries(PRICE_SLOTS.map(s => [s.id, Math.max(0, parseNum($('#rv-' + s.id, el).value))]));
    const b = applyMenu({name, prices:pr, place:{...place, name}, src}, chosen.map((it, i) => menuType(it, 'x', i)), {mix:$('#rvMix', el).checked});
    if (S.share.code && app.shareMenu) app.shareMenu(b.id);
  }
}

/* ---------- Puntuar platos ---------- */
const STAR = '<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z"/>';
const RATE_TXT = ['', 'No me gusta', 'Regular', 'Bien', 'Muy bueno', 'Me encanta'];
export const starsHTML = (k, r = 0, big = false) => `<span class="stars${big ? ' big' : ''}" data-rate-k="${k}" role="radiogroup" aria-label="Puntuación">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="st${n <= r ? ' on' : ''}" data-n="${n}" role="radio" aria-checked="${n === r}" aria-label="${n} ${n === 1 ? 'estrella' : 'estrellas'}: ${RATE_TXT[n]}"><svg viewBox="0 0 24 24" aria-hidden="true">${STAR}</svg></button>`).join('')}</span>`;
// Un toque pone la nota; tocar la misma estrella otra vez la quita
export function bindStars(root, after = () => {}) {
  root.addEventListener('click', e => {
    const b = e.target.closest('.stars .st'); if (!b) return; e.preventDefault(); e.stopPropagation();
    const box = b.closest('.stars'), t = typeById(box.dataset.rateK); if (!t) return;
    const n = +b.dataset.n; t.rate = t.rate === n ? 0 : n; save(); feedback(t.rate >= 4 ? 'mission' : 'tick');
    $$('.st', box).forEach(s => { const on = +s.dataset.n <= t.rate; s.classList.toggle('on', on); s.setAttribute('aria-checked', +s.dataset.n === t.rate); });
    box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
    announce(t.rate ? `${t.name}: ${RATE_TXT[t.rate]}` : `${t.name}: sin puntuar`);
    after(t);
  });
}
export function rateSheet(k) {
  const t = typeById(k); if (!t) return;
  openSheet({title:'Puntuar', cancel:'Listo', body:`
    <div class="sh-hero"><svg viewBox="0 0 48 48" class="pi big-ic" aria-hidden="true">${iconInner(t.id, t)}</svg><h4>${esc(t.name)}</h4><p id="rtTxt">${t.rate ? RATE_TXT[t.rate] : '¿Qué tal está?'}</p></div>
    <div class="rate-big">${starsHTML(k, t.rate || 0, true)}</div>
    <div class="group"><label class="row"><span class="row-l" style="flex:0 0 auto">Nota</span><input class="row-in" id="rtNote" maxlength="60" placeholder="Por ejemplo, pedir sin mayonesa" value="${esc(t.note || '')}"></label></div>
    <p class="gfoot">Los platos con 4 o 5 estrellas salen primero en su sección la próxima vez.</p>`,
    mount(el) { bindStars(el, x => { $('#rtTxt', el).textContent = x.rate ? RATE_TXT[x.rate] : '¿Qué tal está?'; app.buildGrid(); }); $('#rtNote', el).addEventListener('change', e => { t.note = e.target.value.trim(); save(); }); }});
}
// Al guardar la sesión: puntuar de una vez lo que se ha comido
export function rateListSheet(keys) {
  const list = keys.map(typeById).filter(Boolean); if (!list.length) return;
  openSheet({title:'¿Qué tal estaba?', cancel:'Listo', body:`
    <p class="hub-intro">Puntúa lo de hoy y la próxima vez tus favoritos saldrán primero.</p>
    <div class="group">${list.map(t => `<div class="row rt-row" style="--ins:62px"><span class="ricon"><svg viewBox="0 0 48 48" class="pi" aria-hidden="true">${iconInner(t.id, t)}</svg></span><span class="row-l">${esc(t.name)}</span>${starsHTML(t.id, t.rate || 0)}</div>`).join('')}</div>`,
    mount(el) { bindStars(el, () => app.buildGrid()); }});
}

/* ---------- Ver la carta después (con tu ranking) ---------- */
export function menuSheet(bid) {
  const b = S.buffets.find(x => x.id === bid); if (!b) return;
  const list = S.types.filter(t => t.menu === bid && !t.deleted), secs = [];
  list.forEach(t => { let s = secs.find(x => x.name === t.sec); if (!s) secs.push(s = {name:t.sec, list:[]}); s.list.push(t); });
  const L = lifetime(), today = ctx(S.active).by, life = k => L.byType[k] || 0;
  const rank = list.filter(t => t.rate || life(t.id)).sort((a, c) => ((c.rate || 0) - (a.rate || 0)) || (life(c.id) - life(a.id))).slice(0, 5);
  const pl = {...(b.place || {}), name:b.name};
  const dish = t => `<div class="row cv-row" style="--ins:66px" data-type="${t.id}"><span class="ricon"><svg viewBox="0 0 48 48" class="pi" aria-hidden="true">${iconInner(t.id, t)}</svg></span>
    <span class="row-main"><span class="row-t">${esc(t.name)}${today[t.id] ? `<em class="cv-n">×${today[t.id]}</em>` : ''}</span><span class="row-d">${(t.mods || []).map(m => MOD_NAME[m]).join(' · ') || `${money(t.cost)} de coste · ${t.kcal} kcal`}${t.note ? ` · «${esc(t.note)}»` : ''}</span>
    <span class="cv-r">${starsHTML(t.id, t.rate || 0)}</span></span><label class="sw cv-sw" aria-label="Mostrar ${esc(t.name)}"><input type="checkbox" data-mon="${t.id}" ${t.on ? 'checked' : ''}><span></span></label></div>`;
  openSheet({title:'Carta', cancel:'Cerrar', ok:'Editar', cls:'cv-sheet', body:`
    <div class="cv-hero card"><span class="rv-ill">${illu('carta')}</span><span class="rv-tx"><small>${list.length} platos · ${secs.length} secciones</small><b>${esc(b.name)}</b>${b.place && (b.place.street || b.place.city) ? `<span class="cv-addr">${esc([b.place.street, b.place.city].filter(Boolean).join(', '))}</span>` : ''}</span></div>
    <div class="cv-acts">
      ${b.src ? `<a class="cv-act" href="${esc(b.src)}" target="_blank" rel="noopener">${ui('globe')}<span>Carta original</span></a>` : ''}
      <a class="cv-act" href="${mapsUrl(pl)}" target="_blank" rel="noopener">${ui('pin')}<span>Google Maps</span></a>
      ${S.share.code ? `<button class="cv-act" id="cvShare">${ui('people')}<span>Enviar a la mesa</span></button>` : ''}
      <button class="cv-act" id="cvPhoto">${ui('camera')}<span>Añadir fotos</span></button>
    </div>
    <div class="group cv-mode"><div class="row">${seg('mnUse', [['only', 'Solo carta'], ['mix', 'Carta + serie'], ['off', 'Apagada']], b.useMenu === false ? 'off' : b.mix ? 'mix' : 'only')}</div></div>
    ${rank.length ? `<div class="gsec"><div class="glabel">Tu ranking aquí</div><div class="group cv-rank">${rank.map((t, i) => `<div class="row" style="--ins:66px"><span class="cv-pos p${i + 1}">${i + 1}</span><span class="ricon"><svg viewBox="0 0 48 48" class="pi" aria-hidden="true">${iconInner(t.id, t)}</svg></span><span class="row-main"><span class="row-t">${esc(t.name)}</span><span class="row-d">${t.rate ? '★'.repeat(t.rate) + ' · ' : ''}${life(t.id)} en total</span></span></div>`).join('')}</div></div>` : ''}
    ${secs.map(sc => `<div class="gsec"><div class="glabel">${esc(sc.name)} · ${sc.list.length}</div><div class="group">${sc.list.map(dish).join('')}</div></div>`).join('')}
    <div class="cv-edit-only">
      ${b.src || b.place ? `<button class="btn plain" id="mnAgain">${ui('undo')}Volver a buscar la carta</button>` : ''}
      <button class="btn ghost" id="mnDel">Borrar la carta</button>
      <p class="gfoot">Toca un plato para cambiar su nombre, coste, calorías o alérgenos. Lo que ya hayas contado se conserva aunque borres la carta.</p>
    </div>`,
    mount(el) {
      bindStars(el, () => app.buildGrid());
      bindSeg(el, 'mnUse', v => { b.useMenu = v !== 'off'; b.mix = v === 'mix'; save(); app.buildGrid(); app.updateCounter(); });
      el.addEventListener('change', e => { const c = e.target.closest('[data-mon]'); if (c) { typeById(c.dataset.mon).on = c.checked; save(); app.buildGrid(); feedback('tick'); } });
      el.addEventListener('click', e => { if (e.target.closest('.sw,.stars')) return; const r = e.target.closest('.cv-row[data-type]'); if (r) { if (el.closest('.sheet').classList.contains('editing')) app.typeSheet(r.dataset.type); else rateSheet(r.dataset.type); } });
      const sh = $('#cvShare', el); if (sh) sh.onclick = () => { app.shareMenu(bid); hud('Carta enviada a la mesa'); };
      $('#cvPhoto', el).onclick = () => { const cur = S.types.filter(t => t.menu === bid && !t.deleted); shotsFlow(pl, {items:cur.map(t => ({name:t.name, sec:t.sec, cat:t.cat, like:t.like, base:t.base, mods:t.mods || [], tpl:t.tpl, color:t.color, prot:null, costF:1, price:null, pieces:null, desc:t.desc || ''})), prices:b.prices, place:pl, src:b.src}); };
      const ag = $('#mnAgain', el); if (ag) ag.onclick = () => importPlace({...pl, website:b.place && b.place.website || null, menuUrl:b.src || null});
      twoStep($('#mnDel', el), 'Toca otra vez para borrar la carta', () => { S.types.forEach(t => { if (t.menu === bid) t.deleted = true; }); b.useMenu = false; save(); closeSheet(); app.buildGrid(); app.updateCounter(); hud('Carta borrada'); });
    },
    onOk(sh) { const on = sh.classList.toggle('editing'); $('[data-ok]', sh).textContent = on ? 'Hecho' : 'Editar'; return false; }});
}

/* ---------- Lector propio (Vercel) ---------- */
export function readerSheet() {
  const cur = ownReader();
  const status = ok => ok ? `● Conectado${S.settings.readerGoogle ? ' · con Google Maps' : ''}` : 'No responde. Revisa la dirección o espera a que Vercel termine de publicarlo.';
  openSheet({title:'Lector de cartas', cancel:'Cerrar', body:`
    <div class="sh-hero">${illu('carta', 'hero-illu')}<h4>Tu propio lector, gratis</h4><p>Lee las webs y los PDF de los restaurantes desde un servidor tuyo. Mucho más fiable que los servicios públicos.</p></div>
    <ol class="gm-steps">
      <li><span class="how-n">1</span><span class="how-ic">${ui('globe')}</span><span>Entra en <b>vercel.com</b> y pulsa <b>Continue with GitHub</b>.</span></li>
      <li><span class="how-n">2</span><span class="how-ic">${ui('plus')}</span><span><b>Add New › Project</b>, importa <b>Sushi-Counter</b> y pulsa <b>Deploy</b>.</span></li>
      <li><span class="how-n">3</span><span class="how-ic">${ui('link')}</span><span>Copia la dirección que te da (acaba en <b>.vercel.app</b>) y pégala aquí.</span></li>
    </ol>
    <a class="btn plain" href="https://vercel.com/new" target="_blank" rel="noopener">${ui('globe')}Abrir Vercel</a>
    <div class="group"><label class="row"><input class="row-in" id="rdU" type="url" inputmode="url" placeholder="https://tu-proyecto.vercel.app" autocomplete="off" autocapitalize="off" style="text-align:left" value="${esc(cur)}"></label></div>
    <p class="gfoot rd-st" id="rdSt">${cur ? 'Comprobando…' : 'Sin activar: se usan los servicios públicos.'}</p>
    <button class="btn" id="rdTest">${ui('check')}Comprobar y guardar</button>
    ${cur ? '<button class="btn ghost" id="rdOff">Desactivar</button>' : ''}
    <details class="how g-how"><summary>${ui('pin')}<span>Opcional: todos los restaurantes de Google Maps</span>${ui('chevD', 'how-chev')}</summary>
      <p class="g-txt">El mapa libre no tiene todos los sitios. Con una clave de Google, el buscador usa los datos de Google Maps y encuentra la web de casi cualquier restaurante.</p>
      <ol>
        <li><span class="how-n">1</span><span class="how-t">En <b>console.cloud.google.com</b> crea un proyecto y activa la facturación. <b>Pide una tarjeta</b>, pero cada mes son gratis 5.000 búsquedas y 1.000 webs.</span></li>
        <li><span class="how-n">2</span><span class="how-t">Activa <b>Places API (New)</b> y crea una clave en <b>Credenciales</b>.</span></li>
        <li><span class="how-n">3</span><span class="how-t">En <b>Places API (New) › Cuotas</b>, limita las peticiones a <b>150 al día</b>: así nunca pasas de lo gratuito.</span></li>
        <li><span class="how-n">4</span><span class="how-t">En Vercel: tu proyecto › <b>Settings › Environment Variables</b>, añade <b>GOOGLE_PLACES_KEY</b> con la clave y pulsa <b>Redeploy</b>. Luego vuelve aquí y comprueba.</span></li>
      </ol></details>`,
    mount(el) {
      const st = $('#rdSt', el);
      const check = async v => { st.textContent = 'Comprobando…'; st.className = 'gfoot rd-st'; const ok = await testReader(v); st.textContent = status(ok); st.className = 'gfoot rd-st ' + (ok ? 'ok' : 'err'); return ok; };
      if (cur) check(cur);
      $('#rdTest', el).onclick = async () => { const ok = await check($('#rdU', el).value); if (ok) { S.settings.reader = ok; save(); feedback('mission'); } else feedback('tick'); };
      const off = $('#rdOff', el); if (off) off.onclick = () => { S.settings.reader = ''; S.settings.readerGoogle = false; save(); closeSheet(); hud('Lector propio desactivado'); };
    }});
}

/* ---------- Avisos en el contador: carta compartida, «¿estás en…?», detectar y buscar ---------- */
let hint = null;
function setHint(h) { hint = h; renderHint(); }
export function renderHint() {
  const el = $('#menuHint'); if (!el) return;
  const b = currentBuffet(), started = S.session.log.length > 0;
  let h = hint;
  if (h && h.kind === 'here' && (started || h.bid === b.id)) h = hint = null;
  if (h && h.kind !== 'shared' && started) h = null;
  if (!h && !menuCount(b.id) && S.settings.menuHint !== false && !started) h = {kind:'generic'};
  el.hidden = !h; if (!h) return;
  const card = (ill, title, sub, go, goIc = 'search') => `<span class="mh-ill">${illu(ill)}</span><span class="mh-tx"><b>${title}</b><span>${sub}</span></span><span class="mh-go">${ui(goIc)}${go}</span><button class="mh-x" id="mhX" aria-label="Cerrar">${ui('x')}</button>`;
  el.className = 'menu-hint card' + (h.kind === 'shared' ? ' shared' : '');
  el.innerHTML = h.kind === 'shared' ? card('carta', `${esc(h.from)} ha compartido una carta`, `${esc(h.data.name)} · ${h.data.items.length} platos`, 'Usar', 'check')
    : h.kind === 'here' ? card('buffet', `¿Estás en ${esc(S.buffets.find(x => x.id === h.bid).name)}?`, menuCount(h.bid) ? `Cargamos su carta de ${menuCount(h.bid)} platos` : 'Usamos su precio', 'Sí', 'check')
    : h.kind === 'nearby' ? card('buffet', `¿Estás en ${esc(h.place.name)}?`, `${h.place.d != null ? `A ${fmtDist(h.place.d)} · ` : ''}Buscamos su carta`, 'Sí', 'check')
    : h.kind === 'locate' ? card('carta', '¿Dónde comes hoy?', 'Detectamos el restaurante con tu ubicación y cargamos su carta', 'Detectar', 'pin')
    : card('carta', 'Cuenta con la carta del restaurante', 'Búscalo y añadimos sus platos: nigiri flambeado, maki frito…', 'Buscar');
  el.onclick = e => {
    feedback('tick');
    if (e.target.closest('#mhX')) { if (h.kind === 'generic') { S.settings.menuHint = false; save(); } if (h.kind === 'locate') { S.settings.detect = false; save(); } hint = null; el.hidden = true; renderHint(); return; }
    if (h.kind === 'shared') { const d = h.data; hint = null; applyMenu({name:d.name, prices:d.prices, place:d.place, src:d.src}, d.items); renderHint(); }
    else if (h.kind === 'here') { S.session.buffetId = h.bid; S.buffetId = h.bid; save(); hint = null; app.buildGrid(); app.updateCounter(); hud('Buffet: ' + currentBuffet().name); renderHint(); }
    else if (h.kind === 'nearby') { const p = h.place; hint = null; renderHint(); importPlace(p); }
    else if (h.kind === 'locate') detectPlace(true);
    else openFinder();
  };
}
// Con permiso de ubicación: si estás en un buffet guardado lo propone; si no, el restaurante de al lado
export async function detectPlace(manual = false) {
  if (S.session.log.length) return;
  if (!manual) {
    if (S.settings.detect === false || (S.session.detectAt && Date.now() - S.session.detectAt < 2 * 3600e3)) return;
    let st = 'prompt'; try { st = (await navigator.permissions.query({name:'geolocation'})).state; } catch (e) {}
    if (st === 'denied') return;
    if (st !== 'granted') { if (!hint) setHint({kind:'locate'}); return; }
  }
  S.session.detectAt = Date.now(); save();
  try {
    const me = await locate();
    const saved = S.buffets.filter(b => b.place && b.place.lat != null).map(b => ({b, d:dist(me, b.place)})).filter(x => x.d < 220).sort((a, c) => a.d - c.d)[0];
    if (saved) { if (saved.b.id !== currentBuffet().id) setHint({kind:'here', bid:saved.b.id}); else { hint = null; renderHint(); if (manual) hud(`Estás en ${saved.b.name}`); } return; }
    const near = (await nearPlaces(140))[0];
    if (near) setHint({kind:'nearby', place:near}); else { hint = null; renderHint(); if (manual) hud('No hay restaurantes justo aquí. Búscalo por su nombre.'); }
  } catch (e) { if (manual) { hud('No sabemos dónde estás'); hint = null; renderHint(); } }
}
// Llega una carta desde la mesa compartida
export function offerMenu(data, from) {
  if (!data || !Array.isArray(data.items) || !data.items.length) return;
  const b = S.buffets.find(x => (data.place && data.place.osm && x.place && x.place.osm === data.place.osm) || norm(x.name) === norm(data.name));
  if (b && menuCount(b.id) >= data.items.length && b.menuAt >= (data.at || 0)) return;
  setHint({kind:'shared', data, from:from || 'Alguien de la mesa'});
  announce(`${from || 'Alguien'} ha compartido la carta de ${data.name}`);
  if (app.cur !== 'count' && !isSheetOpen()) hud(`${from || 'Alguien'} ha compartido la carta de ${data.name}`);
}
