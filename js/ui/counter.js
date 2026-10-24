// Pantalla del contador: comensales, piezas, gestos, deshacer, registro y desbloqueos.
import {S, save} from '../store.js';
import {CATS, PRICE_SLOTS} from '../catalog.js';
import {ui, UI, TIER_XP} from '../icons.js';
import {diner, me, typeById, tname, initial, money, hhmm, ctx, visibleTypes, hasAllergen, allCh, isDone, evalCh,
  missionsOf, mProg, mText, lifetime, ACH, TITLES, titleOk, level, sum, currentBuffet, priceNow, sessionSlot, nf0} from '../logic.js';
import {$, $$, esc, app, icon, Odo, openSheet, closeSheet, popMenu, enqueue, mIcon} from './common.js';
import {feedback, hud, flyTo, reduced, announce} from '../fx.js';
import {initHero, updateHero, hero, mascotEvent, resetHeroCache} from './hero.js';

const ODO = {};
let streakN = 0, lastAdd = 0;
export const undoStack = [];

/* ---------- Construcción de la cuadrícula ---------- */
function cardHTML(t) {
  const mark = S.settings.allergenMode === 'mark' && hasAllergen(t);
  return `<div class="pc zero${mark ? ' alg' : ''}" data-k="${t.id}" tabindex="0" role="button" aria-label="Sumar ${esc(t.name)}${mark ? '. Contiene alérgenos que has marcado' : ''}">
    <button class="pc-minus" aria-label="Quitar ${esc(t.name)}">${ui('minus')}</button>
    <span class="pc-ic">${icon(t.id)}</span><span class="pc-n"></span>
    <span class="pc-txt"><span class="pc-name">${esc(t.name)}</span><span class="pc-meta">${money(t.cost)} · ${t.kcal} kcal</span></span>
    ${t.fav ? `<svg viewBox="0 0 24 24" class="fav" aria-hidden="true">${UI.starf}</svg>` : ''}
    ${mark ? `<span class="algb" aria-hidden="true">${ui('warn')}</span>` : ''}
    <span class="pc-plus" aria-hidden="true">${ui('plus')}</span></div>`;
}
export function buildGrid() {
  const vis = visibleTypes(), favs = vis.filter(t => t.fav), groups = [];
  if (favs.length) groups.push({id:'fav', name:'Favoritas', short:'Favoritas', list:favs});
  CATS.forEach(c => { const l = vis.filter(t => t.cat === c.id); if (l.length) groups.push({...c, list:l}); });
  const lay = S.settings.layout;
  $('#cats').innerHTML = groups.map(g => `<section class="catsec" data-cat="${g.id}"><h2 class="cat-h"><i style="background:${g.plate || 'var(--gold)'}"></i>${g.name}<span>${g.list.length}</span></h2><div class="grid ${lay}">${g.list.map(cardHTML).join('')}</div></section>`).join('')
    || `<div class="card empty"><b>No hay piezas visibles</b>Actívalas en Ajustes › Piezas.</div>`;
  $('#pills').innerHTML = `<button class="pill on" data-go="top">Todo</button>` + groups.map(g => `<button class="pill" data-go="${g.id}">${g.short}</button>`).join('');
  for (const k in ODO) delete ODO[k];
  $$('.pc', $('#cats')).forEach(el => { (ODO[el.dataset.k] = ODO[el.dataset.k] || []).push(new Odo(el.querySelector('.pc-n'))); });
  updateCounter();
}
export function renderChips() {
  const remote = app.remoteDiners ? app.remoteDiners() : [];
  $('#chips').innerHTML = S.diners.map(d => {
    const n = S.session.log.filter(e => e.d === d.id).length;
    return `<button class="chip${d.id === S.active ? ' on' : ''}" role="tab" aria-selected="${d.id === S.active}" data-id="${d.id}" style="--c:${d.color}">
      <span class="av" style="--c:${d.color}">${esc(initial(d.name))}</span><span class="chip-n">${esc(d.name)}</span><span class="chip-c">${n}</span></button>`;
  }).join('') + remote.map(r => `<button class="chip remote" data-remote="${esc(r.key)}" style="--c:${r.color}" aria-label="${esc(r.name)} en otro móvil, ${r.total} piezas">
      <span class="av" style="--c:${r.color}">${esc(initial(r.name))}</span><span class="chip-n">${esc(r.name)}</span>${ui('cloud', 'chip-cl')}<span class="chip-c">${r.total}</span></button>`).join('')
    + `<button class="chip add" id="addDiner" aria-label="Añadir comensal">${ui('plus')}</button>`;
}

