# Kaufmann & Mayer – neue Startseite

Statische Website in `site/`, kein Build-Schritt, Cloudflare Pages (Ausgabeverzeichnis `site`).
Arbeitsbranch: `claude/festive-wozniak-w5apvu`. Stand, Designsystem und offene Punkte: `README.md`.

## Regeln
- Skills: nur die aus dem 21Layer-Repo (siehe `SKILLS.md`), keine eigenen anlegen (Wunsch des
  Auftraggebers, 15.10.2026). Prüfen vor jedem Commit: Skill `aenderung-pruefen`.
- Jede Seite steht in `tools/seiten.json`; daraus lesen alle Prüfungen, Screenshots und die Vorschau.
- Anfrageformular: `functions/api/anfrage.js` braucht das Secret `RESEND_API_KEY`, das nur im
  Cloudflare-Dashboard liegt – nie ins Repo schreiben (Einrichtung: `ANFRAGE-SETUP.md`).
- Nach jeder abgeschlossenen Änderung committen und pushen, Conventional Commits auf Deutsch.
  Kein Pull Request ohne Auftrag.
- Schriften liegen lokal unter `site/fonts/`, keine CDN-Einbindungen (DSGVO). Keine `style`-Attribute
  im HTML (CSP `style-src 'self'`).
- Keine erfundenen Zahlen, Zitate oder Bewertungen; fehlende Angaben als `.tbd`-Platzhalter.
