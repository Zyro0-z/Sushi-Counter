// Juegos: ruleta de sushi, duelo en directo a pantalla partida y contrarreloj.
import {S, save} from '../store.js';
import {CATS} from '../catalog.js';
import {ui, illu, lighten} from '../icons.js';
import {diner, initial, tname, visibleTypes, lifetime, ctx, clock, typeById} from '../logic.js';
import {$, $$, esc, app, icon, iconRaw, openSheet, closeSheet, seg, bindSeg, stepper, bindStepper, enqueue} from './common.js';
import {feedback, hud, celebrate, sound, reduced, announce} from '../fx.js';
import {addN, removeEntries} from './counter.js';
import {say} from './hero.js';
import {howBlock} from './hub.js';

/* ---------- Ruleta ---------- */
function wheelChoices() {
  const L = lifetime(), c = ctx(S.active), vis = visibleTypes();
  const w = t => (L.types.has(t.id) ? 1 : 3) * (c.by[t.id] ? 1 : 2);
  const pool = vis.map(t => ({t, w:w(t)})), out = [];
  while (out.length < Math.min(8, vis.length) && pool.length) {
    const tot = pool.reduce((a, p) => a + p.w, 0); let r = Math.random() * tot, i = 0;
    while (r > pool[i].w) { r -= pool[i].w; i++; }
    out.push(pool.splice(i, 1)[0].t);
  }
  return out;
}
export function roulette() {
  const list = wheelChoices(); if (list.length < 2) { hud('Activa más piezas para usar la ruleta'); return; }
  const n = list.length, segA = 360 / n, R = 130;
  const arc = i => { const a0 = (i * segA - 90) * Math.PI / 180, a1 = ((i + 1) * segA - 90) * Math.PI / 180; return `M150 150 L${150 + R * Math.cos(a0)} ${150 + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${150 + R * Math.cos(a1)} ${150 + R * Math.sin(a1)}Z`; };
  const cols = list.map(t => (CATS.find(c => c.id === t.cat) || CATS[0]).plate);
  const wheel = `<svg viewBox="0 0 300 300" class="wheel" id="wheel" aria-hidden="true">
    <circle cx="150" cy="150" r="140" class="wh-rim"/>
    ${list.map((t, i) => `<path d="${arc(i)}" fill="${i % 2 ? lighten(cols[i], .55) : lighten(cols[i], .3)}" stroke="#fff" stroke-width="2"/>`).join('')}
    ${list.map((t, i) => { const a = (i + .5) * segA - 90, rad = a * Math.PI / 180, x = 150 + 88 * Math.cos(rad), y = 150 + 88 * Math.sin(rad); return `<g transform="translate(${x} ${y}) rotate(${a + 90}) translate(-22 -22)"><svg width="44" height="44" viewBox="0 0 48 48">${iconRaw(t.id)}</svg></g>`; }).join('')}
    <circle cx="150" cy="150" r="26" class="wh-hub"/>
    ${Array.from({length:n}, (_, i) => { const a = (i * segA - 90) * Math.PI / 180; return `<circle cx="${150 + 134 * Math.cos(a)}" cy="${150 + 134 * Math.sin(a)}" r="4" class="wh-peg"/>`; }).join('')}
  </svg>`;
  S.stats.roulette++; save();
  openSheet({title:'Ruleta de sushi', cancel:'Cerrar', body:`
    ${howBlock('ruleta')}
    <div class="wheel-wrap"><div class="wh-ptr" aria-hidden="true"></div>${wheel}<button class="wh-btn" id="spin">Girar</button></div>
    <div class="wh-res" id="whRes" aria-live="polite"></div>`,
    mount(el) {
      let rot = 0, spinning = false;
      const wh = $('#wheel', el);
      const spin = () => {
        if (spinning) return; spinning = true; feedback('tick');
        const i = Math.floor(Math.random() * n), jitter = (Math.random() - .5) * segA * .6;
        rot += 360 * 5 + (360 - ((i + .5) * segA + (rot % 360))) + jitter;
        const dur = reduced() ? 300 : 4200;
        wh.style.transition = `transform ${dur}ms cubic-bezier(.12,.8,.18,1)`; wh.style.transform = `rotate(${rot}deg)`;
        let last = -1; const t0 = performance.now();
        const tick = () => {
          const m = getComputedStyle(wh).transform; if (m && m !== 'none') { const [a, b] = m.slice(7, -1).split(',').map(parseFloat); const ang = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360; const s = Math.floor(ang / segA); if (s !== last) { last = s; sound('roulette'); } }
          if (performance.now() - t0 < dur) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        setTimeout(() => {
          spinning = false; const t = list[i]; S.session.roulette = t.id; save();
          feedback('mission'); celebrate('rice', 40);
          $('#whRes', el).innerHTML = `<div class="wh-card card">${icon(t.id)}<span class="row-main"><span class="eyebrow">La ruleta dice</span><span class="row-t" style="font-size:20px">${esc(t.name)}</span></span></div>
            <button class="btn" id="whAdd">${ui('plus')}Añadir ahora</button><button class="btn plain" id="whAgain">${ui('wheel')}Girar otra vez</button>`;
          announce('La ruleta dice: ' + t.name);
          $('#whAdd', el).onclick = () => { S.stats.rouletteEaten++; save(); closeSheet(); setTimeout(() => { addN(t.id, 1); say('¡Bien elegido!', 'happy', 2000); }, 300); };
          $('#whAgain', el).onclick = spin;
        }, dur + 60);
      };
      $('#spin', el).onclick = spin;
    }});
}

/* ---------- Duelo en directo ---------- */
let duel = null;
function quickFor(id) {
  const c = ctx(id), seen = Object.entries(c.by).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const favs = S.types.filter(t => t.fav && t.on && !t.deleted).map(t => t.id);
  const base = ['nigiri', 'uramaki', 'sashimi', 'maki', 'gyoza', 'california', 'tempura', 'pollo_teriyaki'];
  return [...new Set([...seen, ...favs, ...base])].filter(k => typeById(k) && typeById(k).on && !typeById(k).deleted).slice(0, 6);
}
export function duelSetup() {
  if (S.diners.length < 2) {
    openSheet({title:'Duelo', cancel:'Cerrar', body:`<div class="sh-hero">${illu('duelo', 'hero-illu')}<h4>Hacen falta dos</h4><p>Añade a otra persona de la mesa para jugar un duelo en este móvil.</p></div>${howBlock('duelo')}<button class="btn" id="dAdd">${ui('plus')}Añadir comensal</button>`,
      mount(el) { $('#dAdd', el).onclick = () => app.dinerSheet(); }});
    return;
  }
  let a = S.diners[0].id, b = S.diners[1].id, mins = 5;
  const pick = (name, sel) => `<div class="picks" data-pick="${name}">${S.diners.map(d => `<button class="pick dp${d.id === sel ? ' on' : ''}" data-id="${d.id}"><span class="av md" style="--c:${d.color}">${esc(initial(d.name))}</span>${esc(d.name)}</button>`).join('')}</div>`;
  openSheet({title:'Duelo en directo', ok:'Empezar', body:`
    <div class="sh-hero">${illu('duelo', 'hero-illu')}<p>Pantalla partida: dejad el móvil en medio de la mesa y gana quien más coma antes de que acabe el tiempo.</p></div>
    ${howBlock('duelo')}
    <div class="gsec"><div class="glabel">Lado de abajo</div>${pick('a', a)}</div>
    <div class="gsec"><div class="glabel">Lado de arriba</div>${pick('b', b)}</div>
    <div class="gsec"><div class="glabel">Duración</div><div class="group"><div class="row">${seg('dmins', [['3', '3 min'], ['5', '5 min'], ['10', '10 min'], ['15', '15 min']], '5')}</div></div></div>`,
    mount(el) {
      el.addEventListener('click', e => {
        const p = e.target.closest('.dp'); if (!p) return; const box = p.closest('[data-pick]'); const side = box.dataset.pick;
        if (side === 'a') { if (p.dataset.id === b) return hud('Elige a dos personas distintas'); a = p.dataset.id; } else { if (p.dataset.id === a) return hud('Elige a dos personas distintas'); b = p.dataset.id; }
        $$('.dp', box).forEach(x => x.classList.toggle('on', x === p)); feedback('tick');
      });
      bindSeg(el, 'dmins', v => { mins = +v; });
    },
    onOk() { setTimeout(() => startDuel(a, b, mins), 350); }});
}
function startDuel(a, b, mins) {
  const ov = document.createElement('div'); ov.className = 'duel-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Duelo en directo');
  const half = (id, top) => { const d = diner(id); return `<section class="dh${top ? ' top' : ''}" data-id="${id}" style="--c:${d.color}">
    <div class="dh-head"><span class="av md" style="--c:#fff;color:${d.color}">${esc(initial(d.name))}</span><b>${esc(d.name)}</b><button class="dh-undo" aria-label="Deshacer de ${esc(d.name)}">${ui('undo')}</button></div>
    <div class="dh-score num" data-score="${id}">0</div>
    <div class="dh-q">${quickFor(id).map(k => `<button class="dq" data-k="${k}" aria-label="Sumar ${esc(tname(k))}">${icon(k)}</button>`).join('')}</div></section>`; };
  ov.innerHTML = `${half(b, true)}<div class="d-mid"><button class="d-x" aria-label="Terminar duelo">${ui('x')}</button><span class="d-time num" id="dTime">${clock(mins * 60000)}</span><span class="d-vs">VS</span></div>${half(a, false)}
    <div class="d-count" id="dCount"></div>`;
  document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add('show'));
  duel = {a, b, mins, start:0, end:0, base:{[a]:ctx(a).total, [b]:ctx(b).total}, ov, timer:0, done:false};
  ov.addEventListener('click', e => {
    if (e.target.closest('.d-x')) { endDuel(true); return; }
    if (!duel.start || duel.done) return;
    const q = e.target.closest('.dq');
    if (q) { const id = q.closest('.dh').dataset.id; addN(q.dataset.k, 1, null, id, {quiet:true}); bumpScore(id, q); return; }
    const u = e.target.closest('.dh-undo');
    if (u) { const id = u.closest('.dh').dataset.id; removeEntries(e2 => e2.d === id && e2.t >= duel.start, 1); paintScores(); }
  });
  // Cuenta atrás 3, 2, 1
  const cnt = $('#dCount', ov); let n = 3;
  const step = () => {
    if (n > 0) { cnt.textContent = n; cnt.className = 'd-count pop'; void cnt.offsetWidth; cnt.className = 'd-count pop go'; sound('taiko'); n--; setTimeout(step, 800); }
    else { cnt.textContent = '¡Ya!'; cnt.className = 'd-count pop'; void cnt.offsetWidth; cnt.className = 'd-count pop go'; sound('go'); setTimeout(() => cnt.classList.add('gone'), 600);
      duel.start = Date.now(); duel.end = duel.start + mins * 60000; duel.timer = setInterval(tickDuel, 250); }
  };
  setTimeout(step, 350);
}
function scoreOf(id) { return ctx(id).log.filter(e => e.t >= duel.start).length; }
function paintScores() { [duel.a, duel.b].forEach(id => { const el = $(`[data-score="${id}"]`, duel.ov); if (el) el.textContent = scoreOf(id); }); const sa = scoreOf(duel.a), sb = scoreOf(duel.b); $$('.dh', duel.ov).forEach(h => h.classList.toggle('lead', (h.dataset.id === duel.a && sa > sb) || (h.dataset.id === duel.b && sb > sa))); }
function bumpScore(id, btn) {
  paintScores();
  const el = $(`[data-score="${id}"]`, duel.ov); if (!reduced()) el.animate([{transform:'scale(1)'}, {transform:'scale(1.18)'}, {transform:'scale(1)'}], {duration:300, easing:'cubic-bezier(.34,1.56,.64,1)'});
  if (!reduced()) btn.animate([{transform:'scale(1)'}, {transform:'scale(.85)'}, {transform:'scale(1)'}], {duration:220});
}
function tickDuel() {
  if (!duel || duel.done) return;
  const left = duel.end - Date.now(), t = $('#dTime', duel.ov);
  t.textContent = clock(Math.max(0, left + 999));
  const s = Math.ceil(left / 1000);
  if (s <= 10 && s > 0 && s !== duel.lastS) { duel.lastS = s; sound('tick'); t.classList.add('hurry'); }
  if (left <= 0) endDuel(false);
}
function endDuel(abort) {
  if (!duel) return; clearInterval(duel.timer);
  if (abort || !duel.start) { duel.ov.classList.remove('show'); const o = duel.ov; setTimeout(() => o.remove(), 400); duel = null; app.updateCounter(); return; }
  duel.done = true;
  const sa = scoreOf(duel.a), sb = scoreOf(duel.b), da = diner(duel.a), db = diner(duel.b);
  const w = sa === sb ? null : sa > sb ? da : db;
  S.duels.push({date:Date.now(), mins:duel.mins, a:{name:da.name, color:da.color, n:sa}, b:{name:db.name, color:db.color, n:sb}, winner:w ? w.name : null, winnerColor:w ? w.color : null});
  save();
  feedback('win'); celebrate(w ? 'fireworks' : 'confetti');
  const res = document.createElement('div'); res.className = 'd-res glass';
  res.innerHTML = `<span class="eyebrow">¡Tiempo!</span><h3>${w ? `Gana ${esc(w.name)}` : 'Empate'}</h3><p class="num">${esc(da.name)} ${sa} · ${sb} ${esc(db.name)}</p>
    <button class="btn" id="dAgain">${ui('swords')}Revancha</button><button class="btn plain" id="dClose">Cerrar</button>`;
  duel.ov.appendChild(res); announce(w ? `Gana ${w.name}` : 'Empate');
  const {a, b, mins, ov} = duel;
  $('#dAgain', res).onclick = () => { ov.remove(); duel = null; startDuel(a, b, mins); };
  $('#dClose', res).onclick = () => { ov.classList.remove('show'); setTimeout(() => ov.remove(), 400); duel = null; app.updateCounter(); app.checkAll(S.diners[0].id); };
}

