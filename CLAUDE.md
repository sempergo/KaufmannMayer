# Kaufmann & Mayer – neue Startseite

Statische Website in `site/`, kein Build-Schritt, Cloudflare Pages (Ausgabeverzeichnis `site`).
Arbeitsbranch: `claude/festive-wozniak-w5apvu`. Stand, Designsystem und offene Punkte: `README.md`.

## Regeln
- **Skills mitschreiben (Wunsch des Auftraggebers, 14.10.2026):** Bei jeder Aufgabe prüfen, ob ein
  neuer oder verbesserter Skill unter `.claude/skills/` künftige Ergebnisse besser macht – ein Ablauf,
  der wiederkommt, ein Fehler, der wieder passieren kann, Wissen, das nicht im Code steht. Wenn ja:
  im selben Zug anlegen oder ergänzen (Skill `superpowers:writing-skills`, mit Vergleichslauf ohne
  und mit Skill), in `SKILLS.md` eintragen und mitcommitten.
- Änderungswünsche aus dem Chat: Skill `aenderungswunsch-umsetzen`. Gestaltung, Grafiken, Vorlagen:
  Skill `gestaltung-kaufmann-mayer`. Neue Seite: Skill `unterseite-anlegen` (jede Seite steht in
  `tools/seiten.json`). Prüfen vor jedem Commit: Skill `aenderung-pruefen`.
- Anfrageformular: `functions/api/anfrage.js` braucht das Secret `RESEND_API_KEY`, das nur im
  Cloudflare-Dashboard liegt – nie ins Repo schreiben (Einrichtung: `ANFRAGE-SETUP.md`).
- Nach jeder abgeschlossenen Änderung committen und pushen, Conventional Commits auf Deutsch.
  Kein Pull Request ohne Auftrag.
- Schriften liegen lokal unter `site/fonts/`, keine CDN-Einbindungen (DSGVO). Keine `style`-Attribute
  im HTML (CSP `style-src 'self'`).
- Keine erfundenen Zahlen, Zitate oder Bewertungen; fehlende Angaben als `.tbd`-Platzhalter.
