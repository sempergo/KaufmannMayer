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

## Werkzeuge zum Prüfen

Zu `aenderung-pruefen` gehören die Werkzeuge in `tools/`: `vorschau.py`
(Einzeldatei-Vorschau je Seite), `pruefung/ausschnitt.js` (Bilder eines
Elements), `pruefung/grafik.js` (Geometrie der Werterhalt-Grafik),
`pruefung/formular.js` (Anfrageformular und Pages Function), `seiten.json`
(Seitenliste für alle Prüfungen) und `screenshots-webp.py`.

Eigene Skills legt dieses Projekt nicht an (Wunsch des Auftraggebers,
15.10.2026); die zwischenzeitlich gebauten sind wieder entfernt.

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
