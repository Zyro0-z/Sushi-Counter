// Ajustes con subpantallas al estilo iOS, y hojas para editar buffets, piezas y comensales.
import {S, save, saveNow, fresh, setState} from '../store.js';
import {CATS, ALLERGENS, DEFAULT_TYPES, DINER_COLORS, ACCENTS, SKINS, CURRENCIES, PRICE_SLOTS, TEMPLATES, FOOD_COLORS} from '../catalog.js';
import {ui, alg, TPL, medal} from '../icons.js';
import {me, initial, money, fmtDec, parseNum, nf0, typeById, sortTypes, macroOf, level, activeTitle, slotFor, currentBuffet, sessionSlot, priceNow} from '../logic.js';
import {$, $$, esc, app, icon, openSheet, closeSheet, twoStep, stepper, bindStepper, seg, bindSeg, sw, applyLook} from './common.js';
import {feedback, hud, sound} from '../fx.js';

const stack = ['root'];
const TITLES = {root:'Ajustes', buffets:'Buffets y precios', types:'Piezas', alg:'Alérgenos y nutrición', diners:'Comensales', look:'Tema y colores', a11y:'Accesibilidad', sound:'Sonido y avisos', data:'Datos y copia'};
const navRow = (page, ic, label, sub = '', color = 'var(--accent)') => `<button class="row nav-row" data-page="${page}" style="--ins:58px"><span class="ri" style="--rc:${color}">${ui(ic)}</span><span class="row-l">${label}</span>${sub ? `<span class="row-v">${sub}</span>` : ''}${ui('chev', 'chev')}</button>`;
const actRow = (id, ic, label, color = 'var(--accent)', cls = '') => `<button class="row nav-row ${cls}" id="${id}" style="--ins:58px"><span class="ri" style="--rc:${color}">${ui(ic)}</span><span class="row-l">${label}</span></button>`;

export function settingsGo(page) { stack.push(page); renderSettings('push'); }
export function settingsBack() { if (stack.length > 1) { stack.pop(); renderSettings('pop'); } }
export function settingsRoot() { stack.length = 1; }

