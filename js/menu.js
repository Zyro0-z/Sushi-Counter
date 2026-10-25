// Lectura de cartas: convierte el texto de una web, un PDF o una foto en platos.
// Cada plato recibe su sección de la carta, la pieza parecida del catálogo (para el dibujo, el coste y
// las calorías) y sus detalles (flambeado, frito, picante…). Sin dependencias del navegador: se prueba con node.
import {DEFAULT_TYPES, CATS} from './catalog.js';

export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9&+/ ]+/g, ' ').replace(/\s+/g, ' ').trim();
const DEF = Object.fromEntries(DEFAULT_TYPES.map(t => [t.id, t]));

/* ---------- Secciones de la carta ---------- */
const SECTIONS = [
  ['skip', /\b(bebidas?|vinos?|cervezas?|refrescos?|cafes?|licores?|cocteles?|infusiones?|para beber)\b/],
  ['dessert', /\b(postres?|dulces?|helados?)\b/],
  ['side', /\b(entrantes?|aperitivos?|para picar|ensaladas?|sopas?|primeros?|dim sum|al vapor|vapor|tapas?)\b/],
  ['nigiri', /\b(nigiris?|niguiris?|sashimis?|tatakis?|gunkans?|tartares?|tartar|ceviches?|carpaccios?|usuzukuri)\b/],
  ['roll', /\b(makis?|uramakis?|rolls?|temakis?|futomakis?|hosomakis?|california|sushis?)\b/],
  ['hot', /\b(calientes?|cocina|planchas?|fritos?|frituras?|wok|tempuras?|tallarines|fideos|arroces|arroz|carnes?|pollo|pato|mariscos?|segundos?|principales?|yakitori|teppanyaki|robata|ramen|udon|brasa|parrilla|platos)\b/],
];
// Palabras que pueden formar un título de sección sin ser un plato
const HEAD_WORDS = new Set(('y e de del la las los el nuestros nuestras nuestro especiales especial variados variadas frios frias calientes caliente japoneses japonesa japones chinos chino ' +
  'buffet carta menu menus libre casa sugerencias recomendados novedades piezas pieza unidades uds u plato platos cocina sushi seleccion clasicos clasicas otros otras para todos 2 4 6 8 ' +
  'nigiris nigiri niguiris sashimis sashimi tatakis tataki gunkans gunkan tartar tartares ceviches ceviche carpaccios usuzukuri makis maki uramakis uramaki rolls roll temakis temaki futomakis ' +
  'hosomakis california sushis entrantes entrante aperitivos aperitivo picar ensaladas ensalada sopas sopa primeros dim sum vapor tapas postres postre dulces dulce helados helado fritos frito ' +
  'frituras wok tempuras tempura tallarines fideos arroces arroz carnes carne pollo pato mariscos marisco segundos principales yakitori teppanyaki robata ramen udon brasa parrilla bebidas bebida ' +
  'vinos cervezas refrescos cafes licores cocteles infusiones beber al la plancha a').split(' '));
const GEN_HEAD = new Set('sushi wok cocina carta menu buffet vapor parrilla brasa teppanyaki robata dim sum picar beber'.split(' '));
export function sectionOf(text) { const n = norm(text); for (const [c, re] of SECTIONS) if (re.test(n)) return c; return null; }

