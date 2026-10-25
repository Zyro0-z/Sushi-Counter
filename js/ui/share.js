// Mesa compartida entre varios móviles en tiempo real usando el servicio público ntfy.sh.
// Cada móvil publica el recuento de sus comensales y escucha el de los demás.
// Solo viaja nombre, color y recuento por pieza; el código de mesa hace de contraseña.
import {S, save} from '../store.js';
import {ui, illu} from '../icons.js';
import {howBlock} from './hub.js';
import {counts, initial, tname, sum, currentBuffet} from '../logic.js';
import {$, esc, app, icon, openSheet, closeSheet} from './common.js';
import {feedback, hud} from '../fx.js';

const HOST = 'https://ntfy.sh/';
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const remote = {}; // clave → {name, color, by, total, seen}
let es = null, pushT = null, beat = null, status = 'off';

const topic = code => 'sushi-counter-' + code.toLowerCase();
const newCode = () => Array.from({length:6}, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');

export function remoteDiners() {
  const now = Date.now();
  return Object.entries(remote).filter(([, r]) => now - r.seen < 45 * 60000).map(([key, r]) => ({key, ...r}));
}
function payload(reset) {
  return JSON.stringify({v:1, dev:S.share.dev, t:Date.now(), diners:reset ? [] : S.diners.map(d => {
    const by = counts(d.id); return {id:d.id, name:d.name, color:d.color, by, total:sum(by)};
  }).filter(d => d.total)});
}
export function sharePush(reset = false) {
  if (!S.share.code) return;
  clearTimeout(pushT);
  pushT = setTimeout(() => {
    fetch(HOST + topic(S.share.code), {method:'POST', body:payload(reset)}).then(r => setStatus(r.ok ? 'on' : 'err')).catch(() => setStatus('err'));
  }, reset ? 0 : 2500);
}
function setStatus(s) { status = s; const el = $('#shStatus'); if (el) el.textContent = label(); }
const label = () => ({on:'Conectada', wait:'Conectando…', err:'Sin conexión, reintentando', off:'Desconectada'})[status];
/* ---------- Carta compartida: viaja en trozos porque ntfy limita cada mensaje a 4 KB ---------- */
const parts = {};
const str = (v, n) => String(v ?? '').slice(0, n), num = v => (isFinite(+v) ? +v : 0);
export function shareMenu(bid) {
  const b = S.buffets.find(x => x.id === bid); if (!S.share.code || !b) return;
  const items = S.types.filter(t => t.menu === bid && !t.deleted && t.on).map(t => ({name:t.name, sec:t.sec, cat:t.cat, kcal:t.kcal, cost:t.cost, carta:t.carta, unit:t.unit, mac:t.mac, al:t.al, like:t.like, base:t.base, mods:t.mods, tpl:t.tpl, color:t.color, desc:t.desc}));
  if (!items.length) return;
  const body = JSON.stringify({name:b.name, prices:b.prices, place:b.place || null, src:b.src || null, at:b.menuAt || Date.now(), items});
  const id = S.share.dev + Date.now().toString(36), size = 2200, n = Math.ceil(body.length / size);
  for (let i = 0; i < n; i++) setTimeout(() => fetch(HOST + topic(S.share.code), {method:'POST', body:JSON.stringify({v:1, dev:S.share.dev, t:'menu', id, i, n, d:body.slice(i * size, (i + 1) * size)})}).catch(() => {}), i * 350);
  S.share.menuSent = {bid, at:Date.now()}; save();
}
// Lo que llega de otros móviles se limpia antes de usarlo
function cleanMenu(d) {
  if (!d || !Array.isArray(d.items)) return null;
  const items = d.items.slice(0, 200).map(t => ({name:str(t.name, 40), sec:str(t.sec, 40) || 'Carta', cat:['nigiri', 'roll', 'hot', 'side', 'dessert'].includes(t.cat) ? t.cat : 'hot', kcal:num(t.kcal), cost:num(t.cost), carta:num(t.carta), unit:str(t.unit, 12) || 'pieza',
    mac:Array.isArray(t.mac) ? t.mac.slice(0, 3).map(num) : [0, 0, 0], al:Array.isArray(t.al) ? t.al.map(x => str(x, 12)) : [], like:str(t.like, 20), base:str(t.base, 20), mods:Array.isArray(t.mods) ? t.mods.map(x => str(x, 10)) : [],
    tpl:t.tpl ? str(t.tpl, 12) : undefined, color:/^#[0-9a-f]{6}$/i.test(t.color || '') ? t.color : undefined, desc:t.desc ? str(t.desc, 120) : undefined})).filter(t => t.name);
  const pr = d.prices || {};
  return {name:str(d.name, 28) || 'Restaurante', prices:{noon:num(pr.noon), night:num(pr.night), weekend:num(pr.weekend)}, place:d.place && typeof d.place === 'object' ? {osm:d.place.osm ? str(d.place.osm, 20) : null, street:str(d.place.street, 60), city:str(d.place.city, 40), lat:d.place.lat == null ? null : num(d.place.lat), lon:d.place.lon == null ? null : num(d.place.lon), website:d.place.website ? str(d.place.website, 200) : null} : null,
    src:d.src ? str(d.src, 300) : null, at:num(d.at), items};
}
const remoteName = dev => (Object.entries(remote).find(([k]) => k.startsWith(dev + ':')) || [, {}])[1].name;
function onMenuPart(p) {
  const e = parts[p.id] = parts[p.id] || {n:Math.min(+p.n || 1, 60), got:{}};
  e.got[p.i] = String(p.d || '');
  if (Object.keys(e.got).length < e.n) return;
  delete parts[p.id];
  let data; try { data = cleanMenu(JSON.parse(Array.from({length:e.n}, (_, i) => e.got[i] || '').join(''))); } catch (err) { return; }
  if (data && app.offerMenu) app.offerMenu(data, remoteName(p.dev));
}
function onMsg(ev) {
  let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
  if (m.event !== 'message' || !m.message) return;
  let p; try { p = JSON.parse(m.message); } catch (e) { return; }
  if (p && p.t === 'menu' && p.dev !== S.share.dev && p.id) { onMenuPart(p); return; }
  if (!p || p.dev === S.share.dev || !Array.isArray(p.diners)) return;
  Object.keys(remote).filter(k => k.startsWith(p.dev + ':')).forEach(k => delete remote[k]);
  p.diners.forEach(d => { remote[p.dev + ':' + d.id] = {name:String(d.name).slice(0, 16), color:/^#[0-9a-f]{6}$/i.test(d.color) ? d.color : '#888888', by:d.by || {}, total:+d.total || 0, seen:Date.now()}; });
  app.renderChips(); app.updateCounter(); if (app.cur === 'ch') app.renderRetos();
  setStatus('on');
}
export function connect() {
  disconnect(true);
  if (!S.share.code || typeof EventSource === 'undefined') return;
  setStatus('wait');
  try {
    es = new EventSource(HOST + topic(S.share.code) + '/sse?since=3h');
    es.onmessage = onMsg; es.onopen = () => setStatus('on'); es.onerror = () => setStatus('err');
  } catch (e) { setStatus('err'); }
  clearInterval(beat); beat = setInterval(() => sharePush(), 120000);
  sharePush();
  // Si ya tienes una carta puesta, la mesa la recibe (como mucho cada 2 horas)
  const b = currentBuffet(), ms = S.share.menuSent;
  if (S.types.some(t => t.menu === b.id && !t.deleted) && (!ms || ms.bid !== b.id || Date.now() - ms.at > 2 * 3600e3)) setTimeout(() => shareMenu(b.id), 1500);
}
export function disconnect(keep) {
  if (es) { es.close(); es = null; } clearInterval(beat);
  if (!keep) { Object.keys(remote).forEach(k => delete remote[k]); setStatus('off'); }
}
function join(code) {
  code = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (code.length !== 6) { hud('El código tiene 6 letras o números'); return false; }
  S.share.code = code; S.stats.shares++; save(); connect(); feedback('mission'); hud('Mesa ' + code + ' conectada'); app.checkAll(S.diners[0].id);
  return true;
}
const linkFor = code => location.origin + location.pathname + '?mesa=' + code;
export function shareSheet() {
  const code = S.share.code;
  openSheet({title:'Mesa compartida', cancel:'Cerrar', body: code ? `
    <div class="sh-hero">${illu('mesa', 'hero-illu')}<h4 class="code num">${code}</h4><p id="shStatus">${label()}</p></div>
    <button class="btn" id="shCopy">${ui('share')}Invitar a la mesa</button>
    <div class="gsec"><div class="glabel">En otros móviles</div><div class="group">${remoteDiners().length ? remoteDiners().map(r => `<div class="row" style="--ins:62px"><span class="av md" style="--c:${r.color}">${esc(initial(r.name))}</span><span class="row-l">${esc(r.name)}</span><span class="h-tot">${r.total}</span></div>`).join('')
      : '<div class="empty" style="padding:18px"><b>Todavía nadie</b>Comparte el código o el enlace. Cuando otros sumen piezas aparecerán aquí y en el duelo.</div>'}</div></div>
    <button class="btn ghost" id="shLeave">Salir de la mesa</button>
    <p class="gfoot">Cada móvil cuenta lo suyo y el marcador se junta en el duelo de la mesa. Se usa el servicio público ntfy.sh: solo se envían nombres, colores y recuentos, y cualquiera con el código podría verlos.</p>` : `
    <div class="sh-hero">${illu('mesa', 'hero-illu')}<h4>Contad juntos, cada uno en su móvil</h4><p>Ideal si sois varios: nadie tiene que pasarse el móvil.</p></div>
    ${howBlock('mesa')}
    <button class="btn" id="shNew">${ui('plus')}Crear mesa nueva</button>
    <div class="gsec"><div class="glabel">Unirse con un código</div><div class="group"><label class="row"><input class="row-in code-in" id="shCode" maxlength="6" placeholder="ABC123" autocomplete="off" autocapitalize="characters" style="text-align:left"></label></div></div>
    <button class="btn plain" id="shJoin">Unirse</button>
    <p class="gfoot">Usa el servicio público ntfy.sh: solo se envían nombres, colores y recuentos. Necesita conexión a internet.</p>`,
    mount(el) {
      const nw = $('#shNew', el); if (nw) nw.onclick = () => { join(newCode()); closeSheet(); setTimeout(shareSheet, 520); };
      const jn = $('#shJoin', el); if (jn) jn.onclick = () => { if (join($('#shCode', el).value)) { closeSheet(); setTimeout(shareSheet, 520); } };
      const cp = $('#shCopy', el); if (cp) cp.onclick = () => {
        const url = linkFor(code), text = `Únete a mi mesa en Contador de Sushi: código ${code}`;
        if (navigator.share) navigator.share({title:'Mesa de sushi', text, url}).catch(() => {});
        else if (navigator.clipboard) navigator.clipboard.writeText(`${text} ${url}`).then(() => hud('Enlace copiado'), () => hud(`Código: ${code}`));
        else hud(`Código: ${code}`);
      };
      const lv = $('#shLeave', el); if (lv) lv.onclick = () => { sharePush(true); S.share.code = null; save(); disconnect(); closeSheet(); app.renderChips(); app.updateCounter(); hud('Has salido de la mesa'); };
    }});
}
export function remoteSheet(key) {
  const r = remote[key]; if (!r) return;
  openSheet({title:r.name, cancel:'Cerrar', body:`<div class="sh-hero"><span class="av xl" style="--c:${r.color}">${esc(initial(r.name))}</span><h4>${r.total} piezas</h4><p>Desde otro móvil de la mesa</p></div>
    <div class="group pad"><div class="mini-grid">${Object.entries(r.by).filter(([, v]) => v).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="mini">${icon(k)}<b>${v}</b>${esc(tname(k))}</div>`).join('')}</div></div>`});
}
export function joinFromURL() {
  try { const p = new URLSearchParams(location.search); const m = p.get('mesa'); if (m && m.toUpperCase() !== S.share.code) { join(m); history.replaceState(null, '', location.pathname); } } catch (e) {}
}
