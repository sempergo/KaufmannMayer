// Mobiles Menü als Disclosure: Knopf mit aria-expanded steuert die Navigation.
// Escape und Klick außerhalb schließen, der Fokus kehrt zum Knopf zurück.
// Ohne JavaScript bleibt die Navigation sichtbar (Klasse no-js im HTML).
(function () {
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("hauptnavigation");
  var header = document.querySelector(".site-header");
  if (!toggle || !nav || !header) return;
  var desktop = window.matchMedia("(min-width: 70em)");

  function isOpen() { return toggle.getAttribute("aria-expanded") === "true"; }
  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  }

  toggle.addEventListener("click", function () { setOpen(!isOpen()); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
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
})();