/* ---------- Actualización ---------- */
export function updateCounter() {
  const c = ctx(S.active), st = S.settings;
  const remote = app.remoteDiners ? app.remoteDiners() : [];
  const table = hero.mode === 'table' && (S.diners.length > 1 || remote.length > 0);
  const total = table ? S.session.log.length + remote.reduce((a, r) => a + r.total, 0) : c.total;
  const goal = table ? st.goal * (S.diners.length + remote.length) : st.goal;
  updateHero({c, table, total, goal, log: table ? S.session.log : c.log});
  for (const k in ODO) {
    const n = c.by[k] || 0;
    ODO[k].forEach(o => { o.set(n); o.el.closest('.pc').classList.toggle('zero', !n); });
  }
  renderBill(c);
  const b = currentBuffet(), slot = PRICE_SLOTS.find(s => s.id === sessionSlot());
  $('#buffetLine').innerHTML = `${esc(b.name)} · ${money(priceNow())}${S.session.priceOverride != null ? ' (ticket)' : ` · ${slot.name.toLowerCase()}`}${ui('chevD', 'bl-chev')}`;
  $('#btnUndo').disabled = !S.session.log.length && !undoStack.length;
  $('#btnFinish').disabled = !S.session.log.length;
  $$('.chip[data-id]').forEach(ch => { ch.querySelector('.chip-c').textContent = S.session.log.filter(e => e.d === ch.dataset.id).length; });
  renderMini();
  app.trialRender && app.trialRender();
}
export function renderBill(c) {
  const price = priceNow(), cost = c.cost, carta = c.carta, open = !!S.settings.billOpen;
  const lose = cost > price, margin = price - cost, avg = c.total ? cost / c.total : .2;
  const need = Math.max(0, Math.ceil(margin / Math.max(.01, avg)));
  $('#bill').classList.toggle('open', open);
  $('#bill').innerHTML = `<button class="bill-h" id="billToggle" aria-expanded="${open}">
      <span class="bill-hl"><span class="ctitle-t">La cuenta real</span><span class="bill-sum">${lose ? `<b class="g">Pierde ${money(cost - price)}</b>` : `Coste <b>${money(cost)}</b> de ${money(price)}`}</span></span>${ui('chevD', 'bill-chev')}</button>
    <div class="bbar${lose ? ' lose' : ''}"><i style="width:${price > 0 ? Math.min(100, cost / price * 100) : 0}%"></i><span class="bbar-carta" style="left:${price > 0 ? Math.min(100, carta / price * 100) : 0}%" title="Valor en carta"></span></div>
    <div class="bill-more">
      <div class="bill-3"><div><span>Pagas</span><b>${money(price)}</b></div><div class="c-cost"><span>Coste real</span><b>${money(cost)}</b></div><div class="c-carta"><span>Valor en carta</span><b>${money(carta)}</b></div></div>
      <p class="bill-t${lose ? ' lose' : ''}">${lose ? `<b>El restaurante pierde ${money(cost - price)} contigo.</b>` : `El restaurante gana <b>${money(margin)}</b> contigo en ingredientes.`}</p>
      <p class="bill-s">${lose ? 'Has superado lo que pagas solo en materia prima.' : c.total ? `A ${money(avg)} por pieza, te faltan unas ${need} para que pierda dinero.` : `Una pieza media le cuesta unos ${money(.2)}: necesitarías unas ${need}.`} La línea azul marca lo que valdría en carta.</p>
      <button class="link" id="billInfo">${ui('info')}Cómo se calcula</button>
    </div>`;
  $('#billToggle').onclick = () => { S.settings.billOpen = !open; save(); feedback('tick'); renderBill(ctx(S.active)); };
  $('#billInfo').onclick = () => app.billInfo();
}
export function renderMini() {
  const id = S.active, mm = missionsOf(id), done = mm.list.filter(m => m.done).length;
  $('#miniM').innerHTML = `<span class="mm-l"><span class="ctitle-t">${S.diners.length < 2 || diner(id).name.trim().toLowerCase() === 'tú' ? 'Tus misiones' : 'Misiones de ' + esc(diner(id).name)}</span><span class="mm-s">${done === 3 ? '¡Todas hechas!' : esc(mText(mm.list.find(m => !m.done) || mm.list[0]))}</span></span>
    <span class="mm-r">${mm.list.map(m => { const p = m.done ? 1 : mProg(m, id).p; return `<span class="mmr${m.done ? ' ok' : ''}" style="--p:${p}">${mIcon(m)}</span>`; }).join('')}</span>${ui('chev', 'chev')}`;
}