export function renderSettings(dir) {
  const page = stack[stack.length - 1], st = S.settings;
  const back = $('#setBack'); back.hidden = stack.length < 2;
  back.innerHTML = `${ui('chevL')}<span>${TITLES[stack[stack.length - 2]] || ''}</span>`;
  $('#v-set .nav-t').textContent = TITLES[page];
  let h = `<div><h1 class="lt">${TITLES[page]}</h1></div>`;
  if (page === 'root') {
    const lv = level(), m = me();
    const vis = S.types.filter(t => t.on && !t.deleted).length, all = S.types.filter(t => !t.deleted).length;
    h += `<button class="card prof-row" id="profRow"><span class="av xl sm2" style="--c:${m.color}">${esc(initial(m.name))}</span><span class="row-main"><span class="row-t" style="font-size:20px">${esc(m.name)}</span><span class="row-d">${esc(activeTitle().t)} · nivel ${lv.l}</span></span>${ui('chev', 'chev')}</button>
    <div class="gsec"><div class="glabel">Comida</div><div class="group">
      ${navRow('buffets', 'pin', 'Buffets y precios', esc(currentBuffet().name), '#FF9500')}
      ${navRow('types', 'list', 'Piezas', `${vis} de ${all}`, '#FA5D3C')}
      ${navRow('alg', 'leaf', 'Alérgenos y nutrición', st.allergens.length ? `${st.allergens.length} marcados` : '', '#34C759')}
    </div></div>
    <div class="gsec"><div class="glabel">Partida</div><div class="group">
      <div class="row" style="--ins:58px"><span class="ri" style="--rc:#5E5CE6">${ui('star')}</span><span class="row-l">Objetivo por persona</span><span class="row-v num" id="goalV">${st.goal}</span>${stepper('goal')}</div>
      <div class="row" style="--ins:58px"><span class="ri" style="--rc:#FF2D55">${ui('sparkles')}</span><span class="row-l">Mascota Shari</span>${sw('inMascot', st.mascot, 'Mascota')}</div>
      ${navRow('diners', 'people', 'Comensales', String(S.diners.length), '#0A84FF')}
      <button class="row nav-row" id="shareRow" style="--ins:58px"><span class="ri" style="--rc:#30B0C7">${ui('cloud')}</span><span class="row-l">Mesa compartida</span><span class="row-v">${S.share.code ? 'Conectada' : 'No'}</span>${ui('chev', 'chev')}</button>
    </div></div>
    <div class="gsec"><div class="glabel">Apariencia</div><div class="group">
      ${navRow('look', 'paint', 'Tema y colores', SKINS.find(k => k.id === st.skin).name, '#AF52DE')}
      ${navRow('a11y', 'access', 'Accesibilidad', '', '#0A84FF')}
      ${navRow('sound', 'speaker', 'Sonido y avisos', {theme:'Temáticos', simple:'Simples', off:'Sin sonido'}[st.sound], '#FF3B30')}
    </div></div>
    <div class="gsec"><div class="glabel">Datos</div><div class="group">
      ${navRow('data', 'cloud', 'Copia de seguridad e iCloud', st.lastBackup ? 'Hecha' : 'Sin copia', '#8E8E93')}
      ${actRow('csvRow', 'table', 'Exportar a Excel (CSV)', '#34C759')}
      ${actRow('guideRow', 'help', 'Guía de uso', '#0A84FF')}
      ${actRow('hubRow', 'grid', 'Juegos y herramientas', '#FF9500')}
      ${actRow('introRow', 'book', 'Ver la bienvenida otra vez', '#FF9500')}
    </div><p class="gfoot">Contador de Sushi · los datos se guardan solo en este dispositivo.</p></div>`;
  }
  if (page === 'buffets') {
    const slot = slotFor(new Date());
    h += `<div class="gsec"><div class="glabel">Tus buffets</div><div class="group" id="bufList">
      ${S.buffets.map(b => `<div class="row tap" data-buf="${b.id}" style="--ins:16px;cursor:pointer" role="button" tabindex="0"><span class="row-main"><span class="row-t">${esc(b.name)}${b.id === S.buffetId ? '<em class="tag">Habitual</em>' : ''}</span>
        <span class="row-d">${PRICE_SLOTS.map(s => `${s.name} ${money(b.prices[s.id])}`).join(' · ')}</span></span>${ui('chev', 'chev')}</div>`).join('')}
      <button class="row accent" id="addBuf">${ui('plus', '', 'width:22px;height:22px')}<span class="row-l">Añadir buffet</span></button>
      <button class="row accent" id="scanRow">${ui('camera', '', 'width:22px;height:22px')}<span class="row-l">Escanear un ticket</span></button>
    </div><p class="gfoot">El precio se elige solo según el momento: mediodía (lunes a viernes antes de las 17:00), noche o fin de semana. Ahora toca «${PRICE_SLOTS.find(s => s.id === slot).name.toLowerCase()}».</p></div>
    <div class="gsec"><div class="glabel">Moneda</div><div class="group"><div class="row">${seg('cur', [['EUR', 'Euro €'], ['USD', 'Dólar $'], ['GBP', 'Libra £']], st.cur)}</div></div></div>`;
  }
  if (page === 'types') {
    h += CATS.map(c => `<div class="gsec"><div class="glabel">${c.name}</div><div class="group">
      ${sortTypes(S.types.filter(t => t.cat === c.id && !t.deleted)).map(t => `<div class="row tap" style="--ins:64px;cursor:pointer" data-type="${t.id}" tabindex="0" role="button"><span class="ricon">${icon(t.id)}</span><span class="row-l">${esc(t.name)}${t.tpl ? '<em class="tag">Tuya</em>' : ''}<span class="sub">${money(t.cost)} coste · ${money(t.carta)} carta · ${t.kcal} kcal</span></span>
        <label class="sw" aria-label="Mostrar ${esc(t.name)}"><input type="checkbox" data-ton="${t.id}" ${t.on ? 'checked' : ''}><span></span></label></div>`).join('')}
    </div></div>`).join('') + `<div class="gsec"><div class="group">
      <button class="row accent" id="newType">${ui('sparkles', '', 'width:22px;height:22px')}<span class="row-l">Crear pieza propia</span></button>
      <button class="row accent" id="resetCosts" style="justify-content:center">Restaurar costes estimados</button></div>
      <p class="gfoot">Toca una pieza para cambiar su nombre, coste, precio en carta, calorías o alérgenos.</p></div>`;
  }
  if (page === 'alg') {
    h += `<div class="gsec"><div class="glabel">Avisarme de</div><div class="group">
      ${ALLERGENS.map(a => `<div class="row" style="--ins:58px"><span class="ri" style="--rc:#FF9500">${alg(a.id)}</span><span class="row-l">${a.name}</span>${sw('al-' + a.id, st.allergens.includes(a.id), a.name)}</div>`).join('')}
    </div></div>
    <div class="gsec"><div class="glabel">Piezas con esos alérgenos</div><div class="group"><div class="row">${seg('alMode', [['mark', 'Marcarlas'], ['hide', 'Ocultarlas']], st.allergenMode)}</div></div>
      <p class="gfoot">Información orientativa según recetas habituales. Cada restaurante es distinto: pregunta siempre al personal.</p></div>
    <div class="gsec"><div class="glabel">Nutrición</div><div class="group">
      <div class="row"><span class="row-l">Avisar al pasar un límite</span>${sw('inKcal', st.kcalAlert, 'Aviso de calorías')}</div>
      <div class="row"><span class="row-l">Límite</span><span class="row-v num" id="kcalV">${nf0(st.kcalLimit)} kcal</span>${stepper('kcal')}</div>
    </div><p class="gfoot">Te avisa al 80 % y al pasarlo. Proteínas, hidratos y grasas aparecen en la tercera página de la tarjeta del contador.</p></div>`;
  }
  if (page === 'diners') {
    h += `<div class="gsec"><div class="group">
      ${S.diners.map((d, i) => `<button class="row" style="--ins:62px" data-diner="${d.id}"><span class="av md" style="--c:${d.color}">${esc(initial(d.name))}</span><span class="row-l">${esc(d.name)}${i === 0 ? '<span class="sub">Propietario: suma logros, títulos y nivel</span>' : ''}</span>${ui('chev', 'chev')}</button>`).join('')}
      <button class="row accent" id="addDiner2" style="--ins:62px"><span style="width:34px;display:grid;place-items:center">${ui('plus', '', 'width:22px;height:22px')}</span><span class="row-l">Añadir comensal</span></button>
    </div><p class="gfoot">Mantén pulsado un comensal en el contador para editarlo.</p></div>`;
  }
  if (page === 'look') {
    const skin = SKINS.find(k => k.id === st.skin), ac = ACCENTS.find(a => a.id === st.accent) || ACCENTS[0];
    h += `<div class="skins" id="skins">${SKINS.map(k => `<button class="skin${k.id === st.skin ? ' on' : ''}" data-skin="${k.id}"><span class="sk-prev sk-${k.id}"><i></i><i></i><i></i></span><b>${k.name}</b><span>${k.d}</span></button>`).join('')}</div>
    <div class="gsec"><div class="glabel">Modo</div><div class="group"><div class="row">${skin.mode ? `<span class="row-l">Siempre ${skin.mode === 'dark' ? 'oscuro' : 'claro'} con este tema</span>` : seg('theme', [['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Oscuro']], st.theme)}</div></div></div>
    ${skin.id === 'ios' || skin.id === 'minimal' ? `<div class="gsec"><div class="glabel">Color de acento</div><div class="group pad">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px"><span>${ac.name}</span><span class="row-v" id="acName">${ac.m}</span></div>
      <div class="swatches" id="acSw">${ACCENTS.map(a => `<button class="swc${a.id === st.accent ? ' on' : ''}" data-ac="${a.id}" style="--c:${a.c}" aria-label="${a.name}"></button>`).join('')}</div></div></div>` : ''}
    <div class="gsec"><div class="glabel">Piezas</div><div class="group"><div class="row">${seg('layout', [['compact', 'Compacta'], ['big', 'Grande'], ['list', 'Lista']], st.layout)}</div></div></div>`;
  }
  if (page === 'a11y') {
    h += `<div class="gsec"><div class="glabel">Tamaño del texto</div><div class="group"><div class="row">${seg('textSize', [['auto', 'Auto'], ['1', 'Normal'], ['1.15', 'Grande'], ['1.3', 'Enorme']], String(st.textSize))}</div></div>
      <p class="gfoot">«Auto» sigue el tamaño de texto que tengas en los ajustes del iPhone.</p></div>
    <div class="gsec"><div class="group">
      <div class="row"><span class="row-l">Contraste alto</span>${sw('inContrast', st.contrast, 'Contraste alto')}</div>
      <div class="row"><span class="row-l">Reducir animaciones</span>${sw('inMotion', st.motion === 'reduced', 'Reducir animaciones')}</div>
    </div><p class="gfoot">Compatible con VoiceOver: cada pieza anuncia su nombre y su cuenta, y los logros se leen en voz alta. También puedes usarla con teclado: Intro suma, Retroceso quita y la tecla de menú abre las opciones.</p></div>`;
  }
  if (page === 'sound') {
    h += `<div class="gsec"><div class="glabel">Avisos de logros</div><div class="group"><div class="row">${seg('notify', [['all', 'Todos'], ['important', 'Importantes'], ['off', 'Ninguno']], st.notify)}</div></div>
      <p class="gfoot">${{all:'Verás un aviso por cada misión, desafío o logro. Si llegan varios a la vez se juntan en uno.', important:'Solo avisan las subidas de nivel, los logros de oro y platino, los récords y el límite de calorías. El resto se guarda en Retos.', off:'No sale ningún aviso. Lo que consigas aparece con un número en la pestaña Retos.'}[st.notify]} Para quitar un aviso, deslízalo hacia arriba.</p></div>
    <div class="gsec"><div class="glabel">Sonidos</div><div class="group"><div class="row">${seg('sound', [['theme', 'Temáticos'], ['simple', 'Simples'], ['off', 'Sin sonido']], st.sound)}</div>
      <div class="row prev-row">${[['add', 'Palillos'], ['mission', 'Campanita'], ['level', 'Gong'], ['taiko', 'Taiko']].map(([k, l]) => `<button class="pill" data-snd="${k}">${ui('play')}${l}</button>`).join('')}</div></div></div>
    <div class="gsec"><div class="group">
      <div class="row"><span class="row-l">Vibración</span>${sw('inHap', st.haptics, 'Vibración')}</div>
      <div class="row"><span class="row-l">Mantener pantalla encendida</span>${sw('inAwake', st.awake, 'Mantener pantalla encendida')}</div>
    </div><p class="gfoot">La pantalla no se apaga mientras hay una sesión en marcha. Safari en iPhone no permite que las webs vibren; en Android sí funciona.</p></div>`;
  }
  if (page === 'data') {
    const lb = st.lastBackup ? new Date(st.lastBackup).toLocaleDateString('es-ES', {day:'numeric', month:'long'}) : null;
    h += `<div class="card icloud"><span class="ri big" style="--rc:#0A84FF">${ui('cloud')}</span><b>Copia en iCloud Drive</b><span>${lb ? `Última copia: ${lb}` : 'Aún no has hecho ninguna copia'}</span>
      <button class="btn" id="expData">${ui('share')}Guardar copia</button></div>
    <p class="gfoot" style="margin-top:-4px">Pulsa «Guardar copia» y elige «Guardar en Archivos › iCloud Drive». Para recuperarla en otro iPhone, usa «Importar copia» y búscala en Archivos. Al terminar una sesión te lo recordaré si hace tiempo que no copias.</p>
    <div class="gsec"><div class="group">
      <label class="row accent tap" style="cursor:pointer">${ui('doc', '', 'width:22px;height:22px')}<span class="row-l">Importar copia</span><input type="file" id="impData" accept="application/json,.json" hidden></label>
      <button class="row accent" id="csvRow2">${ui('table', '', 'width:22px;height:22px')}<span class="row-l">Exportar a Excel (CSV)</span></button>
    </div></div>
    <div class="gsec"><div class="group">
      ${S.history.some(h => h.ex) ? '<button class="row accent" id="delEx" style="justify-content:center">Quitar sesiones de ejemplo</button>' : ''}
      <button class="row danger" id="delHist">Borrar historial</button>
      <button class="row danger" id="resetAll">Restablecer todo</button>
    </div></div>`;
  }
  const body = $('#setBody');
  body.innerHTML = h;
  if (dir) { body.classList.remove('push', 'pop'); void body.offsetWidth; body.classList.add(dir); $('#v-set').scrollTop = 0; }
  wire(page, body);
}

