// Pestaña de retos: nivel, misiones, desafíos, logros, perfil con títulos, rachas y ranking.
import {S, save} from '../store.js';
import {medal, ui, TIER_XP, TIER_NAME, GLYPH} from '../icons.js';
import {diner, me, initial, allCh, evalCh, isDone, chById, descOf, customDef, missionsOf, newMissions, mText, mProg,
  lifetime, ACH, TITLES, titleOk, activeTitle, level, streakInfo, tableRanking, tname, sortTypes} from '../logic.js';
import {$, $$, esc, app, icon, openSheet, closeSheet, twoStep, stepper, bindStepper, m3d, enableTilt, mIcon} from './common.js';
import {feedback, hud} from '../fx.js';

let seg = 'mis';
export function setRetoSeg(s) { seg = s; }

export function renderRetos(fresh = []) {
  const id = S.active, d = diner(id), lv = level(), tt = activeTitle();
  const head = `<div><h1 class="lt">Retos</h1><p class="lt-sub">${S.diners.length < 2 || d.name.toLowerCase() === 'tú' ? 'Tu progreso' : 'Progreso de ' + esc(d.name)} en esta sesión</p></div>
    <button class="lvl card" id="lvlCard" aria-label="Abrir tu perfil">${medal({tier:'accent', g:{txt:String(lv.l)}}, false, 'shiny')}
      <span class="lvl-k">Nivel ${lv.l} · ${esc(tt.t)}</span><span class="lvl-t">${lv.rank}</span>
      <span class="lvl-x"><span class="meter lg anim"><i style="width:${lv.p * 100}%"></i></span><span>${S.xp - lv.from} de ${lv.to - lv.from} XP para el nivel ${lv.l + 1}</span></span>${ui('chev', 'chev')}</button>
    <div class="seg big" id="retoSeg" style="--n:3;--i:${['mis', 'ch', 'ach'].indexOf(seg)}"><span class="seg-th"></span>
      <button data-v="mis" aria-pressed="${seg === 'mis'}">Misiones</button><button data-v="ch" aria-pressed="${seg === 'ch'}">Desafíos</button><button data-v="ach" aria-pressed="${seg === 'ach'}">Logros</button></div>`;
  let body = '';
  if (seg === 'mis') {
    const mm = missionsOf(id);
    body = mm.list.map(m => { const r = mProg(m, id); return `<div class="mis card${m.done ? ' done' : ''}${fresh.includes(m.id) ? ' fresh' : ''}"><span class="mis-ic">${mIcon(m)}</span>
      <span class="mis-t"><span>${esc(mText(m))}</span><em class="tag${m.done ? ' g' : ''}">${m.done ? 'Hecha' : `+${m.xp} XP`}</em></span>
      <span class="meter${m.done ? ' ok' : ''} anim"><i style="width:${(m.done ? 1 : r.p) * 100}%"></i></span><span class="row-p">${m.done ? 'Completada' : esc(r.txt)}</span></div>`; }).join('')
      + `<button class="btn plain" id="reroll" ${mm.rerolls > 0 && mm.list.some(m => !m.done) ? '' : 'disabled'}>${ui('dice')}Cambiar las pendientes${mm.rerolls > 0 ? '' : ' (ya usado)'}</button>
      <p class="gfoot">Cada sesión trae 3 misiones nuevas para cada comensal. Puedes cambiar las pendientes una vez por sesión.</p>`;
  } else if (seg === 'ch') {
    const rows = allCh().map(ch => ({ch, r:evalCh(ch, id), done:isDone(id, ch.id)}));
    const done = rows.filter(x => x.done), todo = rows.filter(x => !x.done).sort((a, b) => b.r.p - a.r.p);
    const row = ({ch, r, done}) => { const n = S.trophies[ch.id] || 0;
      return `<button class="row ch-row${fresh.includes(ch.id) ? ' fresh' : ''}" data-ch="${ch.id}">${medal(ch, !done)}
        <span class="row-main"><span class="row-t">${esc(ch.t)}${ch.custom ? '<em class="tag">Tuyo</em>' : ''}</span><span class="row-d">${esc(descOf(ch))}</span>
        ${done ? `<span class="row-ok">${ui('check')}Completado</span>` : `<span class="meter anim"><i style="width:${r.p * 100}%"></i></span><span class="row-p">${esc(r.txt)}</span>`}</span>
        ${n ? `<span class="cnt">×${n}</span>` : ''}</button>`; };
    let duel = '';
    const remote = app.remoteDiners ? app.remoteDiners() : [];
    if (S.diners.length + remote.length > 1) {
      const rk = [...S.diners.map(x => ({name:x.name, color:x.color, n:S.session.log.filter(e => e.d === x.id).length})), ...remote.map(r => ({name:r.name, color:r.color, n:r.total, remote:true}))].sort((a, b) => b.n - a.n);
      const mx = Math.max(1, rk[0].n);
      duel = `<div class="duel card"><div class="ctitle"><span class="ctitle-t">Duelo de la mesa</span><button id="liveDuel">${ui('swords')}En directo</button></div>
        ${rk.map((o, i) => `<div class="dl"><span class="dl-pos${i === 0 && o.n ? ' p1' : ''}">${i + 1}</span><span class="av md" style="--c:${o.color}">${esc(initial(o.name))}</span>
        <span class="dl-main"><span class="dl-name">${esc(o.name)}${o.remote ? ui('cloud', 'chip-cl') : ''}</span><span class="dl-bar" style="--c:${o.color}"><i style="width:${o.n / mx * 100}%"></i></span></span><span class="dl-n">${o.n}</span></div>`).join('')}</div>`;
    }
    body = `<div class="sum card"><div class="sum-n">${done.length}<span>/${rows.length}</span></div><div class="sum-t">desafíos de esta sesión</div>
        <div class="meter lg anim"><i style="width:${rows.length ? done.length / rows.length * 100 : 0}%"></i></div>
        ${done.length ? `<div class="sum-medals">${done.map(x => medal(x.ch, false)).join('')}</div>` : ''}</div>${duel}
      ${todo.length ? `<div class="gsec"><div class="glabel">En curso</div><div class="group">${todo.map(row).join('')}</div></div>` : ''}
      ${done.length ? `<div class="gsec"><div class="glabel">Completados</div><div class="group">${done.map(row).join('')}</div></div>` : ''}
      <div class="gsec"><div class="group"><button class="row accent" id="newCh2">${ui('plus', '', 'width:22px;height:22px')}<span class="row-l">Crear desafío personalizado</span></button></div>
      <p class="gfoot">Se reinician en cada sesión. ×N indica las veces que lo has conseguido.</p></div>`;
  } else {
    const L = lifetime(), got = ACH.filter(a => S.ach[a.id]).length;
    body = `<div class="sum card"><div class="sum-n">${got}<span>/${ACH.length}</span></div><div class="sum-t">logros de ${esc(me().name.toLowerCase() === 'tú' ? 'tu historial' : me().name)}</div>
        <div class="meter lg anim"><i style="width:${got / ACH.length * 100}%"></i></div></div>
      <div class="ach-grid">${ACH.map(a => { const on = !!S.ach[a.id]; const [c0, mx] = a.f(L); const p = Math.min(1, c0 / mx);
        return `<button class="ach${fresh.includes(a.id) ? ' fresh' : ''}" data-ach="${a.id}">${medal(a, !on, on ? 'shiny' : '')}<b>${esc(a.t)}</b>${on ? `<span class="ok">Conseguido</span>` : `<span class="meter"><i style="width:${p * 100}%"></i></span>`}</button>`; }).join('')}</div>
      <p class="gfoot">Cuentan todas tus sesiones guardadas y la actual; las de ejemplo no. Son del primer comensal de la lista.</p>`;
  }
  $('#chBody').innerHTML = head + body;
  const sg = $('#retoSeg');
  sg.onclick = e => { const b = e.target.closest('button'); if (!b || b.dataset.v === seg) return; seg = b.dataset.v; feedback('tick'); sg.style.setProperty('--i', ['mis', 'ch', 'ach'].indexOf(seg)); $$('button', sg).forEach(x => x.setAttribute('aria-pressed', x === b)); setTimeout(() => renderRetos(), 220); };
  const rr = $('#reroll'); if (rr) rr.onclick = () => { const mm = missionsOf(id); if (mm.rerolls < 1) return; mm.rerolls--; mm.list = newMissions(mm.list); save(); feedback('tick'); renderRetos(mm.list.map(m => m.id)); app.renderMini(); hud('Misiones cambiadas'); };
  const nc = $('#newCh2'); if (nc) nc.onclick = newChSheet;
  const ld = $('#liveDuel'); if (ld) ld.onclick = () => app.duelSetup();
  $('#lvlCard').onclick = profileSheet;
}
export function updateBadge() {
  const tb = $('.tb[data-tab="ch"]'); let b = tb.querySelector('.badge');
  if ((app.unseen || 0) > 0 && app.cur !== 'ch') { if (!b) { b = document.createElement('span'); b.className = 'badge'; tb.appendChild(b); } b.textContent = app.unseen; }
  else if (b) b.remove();
}

