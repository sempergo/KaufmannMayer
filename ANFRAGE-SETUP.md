# Anfrageformular → E-Mail (Resend)

Die Seite `/anfrage` (`site/anfrage.html`) schickt das Formular an die Cloudflare
Pages Function `functions/api/anfrage.js`. Sie prüft die Angaben und die
Spam-Falle, baut eine E-Mail (HTML und Text) und versendet sie über die
**Resend-API** an das Postfach der Verwaltung. Übernommen aus dem 21Layer-Repo
(`ANFRAGE-SETUP.md`), angepasst auf Kaufmann & Mayer.

```
Formular /anfrage
   │  POST /api/anfrage   mit JavaScript: JSON · ohne JavaScript: normales Formular
   ▼
Pages Function  functions/api/anfrage.js
   │  POST https://api.resend.com/emails   (Authorization: Bearer RESEND_API_KEY)
   ▼
Resend (EU-Region)  →  jhmayer@t-online.de   (Antworten gehen direkt an die Absender)
```

| Weg | Antwort der Function | Was die Besucher sehen |
|---|---|---|
| mit JavaScript | JSON `{ ok: true }` | Dank in der Formularkarte |
| ohne JavaScript | 303 auf `/anfrage#gesendet` | dieselbe Dankfläche (per `:target`) |
| Fehler ohne JavaScript | 303 auf `/anfrage#nicht-gesendet` | Hinweis mit Telefon und E-Mail |
| Endpunkt fehlt oder klemmt (mit JavaScript) | – | fertige E-Mail mit allen Angaben (`mailto:`) und Telefonnummer |

Der letzte Fall gilt auch für die Vorschau auf **GitHub Pages** und für die
Einzeldatei-Vorschau: Dort gibt es keine Functions, das Formular bietet deshalb
die vorbereitete E-Mail an. Keine Anfrage geht verloren.

---

## Einrichtung (einmalig, ca. 15 Minuten)

### A) Resend-Konto und Domain
1. Konto anlegen unter <https://resend.com>, dabei die **EU-Region** wählen
   (Daten in der EU, wichtig für die DSGVO).
2. **Domains → Add Domain** → `kaufmann-mayer.de`.
3. Resend nennt einige **DNS-Einträge** (SPF/DKIM, MX für Rückläufer, ggf.
   DMARC). Diese beim DNS-Anbieter der Domain eintragen – nach dem Umzug zu
   Cloudflare unter *Cloudflare → DNS*. Nur die genannten Einträge anlegen;
   bestehende MX-Einträge für das eigene Postfach bleiben unangetastet (Resend
   nutzt dafür eine Subdomain wie `send.kaufmann-mayer.de`).
4. In Resend **Verify** klicken (greift meist nach wenigen Minuten).

### B) API-Schlüssel
5. **API Keys → Create API Key** (Sending access genügt), den Schlüssel `re_…`
   kopieren – er wird nur einmal angezeigt. Im Konto bzw. Team anlegen, in dem
   `kaufmann-mayer.de` bestätigt ist; sonst lehnt Resend jede Mail ab
   („domain is not verified“).

### C) Variablen und Secret in Cloudflare Pages
Dashboard → **Workers & Pages** → Pages-Projekt → **Settings → Variables and
Secrets** (für **Production** und **Preview**):

| Name | Typ | Wert |
|------|-----|------|
| `RESEND_API_KEY` | **Secret** | der Schlüssel `re_…` aus Schritt 5 – **nie ins Repo** |
| `MAIL_FROM` | Variable | Absender auf der bestätigten Domain, z. B. `formular@kaufmann-mayer.de` |
| `MAIL_FROM_NAME` | Variable | `Kaufmann & Mayer Website` |
| `MAIL_TO` | Variable | `jhmayer@t-online.de` (oder ein anderes Postfach) |

`MAIL_FROM` muss auf der bei Resend bestätigten Domain liegen; ein eigenes
Postfach für diese Adresse braucht es nicht. Fehlen `MAIL_FROM`, `MAIL_FROM_NAME`
oder `MAIL_TO`, gelten die Werte in Klammern aus dem Kopf der Function.

### D) Deployen und testen
6. Pushen → Cloudflare Pages erkennt den Ordner `functions/` im Repo-Wurzelverzeichnis
   automatisch (das Ausgabeverzeichnis bleibt `site`).
7. Auf der Live-Seite `/anfrage` einmal „Termin“ und einmal „Nachricht“ senden →
   Dank in der Karte, Mail im Postfach. Einmal mit abgeschaltetem JavaScript
   wiederholen → Seite springt auf `/anfrage#gesendet`.

---

## Anpassen
- **Empfänger, Absender, Anzeigename:** Variablen in Cloudflare ändern, danach
  „Retry deployment“.
- **Felder, Betreff, Aussehen der Mail:** `functions/api/anfrage.js`
  (`felder`, `betreff`, `alsHtml`, `alsText`); neue Felder auch im Formular
  (`site/anfrage.html`), im Rückfall-Text (`alsMail` in `site/js/site.js`) und
  in der Prüfung `tools/pruefung/formular.js`.
- **Auswahl „Worum geht es?“, „Sie sind“, „Wohneinheiten“:** nur im HTML.

## Prüfen
`node tools/pruefung/formular.js` (läuft auch in `alle.js`) prüft die Function
ohne Netz – Resend wird nachgebildet – und die Seite im Browser mit und ohne
JavaScript, inklusive Rückfall-E-Mail. Der lokale Testserver kennt keine
Functions; die Prüfung fängt `/api/anfrage` ab und reicht es an die Function.

## Fehlerdiagnose
Die Function antwortet bei Problemen mit JSON (`error`, teils `status`/`detail`):

| Fehler | Ursache und Lösung |
|---|---|
| `mailer_unconfigured` (500) | `RESEND_API_KEY` fehlt → Schritt C |
| `resend_send_failed` 403 / „domain is not verified“ | Domain nicht bestätigt oder `MAIL_FROM` nicht auf `kaufmann-mayer.de` → Schritt A |
| `resend_send_failed` 401 | Schlüssel ungültig → neuen erzeugen (Schritt B) |
| `validation` (422) | Name fehlt oder E-Mail-Adresse ungültig (das Formular prüft vorher selbst) |
| Formular bietet „vorbereitete E-Mail“ an | Function nicht deployt, Variablen fehlen oder Resend gestört |

## Datenschutz
- Resend als **Auftragsverarbeiter** in die Datenschutzerklärung aufnehmen
  (Zweck: Zustellung der Anfragen; Daten: die Formularangaben) und den
  **AVV/DPA** abschließen: <https://resend.com/legal/dpa>.
- Rechtsgrundlage für die Bearbeitung der Anfrage ist Art. 6 Abs. 1 lit. b DSGVO
  (vorvertragliche Maßnahmen); deshalb steht unter dem Knopf ein Hinweis statt
  einer Einwilligungs-Checkbox. Der Link führt auf `/datenschutz` – die Seite
  muss vor dem Livegang stehen (siehe README, „Offene TODOs“).
- Die Function speichert nichts; die Angaben stehen nur in der Mail.

## Spam
Die Spam-Falle (verstecktes Feld `website`) ist aktiv: Programme, die es
ausfüllen, bekommen „gesendet“ zurück, es geht aber keine Mail raus. Reicht das
nicht, lässt sich **Cloudflare Turnstile** ergänzen (kostenlos, ohne Cookies) –
Skript und `connect-src`/`frame-src` dafür in `site/_headers` freigeben.
