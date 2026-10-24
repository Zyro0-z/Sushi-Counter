// Cálculos sin interfaz: recuentos, costes, retos, logros, misiones, niveles y estadísticas.
// Todo lo de aquí se puede probar con `node --test`.
import {S} from './store.js';
import {CATS, DEFAULT_TYPES, ORDER, BIG_UNITS, CURRENCIES} from './catalog.js';
import {TIER_XP} from './icons.js';

/* ---------- Utilidades ---------- */
export const sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
export const diner = id => S.diners.find(d => d.id === id) || S.diners[0];
export const me = () => S.diners[0];
export const typeById = id => S.types.find(t => t.id === id);
export const tname = id => typeById(id)?.name || 'Pieza borrada';
export const initial = n => (n || '?').trim().charAt(0).toUpperCase() || '?';
export const nf1 = v => v.toLocaleString('es-ES', {maximumFractionDigits:1, minimumFractionDigits:1});
export const nf0 = v => Math.round(v).toLocaleString('es-ES');
export function money(v, dec = 2) {
  try { return new Intl.NumberFormat('es-ES', {style:'currency', currency:S.settings.cur, minimumFractionDigits:dec, maximumFractionDigits:dec}).format(v); }
  catch (e) { return v.toFixed(dec) + ' ' + CURRENCIES[S.settings.cur]; }
}
export function clock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`;
}
export function durShort(ms) { const m = Math.max(1, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; }
export const hhmm = t => new Date(t).toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'});
export const parseNum = v => { const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
export const fmtDec = v => String(Math.round(v * 100) / 100).replace('.', ',');
export const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const sortTypes = list => list.slice().sort((a, b) => (ORDER[a.id] ?? 999) - (ORDER[b.id] ?? 999));

/* ---------- Piezas, alérgenos y nutrición ---------- */
export const hasAllergen = t => (t.al || []).some(a => S.settings.allergens.includes(a));
export const visibleTypes = () => sortTypes(S.types.filter(t => t.on && !t.deleted && !(S.settings.allergenMode === 'hide' && hasAllergen(t))));
export const catOf = k => typeById(k)?.cat;
const defOf = k => DEFAULT_TYPES.find(d => d.id === k);
export function macroOf(t) {
  if (!t) return [0, 0, 0];
  const def = defOf(t.id);
  if (def && def.mac) { const r = def.kcal ? t.kcal / def.kcal : 1; return def.mac.map(v => v * r); }
  return [t.kcal * .14 / 4, t.kcal * .58 / 4, t.kcal * .28 / 9];
}
export const kcalOf = by => Object.entries(by).reduce((a, [k, n]) => a + n * (typeById(k)?.kcal || 0), 0);
export const costOf = by => Object.entries(by).reduce((a, [k, n]) => a + n * (typeById(k)?.cost || 0), 0);
export const cartaOf = by => Object.entries(by).reduce((a, [k, n]) => a + n * (typeById(k)?.carta || 0), 0);
export const macrosOf = by => Object.entries(by).reduce((a, [k, n]) => { const m = macroOf(typeById(k)); return a.map((v, i) => v + m[i] * n); }, [0, 0, 0]);
export const countIn = (by, ids) => ids.reduce((a, k) => a + (by[k] || 0), 0);
export function counts(dId) { const c = {}; for (const e of S.session.log) if (!dId || e.d === dId) c[e.k] = (c[e.k] || 0) + 1; return c; }
export function ctx(id) {
  const log = S.session.log.filter(e => e.d === id);
  const by = {}, cat = {}; log.forEach(e => { by[e.k] = (by[e.k] || 0) + 1; const c = catOf(e.k); cat[c] = (cat[c] || 0) + 1; });
  const el = S.session.start ? (Date.now() - S.session.start) / 60000 : 0;
  return {log, by, cat, total:log.length, distinct:Object.keys(by).length, el, cost:costOf(by), carta:cartaOf(by), kcal:kcalOf(by)};
}
export function bestWindow(log, ms) { let best = 0, j = 0; for (let i = 0; i < log.length; i++) { while (log[i].t - log[j].t > ms) j++; best = Math.max(best, i - j + 1); } return best; }
export function noRepeatRun(log) { let best = 0, j = 0; const seen = new Map(); for (let i = 0; i < log.length; i++) { const k = log[i].k; if (seen.has(k) && seen.get(k) >= j) j = seen.get(k) + 1; seen.set(k, i); best = Math.max(best, i - j + 1); } return best; }
export const recentPace = (id, mins = 5) => { const t0 = Date.now() - mins * 60000; return S.session.log.filter(e => e.d === id && e.t >= t0).length; };

/* ---------- Buffets y precio según el momento ---------- */
export function slotFor(d) { const day = d.getDay(); if (day === 0 || day === 6) return 'weekend'; return d.getHours() < 17 ? 'noon' : 'night'; }
export const currentBuffet = () => S.buffets.find(b => b.id === (S.session.buffetId || S.buffetId)) || S.buffets[0];
export const sessionSlot = () => S.session.slot || slotFor(new Date(S.session.start || Date.now()));
export function priceNow() { if (S.session.priceOverride != null) return S.session.priceOverride; const b = currentBuffet(); return b.prices[sessionSlot()] ?? 0; }

/* ---------- Desafíos de sesión ---------- */
export const CH = [
  {id:'c10', t:'Calentando', d:'Come 10 piezas', tier:'bronze', g:{txt:'10'}, f:c => [c.total, 10]},
  {id:'c25', t:'Entrando en calor', d:'Llega a 25 piezas', tier:'bronze', g:{txt:'25'}, f:c => [c.total, 25]},
  {id:'c50', t:'Medio centenar', d:'Llega a 50 piezas', tier:'silver', g:{txt:'50'}, f:c => [c.total, 50]},
  {id:'c75', t:'Setenta y cinco', d:'Llega a 75 piezas', tier:'silver', g:{txt:'75'}, f:c => [c.total, 75]},
  {id:'c100', t:'Centenario', d:'Cruza la barrera de las 100 piezas', tier:'gold', g:{txt:'100'}, f:c => [c.total, 100]},
  {id:'c150', t:'Leyenda viva', d:'150 piezas en una sesión', tier:'plat', g:{txt:'150'}, f:c => [c.total, 150]},
  {id:'meta', t:'Objetivo cumplido', d:() => `Alcanza tu objetivo de ${S.settings.goal} piezas`, tier:'gold', g:{p:'target'}, f:c => [c.total, S.settings.goal]},
  {id:'carta', t:'Carta completa', d:'Prueba 6 tipos distintos', tier:'silver', g:{p:'layers'}, f:c => [c.distinct, 6, `${Math.min(c.distinct, 6)} de 6 tipos`]},
  {id:'explorador', t:'Explorador', d:'Prueba 12 tipos distintos', tier:'gold', g:{p:'compass'}, f:c => [c.distinct, 12, `${Math.min(c.distinct, 12)} de 12 tipos`]},
  {id:'arcoiris', t:'Arcoíris', d:'Algo de las 5 categorías', tier:'gold', g:{p:'rainbow'}, f:c => { const n = Object.keys(c.cat).length; return [n, 5, `${Math.min(n, 5)} de 5 categorías`]; }},
  {id:'equi', t:'Equilibrista', d:'5 o más de 4 tipos diferentes', tier:'silver', g:{p:'balance'}, f:c => { const n = Object.values(c.by).filter(v => v >= 5).length; return [n, 4, `${Math.min(n, 4)} de 4 tipos`]; }},
  {id:'norep', t:'Sin repetir', d:'8 seguidas sin repetir tipo', tier:'silver', g:{p:'stack'}, f:c => { const n = noRepeatRun(c.log); return [n, 8, `Mejor racha: ${n}`]; }},
  {id:'relampago', t:'Relámpago', d:'3 piezas en 15 segundos', tier:'bronze', g:{p:'bolt'}, f:c => { const b = bestWindow(c.log, 15000); return [b, 3, `Mejor: ${b} en 15 s`]; }},
  {id:'samurai', t:'Ritmo samurái', d:'5 piezas en 60 segundos', tier:'gold', g:{p:'flame'}, f:c => { const b = bestWindow(c.log, 60000); return [b, 5, `Mejor minuto: ${b}`]; }},
  {id:'sprint', t:'Sprint', d:'10 piezas en 5 minutos', tier:'silver', g:{p:'rocket'}, f:c => { const b = bestWindow(c.log, 300000); return [b, 10, `Mejor tramo: ${b} en 5 min`]; }},
  {id:'expres', t:'Exprés', d:'30 piezas en los primeros 20 minutos', tier:'gold', g:{p:'clock'}, f:c => { const t0 = S.session.start || 0; const n = c.log.filter(e => e.t - t0 <= 1200000).length; return [n, 30, `${Math.min(n, 30)} de 30`]; }},
  {id:'amort', t:'Mejor que la carta', d:'Lo comido vale más en carta que el buffet', tier:'bronze', g:{p:'coin'}, f:c => { const p = priceNow(); return [c.carta, p, `${money(Math.min(c.carta, p))} de ${money(p)}`]; }},
  {id:'coste5', t:'Le duele un poco', d:() => `Cuesta ${money(5, 0)} en ingredientes al restaurante`, tier:'bronze', g:{p:'down'}, f:c => [c.cost, 5, `${money(Math.min(c.cost, 5))} de ${money(5, 0)}`]},
  {id:'coste10', t:'Pesadilla del dueño', d:() => `Cuesta ${money(10, 0)} en ingredientes`, tier:'gold', g:{p:'down'}, f:c => [c.cost, 10, `${money(Math.min(c.cost, 10))} de ${money(10, 0)}`]},
  {id:'ruina', t:'A pérdidas', d:'Que tus ingredientes cuesten más que el buffet', tier:'plat', g:{p:'gem'}, f:c => { const p = priceNow(); return [c.cost, p, `${money(Math.min(c.cost, p))} de ${money(p)}`]; }},
  {id:'purista', t:'Purista', d:'15 láminas de sashimi', tier:'silver', g:{icon:'sashimi'}, f:c => [countIn(c.by, ['sashimi', 'sashimi_atun']), 15]},
  {id:'nigirista', t:'Nigirista', d:'20 nigiris de cualquier tipo', tier:'silver', g:{icon:'nigiri'}, f:c => [countIn(c.by, ['nigiri', 'nigiri_atun', 'nigiri_anguila', 'ebi']), 20]},
  {id:'atunero', t:'Atunero', d:'10 de atún (nigiri, sashimi o tataki)', tier:'silver', g:{icon:'nigiri_atun'}, f:c => [countIn(c.by, ['nigiri_atun', 'sashimi_atun', 'tataki']), 10]},
  {id:'unagi', t:'Unagi lover', d:'6 nigiris de anguila', tier:'bronze', g:{icon:'nigiri_anguila'}, f:c => [c.by.nigiri_anguila || 0, 6]},
  {id:'rollero', t:'Rollero', d:'30 piezas de rolls', tier:'silver', g:{icon:'uramaki'}, f:c => [c.cat.roll || 0, 30]},
  {id:'dragon', t:'Domador de dragones', d:'8 piezas de dragon roll', tier:'bronze', g:{icon:'dragon'}, f:c => [c.by.dragon || 0, 8]},
  {id:'gyoza', t:'Maestro gyoza', d:'12 gyozas', tier:'bronze', g:{icon:'gyoza'}, f:c => [c.by.gyoza || 0, 12]},
  {id:'tempura', t:'Crujiente', d:'10 tempuras de langostino', tier:'silver', g:{icon:'tempura'}, f:c => [c.by.tempura || 0, 10]},
  {id:'pollo', t:'Corral japonés', d:'6 de pollo (teriyaki o karaage)', tier:'bronze', g:{icon:'pollo_teriyaki'}, f:c => [countIn(c.by, ['pollo_teriyaki', 'karaage']), 6]},
  {id:'pato', t:'Pato laqueado', d:'3 crepes de pato pekín', tier:'silver', g:{icon:'pato'}, f:c => [c.by.pato || 0, 3]},
  {id:'caliente', t:'Fuego en la mesa', d:'15 cosas calientes', tier:'silver', g:{p:'flame'}, f:c => [c.cat.hot || 0, 15]},
  {id:'ligero', t:'Empieza ligero', d:'Lo primero: miso, edamame o wakame', tier:'bronze', g:{icon:'miso'}, f:c => { if (!c.log.length) return [0, 1, 'Aún no has empezado']; const ok = catOf(c.log[0].k) === 'side'; return [ok ? 1 : 0, 1, ok ? 'Hecho' : 'Ya empezaste con otra cosa']; }},
  {id:'hueco', t:'Siempre hay hueco', d:'Pide postre después de 40 piezas', tier:'bronze', g:{icon:'mochi'}, f:c => {
    let n = 0, ok = false; for (const e of c.log) { if (catOf(e.k) === 'dessert' && n >= 40) ok = true; n++; }
    if (ok) return [1, 1, 'Hecho'];
    return c.total >= 40 ? [.95, 1, 'Ya puedes pedir el postre'] : [Math.min(c.total, 40) / 40 * .9, 1, `${c.total} de 40 piezas antes del postre`];
  }},
  {id:'goloso', t:'Goloso', d:'3 postres distintos', tier:'bronze', g:{icon:'helado'}, f:c => { const n = ['mochi', 'helado', 'fruta'].filter(k => c.by[k]).length; return [n, 3, `${n} de 3 postres`]; }},
  {id:'banquete', t:'Banquete', d:'Supera las 2.000 kcal', tier:'silver', g:{p:'dish'}, f:c => [c.kcal, 2000, `${nf0(Math.min(c.kcal, 2000))} de 2.000 kcal`]},
  {id:'maraton', t:'Maratón', d:'90 minutos en la mesa', tier:'bronze', g:{p:'clock'}, f:c => [Math.floor(c.el), 90, `${Math.min(Math.floor(c.el), 90)} de 90 min`]},
  {id:'rey', t:'Rey de la mesa', d:'Saca 10 piezas de ventaja al resto', tier:'gold', g:{p:'crown'}, needs2:true, f:(c, id) => {
    const others = Math.max(0, ...S.diners.filter(d => d.id !== id).map(d => S.session.log.filter(e => e.d === d.id).length));
    const lead = c.total - others; return [Math.max(0, lead), 10, lead > 0 ? `${lead} de ventaja` : lead === 0 ? 'Empate' : `${-lead} por detrás`];
  }},
];
export function customDef(c) {
  const tn = c.kind === 'all' ? 'piezas' : tname(c.kind);
  return {
    id:c.id, custom:true, tier:'accent', g: c.kind === 'all' ? {p:'star'} : {icon:c.kind},
    t: c.name || `${c.n} ${c.kind === 'all' ? 'piezas' : tn.toLowerCase()}`,
    d: `${c.n} ${c.kind === 'all' ? 'piezas' : tn}${c.mins ? ` en ${c.mins} min` : ''}`,
    f: x => { const log = c.kind === 'all' ? x.log : x.log.filter(e => e.k === c.kind); const v = c.mins ? bestWindow(log, c.mins * 60000) : log.length; return [v, c.n, c.mins ? `Mejor tramo: ${v} de ${c.n}` : undefined]; },
  };
}
export const allCh = () => [...CH, ...S.custom.map(customDef)].filter(ch => !(ch.needs2 && S.diners.length < 2));
export const chById = id => [...CH, ...S.custom.map(customDef)].find(c => c.id === id);
export const descOf = x => typeof x.d === 'function' ? x.d() : x.d;
export function evalCh(ch, id) {
  const [cur, max, txt] = ch.f(ctx(id), id);
  const p = max > 0 ? Math.max(0, Math.min(1, cur / max)) : 0;
  return {cur, max, p, txt: txt || `${Math.min(Math.floor(cur), max)} de ${max}`};
}
export const isDone = (id, chId) => (S.session.done[id] || []).includes(chId);

/* ---------- Historial: semanas, rachas y vida del propietario ---------- */
const realHistory = () => S.history.filter(h => !h.ex);
const meOf = h => h.diners.find(x => x.me) || h.diners[0];
export function weekKey(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return ymd(d); }
export function streakInfo() {
  const dates = realHistory().map(h => h.date); if (S.session.start) dates.push(S.session.start);
  const weeks = new Set(dates.map(weekKey));
  let cur = 0; const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  if (!weeks.has(ymd(d))) d.setDate(d.getDate() - 7);
  while (weeks.has(ymd(d))) { cur++; d.setDate(d.getDate() - 7); }
  const months = {}; dates.forEach(t => { const x = new Date(t); const k = `${x.getFullYear()}-${x.getMonth()}`; months[k] = (months[k] || 0) + 1; });
  const now = new Date(), thisMonth = months[`${now.getFullYear()}-${now.getMonth()}`] || 0;
  const days = new Set(dates.filter(t => { const x = new Date(t); return x.getFullYear() === now.getFullYear() && x.getMonth() === now.getMonth(); }).map(t => new Date(t).getDate()));
  return {weeks:cur, thisMonth, monthMax:Math.max(0, ...Object.values(months)), days};
}
export function lifetime() {
  const m = me(), L = {sessions:0, pieces:0, best:0, cost:0, mins:0, medals:0, types:new Set(), buffets:new Set(), byType:{}, byCat:{},
    night:false, nights:0, noon:false, weekend:false, group:false, weekSessions:0, catsAll:false};
  const weekAgo = Date.now() - 7 * 86400000;
  const take = (cnt, date, durMin, buffet, nDiners, medals) => {
    const n = sum(cnt); if (!n) return;
    L.sessions++; L.pieces += n; L.best = Math.max(L.best, n); L.cost += costOf(cnt); L.mins += durMin; L.medals += medals;
    Object.entries(cnt).forEach(([k, v]) => { if (!v) return; L.types.add(k); L.byType[k] = (L.byType[k] || 0) + v; const c = catOf(k); L.byCat[c] = (L.byCat[c] || 0) + v; });
    L.buffets.add((buffet || '').trim().toLowerCase());
    const dt = new Date(date), h = dt.getHours(), wd = dt.getDay();
    if (h >= 22 || h < 4) { L.night = true; L.nights++; } if (h >= 11 && h < 14) L.noon = true; if (wd === 0 || wd === 6) L.weekend = true;
    if (nDiners >= 4) L.group = true; if (date >= weekAgo) L.weekSessions++;
    if (new Set(Object.keys(cnt).filter(k => cnt[k]).map(catOf)).size >= 5) L.catsAll = true;
  };
  realHistory().forEach(h => { const d = meOf(h); if (d) take(d.counts, h.date, h.dur / 60000, h.buffet, h.diners.length, (d.medals || []).length); });
  if (S.session.start) { const c = ctx(m.id); take(c.by, S.session.start, c.el, currentBuffet().name, S.diners.length, (S.session.done[m.id] || []).length); }
  const mine = m.name.trim().toLowerCase();
  L.duelWins = S.duels.filter(d => d.winner && d.winner.trim().toLowerCase() === mine).length;
  L.trialsOk = S.trials.filter(t => t.ok).length;
  const st = streakInfo(); L.streak = st.weeks; L.monthMax = st.monthMax;
  return L;
}
export const ACH = [
  {id:'s1', t:'Primer buffet', d:'Empieza tu primera sesión', tier:'bronze', g:{p:'star'}, f:L => [L.sessions, 1]},
  {id:'s5', t:'Habitual', d:'5 sesiones', tier:'bronze', g:{txt:'5'}, f:L => [L.sessions, 5]},
  {id:'s10', t:'Cliente VIP', d:'10 sesiones', tier:'silver', g:{txt:'10'}, f:L => [L.sessions, 10]},
  {id:'s25', t:'Socio de honor', d:'25 sesiones', tier:'gold', g:{txt:'25'}, f:L => [L.sessions, 25]},
  {id:'s50', t:'Parte del mobiliario', d:'50 sesiones', tier:'plat', g:{txt:'50'}, f:L => [L.sessions, 50]},
  {id:'p100', t:'Cien piezas', d:'100 piezas en total', tier:'bronze', g:{txt:'100'}, f:L => [L.pieces, 100]},
  {id:'p500', t:'Quinientas', d:'500 piezas en total', tier:'silver', g:{txt:'500'}, f:L => [L.pieces, 500]},
  {id:'p1000', t:'Mil piezas', d:'1.000 piezas en total', tier:'gold', g:{txt:'1K'}, f:L => [L.pieces, 1000]},
  {id:'p5000', t:'Cinta infinita', d:'5.000 piezas en total', tier:'plat', g:{txt:'5K'}, f:L => [L.pieces, 5000]},
  {id:'r60', t:'Récord: 60', d:'60 piezas en una sesión', tier:'silver', g:{p:'trend'}, f:L => [L.best, 60]},
  {id:'r100', t:'Récord: 100', d:'100 piezas en una sesión', tier:'gold', g:{p:'trend'}, f:L => [L.best, 100]},
  {id:'t10', t:'Curioso', d:'Prueba 10 tipos distintos', tier:'bronze', g:{p:'compass'}, f:L => [L.types.size, 10]},
  {id:'t20', t:'Gourmet', d:'Prueba 20 tipos distintos', tier:'silver', g:{p:'compass'}, f:L => [L.types.size, 20]},
  {id:'tall', t:'Catálogo completo', d:() => `Prueba los ${DEFAULT_TYPES.length} tipos de serie`, tier:'plat', g:{p:'layers'}, f:L => [DEFAULT_TYPES.filter(t => L.types.has(t.id)).length, DEFAULT_TYPES.length]},
  {id:'cats', t:'Menú degustación', d:'Las 5 categorías en una misma sesión', tier:'silver', g:{p:'rainbow'}, f:L => [L.catsAll ? 1 : 0, 1]},
  {id:'k25', t:'Mal cliente', d:() => `${money(25, 0)} de ingredientes en total`, tier:'bronze', g:{p:'down'}, f:L => [L.cost, 25]},
  {id:'k100', t:'Peor cliente', d:() => `${money(100, 0)} de ingredientes en total`, tier:'gold', g:{p:'down'}, f:L => [L.cost, 100]},
  {id:'b3', t:'Ruta del sushi', d:'Visita 3 buffets distintos', tier:'bronze', g:{p:'map'}, f:L => [L.buffets.size, 3]},
  {id:'b6', t:'Crítico gastronómico', d:'Visita 6 buffets distintos', tier:'gold', g:{p:'map'}, f:L => [L.buffets.size, 6]},
  {id:'night', t:'Búho', d:'Una sesión que empiece después de las 22:00', tier:'bronze', g:{p:'moon'}, f:L => [L.night ? 1 : 0, 1]},
  {id:'noon', t:'Menú del mediodía', d:'Una sesión entre las 11:00 y las 14:00', tier:'bronze', g:{p:'sun'}, f:L => [L.noon ? 1 : 0, 1]},
  {id:'weekend', t:'Plan de finde', d:'Una sesión en sábado o domingo', tier:'bronze', g:{p:'cal'}, f:L => [L.weekend ? 1 : 0, 1]},
  {id:'week2', t:'Doble semanal', d:'2 sesiones en 7 días', tier:'silver', g:{p:'cal'}, f:L => [L.weekSessions, 2]},
  {id:'streak3', t:'Racha de tres', d:'3 semanas seguidas yendo al buffet', tier:'silver', g:{p:'flame'}, f:L => [L.streak, 3]},
  {id:'month3', t:'Mes intenso', d:'3 buffets en un mismo mes', tier:'silver', g:{p:'cal'}, f:L => [L.monthMax, 3]},
  {id:'group', t:'Mesa grande', d:'Una sesión con 4 comensales o más', tier:'silver', g:{p:'people'}, f:L => [L.group ? 1 : 0, 1]},
  {id:'h10', t:'Diez horas', d:'10 horas en total en la mesa', tier:'silver', g:{p:'clock'}, f:L => [Math.floor(L.mins / 60), 10]},
  {id:'m25', t:'Coleccionista', d:'25 medallas de desafío', tier:'silver', g:{p:'medal'}, f:L => [L.medals, 25]},
  {id:'m100', t:'Vitrina llena', d:'100 medallas de desafío', tier:'gold', g:{p:'medal'}, f:L => [L.medals, 100]},
  {id:'duel1', t:'Primera sangre', d:'Gana un duelo', tier:'bronze', g:{p:'swords'}, f:L => [L.duelWins, 1]},
  {id:'duel5', t:'Invicto', d:'Gana 5 duelos', tier:'gold', g:{p:'swords'}, f:L => [L.duelWins, 5]},
  {id:'trial1', t:'Contra el reloj', d:'Supera una contrarreloj', tier:'silver', g:{p:'timer'}, f:L => [L.trialsOk, 1]},
  {id:'ruleta', t:'Obediente', d:'Come lo que diga la ruleta', tier:'bronze', g:{p:'wheel'}, f:() => [S.stats.rouletteEaten, 1]},
  {id:'chef', t:'Chef creativo', d:'Crea una pieza propia', tier:'bronze', g:{p:'sparkles'}, f:() => [S.types.some(t => t.tpl && !t.deleted) ? 1 : 0, 1]},
  {id:'mesa', t:'Mesa conectada', d:'Comparte una mesa entre varios móviles', tier:'silver', g:{p:'cloud'}, f:() => [S.stats.shares, 1]},
];

/* ---------- Títulos ---------- */
export const TITLES = [
  {id:'novato', t:'Recién llegado', d:'Tu primer título', f:() => [1, 1]},
  {id:'salmon', t:'Señor del Salmón', d:'100 piezas de salmón', f:L => [countIn(L.byType, ['nigiri', 'sashimi']), 100]},
  {id:'atun', t:'Atunero mayor', d:'50 piezas de atún', f:L => [countIn(L.byType, ['nigiri_atun', 'sashimi_atun', 'tataki']), 50]},
  {id:'gyoza', t:'Rey del Gyoza', d:'50 gyozas', f:L => [L.byType.gyoza || 0, 50]},
  {id:'pato', t:'Pato Pekinés', d:'20 crepes de pato', f:L => [L.byType.pato || 0, 20]},
  {id:'pollo', t:'Domador de pollos', d:'30 de pollo', f:L => [countIn(L.byType, ['pollo_teriyaki', 'karaage']), 30]},
  {id:'rolls', t:'Enrollado', d:'200 piezas de rolls', f:L => [L.byCat.roll || 0, 200]},
  {id:'postre', t:'Goloso profesional', d:'25 postres', f:L => [L.byCat.dessert || 0, 25]},
  {id:'explorer', t:'Trotamundos', d:'20 tipos distintos', f:L => [L.types.size, 20]},
  {id:'maraton', t:'Maratoniano', d:'10 horas en la mesa', f:L => [Math.floor(L.mins / 60), 10]},
  {id:'ruina', t:'Ruina del dueño', d:() => `${money(100, 0)} en ingredientes`, f:L => [L.cost, 100]},
  {id:'duelista', t:'Duelista', d:'Gana 5 duelos', f:L => [L.duelWins, 5]},
  {id:'veloz', t:'Velocista', d:'Consigue «Ritmo samurái» 3 veces', f:() => [S.trophies.samurai || 0, 3]},
  {id:'buho', t:'Noctámbulo', d:'3 sesiones nocturnas', f:L => [L.nights, 3]},
  {id:'leyenda', t:'Leyenda del kaiten', d:'Llega al nivel 23', f:() => [level().l, 23]},
];
export const titleOk = (tt, L) => { const [c, m] = tt.f(L); return c >= m; };
export function activeTitle() {
  const L = lifetime(); const sel = TITLES.find(t => t.id === S.settings.title && titleOk(t, L));
  return sel || [...TITLES].reverse().find(t => titleOk(t, L)) || TITLES[0];
}

/* ---------- Misiones ---------- */
const CAT_TARGET = {nigiri:10, roll:12, hot:6, side:2, dessert:2};
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
export function genMission(kind, usedT) {
  const vis = visibleTypes().length ? visibleTypes() : S.types.filter(t => !t.deleted);
  const free = vis.filter(t => !usedT.includes(t.id)); const pool = free.length ? free : vis;
  if (kind === 'eat') { const t = pick(pool); const n = BIG_UNITS.includes(t.unit) ? 1 + rnd(2) : 4 + rnd(5); return {k:'eat', type:t.id, n}; }
  if (kind === 'cat') { const cs = CATS.filter(c => vis.some(t => t.cat === c.id)); const c = pick(cs); return {k:'cat', cat:c.id, n:CAT_TARGET[c.id]}; }
  if (kind === 'new') { const L = lifetime(); const nv = pool.filter(t => !L.types.has(t.id)); const t = nv.length ? pick(nv) : pick(pool); return {k:'new', type:t.id, n:1}; }
  if (kind === 'norep') return {k:'norep', n:5 + rnd(3)};
  if (kind === 'speed') return {k:'speed', n:6 + rnd(4), mins:3};
  if (kind === 'var') return {k:'var', n:5 + rnd(3)};
  if (kind === 'cost') return {k:'cost', n:[3, 4, 5][rnd(3)]};
  if (kind === 'kcal') return {k:'kcal', n:[1000, 1200, 1500][rnd(3)]};
  return {k:'dessert', n:25};
}
export function newMissions(prev = []) {
  const kinds = ['eat', 'cat', 'new', 'norep', 'speed', 'var', 'cost', 'kcal', 'dessert'];
  const out = prev.filter(m => m.done);
  const usedT = out.filter(m => m.type).map(m => m.type);
  let guard = 0;
  while (out.length < 3 && guard++ < 80) {
    const k = pick(kinds);
    if (k !== 'eat' && out.some(m => m.k === k)) continue;
    const m = genMission(k, usedT);
    if (m.type) { if (usedT.includes(m.type)) continue; usedT.push(m.type); }
    m.id = 'm' + Math.random().toString(36).slice(2, 8); m.xp = 30; out.push(m);
  }
  return out;
}
export function missionsOf(id) {
  const ms = S.session.missions;
  if (!ms[id]) ms[id] = {list:newMissions(), rerolls:1};
  return ms[id];
}
export const catName = id => CATS.find(c => c.id === id)?.name.toLowerCase() || id;
export function mText(m) {
  switch (m.k) {
    case 'eat': return `Come ${m.n} × ${tname(m.type)}`;
    case 'cat': return `${m.n} de ${catName(m.cat)}`;
    case 'new': return `Prueba: ${tname(m.type)}`;
    case 'norep': return `${m.n} seguidas sin repetir tipo`;
    case 'speed': return `${m.n} piezas en ${m.mins} minutos`;
    case 'var': return `Prueba ${m.n} tipos distintos`;
    case 'cost': return `Cuesta ${money(m.n, 0)} al restaurante`;
    case 'kcal': return `Supera las ${nf0(m.n)} kcal`;
    default: return `Postre tras ${m.n} piezas`;
  }
}
export function mEval(m, c) {
  switch (m.k) {
    case 'eat': case 'new': return [c.by[m.type] || 0, m.n];
    case 'cat': return [c.cat[m.cat] || 0, m.n];
    case 'norep': return [noRepeatRun(c.log), m.n];
    case 'speed': return [bestWindow(c.log, m.mins * 60000), m.n];
    case 'var': return [c.distinct, m.n];
    case 'cost': return [c.cost, m.n, `${money(Math.min(c.cost, m.n))} / ${money(m.n, 0)}`];
    case 'kcal': return [c.kcal, m.n, `${nf0(Math.min(c.kcal, m.n))} / ${nf0(m.n)}`];
    default: { let n = 0, ok = false; for (const e of c.log) { if (catOf(e.k) === 'dessert' && n >= m.n) ok = true; n++; } return [ok ? 1 : Math.min(c.total, m.n) / m.n * .9, 1, ok ? 'Hecho' : `${Math.min(c.total, m.n)} / ${m.n}`]; }
  }
}
export function mProg(m, id) { const [cur, max, txt] = mEval(m, ctx(id)); const p = max > 0 ? Math.min(1, cur / max) : 0; return {p, txt: txt || `${Math.min(Math.floor(cur), max)} / ${max}`}; }

/* ---------- Nivel ---------- */
export const RANKS = [[1, 'Aprendiz de palillos'], [3, 'Comensal curioso'], [5, 'Habitual del buffet'], [8, 'Itamae en prácticas'], [12, 'Samurái del buffet'], [17, 'Shogun del sushi'], [23, 'Leyenda del kaiten']];
export const cumXP = l => 25 * l * (l + 1);
export function level(xp = S.xp) {
  let l = 1; while (xp >= cumXP(l)) l++;
  const from = l > 1 ? cumXP(l - 1) : 0, to = cumXP(l);
  return {l, from, to, p:(xp - from) / (to - from), rank:[...RANKS].reverse().find(r => l >= r[0])[1]};
}
export {TIER_XP};

/* ---------- Estadísticas ---------- */
const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export function heatmap() {
  const H0 = 12, H1 = 24, grid = Array.from({length:7}, () => Array(H1 - H0).fill(0));
  const put = (t, n = 1) => { const d = new Date(t), r = (d.getDay() + 6) % 7, h = d.getHours(); if (h >= H0 && h < H1) grid[r][h - H0] += n; };
  realHistory().forEach(h => { const d = meOf(h); if (!d) return; if (d.log && d.log.length) d.log.forEach(([s]) => put(h.date + s * 1000)); else put(h.date, sum(d.counts)); });
  S.session.log.filter(e => e.d === me().id).forEach(e => put(e.t));
  return {grid, days:DAYS, h0:H0, max:Math.max(1, ...grid.flat())};
}
export function favorites(n = 5) {
  const L = lifetime();
  return Object.entries(L.byType).sort((a, b) => b[1] - a[1]).slice(0, n);
}
export function compareLast() {
  const H = realHistory().sort((a, b) => a.date - b.date); if (H.length < 2) return null;
  const val = h => { const d = meOf(h); return {pieces:sum(d.counts), cost:costOf(d.counts), kcal:kcalOf(d.counts), dur:h.dur / 60000}; };
  const last = val(H[H.length - 1]), prev = H.slice(0, -1).map(val);
  const avg = Object.fromEntries(Object.keys(last).map(k => [k, prev.reduce((a, v) => a + v[k], 0) / prev.length]));
  return {last, avg};
}
// Piezas por tramo de minutos a partir de una lista de segundos desde el inicio
export function paceSeries(secs, bucketMin = 2) {
  if (!secs.length) return [];
  const n = Math.floor(Math.max(...secs) / (bucketMin * 60)) + 1, out = Array(Math.max(n, 1)).fill(0);
  secs.forEach(s => out[Math.floor(s / (bucketMin * 60))]++);
  return out;
}
export function tableRanking() {
  const R = {};
  const get = (name, color) => { const k = name.trim().toLowerCase(); return R[k] = R[k] || {name, color, sessions:0, wins:0, pieces:0, duels:0}; };
  realHistory().filter(h => h.diners.length > 1).forEach(h => {
    const tot = h.diners.map(d => sum(d.counts)), mx = Math.max(...tot);
    h.diners.forEach((d, i) => { const r = get(d.name, d.color); r.sessions++; r.pieces += tot[i]; if (tot[i] === mx && mx > 0) r.wins++; });
  });
  S.duels.forEach(d => { if (d.winner) get(d.winner, d.winnerColor || '#888').duels++; });
  return Object.values(R).sort((a, b) => b.wins + b.duels - (a.wins + a.duels) || b.pieces - a.pieces);
}

/* ---------- Exportar a CSV (Excel en español: punto y coma y coma decimal) ---------- */
export function buildCSV() {
  const dec = v => String(Math.round(v * 100) / 100).replace('.', ',');
  const q = s => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [['Fecha', 'Hora', 'Buffet', 'Precio', 'Comensal', 'Pieza', 'Categoría', 'Cantidad', 'Coste real', 'Valor en carta', 'Kcal']];
  [...S.history].filter(h => !h.ex).sort((a, b) => a.date - b.date).forEach(h => {
    const d = new Date(h.date);
    h.diners.forEach(p => Object.entries(p.counts).filter(([, n]) => n).forEach(([k, n]) => {
      const t = typeById(k);
      rows.push([ymd(d), hhmm(h.date), q(h.buffet), dec(h.price), q(p.name), q(tname(k)), q(CATS.find(c => c.id === t?.cat)?.name || ''), n, dec(n * (t?.cost || 0)), dec(n * (t?.carta || 0)), Math.round(n * (t?.kcal || 0))]);
    }));
  });
  return '﻿' + rows.map(r => r.join(';')).join('\r\n');
}

/* ---------- Lectura de tickets (texto reconocido por OCR) ---------- */
export function parseTicket(text) {
  const lines = String(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const nums = l => [...l.matchAll(/(\d{1,4})[.,](\d{2})(?!\d)/g)].map(m => parseFloat(m[1] + '.' + m[2]));
  let total = null;
  const prio = [/total\s*(a\s*pagar)?/i, /importe/i, /a\s*pagar/i, /tarjeta|visa|efectivo/i];
  for (const re of prio) {
    const l = lines.filter(x => re.test(x) && !/sub\s*total|base|iva/i.test(x)).map(nums).filter(a => a.length);
    if (l.length) { total = l[l.length - 1][l[l.length - 1].length - 1]; break; }
  }
  if (total == null) { const all = lines.flatMap(nums); if (all.length) total = Math.max(...all); }
  const pm = String(text).match(/(\d{1,2})\s*(?:x\s*)?(?:pax|comensales?|personas?|adultos?|buffets?|men[uú]s?)\b/i);
  const people = pm ? Math.max(1, Math.min(30, parseInt(pm[1], 10))) : null;
  const nameLine = lines.find(l => /[a-záéíóúñ]{3,}/i.test(l) && (l.match(/\d/g) || []).length < 3 && !/ticket|factura|fecha|hora|nif|cif|tel|mesa|camarero/i.test(l));
  const name = nameLine ? nameLine.toLowerCase().replace(/\b\p{L}/gu, c => c.toUpperCase()).slice(0, 28) : null;
  return {total, people, name};
}
