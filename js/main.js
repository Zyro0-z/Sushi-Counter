// Arranque: une las pantallas, la navegación, los accesos rápidos y los procesos en segundo plano.
import {S, save, saveNow} from './store.js';
import {ui} from './icons.js';
import {money, sortTypes, tname} from './logic.js';
import {$, $$, esc, app, icon, openSheet, closeSheet, isSheetOpen, popMenu, initSheet, applyLook, measureText} from './ui/common.js';
import {feedback, hud, reduced} from './fx.js';
import {initHero, updateTime, mascotTick, resetHeroCache} from './ui/hero.js';
import {buildGrid, renderChips, updateCounter, renderMini, checkAll, undo, logSheet, initCards, initChips, undoStack} from './ui/counter.js';
import {renderRetos, updateBadge, chSheet, achSheet, newChSheet, profileSheet, setRetoSeg} from './ui/retos.js';
import {renderHistory, histSheet, finishSheet} from './ui/history.js';
import {renderSettings, settingsBack, settingsRoot, dinerSheet, typeSheet, buffetPicker} from './ui/settings.js';
import {roulette, duelSetup, trialSetup, trialRender, trialCheck} from './ui/play.js';
import {shareSheet, remoteSheet, remoteDiners, sharePush, connect, joinFromURL} from './ui/share.js';
import {scanTicket} from './ui/scan.js';
import {exportBackup, importBackup, exportCSV, shareCard, backupNudge} from './ui/files.js';
import {showIntro} from './ui/intro.js';

/* ---------- Pantalla encendida ---------- */
let wake = null;
async function keepAwake() {
  if (!S.settings.awake || !S.session.start || document.hidden || wake || !navigator.wakeLock) return;
  try { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } catch (e) {}
}
function releaseAwake() { if (wake) { try { wake.release(); } catch (e) {} wake = null; } }

/* ---------- Coste real: explicación ---------- */
function billInfo() {
  openSheet({title:'Coste real', cancel:'Cerrar', body:`
    <div class="sh-hero"><h4>Lo que de verdad cuesta cada pieza</h4><p>Coste estimado de los ingredientes para el restaurante, con precios de mayorista de 2026. No incluye sueldos, local ni luz.</p></div>
    <div class="kv"><div><span>Salmón (filete)</span><b>~15 €/kg</b></div><div><span>Atún</span><b>~22 €/kg</b></div><div><span>Arroz de sushi</span><b>~2 €/kg</b></div><div><span>Pollo</span><b>~6 €/kg</b></div></div>
    <div class="group">${sortTypes(S.types.filter(t => !t.deleted)).map(t => `<button class="row" style="--ins:64px" data-tcost="${t.id}"><span class="ricon">${icon(t.id)}</span><span class="row-l">${esc(t.name)}<span class="sub">1 ${t.unit} · en carta ${money(t.carta)}</span></span><span class="row-v num" style="color:var(--label);font-weight:800">${money(t.cost)}</span>${ui('chev', 'chev')}</button>`).join('')}</div>
    <p class="gfoot">Ejemplo: un nigiri de salmón lleva unos 12 g de pescado y 18 g de arroz, unos ${money(.24)}. El salmón noruego cotizaba a unos 6 €/kg en origen en agosto de 2026; limpio y fileteado llega al restaurante a unos 15 €/kg. Toca una pieza para ajustar su coste.</p>`,
    mount(el) { el.addEventListener('click', e => { const b = e.target.closest('[data-tcost]'); if (b) typeSheet(b.dataset.tcost); }); }});
}