/* ---------- Platos: pieza parecida, proteína y detalles ---------- */
const RULES = [
  [/gunkan/, 'gunkan'], [/temaki/, 'temaki'], [/onigiri/, 'onigiri'], [/futo ?maki/, 'futomaki'], [/dragon/, 'dragon'],
  [/california/, 'california'], [/ura ?maki|\brolls?\b/, 'uramaki'], [/hoso ?maki|\bmakis?\b/, 'maki'],
  [/tataki/, 'tataki'], [/sashimi|tartar|ceviche|carpaccio|usuzukuri|\bpoke\b/, 'sashimi'], [/nigiri|niguiri|nigri/, 'nigiri'],
  [/gyoza|gyosa|jiaozi|dumpling|empanadilla|wonton|siu mai|shumai|har gow/, 'gyoza'], [/takoyaki/, 'takoyaki'],
  [/karaage|kara age|pollo frito|pollo crujiente|alitas|nuggets?/, 'karaage'], [/\bbaos?\b/, 'bao'],
  [/rollitos?|harumaki|spring rolls?|rollos? de primavera|nem\b/, 'rollito'], [/\bpato\b/, 'pato'],
  [/yakisoba|tallarin|fideos?|udon|ramen|noodles?|\bsoba\b|chow mein|pad thai/, 'yakisoba'], [/arroz|chaufa|yakimeshi|tres delicias|bibimbap/, 'arroz_frito'],
  [/tempura|langostinos? rebozados?|gambas? rebozadas?/, 'tempura'], [/edamame/, 'edamame'],
  [/\bmiso\b|\bsopa\b/, 'miso'], [/wakame|algas?|ensalada/, 'wakame'],
  [/mochi|daifuku/, 'mochi'], [/helado|sorbete|copa de/, 'helado'],
  [/tarta|pastel|brownie|\bflan\b|dorayaki|bizcocho|coulant|natillas|crema catalana|tiramisu|cheesecake|profiteroles?|pudin/, 'tarta'],
  [/fruta|\bpina\b|lichis?|\bmelon\b|sandia|fresas?|macedonia/, 'fruta'],
  [/pollo|yakitori|brochetas?|pinchos?|teriyaki/, 'pollo_teriyaki'],
  [/ternera|cerdo|costillas?|buey|wagyu|cordero|\bcarne\b|chuleta/, 'carne'],
  [/tofu|verduras?|salteados?|\bwok\b|berenjena|setas|champinon/, 'plato'],
  [/langostinos?|gambas?|calamar|pulpo|mejillon|almejas?|vieiras?|navajas?|sepia|chipiron/, 'marisco'],
];
// Proteína: color del dibujo y ajuste del coste
const PROT = [
  ['atun', /\batun\b|\btuna\b|maguro|toro\b/, '#D2304A', 1.25],
  ['anguila', /anguila|unagi/, '#8E4B22', 1.5],
  ['langostino', /langostino|gamba|\bebi\b|camaron|prawn|shrimp/, '#FF8A5C', 1],
  ['blanco', /pez mantequilla|butterfish|pez blanco|dorada|lubina|corvina|pez limon|hamachi|lenguado|bacalao|rodaballo|merluza/, '#F2EBE1', .85],
  ['pulpo', /pulpo|\btako\b/, '#C9566E', 1.1],
  ['calamar', /calamar|\bika\b|sepia|chipiron/, '#F1EEE8', .8],
  ['vieira', /vieira|hotate/, '#F3E2C6', 1.6],
  ['huevas', /huevas|masago|tobiko|ikura/, '#FF8A1F', 1.2],
  ['surimi', /surimi|cangrejo|kanikama|palitos/, '#F2564A', .55],
  ['foie', /\bfoie\b/, '#E2BE98', 2],
  ['salmon', /salmon|\bsake\b|\bsalmo\b/, '#FF7D57', 1],
  ['pollo', /pollo|chicken/, '#C98A4B', .7],
  ['ternera', /ternera|buey|wagyu|vaca|cerdo|carne|cordero/, '#8E3B2A', 1.2],
  ['pato', /\bpato\b/, '#8A341A', 1.6],
  ['veg', /aguacate|pepino|verdura|vegetal|vegano|kanpyo|tamago|tortilla|tofu|mango|esparrago|calabacin/, '#9BC94F', .5],
];
export const MODS = [
  ['flame', /flamb|flame|soplete|aburi|gratinad|torch/, 'Flambeado'],
  ['crispy', /frit|crujient|tempura|rebozad|panko|crunch|crispy|kataifi|empanad/, 'Crujiente'],
  ['spicy', /picant|spicy|kimchi|sriracha|chile|chili|jalape|guindilla/, 'Picante'],
  ['cheese', /queso|philadelphia|cream cheese|cheese|mozzarella|parmesan|cheddar/, 'Con queso'],
  ['sauce', /teriyaki|mayonesa|\bmayo\b|salsa|ponzu|sweet chili|\bmiel\b|\btare\b|hoisin|tartara/, 'Con salsa'],
  ['truffle', /trufa|truffle/, 'Con trufa'],
  ['fruit', /mango|fresa|maracuya|\bpina\b|manzana|frutos rojos/, 'Con fruta'],
  ['foie', /\bfoie\b/, 'Con foie'],
];
export const MOD_NAME = Object.fromEntries(MODS.map(([k, , n]) => [k, n]));
const MOD_FX = {flame:{k:5, c:.02}, crispy:{k:35, c:.04, al:['gluten', 'huevo']}, spicy:{k:15, c:.01, al:['huevo']}, cheese:{k:25, c:.05, al:['lacteos']},
  sauce:{k:15, c:.01, al:['soja', 'gluten']}, truffle:{k:5, c:.12}, fruit:{k:8, c:.04}, foie:{k:45, c:.35}};
