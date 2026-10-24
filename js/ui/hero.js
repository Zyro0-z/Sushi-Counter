// Tarjeta principal: cinta kaiten con la mascota, anillo por fases, torre de platos y ritmo.
import {S} from '../store.js';
import {CATS} from '../catalog.js';
import {MASCOT, mix, lighten, darken, ui} from '../icons.js';
import {diner, ctx, clock, nf0, nf1, recentPace, macrosOf, tname, visibleTypes, lifetime, missionsOf, paceSeries, catOf} from '../logic.js';
import {$, $$, esc, Odo, icon, app} from './common.js';
import {feedback, reduced} from '../fx.js';

const RC = 2 * Math.PI * 84;
let ring, lastBeltKey = '', lastTowerN = -1, page = 0;
export const hero = {mode:'me'};

export function initHero() {
  $('#hero').innerHTML = `
    <div class="belt" id="belt">
      <button class="mascot" id="mascot" data-mood="idle" aria-label="Shari, la mascota. Toca para un consejo">${MASCOT}</button>
      <div class="bubble glass" id="bubble" aria-hidden="true"></div>
      <div class="belt-band" aria-hidden="true"><div class="belt-track" id="beltTrack"></div></div>
    </div>
    <div class="hpages" id="hpages">
      <section class="hp hp-ring" aria-label="Progreso">
        <button class="ring-btn" id="ringBtn" aria-label="Alternar entre tu total y el de la mesa">
          <svg class="ring" viewBox="0 0 200 200" aria-hidden="true">
            <circle class="ring-track" cx="100" cy="100" r="84"/>
            <g class="ring-ticks">${[.25, .5, .75].map(p => { const a = p * 2 * Math.PI; return `<circle cx="${100 + 84 * Math.cos(a)}" cy="${100 + 84 * Math.sin(a)}" r="2.2"/>`; }).join('')}</g>
            <circle class="ring-bar" id="ringBar" cx="100" cy="100" r="84"/>
            <circle class="ring-over" id="ringOver" cx="100" cy="100" r="84"/>
          </svg>
          <span class="ring-c"><span class="ring-k" id="ringK"></span><span class="ring-n num" id="ringN"></span><span class="ring-s" id="ringS"></span></span>
        </button>
        <div class="hstats" id="hstats"></div>
      </section>
      <section class="hp hp-tower" aria-label="Torre de platos">
        <div class="hp-h"><b>Torre de platos</b><span id="towerN"></span></div>
        <svg class="tower" id="tower" viewBox="0 0 300 150" role="img" aria-label="Platos apilados"></svg>
        <div class="legend" id="towerLegend"></div>
      </section>
      <section class="hp hp-pace" aria-label="Ritmo y nutrición">
        <div class="hp-h"><b>Ritmo</b><span>piezas cada 2 min</span></div>
        <svg class="pace" id="pace" viewBox="0 0 300 90" role="img" aria-label="Ritmo de la sesión"></svg>
        <div class="macros" id="macros"></div>
      </section>
    </div>
    <div class="hdots" role="tablist" aria-label="Páginas">${['Anillo', 'Torre de platos', 'Ritmo'].map((l, i) => `<button role="tab" aria-label="${l}" data-p="${i}" ${i ? '' : 'aria-selected="true"'}></button>`).join('')}</div>`;
  ring = new Odo($('#ringN'));
  $('#ringBar').style.strokeDasharray = RC; $('#ringOver').style.strokeDasharray = RC;
  $('#ringBar').style.strokeDashoffset = RC; $('#ringOver').style.strokeDashoffset = RC;
  const hp = $('#hpages');
  hp.addEventListener('scroll', () => {
    const p = Math.round(hp.scrollLeft / hp.clientWidth);
    if (p !== page) { page = p; $$('.hdots button').forEach((b, i) => b.setAttribute('aria-selected', i === p)); feedback('tick'); }
  }, {passive:true});
  $('.hdots').addEventListener('click', e => { const b = e.target.closest('button'); if (b) hp.scrollTo({left:+b.dataset.p * hp.clientWidth, behavior:reduced() ? 'auto' : 'smooth'}); });
  $('#ringBtn').onclick = () => {
    if (S.diners.length < 2 && !app.remoteCount?.()) { say('Añade comensales para ver la mesa'); return; }
    hero.mode = hero.mode === 'me' ? 'table' : 'me'; feedback('tick'); app.updateCounter();
  };
  $('#mascot').onclick = () => { feedback('tick'); jump(); say(tip(), 'happy', 3200); };
}

