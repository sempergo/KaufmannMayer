# Skillbase

Die Skills unter `.claude/skills/` stammen aus dem Repository
[`sempergo/21layer`](https://github.com/sempergo/21layer) (Stand: Commit
`18f15eb`, 14.10.2026). Übernommen wurde alles, was für Bau, Gestaltung, Texte,
Barrierefreiheit, Auffindbarkeit und Prüfung einer Website hilft. Die Dateien
sind unverändert kopiert, einschließlich ihrer Lizenzdateien – mit einer
Ausnahme (`aenderung-pruefen`, siehe unten).

## Übernommene Skills

| Skill | Wofür in diesem Projekt | Quelle im 21Layer-Repo |
|---|---|---|
| `frontend-design` | Gestaltungsrichtung, Typografie, Farbe, Layout, Bewegung, Selbstkritik am Screenshot | `.claude/skills/frontend-design/` |
| `design-system` | Design-Tokens (Farbe, Typo, Abstände, Radien, Bewegung), Komponenten mit Zuständen | `.claude/skills/design-system/` |
| `design-critique` | Strukturierte Kritik der Screenshots (erster Eindruck, Hierarchie, Konsistenz) | `.claude/skills/design-critique/` |
| `ux-copy` | Buttons, Linktexte, Platzhalter, Hinweise – klar, konsistent, mit Verb | `.claude/skills/ux-copy/` |
| `draft-content` | Landingpage-Texte für Zielgruppe und Suchbegriffe | `.claude/skills/draft-content/` |
| `accessibility-review` | WCAG-2.1-AA-Prüfung: Kontrast, Tastatur, Fokus, Klickflächen, Landmarks | `.claude/skills/accessibility-review/` |
| `seo-audit` | On-Page-SEO: Title, Description, eine H1, Überschriftenhierarchie, Alt-Texte, Technik | `.claude/skills/seo-audit/` |
| `seo-ai-visibility` | Strukturierte Daten, robots.txt, llms.txt, Faktenklarheit (NAP), keine erfundenen Angaben | `.claude/skills/seo-ai-visibility/` (inkl. `reference/`) |
| `aenderung-pruefen` | Prüfablauf vor jedem Commit: Playwright-Prüfungen, Lighthouse, Screenshots 390/1440 | **angepasst** aus `.claude/skills/aenderung-pruefen/` |

Gemeinsame Dateien, auf die `seo-ai-visibility` verweist (Stimmprofil, Umgang
mit fremden Inhalten, Artifact-Stil), liegen unverändert unter
`.claude/shared/` (Quelle: `.claude/shared/`).

### Zur Anpassung von `aenderung-pruefen`

Das Original prüft die 21Layer-Website (Karussell, Fallstudien, Blog,
Videos). Übernommen wurden Ablauf und Regeln – Prüfen im Verhältnis zur
Änderung, Kontrast aus Pixeln statt aus berechneten Styles, Screenshots bei
1440 und 390 px, lokaler Server mit dem Routing von Cloudflare Pages, kein
`package.json` im Wurzelverzeichnis der Website. Die einzelnen Prüfungen sind
für diese Seite neu geschrieben (`tools/pruefung/`); der Testserver
`tools/server.js` ist aus `tools/pruefung/server.js` übernommen.

## Eigene Skills dieses Projekts

Auf Wunsch des Auftraggebers (14.10.2026) entstehen bei der Arbeit eigene
Skills, wenn sie künftige Ergebnisse verbessern (Regel in `CLAUDE.md`). Jeder
wurde vorher mit einem Vergleichslauf ohne Skill getestet und danach mit Skill
gegengeprüft.

| Skill | Wofür | Lücke, die der Vergleichslauf ohne Skill zeigte |
|---|---|---|
| `aenderungswunsch-umsetzen` | Ablauf einer Änderungsrunde vom Chat-Wunsch bis zur Übergabe | Keine ansehbare Vorschau für den Auftraggeber (stattdessen „lokal Server starten“ oder eine nicht vorhandene Branch-Vorschau); Sichtkontrolle nur bei 390/1440 px, obwohl Fehler bei 960–1200 px lagen |
| `gestaltung-kaufmann-mayer` | Geschmack des Auftraggebers, Logofarben, Box- und Akzent-Logik, CSP/DSGVO-Leitplanken, Umgang mit gelieferten Vorlagen | Vorlieben nur indirekt aus dem README erschlossen; Ergebnis-Übergabe ohne Vorschau-Datei |
| `unterseite-anlegen` | Checkliste und Fallen für jede neue Seite (Leistungsseiten, Referenz, Rechtstexte, Formulare) | Zwei Läufe ohne Skill (WEG-Verwaltung, Referenz NLS 78) planten gut, brauchten aber je 170.000–190.000 Tokens Suche und fanden jeweils nur einen Teil: der eine flache Datei statt Ordner und den Schnellleisten-Abstand, der andere `aria-current` und feste Weiterleitungsziele der Function. Beide hielten sieben getrennte Seitenlisten in den Prüfungen für die größte Fehlerquelle – deshalb jetzt automatisiert: `tools/seiten.json`, `seo.js` wird rot, wenn eine Seite fehlt. Mit Skill deckten beide Gegenläufe (WEG-Verwaltung, Impressum) alle Punkte ab, mit weniger Suche (140.000–165.000 Tokens); drei neue Fallen daraus stehen im Skill |

Dazu gehören die Werkzeuge `tools/vorschau.py` (Einzeldatei-Vorschau je Seite),
`tools/pruefung/ausschnitt.js` (Bilder eines Elements: Breiten, Hover,
Animation), `tools/pruefung/grafik.js` (Geometrie der Werterhalt-Grafik),
`tools/pruefung/formular.js` (Anfrageformular und Pages Function),
`tools/seiten.json` (die Seitenliste für alle Prüfungen) und
`tools/screenshots-webp.py`. `aenderung-pruefen` ist um diese ergänzt.

## Nicht übernommen

| Skill | Grund |
|---|---|
| `blog-artikel` | Redaktionsablauf speziell für den 21Layer-Blog (Keyword-Werkzeug, Freigabe-PRs) |
| `fallstudie-live-schalten` | Anlegen von 21Layer-Fallstudien, ohne Bezug zu diesem Projekt |

## Lücken im 21Layer-Repo

Für diese Bereiche gibt es dort keinen Skill. Sie wurden hier nach
allgemeinem Stand der Technik umgesetzt und im README dokumentiert – es wurde
kein Skill dafür erfunden.

- **Performance / Core Web Vitals** – kein eigener Skill (LCP, CLS, Font-Laden,
  Caching). Nur Teilaspekte in `seo-audit` (Seitengeschwindigkeit) und im
  Medienbudget von `aenderung-pruefen`.
- **Deployment auf Cloudflare Pages** – nur als Regeln in der `CLAUDE.md` des
  21Layer-Repos (Deploy bei Push auf `main`, `_redirects`, `_routes.json`),
  kein Skill mit Einrichtungsschritten.
- **Bildoptimierung** – kein Skill für AVIF/WebP, `srcset` und feste Maße.
- **Rechtstexte** – kein Skill für Impressum, Datenschutzerklärung und
  Cookie-Hinweise.
- **Lokale Suche** – Google-Unternehmensprofil und Branchenverzeichnisse nur
  am Rand in `seo-ai-visibility`, kein eigener Ablauf.
- **`CONNECTORS.md`** – mehrere Skills verweisen auf `../../CONNECTORS.md`;
  die Datei fehlt auch im 21Layer-Repo. Die Hinweise sind ohne sie
  verständlich.
