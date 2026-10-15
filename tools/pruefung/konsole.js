// Konsolen- und Ladefehler auf allen Seiten aus tools/seiten.json (mobil und Desktop) und auf der 404-Seite.
const { chromium } = require("playwright");
const B = process.env.BASE || "http://localhost:8788";
const SEITEN = require("../seiten.json"); // alle Seiten der Website, eine Liste für alle Prüfungen
// Bekannte, gewollte Meldungen: die 404-Seite meldet ihren eigenen Status in der Konsole.
const BEKANNT = [/^error: Failed to load resource: the server responded with a status of 404/];
let fehler = 0;
(async () => {
  const br = await chromium.launch();
  const faelle = [...SEITEN.flatMap(s => [[s.pfad, 390, true], [s.pfad, 1440, true]]), ["/gibt-es-nicht", 390, false]];
  for (const [pfad, w, muss200] of faelle) {
    const p = await (await br.newContext({ viewport: { width: w, height: 900 } })).newPage();
    const probleme = [];
    p.on("console", m => {
      const t = `${m.type()}: ${m.text()}`;
      if ((m.type() === "error" || m.type() === "warning") && (muss200 || !BEKANNT.some(b => b.test(t)))) probleme.push(t);
    });
    p.on("pageerror", e => probleme.push("JS-Fehler: " + e.message));
    p.on("requestfailed", r => probleme.push("Ladefehler: " + r.url()));
    p.on("response", r => { if (r.status() >= 400 && !(r.url().endsWith(pfad) && !muss200)) probleme.push(`HTTP ${r.status()}: ${r.url()}`); });
    const res = await p.goto(B + pfad, { waitUntil: "networkidle" });
    if (muss200 && res.status() !== 200) probleme.push("Status " + res.status());
    if (!muss200 && res.status() !== 404) probleme.push("404-Seite liefert Status " + res.status());
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(300);
    fehler += probleme.length;
    console.log(`  ${pfad} @${w}px: ${probleme.length ? "FEHL\n    " + probleme.join("\n    ") : "ok"}`);
    await p.context().close();
  }
  await br.close();
  process.exit(fehler ? 1 : 0);
})();