/* ---------- Anillo con fases y segunda vuelta ---------- */
function phaseColor(p, base) {
  if (p < .5) return base;
  if (p < .85) return mix(base, '#FF9F0A', (p - .5) / .35);
  return mix('#FF9F0A', '#FFC21A', Math.min(1, (p - .85) / .15));
}
export function updateHero({c, table, total, goal, log}) {
  const d = diner(S.active);
  ring.set(total);
  $('#ringK').innerHTML = table ? 'Mesa' : `<i style="--c:${d.color}"></i>${esc(d.name)}`;
  const p = total / Math.max(1, goal), bar = $('#ringBar'), over = $('#ringOver');
  $('#ringS').textContent = p >= 2 ? '¡Doble objetivo!' : p >= 1 ? `+${total - goal} sobre ${goal}` : `de ${goal}`;
  bar.style.strokeDashoffset = RC * (1 - Math.min(1, p));
  bar.style.opacity = p > 0 ? 1 : 0;
  bar.style.stroke = p >= 1 ? '' : phaseColor(p, table ? '#FA5D3C' : d.color);
  bar.classList.toggle('full', p >= 1);
  over.style.strokeDashoffset = RC * (1 - Math.max(0, Math.min(1, p - 1)));
  over.style.opacity = p > 1 ? 1 : 0;
  $('#hero').classList.toggle('goal', p >= 1);
  const m = macrosOf(c.by);
  $('#hstats').innerHTML = `
    <div class="hs">${ui('clock')}<span class="hs-l">Tiempo</span><span class="hs-v" id="stTime">${S.session.start ? clock(Date.now() - S.session.start) : '00:00'}</span></div>
    <div class="hs">${ui('bolt')}<span class="hs-l">Ritmo</span><span class="hs-v">${c.total && c.el >= 1 ? nf1(c.total / c.el) + '/min' : '—'}</span></div>
    <div class="hs">${ui('flame')}<span class="hs-l">Kcal</span><span class="hs-v">${nf0(c.kcal)}</span></div>
    <div class="hs">${ui('leaf')}<span class="hs-l">Proteína</span><span class="hs-v">${nf0(m[0])} g</span></div>`;
  drawBelt(log);
  drawTower(log);
  drawPace(log, c);
  aura();
  mood(c, p);
}
export function updateTime() { const el = $('#stTime'); if (el) el.textContent = S.session.start ? clock(Date.now() - S.session.start) : '00:00'; }

/* ---------- Cinta kaiten ---------- */
const plateColor = k => (CATS.find(c => c.id === catOf(k)) || CATS[0]).plate;
function drawBelt(log) {
  const items = log.slice(-12).reverse();
  const key = items.map(e => e.t).join(',') + '|' + S.settings.motion;
  if (key === lastBeltKey) return; lastBeltKey = key;
  const tr = $('#beltTrack');
  const list = items.length ? items.map(e => ({k:e.k, t:e.t})) : visibleTypes().slice(0, 6).map(t => ({k:t.id, ghost:true}));
  while (list.length < 7) list.push(...list.slice(0, 7 - list.length));
  const html = list.map((e, i) => `<span class="bi${e.ghost ? ' ghost' : ''}${i === 0 && !e.ghost && Date.now() - e.t < 1500 ? ' new' : ''}"><svg viewBox="0 0 40 14" class="bplate"><ellipse cx="20" cy="8" rx="18" ry="5" fill="${darken(plateColor(e.k), .15)}"/><ellipse cx="20" cy="6.6" rx="18" ry="5" fill="${plateColor(e.k)}"/><ellipse cx="20" cy="6.6" rx="12" ry="3" fill="${lighten(plateColor(e.k), .35)}"/></svg>${icon(e.k, 'bic')}</span>`).join('');
  tr.innerHTML = html + html;
  const dur = Math.max(18, list.length * 3.2);
  tr.style.animationDuration = dur + 's';
  tr.style.animationDelay = -((Date.now() / 1000) % dur) + 's';
}

