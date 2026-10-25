// Juegos y herramientas: un panel con tarjetas ilustradas, explicaciones paso a paso y la guía de uso.
// Pensado para quien abre la app por primera vez: cada cosa dice qué es, para qué sirve y cómo se usa.
import {S, save} from '../store.js';
import {ui, illu} from '../icons.js';
import {currentBuffet} from '../logic.js';
import {$, esc, app, icon, openSheet, closeSheet} from './common.js';
import {feedback} from '../fx.js';

/* ---------- Pasos de "Cómo funciona" ---------- */
const HOW = {
  ruleta:[['wheel', 'Toca <b>Girar</b> y espera a que pare.'], ['sparkles', 'La ruleta elige una pieza por ti. Da prioridad a lo que nunca has probado o aún no has pedido hoy.'], ['plus', 'Si la pides, toca <b>Añadir ahora</b>: suma la pieza y cuenta para el logro de la ruleta.']],
  duelo:[['people', 'Elegid quién juega en la mitad de abajo y quién en la de arriba.'], ['swords', 'Dejad el móvil en medio de la mesa. Cada uno toca las piezas de su lado.'], ['timer', 'Tras la cuenta atrás 3, 2, 1, gana quien más sume antes de que acabe el tiempo.']],
  reloj:[['target', 'Elige un reto: cuántas piezas y en cuántos minutos.'], ['plus', 'Suma piezas como siempre. Abajo verás el tiempo y lo que llevas.'], ['star', 'Si llegas a tiempo, ganas una medalla. Puedes cancelarlo con la ✕.']],
  mesa:[['plus', 'Una persona toca <b>Crear mesa</b> y comparte el código o el enlace.'], ['link', 'Los demás abren el enlace, o entran aquí y escriben el código.'], ['people', 'Cada uno cuenta en su móvil y veis los marcadores de todos arriba, en directo.']],
  ticket:[['camera', 'Haz una foto al ticket entero, recto y con buena luz.'], ['doc', 'La app lee el total y cuántas personas sois.'], ['check', 'Revisa los números y guárdalos: así sabrás si has amortizado el buffet.']],
};
const ICONS_FOR = {target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'};
const stepIc = k => ICONS_FOR[k] ? `<svg viewBox="0 0 24 24" class="mono" aria-hidden="true">${ICONS_FOR[k]}</svg>` : ui(k);
// Bloque desplegable: abierto las dos primeras veces, luego plegado
export function howBlock(key) {
  const seen = S.settings.howSeen || (S.settings.howSeen = {}), n = seen[key] || 0;
  seen[key] = n + 1; save();
  return `<details class="how"${n < 2 ? ' open' : ''}><summary>${ui('info')}<span>Cómo funciona</span>${ui('chevD', 'how-chev')}</summary>
    <ol>${HOW[key].map(([ic, t], i) => `<li><span class="how-n">${i + 1}</span><span class="how-ic">${stepIc(ic)}</span><span class="how-t">${t}</span></li>`).join('')}</ol></details>`;
}

/* ---------- Escanear ticket: explicación antes de abrir la cámara ---------- */
export function scanIntro() {
  openSheet({title:'Escanear ticket', cancel:'Cerrar', body:`
    <div class="sh-hero">${illu('ticket', 'hero-illu')}<h4>Apunta lo que habéis pagado</h4><p>Con una foto del ticket, la app calcula el precio por persona.</p></div>
    ${howBlock('ticket')}
    <button class="btn" id="scGo">${ui('camera')}Hacer foto o elegir imagen</button>
    <p class="gfoot">La foto no sale de tu móvil: el texto se lee aquí mismo. La primera vez se descarga el lector (unos 5 MB).</p>`,
    mount(el) { $('#scGo', el).onclick = () => { closeSheet(); app.scanTicket(); }; }});
}

/* ---------- Panel de juegos y herramientas ---------- */
const TILES = () => {
  const tr = S.session.trial, code = S.share.code, b = currentBuffet();
  return [
    {sec:'Para jugar', items:[
      {k:'ruleta', t:'Ruleta de sushi', d:'Gira y te dice qué pedir', c:'#E5484D', fn:() => app.roulette()},
      {k:'duelo', t:'Duelo', d:S.diners.length > 1 ? 'Dos personas, un móvil: gana quien más coma' : 'Necesita dos personas en la mesa', c:'#F5A524', fn:() => app.duelSetup()},
      {k:'reloj', t:'Contrarreloj', d:'Una meta de piezas contra el tiempo', c:'#FF5E3A', st:tr ? 'En marcha' : '', fn:() => app.trialSetup()},
    ]},
    {sec:'Para la mesa', items:[
      {k:'mesa', t:'Mesa compartida', d:'Cada uno cuenta en su móvil y lo veis todo junto', c:'#0A84FF', st:code ? `Mesa ${code}` : '', fn:() => app.shareSheet()},
      {k:'ticket', t:'Escanear ticket', d:'Haz una foto y calcula el precio por persona', c:'#30A46C', fn:scanIntro},
      {k:'buffet', t:'Restaurante y precio', d:b ? b.name : 'Elige dónde estás comiendo', c:'#8E5BD6', fn:() => app.buffetPicker()},
    ]},
    {sec:'Tu sesión', items:[
      {k:'registro', t:'Registro', d:'Todo lo que has pedido, con la hora', c:'#C8954E', fn:() => app.logSheet()},
      {k:'ayuda', t:'Guía de uso', d:'Aprende a usar la app en un minuto', c:'#0A84FF', fn:guideSheet},
    ]},
  ];
};
export function openHub() {
  const groups = TILES(), all = groups.flatMap(g => g.items);
  openSheet({title:'Juegos y herramientas', cancel:'Cerrar', cls:'hub-sheet', body:`
    <p class="hub-intro">Todo lo extra del contador. Toca una tarjeta y te explicamos cómo funciona.</p>
    ${groups.map(g => `<div class="gsec"><div class="glabel">${g.sec}</div><div class="hub-grid">${g.items.map(it => `
      <button class="hub-t" data-hub="${it.k}" style="--tc:${it.c}" aria-label="${esc(it.t)}. ${esc(it.d)}${it.st ? '. ' + esc(it.st) : ''}">
        <span class="hub-art">${illu(it.k)}</span>
        <span class="hub-tx"><b>${esc(it.t)}</b><span>${esc(it.d)}</span></span>
        ${it.st ? `<span class="hub-st">${esc(it.st)}</span>` : ''}
      </button>`).join('')}</div></div>`).join('')}`,
    mount(el) {
      el.addEventListener('click', e => {
        const t = e.target.closest('[data-hub]'); if (!t) return;
        const it = all.find(x => x.k === t.dataset.hub); feedback('tick');
        closeSheet(); setTimeout(it.fn, 420);
      });
    }});
}

/* ---------- Accesos en la pantalla del contador ---------- */
let playKey = '';
export function renderPlay() {
  const box = $('#play'); if (!box) return;
  const tr = S.session.trial, code = S.share.code, key = `${!!tr}|${code}`;
  if (key === playKey && box.firstChild) return; playKey = key;
  const items = [
    ['ruleta', 'Ruleta', 'Qué pido', () => app.roulette()],
    ['duelo', 'Duelo', 'Uno contra uno', () => app.duelSetup()],
    ['reloj', 'Contrarreloj', tr ? 'En marcha' : 'Contra el tiempo', () => app.trialSetup()],
    ['mesa', 'Mesa', code ? `Código ${code}` : 'Varios móviles', () => app.shareSheet()],
  ];
  box.innerHTML = `<div class="play-h"><span>Para jugar en la mesa</span><button class="play-all" id="playAll">Ver todo${ui('chev')}</button></div>
    <div class="play-row">${items.map(([k, t, d]) => `<button class="play-t" data-play="${k}" aria-label="${t}: ${d}">${illu(k)}<span><b>${t}</b><small>${esc(d)}</small></span></button>`).join('')}</div>`;
  box.onclick = e => {
    if (e.target.closest('#playAll')) { feedback('tick'); openHub(); return; }
    const b = e.target.closest('[data-play]'); if (!b) return;
    feedback('tick'); items.find(x => x[0] === b.dataset.play)[3]();
  };
}

/* ---------- Guía de uso ---------- */
const GUIDE = [
  ['Sumar una pieza', 'Toca la pieza. Si pides varias iguales, desliza el dedo hacia la derecha sobre ella: cuanto más lejos, más suma (hasta 4).', () => `<span class="gd-pc">${icon('nigiri')}<i class="gd-badge">+1</i></span>`],
  ['Quitar si te equivocas', 'Desliza la pieza hacia la izquierda para quitar una, o toca la flecha de deshacer arriba a la izquierda.', () => `<span class="gd-pc">${icon('maki')}<i class="gd-badge red">−1</i></span>`],
  ['Más opciones de una pieza', 'Mantén el dedo pulsado sobre una pieza: marcarla como favorita, quitar varias, ver su coste y sus alérgenos.', () => `<span class="gd-pc">${icon('gyoza')}<i class="gd-ring"></i></span>`],
  ['Varias personas', 'Arriba están los nombres de la mesa. Toca uno para contar sus piezas, o el + para añadir a alguien.', () => `<span class="gd-avs"><i style="--c:#FA5D3C">A</i><i style="--c:#0A84FF">L</i><i class="add">+</i></span>`],
  ['Misiones, desafíos y logros', 'Cada sesión trae 3 misiones nuevas. Los desafíos y logros se consiguen comiendo. Todo da puntos y te hace subir de nivel.', () => `<span class="gd-med">${illu('reloj')}</span>`],
  ['Terminar la comida', 'Al acabar, toca Terminar. Se guarda en el Historial con lo que comiste, lo que cuesta de verdad y si has amortizado el buffet.', () => `<span class="gd-med">${illu('registro')}</span>`],
  ['Juegos y herramientas', 'Toca el botón de cuadraditos arriba a la derecha: ruleta, duelo, contrarreloj, mesa compartida y escanear el ticket.', () => `<span class="gd-grid">${ui('grid')}</span>`],
];
export function guideSheet() {
  openSheet({title:'Guía de uso', cancel:'Cerrar', cls:'hub-sheet', body:`
    <div class="sh-hero">${illu('ayuda', 'hero-illu')}<h4>Cómo usar el contador</h4><p>Siete cosas y lo sabes todo. Puedes volver aquí desde Ajustes.</p></div>
    <ol class="guide">${GUIDE.map(([t, d, art], i) => `<li class="card"><span class="gd-art" aria-hidden="true">${art()}</span><span class="gd-tx"><small>Paso ${i + 1}</small><b>${t}</b><span>${d}</span></span></li>`).join('')}</ol>
    <button class="btn plain" id="gdIntro">${ui('play')}Ver la bienvenida otra vez</button>`,
    mount(el) { $('#gdIntro', el).onclick = () => { closeSheet(); setTimeout(() => app.showIntro(true), 450); }; }});
}
