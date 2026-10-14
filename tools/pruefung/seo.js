// SEO- und Strukturprüfung der Startseite gegen die Vorgaben aus dem Briefing.
const { chromium } = require("playwright");
const crypto = require("crypto"), fs = require("fs"), path = require("path");
const B = process.env.BASE || "http://localhost:8788";
const SITE = path.join(__dirname, "..", "..", "site");
const TEL = "tel:+496145938481";
const LEISTUNGEN = ["/weg-verwaltung-frankfurt", "/mietverwaltung", "/bauleitung", "/hausmeister-service", "/weiterbildung"];
let fehler = 0;
const pruefe = (ok, text) => { console.log(`  ${ok ? "ok  " : "FEHL"} ${text}`); if (!ok) fehler++; };

(async () => {
  const br = await chromium.launch();
  const p = await br.newPage();
  await p.goto(B + "/", { waitUntil: "networkidle" });
  const d = await p.evaluate(() => {
    const meta = n => document.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.content || "";
    const sections = [...document.querySelectorAll("main section")].map(s => ({
      id: s.id || s.className, h2: s.querySelectorAll(":scope h2").length,
      label: s.getAttribute("aria-labelledby") && document.getElementById(s.getAttribute("aria-labelledby"))?.tagName }));
    const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(h => +h.tagName[1]);
    return {
      lang: document.documentElement.lang, title: document.title,
      desc: meta("description"), canonical: document.querySelector('link[rel="canonical"]')?.href,
      og: ["og:title", "og:description", "og:url", "og:image", "og:type", "og:locale", "og:image:alt"].map(n => [n, meta(n)]),
      tw: ["twitter:card", "twitter:title", "twitter:description", "twitter:image"].map(n => [n, meta(n)]),
      h1: document.querySelectorAll("h1").length, sections, heads,
      landmarks: ["header", "nav", "main", "footer"].map(t => [t, document.querySelectorAll(t).length]),
      tel: [...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute("href")),
      imgs: [...document.querySelectorAll("img")].map(i => ({ src: i.getAttribute("src"), alt: i.getAttribute("alt"), w: i.getAttribute("width"), h: i.getAttribute("height") })),
      leerLinks: [...document.querySelectorAll("a")].filter(a => !a.getAttribute("href") || a.getAttribute("href") === "#").length,
      hrefs: [...document.querySelectorAll("a")].map(a => a.getAttribute("href")),
      anker: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute("href")).filter(h => h.length > 1 && !document.querySelector(h)),
      jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent),
      inline: [...document.querySelectorAll("script:not([src]):not([type])")].map(s => s.textContent),
      h1text: document.querySelector("h1")?.textContent.replace(/­/g, ""),
      h2text: [...document.querySelectorAll("h2")].map(h => h.textContent.replace(/­/g, "")),
      h3text: [...document.querySelectorAll("h3")].map(h => h.textContent),
    };
  });

  console.log("  -- Kopf");
  pruefe(d.lang === "de", `lang="${d.lang}"`);
  pruefe(d.title === "Hausverwaltung Frankfurt & Rhein-Main | Kaufmann & Mayer", `Title: ${d.title} (${d.title.length} Zeichen)`);
  pruefe(d.desc.length >= 110 && d.desc.length <= 160, `Description ${d.desc.length} Zeichen`);
  pruefe(d.canonical === "https://www.kaufmann-mayer.de/", `Canonical ${d.canonical}`);
  for (const [n, v] of [...d.og, ...d.tw]) pruefe(!!v, `${n} gesetzt`);

  console.log("  -- Struktur");
  pruefe(d.h1 === 1, `genau eine H1 (${d.h1})`);
  pruefe(/Immobilienverwaltung für Frankfurt am Main/.test(d.h1text), `H1-Text: ${d.h1text}`);
  const [hero, ...rest] = d.sections;
  pruefe(hero.label === "H1", "Hero-Sektion trägt die H1");
  for (const s of rest) pruefe(s.h2 >= 1 && s.label === "H2", `Sektion ${s.id}: eigene H2, per aria-labelledby verknüpft`);
  let sprung = false; for (let i = 1; i < d.heads.length; i++) if (d.heads[i] > d.heads[i - 1] + 1) sprung = true;
  pruefe(!sprung && d.heads[0] === 1, "Überschriften ohne Sprung (H1 → H2 → H3)");
  for (const [t, n] of d.landmarks) pruefe(n >= 1, `<${t}> vorhanden (${n})`);
  const alle = [d.h1text, ...d.h2text, ...d.h3text].join(" | ");
  pruefe(/Hausverwaltung in Frankfurt|Hausverwaltung Frankfurt/.test(alle), "„Hausverwaltung Frankfurt“ in einer Überschrift");
  pruefe(/WEG-Verwaltung/.test(alle), "„WEG-Verwaltung“ in einer Überschrift");

  console.log("  -- Links und Bilder");
  pruefe(d.tel.length > 0 && d.tel.every(t => t === TEL), `alle ${d.tel.length} Telefonlinks = ${TEL}`);
  pruefe(d.imgs.every(i => i.alt && i.w && i.h), `alle ${d.imgs.length} Bilder mit Alt-Text und festen Maßen`);
  pruefe(d.leerLinks === 0, "keine leeren Links (href fehlt oder #)");
  pruefe(d.anker.length === 0, "alle Sprungmarken haben ein Ziel" + (d.anker.length ? ": " + d.anker.join(", ") : ""));
  for (const u of [...LEISTUNGEN, "/referenz-nls-78", "/anfrage"]) pruefe(d.hrefs.includes(u), `Link auf ${u}`);

  console.log("  -- Strukturierte Daten");
  let ld = null; try { ld = JSON.parse(d.jsonld[0]); } catch (e) {}
  const org = ld && ld["@graph"].find(x => x["@type"] === "RealEstateAgent");
  pruefe(!!org, "JSON-LD gültig, RealEstateAgent vorhanden");
  pruefe(org && org.telephone === "+49 6145 938481" && org.email === "jhmayer@t-online.de" && org.url === "https://www.kaufmann-mayer.de/", "Name, URL, Telefon, E-Mail");
  pruefe(org && !("address" in org), "Adresse bewusst weggelassen (TODO)");
  pruefe(org && !("aggregateRating" in org), "keine Bewertungs-Auszeichnung (Google-Richtlinie: keine eigenen Bewertungen)");

  console.log("  -- Dateien");
  for (const f of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/img/og-image.jpg", "/favicon.ico"]) {
    const r = await p.request.get(B + f); pruefe(r.status() === 200, `${f} erreichbar`);
  }
  const robots = await (await p.request.get(B + "/robots.txt")).text();
  pruefe(/Sitemap: https:\/\/www\.kaufmann-mayer\.de\/sitemap\.xml/.test(robots) && !/Disallow: \/\s*$/m.test(robots), "robots.txt verweist auf Sitemap, sperrt nichts");

  console.log("  -- Sicherheit");
  const headers = fs.readFileSync(path.join(SITE, "_headers"), "utf8");
  for (const s of d.inline) {
    const h = crypto.createHash("sha256").update(s).digest("base64");
    pruefe(headers.includes(`'sha256-${h}'`), "Hash des Inline-Skripts steht in der CSP");
  }
  const r404 = fs.readFileSync(path.join(SITE, "404.html"), "utf8").match(/<script>(.*?)<\/script>/)[1];
  pruefe(headers.includes(`'sha256-${crypto.createHash("sha256").update(r404).digest("base64")}'`), "Hash des Inline-Skripts der 404-Seite steht in der CSP");
  const html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  pruefe(!/\sstyle="/.test(html), "keine style-Attribute (CSP style-src 'self')");
  pruefe(!/https?:\/\/(fonts\.googleapis|fonts\.gstatic|cdn)/.test(html), "keine externen Schrift- oder CDN-Einbindungen");

  await br.close();
  console.log(fehler ? `\n  ${fehler} Fehler.` : "\n  Alles in Ordnung.");
  process.exit(fehler ? 1 : 0);
})();
