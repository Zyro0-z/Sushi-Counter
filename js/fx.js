// Efectos: sonidos sintetizados, vibración, partículas, avisos y piezas que vuelan.
import {S} from './store.js';

const sysRM = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
export const reduced = () => sysRM.matches || S.settings.motion === 'reduced';

/* ---------- Sonido ---------- */
let AC = null, noiseBuf = null;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function noise(a) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = a.createBuffer(1, a.sampleRate * .3, a.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
function tone(f, at, dur, {type = 'sine', vol = .12, glide = 1, attack = .006} = {}) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (glide !== 1) o.frequency.exponentialRampToValueAtTime(f * glide, t + dur * .8);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
}
function click(at, freq, vol = .25, dur = .035) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + at, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = noise(a); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 6;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f).connect(g).connect(a.destination); s.start(t); s.stop(t + dur + .02);
}
const bell = (f, at = 0, vol = .08) => [[1, 1], [2.76, .5], [5.4, .25]].forEach(([m, v]) => tone(f * m, at, 1.1 / Math.sqrt(m), {type:'sine', vol:vol * v, attack:.003}));
export function sound(kind, n = 0) {
  const mode = S.settings.sound; if (mode === 'off') return;
  if (mode === 'simple') {
    if (kind === 'add') tone(420 + Math.min(n, 14) * 28, 0, .1, {vol:.14, glide:1.6});
    else if (kind === 'remove') tone(330, 0, .1, {type:'triangle', vol:.1, glide:.7});
    else if (['unlock', 'mission', 'level', 'win'].includes(kind)) [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .085, .28, {type:'triangle', vol:.09}));
    else tone(900, 0, .04, {vol:.035});
    return;
  }
  switch (kind) {
    case 'add': click(0, 2600 + Math.min(n, 12) * 120, .3); click(.055, 3400 + Math.min(n, 12) * 140, .18); break; // palillos
    case 'remove': click(0, 1500, .25, .05); break;
    case 'tick': click(0, 4200, .08, .02); break;
    case 'roulette': click(0, 3000, .12, .02); break;
    case 'mission': bell(1320); bell(1760, .12, .06); break; // campanita
    case 'unlock': bell(1047); bell(1319, .1, .07); bell(1568, .2, .06); break;
    case 'level': case 'win': // gong
      [[110, .2], [165, .1], [231, .07], [308, .05], [440, .02]].forEach(([f, v]) => tone(f, 0, 3.2, {vol:v, glide:.985, attack:.02}));
      click(0, 400, .25, .2); break;
    case 'taiko': tone(90, 0, .45, {vol:.4, glide:.55, attack:.003}); click(0, 300, .35, .08); break;
    case 'go': tone(180, 0, .5, {vol:.35, glide:.5}); bell(880, .05, .05); break;
    default: click(0, 3800, .1, .02);
  }
}
export function haptic(kind) {
  if (!S.settings.haptics || !navigator.vibrate) return;
  const p = {add:10, remove:6, long:16, unlock:[18, 50, 24], level:[30, 60, 30, 60, 60], tick:5, win:[40, 80, 40, 80, 120]}[kind] ?? 8;
  try { navigator.vibrate(p); } catch (e) {}
}
export function feedback(kind, n = 0) { sound(kind, n); haptic(kind); }

/* ---------- Avisos ---------- */
let hudT;
export function hud(msg) { const h = document.getElementById('hud'); if (!h) return; h.textContent = msg; h.classList.add('show'); clearTimeout(hudT); hudT = setTimeout(() => h.classList.remove('show'), 1800); announce(msg); }
let srT;
export function announce(msg) { const r = document.getElementById('sr'); if (!r) return; clearTimeout(srT); r.textContent = ''; srT = setTimeout(() => { r.textContent = msg; }, 60); }

