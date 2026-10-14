// Rendert tools/assets/og-bild.html mit den Schriften und dem Logo der Seite
// und speichert site/img/og-image.jpg (1200 x 630). Startet den Testserver selbst.
//   node tools/assets/og-bild.js
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path"), fs = require("fs");
const ROOT = path.join(__dirname, "..", "..");
(async () => {
  // Vorlage vorübergehend neben die Seite legen, damit /css und /img aufgelöst werden
  const tmp = path.join(ROOT, "site", "_og-vorlage.html");
  fs.copyFileSync(path.join(__dirname, "og-bild.html"), tmp);
  const port = 8799;
  const server = spawn(process.execPath, [path.join(ROOT, "tools", "server.js")], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
  await new Promise(r => setTimeout(r, 600));
  try {
    const br = await chromium.launch();
    const p = await br.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: "reduce", bypassCSP: true });
    // der Server liefert _-Dateien nicht aus, daher direkt als Inhalt laden;
    // bypassCSP, weil die Vorlage Inline-Stile nutzt (die Seite selbst nicht)
    await p.goto(`http://localhost:${port}/`);
    await p.setContent(fs.readFileSync(tmp, "utf8"), { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(ROOT, "site", "img", "og-image.jpg"), type: "jpeg", quality: 86 });
    await br.close();
    console.log("site/img/og-image.jpg geschrieben");
  } finally {
    server.kill();
    fs.unlinkSync(tmp);
  }
})();