/* ---------- Acciones con deshacer ---------- */
function pushAction(a) { undoStack.push(a); if (undoStack.length > 100) undoStack.shift(); }
export function addN(k, n = 1, ev = null, who = S.active, opts = {}) {
  const now = Date.now();
  streakN = now - lastAdd < 4000 ? streakN + 1 : 0; lastAdd = now;
  if (!S.session.start) { S.session.start = now; app.sessionStarted && app.sessionStarted(); }
  const entries = [];
  for (let i = 0; i < n; i++) { const e = {t:now + i, d:who, k}; S.session.log.push(e); entries.push(e); }
  pushAction({kind:'add', entries});
  feedback('add', streakN);
  if (!opts.quiet) popFx(k, ev, n);
  save(); updateCounter(); mascotEvent('add');
  if (!opts.quiet) snack(k, `${n > 1 ? `+${n} · ` : ''}Añadido${S.diners.length > 1 ? ' a ' + diner(who).name : ''}`);
  announce(`${tname(k)}: ${ctx(who).by[k] || 0}`);
  checkAll(who);
  app.sharePush && app.sharePush();
  if (!S.settings.hintSwipe && S.session.log.length === 4) { S.settings.hintSwipe = true; save(); setTimeout(() => hud('Consejo: desliza una pieza → para sumar varias'), 1200); }
}
export function removeEntries(pred, max = Infinity, label) {
  const removed = [];
  for (let i = S.session.log.length - 1; i >= 0 && removed.length < max; i--) if (pred(S.session.log[i])) removed.push(S.session.log.splice(i, 1)[0]);
  if (!removed.length) return 0;
  if (!S.session.log.length) S.session.start = null;
  pushAction({kind:'remove', entries:removed});
  feedback('remove'); save(); updateCounter(); mascotEvent('remove');
  snack(removed[0].k, label || `Quitado${removed.length > 1 ? ` ×${removed.length}` : ''}`);
  app.sharePush && app.sharePush();
  return removed.length;
}
export const removeOne = k => removeEntries(e => e.d === S.active && e.k === k, 1);
export function undo() {
  let a = undoStack.pop();
  if (!a) { const e = S.session.log[S.session.log.length - 1]; if (!e) return; a = {kind:'add', entries:[e]}; }
  if (a.kind === 'add') { const set = new Set(a.entries); S.session.log = S.session.log.filter(e => !set.has(e)); }
  else { S.session.log.push(...a.entries); S.session.log.sort((x, y) => x.t - y.t); }
  S.session.start = S.session.log.length ? Math.min(S.session.start || Infinity, S.session.log[0].t) : null;
  feedback('remove'); save(); updateCounter();
  const n = a.entries.length;
  snack(a.entries[0].k, a.kind === 'add' ? `Deshecho · quitado${n > 1 ? ` ×${n}` : ''}` : `Deshecho · recuperado${n > 1 ? ` ×${n}` : ''}`, false);
  if (app.cur === 'ch') app.renderRetos();
  app.sharePush && app.sharePush();
}
let snackT;
function snack(k, sub, withUndo = true) {
  const s = $('#snack'), n = ctx(S.active).by[k] || 0;
  s.innerHTML = `${icon(k)}<span class="snack-t"><b>${esc(tname(k))} · ${n}</b><span>${esc(sub)}</span></span>${withUndo ? `<button class="snack-b" id="snackUndo">${ui('undo')}Deshacer</button>` : ''}`;
  s.classList.add('show');
  const b = $('#snackUndo'); if (b) b.onclick = undo;
  clearTimeout(snackT); snackT = setTimeout(() => s.classList.remove('show'), withUndo ? 3800 : 1800);
}
function popFx(k, ev, n = 1) {
  const cards = $$(`.pc[data-k="${k}"]`); if (!cards.length) return;
  const card = (ev && ev.target && ev.target.closest && ev.target.closest('.pc')) || cards[cards.length - 1];
  const ic = card.querySelector('.pc-ic');
  const target = $('#ringBtn').getBoundingClientRect().bottom > 60 ? $('#ringBtn') : $(`.chip[data-id="${S.active}"] .av`) || $('.nav-in');
  flyTo(ic, icon(k), target).then(() => { const rb = $('#ringBtn'); rb.classList.remove('bump'); void rb.offsetWidth; rb.classList.add('bump'); });
  if (reduced()) return;
  ic.animate([{transform:'none'}, {transform:'translateY(-9px) scale(1.15) rotate(-7deg)', offset:.35}, {transform:'translateY(1px) scale(.96) rotate(2deg)', offset:.7}, {transform:'none'}], {duration:520, easing:'cubic-bezier(.3,.7,.3,1)'});
  const r = card.getBoundingClientRect(), pointer = ev && ev.detail !== 0 && ev.clientX;
  const x = pointer ? ev.clientX - r.left : r.width / 2, y = pointer ? ev.clientY - r.top : r.height / 2;
  const rip = document.createElement('span'); rip.className = 'rip'; rip.style.left = x + 'px'; rip.style.top = y + 'px'; card.appendChild(rip);
  rip.animate([{transform:'scale(0)', opacity:.2}, {transform:'scale(1.4)', opacity:0}], {duration:600, easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish = () => rip.remove();
  const p = document.createElement('span'); p.className = 'plus1'; p.textContent = '+' + n; p.style.left = x + 'px'; p.style.top = y + 'px'; card.appendChild(p);
  p.animate([{transform:'translate(0,0) scale(.6)', opacity:0}, {transform:'translate(0,-22px) scale(1.15)', opacity:1, offset:.3}, {transform:`translate(${(Math.random() - .5) * 20}px,-58px) scale(1)`, opacity:0}], {duration:750, easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish = () => p.remove();
}

/* ---------- Desbloqueos ---------- */
export function checkAll(id) {
  if (!S.session.log.length) return;
  const got = [], isMe = id === me().id;
  const titlesBefore = isMe ? TITLES.filter(t => titleOk(t, lifetime())).map(t => t.id) : [];
  for (const ch of allCh()) {
    if (isDone(id, ch.id)) continue;
    if (evalCh(ch, id).p >= 1) { (S.session.done[id] = S.session.done[id] || []).push(ch.id); got.push(ch); enqueue({kind:'Desafío completado', item:ch, who:id}); if (isMe) addXP(TIER_XP[ch.tier]); }
  }
  const mm = missionsOf(id);
  for (const m of mm.list) if (!m.done && mProg(m, id).p >= 1) { m.done = true; got.push(m); enqueue({kind:'Misión cumplida', mission:m, who:id}); if (isMe) addXP(m.xp); }
  if (isMe) {
    const L = lifetime();
    for (const a of ACH) {
      if (S.ach[a.id]) continue;
      const [c0, mx] = a.f(L); if (mx > 0 && c0 >= mx) { S.ach[a.id] = Date.now(); got.push(a); enqueue({kind:'Logro desbloqueado', item:a, who:id}); addXP(TIER_XP[a.tier]); }
    }
    TITLES.filter(t => !titlesBefore.includes(t.id) && titleOk(t, L) && t.id !== 'novato').forEach(t => { got.push(t); enqueue({kind:'Nuevo título', item:{t:t.t, d:typeof t.d === 'function' ? t.d() : t.d, tier:'gold', g:{p:'crown'}}, who:id}); });
    const prevBest = Math.max(0, ...S.history.filter(h => !h.ex).map(h => { const d = h.diners.find(x => x.me) || h.diners[0]; return d ? sum(d.counts) : 0; }));
    const n = ctx(id).total;
    if (prevBest >= 10 && n > prevBest && !S.session.record) { S.session.record = true; got.push({id:'rec'}); enqueue({kind:'Nuevo récord personal', item:{t:`${n} piezas`, d:`Superas tu mejor marca de ${prevBest}`, tier:'gold', g:{p:'trend'}}, who:id}); }
  }
  kcalAlert(id);
  if (ctx(id).total === S.settings.goal) mascotEvent('full');
  app.trialCheck && app.trialCheck();
  if (!got.length) return;
  mascotEvent('unlock');
  save(); app.unseen = (app.unseen || 0) + got.length; app.updateBadge && app.updateBadge();
  if (app.cur === 'ch') app.renderRetos(got.map(x => x.id));
  renderMini();
}
export function addXP(n) {
  const before = level().l; S.xp += n; const after = level();
  if (after.l > before) enqueue({kind:`Nivel ${after.l}`, item:{t:after.rank, d:'Has subido de nivel', tier:'accent', g:{txt:String(after.l)}}, who:me().id, fx:'fireworks', snd:'level'});
}
function kcalAlert(id) {
  if (!S.settings.kcalAlert) return;
  const k = ctx(id).kcal, lim = S.settings.kcalLimit, w = S.session.kcalWarned = typeof S.session.kcalWarned === 'object' && S.session.kcalWarned ? S.session.kcalWarned : {};
  const lvl = k >= lim ? 2 : k >= lim * .8 ? 1 : 0;
  if (lvl > (w[id] || 0)) {
    w[id] = lvl; save();
    if (lvl === 1) hud(`${diner(id).name}: llevas el 80 % de tu límite de ${nf0(lim)} kcal`);
    else enqueue({kind:'Aviso de calorías', item:{t:`${nf0(k)} kcal`, d:`Has superado tu límite de ${nf0(lim)} kcal`, tier:'accent', g:{p:'flame'}}, who:id, fx:'rice', snd:'tick'});
  }
}

/* ---------- Gestos sobre las piezas ---------- */
export function initCards() {
  const box = $('#cats'); let g = null, fired = false, badge = null;
  const showBadge = (card, n) => {
    if (!badge) { badge = document.createElement('div'); badge.className = 'swb glass'; document.body.appendChild(badge); }
    const r = card.getBoundingClientRect();
    badge.textContent = n > 0 ? `+${n}` : n < 0 ? '−1' : '';
    badge.className = 'swb glass' + (n > 0 ? ' add' : n < 0 ? ' rem' : '') + (n ? ' show' : '');
    badge.style.left = r.left + r.width / 2 + 'px'; badge.style.top = r.top - 6 + 'px';
  };
  box.addEventListener('pointerdown', e => {
    const c = e.target.closest('.pc'); if (!c || e.target.closest('.pc-minus')) return;
    fired = false; g = {c, x:e.clientX, y:e.clientY, mode:null, n:0, id:e.pointerId};
    g.lp = setTimeout(() => { if (!g || g.mode) return; fired = true; g.mode = 'long'; c.classList.add('lift'); setTimeout(() => { c.classList.remove('lift'); openCtx(c); }, 140); }, 430);
  });
  box.addEventListener('pointermove', e => {
    if (!g || g.mode === 'long') return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.mode) {
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) { g.mode = 'swipe'; clearTimeout(g.lp); try { g.c.setPointerCapture(g.id); } catch (er) {} g.c.classList.add('swiping'); }
      else if (Math.abs(dy) > 10) { clearTimeout(g.lp); g = null; return; }
      else return;
    }
    const n = dx > 0 ? 1 + Math.min(3, Math.floor(dx / 55)) : dx < -45 ? -1 : 0;
    if (n !== g.n) { g.n = n; feedback('tick'); }
    g.c.style.transform = `translateX(${Math.max(-60, Math.min(90, dx * .35))}px) rotate(${dx * .02}deg)`;
    showBadge(g.c, n);
  });
  const end = () => {
    if (!g) return; clearTimeout(g.lp);
    const cur = g; g = null;
    if (cur.mode === 'swipe') {
      fired = true; cur.c.classList.remove('swiping'); cur.c.style.transform = '';
      if (badge) badge.classList.remove('show');
      const k = cur.c.dataset.k;
      if (cur.n > 0) addN(k, cur.n, null); else if (cur.n < 0) removeOne(k);
    }
  };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
  box.addEventListener('contextmenu', e => { const c = e.target.closest('.pc'); if (!c) return; e.preventDefault(); if (!fired) { fired = true; openCtx(c); } });
  box.addEventListener('click', e => {
    if (fired) { fired = false; return; }
    const m = e.target.closest('.pc-minus'); if (m) { e.stopPropagation(); removeOne(m.closest('.pc').dataset.k); return; }
    const c = e.target.closest('.pc'); if (c) addN(c.dataset.k, 1, e);
  });
  box.addEventListener('keydown', e => {
    const c = e.target.closest('.pc'); if (!c || e.target !== c) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addN(c.dataset.k); }
    if (e.key === 'Backspace' || e.key === '-' || e.key === 'Delete') { e.preventDefault(); removeOne(c.dataset.k); }
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { e.preventDefault(); openCtx(c); }
  });
}
function openCtx(card) {
  const k = card.dataset.k, t = typeById(k), n = ctx(S.active).by[k] || 0, r = card.getBoundingClientRect();
  feedback('long');
  const wrap = document.createElement('div'); wrap.className = 'ctx-prevwrap grid ' + S.settings.layout;
  const pv = card.cloneNode(true); pv.classList.add('ctx-prev'); pv.removeAttribute('tabindex'); pv.classList.remove('lift');
  Object.assign(pv.style, {left:r.left + 'px', top:r.top + 'px', width:r.width + 'px', height:r.height + 'px'});
  wrap.appendChild(pv); requestAnimationFrame(() => { pv.style.transform = 'scale(1.06)'; });
  popMenu(r, [
    {l:'Sumar 1', i:'plus', fn:() => addN(k, 1)},
    {l:'Sumar 2', i:'plus2', fn:() => addN(k, 2)},
    {l:'Sumar 4', i:'plus4', sub:'Una ración típica', fn:() => addN(k, 4)},
    {l:'Quitar 1', i:'minus', dis:!n, fn:() => removeOne(k)},
    {l:`Quitar todas${n ? ` (${n})` : ''}`, i:'trash', red:true, dis:!n, fn:() => removeEntries(e => e.d === S.active && e.k === k)},
    'sep',
    {l:t.fav ? 'Quitar de favoritas' : 'Añadir a favoritas', i:t.fav ? 'starf' : 'star', fn:() => { t.fav = !t.fav; save(); buildGrid(); hud(t.fav ? 'Añadida a favoritas' : 'Quitada de favoritas'); }},
    {l:'Detalles y editar', i:'pencil', sub:'Coste, alérgenos y nutrición', fn:() => app.typeSheet(k)},
  ], {extra:wrap, blur:true});
}

/* ---------- Registro con deslizar para borrar ---------- */
export function logSheet() {
  const draw = el => {
    const L = [...S.session.log].reverse();
    $('#logList', el).innerHTML = L.length ? L.map(e => {
      const d = diner(e.d);
      return `<div class="sw-row" data-t="${e.t}" data-k="${e.k}" data-d="${e.d}"><button class="sw-del" tabindex="-1">Eliminar</button><div class="sw-c">${icon(e.k)}
        <span class="row-main"><span class="row-t">${esc(tname(e.k))}</span><span class="row-d" style="display:flex;align-items:center;gap:6px">${S.diners.length > 1 ? `<span class="av sm" style="--c:${d.color}">${esc(initial(d.name))}</span>${esc(d.name)} · ` : ''}${money(typeById(e.k)?.cost || 0)}</span></span>
        <span class="sw-t">${hhmm(e.t)}</span><button class="sw-x" aria-label="Eliminar ${esc(tname(e.k))}">${ui('x')}</button></div></div>`;
    }).join('') : `<div class="empty"><b>Aún no hay nada</b>Cada pieza que sumes aparecerá aquí con su hora.</div>`;
    $('#logCount', el).textContent = L.length ? `${L.length} ${L.length === 1 ? 'entrada' : 'entradas'}. Desliza a la izquierda o toca la X para eliminar.` : '';
  };
  openSheet({title:'Registro', cancel:'Cerrar', body:`<p class="gfoot" id="logCount" style="margin:0 4px"></p><div class="group" id="logList"></div>`,
    mount(el) {
      draw(el);
      const del = row => {
        const t = +row.dataset.t, k = row.dataset.k, d = row.dataset.d;
        row.style.transition = 'height .35s cubic-bezier(.32,.72,0,1),opacity .25s'; row.style.height = row.offsetHeight + 'px'; void row.offsetHeight; row.style.height = '0px'; row.style.opacity = '0';
        setTimeout(() => { removeEntries(e => e.t === t && e.k === k && e.d === d, 1, 'Eliminado del registro'); draw(el); }, 300);
      };
      const list = $('#logList', el); let drag = null;
      list.addEventListener('click', e => { const r = e.target.closest('.sw-row'); if (r && (e.target.closest('.sw-x') || e.target.closest('.sw-del'))) del(r); });
      list.addEventListener('pointerdown', e => {
        const r = e.target.closest('.sw-row'); if (!r || e.target.closest('button')) return;
        $$('.sw-c', list).forEach(c => { if (c.parentNode !== r) c.style.transform = ''; });
        const c = $('.sw-c', r), base = parseFloat((c.style.transform.match(/-?[\d.]+/) || [0])[0]);
        drag = {r, c, x0:e.clientX, y0:e.clientY, base, dx:base, on:false, id:e.pointerId};
      });
      list.addEventListener('pointermove', e => {
        if (!drag) return; const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
        if (!drag.on) { if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { drag.on = true; drag.c.classList.add('drag'); try { list.setPointerCapture(drag.id); } catch (er) {} } else if (Math.abs(dy) > 8) { drag = null; return; } else return; }
        drag.dx = Math.min(0, drag.base + dx); drag.c.style.transform = `translateX(${drag.dx}px)`;
      });
      const end = () => {
        if (!drag) return; const {r, c, dx, on} = drag; drag = null; if (!on) return;
        c.classList.remove('drag');
        if (dx < -r.offsetWidth * .5) { c.style.transform = `translateX(${-r.offsetWidth}px)`; del(r); }
        else c.style.transform = dx < -50 ? 'translateX(-96px)' : '';
      };
      list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);
    }});
}

/* ---------- Comensales ---------- */
export function initChips() {
  const box = $('#chips'); let lp, fired = false;
  box.addEventListener('pointerdown', e => { const c = e.target.closest('.chip[data-id]'); if (!c) return; fired = false; lp = setTimeout(() => { fired = true; feedback('long'); app.dinerSheet(c.dataset.id); }, 520); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => box.addEventListener(ev, () => clearTimeout(lp)));
  box.addEventListener('scroll', () => clearTimeout(lp), {passive:true});
  box.addEventListener('contextmenu', e => e.preventDefault());
  box.addEventListener('click', e => {
    if (fired) { fired = false; return; }
    if (e.target.closest('#addDiner')) return app.dinerSheet();
    const rm = e.target.closest('.chip[data-remote]'); if (rm) return app.remoteSheet && app.remoteSheet(rm.dataset.remote);
    const c = e.target.closest('.chip[data-id]'); if (!c || c.dataset.id === S.active) return;
    S.active = c.dataset.id; save(); feedback('tick');
    $$('.chip[data-id]', box).forEach(x => { const on = x === c; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
    resetHeroCache(); updateCounter();
  });
}
export {initHero};