/* ---------- Partículas: confeti, arroz, sakura y fuegos artificiales ---------- */
const FX = {p:[], raf:0};
const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FA5D3C';
function canvas() {
  const c = document.getElementById('fx'), dpr = Math.min(2, devicePixelRatio || 1);
  if (c.width !== innerWidth * dpr || c.height !== innerHeight * dpr) { c.width = innerWidth * dpr; c.height = innerHeight * dpr; }
  return c;
}
export function celebrate(kind = 'confetti', n) {
  if (reduced()) return;
  canvas();
  const W = innerWidth, H = innerHeight, A = accent();
  if (kind === 'confetti' || kind === 'rice') {
    const cols = kind === 'rice' ? ['#FFFFFF', '#F7F2E8', '#EFE6D2', A] : [A, '#FFD24A', '#34C759', '#0A84FF', '#FF2D55', '#F7F2E8', '#AF52DE', '#FF9F0A'];
    const cnt = n || (kind === 'rice' ? 70 : 150);
    for (let i = 0; i < cnt; i++) {
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.2, sp = 7 + Math.random() * 10;
      FX.p.push({k:kind === 'rice' ? 'grain' : (Math.random() < .28 ? 'grain' : 'rect'), x:W / 2 + (Math.random() - .5) * 40, y:H * .28, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp - 2, g:.3, r:Math.random() * 6.3, vr:(Math.random() - .5) * .4,
        w:kind === 'rice' ? 7 : 6 + Math.random() * 6, h:kind === 'rice' ? 3.4 : 3 + Math.random() * 4, col:cols[i % cols.length], ph:Math.random() * 6.3, life:0, max:420});
    }
  }
  if (kind === 'sakura') {
    const cnt = n || 70;
    for (let i = 0; i < cnt; i++) FX.p.push({k:'petal', x:Math.random() * W, y:-20 - Math.random() * H * .6, vx:.6 + Math.random(), vy:1.2 + Math.random() * 1.4, g:0, r:Math.random() * 6.3, vr:(Math.random() - .5) * .08,
      w:7 + Math.random() * 5, h:5 + Math.random() * 3, col:['#FFC1D6', '#FFB0C8', '#FFD7E4', '#F98CB0'][i % 4], ph:Math.random() * 6.3, life:0, max:900});
  }
  if (kind === 'fireworks') {
    const bursts = n || 5;
    for (let b = 0; b < bursts; b++) {
      const cx = W * (.2 + Math.random() * .6), cy = H * (.15 + Math.random() * .35), col = [A, '#FFD24A', '#7FD8E8', '#B794F6', '#FF6B9A'][b % 5], delay = b * 22;
      for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2, sp = 3 + Math.random() * 3.5; FX.p.push({k:'spark', x:cx, y:cy, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp, g:.06, col, life:-delay, max:110, w:2.4, h:2.4, r:0, vr:0, ph:0}); }
    }
  }
  if (!FX.raf) FX.raf = requestAnimationFrame(loop);
}
function loop() {
  const c = document.getElementById('fx'), x = c.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
  x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, innerWidth, innerHeight);
  FX.p = FX.p.filter(p => p.y < innerHeight + 40 && p.life < p.max);
  for (const p of FX.p) {
    p.life++; if (p.life < 0) continue;
    if (p.k === 'petal') { p.x += p.vx + Math.sin(p.life * .03 + p.ph) * 1.2; p.y += p.vy; p.r += p.vr; }
    else { p.vy += p.g; p.vx *= p.k === 'spark' ? .97 : .985; p.vy *= p.k === 'spark' ? .97 : .985; p.x += p.vx + (p.k === 'spark' ? 0 : Math.sin(p.life * .08 + p.ph) * .6); p.y += p.vy; p.r += p.vr; }
    x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = Math.max(0, Math.min(1, (p.max - p.life) / (p.k === 'spark' ? 50 : 60))); x.fillStyle = p.col;
    if (p.k === 'grain') { x.beginPath(); x.ellipse(0, 0, p.w * .55, p.h * .5, 0, 0, 6.3); x.fill(); }
    else if (p.k === 'petal') { const s = Math.cos(p.life * .05 + p.ph); x.beginPath(); x.ellipse(0, 0, p.w, p.h * Math.abs(s) + .5, 0, 0, 6.3); x.fill(); }
    else if (p.k === 'spark') { x.shadowColor = p.col; x.shadowBlur = 8; x.beginPath(); x.arc(0, 0, p.w, 0, 6.3); x.fill(); }
    else { const s = Math.cos(p.life * .18 + p.ph); x.fillRect(-p.w / 2, -p.h / 2 * s, p.w, p.h * s); }
    x.restore();
  }
  FX.raf = FX.p.length ? requestAnimationFrame(loop) : (x.clearRect(0, 0, innerWidth, innerHeight), 0);
}
export const tierFx = tier => ({bronze:'rice', silver:'confetti', gold:'sakura', plat:'fireworks', accent:'confetti'}[tier] || 'confetti');

/* ---------- Pieza que vuela hasta un destino ---------- */
export function flyTo(fromEl, html, toEl) {
  if (reduced() || !fromEl || !toEl) return Promise.resolve();
  const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  if (b.bottom < 0 || b.top > innerHeight) return Promise.resolve();
  const el = document.createElement('div'); el.className = 'flyer'; el.innerHTML = html;
  const s = Math.min(a.width, 56);
  Object.assign(el.style, {left:a.left + a.width / 2 - s / 2 + 'px', top:a.top + a.height / 2 - s / 2 + 'px', width:s + 'px', height:s + 'px'});
  document.body.appendChild(el);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const lift = Math.min(-60, dy * .4 - 80);
  const anim = el.animate([
    {transform:'translate(0,0) scale(1) rotate(0)', opacity:1},
    {transform:`translate(${dx * .5}px,${lift}px) scale(1.15) rotate(-20deg)`, opacity:1, offset:.45},
    {transform:`translate(${dx}px,${dy}px) scale(.3) rotate(10deg)`, opacity:.2},
  ], {duration:640, easing:'cubic-bezier(.4,.1,.3,1)'});
  return new Promise(res => { anim.onfinish = () => { el.remove(); res(); }; });
}
