---
name: gestaltung-kaufmann-mayer
description: Verwenden, wenn an Aussehen, Farben, Abschnitten, Grafiken, Animationen, Schriften oder Bildern der Kaufmann-&-Mayer-Website gearbeitet wird oder der Auftraggeber eine Vorlage (HTML-Datei, Bild, Screenshot) zum Einbauen schickt.
---

# Gestaltung Kaufmann & Mayer

Die Werte stehen als Tokens oben in `site/css/site.css`, den Stand beschreibt das README unter
„Designsystem“. Hier steht, was nicht im Code steht: der Geschmack des Auftraggebers und die
Leitplanken, an denen Änderungen bisher gescheitert sind.

## Geschmack des Auftraggebers

Abgelehnt, mit seinen Worten:
- dunkle Grundflächen, Navy-Hintergrund, helle Kacheln auf Dunkelblau – „zu dunkel“
- Glanz-Effekte beim Überfahren von Buttons – „trashige Effekte“
- Karo- und Rastermuster – „sieht so technisch und AI slop aus“
- starke Rundungen bei Boxen und Karten (Buttons sind die Ausnahme, siehe unten)
- wuchtige Leisten für Nebensächliches – „viel zu wuchtig für das was sie ist“
- eine selbst gezeichnete Skyline statt seiner Vorlage
- Elemente lose ohne Rahmen – „sieht sehr verloren aus“
- Text, der den Rand seiner Form berührt – „das darf nicht sein“

Gewünscht:
- hell (Weiß, kühles Blau) und ruhig, Struktur wie relaxa-immobilien.de
- Logofarben exakt; Orange und Grün als Signalfarben, je Abschnitt eine, an einzelnen Stellen gemischt
- leicht abgerundete Boxen; freistehende Leisten (Navigation, Vertrauensleiste, Schnellleiste)
- Buttons als Glas-Pillen in Blau („blauer und mehr in dem glass-pill-look“), leichter Schein hinter den Boxen
- Vertrauensleiste als dezentes Laufband ohne Rahmen, das an der Abschnittskante ausblendet
- je Kartenart ein eigener, dezenter Hover-Effekt
- kompakte Abschnitte; große Skyline im Hero
- Buttons: „Termin vereinbaren“ oder „Kontakt aufnehmen“, nie „Angebot anfordern“

Er korrigiert in kleinen Schritten, meist mit Screenshot. Wünsche wörtlich umsetzen. Zusätzliche
Effekte nur, wenn sie ein gemeldetes Problem lösen – und dann in der Antwort nennen.

## Farben und Bausteine

| Was | Regel |
|---|---|
| Text | `--schiefer` #28353e (Logo-Schriftzug) |
| Buttons | Glas-Pillen (`border-radius: 999px`): primär `--blau-700` #1f4f8f, sekundär Milchglas, Akzent Orange; Licht von oben, helle Kante, `backdrop-filter` |
| Signalfarben | `--orange-500` #ec720f, `--gruen-500` #61a210; als Text nur `--orange-700` / `--gruen-700` |
| Schrift auf Orange | `--schiefer-tief` (Schiefer erreicht dort nur 4,2:1) |
| Blau | `--blue-600`: Skyline, Schnittmenge „Werterhalt“; blaue Boxen `--bg-blau` |
| Akzent eines Abschnitts | Bausteine nutzen nur `--akzent`, `--akzent-text`, `--akzent-hell`, `--akzent-leucht`; Grün über die Klasse `akzent-gruen` an der Box; nie Hex-Werte im Baustein |
| Boxen | `box` (blau), `box box--weiss` (weiß, Karten darin blau), `box--slim`, `box--cta` (Kontakt); weiß und blau im Wechsel halten |
| Radien | 4 / 6 / 8 / 12 px; Boxen und Leisten 12 px; nur Buttons und Menüknopf als Pille |
| Hover | neuer Kartentyp bekommt einen neuen Effekt; nur in `@media (hover: hover)`; bei `prefers-reduced-motion` ohne Bewegung |

## Technische Leitplanken

- **CSP `style-src 'self'`:** kein `style="…"` im HTML, auch nicht im SVG. Werte über Klassen oder
  per JavaScript (`el.style.setProperty` – das erlaubt die CSP). Ein neues Inline-Skript braucht
  einen neuen Hash in `site/_headers`.
- **Schriften nur lokal (DSGVO):** nie Google Fonts oder ein CDN. Die Seite hat zwei Familien
  (Source Serif 4, Instrument Sans). Eine dritte erst ausreden; sonst woff2 lokal mit OFL-Text,
  `@font-face` mit `font-display: swap` und metrisch angeglichener Ersatzschrift.
- **Animationen:** Fortschritt 0…1 als CSS-Variablen, gesetzt aus `js/site.js`. Ohne JavaScript und
  bei reduzierter Bewegung steht das Endbild. Einmal abspielen, wenn im Bild. Mobil eine eigene
  Anordnung statt kleiner skalieren.
- **Bewegung, die von selbst startet** (z. B. Laufband): Pause beim Überfahren und bei Fokus plus
  ein Pause-Knopf mit `aria-pressed` (WCAG 2.2.2); bei reduzierter Bewegung steht sie. Vor dem
  Skript muss das Element schon so hoch sein wie danach, sonst springt der Inhalt (CLS) – den
  Endzustand per `.js`-Klasse und `prefers-reduced-motion: no-preference` im CSS vorwegnehmen.
- **Breite Kinder in Grids:** einspaltige Raster mit `grid-template-columns: minmax(0, 1fr)`, sonst
  dehnt ein breites Kind (Laufband-Spur) die Spalte auf Tausende Pixel.
- **Text in Formen:** messen statt schätzen – `tools/pruefung/grafik.js` (Pillen ≥ 12 px zum
  Kreisrand, Titel in der Schnittmenge). Mindestschrift 12 px, kleinere Zeilen umbrechen lassen.
- **Inhalte:** keine erfundenen Zahlen, Zitate oder Bewertungen; Fehlendes als `.tbd`.

## Vorlagen des Auftraggebers einbauen

- **HTML oder Animation:** die Mechanik übernehmen. Google Fonts durch die lokalen Schriften
  ersetzen, Inline-Styles durch Klassen, das Skript in `js/site.js` (im ES5-Stil dort), Farben auf
  Tokens. Ohne JavaScript muss das Endbild stehen.
- **Bild als Grafik** (z. B. eine Silhouette): Vorlage nach `quellen/` legen, mit OpenCV nachzeichnen
  wie `tools/assets/skyline.py`, neben dem Original vergleichen. Im README Herkunft und
  Lizenzhinweis vermerken.
- **Logos und Marken Dritter:** nicht selbst nachzeichnen – das Original als SVG und die Freigabe
  erbitten.
