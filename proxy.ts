import type { Express, Request, Response } from "express";

// ---------------------------------------------------------------------------
// Stream proxy: makes blocked streaming gateways work on any DNS / ISP.
//
// The browser only ever talks to THIS server's own domain. The server fetches
// the gateway embed pages + video segments itself and relays them back.
// Result: no DNS change needed on the phone, and ISP domain blocks are gone.
//
// Two routes:
//   GET /api/embed?u=<gateway embed url>  -> rewritten HTML page for the iframe
//   GET /api/px?u=<absolute asset url>    -> proxied subresource (js/css/m3u8/mp4...)
// ---------------------------------------------------------------------------

const UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

// Gateways allowed as iframe entry points.
const GATEWAY_HOSTS = new Set([
  "vidsrc.to",
  "www.2embed.cc",
  "2embed.cc",
  "streamimdb.ru",
]);

// Video/media assets may live on third-party CDNs — allow those through by
// file extension. Everything else must be on a gateway host (anti-abuse).
const MEDIA_RE = /\.(m3u8|m3u|ts|m4s|mp4|webm|mov|mkv|key|vtt|srt|jpg|jpeg|png|webp|gif|woff2?|ttf)(\?|#|$)/i;

function isAllowed(u: URL): boolean {
  if (GATEWAY_HOSTS.has(u.hostname)) return true;
  return MEDIA_RE.test(u.pathname);
}

function pxUrl(abs: string): string {
  return `/api/px?u=${encodeURIComponent(abs)}`;
}

function resolveUrl(raw: string, base: string): string | null {
  try {
    const u = new URL(raw, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

interface UpstreamResult {
  resp: globalThis.Response;
  finalUrl: string;
}

async function fetchUpstream(urlStr: string, req: Request): Promise<UpstreamResult> {
  let url = urlStr;
  for (let i = 0; i < 6; i++) {
    const u = new URL(url);
    if (!isAllowed(u)) {
      throw new Error(`blocked host: ${u.hostname}`);
    }
    const headers: Record<string, string> = {
      "User-Agent": UA,
      "Referer": `${u.protocol}//${u.host}/`,
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
    };
    const range = req.headers.range;
    if (typeof range === "string") headers["Range"] = range;

    const r = await fetch(url, { headers, redirect: "manual" });
    if ([301, 302, 303, 307, 308].includes(r.status)) {
      const loc = r.headers.get("location");
      if (!loc) throw new Error("redirect without location");
      url = new URL(loc, url).href;
      continue;
    }
    return { resp: r, finalUrl: url };
  }
  throw new Error("too many redirects");
}

function pipeResponse(up: globalThis.Response, res: Response) {
  res.status(up.status);
  const pass = [
    "content-type",
    "content-length",
    "accept-ranges",
    "content-range",
    "cache-control",
    "expires",
  ];
  for (const h of pass) {
    const v = up.headers.get(h);
    if (v) res.setHeader(h, v);
  }
  if (up.body) {
    const reader = up.body.getReader();
    const pump = async () => {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.write(value)) {
            await new Promise<void>((r) => res.once("drain", r));
          }
        }
      } catch {
        /* client went away */
      } finally {
        res.end();
      }
    };
    pump();
  } else {
    res.end();
  }
}

// --- HLS playlist + CSS rewriting ------------------------------------------

function rewritePlaylist(text: string, base: string): string {
  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return line;
      if (t.startsWith("#")) {
        // EXT-X-KEY:URI="..." / EXT-X-MAP:URI="..." / EXT-X-MEDIA:URI="..."
        return line.replace(/URI="([^"]+)"/g, (_m, p1) => {
          const abs = resolveUrl(p1, base);
          return abs ? `URI="${pxUrl(abs)}"` : _m;
        });
      }
      const abs = resolveUrl(t, base);
      return abs ? pxUrl(abs) : line;
    })
    .join("\n");
}

function rewriteCssUrls(css: string, base: string): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (_m, q, raw) => {
    const abs = resolveUrl(raw.trim(), base);
    return abs ? `url(${q}${pxUrl(abs)}${q})` : _m;
  });
}

// --- HTML rewriting for the iframe entry page -------------------------------

