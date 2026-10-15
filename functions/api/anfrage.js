/**
 * POST /api/anfrage  (Cloudflare Pages Function)
 *
 * Nimmt das Anfrageformular von /anfrage entgegen, prüft es (Pflichtfelder, Spam-Falle),
 * baut daraus eine E-Mail (HTML und Text) und verschickt sie über die Resend-API.
 * Übernommen aus sempergo/21layer (functions/api/anfrage.js), angepasst auf die Felder
 * einer Hausverwaltung und um Formular-POST ohne JavaScript ergänzt.
 *
 *   JSON (fetch aus js/site.js)        → Antwort JSON { ok: true } bzw. { ok: false, error }
 *   Formular-POST (ohne JavaScript)    → 303 auf /anfrage#gesendet bzw. /anfrage#nicht-gesendet
 *
 * Umgebung (Cloudflare Pages → Settings → Variables and Secrets), Einrichtung: ANFRAGE-SETUP.md
 *   RESEND_API_KEY   API-Schlüssel von Resend (re_…)                      [Secret – nie ins Repo]
 *   MAIL_FROM        Absender auf der bei Resend bestätigten Domain        [Variable] (Standard formular@kaufmann-mayer.de)
 *   MAIL_FROM_NAME   Anzeigename des Absenders                            [Variable] (Standard „Kaufmann & Mayer Website“)
 *   MAIL_TO          Empfänger                                            [Variable] (Standard jhmayer@t-online.de)
 *
 * Gleiche Herkunft wie die Website, deshalb kein CORS.
 */

const LF = String.fromCharCode(10);
const ARTEN = { termin: "Terminwunsch", nachricht: "Nachricht" };

