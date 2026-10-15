// Lokaler Testserver: bildet das Routing von Cloudflare Pages nach
// (Weiterleitungen aus site/_redirects, exakter Pfad, dann .html, dann /index.html, sonst 404.html),
// setzt die Header aus site/_headers und komprimiert Text (gzip) wie Cloudflare, damit
// Prüfungen und Lighthouse dasselbe sehen wie live.
// Übernommen aus sempergo/21layer (tools/pruefung/server.js), angepasst.
//
//   node tools/server.js              -> http://localhost:8788
//   PORT=9000 node tools/server.js
//   ROOT=/pfad node tools/server.js   (andere Wurzel)
const http = require("http"), fs = require("fs"), path = require("path"), zlib = require("zlib");
const ROOT = path.resolve(process.env.ROOT || path.join(__dirname, "..", "site"));
const PORT = +process.env.PORT || 8788;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".json": "application/json", ".avif": "image/avif",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8" };

// _headers im Format von Cloudflare Pages: Pfadmuster, darunter eingerückte "Name: Wert"-Zeilen
function regeln() {
  const f = path.join(ROOT, "_headers");
  if (!fs.existsSync(f)) return [];
  const out = []; let cur = null;
  for (const zeile of fs.readFileSync(f, "utf8").split("\n")) {
    if (!zeile.trim() || zeile.trim().startsWith("#")) continue;
    if (!/^\s/.test(zeile)) { cur = { muster: zeile.trim(), header: [] }; out.push(cur); continue; }
    const m = /^\s+([^:]+):\s*(.*)$/.exec(zeile);
    if (m && cur) cur.header.push([m[1].trim(), m[2].trim()]);
  }
  return out.map(r => ({ ...r, re: new RegExp("^" + r.muster.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$") }));
}
const REGELN = regeln();
// _redirects im Format von Cloudflare Pages: "Quelle Ziel [Status]", nur exakte Pfade
const UMLEITUNGEN = new Map((fs.existsSync(path.join(ROOT, "_redirects")) ? fs.readFileSync(path.join(ROOT, "_redirects"), "utf8") : "")
  .split("\n").map(z => z.trim()).filter(z => z && !z.startsWith("#")).map(z => z.split(/\s+/)).map(([von, nach, st]) => [von, [nach, +st || 302]]));
function header(p) {
  const h = {};
  for (const r of REGELN) if (r.re.test(p)) for (const [k, v] of r.header) h[k] = v;
  return h;
}

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const anfrage = p;
  if (UMLEITUNGEN.has(p)) {
    const [nach, status] = UMLEITUNGEN.get(p);
    res.writeHead(status, { Location: nach });
    return res.end();
  }
  if (p.endsWith("/")) p += "index.html";
  let file = null;
  for (const t of [p, p + ".html", p + "/index.html"]) {
    const f = path.join(ROOT, t);
    if (f.startsWith(ROOT) && fs.existsSync(f) && fs.statSync(f).isFile()) { file = f; break; }
  }
  if (!file || path.basename(file).startsWith("_")) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", ...header(anfrage) });
    return fs.createReadStream(path.join(ROOT, "404.html")).pipe(res);
  }
  const type = TYPES[path.extname(file)] || "application/octet-stream";
  const text = /^(text|application\/(javascript|json|xml))|svg/.test(type);
  if (text && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
    res.writeHead(200, { "Content-Type": type, "Content-Encoding": "gzip", "Vary": "Accept-Encoding", ...header(anfrage) });
    return fs.createReadStream(file).pipe(zlib.createGzip({ level: 9 })).pipe(res);
  }
  res.writeHead(200, { "Content-Type": type, "Content-Length": fs.statSync(file).size, ...header(anfrage) });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log("bereit auf http://localhost:" + PORT));