/* ---------- Torre de platos ---------- */
function drawTower(log) {
  const n = log.length; $('#towerN').textContent = `${n} ${n === 1 ? 'plato' : 'platos'}`;
  if (n === lastTowerN) return;
  const grew = n > lastTowerN && lastTowerN >= 0; lastTowerN = n;
  const PER = 12, COLS = 8, max = PER * COLS, shown = log.slice(0, max);
  let svg = `<line x1="8" x2="292" y1="143" y2="143" class="tw-base"/>`;
  const cols = Math.ceil(shown.length / PER);
  for (let col = 0; col < cols; col++) {
    const cx = 150 + (col - (cols - 1) / 2) * 36, part = shown.slice(col * PER, col * PER + PER), last = col === cols - 1;
    svg += `<g class="tw-col${last && grew ? ' wob' : ''}">`;
    part.forEach((e, i) => {
      const y = 138 - i * 9, c = plateColor(e.k), isNew = grew && last && i === part.length - 1;
      svg += `<g class="pl${isNew ? ' drop' : ''}" transform="translate(${cx} ${y})"><path d="M-15 0v2.4a15 4.2 0 0 0 30 0V0" fill="${darken(c, .22)}"/><ellipse rx="15" ry="4.2" fill="${c}"/><ellipse rx="10" ry="2.5" fill="${lighten(c, .38)}"/></g>`;
    });
    svg += `</g>`;
  }
  if (!n) svg += `<text x="150" y="80" text-anchor="middle" class="tw-empty">Cada pieza suma un plato a la torre</text>`;
  if (log.length > max) svg += `<text x="292" y="16" text-anchor="end" class="tw-more">+${log.length - max}</text>`;
  $('#tower').innerHTML = svg;
  const byCat = {}; log.forEach(e => { const c = catOf(e.k); byCat[c] = (byCat[c] || 0) + 1; });
  $('#towerLegend').innerHTML = CATS.map(c => `<span><i style="background:${c.plate}"></i>${c.short} ${byCat[c.id] || 0}</span>`).join('');
}

/* ---------- Ritmo y macronutrientes ---------- */
function smooth(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return d;
}
function drawPace(log, c) {
  const t0 = S.session.start, el = $('#pace');
  if (!t0 || !log.length) { el.innerHTML = `<text x="150" y="50" text-anchor="middle" class="tw-empty">Aquí verás tu ritmo minuto a minuto</text>`; }
  else {
    const series = paceSeries(log.map(e => Math.max(0, (e.t - t0) / 1000)), 2);
    series.push(0);
    const W = 300, H = 90, pad = 6, mx = Math.max(2, ...series);
    const pts = series.map((v, i) => [pad + i * (W - pad * 2) / Math.max(1, series.length - 1), H - 14 - v / mx * (H - 26)]);
    const line = smooth(pts);
    el.innerHTML = `<defs><linearGradient id="paceG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      <line x1="0" x2="300" y1="${H - 14}" y2="${H - 14}" class="tw-base"/>
      <path d="${line} L${pts[pts.length - 1][0]} ${H - 14} L${pts[0][0]} ${H - 14} Z" fill="url(#paceG)"/>
      <path d="${line}" class="pace-l"/>
      <circle cx="${pts[pts.length - 2][0]}" cy="${pts[pts.length - 2][1]}" r="3.6" class="pace-dot"/>
      <text x="4" y="${H - 2}" class="tw-axis">0 min</text><text x="296" y="${H - 2}" text-anchor="end" class="tw-axis">${Math.round((Date.now() - t0) / 60000)} min</text>
      <text x="4" y="12" class="tw-axis">máx. ${mx}</text>`;
  }
  const m = macrosOf(c.by), kc = Math.max(1, m[0] * 4 + m[1] * 4 + m[2] * 9);
  const lim = S.settings.kcalAlert ? S.settings.kcalLimit : 0;
  $('#macros').innerHTML = [['Proteínas', m[0], 4, '#30A46C'], ['Hidratos', m[1], 4, '#F5A524'], ['Grasas', m[2], 9, '#3E7BFA']]
    .map(([l, g, f, col]) => `<div class="mac"><span>${l}</span><b>${nf0(g)} g</b><i><em style="width:${Math.min(100, g * f / kc * 100)}%;background:${col}"></em></i></div>`).join('')
    + (lim ? `<div class="mac lim"><span>Límite</span><b>${nf0(c.kcal)} / ${nf0(lim)}</b><i><em style="width:${Math.min(100, c.kcal / lim * 100)}%;background:${c.kcal > lim ? 'var(--red)' : 'var(--accent)'}"></em></i></div>` : '');
}

