// Responsivität, Tastaturbedienung und Klickflächen.
//  - kein waagerechtes Scrollen von 360 bis 1920 px
//  - mobile Schnellleiste nur unter 960 px, verdeckt nichts
//  - Menü: per Tastatur öffnen, Tab in die Links, Escape schließt, Fokus zurück
//  - ohne JavaScript bleibt die Navigation erreichbar
//  - jede Klickfläche mindestens 44 x 44 px
const { chromium } = require("playwright");
const B = process.env.BASE || "http://localhost:8788";
let fehler = 0;
const pruefe = (ok, text) => { console.log(`  ${ok ? "ok  " : "FEHL"} ${text}`); if (!ok) fehler++; };

(async () => {
  const br = await chromium.launch();

  console.log("  -- Breiten");
  for (const w of [360, 390, 414, 768, 1024, 1280, 1440, 1920]) {
    const p = await (await br.newContext({ viewport: { width: w, height: 800 } })).newPage();
    await p.goto(B + "/", { waitUntil: "networkidle" });
    const r = await p.evaluate(() => {
      const breit = [...document.querySelectorAll("body *")].filter(e => {
        const b = e.getBoundingClientRect(); return b.width && (b.right > innerWidth + 1 || b.left < -1) && !e.closest(".sprite,.skip-link,.visually-hidden");
      }).slice(0, 3).map(e => e.tagName + "." + e.className);
      const bar = document.querySelector(".callbar");
      return { sw: document.documentElement.scrollWidth, breit, bar: getComputedStyle(bar).display !== "none",
        pad: parseFloat(getComputedStyle(document.body).paddingBottom), barH: bar.getBoundingClientRect().height };
    });
    pruefe(r.sw <= w && r.breit.length === 0, `${w}px: kein Überlauf (scrollWidth ${r.sw})${r.breit.length ? " " + r.breit.join(", ") : ""}`);
    pruefe(w < 960 ? r.bar && r.pad >= r.barH - 1 : !r.bar, `${w}px: Schnellleiste ${w < 960 ? "sichtbar, Seite darunter frei" : "ausgeblendet"}`);
    await p.context().close();
  }

  console.log("  -- Menü per Tastatur (390 px)");
  {
    const p = await (await br.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    await p.goto(B + "/", { waitUntil: "networkidle" });
    const navSichtbar = () => p.isVisible("#hauptnavigation .nav__list a");
    pruefe(!(await navSichtbar()), "Menü ist zu Beginn geschlossen, Links nicht fokussierbar");
    await p.focus(".menu-toggle");
    await p.keyboard.press("Enter");
    pruefe(await p.getAttribute(".menu-toggle", "aria-expanded") === "true" && await navSichtbar(), "Enter öffnet, aria-expanded=true");
    await p.keyboard.press("Tab");
    pruefe(await p.evaluate(() => document.activeElement.textContent.trim()) === "Leistungen", "Tab führt zum ersten Menüpunkt");
    await p.keyboard.press("Escape");
    pruefe(await p.getAttribute(".menu-toggle", "aria-expanded") === "false" && !(await navSichtbar()), "Escape schließt");
    pruefe(await p.evaluate(() => document.activeElement.classList.contains("menu-toggle")), "Fokus zurück auf dem Menüknopf");
    await p.keyboard.press("Space");
    await p.click("#hauptnavigation a[href='#leistungen']");
    await p.waitForTimeout(600);
    pruefe(await p.getAttribute(".menu-toggle", "aria-expanded") === "false", "Klick auf einen Menüpunkt schließt das Menü");
    const top = await p.evaluate(() => document.getElementById("leistungen-titel").getBoundingClientRect().top);
    const kopf = await p.evaluate(() => document.querySelector(".navbar").getBoundingClientRect().bottom);
    pruefe(top >= kopf, `Sprungziel nicht unter der Kopfzeile (Überschrift ${Math.round(top)} px, Kopfzeile endet ${Math.round(kopf)} px)`);
    await p.context().close();
  }

  console.log("  -- Fokus sichtbar (1440 px)");
  {
    const p = await (await br.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await p.goto(B + "/", { waitUntil: "networkidle" });
    let ohne = [];
    for (let i = 0; i < 60; i++) {
      await p.keyboard.press("Tab");
      const f = await p.evaluate(() => {
        const e = document.activeElement; if (!e || e === document.body) return null;
        const s = getComputedStyle(e); const k = e.closest(".service");
        const sichtbar = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2) || (k && getComputedStyle(k).outlineStyle !== "none");
        return { t: (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 30), sichtbar };
      });
      if (f && !f.sichtbar) ohne.push(f.t);
    }
    pruefe(ohne.length === 0, "60 Tab-Schritte: jedes Element mit sichtbarem Fokusrahmen" + (ohne.length ? ": " + ohne.join(", ") : ""));
    await p.context().close();
  }

  console.log("  -- Ohne JavaScript");
  {
    const p = await (await br.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false })).newPage();
    await p.goto(B + "/");
    pruefe(await p.isVisible("#hauptnavigation a[href='#leistungen']") && !(await p.isVisible(".menu-toggle")), "Navigation sichtbar, kein toter Menüknopf");
    await p.context().close();
  }

  console.log("  -- Klickflächen ≥ 44 × 44 px");
  for (const w of [390, 1440]) {
    const p = await (await br.newContext({ viewport: { width: w, height: 900 } })).newPage();
    await p.goto(B + "/", { waitUntil: "networkidle" });
    if (w < 1120) await p.click(".menu-toggle");
    const klein = await p.evaluate(() => [...document.querySelectorAll("a[href], button")].filter(e => {
      const b = e.getBoundingClientRect(); const s = getComputedStyle(e);
      if (!b.width || s.visibility === "hidden" || e.closest(".skip-link,.visually-hidden") || e.classList.contains("skip-link")) return false;
      return b.height < 44 - 0.5 || b.width < 44 - 0.5;
    }).map(e => `${e.textContent.trim().slice(0, 25)} (${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)})`));
    pruefe(klein.length === 0, `${w}px: alle Links und Knöpfe groß genug${klein.length ? ": " + klein.join("; ") : ""}`);
    await p.context().close();
  }

  await br.close();
  console.log(fehler ? `\n  ${fehler} Fehler.` : "\n  Alles in Ordnung.");
  process.exit(fehler ? 1 : 0);
})();