// Pieza parecida para las que no están en el catálogo (dibujo genérico)
const GENERIC = {
  tarta:{cat:'dessert', kcal:280, cost:.45, carta:4.5, unit:'ración', mac:[5, 30, 15], al:['gluten', 'huevo', 'lacteos']},
  plato:{cat:'hot', kcal:260, cost:.6, carta:7, unit:'plato', mac:[8, 30, 11], al:['soja', 'gluten']},
  carne:{cat:'hot', kcal:320, cost:1.1, carta:9, unit:'plato', mac:[24, 12, 18], al:['soja', 'gluten']},
  marisco:{cat:'hot', kcal:190, cost:1.2, carta:9, unit:'ración', mac:[18, 8, 9], al:['crustaceos', 'moluscos']},
};
// Plantilla de dibujo cuando la proteína no es la de la pieza del catálogo
const TPL_OF = {nigiri:'nigiri', sashimi:'sashimi', maki:'maki', uramaki:'uramaki', california:'uramaki', temaki:'temaki', gunkan:'gunkan', pollo_teriyaki:'brocheta', karaage:'bola'};
const OWN = {nigiri:'salmon', sashimi:'salmon', maki:'salmon', uramaki:'salmon', temaki:'salmon', gunkan:'huevas', tempura:'langostino', pollo_teriyaki:'pollo', karaage:'pollo', california:'surimi',
  tataki:'atun', nigiri_atun:'atun', sashimi_atun:'atun', nigiri_anguila:'anguila', ebi:'langostino', pato:'pato', carne:'ternera', bao:'cerdo', yakisoba:'pollo', arroz_frito:'pollo'};
const PIECE_UNITS = ['pieza', 'lámina', 'bola', 'cono'];

export function classify(name, desc = '', section = null) {
  const n = norm(name), all = norm(name + ' ' + desc);
  let like = null; for (const [re, id] of RULES) if (re.test(n)) { like = id; break; }
  if (!like) for (const [re, id] of RULES) if (re.test(all)) { like = id; break; }
  const protIn = s => PROT.find(p => p[1].test(s));
  const prot = protIn(n) || protIn(all) || null;
  // Variantes del catálogo según la proteína
  if (like === 'nigiri' && prot) like = {atun:'nigiri_atun', anguila:'nigiri_anguila', langostino:'ebi'}[prot[0]] || 'nigiri';
  if (like === 'sashimi' && prot && prot[0] === 'atun') like = 'sashimi_atun';
  if (like === 'pollo_teriyaki' && prot && prot[0] === 'ternera') like = 'carne';
  const g = GENERIC[like], d = DEF[like];
  let cat = d ? d.cat : g ? g.cat : null;
  if (!cat) cat = section && section !== 'skip' ? section : null;
  if (!cat) return null;
  // Calientes y entrantes: manda la sección de la carta (unas gyozas pueden ser entrante o plato caliente)
  if ((cat === 'hot' || cat === 'side') && (section === 'hot' || section === 'side')) cat = section;
  const mods = MODS.filter(([k, re]) => re.test(all) && !(k === 'crispy' && ['tempura', 'karaage', 'rollito', 'takoyaki'].includes(like)) && !(k === 'cheese' && cat === 'dessert') && !(k === 'fruit' && (cat === 'dessert' || like === 'fruta')) && !(k === 'sauce' && like === 'pollo_teriyaki')).map(m => m[0]);
  // Identidad para los desafíos: solo cuenta como la pieza del catálogo si es la misma proteína
  const own = OWN[like], same = !prot || !own || prot[0] === own;
  let base = like;
  if (!same) base = {nigiri:'nigiri_x', sashimi:'sashimi_x', tempura:'tempura_x', karaage:'karaage', pollo_teriyaki:'pollo_teriyaki'}[like] || like;
  if (like === 'pollo_teriyaki' && prot && prot[0] !== 'pollo') base = 'carne';
  const tpl = !same && TPL_OF[like] ? TPL_OF[like] : null;
  return {like:d || g ? like : 'plato', base, cat, mods, prot:prot ? prot[0] : null, color:tpl ? prot[2] : null, tpl, costF:prot && !same && own ? prot[3] : 1};
}