/* ---------- Fondo vivo según el ritmo ---------- */
function aura() {
  const heat = Math.min(1, recentPace(S.active, 5) / 12);
  document.documentElement.style.setProperty('--heat', heat.toFixed(2));
}

/* ---------- Mascota ---------- */
let moodT, bubbleT, lastAddT = Date.now();
const PH = {
  add:['¡Ñam!', '¡Otro más!', 'Itadakimasu', '¡Qué buena pinta!', 'Sigue así', 'Ese tenía buena cara'],
  fast:['¡Vas volando!', '¡Modo samurái!', 'Más rápido que la cinta', '¡Respira entre pieza y pieza!'],
  full:['¡Objetivo superado!', 'Ya no cabe… ¿o sí?', 'Leyenda'],
  unlock:['¡Medalla!', '¡Bien hecho!', '¡Eso merece un aplauso!'],
  sleep:['Zzz…', '¿Seguimos o pedimos la cuenta?'],
};
const pickOne = a => a[Math.floor(Math.random() * a.length)];
function tip() {
  const L = lifetime(), untried = visibleTypes().filter(t => !L.types.has(t.id));
  const m = missionsOf(S.active).list.find(x => !x.done && x.type);
  const tips = [
    untried.length ? `¿Probamos ${tname(pickOne(untried).id).toLowerCase()}? Aún no lo has pedido nunca` : null,
    m ? `Tu misión: ${tname(m.type).toLowerCase()}. ¡A por ello!` : null,
    'Mantén pulsada una pieza para ver más opciones',
    'Desliza una pieza a la derecha para sumar varias de golpe',
    'Desliza una pieza a la izquierda para quitar una',
    'Desliza esta tarjeta para ver la torre de platos',
    'Toca el anillo para ver el total de la mesa',
    'En el menú ⋯ tienes la ruleta y el duelo',
  ].filter(Boolean);
  return pickOne(tips);
}
export function say(text, md = null, ms = 2600) {
  if (!S.settings.mascot) return;
  const b = $('#bubble'); if (!b) return;
  b.textContent = text; b.classList.add('show');
  if (md) setMood(md, ms);
  clearTimeout(bubbleT); bubbleT = setTimeout(() => b.classList.remove('show'), ms);
}
function setMood(md, ms) {
  const el = $('#mascot'); if (!el) return;
  el.dataset.mood = md; clearTimeout(moodT);
  if (ms) moodT = setTimeout(() => { el.dataset.mood = el.dataset.base || 'idle'; }, ms);
}
function jump() { const el = $('#mascot svg'); if (!el || reduced()) return; el.animate([{transform:'translateY(0)'}, {transform:'translateY(-10px) scale(1.06,.94)', offset:.4}, {transform:'translateY(0) scale(.96,1.04)', offset:.75}, {transform:'none'}], {duration:520, easing:'ease-out'}); }
function mood(c, p) {
  const el = $('#mascot'); if (!el) return;
  el.hidden = !S.settings.mascot;
  el.dataset.base = p >= 1 ? 'full' : 'idle';
  if (!el.dataset.mood || ['idle', 'full', 'sleep'].includes(el.dataset.mood)) el.dataset.mood = el.dataset.base;
}
export function mascotEvent(kind) {
  if (!S.settings.mascot) return;
  if (kind === 'add') {
    lastAddT = Date.now(); jump();
    const fast = recentPace(S.active, 2) >= 5;
    if (fast) say(pickOne(PH.fast), 'happy', 2200);
    else if (Math.random() < .35) say(pickOne(PH.add), 'happy', 1800);
    else setMood('happy', 1200);
  }
  if (kind === 'unlock') { jump(); say(pickOne(PH.unlock), 'cheer', 2600); }
  if (kind === 'full') say(pickOne(PH.full), 'cheer', 3000);
  if (kind === 'remove') setMood('idle', 0);
}
export function mascotTick() {
  const el = $('#mascot'); if (!el || !S.settings.mascot || !S.session.start) return;
  if (Date.now() - lastAddT > 5 * 60000 && el.dataset.mood !== 'sleep') { el.dataset.mood = 'sleep'; el.dataset.base = 'sleep'; if (Math.random() < .5) say(pickOne(PH.sleep), null, 3000); }
}
export function resetHeroCache() { lastBeltKey = ''; lastTowerN = -1; }