function wire(page, root) {
  const st = S.settings;
  root.querySelectorAll('[data-page]').forEach(b => b.onclick = () => settingsGo(b.dataset.page));
  const on = (id, fn) => { const el = root.querySelector('#' + id); if (el) el.addEventListener('click', fn); };
  on('profRow', () => app.profileSheet());
  on('shareRow', () => app.shareSheet());
  on('csvRow', () => app.exportCSV()); on('csvRow2', () => app.exportCSV());
  on('introRow', () => app.showIntro(true));
  on('guideRow', () => app.guideSheet());
  on('hubRow', () => app.openHub());
  bindStepper(root, 'goal', dir => { st.goal = Math.max(5, Math.min(400, st.goal + dir * 5)); $('#goalV').textContent = st.goal; save(); app.updateCounter(); });
  bindStepper(root, 'kcal', dir => { st.kcalLimit = Math.max(500, Math.min(6000, st.kcalLimit + dir * 100)); $('#kcalV').textContent = nf0(st.kcalLimit) + ' kcal'; save(); app.updateCounter(); });
  bindSeg(root, 'cur', v => { st.cur = v; save(); app.buildGrid(); setTimeout(() => renderSettings(), 300); });
  bindSeg(root, 'alMode', v => { st.allergenMode = v; save(); app.buildGrid(); });
  bindSeg(root, 'theme', v => { st.theme = v; save(); applyLook(); });
  bindSeg(root, 'layout', v => { st.layout = v; save(); app.buildGrid(); });
  bindSeg(root, 'textSize', v => { st.textSize = v === 'auto' ? 'auto' : +v; save(); applyLook(); });
  bindSeg(root, 'sound', v => { st.sound = v; save(); sound('add'); });
  bindSeg(root, 'notify', v => { st.notify = v; save(); setTimeout(() => renderSettings(), 250); });
  root.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.ton) { typeById(t.dataset.ton).on = t.checked; save(); app.buildGrid(); feedback('tick'); }
    if (t.id === 'inMascot') { st.mascot = t.checked; save(); app.updateCounter(); }
    if (t.id === 'inHap') { st.haptics = t.checked; save(); feedback('tick'); }
    if (t.id === 'inAwake') { st.awake = t.checked; save(); st.awake ? app.keepAwake() : app.releaseAwake(); }
    if (t.id === 'inKcal') { st.kcalAlert = t.checked; save(); app.updateCounter(); }
    if (t.id === 'inContrast') { st.contrast = t.checked; save(); applyLook(); }
    if (t.id === 'inMotion') { st.motion = t.checked ? 'reduced' : 'full'; save(); applyLook(); }
    if (t.id && t.id.startsWith('al-')) { const a = t.id.slice(3); st.allergens = t.checked ? [...new Set([...st.allergens, a])] : st.allergens.filter(x => x !== a); save(); app.buildGrid(); }
    if (t.id === 'impData' && t.files[0]) { app.importBackup(t.files[0]); t.value = ''; }
  });
  root.addEventListener('click', e => {
    const dn = e.target.closest('[data-diner]'); if (dn) return dinerSheet(dn.dataset.diner);
    if (e.target.closest('#addDiner2')) return dinerSheet();
    if (e.target.closest('.sw')) return;
    const tp = e.target.closest('[data-type]'); if (tp) return typeSheet(tp.dataset.type);
    const bf = e.target.closest('[data-buf]'); if (bf) return buffetSheet(bf.dataset.buf);
    const sk = e.target.closest('[data-skin]'); if (sk) { st.skin = sk.dataset.skin; save(); applyLook(); feedback('tick'); renderSettings(); return; }
    const sn = e.target.closest('[data-snd]'); if (sn) { const prev = st.sound; if (prev === 'off') st.sound = 'theme'; sound(sn.dataset.snd); st.sound = prev; return; }
    const a = e.target.closest('[data-ac]');
    if (a) { st.accent = a.dataset.ac; applyLook(); save(); feedback('tick'); renderSettings(); }
  });
  root.addEventListener('keydown', e => { const r = e.target.closest('[data-type],[data-buf]'); if (r && e.target === r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); r.click(); } });
  on('addBuf', () => buffetSheet());
  on('scanRow', () => app.scanIntro());
  on('newType', () => customTypeSheet());
  on('resetCosts', () => { S.types.forEach(t => { const d = DEFAULT_TYPES.find(x => x.id === t.id); if (d) { t.cost = d.cost; t.carta = d.carta; } }); save(); app.buildGrid(); renderSettings(); hud('Costes restaurados'); });
  on('expData', () => app.exportBackup());
  on('delEx', () => { S.history = S.history.filter(h => !h.ex); save(); renderSettings(); hud('Ejemplos eliminados'); });
  const dh = root.querySelector('#delHist'); if (dh) twoStep(dh, 'Toca otra vez para borrar', () => { S.history = []; S.trophies = {}; save(); renderSettings(); hud('Historial borrado'); });
  const ra = root.querySelector('#resetAll'); if (ra) twoStep(ra, 'Toca otra vez para restablecer', () => { const f = fresh(); f.history = []; f.settings.introSeen = true; setState(f); saveNow(); applyLook(); app.afterReset(); stack.length = 1; renderSettings(); hud('Todo restablecido'); });
}

