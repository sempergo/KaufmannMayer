// Automatischer WCAG-2.1-AA-Scan mit axe-core bei 390 und 1440 px für jede Seite aus tools/seiten.json,
// mobil zusätzlich mit offenem Menü; die Anfrage-Seite in allen Zuständen des Formulars.
// Automatik findet nur einen Teil der Probleme – Tastatur und Klickflächen prüft mobil.js.
const { chromium } = require("playwright");
const path = require("path");
const AXE = require.resolve("axe-core/axe.min.js", { paths: [path.join(__dirname, "..")] });
const B = process.env.BASE || "http://localhost:8788";
const SEITEN = require("../seiten.json");
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
  // jede Seite aus tools/seiten.json; wo es ein Mobilmenü gibt, auch offen
  for (const s of SEITEN) for (const w of [390, 1440]) {
    const p = await (await br.newContext({ viewport: { width: w, height: 900 }, bypassCSP: true })).newPage();
    await p.goto(B + s.pfad, { waitUntil: "networkidle" });
    await scan(p, `${s.pfad} @${w}px`);
    if (await p.isVisible(".menu-toggle")) { await p.click(".menu-toggle"); await scan(p, `${s.pfad} @${w}px, Menü offen`); }
    await p.context().close();
  }
  // Anfrage-Seite in den weiteren Zuständen: Nachricht, Fehlerhinweise, Rückfall-E-Mail, Dank
  for (const w of [390, 1440]) {
    const p = await (await br.newContext({ viewport: { width: w, height: 900 }, bypassCSP: true })).newPage();
    await p.route("**/api/anfrage", r => r.fulfill({ status: 404, body: "nicht gefunden" }));
    await p.goto(B + "/anfrage", { waitUntil: "networkidle" });
    await p.click("label:has(#art-nachricht)");
    await p.click(".formular__senden");
    await scan(p, `/anfrage @${w}px, Nachricht mit Fehlerhinweisen`);
    await p.fill("#f-name", "Erika Muster"); await p.fill("#f-email", "erika@example.org");
    await p.click(".formular__senden");
    await p.waitForSelector(".formular__status.ist-fehler a");
    await scan(p, `/anfrage @${w}px, Rückfall-E-Mail`);
    await p.unroute("**/api/anfrage");
    await p.route("**/api/anfrage", r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
    await p.click(".formular__senden");
    await p.waitForSelector("#gesendet.ist-offen");
    await scan(p, `/anfrage @${w}px, Dank`);
    await p.context().close();
  }
  const p = await br.newPage({ bypassCSP: true });
  await p.goto(B + "/gibt-es-nicht", { waitUntil: "networkidle" });
  await scan(p, "404-Seite");
  await br.close();
  process.exit(fehler ? 1 : 0);
})();
