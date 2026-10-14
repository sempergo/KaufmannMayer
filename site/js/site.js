// Kaufmann & Mayer – das einzige Skript der Seite (ohne Abhängigkeiten).
// 1 Mobiles Menü als Disclosure: Knopf mit aria-expanded steuert die Navigation,
//   Escape und Klick außerhalb schließen, der Fokus kehrt zum Knopf zurück.
//   Ohne JavaScript bleibt die Navigation sichtbar (Klasse no-js im HTML).
// 2 Scrollspy: markiert den Menüpunkt der sichtbaren Sektion (aria-current).
// 3 Portal-Fenster: Reiter (Tabs) wählen den Bereich beim Überfahren, Antippen und per Pfeiltasten.
// 4 Werterhalt-Animation: läuft einmal, sobald die Grafik zur Hälfte im Bild ist.
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
})();