/* ---------- Contrarreloj ---------- */
const PRESETS = [[10, 5], [15, 10], [25, 15], [40, 30]];
export function trialSetup() {
  if (S.session.trial) { hud('Ya hay una contrarreloj en marcha'); return; }
  let n = 15, mins = 10;
  openSheet({title:'Contrarreloj', ok:'Empezar', body:`
    <div class="sh-hero">${illu('reloj', 'hero-illu')}<p>El reloj empieza en cuanto toques Empezar y cuenta las piezas de ${esc(diner(S.active).name)}.</p></div>
    ${howBlock('reloj')}
    <div class="group" id="trPre">${PRESETS.map(([pn, pm], i) => `<button class="row${i === 1 ? ' sel' : ''}" data-n="${pn}" data-m="${pm}"><span class="row-l"><b class="num">${pn}</b> piezas en <b class="num">${pm}</b> minutos</span>${i === 1 ? ui('check', 'chk') : ''}</button>`).join('')}</div>
    <div class="gsec"><div class="glabel">A tu medida</div><div class="group">
      <div class="row"><span class="row-l">Piezas</span><span class="row-v num" id="trN">${n}</span>${stepper('tr-n')}</div>
      <div class="row"><span class="row-l">Minutos</span><span class="row-v num" id="trM">${mins}</span>${stepper('tr-m')}</div></div></div>`,
    mount(el) {
      const paint = () => { $('#trN', el).textContent = n; $('#trM', el).textContent = mins; $$('#trPre .row', el).forEach(r => { const on = +r.dataset.n === n && +r.dataset.m === mins; r.classList.toggle('sel', on); const c = r.querySelector('.chk'); if (on && !c) r.insertAdjacentHTML('beforeend', ui('check', 'chk')); if (!on && c) c.remove(); }); };
      $('#trPre', el).addEventListener('click', e => { const r = e.target.closest('[data-n]'); if (!r) return; n = +r.dataset.n; mins = +r.dataset.m; feedback('tick'); paint(); });
      bindStepper(el, 'tr-n', d => { n = Math.max(3, Math.min(200, n + d)); paint(); });
      bindStepper(el, 'tr-m', d => { mins = Math.max(1, Math.min(90, mins + d)); paint(); });
    },
    onOk() {
      S.session.trial = {start:Date.now(), n, mins, who:S.active}; save(); sound('go'); trialRender();
      say(`¡${n} en ${mins} minutos! A por ello`, 'happy', 2600); hud('Contrarreloj en marcha');
    }});
}
export function trialRender() {
  const tr = S.session.trial, bar = $('#trialbar');
  document.body.classList.toggle('trial', !!tr);
  if (!tr) { bar.classList.remove('show'); return; }
  const got = ctx(tr.who).log.filter(e => e.t >= tr.start).length, left = tr.start + tr.mins * 60000 - Date.now(), p = Math.min(1, got / tr.n);
  bar.innerHTML = `<span class="tb-ring" style="--p:${p}">${ui('timer')}</span><span class="num tb-time${left < 60000 ? ' hurry' : ''}">${clock(Math.max(0, left + 999))}</span><span class="tb-sep"></span><span class="num"><b>${got}</b>/${tr.n}</span><button class="tb-x" aria-label="Cancelar contrarreloj">${ui('x')}</button>`;
  bar.classList.add('show');
  $('.tb-x', bar).onclick = () => { S.session.trial = null; save(); trialRender(); hud('Contrarreloj cancelada'); };
}
export function trialCheck() {
  const tr = S.session.trial; if (!tr) return;
  const got = ctx(tr.who).log.filter(e => e.t >= tr.start).length, left = tr.start + tr.mins * 60000 - Date.now();
  if (got >= tr.n) {
    S.trials.push({date:Date.now(), n:tr.n, mins:tr.mins, ok:true, secs:Math.round((Date.now() - tr.start) / 1000)}); S.session.trial = null; save();
    enqueue({kind:'Contrarreloj superada', item:{t:`${tr.n} piezas en ${clock(Date.now() - tr.start)}`, d:`Reto de ${tr.mins} minutos`, tier:'gold', g:{p:'timer'}}, who:tr.who, fx:'sakura', snd:'level'});
    trialRender(); app.checkAll(S.diners[0].id);
  } else if (left <= 0) {
    S.trials.push({date:Date.now(), n:tr.n, mins:tr.mins, ok:false, got}); S.session.trial = null; save();
    hud(`Se acabó el tiempo: ${got} de ${tr.n}. ¡Casi!`); say('¡La próxima es tuya!', 'idle', 2600); trialRender();
  } else trialRender();
}
