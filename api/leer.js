// Lector propio de la app, para desplegar gratis en Vercel (importando este repositorio).
//   /api/leer?url=https://…   → la página o el PDF tal cual, con permiso para que la app lo lea
//   /api/leer?buscar=texto    → resultados de búsqueda web en JSON [{url, title, snippet}]
//   /api/leer?ping=1          → {ok:true}, para que la app compruebe que está activo
// Solo responde a la app (GitHub Pages o el propio dominio de Vercel) y solo a direcciones públicas.
import {safeUrl, parseDuck, parseBing} from './_lib.js';

const ORIGINS = [/^https:\/\/zyro0-z\.github\.io$/i, /^https:\/\/[a-z0-9-]+\.vercel\.app$/i, /^http:\/\/localhost(:\d+)?$/];
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const MAX = 12 * 1024 * 1024;

async function get(url, ms = 15000, accept = 'text/html,application/xhtml+xml,application/pdf,image/*,*/*;q=0.8') {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, {redirect:'follow', signal:c.signal, headers:{'User-Agent':UA, 'Accept':accept, 'Accept-Language':'es-ES,es;q=0.9,en;q=0.6'}}); }
  finally { clearTimeout(t); }
}
async function search(q) {
  const tries = [
    ['https://html.duckduckgo.com/html/?kl=es-es&q=' + encodeURIComponent(q), parseDuck],
    ['https://www.bing.com/search?setlang=es&cc=ES&q=' + encodeURIComponent(q), parseBing],
  ];
  for (const [u, parse] of tries) {
    try { const r = await get(u, 10000); if (!r.ok) continue; const list = parse(await r.text()); if (list.length) return list; } catch (e) {}
  }
  return [];
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin && !ORIGINS.some(re => re.test(origin))) { res.status(403).json({error:'origen'}); return; }
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, X-Final-Url');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const {url, buscar, ping} = req.query || {};
  if (ping) { res.status(200).json({ok:true, v:1}); return; }
  try {
    if (buscar) {
      res.setHeader('Cache-Control', 's-maxage=86400');
      res.status(200).json(await search(String(buscar).slice(0, 160)));
      return;
    }
    const target = safeUrl(url);
    if (!target) { res.status(400).json({error:'url'}); return; }
    const r = await get(target, 20000);
    const type = r.headers.get('content-type') || 'application/octet-stream';
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX) { res.status(413).json({error:'grande'}); return; }
    res.setHeader('Content-Type', type);
    res.setHeader('X-Final-Url', r.url || target);
    res.setHeader('Cache-Control', 's-maxage=21600');
    res.status(r.ok ? 200 : 502).send(buf);
  } catch (e) {
    res.status(502).json({error:'lectura'});
  }
}
