// Archivos: copia de seguridad (iCloud Drive a través de Compartir), CSV e imagen para compartir.
import {S, save, saveNow, migrate, setState} from '../store.js';
import {iconInner, darken} from '../icons.js';
import {sum, money, durShort, costOf, buildCSV, ymd, typeById, level, activeTitle} from '../logic.js';
import {$, app, icon, openSheet, closeSheet, saveFile, applyLook} from './common.js';
import {hud, feedback} from '../fx.js';

export function exportBackup() {
  S.settings.lastBackup = Date.now(); saveNow();
  saveFile(new Blob([JSON.stringify(S)], {type:'application/json'}), `sushi-copia-${ymd(new Date())}.json`);
  if (app.cur === 'set') setTimeout(() => app.renderSettings(), 600);
}
export function importBackup(file) {
  const r = new FileReader();
  r.onload = () => {
    let data;
    try { data = JSON.parse(r.result); if (!data || !data.settings || !Array.isArray(data.history)) throw 0; }
    catch (e) { hud('Ese archivo no es una copia válida'); return; }
    const n = data.history.filter(h => !h.ex).length;
    openSheet({title:'Importar copia', body:`<div class="sh-hero">${icon('maki', 'big-ic')}<h4>¿Reemplazar tus datos?</h4>
      <p>La copia tiene ${n} ${n === 1 ? 'sesión' : 'sesiones'}, ${Object.keys(data.ach || {}).length} logros y ${data.xp || 0} XP. Lo que hay ahora en este dispositivo se sustituirá.</p></div>
      <button class="btn" id="impOk">Reemplazar datos</button>`,
      mount(el) { $('#impOk', el).onclick = () => { setState(migrate(data)); S.settings.introSeen = true; saveNow(); applyLook(); closeSheet(); app.afterReset(); hud('Copia importada'); }; }});
  };
  r.readAsText(file);
}
export function exportCSV() {
  if (!S.history.some(h => !h.ex)) { hud('Aún no hay sesiones reales que exportar'); return; }
  saveFile(new Blob([buildCSV()], {type:'text/csv;charset=utf-8'}), `sushi-historial-${ymd(new Date())}.csv`);
}
export function backupNudge() {
  const real = S.history.filter(h => !h.ex).length;
  if (real >= 2 && Date.now() - (S.settings.lastBackup || 0) > 14 * 86400000) setTimeout(() => hud('Consejo: guarda una copia en Ajustes › Datos'), 2600);
}

/* ---------- Imagen del resumen para compartir ---------- */
const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
const iconURL = k => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="240" height="240">${iconInner(k, typeById(k)).replace(/class="shd"/g, 'fill="rgba(30,20,10,.16)"').replace(/class="rim"/g, 'stroke="rgba(0,0,0,.08)" stroke-width="1"').replace(/class="(steam|sizzle|sway|bonito)"/g, '')}</svg>`);
const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FA5D3C';
export async function shareCard(rec) {
  hud('Preparando imagen');
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), F = '-apple-system,"SF Pro Display",system-ui,"Segoe UI",Roboto,sans-serif', R = 'ui-rounded,"SF Pro Rounded",Nunito,system-ui,sans-serif';
  const acc = /^#[0-9a-f]{6}$/i.test(accent()) ? accent() : '#FA5D3C', all = {};
  rec.diners.forEach(d => Object.entries(d.counts).forEach(([k, v]) => all[k] = (all[k] || 0) + v));
  const tot = sum(all), top = Object.entries(all).filter(e => e[1]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const imgs = await Promise.all(top.map(([k]) => loadImg(iconURL(k))));
  const g = x.createLinearGradient(0, 0, W * .4, H); g.addColorStop(0, acc); g.addColorStop(1, darken(acc, .45)); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.arc(W - 60, 140, 330, 0, 7); x.fill(); x.beginPath(); x.arc(80, H - 120, 240, 0, 7); x.fill();
  const rr = (X, Y, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); };
  const lv = level(), title = rec.title || activeTitle().t;
  x.fillStyle = 'rgba(255,255,255,.72)'; x.font = `700 32px ${F}`; x.fillText(`CONTADOR DE SUSHI · NIVEL ${lv.l} · ${title.toUpperCase()}`.slice(0, 52), 80, 118);
  x.fillStyle = '#fff'; x.font = `800 68px ${F}`; x.fillText(rec.buffet.slice(0, 26), 80, 198);
  x.fillStyle = 'rgba(255,255,255,.8)'; x.font = `500 38px ${F}`;
  x.fillText(`${new Date(rec.date).toLocaleDateString('es-ES', {day:'numeric', month:'long', year:'numeric'})} · ${durShort(rec.dur)}`, 80, 256);
  x.fillStyle = '#fff'; x.font = `900 280px ${R}`; x.fillText(String(tot), 70, 540);
  const tw = x.measureText(String(tot)).width; x.font = `800 56px ${F}`; x.fillText('piezas', 100 + tw, 540);
  if (rec.diners.length > 1) { x.font = `600 36px ${F}`; x.fillStyle = 'rgba(255,255,255,.88)'; x.fillText(rec.diners.map(d => `${d.name} ${sum(d.counts)}`).join('  ·  ').slice(0, 52), 80, 608); }
  const cw = 212, ch = 222, gap = 18, x0 = 80, y0 = 650;
  top.forEach(([k, v], i) => {
    const X = x0 + (i % 4) * (cw + gap), Y = y0 + Math.floor(i / 4) * (ch + gap);
    x.fillStyle = 'rgba(255,255,255,.95)'; rr(X, Y, cw, ch, 44); x.fill();
    if (imgs[i]) x.drawImage(imgs[i], X + 38, Y + 10, 136, 136);
    x.fillStyle = '#1c1c1e'; x.font = `900 50px ${R}`; x.textAlign = 'center'; x.fillText('×' + v, X + cw / 2, Y + 196); x.textAlign = 'left';
  });
  const cost = costOf(all), paid = rec.price * rec.diners.length, medals = rec.diners.reduce((a, d) => a + (d.medals || []).length, 0);
  const by = 1210; x.fillStyle = 'rgba(0,0,0,.18)'; rr(80, by - 70, W - 160, 130, 40); x.fill();
  [['Pagado', money(paid)], ['Coste real', money(cost)], ['Medallas', String(medals)]].forEach(([l, v], i) => {
    const X = 120 + i * 300; x.fillStyle = 'rgba(255,255,255,.7)'; x.font = `600 28px ${F}`; x.fillText(l, X, by - 22);
    x.fillStyle = '#fff'; x.font = `900 44px ${R}`; x.fillText(v, X, by + 30);
  });
  c.toBlob(b => { if (b) { saveFile(b, `sushi-${ymd(new Date(rec.date))}.png`); feedback('tick'); } else hud('No se pudo crear la imagen'); }, 'image/png');
}
