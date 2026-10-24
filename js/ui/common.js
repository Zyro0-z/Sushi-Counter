// Piezas de interfaz compartidas: hojas, menús, controles, avisos de logros y aspecto.
import {S} from '../store.js';
import {ACCENTS, SKINS} from '../catalog.js';
import {iconInner, ICON_ANIM, medal, GLYPH, ui} from '../icons.js';
import {typeById, mText, descOf, diner} from '../logic.js';
import {feedback, celebrate, tierFx, announce, reduced} from '../fx.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

// Registro para llamadas entre pantallas sin dependencias circulares
export const app = {cur:'count'};

export const icon = (k, cls = '', st = '') => `<svg viewBox="0 0 48 48" class="pi ${cls}" aria-hidden="true"${ICON_ANIM[k] ? ` data-anim="${ICON_ANIM[k]}"` : ''}${st ? ` style="${st}"` : ''}>${iconInner(k, typeById(k))}</svg>`;
export const iconRaw = k => iconInner(k, typeById(k));

/* ---------- Odómetro ---------- */
export class Odo {
  constructor(el) { this.el = el; el.classList.add('odo', 'num'); this.s = null; this.cols = []; }
  set(v) {
    const s = String(v); if (s === this.s) return;
    if (this.cols.length !== s.length) {
      this.el.innerHTML = '';
      this.cols = [...s].map(() => {
        const c = document.createElement('span'); c.className = 'odo-c';
        const st = document.createElement('span'); st.className = 'odo-s';
        st.innerHTML = '0123456789'.split('').map(d => `<span>${d}</span>`).join('');
        c.appendChild(st); this.el.appendChild(c); return st;
      });
      void this.el.offsetWidth;
    }
    [...s].forEach((d, i) => { this.cols[i].style.transform = `translateY(${-d * 10}%)`; });
    this.s = s; this.el.setAttribute('aria-label', s);
  }
}

/* ---------- Aspecto: tema, piel, acento, contraste, texto y movimiento ---------- */
let baseText = 1;
export function measureText() {
  try {
    const s = document.createElement('span'); s.style.cssText = 'font:-apple-system-body;position:absolute;visibility:hidden'; s.textContent = 'x';
    document.body.appendChild(s); const px = parseFloat(getComputedStyle(s).fontSize); s.remove();
    baseText = px && px !== 17 ? Math.max(.9, Math.min(1.45, px / 17)) : 1;
  } catch (e) { baseText = 1; }
}
export function applyLook() {
  const r = document.documentElement, st = S.settings, skin = SKINS.find(k => k.id === st.skin) || SKINS[0];
  const mode = skin.mode || (st.theme === 'system' ? null : st.theme);
  if (mode) r.setAttribute('data-theme', mode); else r.removeAttribute('data-theme');
  r.setAttribute('data-skin', skin.id);
  r.toggleAttribute('data-contrast', !!st.contrast);
  r.toggleAttribute('data-reduced', st.motion === 'reduced');
  const ac = ACCENTS.find(a => a.id === st.accent) || ACCENTS[0];
  if (skin.id === 'neon') r.style.setProperty('--accent', '#FF2E88');
  else if (skin.id === 'washi') r.style.setProperty('--accent', '#C8402B');
  else if (skin.id === 'minimal') r.style.setProperty('--accent', st.theme === 'dark' ? '#FFFFFF' : ac.c);
  else r.style.setProperty('--accent', ac.c);
  const tz = st.textSize === 'auto' ? baseText : +st.textSize || 1;
  r.style.setProperty('--tz', tz);
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) meta.content = getComputedStyle(document.body).backgroundColor;
}

