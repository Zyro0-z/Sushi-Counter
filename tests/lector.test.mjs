import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safeUrl, parseDuck, parseBing} from '../api/_lib.js';

test('el lector solo acepta direcciones públicas', () => {
  assert.equal(safeUrl('https://sakura.example/carta.pdf'), 'https://sakura.example/carta.pdf');
  for (const u of ['http://localhost/x', 'http://127.0.0.1/', 'http://192.168.1.4/', 'file:///etc/passwd', 'http://10.0.0.2', 'http://user:pw@a.com/', 'http://[::1]/']) assert.equal(safeUrl(u), null, u);
});

test('lee resultados de DuckDuckGo', () => {
  const html = `<div class="result results_links results_links_deep web-result "><div class="links_main links_deep result__body"><h2 class="result__title">
    <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.sakurabuffet.es%2Fcarta%2F&amp;rut=abc">Carta | <b>Sakura</b> Buffet Palencia</a></h2>
    <a class="result__snippet" href="//duckduckgo.com/l/?uddg=x">Buffet libre japonés en Palencia. Nigiris, makis…</a></div></div>
    <div class="result results_links web-result "><div class="result__body"><a class="result__a" href="https://www.tripadvisor.es/Restaurant_Review-g187.html">Sakura - Tripadvisor</a></div></div>`;
  const r = parseDuck(html);
  assert.equal(r.length, 2);
  assert.deepEqual(r[0], {url:'https://www.sakurabuffet.es/carta/', title:'Carta | Sakura Buffet Palencia', snippet:'Buffet libre japonés en Palencia. Nigiris, makis…'});
});

test('lee resultados de Bing con enlaces codificados', () => {
  const enc = Buffer.from('https://kyotowok.es/menu.pdf').toString('base64').replace(/=+$/, '');
  const html = `<ol id="b_results"><li class="b_algo" data-id><h2><a href="https://www.bing.com/ck/a?!&amp;&amp;p=1&amp;u=a1${enc}&amp;ntb=1">Kyoto Wok carta</a></h2><div class="b_caption"><p class="b_lineclamp2">Carta del buffet</p></div></li></ol>`;
  assert.deepEqual(parseBing(html), [{url:'https://kyotowok.es/menu.pdf', title:'Kyoto Wok carta', snippet:'Carta del buffet'}]);
});
