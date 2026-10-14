// Führt alle Prüfungen nacheinander aus (Muster aus sempergo/21layer).
//
//   node tools/pruefung/alle.js              alles, inkl. Lighthouse
//   node tools/pruefung/alle.js seo mobil    nur Prüfungen, deren Name passt
//
// Startet den Testserver (tools/server.js) selbst auf einem freien Port.
// Playwright wird lokal oder global gesucht; Chromium kommt über PLAYWRIGHT_BROWSERS_PATH.
const { spawn, spawnSync } = require("child_process");
const net = require("net"), path = require("path"), fs = require("fs");

const DIR = __dirname;
const REIHE = ["konsole", "seo", "a11y", "mobil", "kontrast", "lighthouse"];
const filter = process.argv.slice(2);
const auswahl = filter.length ? REIHE.filter(n => filter.some(f => n.includes(f))) : REIHE;

const env = { ...process.env };
try { require.resolve("playwright"); } catch (e) {
  const g = spawnSync("npm", ["root", "-g"], { encoding: "utf8" }).stdout.trim();
  if (g && fs.existsSync(path.join(g, "playwright"))) env.NODE_PATH = [g, env.NODE_PATH].filter(Boolean).join(path.delimiter);
  else { console.error("Playwright nicht gefunden. Installieren mit: npm i -g playwright"); process.exit(2); }
}

function freierPort() {
  return new Promise(r => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
}
function warteAuf(port) {
  return new Promise((r, j) => { let n = 0; (function versuch() {
    const c = net.connect(port, "127.0.0.1", () => { c.end(); r(); });
    c.on("error", () => { if (++n > 50) j(new Error("Server startet nicht")); else setTimeout(versuch, 100); });
  })(); });
}

(async () => {
  const port = await freierPort();
  const server = spawn(process.execPath, [path.join(DIR, "..", "server.js")], { env: { ...env, PORT: String(port) }, stdio: "ignore" });
  await warteAuf(port);
  env.BASE = "http://localhost:" + port;

  const ergebnis = [];
  for (const name of auswahl) {
    console.log(`\n======== ${name} ========`);
    const t = Date.now();
    const r = spawnSync(process.execPath, [path.join(DIR, name + ".js")], { env, stdio: "inherit" });
    ergebnis.push([name, r.status === 0, ((Date.now() - t) / 1000).toFixed(0)]);
  }
  server.kill();

  console.log("\n======== Zusammenfassung ========");
  ergebnis.forEach(([n, gut, s]) => console.log(`  ${gut ? "ok  " : "FEHL"}  ${n.padEnd(12)} ${s}s`));
  const rot = ergebnis.filter(e => !e[1]).length;
  console.log(rot ? `\n${rot} von ${ergebnis.length} Prüfungen fehlgeschlagen.` : `\nAlle ${ergebnis.length} Prüfungen bestanden.`);
  process.exit(rot ? 1 : 0);
})();