/* ---------- Limpieza de una línea ---------- */
const SKIP_LINE = /\b(buffet|adultos?|ninos?|infantil|menores?|menu del dia|iva|reservas?|reservar|horarios?|abierto|cerrado|telefono|tel|direccion|alergenos?|alergias|cookies|politica|privacidad|copyright|derechos|siguenos|instagram|facebook|tiktok|whatsapp|pedidos?|domicilio|recoger|envio|google|mapa|login|carrito|suplemento|consultar|precio por persona|todos los|incluye|bebida no incluida|lunes|martes|miercoles|jueves|viernes|sabados?|domingos?|festivos?|mediodia|cena|noches?|fines? de semana)\b/;
const DRINK = /\b(agua|refrescos?|coca ?cola|fanta|sprite|cervezas?|vinos?|cafes?|zumos?|licor|botella|cava|champagne|sake caliente|whisky|ron|ginebra|cocktail|coctel|mojito|limonada)\b/;
const PRICE_RE = /(?:€\s*)?(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:€|eur\b|euros\b)|(?:€\s*)(\d{1,3}(?:[.,]\d{1,2})?)|\b(\d{1,3}[.,]\d{2})\s*$/i;
const PIECES_RE = /\(?\s*\b(\d{1,2})\s*(?:u|uds?|unid(?:ades)?|pz|pzs|piezas?|pcs|ud)\b\.?\s*\)?|\bx\s?(\d{1,2})\b/i;
const PROPER = {california:'California', philadelphia:'Philadelphia', pekin:'Pekín', tokio:'Tokio', osaka:'Osaka', kobe:'Kobe',};
function tidy(s) {
  s = s.replace(/\s+/g, ' ').replace(/^[\s,.;:–—-]+|[\s,.;:–—-]+$/g, '').trim();
  const words = s.split(' '), letters = s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
  const upper = letters && letters.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length / letters.length > .6;
  const titled = words.filter(w => w.length > 2 && /^[A-ZÁÉÍÓÚÑ]/.test(w)).length > Math.max(1, words.filter(w => w.length > 2).length / 2);
  if (upper || titled) s = s.toLowerCase();
  s = s.replace(/\b[a-záéíóúüñ]+\b/g, w => PROPER[norm(w)] || w);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function cleanLine(raw) {
  let s = String(raw).replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
  s = s.replace(/[*_`>#~]+/g, ' ').replace(/^\s*[-•·▪●◦○■□✓✔→>+]\s*/, '').replace(/\s+/g, ' ').trim();
  return s;
}
function isHeading(raw, s) {
  if (/^\s*#{1,6}\s/.test(raw)) return true;
  const n = norm(s.replace(PRICE_RE, ''));
  if (!n || n.length > 40) return false;
  const w = n.split(' ');
  // Un título usa palabras de sección y al menos una general o en plural ("Postres", "Sushi"); "Helado frito" es un plato
  const caps = (s.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length > (s.match(/[a-záéíóúñ]/g) || []).length * 4;
  return w.every(x => HEAD_WORDS.has(x) || /^\d+$/.test(x)) && ((caps && w.length === 1) || w.some(x => GEN_HEAD.has(x) || (x.length > 3 && x.endsWith('s') && !['las', 'los', 'nuestros', 'nuestras', 'piezas', 'unidades', 'uds'].includes(x))));
}
// Una línea → plato, o null
export function parseItem(seg, section) {
  let s = seg, price = null, pieces = null;
  const pc = s.match(PIECES_RE); if (pc) { pieces = +(pc[1] || pc[2]); s = s.replace(pc[0], ' '); }
  const pr = s.match(PRICE_RE); if (pr) { price = parseFloat((pr[1] || pr[2] || pr[3]).replace(',', '.')); s = s.replace(pr[0], ' '); }
  s = s.replace(/\s\d{1,3}[.,]\d{2}\b/g, ' ');
  // Códigos de la carta: "12.", "N3 -", "Nº 5", "A-12)"
  s = s.replace(/^\s*(?:n[º°o.]?\s*)?[a-z]{0,2}\s?-?\d{1,3}[a-z]?\s*[.):\-–]\s*/i, '').replace(/^\s*\d{1,3}\s+(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])/, '');
  let name = s, desc = '';
  const cut = s.match(/^(.{3,60}?)\s*(?::|\s[-–—]\s|\(|,\s(?=con|de|y)|\.\s)(.*)$/);
  if (cut && RULES.some(([re]) => re.test(norm(cut[1])))) { name = cut[1]; desc = cut[2].replace(/\)\s*$/, ''); }
  name = name.replace(/\(\s*\)/g, ' ').replace(/[()]/g, ' ');
  const n = norm(name);
  if (n.length < 3 || n.length > 64 || n.split(' ').length > 10) return null;
  if (DRINK.test(n) || SKIP_LINE.test(n) || /^\d+$/.test(n) || /https?|www|@/.test(name)) return null;
  const c = classify(name, desc, section);
  if (!c) return null;
  // Sin palabra clave de plato, solo vale dentro de una sección conocida y si parece un nombre corto
  const known = RULES.some(([re]) => re.test(n) || re.test(norm(desc)));
  if (!known && (!section || section === 'skip' || n.split(' ').length > 6)) return null;
  return {name:tidy(name), desc:desc.trim().slice(0, 120), price, pieces, ...c};
}

/* ---------- Carta completa ---------- */
export function parseMenu(text) {
  const items = [], seen = new Set();
  let section = null, sectionName = '';
  for (const raw of String(text).split(/\r?\n/)) {
    if (/^\s*(Title|URL Source|Markdown Content|Published Time|Warning):/i.test(raw)) continue;
    const segs = raw.includes('|') ? raw.split('|') : raw.split(/\s[·•|]\s|\t+|\s{3,}/);
    for (const part of segs) {
      const s = cleanLine(part); if (!s || /^[-:| ]+$/.test(s)) continue;
      if (isHeading(segs.length === 1 ? raw : part, s)) {
        const c = sectionOf(s);
        if (c || /^\s*#/.test(raw)) { section = c; sectionName = c && c !== 'skip' ? tidy(s.replace(PRICE_RE, '').replace(PIECES_RE, '')) : ''; }
        continue;
      }
      if (s.length > 140) continue;
      const it = parseItem(s, section); if (!it) continue;
      const key = norm(it.name).replace(/s\b/g, '');
      if (seen.has(key)) continue; seen.add(key);
      it.sec = sectionName || CATS.find(c => c.id === it.cat).name;
      items.push(it);
    }
  }
  return {items, prices:buffetPrices(text)};
}

/* ---------- Precio del buffet escrito en la carta ---------- */
export function buffetPrices(text) {
  const lines = String(text).split(/\r?\n/).map(cleanLine), out = {};
  lines.forEach((l, i) => {
    const n = norm(l), ctxt = norm(lines.slice(Math.max(0, i - 2), i + 1).join(' '));
    if (/nino|infantil|menor|cm\b|bebida|suplemento/.test(n)) return;
    const vals = [...l.matchAll(/(\d{1,2}[.,]\d{2})\s*€?|€\s*(\d{1,2}[.,]\d{2})/g)].map(m => parseFloat((m[1] || m[2]).replace(',', '.'))).filter(v => v >= 8 && v <= 60);
    if (!vals.length || !/buffet|adulto|persona|libre|menu|precio|mediodia|noche|semana|festivo|cena|comida/.test(ctxt)) return;
    const v = vals[0];
    const noon = /mediodia|medio dia|comida|almuerzo|lunes a viernes|de lunes|laborables/.test(n), night = /noche|cena/.test(n), wk = /fin(es)? de semana|festivo|sabado|domingo/.test(n);
    if (noon && out.noon == null) out.noon = v;
    if (night && out.night == null) out.night = v;
    if (wk && out.weekend == null) out.weekend = v;
    if (!noon && !night && !wk && out.any == null) out.any = v;
  });
  if (out.any != null) { ['noon', 'night', 'weekend'].forEach(k => { if (out[k] == null) out[k] = out.any; }); }
  delete out.any;
  return out;
}

/* ---------- Enlaces a la carta dentro de una web ---------- */
export function findMenuLinks(text, base) {
  const out = [], seen = new Set();
  for (const m of String(text).matchAll(/\[([^\]]{0,80})\]\(([^)\s]+)\)/g)) {
    const label = norm(m[1]), href = m[2];
    let url; try { url = new URL(href, base); } catch (e) { continue; }
    if (!/^https?:$/.test(url.protocol)) continue;
    const u = norm(url.href);
    if (/reserv|pedido|delivery|glovo|uber|just ?eat|instagram|facebook|tripadvisor|google|maps|wa me|cookies|privacidad|legal|aviso|login|\bcart\b|carrito|blog|trabaja/.test(u + ' ' + label)) continue;
    const pdf = /\.pdf(\b|$)/i.test(url.pathname);
    const score = (pdf ? 3 : 0) + (/carta|menu|buffet/.test(label) ? 3 : 0) + (/carta|menu|buffet|sushi|platos/.test(norm(url.pathname)) ? 2 : 0) + (base && url.host === new URL(base).host ? 1 : 0);
    if (score < 2) continue;
    const key = url.href.replace(/#.*$/, ''); if (seen.has(key) || key === base) continue; seen.add(key);
    out.push({url:key, score});
  }
  return out.sort((a, b) => b.score - a.score).map(x => x.url).slice(0, 4);
}

/* ---------- Plato → pieza del contador ---------- */
export function menuType(it, buffetId, i) {
  const d = DEF[it.like] || GENERIC[it.like] || GENERIC.plato;
  const fx = it.mods.map(m => MOD_FX[m]).filter(Boolean);
  const kcal = Math.round(d.kcal + fx.reduce((a, f) => a + f.k, 0));
  const cost = Math.max(.03, Math.round((d.cost * (it.costF || 1) + fx.reduce((a, f) => a + f.c, 0)) * 100) / 100);
  let al = new Set(d.al || []);
  fx.forEach(f => (f.al || []).forEach(a => al.add(a)));
  if (['pollo', 'ternera', 'pato', 'veg'].includes(it.prot)) al.delete('pescado');
  if (it.prot === 'langostino' || it.prot === 'surimi') al.add('crustaceos');
  if (['pulpo', 'calamar', 'vieira'].includes(it.prot)) al.add('moluscos');
  if (['salmon', 'atun', 'blanco', 'anguila', 'huevas'].includes(it.prot)) al.add('pescado');
  const piece = PIECE_UNITS.includes(d.unit);
  const carta = it.price ? Math.round((it.pieces ? it.price / it.pieces : piece ? Math.min(it.price, d.carta * 2) : it.price) * 100) / 100 : d.carta;
  const r = d.kcal ? kcal / d.kcal : 1;
  const t = {id:`mn_${buffetId}_${i}`, name:it.name.slice(0, 40), cat:it.cat, sec:it.sec, kcal, cost, carta, unit:d.unit, mac:(d.mac || [0, 0, 0]).map(v => Math.round(v * r * 10) / 10),
    al:[...al], on:true, fav:false, menu:buffetId, like:it.like, base:it.base, mods:it.mods};
  if (it.tpl) { t.tpl = it.tpl; t.color = it.color; }
  if (it.desc) t.desc = it.desc;
  return t;
}
