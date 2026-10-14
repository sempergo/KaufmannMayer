---
name: aenderung-pruefen
description: Änderungen an der Website Kaufmann & Mayer vor dem Commit prüfen — Playwright-Prüfungen für Konsole, SEO-Struktur, Barrierefreiheit (axe), Mobilmenü, Tastatur, Klickflächen, Geometrie der Grafiken, Kontrast aus Pixeln, dazu Lighthouse mobil/Desktop, Screenshots und Ausschnitte. Verwenden nach jeder Änderung an HTML, CSS, JS oder Bildern und vor jedem Push.
---

# Änderung prüfen

Angepasst aus `sempergo/21layer` (`.claude/skills/aenderung-pruefen/`): Ablauf,
Regeln und Testserver stammen von dort, die einzelnen Prüfungen sind für diese
Seite geschrieben.

Die Seite hat keinen Build-Step. Was nicht geprüft wird, merkt erst ein
Besucher. Geprüft wird im Verhältnis zur Änderung:

| Situation | Prüfung | Dauer |
|---|---|---|
| Kleine Änderung (Text, Farbe, Abstand) | passende Prüfungen, `konsole` fast immer | unter 30 s |
| Neue Sektion, Umbau, neue Unterseite | alle | ca. 2 min |
| Vor dem Livegang | alle, Screenshots ansehen | ca. 2 min |

```
cd tools && npm ci                       # einmalig: axe-core, lighthouse
node tools/pruefung/alle.js              # alle, inkl. Lighthouse
node tools/pruefung/alle.js seo mobil    # nur passende
node tools/server.js &                   # dann:
node tools/pruefung/screenshots.js       # tools/berichte/screenshots, 390 und 1440 px
node tools/pruefung/ausschnitt.js .pillars --breiten 768,1024 --hover '.pillar:nth-child(2)'
```

Der Runner startet `tools/server.js` auf einem freien Port. Der Server bildet
das Routing von Cloudflare Pages nach (Pfad, `.html`, `/index.html`, sonst
`404.html`), wendet `site/_headers` an (also auch die CSP) und komprimiert Text
wie Cloudflare.

## Die Prüfungen

| Datei | Prüft |
|---|---|
| `konsole.js` | Konsolen-, Lade- und CSP-Fehler auf Startseite (390/1440) und 404-Seite |
| `seo.js` | Title, Description, Canonical, OG/Twitter, eine H1, jede Sektion mit eigener H2, keine Sprünge in der Überschriftenfolge, Landmarks, Suchbegriffe in Überschriften, Telefonlinks einheitlich, Bilder mit Alt und Maßen, Leistungs-URLs verlinkt, JSON-LD, robots/sitemap/llms.txt, CSP-Hash des Inline-Skripts |
| `a11y.js` | axe-core (WCAG 2.0–2.2 A/AA + Best Practices) bei 390 px mit offenem und geschlossenem Menü, 1440 px, 404-Seite |
| `mobil.js` | kein Überlauf von 360 bis 1920 px, Schnellleiste nur mobil, Menü per Tastatur (Enter, Tab, Escape, Fokus zurück), Sprungziele nicht unter der Kopfzeile, Fokusrahmen sichtbar, Navigation ohne JavaScript, Klickflächen ≥ 44 × 44 px |
| `grafik.js` | Werterhalt-Grafik im Endbild bei 360–1920 px: Begriffe ≥ 12 px innerhalb ihres Kreises und außerhalb der Schnittmenge, Abzeichen, Titel und Untertitel in der Schnittmenge |
| `kontrast.js` | Kontrast aus gerenderten Pixeln für Knöpfe, Links, Labels, Platzhalter (≥ 4,5:1) |
| `ausschnitt.js` | kein Test, sondern Bilder zum Ansehen: ein Element bei mehreren Breiten, im Hover-Zustand (`--hover`) oder als Animationsbilder (`--zeiten`); nach `tools/berichte/ausschnitte/` |
| `lighthouse.js` | mobil und Desktop, je 3 Läufe, Median gegen Zielwerte: Leistung ≥ 90, SEO 100, Barrierefreiheit ≥ 95, LCP < 2,5 s, CLS < 0,1. Berichte in `tools/berichte/` |

## Wenn etwas rot ist

- **Erst verstehen, dann ändern.** Entweder hat die Änderung etwas kaputt
  gemacht – dann die Änderung reparieren. Oder die Anforderung hat sich bewusst
  geändert – dann den Test im selben Commit anpassen und das sagen. Nie einen
  Test abschwächen, nur damit er grün wird.
- **Bekannte Ausnahmen** stehen in `konsole.js` unter `BEKANNT`, mit Grund.
  Aktuell nur die 404-Meldung der 404-Seite selbst.
- **CSP-Hash:** Wer das Inline-Skript im `<head>` ändert, muss den Hash in
  `site/_headers` neu berechnen (`seo.js` meldet das):
  `printf '%s' '<inhalt>' | openssl dgst -sha256 -binary | base64`

## Messen statt schätzen

- **Kontrast aus Pixeln** messen, nicht aus berechneten Styles; vorher den
  Rand abschneiden, sonst zeigen Ecken und Rahmen den Untergrund.
- **Einen Screenshot ansehen**, bevor eine gestalterische Änderung als fertig
  gilt, bei 1440 und 390 px – und die betroffenen Bereiche mit `ausschnitt.js`
  bei 768, 1024 und 1200 px: Dort brachen bisher Layouts, die bei 390 und
  1440 px einwandfrei aussahen. Ganzseitige Screenshots mitten im Scrollen können
  Artefakte zeigen – bei Zweifeln mit Wartezeit neu aufnehmen.
- Lighthouse schwankt mobil um einige Punkte; der Median aus drei Läufen zählt.

## Umgebung

- Playwright wird lokal oder unter `npm root -g` gesucht; Chromium kommt über
  `PLAYWRIGHT_BROWSERS_PATH`. Lighthouse nimmt dasselbe Chromium
  (`CHROME_PATH` überschreibt).
- Kein `package.json` im Wurzelverzeichnis oder in `site/` – die Werkzeuge
  liegen in `tools/`, damit Cloudflare Pages keinen Build-Schritt annimmt.
- Den Server für Screenshots im Hintergrund mit langem Timeout starten
  (`run_in_background`, 7200000 ms) – mit dem Standard ist er nach 30 Minuten weg.
- Einen Server nie mit `pkill -f <muster>` beenden: das Muster trifft auch die
  eigene Shell. `alle.js` startet und beendet seinen Server selbst.
