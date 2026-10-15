// Anfrageformular: die Pages Function (Resend nachgebildet, kein Netz) und die Seite /anfrage im Browser.
//  - Function: JSON und Formular-POST, Pflichtfelder, Spam-Falle, fehlender Schlüssel, Inhalt der Mail
//  - Seite mit JavaScript: Umschalter Termin/Nachricht, Hinweise bei fehlenden Angaben, Versand mit Dank,
//    Rückfall auf eine fertige E-Mail, wenn der Endpunkt fehlt (wie auf GitHub Pages)
//  - Seite ohne JavaScript: Umschalter per CSS, Versand per POST bis zum Dank (#gesendet)
// Der Testserver kennt keine Functions; /api/anfrage fängt Playwright ab und reicht es an die Function.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const B = process.env.BASE || "http://localhost:8788";
let fehler = 0;
const pruefe = (ok, text) => { console.log(`  ${ok ? "ok  " : "FEHL"} ${text}`); if (!ok) fehler++; };

(async () => {
  // Function als ES-Modul laden (das Paket tools/ ist CommonJS, deshalb über eine data:-URL)
  const quelle = fs.readFileSync(path.join(__dirname, "..", "..", "functions", "api", "anfrage.js"));
  const fn = await import("data:text/javascript;base64," + quelle.toString("base64"));
  const resend = [];
  globalThis.fetch = async (url, opt) => {
    resend.push({ url, auth: opt.headers.Authorization, mail: JSON.parse(opt.body) });
    return new Response('{"id":"test"}', { status: 200 });
  };
  const ENV = { RESEND_API_KEY: "re_test", MAIL_TO: "postfach@example.org" };
  const rufe = (body, typ = "application/json", env = ENV) => fn.onRequestPost({ env,
    request: new Request("http://localhost/api/anfrage", { method: "POST", headers: { "Content-Type": typ }, body }) });

  console.log("  -- Function");
  let r = await rufe(JSON.stringify({ art: "termin", name: "Erika Muster", email: "erika@example.org", anliegen: ["Verwalterwechsel"],
    objekt: "Frankfurt-Höchst", gespraech: "telefonisch", nachricht: "Hallo <b>Welt</b>\nZeile 2" }));
  pruefe(r.status === 200 && (await r.json()).ok === true, "JSON: gültige Anfrage → 200 { ok: true }");
  const m = resend[0] && resend[0].mail;
  pruefe(resend[0] && resend[0].url === "https://api.resend.com/emails" && resend[0].auth === "Bearer re_test", "an Resend, Schlüssel aus der Umgebung");
  pruefe(m && m.to[0] === "postfach@example.org" && m.reply_to === "erika@example.org", "Empfänger aus MAIL_TO, Antworten gehen an die Absenderin");
  pruefe(m && m.subject === "Terminwunsch – Erika Muster (Frankfurt-Höchst)", `Betreff „${m && m.subject}“`);
  pruefe(m && m.html.includes("Hallo &lt;b&gt;Welt&lt;/b&gt;<br>Zeile 2") && !m.html.includes("<b>Welt"), "Nachricht im HTML maskiert, Zeilenumbruch erhalten");
  pruefe(m && /Anliegen: Verwalterwechsel/.test(m.text) && /Gespräch: telefonisch/.test(m.text), "Textfassung mit allen Angaben");

  resend.length = 0;
  r = await rufe(JSON.stringify({ art: "nachricht", name: "A", email: "a@example.org", gespraech: "persönlich", wunschtermin: "Mo" }));
  pruefe(r.status === 200 && resend[0] && !/Gespräch|Wunschtermin/.test(resend[0].mail.text), "Weg „Nachricht“: Terminfelder entfallen");
  resend.length = 0;
  r = await rufe(JSON.stringify({ name: "Bot", email: "bot@example.org", website: "http://spam.example" }));
  pruefe(r.status === 200 && resend.length === 0, "Spam-Falle: Erfolg vorgetäuscht, nichts gesendet");
  r = await rufe(JSON.stringify({ name: "", email: "keine-adresse" }));
  pruefe(r.status === 422 && resend.length === 0, "ohne Name, ungültige E-Mail → 422");
  r = await rufe("{kaputt");
  pruefe(r.status === 400, "kaputtes JSON → 400");
  r = await rufe(JSON.stringify({ name: "A", email: "a@example.org" }), "application/json", {});
  pruefe(r.status === 500 && (await r.json()).error === "mailer_unconfigured", "ohne RESEND_API_KEY → 500 mailer_unconfigured");
  r = await rufe(new URLSearchParams([["art", "termin"], ["name", "Max"], ["email", "max@example.org"],
    ["anliegen", "Mietverwaltung"], ["anliegen", "Hausgeldabrechnung"]]).toString(), "application/x-www-form-urlencoded");
  pruefe(r.status === 303 && r.headers.get("location") === "/anfrage#gesendet" && resend[0] && /Anliegen: Mietverwaltung, Hausgeldabrechnung/.test(resend[0].mail.text),
    "Formular-POST → 303 auf /anfrage#gesendet, Mehrfachauswahl vollständig");
  r = await rufe(new URLSearchParams({ name: "", email: "x" }).toString(), "application/x-www-form-urlencoded");
  pruefe(r.status === 303 && r.headers.get("location") === "/anfrage#nicht-gesendet", "Formular-POST ungültig → 303 auf /anfrage#nicht-gesendet");

  // Browser: /api/anfrage abfangen und an die Function reichen (oder „fehlt“: 404 wie auf GitHub Pages)
  let endpunkt = "da", empfangen = null;
  const abfangen = (page) => page.route("**/api/anfrage", async (route) => {
    const req = route.request();
    empfangen = { typ: req.headers()["content-type"] || "", body: req.postData() || "" };
    if (endpunkt === "fehlt") return route.fulfill({ status: 404, contentType: "text/html", body: "nicht gefunden" });
    const res = await fn.onRequestPost({ env: ENV, request: new Request(B + "/api/anfrage", { method: "POST", headers: { "Content-Type": empfangen.typ }, body: empfangen.body }) });
    const headers = {}; res.headers.forEach((v, k) => { headers[k] = v; });
    await route.fulfill({ status: res.status, headers, body: await res.text() });
  });
  const br = await chromium.launch();

  console.log("  -- Seite mit JavaScript (1280 px)");
  {
    const p = await (await br.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    await abfangen(p);
    await p.goto(B + "/anfrage", { waitUntil: "networkidle" });
    pruefe(await p.isVisible("#f-termin") && (await p.innerText(".formular__senden")).trim() === "Terminwunsch senden", "Start im Weg „Termin“: Wunschtermin sichtbar, Knopf „Terminwunsch senden“");
    await p.click("label:has(#art-nachricht)");
    pruefe(!(await p.isVisible("#f-termin")) && (await p.innerText(".formular__senden")).trim() === "Nachricht senden", "„Nachricht senden“ blendet die Terminfelder aus");
    await p.click("label:has(#art-termin)");

    await p.click(".formular__senden");
    pruefe(await p.getAttribute("#f-name", "aria-invalid") === "true" && await p.getAttribute("#f-email", "aria-invalid") === "true", "leer abgeschickt: Name und E-Mail als ungültig markiert");
    pruefe(await p.isVisible("#f-name-fehler") && await p.getAttribute("#f-name", "aria-describedby") === "f-name-fehler", "Hinweis unter dem Feld, per aria-describedby verknüpft");
    pruefe(await p.evaluate(() => document.activeElement.id) === "f-name", "Fokus auf dem ersten fehlenden Feld");
    pruefe(/Name und E-Mail/.test(await p.textContent(".formular__status")) && empfangen === null, "Meldung am Knopf nennt die Felder, nichts gesendet");
    await p.fill("#f-name", "Erika Muster");
    pruefe(await p.getAttribute("#f-name", "aria-invalid") === null && await p.getAttribute("#f-name", "aria-describedby") === null && !(await p.isVisible("#f-name-fehler")),
      "Markierung und Hinweis verschwinden beim Ausfüllen");
    await p.fill("#f-email", "erika@example.org");
    await p.click("label.wahl__chip:has(input[value='Verwalterwechsel'])");
    await p.click("label.wahl__chip:has(input[value='Hausgeldabrechnung'])");
    await p.selectOption("#f-rolle", "Verwaltungsbeirat");
    await p.fill("#f-nachricht", "Wir planen einen Wechsel zum Jahresende.");

    endpunkt = "fehlt";
    await p.click(".formular__senden");
    await p.waitForSelector(".formular__status.ist-fehler a[href^='mailto:']", { timeout: 5000 }).catch(() => {});
    const href = (await p.getAttribute(".formular__status a", "href").catch(() => "")) || "";
    const text = decodeURIComponent((href.split("body=")[1] || ""));
    pruefe(href.startsWith("mailto:jhmayer@t-online.de?subject=Terminwunsch") && text.includes("Name: Erika Muster") &&
      text.includes("Anliegen: Verwalterwechsel, Hausgeldabrechnung") && text.includes("Wir planen einen Wechsel"), "Endpunkt fehlt: fertige E-Mail mit allen Angaben angeboten");
    pruefe(!(await p.isDisabled(".formular__senden")), "Knopf danach wieder bedienbar");

    endpunkt = "da"; resend.length = 0;
    await p.click(".formular__senden");
    await p.waitForSelector("#gesendet.ist-offen", { timeout: 5000 }).catch(() => {});
    let j = {}; try { j = JSON.parse(empfangen.body); } catch (e) {}
    pruefe(empfangen.typ.includes("application/json") && j.art === "termin" && j.anliegen && j.anliegen.length === 2 && j.rolle === "Verwaltungsbeirat" && j.gespraech === "telefonisch",
      "als JSON gesendet, mit Mehrfachauswahl und Terminangaben");
    pruefe(await p.isVisible("#gesendet") && !(await p.isVisible("#formular")), "Dank ersetzt das Formular");
    pruefe(await p.evaluate(() => document.activeElement.id) === "gesendet", "Fokus auf dem Dank");
    pruefe(resend.length === 1 && resend[0].mail.subject.startsWith("Terminwunsch – Erika Muster"), "Mail ging an Resend");

    await p.goto("about:blank"); // sonst nur ein Sprung im selben Dokument, das Skript liefe nicht neu
    await p.goto(B + "/anfrage#nachricht", { waitUntil: "networkidle" });
    pruefe(await p.isChecked("#art-nachricht") && !(await p.isVisible("#f-termin")), "/anfrage#nachricht öffnet den Weg „Nachricht“");
    await p.context().close();
  }

  console.log("  -- Seite ohne JavaScript (390 px)");
  {
    const p = await (await br.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false })).newPage();
    await abfangen(p);
    await p.goto(B + "/anfrage");
    await p.click("label:has(#art-nachricht)");
    pruefe(!(await p.isVisible("#f-termin")) && (await p.innerText(".formular__senden")).trim() === "Nachricht senden", "Umschalter wirkt auch ohne JavaScript (CSS :has)");
    empfangen = null;
    await p.click(".formular__senden");
    await p.waitForTimeout(400);
    pruefe(empfangen === null && p.url() === B + "/anfrage", "leer abgeschickt: Browser hält an (required), nichts gesendet");
    await p.fill("#f-name", "Max Muster");
    await p.fill("#f-email", "max@example.org");
    await p.click("label.wahl__chip:has(input[value='Mietverwaltung'])");
    resend.length = 0;
    await Promise.all([p.waitForURL(/#gesendet$/, { timeout: 5000 }).catch(() => {}), p.click(".formular__senden")]);
    pruefe(p.url() === B + "/anfrage#gesendet" && await p.isVisible("#gesendet") && !(await p.isVisible("#formular")), "nach dem Senden: Dank statt Formular (/anfrage#gesendet)");
    pruefe(resend.length === 1 && resend[0].mail.subject === "Nachricht – Max Muster" && /Anliegen: Mietverwaltung/.test(resend[0].mail.text), "Mail ging an Resend");
    await p.goto(B + "/anfrage#nicht-gesendet");
    pruefe(await p.isVisible("#nicht-gesendet") && !(await p.isVisible("#formular")), "Fehlerseite #nicht-gesendet nennt Telefon und E-Mail");
    await p.context().close();
  }

  // Wunsch des Auftraggebers: am Desktop alles auf einem Bildschirm, das Formular beginnt in der Mitte,
  // keine Navigationsleiste – oben links nur das Logo. Beide Wege (Termin, Nachricht), mit Fehlerhinweisen.
  console.log("  -- Ein Bildschirm (Desktop)");
  // Fensterhöhen statt Bildschirmhöhen: Tabs und Leisten des Browsers nehmen rund 100 px weg
  for (const [w, h] of [[1280, 800], [1440, 800], [1440, 900], [1920, 960]]) {
    const p = await (await br.newContext({ viewport: { width: w, height: h } })).newPage();
    await p.goto(B + "/anfrage", { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    const mass = () => p.evaluate(() => {
      const b = document.querySelector(".anfrage__buehne").getBoundingClientRect();
      const logo = document.querySelector(".anfrage-kopf img").getBoundingClientRect();
      return { sh: document.documentElement.scrollHeight, links: Math.round(b.left), navbar: !!document.querySelector(".navbar"),
        logo: [Math.round(logo.left), Math.round(logo.top)] };
    });
    let m = await mass();
    pruefe(m.sh <= h, `${w}×${h} Termin: passt auf einen Bildschirm (Seitenhöhe ${m.sh})`);
    pruefe(Math.abs(m.links - w / 2) <= 2, `${w}×${h}: Formularfläche beginnt in der Mitte (${m.links} px)`);
    pruefe(!m.navbar && m.logo[0] <= w * 0.08 && m.logo[1] <= 48, `${w}×${h}: keine Leiste, Logo oben links (${m.logo.join(", ")})`);
    await p.click("label:has(#art-nachricht)");
    await p.click(".formular__senden");
    m = await mass();
    pruefe(m.sh <= h, `${w}×${h} Nachricht mit Fehlerhinweisen: passt auf einen Bildschirm (Seitenhöhe ${m.sh})`);
    await p.click("label:has(#art-termin)");
    m = await mass();
    pruefe(m.sh <= h, `${w}×${h} Termin mit Fehlerhinweisen: passt auf einen Bildschirm (Seitenhöhe ${m.sh})`);
    await p.context().close();
  }

  await br.close();
  console.log(fehler ? `\n  ${fehler} Fehler.` : "\n  Alles in Ordnung.");
  process.exit(fehler ? 1 : 0);
})();
