// Kaufmann & Mayer – das einzige Skript der Seite (ohne Abhängigkeiten).
// 1 Mobiles Menü als Disclosure: Knopf mit aria-expanded steuert die Navigation,
//   Escape und Klick außerhalb schließen, der Fokus kehrt zum Knopf zurück.
//   Ohne JavaScript bleibt die Navigation sichtbar (Klasse no-js im HTML).
// 2 Scrollspy: markiert den Menüpunkt der sichtbaren Sektion (aria-current).
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
})();
