// Historial: sesiones, estadísticas avanzadas, mapa de calor, resumen al terminar y guardado.
import {S, save, freshSession} from '../store.js';
import {CATS} from '../catalog.js';
import {medal, ui} from '../icons.js';
import {me, initial, sum, money, durShort, nf0, tname, costOf, cartaOf, kcalOf, macrosOf, counts, chById, heatmap, favorites,
  compareLast, paceSeries, priceNow, currentBuffet, sessionSlot, activeTitle} from '../logic.js';
import {$, $$, esc, app, icon, openSheet, closeSheet, twoStep, Odo, seg, bindSeg} from './common.js';
import {feedback, hud, celebrate} from '../fx.js';
import {undoStack} from './counter.js';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const sTotal = s => s.diners.reduce((a, d) => a + sum(d.counts), 0);
let view = 'list';
function niceStep(x) { const p = 10 ** Math.floor(Math.log10(x || 1)), m = x / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
function barChart(list) {
  const L = list.slice(-8); if (L.length < 2) return '';
  const W = 330, H = 176, l = 30, r = 6, t = 18, b = 24, pw = W - l - r, ph = H - t - b;
  const vals = L.map(sTotal), max = Math.max(...vals, 1), step = niceStep(max / 3), top = Math.ceil(max / step) * step;
  let g = '';
  for (let v = 0; v <= top; v += step) { const y = t + ph - v / top * ph; g += `<line class="gl" x1="${l}" x2="${W - r}" y1="${y}" y2="${y}"/><text class="tx" x="${l - 6}" y="${y + 3.5}" text-anchor="end">${v}</text>`; }
  const slot = pw / L.length, bw = Math.min(30, slot * .58);
  L.forEach((s, i) => {
    const v = vals[i], h = Math.max(2, v / top * ph), x = l + i * slot + (slot - bw) / 2, y = t + ph - h, dt = new Date(s.date);
    g += `<rect class="bar${i === L.length - 1 ? ' cur' : ''}" x="${x}" y="${y}" width="${bw}" height="${h}" rx="7" style="animation-delay:${i * 60}ms"/>
      <text class="tv" x="${x + bw / 2}" y="${y - 5}" text-anchor="middle">${v}</text><text class="tx" x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${dt.getDate()} ${MONTHS[dt.getMonth()]}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Piezas por sesión">${g}</svg>`;
}
function paceChart(secs, durMin) {
  const series = paceSeries(secs, 2); if (series.length < 2) return `<p class="gfoot">${secs.length ? 'La sesión fue demasiado corta para dibujar el ritmo.' : 'Las sesiones nuevas guardan su ritmo minuto a minuto.'}</p>`;
  const W = 330, H = 120, l = 26, b = 18, mx = Math.max(2, ...series);
  const pts = series.map((v, i) => [l + i * (W - l - 6) / (series.length - 1), H - b - v / mx * (H - b - 10)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ritmo de la última sesión">
    <line class="gl" x1="${l}" x2="${W}" y1="${H - b}" y2="${H - b}"/><text class="tx" x="${l - 6}" y="14" text-anchor="end">${mx}</text><text class="tx" x="${l - 6}" y="${H - b + 3}" text-anchor="end">0</text>
    <path d="${d} L${pts[pts.length - 1][0]} ${H - b} L${l} ${H - b}Z" class="area"/><path d="${d}" class="line"/>
    <text class="tx" x="${l}" y="${H - 3}">0 min</text><text class="tx" x="${W - 2}" y="${H - 3}" text-anchor="end">${Math.round(durMin)} min</text></svg>`;
}
function heatHTML() {
  const hm = heatmap();
  return `<div class="heat" style="--cols:${hm.grid[0].length}"><span></span>${hm.grid[0].map((_, i) => `<b>${(hm.h0 + i) % 2 ? '' : hm.h0 + i}</b>`).join('')}
    ${hm.grid.map((row, r) => `<b>${hm.days[r]}</b>${row.map((v, i) => `<i style="--v:${v / hm.max}" title="${hm.days[r]} ${hm.h0 + i}:00 · ${v} piezas"></i>`).join('')}`).join('')}</div>`;
}
const delta = (a, b, fmt, inv = false) => { if (!b) return ''; const p = (a - b) / b * 100; if (Math.abs(p) < 1) return '<em class="dl0">igual</em>'; const up = p > 0; return `<em class="${up !== inv ? 'dup' : 'ddn'}">${up ? '▲' : '▼'} ${Math.abs(Math.round(p))} %</em>`; };

export function renderHistory() {
  const H = [...S.history].sort((a, b) => a.date - b.date);
  const tots = H.map(sTotal), best = tots.length ? Math.max(...tots) : 0, all = tots.reduce((a, b) => a + b, 0);
  const head = `<div><h1 class="lt">Historial</h1><p class="lt-sub">${H.length ? `${H.length} ${H.length === 1 ? 'sesión guardada' : 'sesiones guardadas'}` : 'Aún no hay sesiones'}</p></div>
    ${H.length ? seg('hview', [['list', 'Sesiones'], ['stats', 'Estadísticas']], view, 'big') : ''}`;
  let body = '';
  if (!H.length) body = `<div class="card empty">${icon('maki', '', 'width:92px;height:92px')}<b>Sin sesiones todavía</b>Cuando termines una comida pulsa «Terminar» en el contador y se guardará aquí.</div>`;
  else if (view === 'list') {
    const costAll = H.reduce((a, s) => a + s.diners.reduce((x, d) => x + costOf(d.counts), 0), 0), paid = H.reduce((a, s) => a + s.price * s.diners.length, 0);
    const cartaAll = H.reduce((a, s) => a + s.diners.reduce((x, d) => x + cartaOf(d.counts), 0), 0);
    body = `<div class="tiles"><div class="tile"><b>${H.length}</b><span>Sesiones</span></div><div class="tile"><b>${all}</b><span>Piezas</span></div>
      <div class="tile"><b>${best}</b><span>Récord</span></div><div class="tile"><b>${Math.round(all / H.length)}</b><span>Media</span></div></div>
    <div class="bill card open"><div class="ctitle"><span class="ctitle-t">Balance acumulado</span></div>
      <div class="bill-3"><div><span>Pagado</span><b>${money(paid, 0)}</b></div><div class="c-cost"><span>Coste real</span><b>${money(costAll, 0)}</b></div><div class="c-carta"><span>En carta</span><b>${money(cartaAll, 0)}</b></div></div>
      <div class="bbar"><i style="width:${paid ? Math.min(100, costAll / paid * 100) : 0}%"></i></div>
      <p class="bill-s" style="margin:0">De cada ${money(10, 0)} que pagas, unos ${money(paid ? costAll / paid * 10 : 0)} se van en ingredientes.</p></div>
    ${H.length > 1 ? `<div class="chart-card card"><div class="ctitle"><span class="ctitle-t">Piezas por sesión</span><span>mesa</span></div>${barChart(H)}</div>` : ''}
    <div class="gsec"><div class="glabel">Sesiones</div><div class="group">
      ${[...H].reverse().map(s => { const dt = new Date(s.date); return `<button class="row h-row" data-h="${s.id}">
        <span class="h-date"><b>${dt.getDate()}</b><span>${MONTHS[dt.getMonth()]}</span></span>
        <span class="row-main"><span class="row-t">${esc(s.buffet)}${s.ex ? '<em class="tag">Ejemplo</em>' : ''}</span>
        <span class="row-d" style="display:flex;align-items:center;gap:8px"><span class="h-av">${s.diners.map(d => `<span class="av" style="--c:${d.color}">${esc(initial(d.name))}</span>`).join('')}</span>${durShort(s.dur)}</span></span>
        <span class="h-tot">${sTotal(s)}</span>${ui('chev', 'chev')}</button>`; }).join('')}
    </div>${H.some(s => s.ex) ? '<p class="gfoot">Las sesiones de ejemplo no cuentan para logros ni estadísticas. Puedes quitarlas en Ajustes › Datos.</p>' : ''}</div>`;
  } else {
    const fav = favorites(6), fmx = Math.max(1, ...fav.map(f => f[1]));
    const cmp = compareLast();
    const real = H.filter(h => !h.ex), last = real[real.length - 1], lastMe = last && (last.diners.find(d => d.me) || last.diners[0]);
    const mac = real.reduce((a, h) => { const d = h.diners.find(x => x.me) || h.diners[0]; const m = macrosOf(d.counts); return a.map((v, i) => v + m[i]); }, [0, 0, 0]);
    body = !real.length ? `<div class="card empty"><b>Aún no hay estadísticas</b>Guarda tu primera sesión real para verlas. Las de ejemplo no cuentan.</div>` : `
    ${cmp ? `<div class="card cmp"><div class="ctitle"><span class="ctitle-t">Última sesión frente a tu media</span></div>
      <div class="cmp-g"><div><span>Piezas</span><b>${cmp.last.pieces}</b>${delta(cmp.last.pieces, cmp.avg.pieces)}<small>media ${nf0(cmp.avg.pieces)}</small></div>
      <div><span>Coste real</span><b>${money(cmp.last.cost)}</b>${delta(cmp.last.cost, cmp.avg.cost)}<small>media ${money(cmp.avg.cost)}</small></div>
      <div><span>Kcal</span><b>${nf0(cmp.last.kcal)}</b>${delta(cmp.last.kcal, cmp.avg.kcal, null, true)}<small>media ${nf0(cmp.avg.kcal)}</small></div>
      <div><span>Duración</span><b>${Math.round(cmp.last.dur)} min</b>${delta(cmp.last.dur, cmp.avg.dur)}<small>media ${nf0(cmp.avg.dur)} min</small></div></div></div>` : ''}
    ${lastMe && lastMe.log ? `<div class="chart-card card"><div class="ctitle"><span class="ctitle-t">Ritmo de la última sesión</span><span>piezas cada 2 min</span></div>${paceChart(lastMe.log.map(x => x[0]), last.dur / 60000)}</div>` : ''}
    <div class="card favs"><div class="ctitle"><span class="ctitle-t">Tus favoritas de siempre</span></div>
      ${fav.map(([k, n], i) => `<div class="fv">${icon(k)}<span class="fv-m"><span class="fv-n">${esc(tname(k))}</span><span class="fv-b"><i style="width:${n / fmx * 100}%;animation-delay:${i * 70}ms"></i></span></span><b>${n}</b></div>`).join('')}</div>
    <div class="card heat-card"><div class="ctitle"><span class="ctitle-t">Cuándo comes más</span><span>piezas por hora</span></div>${heatHTML()}</div>
    <div class="card"><div class="ctitle" style="padding:16px 16px 0"><span class="ctitle-t">Nutrición acumulada</span></div>
      <div class="macros" style="padding:12px 16px 16px">${[['Proteínas', mac[0], '#30A46C'], ['Hidratos', mac[1], '#F5A524'], ['Grasas', mac[2], '#3E7BFA']].map(([l, g, c]) => { const tot = mac[0] + mac[1] + mac[2] || 1; return `<div class="mac"><span>${l}</span><b>${g >= 1000 ? (g / 1000).toFixed(1).replace('.', ',') + ' kg' : nf0(g) + ' g'}</b><i><em style="width:${g / tot * 100}%;background:${c}"></em></i></div>`; }).join('')}</div></div>
    <div class="gsec"><div class="group"><button class="row accent" id="csvBtn">${ui('table', '', 'width:22px;height:22px')}<span class="row-l">Exportar a Excel (CSV)</span>${ui('chev', 'chev')}</button></div>
      <p class="gfoot">Un archivo con cada pieza de cada sesión, listo para Excel o Numbers.</p></div>`;
  }
  $('#histBody').innerHTML = head + body;
  bindSeg($('#histBody'), 'hview', v => { view = v; setTimeout(renderHistory, 200); });
  const cb = $('#csvBtn'); if (cb) cb.onclick = () => app.exportCSV();
}
export function histSheet(hid) {
  const s = S.history.find(x => x.id === hid); if (!s) return;
  const tot = sTotal(s), dt = new Date(s.date), n = s.diners.length;
  const allC = {}; s.diners.forEach(d => Object.entries(d.counts).forEach(([k, v]) => allC[k] = (allC[k] || 0) + v));
  const top = Object.entries(allC).sort((a, b) => b[1] - a[1])[0];
  openSheet({title:dt.toLocaleDateString('es-ES', {day:'numeric', month:'long', year:'numeric'}), cancel:'Cerrar', body:`
    <div class="sh-hero"><div class="big">${tot}</div><p>piezas en ${esc(s.buffet)}${s.ex ? ' · ejemplo' : ''}</p></div>
    <div class="kv"><div><span>Duración</span><b>${durShort(s.dur)}</b></div><div><span>Pagado</span><b>${money(s.price * n)}</b></div>
      <div><span>Coste real</span><b style="color:var(--accent)">${money(costOf(allC))}</b></div><div><span>Favorita</span><b>${top ? icon(top[0]) + esc(tname(top[0])) : '—'}</b></div></div>
    ${s.diners.map(d => `<div class="gsec"><div class="glabel" style="display:flex;gap:8px;align-items:center"><span class="av sm" style="--c:${d.color}">${esc(initial(d.name))}</span>${esc(d.name)} · ${sum(d.counts)} piezas · ${nf0(kcalOf(d.counts))} kcal</div>
      <div class="group pad"><div class="mini-grid">${Object.entries(d.counts).filter(([, v]) => v).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="mini">${icon(k)}<b>${v}</b>${esc(tname(k))}</div>`).join('')}</div>
      ${(d.medals || []).length ? `<div class="sum-medals" style="margin-top:12px">${d.medals.map(m => chById(m)).filter(Boolean).map(m => medal(m, false)).join('')}</div>` : ''}</div></div>`).join('')}
    <button class="btn plain" id="shH">${ui('share')}Compartir imagen</button>
    <button class="btn ghost" id="delH">Eliminar sesión</button>`,
    mount(el) { $('#shH', el).onclick = () => app.shareCard(s); twoStep($('#delH', el), 'Toca otra vez para eliminar', () => { S.history = S.history.filter(x => x.id !== hid); save(); closeSheet(); renderHistory(); hud('Sesión eliminada'); }); }});
}

/* ---------- Terminar sesión ---------- */
export function buildRecord(ms) {
  const t0 = S.session.start;
  const people = S.diners.map(d => ({d, n:S.session.log.filter(e => e.d === d.id).length, m:S.session.done[d.id] || []})).filter(x => x.n).sort((a, b) => b.n - a.n);
  return {people, rec:{id:'s' + Date.now().toString(36), date:t0, buffet:currentBuffet().name, price:priceNow(), slot:sessionSlot(), dur:ms, title:activeTitle().t,
    diners:people.map(x => ({me:x.d.id === me().id, name:x.d.name, color:x.d.color, counts:counts(x.d.id), medals:[...x.m],
      log:S.session.log.filter(e => e.d === x.d.id).map(e => [Math.round((e.t - t0) / 1000), e.k])}))}};
}
export function finishSheet() {
  if (!S.session.log.length) return;
  const ms = Date.now() - S.session.start, tot = S.session.log.length, all = counts();
  const top = Object.entries(all).sort((a, b) => b[1] - a[1])[0];
  const {people} = buildRecord(ms);
  const paid = priceNow() * people.length, cost = costOf(all);
  openSheet({title:'Resumen', body:`
    <div class="sh-hero"><div class="big" id="finBig"></div><p>piezas en la mesa · ${durShort(ms)}</p></div>
    <div class="kv"><div><span>Pagado</span><b>${money(paid)}</b></div><div><span>Coste real</span><b style="color:var(--accent)">${money(cost)}</b></div>
      <div><span>Favorita</span><b>${icon(top[0])}${esc(tname(top[0]))}</b></div><div><span>${cost > paid ? 'El buffet pierde' : 'El buffet gana'}</span><b style="color:${cost > paid ? 'var(--green)' : 'var(--label)'}">${money(Math.abs(paid - cost))}</b></div></div>
    <div class="gsec"><div class="glabel">Comensales</div><div class="group">${people.map((x, i) => `<div class="row" style="--ins:62px;padding:10px 16px">
      <span class="av md" style="--c:${x.d.color}">${esc(initial(x.d.name))}</span><span class="row-main"><span class="row-t">${esc(x.d.name)}${i === 0 && people.length > 1 ? '<em class="tag">Gana</em>' : ''}</span>
      <span class="row-d">${x.m.length} ${x.m.length === 1 ? 'medalla' : 'medallas'} · ${money(costOf(counts(x.d.id)))} de coste · ${nf0(kcalOf(counts(x.d.id)))} kcal</span></span><span class="h-tot">${x.n}</span></div>`).join('')}</div></div>
    <button class="btn" id="finSave">Guardar en el historial</button>
    <button class="btn plain" id="finShare">${ui('share')}Compartir imagen</button>
    <button class="btn ghost" id="finDrop">Descartar sesión</button>`,
    mount(el) {
      const o = new Odo($('#finBig', el)); o.set(0); setTimeout(() => o.set(tot), 140);
      $('#finShare', el).onclick = () => app.shareCard(buildRecord(Date.now() - S.session.start).rec);
      $('#finSave', el).onclick = () => {
        const {rec, people: ppl} = buildRecord(Date.now() - S.session.start);
        S.history.push(rec);
        ppl.forEach(x => x.m.forEach(m => S.trophies[m] = (S.trophies[m] || 0) + 1));
        resetSession(); closeSheet(); hud('Sesión guardada'); celebrate('confetti', 110); feedback('win');
        app.backupNudge && app.backupNudge();
      };
      twoStep($('#finDrop', el), 'Toca otra vez para descartar', () => { resetSession(); closeSheet(); hud('Sesión descartada'); });
    }});
}
export function resetSession() {
  app.releaseAwake && app.releaseAwake();
  S.session = freshSession(); undoStack.length = 0; app.unseen = 0;
  app.updateBadge(); save(); app.renderChips(); app.resetHero(); app.updateCounter();
  app.sharePush && app.sharePush(true);
}