/* ---------- Detalles ---------- */
export function chSheet(chId) {
  const ch = chById(chId); if (!ch) return;
  const id = S.active, r = evalCh(ch, id), done = isDone(id, ch.id), n = S.trophies[ch.id] || 0;
  openSheet({title:'Desafío', cancel:'Cerrar', body:`
    <div class="sh-hero">${m3d(medal(ch, !done))}<h4>${esc(ch.t)}</h4><p>${esc(descOf(ch))}</p></div>
    <div class="kv"><div><span>Nivel</span><b>${TIER_NAME[ch.tier]} · ${TIER_XP[ch.tier]} XP</b></div><div><span>Conseguido</span><b class="num">${n} ${n === 1 ? 'vez' : 'veces'}</b></div></div>
    <div class="group pad" style="display:flex;flex-direction:column;gap:8px"><div class="row-t">${done ? 'Completado en esta sesión' : 'Progreso de ' + esc(diner(id).name)}</div>
      <div class="meter lg${done ? ' ok' : ''} anim"><i style="width:${done ? 100 : r.p * 100}%"></i></div><div class="row-p">${esc(r.txt)}</div></div>
    ${ch.custom ? `<button class="btn ghost" id="delCh">Eliminar desafío</button>` : ''}`,
    mount(el) { enableTilt(el); const b = $('#delCh', el); if (b) twoStep(b, 'Toca otra vez para eliminar', () => { S.custom = S.custom.filter(c => c.id !== ch.id); save(); closeSheet(); renderRetos(); hud('Desafío eliminado'); }); }});
}
export function achSheet(aid) {
  const a = ACH.find(x => x.id === aid); if (!a) return;
  const L = lifetime(), [c0, mx] = a.f(L), on = S.ach[a.id];
  openSheet({title:'Logro', cancel:'Cerrar', body:`
    <div class="sh-hero">${m3d(medal(a, !on))}<h4>${esc(a.t)}</h4><p>${esc(descOf(a))}</p></div>
    <div class="kv"><div><span>Nivel</span><b>${TIER_NAME[a.tier]} · ${TIER_XP[a.tier]} XP</b></div><div><span>${on ? 'Conseguido' : 'Progreso'}</span><b class="num">${on ? new Date(on).toLocaleDateString('es-ES', {day:'numeric', month:'short'}) : `${Math.floor(Math.min(c0, mx))} / ${mx}`}</b></div></div>
    <div class="group pad"><div class="meter lg${on ? ' ok' : ''} anim"><i style="width:${on ? 100 : Math.min(1, c0 / mx) * 100}%"></i></div></div>`,
    mount(el) { enableTilt(el); }});
}
export function newChSheet() {
  let kind = 'all', n = 30, mins = 0;
  const label = () => `${n} ${kind === 'all' ? 'piezas' : tname(kind).toLowerCase()}${mins ? ` en ${mins} min` : ''}`;
  openSheet({title:'Nuevo desafío', ok:'Crear', body:`
    <div class="sh-hero" id="ncPrev"></div>
    <div class="gsec"><div class="glabel">Nombre</div><div class="group"><label class="row"><input class="row-in" id="ncName" style="text-align:left" maxlength="28" placeholder="Opcional"></label></div></div>
    <div class="gsec"><div class="glabel">Pieza</div><div class="picks" id="ncKind">
      <button class="pick on" data-k="all"><svg viewBox="0 0 24 24" class="mono" style="width:38px;height:38px;padding:6px;color:var(--accent)">${GLYPH.star.replace('#fff', 'currentColor')}</svg>Todas</button>
      ${sortTypes(S.types.filter(t => !t.deleted)).map(t => `<button class="pick" data-k="${t.id}">${icon(t.id)}${esc(t.name)}</button>`).join('')}</div></div>
    <div class="gsec"><div class="glabel">Reto</div><div class="group">
      <div class="row"><span class="row-l">Objetivo</span><span class="row-v num" id="ncN"></span>${stepper('nc-n')}</div>
      <div class="row"><span class="row-l">Tiempo límite</span><span class="row-v num" id="ncM"></span>${stepper('nc-m')}</div></div>
      <p class="gfoot">Con tiempo límite cuenta tu mejor tramo: por ejemplo, 8 piezas en 3 minutos seguidos.</p></div>`,
    mount(el) {
      const paint = () => {
        $('#ncN', el).textContent = n; $('#ncM', el).textContent = mins ? `${mins} min` : 'Sin límite';
        const def = customDef({id:'x', kind, n, mins, name:$('#ncName', el).value.trim()});
        $('#ncPrev', el).innerHTML = `${medal(def, false)}<h4>${esc(def.t)}</h4><p>${esc(label())}</p>`;
      };
      $('#ncKind', el).addEventListener('click', e => { const b = e.target.closest('.pick'); if (!b) return; $$('.pick', el).forEach(p => p.classList.toggle('on', p === b)); kind = b.dataset.k; paint(); });
      $('#ncName', el).addEventListener('input', paint);
      bindStepper(el, 'nc-n', dir => { n = Math.max(1, Math.min(500, n + dir * (n >= 50 ? 5 : 1))); paint(); });
      bindStepper(el, 'nc-m', dir => { mins = Math.max(0, Math.min(180, mins + dir * ((dir > 0 ? mins >= 10 : mins > 10) ? 5 : 1))); paint(); });
      paint();
    },
    onOk(el) { S.custom.push({id:'u' + Date.now().toString(36), kind, n, mins, name:$('#ncName', el).value.trim()}); seg = 'ch'; save(); renderRetos(); hud('Desafío creado'); app.checkAll(S.active); }});
}

