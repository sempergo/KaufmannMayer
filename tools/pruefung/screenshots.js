// Ganzseitige Screenshots bei 390 und 1440 px (plus optional weitere Breiten).
// Erwartet einen laufenden Server (node tools/server.js) oder BASE=…
//   node tools/pruefung/screenshots.js [ziel-ordner] [breite ...]
// Standardziel: tools/berichte/screenshots (nicht im Repo). Die Momentaufnahmen
// in screenshots/ sind daraus als WebP verkleinert.
const { chromium } = require("playwright");
const path = require("path"), fs = require("fs");
const B = process.env.BASE || "http://localhost:8788";
const ziel = path.resolve(process.argv[2] || path.join(__dirname, "..", "berichte", "screenshots"));
const breiten = process.argv.slice(3).map(Number).filter(Boolean);
(async () => {
  fs.mkdirSync(ziel, { recursive: true });
  const br = await chromium.launch();
  for (const w of breiten.length ? breiten : [390, 1440]) {
    const ctx = await br.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 }, deviceScaleFactor: w < 800 ? 2 : 1, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await p.goto(B + "/", { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(ziel, `startseite-${w}-oben.png`) });
    await p.screenshot({ path: path.join(ziel, `startseite-${w}.png`), fullPage: true });
    console.log("  " + w + " px gespeichert");
    await ctx.close();
  }
  await br.close();
})();