const PATCH_SCRIPT = `(function(){
var PX="/api/px?u=";
var HOSTS=/^(vidsrc\\.to|2embed\\.cc|www\\.2embed\\.cc|streamimdb\\.ru)$/;
function proxify(url){
  try{
    var u=new URL(url,document.baseURI);
    if(u.protocol!=="http:"&&u.protocol!=="https:")return url;
    if(HOSTS.test(u.hostname)||/\\.(m3u8|m3u|ts|m4s|mp4|webm|mov|mkv|key|vtt|srt)(\\?|#|$)/i.test(u.pathname)){
      return PX+encodeURIComponent(u.href);
    }
  }catch(e){}
  return url;
}
var origFetch=window.fetch;
if(origFetch){
  window.fetch=function(input,init){
    try{
      if(typeof input==="string"){input=proxify(input);}
      else if(input&&input.url){input=new Request(proxify(input.url),input);}
    }catch(e){}
    return origFetch.call(this,input,init);
  };
}
var origOpen=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(method,url){
  var args=Array.prototype.slice.call(arguments);
  try{args[1]=proxify(String(url));}catch(e){}
  return origOpen.apply(this,args);
};
var OrigWS=window.WebSocket;
if(OrigWS){window.WebSocket=function(url,protocols){
  try{url=proxify(String(url));}catch(e){}
  return new OrigWS(url,protocols);
};}
})();`;

function rewriteHtml(html: string, pageUrl: string): string {
  // Drop any existing <base> so relative URLs resolve predictably, then set
  // our own base to the gateway — the injected patch absolutizes against it.
  let out = html.replace(/<base\b[^>]*>/gi, "");

  // Rewrite static resource attributes to go through the proxy.
  // (meta "content" is skipped — it holds text like "noindex, nofollow", not URLs)
  out = out.replace(
    /\s(src|href|srcset|action|poster|data-src|data-href)=("([^"]*)"|'([^']*)')/gi,
    (m, attr: string, _q: string, d: string, s: string) => {
      const val = (d !== undefined ? d : s).trim();
      if (!val) return m;
      const quote = m.includes('"') ? '"' : "'";
      const lower = attr.toLowerCase();
      if (lower === "srcset") {
        const rewritten = val
          .split(",")
          .map((part: string) => {
            const [u, desc] = part.trim().split(/\s+/, 2);
            const abs = resolveUrl(u, pageUrl);
            return abs && isAllowed(new URL(abs))
              ? `${pxUrl(abs)}${desc ? " " + desc : ""}`
              : part.trim();
          })
          .join(", ");
        return ` ${attr}=${quote}${rewritten}${quote}`;
      }
      const abs = resolveUrl(val, pageUrl);
      if (abs) {
        try {
          if (isAllowed(new URL(abs))) return ` ${attr}=${quote}${pxUrl(abs)}${quote}`;
        } catch {
          /* fall through */
        }
      }
      return m;
    }
  );

  // Inject base + fetch/XHR patch right after <head>.
  const inject = `<base href="${pageUrl}"><script>${PATCH_SCRIPT}</script>`;
  if (/<head\b[^>]*>/i.test(out)) {
    out = out.replace(/<head\b[^>]*>/i, (m) => `${m}${inject}`);
  } else {
    out = inject + out;
  }
  return out;
}

// --- Route registration ------------------------------------------------------

export function registerProxy(app: Express) {
  // Entry page for the player iframe.
  app.get("/api/embed", async (req: Request, res: Response) => {
    const target = req.query.u as string | undefined;
    if (!target) {
      res.status(400).send("missing ?u=");
      return;
    }
    let targetUrl: URL;
    try {
      targetUrl = new URL(target);
    } catch {
      res.status(400).send("bad url");
      return;
    }
    if (!GATEWAY_HOSTS.has(targetUrl.hostname)) {
      res.status(403).send("gateway not allowed");
      return;
    }
    try {
      const { resp, finalUrl } = await fetchUpstream(targetUrl.href, req);
      const ct = resp.headers.get("content-type") || "";
      if (!resp.ok || !ct.includes("html")) {
        res.status(502).send(`gateway returned ${resp.status}`);
        return;
      }
      const html = await resp.text();
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.setHeader("cache-control", "no-store");
      res.send(rewriteHtml(html, finalUrl));
    } catch (err: any) {
      res.status(502).send(`proxy error: ${err?.message || err}`);
    }
  });

  // Generic subresource proxy (js, css, m3u8 playlists, video segments...).
  app.get("/api/px", async (req: Request, res: Response) => {
    const target = req.query.u as string | undefined;
    if (!target) {
      res.status(400).send("missing ?u=");
      return;
    }
    try {
      const { resp, finalUrl } = await fetchUpstream(target, req);
      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("mpegurl") || /\.m3u8?(\?|#|$)/i.test(finalUrl)) {
        const text = await resp.text();
        res.setHeader("content-type", "application/vnd.apple.mpegurl");
        res.setHeader("cache-control", "no-store");
        res.send(rewritePlaylist(text, finalUrl));
        return;
      }
      if (ct.includes("text/css")) {
        const text = await resp.text();
        res.setHeader("content-type", "text/css");
        res.send(rewriteCssUrls(text, finalUrl));
        return;
      }
      pipeResponse(resp, res);
    } catch (err: any) {
      res.status(502).send(`proxy error: ${err?.message || err}`);
    }
  });
}
