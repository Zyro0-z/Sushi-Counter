// Utilidades del lector propio (los archivos que empiezan por "_" no son rutas en Vercel).
// Funciones puras para poder probarlas con node --test.

// Solo direcciones públicas: nada de localhost ni redes internas
export function safeUrl(raw) {
  let u; try { u = new URL(String(raw)); } catch (e) { return null; }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
  const h = u.hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^\[|:/.test(h)) return null;
  if (/^(127|10|0)\.|^169\.254\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.|^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return null;
  return u.href;
}

const unent = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const strip = s => unent(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const hrefOf = tag => { const m = tag.match(/href="([^"]+)"/); return m ? unent(m[1]) : null; };
// Resultados de DuckDuckGo (versión HTML sin JavaScript)
export function parseDuck(html) {
  const out = [];
  for (const p of String(html).split(/<div[^>]+class="[^"]*\bresult\b[^"]*"/).slice(1)) {
    const a = p.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/); if (!a) continue;
    let href = hrefOf(a[0].match(/<a[^>]*>/)[0]); if (!href) continue;
    const ud = href.match(/[?&]uddg=([^&]+)/); if (ud) href = decodeURIComponent(ud[1]);
    if (href.startsWith('//')) href = 'https:' + href;
    if (!/^https?:\/\//.test(href) || /duckduckgo\.com\/(y\.js|l\/)/.test(href)) continue;
    const sn = p.match(/class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div|td)>/);
    out.push({url:href, title:strip(a[1]), snippet:sn ? strip(sn[1]) : ''});
    if (out.length >= 15) break;
  }
  return out;
}
// Resultados de Bing
export function parseBing(html) {
  const out = [];
  for (const p of String(html).split(/<li[^>]+class="b_algo[^"]*"/).slice(1)) {
    const a = p.match(/<h2[^>]*>\s*(<a[^>]*>)([\s\S]*?)<\/a>/); if (!a) continue;
    let href = hrefOf(a[1]); if (!href) continue;
    const u = href.match(/[?&]u=a1([^&]+)/);
    if (u) { try { href = Buffer.from(u[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); } catch (e) {} }
    if (!/^https?:\/\//.test(href)) continue;
    const sn = p.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    out.push({url:href, title:strip(a[2]), snippet:sn ? strip(sn[1]) : ''});
    if (out.length >= 15) break;
  }
  return out;
}