/* ---------- Navegación ---------- */
const TABS = {count:['tCount', 'Contador'], ch:['tCh', 'Retos'], hist:['tHist', 'Historial'], set:['tSet', 'Ajustes']};
function go(tab) {
  const v = $('#v-' + tab);
  if (tab === app.cur) { if (tab === 'set') { settingsRoot(); renderSettings('pop'); } v.scrollTo({top:0, behavior:reduced() ? 'auto' : 'smooth'}); return; }
  app.cur = tab; document.body.dataset.tab = tab;
  $$('.view').forEach(x => { x.hidden = x !== v; });
  $$('.tb').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
  $('#tbPill').style.setProperty('--i', Object.keys(TABS).indexOf(tab));
  if (tab === 'ch') { renderRetos(); app.unseen = 0; }
  if (tab === 'hist') renderHistory();
  if (tab === 'set') renderSettings();
  updateBadge();
  v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
  onScroll.call(v);
}
function onScroll() {
  this.querySelector('.nav').classList.toggle('scrolled', this.scrollTop > 30);
  if (this.id === 'v-count') spy();
}
let spyLock = 0;
const pillOffset = () => $('#v-count .nav').offsetHeight + $('#pills').offsetHeight;
function spy() {
  if (Date.now() < spyLock) return;
  const v = $('#v-count'), off = pillOffset() + 12, vt = v.getBoundingClientRect().top;
  let on = 'top';
  $$('.catsec').forEach(s => { if (s.getBoundingClientRect().top - vt <= off) on = s.dataset.cat; });
  setPill(on);
}
function setPill(id) {
  $$('.pill', $('#pills')).forEach(p => {
    const a = p.dataset.go === id;
    if (a !== p.classList.contains('on')) { p.classList.toggle('on', a); if (a) { const box = $('#pills'); box.scrollTo({left:p.offsetLeft - box.clientWidth / 2 + p.offsetWidth / 2, behavior:reduced() ? 'auto' : 'smooth'}); } }
  });
}
function refreshAll() { renderChips(); updateCounter(); if (app.cur === 'ch') renderRetos(); if (app.cur === 'hist') renderHistory(); if (app.cur === 'set') renderSettings(); }
function afterReset() { undoStack.length = 0; resetHeroCache(); buildGrid(); refreshAll(); connect(); }

/* ---------- Menú ⋯ del contador ---------- */
function moreMenu() {
  popMenu($('#btnMore'), [
    {l:'Registro', i:'list', sub:'Todo lo que has pedido, con hora', fn:logSheet},
    {l:'Ruleta de sushi', i:'wheel', sub:'Que decida el azar', fn:roulette},
    {l:'Contrarreloj', i:'timer', sub:S.session.trial ? 'En marcha' : 'Piezas contra el tiempo', fn:trialSetup},
    {l:'Duelo en directo', i:'swords', sub:'Pantalla partida para dos', fn:duelSetup},
    'sep',
    {l:'Mesa compartida', i:'cloud', sub:S.share.code ? `Mesa ${S.share.code}` : 'Contad en varios móviles', fn:shareSheet},
    {l:'Cambiar de buffet', i:'pin', fn:buffetPicker},
    {l:'Escanear ticket', i:'camera', fn:scanTicket},
  ], {align:'right'});
}

/* ---------- Reflejo de cristal que sigue al dedo ---------- */
function initShine() {
  let lit = null, raf = 0, ev = null;
  const apply = () => {
    raf = 0; if (!ev) return;
    const el = ev.target.closest && ev.target.closest('.pc, .card, .chip');
    if (lit && lit !== el) lit.classList.remove('lit');
    if (!el || reduced()) { lit = null; return; }
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', ev.clientX - r.left + 'px'); el.style.setProperty('--my', ev.clientY - r.top + 'px');
    el.classList.add('lit'); lit = el;
  };
  const move = e => { ev = e; if (!raf) raf = requestAnimationFrame(apply); };
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerdown', move, {passive:true});
  const off = () => { if (lit) { const l = lit; setTimeout(() => l.classList.remove('lit'), 250); } lit = null; ev = null; };
  document.addEventListener('pointerup', off, {passive:true}); document.addEventListener('pointercancel', off, {passive:true});
  document.addEventListener('pointerleave', off, {passive:true});
}

/* ---------- Accesos rápidos (icono de la app) ---------- */
function shortcuts() {
  const p = new URLSearchParams(location.search), a = p.get('a') || location.hash.slice(1);
  if (!a) return;
  if (a === 'retos') go('ch');
  else if (a === 'historial' || a === 'hist') go('hist');
  else if (a === 'ruleta') setTimeout(roulette, 400);
  else if (a === 'empezar' || a === 'start') setTimeout(buffetPicker, 400);
  if (p.get('a')) history.replaceState(null, '', location.pathname);
}

