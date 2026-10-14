---
name: aenderungswunsch-umsetzen
description: Verwenden, wenn der Auftraggeber im Chat eine Änderung an der Kaufmann-&-Mayer-Website wünscht – Gestaltung, Texte, Grafiken, Animationen, oft mit Screenshot und kurzer Anmerkung („mach …“, „sieht verloren aus“, „bau das ein“), auch bei mehreren Wünschen in einer Nachricht.
---

# Änderungswunsch umsetzen

Eine Runde ist erst fertig, wenn der Auftraggeber das Ergebnis **selbst ansehen kann**. Er startet
keinen Server, und für den Branch gibt es keine Cloudflare-Vorschau. Er bekommt jedes Mal die
Einzeldatei-Vorschau in den Chat – und, wenn der Workflow „GitHub Pages“ für den Push grün ist,
zusätzlich den Link https://sempergo.github.io/KaufmannMayer/.

## Was am Ende einer Runde steht

1. Jeder Wunsch umgesetzt – oder benannt, warum anders oder nicht.
2. Gesehen und geprüft in allen Breiten, die es betrifft; Abweichungen behoben.
3. README und Repo-Screenshots auf dem neuen Stand.
4. Commit (Conventional Commits auf Deutsch, Trailer) und Push auf den Arbeitsbranch.
5. Vorschau-Datei gebaut **nach** dem letzten Edit und mit `SendUserFile` geschickt.
6. Kurze Antwort auf Deutsch.

## Ablauf

1. **Zerlegen.** Jeden Punkt als eigene Aufgabe anlegen. Den Screenshot genau lesen: Welches
   Element, welcher Zustand, welche Breite? Fehlt ein angekündigter Anhang („beigefügte Datei“),
   das sofort sagen und den Rest weiterbauen.
2. **Gemeldeten Fehler erst messen.** Ragt etwas über, bricht um, überlappt: zuerst eine Prüfung
   schreiben, die den Fehler zeigt, und sie rot sehen; dann ändern, bis sie grün ist
   (Muster: `tools/pruefung/grafik.js`, in `alle.js` eintragen).
3. **Umsetzen** nach Skill `gestaltung-kaufmann-mayer`.
4. **Ansehen.** Server mit `run_in_background` und Timeout 7200000 starten
   (`node tools/server.js`), sonst ist er nach 30 Minuten weg.
   - ganze Seite: `node tools/pruefung/screenshots.js` (390 und 1440 px)
   - betroffene Bereiche zusätzlich bei **768, 1024 und 1200 px** – dort sind bisher Fehler
     entstanden, die bei 390/1440 nicht zu sehen waren:
     `node tools/pruefung/ausschnitt.js <selektor> --breiten 390,768,1024,1200,1440`
   - Hover `--hover <selektor>`, Animation `--zeiten 300,1200,2600,4000`, Endbild `--ruhig`
   - jedes Bild ansehen (große vorher zuschneiden oder verkleinern) und gegen den Wunsch prüfen
5. **Prüfen** nach Skill `aenderung-pruefen` (`node tools/pruefung/alle.js`). Ein Lighthouse-Ausreißer
   wird einmal wiederholt, bevor etwas geändert wird.
6. **README:** Lighthouse-Tabelle (Werte des letzten Laufs), betroffene Teile von „Designsystem“,
   veraltete Aussagen gleich mit korrigieren, unter „Selbstkritik“ ein Absatz „Runde …“: was beim
   Prüfen auffiel und wie es gelöst ist. Neue Werkzeuge unter „Bauen“ oder „Prüfen“.
7. **Repo-Screenshots:** `node tools/pruefung/screenshots.js && python3 -I tools/screenshots-webp.py`
8. **Commit und Push:** `git push -u origin claude/festive-wozniak-w5apvu`.
9. **Vorschau:** `python3 -I tools/vorschau.py` und dann `SendUserFile` mit
   `tools/berichte/vorschau/kaufmann-mayer-startseite.html`, `display: "attach"`, Bildunterschrift:
   herunterladen, im Browser öffnen, wo die Änderung zu sehen ist.
10. **GitHub Pages:** Lauf des Workflows `pages.yml` für den Push prüfen (`actions_list`,
    `list_workflow_runs`). Grün: Link in die Antwort. Rot: Ursache aus dem Log nennen, die Datei
    reicht als Ansicht.
11. **Antworten:** nach Wünschen gegliedert, was jetzt anders ist; eigene Entscheidungen und
    Abweichungen mit Grund; Prüfergebnis in einem Satz; offene Fragen am Ende.

## Häufige Fehler

| Fehler | Richtig |
|---|---|
| „lokal mit `node tools/server.js` ansehen“ oder Branch-Vorschau-URL anbieten | Vorschau-Datei schicken |
| nur 390 und 1440 px angesehen | betroffene Bereiche auch bei 768, 1024, 1200 px |
| Hover und Animation nicht angesehen | `ausschnitt.js` mit `--hover` bzw. `--zeiten` |
| Screenshot während sanften Scrollens | `scrollBehavior = "auto"` setzen (`ausschnitt.js` tut das) |
| Test schlägt bei gewollter Gestaltung an | Test gezielt ausnehmen, mit Kommentar, warum |
| Server mit `pkill -f` beendet | `kill <pid>` – das Muster trifft sonst die eigene Shell |
| Vorschau vor dem letzten Edit gebaut | Vorschau als letzten Schritt bauen |