/* ---------- Hoja modal flotante ---------- */
let sheetOpen = null, sheetCloseT;
export function openSheet(o) {
  const sh = $('#sheet'), bd = $('#backdrop');
  clearTimeout(sheetCloseT); closeMenus(true);
  sh.className = 'sheet' + (o.cls ? ' ' + o.cls : '');
  sh.innerHTML = `<div class="sh-head"><button class="gb" data-x>${o.cancel || 'Cancelar'}</button><h3>${esc(o.title)}</h3>${o.ok ? `<button class="gb tint" data-ok>${o.ok}</button>` : '<span></span>'}</div><div class="sh-body">${o.body}</div>`;
  sh.setAttribute('aria-label', o.title); sh.style.transform = ''; sh.scrollTop = 0;
  sh.hidden = false; bd.hidden = false; void sh.offsetHeight;
  document.body.classList.add('sheet-open'); sheetOpen = o;
  $('[data-x]', sh).onclick = closeSheet;
  const ok = $('[data-ok]', sh); if (ok) ok.onclick = () => { if (o.onOk && o.onOk(sh) === false) return; closeSheet(); };
  o.mount && o.mount(sh);
  setTimeout(() => { const f = $('[data-x]', sh); if (f && !sh.contains(document.activeElement)) f.focus({preventScroll:true}); }, 60);
  return sh;
}
export function closeSheet() {
  const sh = $('#sheet'); if (!sh || sh.hidden) return;
  const o = sheetOpen;
  document.body.classList.remove('sheet-open'); sh.style.transform = ''; sheetOpen = null;
  o && o.onClose && o.onClose();
  sheetCloseT = setTimeout(() => { sh.hidden = true; $('#backdrop').hidden = true; sh.innerHTML = ''; }, 500);
}
export const isSheetOpen = () => !!sheetOpen;
export function initSheet() {
  const sh = $('#sheet'); let y0 = null, dy = 0, t0 = 0;
  sh.addEventListener('pointerdown', e => { if (!e.target.closest('.sh-head') || e.target.closest('button')) return; y0 = e.clientY; dy = 0; t0 = performance.now(); sh.style.transition = 'none'; sh.setPointerCapture(e.pointerId); });
  sh.addEventListener('pointermove', e => { if (y0 === null) return; dy = e.clientY - y0; sh.style.transform = `translateY(${dy > 0 ? dy : dy / 6}px)`; });
  const end = () => { if (y0 === null) return; sh.style.transition = ''; const v = dy / Math.max(1, performance.now() - t0); y0 = null; if (dy > 120 || v > .6) closeSheet(); else sh.style.transform = ''; };
  sh.addEventListener('pointerup', end); sh.addEventListener('pointercancel', end);
  $('#backdrop').addEventListener('click', closeSheet);
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (menuOpen) closeMenus(); else if (sheetOpen) closeSheet(); } });
}

/* ---------- Menú desplegable de cristal (estilo iOS) ---------- */
let menuOpen = null;
export function closeMenus(now) {
  if (!menuOpen) return; const {ov, mn, extra} = menuOpen; menuOpen = null;
  const kill = () => { ov.remove(); mn.remove(); extra && extra.remove(); };
  if (now) return kill();
  ov.classList.remove('show'); mn.classList.remove('show'); extra && extra.classList.add('out');
  setTimeout(kill, 300);
}
// items: [{l, i, fn, red, dis, sub}] o 'sep'. anchor: elemento o rectángulo. extra: nodo que se muestra encima (vista previa)
export function popMenu(anchor, items, {extra = null, align = 'auto', blur = false} = {}) {
  closeMenus(true);
  const r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor;
  const ov = document.createElement('div'); ov.className = 'ctx-ov' + (blur ? ' blur' : '');
  const mn = document.createElement('div'); mn.className = 'ctx-menu glass'; mn.setAttribute('role', 'menu');
  mn.innerHTML = items.map((it, i) => it === 'sep' ? '<div class="ctx-sep"></div>'
    : `<button class="ctx-i${it.red ? ' red' : ''}" role="menuitem" data-i="${i}" ${it.dis ? 'disabled' : ''}><span>${it.l}${it.sub ? `<small>${it.sub}</small>` : ''}</span>${it.i ? ui(it.i) : ''}</button>`).join('');
  document.body.append(ov); if (extra) document.body.append(extra); document.body.append(mn);
  const mw = mn.offsetWidth, mh = mn.offsetHeight;
  const below = r.bottom + 10 + mh < innerHeight - 16;
  let left = align === 'right' || (align === 'auto' && r.left + r.width / 2 > innerWidth / 2) ? r.right - mw : r.left;
  left = Math.max(12, Math.min(left, innerWidth - mw - 12));
  mn.style.left = left + 'px'; mn.style.top = (below ? r.bottom + 10 : Math.max(12, r.top - 10 - mh)) + 'px';
  mn.style.setProperty('--ox', (r.left + r.width / 2 - left) + 'px'); mn.style.setProperty('--oy', below ? '0' : '100%');
  requestAnimationFrame(() => { ov.classList.add('show'); mn.classList.add('show'); });
  ov.onclick = () => closeMenus();
  mn.onclick = e => { const b = e.target.closest('.ctx-i'); if (!b) return; const it = items[+b.dataset.i]; feedback('tick'); closeMenus(); setTimeout(it.fn, 140); };
  menuOpen = {ov, mn, extra};
  const first = $('.ctx-i:not([disabled])', mn); first && first.focus({preventScroll:true});
}