/* ---------- Perfil: títulos, racha, calendario y ranking ---------- */
export function profileSheet() {
  const L = lifetime(), lv = level(), m = me(), tt = activeTitle(), st = streakInfo(), rk = tableRanking();
  const now = new Date(), first = new Date(now.getFullYear(), now.getMonth(), 1), daysIn = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pad = (first.getDay() + 6) % 7;
  const cal = `<div class="cal">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(x => `<b>${x}</b>`).join('')}${'<span></span>'.repeat(pad)}${Array.from({length:daysIn}, (_, i) => `<span class="${st.days.has(i + 1) ? 'on' : ''}${i + 1 === now.getDate() ? ' today' : ''}">${i + 1}</span>`).join('')}</div>`;
  const wins = S.duels.length, trialsOk = S.trials.filter(t => t.ok).length;
  openSheet({title:'Perfil', cancel:'Cerrar', body:`
    <div class="sh-hero">${m3d(medal({tier:'accent', g:{txt:String(lv.l)}}, false))}<h4>${esc(m.name)}</h4><p>${esc(tt.t)} · ${lv.rank}</p></div>
    <div class="kv"><div><span>Racha</span><b>${ui('flame', '', 'width:20px;height:20px;color:var(--accent)')}${st.weeks} ${st.weeks === 1 ? 'semana' : 'semanas'}</b></div><div><span>Este mes</span><b>${st.thisMonth} ${st.thisMonth === 1 ? 'buffet' : 'buffets'}</b></div>
      <div><span>Duelos jugados</span><b>${wins} · ${L.duelWins} ganados</b></div><div><span>Contrarrelojes</span><b>${trialsOk} superadas</b></div></div>
    <div class="gsec"><div class="glabel">${now.toLocaleDateString('es-ES', {month:'long', year:'numeric'})}</div><div class="group pad">${cal}</div>
      <p class="gfoot">Ve al buffet al menos una vez por semana para mantener la racha.</p></div>
    <div class="gsec"><div class="glabel">Títulos</div><div class="group" id="titles">${TITLES.map(t => { const ok = titleOk(t, L), [c0, mx] = t.f(L);
      return `<button class="row" data-title="${t.id}" ${ok ? '' : 'disabled'} style="--ins:16px"><span class="row-main"><span class="row-t">${esc(t.t)}${tt.id === t.id ? '<em class="tag">En uso</em>' : ''}</span><span class="row-d">${esc(typeof t.d === 'function' ? t.d() : t.d)}</span>
        ${ok ? '' : `<span class="meter"><i style="width:${Math.min(1, c0 / mx) * 100}%"></i></span>`}</span>${ok ? (tt.id === t.id ? ui('check', 'chk') : '') : ui('warn', 'lock')}</button>`; }).join('')}</div>
      <p class="gfoot">Elige el título que aparece en tu nivel y en las imágenes que compartes.</p></div>
    <div class="gsec"><div class="glabel">Ranking histórico de la mesa</div><div class="group">${rk.length ? rk.map((r, i) => `<div class="row" style="--ins:62px"><span class="dl-pos${i === 0 ? ' p1' : ''}" style="width:16px">${i + 1}</span><span class="av md" style="--c:${r.color}">${esc(initial(r.name))}</span>
      <span class="row-main"><span class="row-t">${esc(r.name)}</span><span class="row-d">${r.wins} ${r.wins === 1 ? 'victoria' : 'victorias'} · ${r.duels} duelos · ${r.sessions} sesiones juntos</span></span><span class="h-tot">${r.pieces}</span></div>`).join('')
      : '<div class="empty" style="padding:20px"><b>Aún sin rivales</b>Guarda sesiones con varios comensales o juega duelos para crear el ranking.</div>'}</div></div>`,
    mount(el) {
      enableTilt(el);
      $('#titles', el).addEventListener('click', e => { const b = e.target.closest('[data-title]'); if (!b || b.disabled) return; S.settings.title = b.dataset.title; save(); feedback('tick'); hud('Título cambiado'); closeSheet(); renderRetos(); });
    }});
}