/* ---------- Buffets ---------- */
export function buffetSheet(id, preset = {}) {
  const b = id ? S.buffets.find(x => x.id === id) : null;
  const p = b ? b.prices : {noon:preset.price ?? 15.9, night:preset.price ?? 18.9, weekend:preset.price ?? 19.9};
  openSheet({title:b ? 'Editar buffet' : 'Nuevo buffet', ok:b ? 'Guardar' : 'Añadir', body:`
    <div class="group"><label class="row"><span class="row-l" style="flex:0 0 auto">Nombre</span><input class="row-in" id="bfName" maxlength="28" placeholder="Por ejemplo, Kyoto Garden" value="${esc(b ? b.name : preset.name || '')}" autocomplete="off"></label></div>
    <div class="gsec"><div class="glabel">Precio por persona</div><div class="group">
      ${PRICE_SLOTS.map(s => `<label class="row"><span class="row-l" style="flex:0 0 auto">${s.name}<span class="sub">${s.d}</span></span><input class="row-in num" id="bf-${s.id}" inputmode="decimal" value="${fmtDec(p[s.id])}"><span class="row-v">${CURRENCIES[S.settings.cur]}</span></label>`).join('')}
    </div></div>
    <div class="group"><div class="row"><span class="row-l">Usar como habitual</span>${sw('bfDef', !b || b.id === S.buffetId)}</div></div>
    ${b && S.buffets.length > 1 ? '<button class="btn ghost" id="bfDel">Eliminar buffet</button>' : ''}`,
    mount(el) {
      const d = $('#bfDel', el); if (d) twoStep(d, 'Toca otra vez para eliminar', () => { S.buffets = S.buffets.filter(x => x.id !== id); if (S.buffetId === id) S.buffetId = S.buffets[0].id; if (S.session.buffetId === id) S.session.buffetId = null; save(); closeSheet(); renderSettings(); app.updateCounter(); });
      if (!b && !preset.name) setTimeout(() => $('#bfName', el).focus(), 450);
    },
    onOk(el) {
      const name = $('#bfName', el).value.trim() || 'Buffet';
      const prices = Object.fromEntries(PRICE_SLOTS.map(s => [s.id, Math.max(0, parseNum($('#bf-' + s.id, el).value))]));
      let bid = id;
      if (b) { b.name = name; b.prices = prices; } else { bid = 'b' + Date.now().toString(36); S.buffets.push({id:bid, name, prices}); }
      if ($('#bfDef', el).checked) S.buffetId = bid;
      if (!S.session.start || !b) S.session.buffetId = bid;
      save(); if (app.cur === 'set') renderSettings(); app.updateCounter(); hud(b ? 'Buffet guardado' : 'Buffet añadido');
    }});
}
// Selector rápido desde el contador
export function buffetPicker() {
  const cur = currentBuffet(), slot = sessionSlot();
  openSheet({title:'¿Dónde comes hoy?', cancel:'Cerrar', body:`
    <div class="group" id="bpList">${S.buffets.map(b => `<button class="row" data-pick="${b.id}"><span class="row-main"><span class="row-t">${esc(b.name)}</span><span class="row-d">${money(b.prices[slot])} · ${PRICE_SLOTS.find(s => s.id === slot).name.toLowerCase()}</span></span>${b.id === cur.id ? ui('check', 'chk') : ''}</button>`).join('')}
      <button class="row accent" id="bpAdd">${ui('plus', '', 'width:22px;height:22px')}<span class="row-l">Añadir buffet</span></button></div>
    <div class="gsec"><div class="glabel">Precio de esta sesión</div><div class="group"><div class="row">${seg('slot', [['auto', 'Auto'], ...PRICE_SLOTS.map(s => [s.id, s.name])], S.session.slot || 'auto')}</div></div>
      <p class="gfoot">${S.session.priceOverride != null ? `Ahora mismo usas el precio del ticket: ${money(S.session.priceOverride)}. ` : ''}«Auto» elige mediodía, noche o fin de semana según la hora.</p></div>
    <button class="btn plain" id="bpScan">${ui('camera')}Escanear ticket</button>
    ${S.session.priceOverride != null ? '<button class="btn ghost" id="bpClear" style="color:var(--accent)">Volver al precio del buffet</button>' : ''}`,
    mount(el) {
      $('#bpList', el).addEventListener('click', e => { const r = e.target.closest('[data-pick]'); if (!r) return; S.session.buffetId = r.dataset.pick; S.buffetId = r.dataset.pick; save(); feedback('tick'); closeSheet(); app.updateCounter(); hud('Buffet: ' + currentBuffet().name); });
      $('#bpAdd', el).onclick = () => buffetSheet();
      bindSeg(el, 'slot', v => { S.session.slot = v === 'auto' ? null : v; save(); app.updateCounter(); });
      $('#bpScan', el).onclick = () => app.scanTicket();
      const c = $('#bpClear', el); if (c) c.onclick = () => { S.session.priceOverride = null; save(); closeSheet(); app.updateCounter(); };
    }});
}