/* ---------- Registro de funciones compartidas ---------- */
Object.assign(app, {
  go, updateCounter, buildGrid, renderChips, renderMini, renderRetos, updateBadge, renderSettings, renderHistory, refreshAll, afterReset, checkAll,
  dinerSheet, typeSheet, billInfo, profileSheet, shareSheet, remoteSheet, remoteDiners, remoteCount:() => remoteDiners().length, sharePush,
  exportCSV, exportBackup, importBackup, shareCard, backupNudge, showIntro, scanTicket, duelSetup, trialRender, trialCheck,
  keepAwake, releaseAwake, resetHero:resetHeroCache, sessionStarted:keepAwake,
});

/* ---------- Arranque ---------- */
function boot() {
  document.body.dataset.tab = 'count';
  measureText(); applyLook(); initSheet();
  $$('.tb').forEach(b => { const [ic, l] = TABS[b.dataset.tab]; b.innerHTML = `${ui(ic)}<span>${l}</span>`; });
  $('#btnUndo').innerHTML = ui('undo'); $('#btnMore').innerHTML = ui('more'); $('#btnNewCh').innerHTML = ui('plus');
  $('#btnUndo').onclick = undo; $('#btnMore').onclick = moreMenu; $('#btnFinish').onclick = finishSheet; $('#btnNewCh').onclick = newChSheet;
  $('#setBack').onclick = settingsBack;
  $('#miniM').onclick = () => { setRetoSeg('mis'); go('ch'); };
  $('#buffetLine').onclick = buffetPicker;
  $('#chBody').addEventListener('click', e => { const r = e.target.closest('[data-ch]'); if (r) return chSheet(r.dataset.ch); const a = e.target.closest('[data-ach]'); if (a) achSheet(a.dataset.ach); });
  $('#histBody').addEventListener('click', e => { const r = e.target.closest('[data-h]'); if (r) histSheet(r.dataset.h); });
  $('.tabbar').addEventListener('click', e => { const b = e.target.closest('.tb'); if (b) { go(b.dataset.tab); feedback('tick'); } });
  $$('.view').forEach(v => v.addEventListener('scroll', onScroll, {passive:true}));
  // Evita desplazamientos laterales provocados por el foco o scrollIntoView
  $$('.view, .stage, .app').forEach(el => el.addEventListener('scroll', () => { if (el.scrollLeft) el.scrollLeft = 0; }, {passive:true}));
  $('#pills').addEventListener('click', e => {
    const p = e.target.closest('.pill'); if (!p) return;
    const v = $('#v-count'); feedback('tick'); setPill(p.dataset.go); spyLock = Date.now() + 800;
    const s = p.dataset.go === 'top' ? $('.catsec') : $(`.catsec[data-cat="${p.dataset.go}"]`); if (!s) return;
    v.scrollTo({top:s.getBoundingClientRect().top - v.getBoundingClientRect().top + v.scrollTop - pillOffset() - 4, behavior:reduced() ? 'auto' : 'smooth'});
  });
  addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !(e.target.closest && e.target.closest('input'))) { e.preventDefault(); undo(); } });
  addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); else keepAwake(); });
  addEventListener('pagehide', saveNow);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyLook);
  document.addEventListener('touchstart', () => {}, {passive:true});

  initHero(); initCards(); initChips(); initShine();
  renderChips(); buildGrid();
  joinFromURL(); connect();
  shortcuts();
  showIntro();
  keepAwake();

  let tick = 0;
  setInterval(() => {
    tick++;
    if (S.session.start) updateTime();
    if (S.session.trial) trialCheck();
    if (tick % 15 === 0 && S.session.start) { mascotTick(); S.diners.forEach(d => checkAll(d.id)); updateCounter(); }
  }, 1000);

  if ('serviceWorker' in navigator && location.protocol === 'https:' && document.querySelector('link[rel="manifest"]')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