/* ---------- Controles ---------- */
export function twoStep(btn, label, fn) {
  let armed = false, t; const old = btn.innerHTML;
  btn.addEventListener('click', () => {
    if (armed) { clearTimeout(t); fn(); return; }
    armed = true; btn.textContent = label; btn.classList.add('armed'); feedback('tick');
    t = setTimeout(() => { armed = false; btn.innerHTML = old; btn.classList.remove('armed'); }, 3000);
  });
}
export const stepper = id => `<div class="stepper" data-stepper="${id}"><button data-dir="-1" aria-label="Menos">${ui('minus')}</button><i></i><button data-dir="1" aria-label="Más">${ui('plus')}</button></div>`;
export function bindStepper(root, id, fn) {
  const box = root.querySelector(`[data-stepper="${id}"]`); if (!box) return;
  box.querySelectorAll('button').forEach(b => {
    let t1, t2; const stop = () => { clearTimeout(t1); clearInterval(t2); };
    b.addEventListener('pointerdown', e => { e.preventDefault(); const dir = +b.dataset.dir; fn(dir); feedback('tick'); t1 = setTimeout(() => { t2 = setInterval(() => fn(dir), 70); }, 420); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(+b.dataset.dir); } });
  });
}
export const seg = (name, opts, value, cls = '') => {
  const i = Math.max(0, opts.findIndex(o => o[0] === value));
  return `<div class="seg ${cls}" data-seg="${name}" style="--n:${opts.length};--i:${i}" role="radiogroup"><span class="seg-th"></span>${opts.map(([v, l]) => `<button data-v="${v}" role="radio" aria-checked="${v === value}" aria-pressed="${v === value}">${l}</button>`).join('')}</div>`;
};
export function bindSeg(root, name, fn) {
  const sg = root.querySelector(`[data-seg="${name}"]`); if (!sg) return;
  sg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const btns = $$('button', sg); sg.style.setProperty('--i', btns.indexOf(b));
    btns.forEach(x => { x.setAttribute('aria-pressed', x === b); x.setAttribute('aria-checked', x === b); });
    feedback('tick'); fn(b.dataset.v);
  });
}
export const sw = (id, on, label = '') => `<label class="sw"${label ? ` aria-label="${esc(label)}"` : ''}><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span></span></label>`;

/* ---------- Medalla en 3D con inclinación ---------- */
export const m3d = svg => `<div class="m3d"><div class="m3d-in">${svg}<span class="m3d-shine"></span></div></div>`;
let tiltOn = false, tiltEls = new Set();
function onTilt(e) { const x = Math.max(-25, Math.min(25, e.gamma || 0)), y = Math.max(-25, Math.min(25, (e.beta || 0) - 40)); tiltEls.forEach(el => { if (!el.isConnected) { tiltEls.delete(el); return; } el.style.setProperty('--rx', (-y * .8) + 'deg'); el.style.setProperty('--ry', (x * .9) + 'deg'); }); }
export function enableTilt(root) {
  $$('.m3d', root).forEach(w => {
    const el = $('.m3d-in', w); tiltEls.add(el);
    w.addEventListener('pointermove', e => { const r = w.getBoundingClientRect(); el.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 40 + 'deg'); el.style.setProperty('--rx', -((e.clientY - r.top) / r.height - .5) * 40 + 'deg'); });
    w.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });
  if (tiltOn || reduced() || typeof DeviceOrientationEvent === 'undefined') return;
  const start = () => { tiltOn = true; addEventListener('deviceorientation', onTilt); };
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    if (S.settings.tiltAsked === 'denied') return;
    DeviceOrientationEvent.requestPermission().then(r => { S.settings.tiltAsked = r; if (r === 'granted') start(); }).catch(() => {});
  } else start();
}

/* ---------- Avisos de logros en cola ---------- */
const queue = []; let qBusy = false, bannerT;
export function enqueue(item) { queue.push(item); if (!qBusy) runQueue(); }
function runQueue() { const it = queue.shift(); if (!it) { qBusy = false; return; } qBusy = true; showBanner(it); setTimeout(runQueue, 2400); }
export function mIcon(m) {
  if (m.type) return icon(m.type);
  if (m.k === 'cat') { const t = S.types.find(x => x.cat === m.cat && !x.deleted); if (t) return icon(t.id); }
  if (m.k === 'dessert') return icon('mochi');
  const g = {norep:'stack', speed:'bolt', var:'compass', cost:'down', kcal:'dish'}[m.k] || 'star';
  return `<svg viewBox="0 0 24 24" class="mono" aria-hidden="true">${GLYPH[g].replace(/#fff/g, 'currentColor')}</svg>`;
}
function showBanner({kind, item, mission, who, fx, snd}) {
  feedback(snd || (mission ? 'mission' : 'unlock'));
  celebrate(fx || (mission ? 'rice' : tierFx(item.tier)));
  const b = $('#banner'), d = diner(who);
  const art = mission ? `<span class="mis-ic">${mIcon(mission)}</span>` : medal(item, false, 'shiny');
  const title = mission ? mText(mission) : item.t, sub = mission ? `+${mission.xp} XP` : descOf(item);
  b.innerHTML = `<button class="bn glass">${art}<span class="bn-t"><small>${kind}${S.diners.length > 1 && who ? ' · ' + esc(d.name) : ''}</small><b>${esc(title)}</b><span>${esc(sub || '')}</span></span></button>`;
  b.firstChild.onclick = () => { b.classList.remove('show'); app.go && app.go('ch'); };
  requestAnimationFrame(() => b.classList.add('show'));
  announce(`${kind}: ${title}`);
  clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('show'), 2200);
}

/* ---------- Archivos: compartir o descargar ---------- */
export function saveFile(blob, name) {
  try {
    const f = new File([blob], name, {type:blob.type});
    if (navigator.canShare && navigator.canShare({files:[f]})) { navigator.share({files:[f], title:name}).catch(() => {}); return; }
  } catch (e) {}
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
