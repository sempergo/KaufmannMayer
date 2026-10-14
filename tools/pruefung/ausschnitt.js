// Bildausschnitte eines Elements zur Sichtkontrolle: verschiedene Breiten, Hover-Zustand,
// Animationsbilder über die Zeit. Erwartet einen laufenden Server (node tools/server.js) oder BASE=…
//
//   node tools/pruefung/ausschnitt.js <selektor> [--breiten 390,1440] [--hover <selektor>]
//        [--zeiten 0,600,1500,4000] [--pfad /] [--ziel <ordner>] [--ruhig]
//
// --hover   fährt vor dem Bild mit der Maus über dieses Element (nur Breiten ≥ 800 px)
// --zeiten  Millisekunden nach dem Einscrollen; je Zeitpunkt ein Bild (Animationen)
// --ruhig   prefers-reduced-motion: reduce (Endzustand ohne Bewegung)
// Ausgabe: tools/berichte/ausschnitte/<name>-<breite>[-hover][-<ms>].png
const { chromium } = require("playwright");
const path = require("path"), fs = require("fs");
const B = process.env.BASE || "http://localhost:8788";
const arg = process.argv.slice(2);
const opt = (n, d) => { const i = arg.indexOf("--" + n); return i < 0 ? d : arg[i + 1]; };
const sel = arg[0];
if (!sel || sel.startsWith("--")) { console.error("Selektor fehlt, z. B. node tools/pruefung/ausschnitt.js .pillars --hover '.pillar:nth-child(2)'"); process.exit(1); }
const breiten = opt("breiten", "390,1440").split(",").map(Number);
const hover = opt("hover", null);
const zeiten = opt("zeiten", null);
const ziel = path.resolve(opt("ziel", path.join(__dirname, "..", "berichte", "ausschnitte")));
const name = sel.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "element";
(async () => {
  fs.mkdirSync(ziel, { recursive: true });
  const br = await chromium.launch();
  for (const w of breiten) {
    const ctx = await br.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 }, deviceScaleFactor: w < 800 ? 2 : 1,
      reducedMotion: arg.includes("--ruhig") ? "reduce" : "no-preference" });
    const p = await ctx.newPage();
    await p.goto(B + opt("pfad", "/"), { waitUntil: "networkidle" });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; return document.fonts.ready; });
    const el = await p.$(sel);
    if (!el) { console.error(`  ${w}px: ${sel} nicht gefunden`); await ctx.close(); continue; }
    await p.evaluate(e => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 160), el);
    const bild = async (zusatz) => {
      const datei = path.join(ziel, `${name}-${w}${zusatz}.png`);
      await el.screenshot({ path: datei });
      console.log("  " + path.relative(process.cwd(), datei));
    };
    if (zeiten) {
      let bisher = 0;
      for (const t of zeiten.split(",").map(Number)) { await p.waitForTimeout(t - bisher); bisher = t; await bild(`-${t}`); }
    } else {
      await p.waitForTimeout(300);
      await bild("");
      if (hover && w >= 800) { await p.hover(hover); await p.waitForTimeout(700); await bild("-hover"); }
    }
    await ctx.close();
  }
  await br.close();
})();
