// Lighthouse mobil und Desktop gegen die Zielwerte aus dem Briefing.
// Jede Einstellung läuft LH_RUNS-mal (Standard 3), gewertet wird der Median der Leistung.
// Berichte (HTML + JSON) landen in tools/berichte/ (nicht im Repo).
//
//   node tools/pruefung/lighthouse.js            (BASE=http://localhost:8788)
const { spawnSync } = require("child_process");
const path = require("path"), fs = require("fs");
const B = process.env.BASE || "http://localhost:8788";
const RUNS = +process.env.LH_RUNS || 3;
const OUT = path.join(__dirname, "..", "berichte");
const CLI = require.resolve("lighthouse/cli/index.js", { paths: [path.join(__dirname, "..")] });
const CHROME = process.env.CHROME_PATH || (() => { try { return require("playwright").chromium.executablePath(); } catch (e) { return ""; } })();
const ZIEL = { performance: 90, seo: 100, accessibility: 95, lcp: 2500, cls: 0.1 };
fs.mkdirSync(OUT, { recursive: true });

let fehler = 0;
const zeilen = [];
for (const modus of ["mobil", "desktop"]) {
  const laeufe = [];
  for (let i = 1; i <= RUNS; i++) {
    const basis = path.join(OUT, `lighthouse-${modus}-${i}`);
    const args = [CLI, B + "/", "--quiet", "--output=json", "--output=html", `--output-path=${basis}`,
      "--only-categories=performance,accessibility,best-practices,seo",
      "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage"];
    if (modus === "desktop") args.push("--preset=desktop");
    const r = spawnSync(process.execPath, args, { env: { ...process.env, CHROME_PATH: CHROME }, encoding: "utf8" });
    if (r.status !== 0) { console.log(r.stderr || r.stdout); fehler++; continue; }
    const j = JSON.parse(fs.readFileSync(basis + ".report.json", "utf8"));
    const c = j.categories, a = j.audits;
    laeufe.push({
      performance: Math.round(c.performance.score * 100), accessibility: Math.round(c.accessibility.score * 100),
      bestPractices: Math.round(c["best-practices"].score * 100), seo: Math.round(c.seo.score * 100),
      fcp: a["first-contentful-paint"].numericValue, lcp: a["largest-contentful-paint"].numericValue,
      tbt: a["total-blocking-time"].numericValue, cls: a["cumulative-layout-shift"].numericValue,
      si: a["speed-index"].numericValue, bytes: a["total-byte-weight"].numericValue,
      fails: Object.values(c).flatMap(k => k.auditRefs.filter(r => r.weight > 0).map(r => a[r.id]).filter(x => x.score !== null && x.score < 1).map(x => `${x.id} (${x.score})`)),
    });
  }
  if (!laeufe.length) continue;
  laeufe.sort((x, y) => x.performance - y.performance);
  const m = laeufe[Math.floor(laeufe.length / 2)];
  const ok = m.performance >= ZIEL.performance && m.seo >= ZIEL.seo && m.accessibility >= ZIEL.accessibility && m.lcp < ZIEL.lcp && m.cls < ZIEL.cls;
  if (!ok) fehler++;
  console.log(`  ${modus.padEnd(8)} ${ok ? "ok  " : "FEHL"} Leistung ${m.performance} · Barrierefreiheit ${m.accessibility} · Best Practices ${m.bestPractices} · SEO ${m.seo}`);
  console.log(`           FCP ${(m.fcp / 1000).toFixed(2)} s · LCP ${(m.lcp / 1000).toFixed(2)} s · TBT ${Math.round(m.tbt)} ms · CLS ${m.cls.toFixed(3)} · Speed Index ${(m.si / 1000).toFixed(2)} s · ${Math.round(m.bytes / 1024)} KB`);
  console.log(`           Leistung je Lauf: ${laeufe.map(l => l.performance).join(", ")}`);
  if (m.fails.length) console.log(`           nicht volle Punktzahl: ${m.fails.join(", ")}`);
  zeilen.push({ modus, ...m, laeufe: laeufe.map(l => l.performance) });
}
fs.writeFileSync(path.join(OUT, "lighthouse-zusammenfassung.json"), JSON.stringify({ datum: new Date().toISOString(), basis: B, zeilen }, null, 2));
process.exit(fehler ? 1 : 0);
