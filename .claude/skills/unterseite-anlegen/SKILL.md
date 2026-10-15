---
name: unterseite-anlegen
description: Verwenden, wenn auf der Kaufmann-&-Mayer-Website eine neue Seite entsteht – Leistungsseite, Referenz, Aktuelles, Rechtstexte, Kontakt- oder Formularseite – oder eine Seite der alten Wix-Website nachgebaut oder umgezogen wird.
---

# Unterseite anlegen

Jede Seite steht in `tools/seiten.json` (`pfad`, `datei`, `name`, `vorschau`). Daraus lesen alle
Prüfungen, Lighthouse, Screenshots und die Vorschau; `seo.js` wird rot, solange eine Datei in `site/`
dort fehlt. Vorlagen: `site/anfrage.html` (fokussiert: Logo, Telefon, keine Navigation) oder Kopf und
Fuß aus `site/index.html` (volle Navigation, Schnellleiste).

## Checkliste

1. **Inhalt:** Text der alten Wix-Seite nach `quellen/<seite>-wix.txt` sichern (mit Abrufdatum) und nur
   Belegtes übernehmen, Fehlendes als `.tbd`. Werbeaussagen („garantieren“), Orte außerhalb des
   bestätigten Einsatzgebiets, abweichende Adressen: nicht übernehmen, als Frage ins README. Kontakt nur
   06145 938481 und jhmayer@t-online.de, Adresse `[Geschäftsadresse]`.
2. **Datei:** `site/<pfad>.html` flach – kein Ordner mit `index.html` (Cloudflare leitet sonst auf
   `/pfad/` um). Gab es die Adresse bei Wix, denselben Pfad nehmen; sonst alt → neu in `site/_redirects`.
3. **Kopf:** `<script>document.documentElement.className="js"</script>` zeichengleich übernehmen
   (CSP-Hash in `_headers`). Eigener Title, Description 110–160 Zeichen, Canonical
   `https://www.kaufmann-mayer.de<pfad>`, OG/Twitter, JSON-LD mit Verweis `{"@id": ".../#organisation"}`
   statt neuer Organisation, keine Bewertungen, kein `noindex`.
4. **Gerüst:** Sprite nur mit genutzten Symbolen. Sprungmarken zur Startseite absolut (`/#leistungen`),
   eigener Menüpunkt mit `aria-current="page"`. Mit voller Kopfzeile beginnt `main` mit `.hero` (er läuft
   per negativem Rand hinter die Leiste). Mit Schnellleiste behält `body` sein `padding-bottom`, ohne sie
   `padding-bottom: 0` wie `.seite-anfrage`. Eine H1, jede `section` mit H2 und `aria-labelledby`.
5. **CSS/JS:** eigener Abschnitt „6.x <Seite>“ in `site.css`, Klasse am `body`; Bausteine in Spalten mit
   eigener Breite über Container Queries. In `site.js` ein neuer nummerierter Abschnitt, der nur läuft,
   wenn sein Element da ist; Gemeinsames (Formular) nicht an IDs einer Seite binden. Gestaltung: Skill
   `gestaltung-kaufmann-mayer`.
6. **Formular:** `action="/api/anfrage" method="post"`, gleiche Bausteine wie `/anfrage`; neue Felder oder
   Arten in Function, `alsMail` (`site.js`) und `tools/pruefung/formular.js` (siehe `ANFRAGE-SETUP.md`).
   Weiterleitungsziele der Function nur aus einer festen Liste.
7. **Eintragen:** `tools/seiten.json`, `site/sitemap.xml` (`loc`, `lastmod`), `site/llms.txt` („Wichtige
   Seiten“), README (Aufbau, Seitenaufbau, TODO-Liste der Unterseiten, Lighthouse-Spalten). Seiten mit
   Zuständen (Formular, Akkordeon) bekommen eigene Fälle in `a11y.js`, sonst läuft alles über die Liste.
8. **Prüfen und übergeben:** Skill `aenderung-pruefen` (alle Prüfungen), `ausschnitt.js <selektor> --pfad
   <pfad> --breiten 390,768,1024,1200,1440`, Vorschau mit allen Dateien, nach grünem Pages-Lauf den Link
   `https://sempergo.github.io/KaufmannMayer<pfad>`.

## Fallen

| Falle | Richtig |
|---|---|
| `href="#leistungen"` auf der Unterseite | `/#leistungen` – `seo.js` prüft Ziele und Symbole |
| Ordner `pfad/index.html` | flache Datei `pfad.html` |
| Inline-Skript im Kopf abgewandelt | zeichengleich, sonst blockiert die CSP (`konsole.js`) |
| Formular ohne Endpunkt (lokal, GitHub Pages, Vorschau) | gewollt: Rückfall-E-Mail; `pages.py` schreibt `action` nicht um |
| Test springt von `/seite` nach `/seite#x` | vorher `about:blank` – sonst läuft das Skript nicht neu |
| Link im Fließtext unter 44 px | erlaubt (WCAG 2.5.8), `mobil.js` nimmt ihn aus |
| Deko ragt über den Rand (Skyline) | Eltern `overflow: hidden`, in `mobil.js` mit Kommentar ausnehmen |
| Spalte mittig in einer Seite, die höher als das Fenster ist | oben bündig |
| Links in Brotkrumen, `<dd>`, `<address>` (nicht im Fließtext) | `min-height: 2.75rem`, sonst rot in `mobil.js` |
| neues `<img src="/img/…">` oder `.jpg`/`.svg` | `vorschau.py` bettet nur das Logo ein – Skript erweitern, sonst bricht es ab |
| Rechtstexte mit `.tbd` oder alten Wix-Daten | Impressum braucht eine bestätigte Anschrift (§ 5 DDG, nicht TMG) – vorher fragen, nicht live stellen |
