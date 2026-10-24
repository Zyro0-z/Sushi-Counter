// Pruebas de la lógica sin interfaz: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import {S, setState, fresh, migrate, freshSession} from '../js/store.js';
import {bestWindow, noRepeatRun, costOf, kcalOf, macrosOf, slotFor, priceNow, parseTicket, buildCSV, newMissions,
  level, cumXP, evalCh, CH, ctx, lifetime, streakInfo, heatmap, tableRanking, visibleTypes, weekKey} from '../js/logic.js';

const reset = () => { const s = fresh(); s.history = []; setState(s); return s; };
const at = (y, m, d, h = 13) => new Date(y, m - 1, d, h).getTime();

test('mejor tramo de tiempo y racha sin repetir', () => {
  const log = [0, 10, 20, 200, 205].map(s => ({t:s * 1000, k:'a'}));
  assert.equal(bestWindow(log, 60000), 3);
  assert.equal(bestWindow(log, 1000), 1);
  const ks = ['a', 'b', 'c', 'a', 'd', 'e', 'f'].map((k, i) => ({t:i, k}));
  assert.equal(noRepeatRun(ks), 6);
});

test('coste, calorías y macros a partir del catálogo', () => {
  reset();
  assert.equal(Math.round(costOf({nigiri:10}) * 100) / 100, 2.4);
  assert.equal(kcalOf({nigiri:2, maki:2}), 190);
  const [p, c, f] = macrosOf({nigiri:1});
  assert.ok(Math.abs(p * 4 + c * 4 + f * 9 - 60) < 2, 'las macros cuadran con las kcal');
});

test('franja de precio según día y hora', () => {
  assert.equal(slotFor(new Date(2026, 9, 21, 13)), 'noon');   // miércoles
  assert.equal(slotFor(new Date(2026, 9, 21, 21)), 'night');
  assert.equal(slotFor(new Date(2026, 9, 24, 13)), 'weekend'); // sábado
  const s = reset();
  s.session.start = at(2026, 10, 24); // sábado
  assert.equal(priceNow(), s.buffets[0].prices.weekend);
  s.session.priceOverride = 21.5;
  assert.equal(priceNow(), 21.5);
});

test('lectura de tickets', () => {
  const t = `RESTAURANTE KYOTO GARDEN\nC/ Mayor 3\n2 x BUFFET NOCHE 37,80\nBEBIDAS 6,40\nSUBTOTAL 44,20\nIVA 10% 4,02\nTOTAL 44,20\nTARJETA 44,20`;
  const r = parseTicket(t);
  assert.equal(r.total, 44.2);
  assert.equal(r.people, 2);
  assert.equal(r.name, 'Restaurante Kyoto Garden');
  assert.equal(parseTicket('sin números').total, null);
});

test('CSV con punto y coma, coma decimal y BOM', () => {
  const s = reset();
  s.history.push({id:'h1', date:at(2026, 10, 10, 21), buffet:'Sakura', price:18.9, dur:3600000, diners:[{me:true, name:'Tú', color:'#000', counts:{nigiri:3}}]});
  const csv = buildCSV();
  assert.ok(csv.startsWith('﻿Fecha;Hora;Buffet'));
  assert.match(csv, /"Nigiri salmón";"Nigiri y sashimi";3;0,72;7,5;180/);
});

test('migración desde la versión 2', () => {
  const old = {v:2, settings:{buffet:'Kyoto', price:17.5, sound:false, layout:'grid'}, types:[{id:'nigiri', name:'Nigiri', kcal:60, cost:.3, on:true}],
    diners:[{id:'d1', name:'Ana', color:'#f00'}], active:'d1', session:{start:null, log:[], done:{}}, history:[{id:'x', date:1, buffet:'K', price:10, dur:1, diners:[{name:'Ana', counts:{}}]}]};
  const s = migrate(old);
  assert.equal(s.v, 3);
  assert.equal(s.buffets[0].name, 'Kyoto');
  assert.equal(s.buffets[0].prices.night, 17.5);
  assert.equal(s.settings.sound, 'off');
  assert.equal(s.settings.layout, 'compact');
  const n = s.types.find(t => t.id === 'nigiri');
  assert.equal(n.name, 'Nigiri salmón');
  assert.equal(n.cost, .3, 'conserva el coste editado');
  assert.ok(n.mac && n.al, 'añade nutrición y alérgenos');
  assert.equal(s.types.length, 30);
  assert.equal(s.history[0].diners[0].me, true);
});

