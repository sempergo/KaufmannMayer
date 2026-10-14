// Automatischer WCAG-2.1-AA-Scan mit axe-core bei 390 und 1440 px, mobil zusätzlich mit offenem Menü.
// Automatik findet nur einen Teil der Probleme – Tastatur und Klickflächen prüft mobil.js.
const { chromium } = require("playwright");
const path = require("path");
const AXE = require.resolve("axe-core/axe.min.js", { paths: [path.join(__dirname, "..")] });
const B = process.env.BASE || "http://localhost:8788";
let fehler = 0;
async function scan(p, name) {
  await p.addScriptTag({ path: AXE });
  const r = await p.evaluate(async () => await axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } }));
  const v = r.violations;
  fehler += v.length;
  console.log(`  ${name}: ${v.length ? "FEHL" : "ok"} (${r.passes.length} Regeln bestanden)`);
  for (const x of v) console.log(`    [${x.impact}] ${x.id}: ${x.help}\n      ${x.nodes.slice(0, 3).map(n => n.target.join(" ")).join("\n      ")}`);
}
(async () => {
  const br = await chromium.launch();
  for (const w of [390, 1440]) {
    const p = await (await br.newContext({ viewport: { width: w, height: 900 }, bypassCSP: true })).newPage();
    await p.goto(B + "/", { waitUntil: "networkidle" });
    await scan(p, `Startseite @${w}px`);
    if (w < 1120) { await p.click(".menu-toggle"); await scan(p, `Startseite @${w}px, Menü offen`); }
    await p.context().close();
  }
  const p = await br.newPage({ bypassCSP: true });
  await p.goto(B + "/gibt-es-nicht", { waitUntil: "networkidle" });
  await scan(p, "404-Seite");
  await br.close();
  process.exit(fehler ? 1 : 0);
})();
