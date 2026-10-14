// Kontrast aus gerenderten Pixeln (nicht aus berechneten Styles) für Knöpfe,
// Pfeil-Links, Labels und Platzhalter – Messweise aus sempergo/21layer (cta-kontrast.js):
// Screenshot des Elements, Farbhistogramm, häufigste Farbe = Grund, die am stärksten
// abweichende häufige Farbe = Schrift. Schwelle 4,5:1.
const { chromium } = require("playwright");
const B = process.env.BASE || "http://localhost:8788";
const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const ZIELE = [".btn", ".more", ".tag", ".chip", ".tbd", ".nav__list a", ".topline__links a", ".trust__item", ".mock__list li", ".footer__legal a"];
let fehler = 0;
(async () => {
  const br = await chromium.launch();
  const probe = await br.newPage(); await probe.goto("about:blank");
  for (const w of [390, 1440]) {
    const p = await (await br.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" })).newPage();
    await p.goto(B + "/", { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    let n = 0, min = 99, schwach = [];
    for (const sel of ZIELE) {
      for (const el of await p.$$(sel)) {
        if (!(await el.isVisible())) continue;
        const buf = await el.screenshot({ animations: "disabled" });
        const liste = await probe.evaluate(async (d) => {
          const img = new Image(); await new Promise(r => { img.onload = r; img.src = d; });
          // Rand abschneiden: Ecken und Rahmen zeigen sonst den Untergrund. Seitlich so viel
          // wie der größtmögliche Radius (halbe Höhe, bei Pillen-Buttons), oben/unten 4 px.
          const RY = img.width > 16 && img.height > 16 ? 4 : 0;
          const RX = RY ? Math.min(Math.round(img.height / 2), Math.round(img.width / 4)) : 0;
          const cv = document.createElement("canvas"); cv.width = img.width - 2 * RX; cv.height = img.height - 2 * RY;
          const x = cv.getContext("2d"); x.drawImage(img, -RX, -RY);
          const px = x.getImageData(0, 0, cv.width, cv.height).data; const h = new Map();
          for (let i = 0; i < px.length; i += 4) { const k = (px[i] >> 2 << 12) | (px[i + 1] >> 2 << 6) | (px[i + 2] >> 2); h.set(k, (h.get(k) || 0) + 1); }
          const tot = px.length / 4;
          return [...h.entries()].filter(([, c]) => c / tot >= 0.004)
            .map(([k, c]) => ({ rgb: [((k >> 12) & 63) * 4 + 2, ((k >> 6) & 63) * 4 + 2, (k & 63) * 4 + 2], c })).sort((a, b) => b.c - a.c);
        }, "data:image/png;base64," + buf.toString("base64"));
        if (liste.length < 2) continue;
        const bg = liste[0].rgb;
        const fg = liste.slice(1).sort((a, b) => Math.abs(lum(b.rgb) - lum(bg)) - Math.abs(lum(a.rgb) - lum(bg)))[0].rgb;
        const r = ratio(fg, bg); n++; min = Math.min(min, r);
        if (r < 4.5) { fehler++; schwach.push(`${sel} „${(await el.textContent()).trim().slice(0, 30)}“ ${r.toFixed(2)}:1`); }
      }
    }
    console.log(`  ${w}px: ${n} Elemente gemessen, kleinster Kontrast ${min.toFixed(2)}:1 ${schwach.length ? "FEHL\n    " + schwach.join("\n    ") : "ok"}`);
    await p.context().close();
  }
  await br.close();
  process.exit(fehler ? 1 : 0);
})();
