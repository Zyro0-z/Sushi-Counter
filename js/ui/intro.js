// Bienvenida: los palillos dejan una pieza y se abren; después, tres páginas de presentación.
import {S, save} from '../store.js';
import {CHOPSTICKS, MASCOT, medal, ui} from '../icons.js';
import {$, $$, icon} from './common.js';
import {feedback, reduced, celebrate} from '../fx.js';

export function showIntro(force = false) {
  if (!force && S.settings.introSeen) return;
  const ov = document.createElement('div'); ov.className = 'intro' + (reduced() ? ' still' : ''); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Bienvenida');
  ov.innerHTML = `
    <div class="in-splash">${CHOPSTICKS}<h1 class="in-title"><span>Contador</span> <span>de</span> <span>Sushi</span></h1></div>
    <div class="in-pages" id="inPages">
      <section class="in-p"><div class="in-art art1">${icon('nigiri')}${icon('maki')}${icon('gyoza')}${icon('pato')}${icon('mochi')}</div>
        <h2>Cuenta cada pieza</h2><p>Toca para sumar. Desliza una pieza hacia la derecha para sumar varias, hacia la izquierda para quitar, y mantenla pulsada para ver más opciones.</p></section>
      <section class="in-p"><div class="in-art art2"><b class="num">0,24 €</b><span>coste real de un nigiri de salmón</span><i><em></em></i></div>
        <h2>Descubre lo que cuesta de verdad</h2><p>Mira cuánto le cuestas al restaurante en ingredientes, cuánto valdría en carta y cuándo pierde dinero contigo.</p></section>
      <section class="in-p"><div class="in-art art3"><span class="in-m">${MASCOT}</span>${medal({tier:'gold', g:{p:'crown'}}, false)}${medal({tier:'silver', g:{p:'bolt'}}, false)}${medal({tier:'plat', g:{txt:'150'}}, false)}</div>
        <h2>Juega con tu mesa</h2><p>Misiones, desafíos y logros. La ruleta, el duelo y la contrarreloj están en «Para jugar en la mesa» y en el botón de cuadraditos de arriba.</p></section>
    </div>
    <div class="in-foot"><div class="in-dots"><i class="on"></i><i></i><i></i></div><button class="btn" id="inNext">Siguiente</button><button class="in-skip" id="inSkip">Saltar</button></div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('show'));
  setTimeout(() => ov.classList.add('pages'), reduced() ? 50 : 2300);
  const pg = $('#inPages', ov), next = $('#inNext', ov);
  const idx = () => Math.round(pg.scrollLeft / pg.clientWidth);
  pg.addEventListener('scroll', () => { const i = idx(); $$('.in-dots i', ov).forEach((d, j) => d.classList.toggle('on', j === i)); next.textContent = i === 2 ? 'Empezar' : 'Siguiente'; }, {passive:true});
  const close = () => { S.settings.introSeen = true; save(); ov.classList.remove('show'); feedback('mission'); celebrate('rice', 60); setTimeout(() => ov.remove(), 500); };
  next.onclick = () => { const i = idx(); feedback('tick'); if (i >= 2) close(); else pg.scrollTo({left:(i + 1) * pg.clientWidth, behavior:reduced() ? 'auto' : 'smooth'}); };
  $('#inSkip', ov).onclick = close;
}