export async function onRequestPost({ request, env }) {
  const alsJson = (request.headers.get("content-type") || "").includes("application/json");
  let daten;
  try {
    daten = alsJson ? await request.json() : formularDaten(await request.formData());
  } catch {
    return antwort(alsJson, 400, "bad_request");
  }
  if (!daten || typeof daten !== "object") return antwort(alsJson, 400, "bad_request");

  // Spam-Falle: Menschen sehen das Feld „website“ nicht und lassen es leer.
  if (typeof daten.website === "string" && daten.website.trim() !== "") {
    return antwort(alsJson, 200); // Erfolg vortäuschen, still verwerfen
  }

  const art = ARTEN[daten.art] ? daten.art : "nachricht";
  const name = clean(daten.name, 120);
  const email = clean(daten.email, 160);
  const telefon = clean(daten.telefon, 60);
  const rolle = clean(daten.rolle, 80);
  const objekt = clean(daten.objekt, 120);
  const einheiten = clean(daten.einheiten, 40);
  const gespraech = art === "termin" ? clean(daten.gespraech, 40) : "";
  // Datum aus dem Kalenderfeld (JJJJ-MM-TT) als TT.MM.JJJJ, dazu Vormittag oder Nachmittag
  const tag = clean(daten.wunschtermin, 40).split("-").reverse().join(".");
  const wunschtermin = art === "termin" && tag ? [tag, clean(daten.tageszeit, 20)].filter(Boolean).join(", ") : "";
  const nachricht = clean(daten.nachricht, 5000);
  const seite = clean(daten.seite, 300);
  const anliegen = (Array.isArray(daten.anliegen) ? daten.anliegen : [daten.anliegen])
    .map((v) => clean(v, 60)).filter(Boolean).slice(0, 10);

  if (!name || !isEmail(email)) return antwort(alsJson, 422, "validation");

  const felder = [
    ["Anfrage", ARTEN[art]],
    ["Name", name],
    ["E-Mail", email],
    ["Telefon", telefon],
    ["Sie sind", rolle],
    ["Anliegen", anliegen.join(", ")],
    ["Lage des Objekts", objekt],
    ["Wohneinheiten", einheiten],
    ...(art === "termin" ? [["Gespräch", gespraech], ["Wunschtermin", wunschtermin]] : []),
  ];
  const wann = new Intl.DateTimeFormat("de-DE", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Berlin" }).format(new Date());
  const betreff = `${ARTEN[art]} – ${name}${objekt ? " (" + objekt + ")" : ""}`;

  if (!env.RESEND_API_KEY) return antwort(alsJson, 500, "mailer_unconfigured");
  const absender = env.MAIL_FROM || "formular@kaufmann-mayer.de";
  const absenderName = env.MAIL_FROM_NAME || "Kaufmann & Mayer Website";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${absenderName} <${absender}>`,
        to: [env.MAIL_TO || "jhmayer@t-online.de"],
        reply_to: email,
        subject: betreff,
        text: alsText(felder, nachricht, { wann, seite, email }),
        html: alsHtml(felder, nachricht, { wann, seite, email, name, art }),
      }),
    });
    if (!res.ok) return antwort(alsJson, 502, "resend_send_failed", { status: res.status, detail: (await res.text()).slice(0, 300) });
    return antwort(alsJson, 200);
  } catch (e) {
    return antwort(alsJson, 502, "send_exception", { message: (e && e.message) || String(e) });
  }
}

/* ------------------------------- Hilfen --------------------------------- */

function formularDaten(fd) {
  const d = { anliegen: fd.getAll("anliegen") };
  for (const [k, v] of fd) if (k !== "anliegen") d[k] = v;
  return d;
}
function antwort(alsJson, status, fehler, mehr) {
  const ok = status === 200;
  if (!alsJson) {
    return new Response(null, { status: 303, headers: { Location: ok ? "/anfrage#gesendet" : "/anfrage#nicht-gesendet" } });
  }
  return new Response(JSON.stringify(ok ? { ok: true } : { ok: false, error: fehler, ...mehr }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
function clean(v, max) {
  if (typeof v !== "string") return "";
  let out = "";
  for (const ch of v) {
    const c = ch.codePointAt(0);
    if (c === 10) out += LF;
    else if (c < 32 || c === 127) out += " ";
    else out += ch;
  }
  out = out.replace(/ {2,}/g, " ").replace(new RegExp(LF + "{3,}", "g"), LF + LF);
  return out.trim().slice(0, max);
}
function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ------------------------------ E-Mail ---------------------------------- */

function alsText(felder, nachricht, m) {
  const zeilen = ["Neue Anfrage über das Kontaktformular von kaufmann-mayer.de", ""];
  for (const [k, v] of felder) zeilen.push(k + ": " + (v || "–"));
  zeilen.push("", "Nachricht:", nachricht || "–", "", "———");
  zeilen.push("Antworten geht direkt an: " + m.email, "Gesendet: " + m.wann);
  if (m.seite) zeilen.push("Seite: " + m.seite);
  return zeilen.join(LF);
}

// Farben aus dem Logo: Schiefer #28353e (Text), Blau #1a4274 (Kopf, Knopf), Orange #ec720f (Strich)
function alsHtml(felder, nachricht, m) {
  const zeilen = felder.map(([k, v]) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e3e9f1;vertical-align:top;width:150px;color:#4a5666;font-size:13px;font-weight:600;">${esc(k)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e3e9f1;vertical-align:top;color:#28353e;font-size:15px;">${
          k === "E-Mail" ? `<a href="mailto:${esc(m.email)}" style="color:#1a4274;">${esc(v)}</a>` : v ? esc(v) : '<span style="color:#9aa6b4;">–</span>'
        }</td>
      </tr>`).join("");
  const text = nachricht ? esc(nachricht).replace(new RegExp(LF, "g"), "<br>") : '<span style="color:#9aa6b4;">–</span>';
  const titel = m.art === "termin" ? "Neuer Terminwunsch" : "Neue Nachricht";
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#eef3fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3fa;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dfe5ee;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1a4274;border-bottom:4px solid #ec720f;padding:22px 28px;">
          <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.04em;">KAUFMANN &amp; MAYER</div>
          <div style="color:#d6e3f3;font-size:13px;margin-top:6px;">${titel} über die Website</div>
        </td></tr>
        <tr><td style="padding:24px 28px 4px;">
          <p style="margin:0;color:#28353e;font-size:16px;line-height:1.5;">Über das Kontaktformular hat <strong>${esc(m.name)}</strong> geschrieben.</p>
        </td></tr>
        <tr><td style="padding:8px 28px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${zeilen}</table>
        </td></tr>
        <tr><td style="padding:18px 28px 4px;">
          <div style="color:#4a5666;font-size:13px;font-weight:600;margin-bottom:8px;">Nachricht</div>
          <div style="background:#f4f7fb;border-left:3px solid #ec720f;border-radius:6px;padding:14px 16px;color:#28353e;font-size:15px;line-height:1.6;">${text}</div>
        </td></tr>
        <tr><td style="padding:22px 28px 8px;">
          <a href="mailto:${esc(m.email)}?subject=${encodeURIComponent("Ihre Anfrage bei Kaufmann & Mayer")}" style="display:inline-block;background:#1a4274;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:999px;">Direkt antworten →</a>
        </td></tr>
        <tr><td style="padding:18px 28px 26px;border-top:1px solid #e3e9f1;">
          <p style="margin:0;color:#6b7685;font-size:12px;line-height:1.6;">
            Antworten geht direkt an <a href="mailto:${esc(m.email)}" style="color:#4a5666;">${esc(m.email)}</a><br>
            Gesendet: ${esc(m.wann)}${m.seite ? "<br>Seite: " + esc(m.seite) : ""}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
