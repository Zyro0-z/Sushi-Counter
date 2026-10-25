// Estado persistente de la app (localStorage) y migraciones entre versiones.
import {DEFAULT_TYPES, DINER_COLORS, OLD_NAMES} from './catalog.js';

export const KEY = 'sushi-counter.v1';
export const VERSION = 3;

export let S;
// Sustituye el estado entero (importar copia, restablecer, pruebas)
export function setState(v) { S = v; }

const rid = () => Math.random().toString(36).slice(2, 8);

export function examples() {
  const D = 86400000, now = Date.now();
  const mk = (ago, buffet, price, mins, diners) => ({id:'ex' + ago, ex:true, date:now - ago * D, buffet, price, dur:mins * 60000, diners});
  return [
    mk(23, 'Kyoto Garden', 17.5, 68, [{me:true, name:'Tú', color:'#FA5D3C', counts:{nigiri:9, maki:8, uramaki:10, sashimi:5, gyoza:4, mochi:1}, medals:['c10','c25']}]),
    mk(15, 'Sakura Wok', 19.9, 84, [{me:true, name:'Tú', color:'#FA5D3C', counts:{nigiri:14, nigiri_atun:4, uramaki:12, sashimi:9, gunkan:4, tempura:3, pato:2, mochi:2}, medals:['c10','c25','c50','carta']}, {name:'Lucía', color:'#0A84FF', counts:{nigiri:8, california:9, sashimi:12, edamame:2}, medals:['c10','c25']}]),
    mk(6, 'Kyoto Garden', 17.5, 95, [{me:true, name:'Tú', color:'#FA5D3C', counts:{nigiri:18, maki:10, uramaki:14, sashimi:15, gunkan:5, temaki:2, gyoza:6, pollo_teriyaki:2, mochi:2}, medals:['c10','c25','c50','meta','carta','purista','maraton']}]),
  ];
}

export const freshSession = () => ({start:null, log:[], done:{}, missions:{}, buffetId:null, slot:null, priceOverride:null, record:false, trial:null, kcalWarned:0, roulette:null});

export function fresh() {
  return {
    v:VERSION,
    settings:{
      cur:'EUR', goal:40, theme:'system', skin:'ios', accent:'sake', layout:'compact',
      sound:'theme', notify:'all', menuHint:true, detect:true, reader:'', readerGoogle:false, readerAt:0, haptics:true, awake:true, mascot:true, motion:'full', textSize:'auto', contrast:false,
      allergens:[], allergenMode:'mark', kcalAlert:false, kcalLimit:2000, title:null,
      introSeen:false, hintSwipe:false, lastBackup:0, tiltAsked:false,
    },
    buffets:[{id:'b1', name:'Buffet libre', prices:{noon:15.9, night:18.9, weekend:19.9}}],
    buffetId:'b1',
    types: DEFAULT_TYPES.map(t => ({...t})),
    diners:[{id:'d1', name:'Tú', color:DINER_COLORS[0]}],
    active:'d1',
    session:freshSession(),
    history:examples(), custom:[], trophies:{}, ach:{}, xp:0,
    duels:[], trials:[], stats:{roulette:0, rouletteEaten:0, shares:0},
    share:{code:null, dev:rid() + rid()},
  };
}

export function migrate(s) {
  const f = fresh();
  const old = s.settings || {};
  s.settings = {...f.settings, ...old};
  // v1/v2 → v3
  if (typeof old.sound === 'boolean') s.settings.sound = old.sound ? 'theme' : 'off';
  if (!['compact', 'big', 'list'].includes(s.settings.layout)) s.settings.layout = 'compact';
  if (!Array.isArray(s.buffets) || !s.buffets.length) {
    const p = typeof old.price === 'number' ? old.price : 18.9;
    s.buffets = [{id:'b1', name:old.buffet || 'Buffet libre', prices:{noon:p, night:p, weekend:p}}];
    s.buffetId = 'b1';
  }
  delete s.settings.buffet; delete s.settings.price; delete s.settings.carta;
  if (!s.buffets.find(b => b.id === s.buffetId)) s.buffetId = s.buffets[0].id;

  const byId = Object.fromEntries((s.types || []).map(t => [t.id, t]));
  const base = DEFAULT_TYPES.map(def => {
    const o = byId[def.id]; if (!o) return {...def};
    const t = {...def, ...o, cat:def.cat, unit:def.unit, mac:def.mac, al:o.al || def.al};
    if (o.cost == null) t.cost = def.cost;
    if (o.carta == null) t.carta = def.carta;
    if (OLD_NAMES[def.id] && o.name === OLD_NAMES[def.id]) t.name = def.name;
    if (def.id === 'edamame' && o.kcal === 30) t.kcal = def.kcal;
    t.fav = !!o.fav;
    return t;
  });
  const customs = (s.types || []).filter(t => t.tpl && !DEFAULT_TYPES.some(d => d.id === t.id));
  s.types = [...base, ...customs];

  if (!Array.isArray(s.diners) || !s.diners.length) s.diners = f.diners;
  if (!s.diners.find(d => d.id === s.active)) s.active = s.diners[0].id;
  s.session = {...freshSession(), ...(s.session || {})};
  s.session.log = s.session.log || []; s.session.done = s.session.done || {}; s.session.missions = s.session.missions || {};
  s.history = (s.history || []).map(h => { h.diners = h.diners || []; if (h.diners.length && !h.diners.some(d => d.me)) h.diners[0].me = true; return h; });
  s.custom = s.custom || []; s.trophies = s.trophies || {}; s.ach = s.ach || {}; s.xp = s.xp || 0;
  s.duels = s.duels || []; s.trials = s.trials || []; s.stats = {...f.stats, ...(s.stats || {})};
  s.share = {...f.share, ...(s.share || {})};
  s.v = VERSION;
  return s;
}

const hasLS = () => { try { return typeof localStorage !== 'undefined'; } catch (e) { return false; } };
export function load() {
  try { if (hasLS()) { const raw = localStorage.getItem(KEY); if (raw) return migrate(JSON.parse(raw)); } } catch (e) {}
  return fresh();
}
let saveT;
export function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 120); }
export function saveNow() { try { if (hasLS()) localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

S = load();
