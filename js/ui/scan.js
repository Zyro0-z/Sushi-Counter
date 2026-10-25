// Escaneo de tickets: foto → texto con Tesseract.js (se descarga solo al usarlo) → precio y nombre.
import {S, save} from '../store.js';
import {ui} from '../icons.js';
import {parseTicket, money, fmtDec, parseNum} from '../logic.js';
import {$, esc, app, openSheet, closeSheet, stepper, bindStepper} from './common.js';
import {hud, feedback} from '../fx.js';

const LIB = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
let libP = null;
function loadLib() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (libP) return libP;
  libP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = LIB; s.onload = () => res(window.Tesseract); s.onerror = () => { libP = null; rej(new Error('lib')); }; document.head.appendChild(s); });
  return libP;
}
function prep(file, max = 1600) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const x = c.getContext('2d'); x.filter = 'grayscale(1) contrast(1.35)'; x.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
    img.src = url;
  });
}
// Texto de una foto; también se usa para leer cartas (más resolución para la letra pequeña)
export async function ocrFile(file, set = () => {}, max = 1600) {
  const [T, canvas] = await Promise.all([loadLib(), prep(file, max)]);
  const worker = await T.createWorker('spa', 1, {logger:m => { if (m.status === 'recognizing text') set('Leyendo el texto', .3 + m.progress * .7); else set('Cargando el lector', (m.progress || 0) * .3); }});
  try { const {data} = await worker.recognize(canvas); return data.text || ''; } finally { worker.terminate(); }
}
export function pickImage(cb) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
  document.body.appendChild(inp);
  inp.onchange = () => { const f = inp.files[0]; inp.remove(); if (f) cb(f); };
  inp.click();
}
export function scanTicket() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
  document.body.appendChild(inp);
  inp.onchange = () => { const f = inp.files[0]; inp.remove(); if (f) read(f); };
  inp.click();
}
async function read(file) {
  openSheet({title:'Leyendo el ticket', cancel:'Cancelar', body:`<div class="sh-hero">${ui('camera', 'scan-ic', 'width:56px;height:56px;color:var(--accent)')}<h4>Un momento…</h4><p id="ocrMsg">Preparando el lector</p></div>
    <div class="meter lg"><i id="ocrBar" style="width:4%"></i></div><p class="gfoot">La primera vez descarga el lector de texto (unos 5 MB). Después funciona más rápido.</p>`});
  let text = '';
  try {
    const set = (msg, p) => { const m = $('#ocrMsg'), b = $('#ocrBar'); if (m) m.textContent = msg; if (b && p != null) b.style.width = Math.max(4, p * 100) + '%'; };
    text = await ocrFile(file, set);
  } catch (e) {
    hud('No se pudo leer el ticket. Escríbelo a mano.');
  }
  result(parseTicket(text), text);
}
function result(p, raw) {
  let people = p.people || Math.max(1, S.diners.length);
  const total = p.total || 0;
  openSheet({title:'Ticket', ok:'Usar', body:`
    <div class="sh-hero"><span class="big num" id="tkPer">${money(total / people)}</span><p>por persona</p></div>
    <div class="group">
      <label class="row"><span class="row-l" style="flex:0 0 auto">Restaurante</span><input class="row-in" id="tkName" maxlength="28" value="${esc(p.name || '')}" placeholder="Nombre"></label>
      <label class="row"><span class="row-l" style="flex:0 0 auto">Total del ticket</span><input class="row-in num" id="tkTot" inputmode="decimal" value="${total ? fmtDec(total) : ''}" placeholder="0,00"></label>
      <div class="row"><span class="row-l">Personas</span><span class="row-v num" id="tkP">${people}</span>${stepper('tk-p')}</div>
    </div>
    <div class="group">
      <div class="row"><span class="row-l">Usar este precio en la sesión</span><label class="sw"><input type="checkbox" id="tkUse" checked><span></span></label></div>
      <div class="row"><span class="row-l">Guardar como buffet</span><label class="sw"><input type="checkbox" id="tkSave" ${p.name ? 'checked' : ''}><span></span></label></div>
    </div>
    <p class="gfoot">${raw ? 'Revisa los datos: la lectura automática puede fallar con tickets arrugados o con poca luz. El total incluye bebidas si las hubo.' : 'Escribe el total y el número de personas.'}</p>
    ${raw ? `<details class="raw"><summary>Texto leído</summary><pre>${esc(raw.slice(0, 1500))}</pre></details>` : ''}`,
    mount(el) {
      const paint = () => { $('#tkP', el).textContent = people; $('#tkPer', el).textContent = money(parseNum($('#tkTot', el).value) / people); };
      $('#tkTot', el).addEventListener('input', paint);
      bindStepper(el, 'tk-p', d => { people = Math.max(1, Math.min(30, people + d)); paint(); });
    },
    onOk(el) {
      const tot = parseNum($('#tkTot', el).value); if (!tot) { hud('Escribe el total del ticket'); return false; }
      const per = Math.round(tot / people * 100) / 100, name = $('#tkName', el).value.trim();
      if ($('#tkUse', el).checked) { S.session.priceOverride = per; }
      if ($('#tkSave', el).checked && name) {
        let b = S.buffets.find(x => x.name.trim().toLowerCase() === name.toLowerCase());
        if (!b) { b = {id:'b' + Date.now().toString(36), name, prices:{noon:per, night:per, weekend:per}}; S.buffets.push(b); }
        S.session.buffetId = b.id; S.buffetId = b.id;
      }
      save(); feedback('mission'); hud(`Precio por persona: ${money(per)}`); app.updateCounter();
    }});
}
