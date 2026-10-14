// Geometrie der Werterhalt-Grafik („Steuerberater trifft Ingenieur“) im Endbild, gemessen im Browser:
// - Desktop-Fassung: Überschriften und Begriff-Pillen liegen mit Abstand in ihrem Kreis und
//   ebenso mit Abstand außerhalb der Schnittmenge; Abzeichen, „Werterhalt“ und Untertitel liegen in der Schnittmenge.
// - Mobilfassung (< 40em): Begriffe stehen unter den Kreisen; nur die Schnittmenge wird geprüft.
// Gemessen werden die Ecken der Rechtecke – bei Pillen etwas strenger als die runde Form.
const { chromium } = require("playwright");
const B = process.env.BASE || "http://localhost:8788";
const RAND = 12;   // Mindestabstand der Pillen und Überschriften zu jedem Kreisrand (px)
const MITTE = 4;   // Mindestabstand von Abzeichen, Titel und Untertitel zum Rand der Schnittmenge (px)
let fehler = 0;
const pruefe = (ok, text) => { console.log(`  ${ok ? "ok  " : "FEHL"} ${text}`); if (!ok) fehler++; };

(async () => {
  const br = await chromium.launch();
  for (const w of [360, 390, 768, 1024, 1200, 1440, 1920]) {
    const p = await (await br.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" })).newPage();
    await p.goto(B + "/", { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => {
      const kreis = sel => { const b = document.querySelector(sel).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, r: b.width / 2 }; };
      const L = kreis(".wh-stroke--l"), R = kreis(".wh-stroke--r");
      const ecken = el => { const b = el.getBoundingClientRect(); return [[b.left, b.top], [b.right, b.top], [b.left, b.bottom], [b.right, b.bottom]]; };
      const innen = (el, k) => Math.min(...ecken(el).map(e => k.r - Math.hypot(e[0] - k.x, e[1] - k.y)));
      const aussen = (el, k) => Math.min(...ecken(el).map(e => Math.hypot(e[0] - k.x, e[1] - k.y) - k.r));
      const name = el => el.textContent.trim() || el.className;
      const mobil = matchMedia("(max-width: 39.99em)").matches;
      const seiten = [];
      if (!mobil) {
        for (const [seite, eigen, fremd] of [["l", L, R], ["r", R, L]]) {
          for (const el of document.querySelectorAll(`.wh-${seite} .wh-chip, .wh-${seite} .wh-head b`)) {
            seiten.push({ was: name(el), wert: Math.min(innen(el, eigen), aussen(el, fremd)) });
          }
        }
      }
      const mitte = [...document.querySelectorAll(".wh-badge, .wh-title, .wh-sub")].map(el => ({ was: name(el) || "Abzeichen", wert: Math.min(innen(el, L), innen(el, R)) }));
      return { mobil, seiten, mitte };
    });
    const knapp = (liste, grenze) => liste.filter(e => e.wert < grenze).map(e => `${e.was} ${e.wert.toFixed(1)} px`);
    if (!r.mobil) {
      const min = Math.min(...r.seiten.map(e => e.wert));
      const zuNah = knapp(r.seiten, RAND);
      pruefe(!zuNah.length, `${w}px: Begriffe im Kreis, kleinster Abstand ${min.toFixed(1)} px (≥ ${RAND})${zuNah.length ? " – zu nah: " + zuNah.join(", ") : ""}`);
    }
    const minM = Math.min(...r.mitte.map(e => e.wert));
    const zuNahM = knapp(r.mitte, MITTE);
    pruefe(!zuNahM.length, `${w}px: Mitte in der Schnittmenge, kleinster Abstand ${minM.toFixed(1)} px (≥ ${MITTE})${zuNahM.length ? " – zu nah: " + zuNahM.join(", ") : ""}`);
    await p.context().close();
  }
  await br.close();
  console.log(fehler ? `\n  ${fehler} Fehler.` : "\n  Alles in Ordnung.");
  process.exit(fehler ? 1 : 0);
})();