/* ---------- Comensales ---------- */
export function dinerSheet(id) {
  const d = id ? S.diners.find(x => x.id === id) : null;
  let color = d ? d.color : (DINER_COLORS.find(c => !S.diners.some(x => x.color === c)) || DINER_COLORS[S.diners.length % DINER_COLORS.length]);
  openSheet({title:d ? 'Editar comensal' : 'Nuevo comensal', ok:d ? 'Guardar' : 'Añadir', body:`
    <div class="sh-hero"><span class="av xl" id="dnAv" style="--c:${color}">${esc(d ? initial(d.name) : '?')}</span></div>
    <div class="group"><label class="row"><span class="row-l" style="flex:0 0 auto">Nombre</span><input class="row-in" id="dnName" maxlength="16" placeholder="Por ejemplo, Lucía" value="${d ? esc(d.name) : ''}" autocomplete="off"></label></div>
    <div class="gsec"><div class="glabel">Color</div><div class="group pad"><div class="swatches" id="dnCol">${DINER_COLORS.map(c => `<button class="swc${c === color ? ' on' : ''}" data-c="${c}" style="--c:${c}" aria-label="Color ${c}"></button>`).join('')}</div></div></div>
    ${d && S.diners.length > 1 ? `<button class="btn ghost" id="dnDel">Eliminar comensal</button><p class="gfoot" style="margin-top:-4px">Se borrarán sus piezas de la sesión actual.</p>` : ''}`,
    mount(el) {
      const av = $('#dnAv', el), inp = $('#dnName', el);
      inp.addEventListener('input', () => av.textContent = initial(inp.value));
      $('#dnCol', el).addEventListener('click', e => { const b = e.target.closest('.swc'); if (!b) return; color = b.dataset.c; $$('.swc', el).forEach(x => x.classList.toggle('on', x === b)); av.style.setProperty('--c', color); });
      const del = $('#dnDel', el);
      if (del) twoStep(del, 'Toca otra vez para eliminar', () => {
        S.session.log = S.session.log.filter(e => e.d !== id); delete S.session.done[id]; delete S.session.missions[id];
        S.diners = S.diners.filter(x => x.id !== id); if (S.active === id) S.active = S.diners[0].id;
        if (!S.session.log.length) S.session.start = null;
        save(); closeSheet(); app.refreshAll();
      });
      if (!d) setTimeout(() => inp.focus(), 450);
    },
    onOk(el) {
      const name = $('#dnName', el).value.trim() || `Comensal ${S.diners.length + (d ? 0 : 1)}`;
      if (d) { d.name = name; d.color = color; } else { const nd = {id:'d' + Date.now().toString(36), name, color}; S.diners.push(nd); S.active = nd.id; }
      save(); app.refreshAll();
    }});
}

