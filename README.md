# Kaufmann & Mayer – neue Startseite

Entwurf der neuen Startseite für die Hausverwaltung Kaufmann & Mayer OHG,
Frankfurt am Main. Gedacht als Pitch an den Inhaber: Er soll zeigen, dass ein
schneller, logisch aufgebauter Auftritt mehr Reichweite bei Google und mehr
Mandatsanfragen bringt als die heutige Wix-Seite.

Statisches HTML und CSS, rund 2,5 KB JavaScript, kein Baukasten, kein
Build-Schritt, deploybar auf Cloudflare Pages. Inhalte und Logo stammen von
[kaufmann-mayer.de](https://www.kaufmann-mayer.de); Layout, Farben, Schriften
und Bildsprache sind neu: hell und ruhig (Weiß und kühles Off-White),
Dunkelblau als Zweitfarbe, Orange als Akzent, leicht abgerundete Elemente und
zwei erklärende Grafiken. Als Stilreferenz diente
[relaxa-immobilien.de](https://relaxa-immobilien.de/) (Struktur, Ruhe,
Grafiken) – übernommen wurde die Haltung, nicht die Gestaltung.

| Desktop 1440 px | Mobil 390 px |
|---|---|
| ![Startseite Desktop, erster Bildschirm](screenshots/startseite-1440-oben.webp) | ![Startseite mobil, erster Bildschirm](screenshots/startseite-390-oben.webp) |

Ganze Seite: [Desktop](screenshots/startseite-1440.webp) ·
[Mobil](screenshots/startseite-390.webp)

## Lighthouse

Gemessen am 14.10.2026 (aktueller Stand: freistehende Leiste, Abschnitte als Boxen) mit Lighthouse 12.8.2 (Chromium aus Playwright 1.56,
simulierte Drosselung) gegen den lokalen Testserver, der Routing, Header und
Komprimierung von Cloudflare Pages nachbildet. Je drei Läufe, angegeben ist der
Median.

| | Ziel | Mobil | Desktop |
|---|---|---|---|
| Leistung | ≥ 90 | **100** | **100** |
| Barrierefreiheit | ≥ 95 | **100** | **100** |
| Best Practices | – | 100 | 100 |
| SEO | 100 | **100** | **100** |
| Largest Contentful Paint | < 2,5 s | **1,44 s** | 0,34 s |
| Cumulative Layout Shift | < 0,1 | **0,000** | 0,000 |
| First Contentful Paint | – | 0,76 s | 0,20 s |
| Total Blocking Time | – | 0 ms | 0 ms |
| Übertragene Daten | – | 89 KB | 86 KB |

Mobil schwankt die Leistung zwischen den Läufen leicht (beim ersten Entwurf
einmal 97). Live auf Cloudflare können die Werte etwas anders
ausfallen; nach dem Livegang einmal mit PageSpeed Insights gegenprüfen.

Zusätzlich grün: axe-core ohne Befund (WCAG 2.0–2.2 AA, mit offenem und
geschlossenem Mobilmenü), kein waagerechtes Scrollen von 360 bis 1920 px, alle
Klickflächen ≥ 44 × 44 px, kleinster gemessener Textkontrast 5,04:1.

## Starten

Voraussetzung: Node.js ab 18.

```bash
node tools/server.js            # http://localhost:8788
```

Der Testserver bildet Cloudflare Pages nach: saubere URLs ohne `.html`,
`404.html` für unbekannte Pfade, Header aus `site/_headers`, gzip. Ein
beliebiger anderer statischer Server (`npx serve site`) zeigt die Seite
ebenfalls an, aber ohne diese Eigenschaften.

## Bauen

Es gibt keinen Build-Schritt – `site/` ist die fertige Website. Zwei Skripte
erzeugen Bilddateien neu, falls sich Logo oder Seitentitel ändern:

```bash
python3 -I tools/assets/logo.py       # Logo (AVIF/WebP/PNG, 1x–3x), Emblem, Favicon, Touch-Icon
node tools/assets/og-bild.js          # Vorschaubild zum Teilen: site/img/og-image.jpg
```

`logo.py` braucht eine aktuelle Pillow-Version mit AVIF-Unterstützung, `og-bild.js`
Playwright (`npm i -g playwright`).

## Prüfen

```bash
cd tools && npm ci && cd ..           # einmalig: axe-core, Lighthouse
node tools/pruefung/alle.js           # alle Prüfungen inkl. Lighthouse, ca. 2 min
node tools/pruefung/alle.js seo a11y  # nur einzelne
```

Was jede Prüfung abdeckt, steht im Skill `.claude/skills/aenderung-pruefen/`.
Lighthouse-Berichte (HTML und JSON) landen in `tools/berichte/`.

## Deployen auf Cloudflare Pages

**Variante A – mit Git (empfohlen).** Im Cloudflare-Dashboard unter
*Workers & Pages → Erstellen → Pages → Mit Git verbinden* dieses Repository
wählen und einstellen:

| Einstellung | Wert |
|---|---|
| Framework-Voreinstellung | Keine |
| Build-Befehl | *(leer lassen)* |
| Ausgabeverzeichnis | `site` |
| Produktionszweig | `main` |

Jeder Push auf `main` geht dann live, jeder andere Zweig bekommt eine
Vorschau-URL.

**Variante B – Direkt-Upload** ohne Git-Anbindung:

```bash
npx wrangler login
npx wrangler pages deploy site --project-name=kaufmann-mayer
```

**Eigene Domain:** im Pages-Projekt unter *Benutzerdefinierte Domains*
`www.kaufmann-mayer.de` hinzufügen und `kaufmann-mayer.de` per Weiterleitung
auf `www` schicken (Canonical, Sitemap und strukturierte Daten nutzen `www`).

> **Vor dem Umstellen der Domain:** Die heutige Wix-Seite hat indexierte
> Unterseiten. Jede davon muss auf der neuen Seite existieren oder per
> `site/_redirects` (301) weitergeleitet werden, sonst gehen Rankings verloren:
> `/weg-verwaltung-frankfurt`, `/referenz-nls-78`, `/hausverwaltung-frankfurt`,
> `/news`, `/kundenportal`, `/kontakt`, `/impressum`, `/datenschutz`,
> `/cookies`. Bis dahin landen Links auf diese Seiten auf `404.html`.

## Aufbau

```
site/                     Website (Ausgabeverzeichnis für Cloudflare Pages)
  index.html              Startseite
  404.html                Fehlerseite (noindex)
  css/site.css            Design-Tokens und alle Stile
  js/site.js              Mobilmenü und Markierung des aktiven Menüpunkts (einziges Skript)
  fonts/                  Source Serif 4 (Display, 500), Instrument Sans (variabel), nur latin
  img/                    Logo 1x–3x als AVIF/WebP/PNG, Emblem für die Netzwerk-Grafik, og-image.jpg
  _headers                Sicherheits-Header (CSP) und Cache-Regeln
  robots.txt, sitemap.xml, llms.txt, favicon.ico, apple-touch-icon.png
quellen/                  Original-Logo von der Wix-Seite
tools/                    Testserver, Prüfungen, Asset-Skripte (eigenes package.json)
screenshots/              Momentaufnahmen bei 390 und 1440 px
.claude/skills/           Skillbase aus dem 21Layer-Repo, siehe SKILLS.md
```

Der Stack folgt dem 21Layer-Repo: statisches HTML ohne Build-Schritt,
selbst gehostete Schriften, Cloudflare Pages, Prüfungen mit Playwright. Einziger
Unterschied: Die Website liegt in `site/` statt im Wurzelverzeichnis. So
werden README, Skills und Werkzeuge gar nicht erst ausgeliefert, und es braucht
keine Sperre über Functions.

## Seitenaufbau und Aufgabe jeder Sektion

| # | Sektion | Aufgabe |
|---|---|---|
| 1 | Kopfzeile mit Infoleiste | Vertrauen (§ 26a WEG), Telefon, Weg zum Portal, Anfrage immer erreichbar |
| 2 | Hero mit Vertrauensleiste | in Sekunden klar: wer, wo, wofür; zwei Wege zur Anfrage; Google-Bewertung, Zertifizierung, IHK, Erfahrung |
| 3 | Steuerberater trifft Ingenieur | Vertrauen durch zwei Inhaber mit klaren Zuständigkeiten – Abgrenzung zur Großverwaltung |
| 4 | Alleinstellungsmerkmale | Leistung erklären: was anders ist als bei anderen Verwaltungen |
| 5 | 360-Grad-Leistungsumfang | Leistung erklären, interne Links auf die fünf Leistungsseiten, Kachel „Verwalterwechsel“ führt zur Anfrage |
| 6 | Referenz NLS 78 | Vertrauen durch ein großes, konkretes Objekt |
| 7 | Eigentümerportal | Bestandskunden schnell ans Ziel, zeigt digitale Arbeitsweise |
| 8 | Servicepartner | Vertrauen durch regionale Partner |
| 9 | Anfrage / Kontakt | zur Anfrage führen: großer Button, Telefon, Ansprechpartner, Antwortzeit |
| 10 | Footer | Orientierung, Rechtliches, Einsatzgebiet für die lokale Suche |

Mobil bleibt die Reihenfolge; die Leistungen werden zur Liste, die
Vertrauensleiste rückt direkt unter die Buttons, die Grafiken skalieren mit
(mobil bis an den Boxrand, damit die Beschriftung ab 360 px lesbar bleibt),
und eine freistehende weiße Leiste unten hält „Anrufen“ und „Angebot
anfordern“ im Griff.

## Designsystem

Alle Werte stehen als CSS-Variablen am Anfang von `site/css/site.css`.

| Token | Wert | Einsatz |
|---|---|---|
| `--white` / `--bg-soft` | `#ffffff` / `#f4f7fb` | Seitengrund weiß, Boxen Off-White |
| `--bg-tint` | `#eaf1fa` | helles Blau: Hero, Kontakt, Icon-Kreise |
| `--navy-900` | `#14243b` | Text (15,6:1), Überschriften, Primärbutton, Karte „Verwalterwechsel“ |
| `--navy-700` | `#2c4266` | Icons |
| `--slate-600` | `#4a5666` | Nebentext (7,5:1) |
| `--orange-500` | `#e8700c` | Akzent: Strich an der H1, Linien, Punkte, Sterne, Akzentbutton |
| `--orange-700` | `#9a4308` | Orange als Text und Fokusrahmen (6,6:1) |
| `--line` | `#dfe5ee` | feine Linien und Kartenränder |
| `--r-sm` / `--r` / `--r-lg` / `--r-box` | 4 / 6 / 8 / 12 px | leicht abgerundete Ecken; 12 px für Boxen und Leisten |
| `--box-pad` / `--box-gap` | 16–64 px / 12–20 px | Innenabstand der Boxen, Abstand zwischen ihnen |

- **Struktur:** Hero ganzflächig im hellblauen Verlauf; alle Abschnitte danach
  als leicht abgerundete Boxen (Off-White, feine Linie) auf weißem Grund, mit
  kleinem Abstand untereinander; die Kontakt-Box im hellblauen Verlauf. Inhalte
  im 12-Spalten-Raster (max. 1200 px). Karten weiß mit feiner Linie und weichem
  Schatten.
- **Navigation:** freistehende weiße Leiste mit abgerundeten Ecken und weichem
  Schatten; sie bleibt beim Scrollen mit etwas Abstand zum Fensterrand stehen,
  der Inhalt läuft sichtbar darunter durch. Der Menüpunkt der sichtbaren
  Sektion bekommt einen orangen Strich. Darüber eine schlichte Infozeile auf
  dem Hero-Verlauf. Das Mobilmenü öffnet als eigene Box unter der Leiste.
- **Buttons:** Primär Dunkelblau mit weißer Schrift und orangem Pfeil, sekundär
  weiß mit Rand, einmal Orange als Akzent (Karte „Verwalterwechsel geplant?“).
  Beim Überfahren ändert sich nur die Farbe.
- **Grafiken (inline SVG, keine Bilddateien):**
  „Steuerberater trifft Ingenieur“ – zwei Kreise, kaufmännisch und technisch,
  in der Schnittmenge der Werterhalt der Immobilie;
  „Regional vernetzt“ – das Logo in der Mitte, verbunden mit Eigentümern,
  Beirat, Kanzleien, Notaren, Handwerk und Portal. Beide zeigen nur Inhalte
  aus den Texten. Dazu das schematische Portal-Fenster.
- **Schrift:** Source Serif 4 (Display-Schnitt) für Überschriften und
  Kennzahlen, Instrument Sans für Fließtext und Bedienelemente. Selbst gehostet,
  zusammen 51 KB, beide vorgeladen. Lizenz: SIL Open Font License 1.1
  (Texte in `site/fonts/`). Metrisch angepasste Ersatzschriften verhindern
  Layoutsprünge beim Laden.
- **Wiedererkennung:** der orange Strich zwischen K und M im Logo als Linie
  neben der H1 und der Kernaussage.
- **Bewegung:** Farbübergänge beim Überfahren, sanftes Scrollen zu
  Sprungmarken; einzige Ausnahme sind die drei Säulen unter „Was unsere
  Hausverwaltung in Frankfurt auszeichnet“: beim Überfahren hebt sich die Karte
  um 4 px, der Icon-Kreis wird dunkelblau mit orangem Icon, und unten zieht sich
  der orange Logo-Strich von links nach rechts. Nur auf Geräten mit Maus; bei
  `prefers-reduced-motion` ohne Bewegung.
- **Platzhalter:** ruhige graublaue Foto-Flächen mit weißer Beschriftung;
  fehlende Angaben stehen als `[Platzhalter]` mit gestricheltem Rahmen im Text.

## Offene TODOs

**Vom Inhaber zu liefern**

- [ ] **Geschäftsadresse** bestätigen, dann an drei Stellen eintragen: Kontakt
      (`index.html`, Sektion 9), Footer, JSON-LD (`"address"`, siehe Kommentar
      im `<head>`). Die alte Seite nennt widersprüchliche Angaben, deshalb ist
      sie bewusst leer.
- [ ] **Fotos** (echte Aufnahmen, keine Stockfotos):
      Hero – beide Inhaber vor einem verwalteten Objekt in Frankfurt
      (Hochformat 4:5, mobil per `object-fit: cover` auf 3:2 beschnitten, mind. 1200 × 1500 px);
      Porträts Carsten Kaufmann und Prof. Dr. Jörg H. Mayer (Querformat 3:2,
      mind. 1500 × 1000 px); Außenansicht Niederräder Landstraße 78
      (Hochformat 4:5, mobil 3:2). Einbau als `<picture>` mit AVIF/WebP,
      `width`/`height` und Alt-Text; das Hero-Foto mit `fetchpriority="high"`,
      alle anderen mit `loading="lazy"`.
- [ ] **Portal24-Links**: Ziel für „Zum Portal-Login“ (heute `/kundenportal`)
      und „Schaden melden“ (heute vorläufig E-Mail an jhmayer@t-online.de).
      Im HTML mit `data-todo` markiert.
- [ ] **Partnerlogos** von BT – Ihr Objektbetreuer, Meisterbetrieb Wunderlich
      und Rössiger, am besten als SVG, mit Freigabe zur Nutzung.
- [ ] **Weitere Kennzahlen** zur Referenz NLS 78 (zwei Platzhalter).
- [ ] **Logo als Vektor** (SVG oder PDF), idealerweise auch in einer Fassung
      für dunklen Grund. Das heutige ist ein JPEG mit weißem Grund von der
      Wix-Seite (786 × 613 px). Für Navigation und Footer stehen Haus und
      Schriftzug unverändert nebeneinander (`tools/assets/logo.py`).
- [ ] **Einsatzgebiet** bestätigen (übernommen von der alten Seite, Ortsnamen
      korrigiert: Königstein und Kronberg im Taunus).
- [ ] **KI-Crawler**: `robots.txt` lässt alle zu, auch ClaudeBot, GPTBot und
      PerplexityBot. Das ist eine Entscheidung des Inhabers – wer sie sperren
      will, ergänzt eigene `User-agent`-Blöcke.

**Technisch, vor dem Livegang**

- [ ] Unterseiten bauen oder weiterleiten (Liste oben unter „Deployen“),
      danach in `sitemap.xml` und `llms.txt` eintragen:
      `/weg-verwaltung-frankfurt`, `/mietverwaltung`, `/bauleitung`,
      `/hausmeister-service`, `/weiterbildung`, `/referenz-nls-78`,
      `/anfrage`, `/news`, `/kundenportal`, `/impressum`, `/datenschutz`,
      `/cookies`.
- [ ] Impressum, Datenschutzerklärung und Cookie-Seite übernehmen und
      anpassen. Die Seite setzt keine Cookies, lädt nichts von Dritten und
      braucht daher kein Cookie-Banner.
- [ ] Nach dem Livegang: Google Search Console verifizieren, Sitemap
      einreichen, Google-Unternehmensprofil mit identischem Namen, Telefon
      und Adresse pflegen.
- [ ] Wenn die Domain vollständig über HTTPS läuft: HSTS in Cloudflare
      aktivieren.

## Entscheidungen, die vom Briefing abweichen oder es auslegen

- **„Aktuelles“** verlinkt auf `/news` und **„Kundenportal“** auf
  `/kundenportal` – beides bestehende, indexierte URLs der alten Seite.
- **„Eigentümerportal“** in der Infoleiste springt zur Portal-Sektion der
  Startseite, solange die Portal24-Adresse fehlt.
- **Bewertungen** stehen nur als Text auf der Seite, nicht als
  `AggregateRating` in den strukturierten Daten – Google zeigt für
  Unternehmen keine Sterne aus Bewertungen, die sie selbst auf ihrer Seite
  auszeichnen, und übernommene Google-Bewertungen auszuzeichnen widerspricht
  den Richtlinien.
- **Referenz:** Neben der vorgegebenen Kennzahl drei Leistungen aus der
  heutigen Referenzseite (Neubauübernahme nach Bauträgerinsolvenz,
  Sanierungskoordination, Portal24) – belegte Angaben statt Füllstoff.
- **Rollenbezeichnungen** „Kaufmännische Verwaltung“ und „Technische
  Verwaltung“ über den Personenkarten fassen die vorgegebenen Texte zusammen.
- **`llms.txt`** ergänzt: Kurzfassung der Fakten für KI-Assistenten, nur
  bestätigte Angaben.
- **Farben und Grafiken:** Statt der Steingrau-Flächen aus dem ersten
  Briefing jetzt Weiß, kühles Off-White und helles Blau; Primärbuttons in
  Dunkelblau, Orange als Akzent. Zwei Grafiken (Venn, Netzwerk) wurden auf
  Wunsch ergänzt; sie zeigen nur Inhalte aus den Texten.
- **Portal-Fenster** in Sektion 7 ist eine schematische Darstellung der
  Funktionen aus dem Text (Abrechnungen, Protokolle, Einladungen, Schäden,
  Termine), kein Screenshot von Portal24 und ohne erfundene Daten.

## Selbstkritik nach den Screenshots

Behoben nach der ersten Durchsicht bei 390 und 1440 px:
„Angebot anfordern“ stand in der Kopfzeile vor statt nach der Navigation; die
dunkle CTA-Kachel wurde von den Kartenstilen überschrieben (weiß auf weiß);
Footer-Listen hatten Aufzählungspunkte; Porträt-Platzhalter im Hochformat
dominierten die Über-uns-Sektion (jetzt 3:2); Überschrift und Kernaussage der
Alleinstellungsmerkmale konkurrierten (Aussage jetzt Schiefergrau); die
Vertrauensleiste stand mobil erst unter dem Foto (jetzt direkt unter den
Buttons); Zeilenumbrüche wie „Landstraße / 78“ und „ab 10 / Wohneinheiten“.

Weitere Runden: dunkle Kacheln mit Glas- und Leuchteffekten (zu dunkel, zu
effektlastig), dann helle Kacheln auf Dunkelblau (immer noch zu dunkel). Der
aktuelle Stand ist hell mit Dunkelblau als Zweitfarbe. Aus der Prüfung dieser
Runde: Eine Dachlinie im Hero-Hintergrund lief quer durch Buttons und
Vertrauensleiste (entfernt); in der Venn-Grafik stießen Wörter an die
Kreisränder, im Netzwerk schnitt das Emblem den Ring und die Beschriftungen
klebten an den Knoten (Geometrie angepasst).

Runde „freistehende Leiste und Boxen“: Durch den doppelten Innenabstand (Box
und Karte) wurde die mobile Leistungsliste schmal – Icon und Titel stehen dort
jetzt in einer Zeile, der Text darunter über die volle Kartenbreite. Die beiden
Grafiken reichen mobil bis an den Boxrand, sonst wäre ihre Beschriftung
geschrumpft. Der Hero läuft hinter die Kopfzeile, damit die freistehende Leiste
auf dem hellblauen Verlauf steht statt auf einem weißen Streifen.

Bleibt bewusst offen: Solange echte Fotos fehlen, wirken die großen
Platzhalterflächen nüchtern – die Seite ist auf Fotos angelegt und gewinnt mit
ihnen am meisten. Das Logo (3D-Optik mit grünem Bogen) passt stilistisch nur
bedingt zur ruhigen Typografie; eine flache Vektorfassung würde helfen.

## Skillbase

Welche Skills aus dem 21Layer-Repo übernommen wurden, wofür und welche
Bereiche dort fehlen: [SKILLS.md](SKILLS.md).
