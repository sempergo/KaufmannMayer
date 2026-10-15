// Kaufmann & Mayer – das einzige Skript der Website (ohne Abhängigkeiten), für alle Seiten.
// 1 Mobiles Menü als Disclosure: Knopf mit aria-expanded steuert die Navigation,
//   Escape und Klick außerhalb schließen, der Fokus kehrt zum Knopf zurück.
//   Ohne JavaScript bleibt die Navigation sichtbar (Klasse no-js im HTML).
// 2 Scrollspy: markiert den Menüpunkt der sichtbaren Sektion (aria-current).
// 3 Portal-Fenster: Reiter (Tabs) wählen den Bereich beim Überfahren, Antippen und per Pfeiltasten.
// 4 Werterhalt-Animation: läuft einmal, sobald die Grafik zur Hälfte im Bild ist.
// 5 Laufband der Vertrauensleiste.
// 6 Anfrageformular auf /anfrage: Prüfung, Versand als JSON, E-Mail als Rückfall.
(function () {
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("hauptnavigation");
  var header = document.querySelector(".site-header");

  // 1 Menü
  if (toggle && nav && header) {
    var desktop = window.matchMedia("(min-width: 70em)");
    var isOpen = function () { return toggle.getAttribute("aria-expanded") === "true"; };
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () { setOpen(!isOpen()); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (isOpen() && !header.contains(e.target)) setOpen(false);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    // Fokus verlässt das offene Panel per Tab: schließen, damit nichts Verdecktes fokussiert ist
    nav.addEventListener("focusout", function (e) {
      if (isOpen() && e.relatedTarget && !header.contains(e.relatedTarget)) setOpen(false);
    });
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
    else desktop.addListener(onChange);
  }

  // 2 Scrollspy
  if ("IntersectionObserver" in window) {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__list a[href^="#"]'));
    var ziele = new Map();
    links.forEach(function (a) {
      var s = document.querySelector(a.getAttribute("href"));
      if (s) ziele.set(s, a);
    });
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        var a = ziele.get(e.target);
        if (e.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute("aria-current"); });
          a.setAttribute("aria-current", "location");
        } else if (a.hasAttribute("aria-current")) {
          a.removeAttribute("aria-current");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ziele.forEach(function (a, s) { io.observe(s); });
  }

  // 3 Portal-Fenster (Tabs mit wanderndem Fokus). Ohne JavaScript bleiben die Reiter deaktiviert.
  var reiterleiste = document.querySelector(".pui__nav");
  if (reiterleiste) {
    var reiter = Array.prototype.slice.call(reiterleiste.querySelectorAll('[role="tab"]'));
    var waehle = function (t, fokus) {
      reiter.forEach(function (x, i) {
        var an = x === t;
        x.setAttribute("aria-selected", String(an));
        x.tabIndex = an ? 0 : -1;
        document.getElementById(x.getAttribute("aria-controls")).classList.toggle("is-active", an);
        if (an) reiterleiste.style.setProperty("--i", i);
      });
      if (fokus) t.focus();
    };
    reiter.forEach(function (t, i) {
      t.disabled = false;
      t.addEventListener("click", function () { waehle(t); });
      t.addEventListener("mouseenter", function () { waehle(t); });
      t.addEventListener("keydown", function (e) {
        var n = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1, Home: -i, End: reiter.length - 1 - i }[e.key];
        if (n === undefined) return;
        e.preventDefault();
        waehle(reiter[(i + n + reiter.length) % reiter.length], true);
      });
    });
  }

  // 4 Werterhalt-Animation: Zeitplan in Sekunden (Beginn, Dauer) je Teil, data-speed beschleunigt.
  //   Bei reduzierter Bewegung oder ohne IntersectionObserver steht sofort das Endbild.
  var venns = document.querySelectorAll(".wh-venn");
  if (venns.length) {
    var ENDE = 6.5;
    var begrenzt = function (v) { return Math.max(0, Math.min(1, v)); };
    var aus = function (t) { return 1 - Math.pow(1 - t, 3); };
    var einAus = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var teil = function (t, a, d, e) { return (e || aus)(begrenzt((t - a) / d)); };
    var bild = function (t) {
      return {
        l: teil(t, 0, 1.2, einAus), lh: teil(t, 0.8, 0.6), lk1: teil(t, 1.1, 0.6), lk2: teil(t, 1.35, 0.6), lk3: teil(t, 1.6, 0.6),
        r: teil(t, 1.6, 1.2, einAus), rh: teil(t, 2.4, 0.6), rk1: teil(t, 2.7, 0.6), rk2: teil(t, 2.95, 0.6), rk3: teil(t, 3.2, 0.6),
        m: teil(t, 3.9, 1.2, einAus), c: teil(t, 4.8, 0.8), ch: teil(t, 5.0, 0.9, einAus), cw: teil(t, 5.5, 0.8),
        pr: teil(t, 5.0, 1.5)
      };
    };
    // Leuchtpunkt an der Zeichenspitze (sichtbar, solange gezeichnet wird) und Pulsring der Schnittmenge
    var spitze = function (x) { return x > 0 && x < 1 ? Math.min(1, 6 * x * (1 - x)) : 0; };
    var setze = function (el, t) {
      var v = bild(t);
      v.lp = spitze(v.l);
      v.rp = spitze(v.r);
      v.po = v.pr > 0 && v.pr < 1 ? (1 - v.pr) * 0.8 : 0;
      for (var k in v) el.style.setProperty("--" + k, v[k].toFixed(4));
    };
    var ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    Array.prototype.forEach.call(venns, function (el) {
      if (ruhig || !("IntersectionObserver" in window)) { setze(el, ENDE); return; }
      var tempo = parseFloat(el.getAttribute("data-speed")) || 1;
      var beob = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return;
        beob.disconnect();
        var start = 0;
        var schritt = function (jetzt) {
          if (!start) start = jetzt;
          var t = Math.min((jetzt - start) / 1000 * tempo, ENDE);
          setze(el, t);
          if (t < ENDE) window.requestAnimationFrame(schritt);
        };
        window.requestAnimationFrame(schritt);
      }, { threshold: 0.45 });
      beob.observe(el);
    });
  }

  // 5 Laufband: eine Kopie der Liste macht den Lauf nahtlos (für Screenreader verborgen). Bewegung, die
  //   von selbst startet, muss anhaltbar sein (WCAG 2.2.2) – ohne sichtbaren Knopf (Wunsch des Auftraggebers):
  //   Überfahren hält an (CSS), Antippen schaltet um, mit der Tastatur ist das Band ein Tab-Halt und steht,
  //   solange es den Fokus hat. Bei reduzierter Bewegung bleibt alles stehen.
  // Gilt für die Vertrauensleiste im Hero und das Bildband der Referenz (.karussell, Bilder statt Liste).
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    Array.prototype.forEach.call(document.querySelectorAll(".laufband"), function (band) {
      var spur = band.querySelector(".laufband__spur");
      var liste = spur.querySelector(".trust");
      if (liste) {
        var kopie = liste.cloneNode(true);
        kopie.setAttribute("aria-hidden", "true");
        spur.appendChild(kopie);
      } else {
        // Bildband: zwei Kopien (drei Sätze), damit auch breite Fenster nie eine Lücke zeigen
        var bilder = Array.prototype.slice.call(spur.children);
        for (var n = 0; n < 2; n++) bilder.forEach(function (el) {
          var k = el.cloneNode(true);
          k.setAttribute("aria-hidden", "true");
          spur.appendChild(k);
        });
        spur.style.setProperty("--saetze", "3");
      }
      band.setAttribute("role", "group");
      band.setAttribute("aria-label", (band.getAttribute("data-name") || "Bewertung und Auszeichnungen") + " – angehalten, solange ausgewählt");
      band.tabIndex = 0;
      band.addEventListener("click", function () { band.classList.toggle("ist-angehalten"); });
      band.classList.add("laeuft");
    });
  }

  // 6 Anfrageformular (/anfrage). Ohne JavaScript geht es per POST an die Pages Function, die auf
  //   #gesendet oder #nicht-gesendet zurückleitet. Mit JavaScript: Prüfung mit Hinweis am Feld, Versand als
  //   JSON, Dank in der Karte. Fehlt der Endpunkt (GitHub-Pages-Vorschau, Einzeldatei) oder klemmt der
  //   Versand, steht eine fertige E-Mail mit allen Angaben bereit – keine Anfrage geht verloren.
  //   /anfrage#nachricht (Buttons „Kontakt aufnehmen“) öffnet direkt den Weg „Nachricht senden“.
  var formular = document.getElementById("formular");
  // Kalender ab heute
  var tagFeld = document.getElementById("f-termin");
  if (tagFeld) tagFeld.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  if (formular) {
    var POSTFACH = "jhmayer@t-online.de";
    var meldung = formular.querySelector(".formular__status");
    var senden = formular.querySelector(".formular__senden");
    var PFLICHT = [["f-name", "Name"], ["f-email", "E-Mail"]];
    if (location.hash === "#nachricht") document.getElementById("art-nachricht").checked = true;
    formular.noValidate = true;

    // Meldung aus Textstücken und Links (DOM statt innerHTML: die Angaben stammen aus dem Formular)
    var melde = function (teile, art) {
      meldung.textContent = "";
      meldung.className = "formular__status" + (art ? " ist-" + art : "");
      [].concat(teile).forEach(function (t) { meldung.appendChild(typeof t === "string" ? document.createTextNode(t) : t); });
    };
    var link = function (href, text) {
      var a = document.createElement("a");
      a.href = href;
      a.textContent = text;
      return a;
    };
    var angaben = function () {
      var d = { anliegen: [] };
      Array.prototype.forEach.call(formular.elements, function (el) {
        if (!el.name || el.disabled || ((el.type === "checkbox" || el.type === "radio") && !el.checked)) return;
        if (el.name === "anliegen") d.anliegen.push(el.value);
        else if (el.type === "checkbox") d[el.name] = d[el.name] ? d[el.name] + " oder " + el.value : el.value;
        else d[el.name] = el.value.trim();
      });
      if (d.art !== "termin") { delete d.gespraech; delete d.wunschtermin; delete d.tageszeit; }
      d.seite = location.href;
      return d;
    };
    // Fallback: dieselben Angaben als E-Mail (Zeilenumbruch %0D%0A nach RFC 6068)
    var alsMail = function (d) {
      var zeilen = [["Name", d.name], ["E-Mail", d.email], ["Telefon", d.telefon], ["Sie sind", d.rolle],
        ["Anliegen", d.anliegen.join(", ")], ["Lage des Objekts", d.objekt], ["Wohneinheiten", d.einheiten],
        ["Gespräch", d.gespraech], ["Wunschtermin", d.wunschtermin && [d.wunschtermin.split("-").reverse().join("."), d.tageszeit].filter(Boolean).join(", ")]]
        .filter(function (z) { return z[1]; }).map(function (z) { return z[0] + ": " + z[1]; });
      if (d.nachricht) zeilen.push("", d.nachricht);
      return link("mailto:" + POSTFACH + "?subject=" + encodeURIComponent((d.art === "termin" ? "Terminwunsch" : "Anfrage") + " über die Website") +
        "&body=" + encodeURIComponent(zeilen.join("\r\n")), "vorbereitete E-Mail mit Ihren Angaben");
    };

    // Hinweis unter dem Feld; aria-describedby nur, solange er gilt (sonst läse der Screenreader ihn immer)
    var markiere = function (feld, falsch) {
      if (falsch) { feld.setAttribute("aria-invalid", "true"); feld.setAttribute("aria-describedby", feld.id + "-fehler"); }
      else { feld.removeAttribute("aria-invalid"); feld.removeAttribute("aria-describedby"); }
    };

    formular.addEventListener("submit", function (e) {
      e.preventDefault();
      if (senden.disabled) return;
      var falsch = PFLICHT.filter(function (p) {
        var feld = document.getElementById(p[0]);
        var gut = feld.value.trim() !== "" && feld.checkValidity();
        markiere(feld, !gut);
        return !gut;
      });
      if (falsch.length) {
        melde("Bitte " + falsch.map(function (p) { return p[1]; }).join(" und ") + " ergänzen.", "fehler");
        document.getElementById(falsch[0][0]).focus();
        return;
      }
      var d = angaben();
      senden.disabled = true;
      melde("Wird gesendet …");
      fetch(formular.getAttribute("action"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(d)
      })
        .then(function (r) { return r.ok ? r.json() : { ok: false }; })
        .then(function (antwort) {
          if (!antwort || !antwort.ok) throw new Error("nicht gesendet");
          var dank = document.getElementById("gesendet");
          dank.classList.add("ist-offen");
          dank.focus();
        })
        .catch(function () {
          senden.disabled = false;
          melde(["Ihre Anfrage konnte gerade nicht gesendet werden. Senden Sie uns die ", alsMail(d), " oder rufen Sie an: ",
            link("tel:+496145938481", "06145\u00a0938481"), "."], "fehler");
        });
    });
    formular.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true" && e.target.value.trim() && e.target.checkValidity()) markiere(e.target, false);
    });
    formular.addEventListener("change", function (e) {
      if (e.target.name === "art") melde("");
    });

    // Am Desktop passt die Seite immer auf einen Bildschirm: Textspalte und Formularkarte werden gemessen
    // und, wenn das Fenster zu niedrig ist, per CSS-zoom so weit verkleinert, dass nichts scrollt.
    var desktop = window.matchMedia("(min-width: 60em)");
    var buehne = document.querySelector(".anfrage__buehne");
    var karte = formular.parentNode;
    var text = [".anfrage__intro", ".punkte", ".direkt"].map(function (s) { return document.querySelector(s); });
    var wurzel = document.documentElement;
    var px = function (el, eig) { return parseFloat(getComputedStyle(el)[eig]) || 0; };
    var einpassen = function () {
      wurzel.style.setProperty("--zoom-karte", "1");
      wurzel.style.setProperty("--zoom-text", "1");
      if (!desktop.matches) return;
      var h = window.innerHeight;
      var platzKarte = h - px(buehne, "marginTop") - px(buehne, "marginBottom") - px(buehne, "paddingTop") - px(buehne, "paddingBottom");
      var platzText = h - px(document.querySelector(".anfrage-kopf"), "height") - px(document.querySelector(".anfrage-fuss"), "height") - 68; // vier Mindestabstände à 1rem + Luft
      var hoeheText = text[0].offsetHeight + text[1].offsetHeight + text[2].offsetHeight;
      // 4 px Luft gegen Rundung beim Verkleinern
      wurzel.style.setProperty("--zoom-karte", Math.min(1, (platzKarte - 4) / karte.offsetHeight).toFixed(3));
      wurzel.style.setProperty("--zoom-text", Math.min(1, (platzText - 4) / hoeheText).toFixed(3));
    };
    einpassen();
    window.addEventListener("resize", einpassen);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(einpassen);
    formular.addEventListener("change", einpassen);
    formular.addEventListener("submit", function () { setTimeout(einpassen, 0); });
  }
})();