test('misiones: tres y sin repetir tipo de reto', () => {
  reset();
  for (let i = 0; i < 20; i++) {
    const m = newMissions();
    assert.equal(m.length, 3);
    const kinds = m.filter(x => x.k !== 'eat').map(x => x.k);
    assert.equal(new Set(kinds).size, kinds.length);
    const types = m.filter(x => x.type).map(x => x.type);
    assert.equal(new Set(types).size, types.length);
  }
});

test('niveles', () => {
  reset();
  assert.equal(level(0).l, 1);
  assert.equal(level(cumXP(1)).l, 2);
  assert.equal(level(cumXP(4) - 1).l, 4);
  assert.equal(level(cumXP(30)).rank, 'Leyenda del kaiten');
});

test('desafíos de sesión', () => {
  const s = reset();
  const t0 = Date.now() - 60000;
  s.session.start = t0;
  for (let i = 0; i < 10; i++) s.session.log.push({t:t0 + i * 1000, d:'d1', k:i % 2 ? 'maki' : 'nigiri'});
  const c10 = CH.find(c => c.id === 'c10'), samurai = CH.find(c => c.id === 'samurai');
  assert.equal(evalCh(c10, 'd1').p, 1);
  assert.equal(evalCh(samurai, 'd1').p, 1);
  assert.equal(ctx('d1').total, 10);
});

test('la vida del propietario ignora los ejemplos', () => {
  const s = fresh(); setState(s);
  assert.equal(lifetime().sessions, 0);
  s.history.push({id:'r', date:Date.now(), buffet:'A', price:10, dur:60000, diners:[{me:true, name:'Tú', counts:{gyoza:5}}]});
  const L = lifetime();
  assert.equal(L.sessions, 1); assert.equal(L.byType.gyoza, 5);
});

test('racha semanal y semana que empieza en lunes', () => {
  const s = reset();
  assert.equal(weekKey(new Date(2026, 9, 25, 12).getTime()), '2026-10-19'); // domingo → lunes 19
  const now = Date.now();
  [0, 7, 14].forEach(d => s.history.push({id:'w' + d, date:now - d * 86400000, buffet:'A', price:1, dur:1, diners:[{me:true, name:'Tú', counts:{maki:1}}]}));
  assert.ok(streakInfo().weeks >= 3);
});

test('mapa de calor y ranking de la mesa', () => {
  const s = reset();
  const d = new Date(2026, 9, 21, 21, 0).getTime(); // miércoles 21:00
  s.history.push({id:'a', date:d, buffet:'A', price:1, dur:1, diners:[{me:true, name:'Tú', color:'#f00', counts:{maki:4}, log:[[0, 'maki'], [60, 'maki'], [120, 'maki'], [3700, 'maki']]}, {name:'Lu', color:'#00f', counts:{maki:2}}]});
  const hm = heatmap();
  assert.equal(hm.grid[2][21 - hm.h0], 3);
  assert.equal(hm.grid[2][22 - hm.h0], 1);
  const rk = tableRanking();
  assert.equal(rk[0].name, 'Tú'); assert.equal(rk[0].wins, 1);
});

test('alérgenos: ocultar piezas marcadas', () => {
  const s = reset();
  const all = visibleTypes().length;
  s.settings.allergens = ['crustaceos']; s.settings.allergenMode = 'hide';
  const hidden = all - visibleTypes().length;
  assert.ok(hidden >= 4, 'oculta ebi, california, dragon y tempura');
  assert.ok(!visibleTypes().some(t => t.id === 'ebi'));
});