/* ---------- Piezas ---------- */
const algToggles = sel => `<div class="algs" id="algs">${ALLERGENS.map(a => `<button class="alg-c${sel.includes(a.id) ? ' on' : ''}" data-al="${a.id}" aria-pressed="${sel.includes(a.id)}">${alg(a.id)}${a.name}</button>`).join('')}</div>`;
const bindAlg = (el, arr) => $('#algs', el).addEventListener('click', e => { const b = e.target.closest('[data-al]'); if (!b) return; const a = b.dataset.al, i = arr.indexOf(a); if (i >= 0) arr.splice(i, 1); else arr.push(a); b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0); feedback('tick'); });
export function typeSheet(k) {
  const t = typeById(k); if (!t) return;
  if (t.tpl) return customTypeSheet(k);
  const def = DEFAULT_TYPES.find(x => x.id === k);
  let kcal = t.kcal; const al = [...(t.al || [])];
  const mac = () => macroOf({...t, kcal});
  openSheet({title:'Pieza', ok:'Guardar', body:`
    <div class="sh-hero">${icon(k, 'big-ic')}<p>${CATS.find(c => c.id === t.cat).name} · 1 ${t.unit}</p></div>
    <div class="group">
      <label class="row"><span class="row-l" style="flex:0 0 auto">Nombre</span><input class="row-in" id="tpName" maxlength="20" value="${esc(t.name)}" autocomplete="off"></label>
      <label class="row"><span class="row-l" style="flex:0 0 auto">Coste real</span><input class="row-in num" id="tpCost" inputmode="decimal" value="${fmtDec(t.cost)}"><span class="row-v">${CURRENCIES[S.settings.cur]}</span></label>
      <label class="row"><span class="row-l" style="flex:0 0 auto">Precio en carta</span><input class="row-in num" id="tpCarta" inputmode="decimal" value="${fmtDec(t.carta)}"><span class="row-v">${CURRENCIES[S.settings.cur]}</span></label>
      <div class="row"><span class="row-l">Calorías</span><span class="row-v num" id="tpK"></span>${stepper('tp-k')}</div>
      <div class="row"><span class="row-l">Favorita</span>${sw('tpFav', t.fav)}</div>
      <div class="row"><span class="row-l">Mostrar en el contador</span>${sw('tpOn', t.on)}</div>
    </div>
    <div class="gsec"><div class="glabel">Nutrición por ${t.unit}</div><div class="group pad"><div class="macros" id="tpMac"></div></div></div>
    <div class="gsec"><div class="glabel">Alérgenos</div><div class="group pad">${algToggles(al)}</div><p class="gfoot">Orientativo. Pregunta siempre en el restaurante.</p></div>
    <div class="group"><button class="row accent" id="tpReset" style="justify-content:center">Restaurar valores por defecto</button></div>
    <p class="gfoot" style="margin-top:-4px">Por defecto: ${esc(def.name)}, ${money(def.cost)} de coste, ${money(def.carta)} en carta y ${def.kcal} kcal.</p>`,
    mount(el) {
      const paint = () => { $('#tpK', el).textContent = `${kcal} kcal`; const m = mac(); $('#tpMac', el).innerHTML = [['Proteínas', m[0], '#30A46C'], ['Hidratos', m[1], '#F5A524'], ['Grasas', m[2], '#3E7BFA']].map(([l, g, c]) => `<div class="mac"><span>${l}</span><b>${(Math.round(g * 10) / 10).toString().replace('.', ',')} g</b><i><em style="width:${Math.min(100, g / Math.max(1, m[0] + m[1] + m[2]) * 100)}%;background:${c}"></em></i></div>`).join(''); };
      bindStepper(el, 'tp-k', dir => { kcal = Math.max(0, Math.min(1200, kcal + dir * 5)); paint(); });
      bindAlg(el, al);
      $('#tpReset', el).onclick = () => { $('#tpName', el).value = def.name; $('#tpCost', el).value = fmtDec(def.cost); $('#tpCarta', el).value = fmtDec(def.carta); kcal = def.kcal; al.splice(0, al.length, ...def.al); $$('[data-al]', el).forEach(b => b.classList.toggle('on', al.includes(b.dataset.al))); paint(); feedback('tick'); };
      paint();
    },
    onOk(el) {
      t.name = $('#tpName', el).value.trim() || def.name; t.kcal = kcal; t.on = $('#tpOn', el).checked; t.fav = $('#tpFav', el).checked; t.al = al;
      t.cost = Math.max(0, parseNum($('#tpCost', el).value)); t.carta = Math.max(0, parseNum($('#tpCarta', el).value));
      save(); app.buildGrid(); if (app.cur === 'set') renderSettings();
    }});
}
export function customTypeSheet(k) {
  const t = k ? typeById(k) : null;
  let tpl = t ? t.tpl : 'nigiri', color = t ? t.color : FOOD_COLORS[2].c, cat = t ? t.cat : 'nigiri', kcal = t ? t.kcal : 60;
  const al = t ? [...(t.al || [])] : ['pescado'];
  const prev = () => `<svg viewBox="0 0 48 48" class="pi big-ic" aria-hidden="true">${TPL[tpl](color)}</svg>`;
  openSheet({title:t ? 'Tu pieza' : 'Nueva pieza', ok:t ? 'Guardar' : 'Crear', body:`
    <div class="sh-hero" id="ctPrev">${prev()}</div>
    <div class="group"><label class="row"><span class="row-l" style="flex:0 0 auto">Nombre</span><input class="row-in" id="ctName" maxlength="20" placeholder="Por ejemplo, Nigiri de vieira" value="${esc(t ? t.name : '')}" autocomplete="off"></label></div>
    <div class="gsec"><div class="glabel">Forma</div><div class="picks" id="ctTpl">${Object.keys(TPL).map(id => `<button class="pick${id === tpl ? ' on' : ''}" data-tpl="${id}"><svg viewBox="0 0 48 48" aria-hidden="true">${TPL[id](color)}</svg>${({nigiri:'Nigiri', sashimi:'Sashimi', maki:'Maki', gunkan:'Gunkan', brocheta:'Brocheta', bol:'Bol', bola:'Postre', roll:'Roll'})[id]}</button>`).join('')}</div></div>
    <div class="gsec"><div class="glabel">Ingrediente principal</div><div class="group pad"><div class="swatches" id="ctCol">${FOOD_COLORS.map(f => `<button class="swc${f.c === color ? ' on' : ''}" data-c="${f.c}" style="--c:${f.c}" aria-label="${f.n}" title="${f.n}"></button>`).join('')}</div></div></div>
    <div class="gsec"><div class="glabel">Categoría</div><div class="group"><div class="row">${seg('ctCat', CATS.map(c => [c.id, c.short]), cat)}</div></div></div>
    <div class="group">
      <label class="row"><span class="row-l" style="flex:0 0 auto">Coste real</span><input class="row-in num" id="ctCost" inputmode="decimal" value="${fmtDec(t ? t.cost : .25)}"><span class="row-v">${CURRENCIES[S.settings.cur]}</span></label>
      <label class="row"><span class="row-l" style="flex:0 0 auto">Precio en carta</span><input class="row-in num" id="ctCarta" inputmode="decimal" value="${fmtDec(t ? t.carta : 2.5)}"><span class="row-v">${CURRENCIES[S.settings.cur]}</span></label>
      <div class="row"><span class="row-l">Calorías</span><span class="row-v num" id="ctK">${kcal} kcal</span>${stepper('ct-k')}</div>
    </div>
    <div class="gsec"><div class="glabel">Alérgenos</div><div class="group pad">${algToggles(al)}</div></div>
    ${t ? '<button class="btn ghost" id="ctDel">Eliminar pieza</button>' : ''}`,
    mount(el) {
      const paint = () => { $('#ctPrev', el).innerHTML = prev(); $$('#ctTpl .pick svg', el).forEach((s, i) => s.innerHTML = TPL[Object.keys(TPL)[i]](color)); };
      $('#ctTpl', el).addEventListener('click', e => { const b = e.target.closest('[data-tpl]'); if (!b) return; tpl = b.dataset.tpl; $$('#ctTpl .pick', el).forEach(p => p.classList.toggle('on', p === b)); paint(); feedback('tick'); });
      $('#ctCol', el).addEventListener('click', e => { const b = e.target.closest('.swc'); if (!b) return; color = b.dataset.c; $$('.swc', el).forEach(x => x.classList.toggle('on', x === b)); paint(); feedback('tick'); });
      bindSeg(el, 'ctCat', v => { cat = v; });
      bindStepper(el, 'ct-k', dir => { kcal = Math.max(0, Math.min(1200, kcal + dir * 5)); $('#ctK', el).textContent = kcal + ' kcal'; });
      bindAlg(el, al);
      const d = $('#ctDel', el); if (d) twoStep(d, 'Toca otra vez para eliminar', () => { t.deleted = true; t.on = false; save(); closeSheet(); app.buildGrid(); if (app.cur === 'set') renderSettings(); hud('Pieza eliminada'); });
      if (!t) setTimeout(() => $('#ctName', el).focus(), 450);
    },
    onOk(el) {
      const name = $('#ctName', el).value.trim(); if (!name) { hud('Ponle un nombre a la pieza'); $('#ctName', el).focus(); return false; }
      const data = {name, tpl, color, cat, kcal, cost:Math.max(0, parseNum($('#ctCost', el).value)), carta:Math.max(0, parseNum($('#ctCarta', el).value)), al:[...al]};
      if (t) Object.assign(t, data); else S.types.push({id:'x' + Date.now().toString(36), unit:'pieza', on:true, fav:false, ...data});
      save(); app.buildGrid(); if (app.cur === 'set') renderSettings(); hud(t ? 'Pieza guardada' : 'Pieza creada'); app.checkAll(S.active);
    }});
}
