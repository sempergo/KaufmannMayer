"""Zeichnet die Frankfurter Skyline aus der gelieferten Vorlage als SVG-Pfad nach.

    python3 -I tools/assets/skyline.py      (einmalig; braucht opencv-python-headless und numpy)

Quelle: quellen/skyline-vorlage.png (580 x 386 px, schwarze Silhouette auf Weiß),
vom Auftraggeber im Chat geliefert. Die Vorlage wird vierfach vergrößert, in
Schwarz/Weiß getrennt, ihre Umrisse werden nachgezogen und vereinfacht. Ausgabe:
tools/assets/skyline.svg.html – ein <svg>, das in site/index.html (Hero) steht.
"""
from pathlib import Path
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "quellen" / "skyline-vorlage.png"
OUT = Path(__file__).with_name("skyline.svg.html")
FAKTOR = 4          # Vergrößerung vor dem Nachzeichnen (glattere Schrägen)
GENAUIGKEIT = 1.6   # Toleranz der Vereinfachung in vergrößerten Pixeln
BREITE = 1000       # Breite der viewBox

grau = cv2.imread(str(SRC), cv2.IMREAD_GRAYSCALE)
gross = cv2.resize(grau, None, fx=FAKTOR, fy=FAKTOR, interpolation=cv2.INTER_CUBIC)
_, maske = cv2.threshold(gross, 128, 255, cv2.THRESH_BINARY_INV)
konturen, hierarchie = cv2.findContours(maske, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
konturen = [k for k in konturen if cv2.contourArea(k) > 40 * FAKTOR * FAKTOR]
x0, y0, b, h = cv2.boundingRect(np.vstack(konturen))
massstab = BREITE / b
teile = []
for k in konturen:
    punkte = cv2.approxPolyDP(k, GENAUIGKEIT, True).reshape(-1, 2)
    zahlen = [f"{(x - x0) * massstab:.1f} {(y - y0) * massstab:.1f}" for x, y in punkte]
    teile.append("M" + "L".join(zahlen) + "Z")
hoehe = h * massstab
d = "".join(teile).replace(".0 ", " ").replace(".0L", "L").replace(".0Z", "Z")
svg = (f'<svg class="hero__skyline" viewBox="0 0 {BREITE} {hoehe:.0f}" preserveAspectRatio="xMinYMax meet" aria-hidden="true" focusable="false">'
       f'<defs><linearGradient id="sky-verlauf" x1="0" y1="0" x2="0" y2="1">'
       f'<stop offset="0" stop-color="#2a5ea8" stop-opacity=".3"/><stop offset=".55" stop-color="#2a5ea8" stop-opacity=".21"/>'
       f'<stop offset=".85" stop-color="#2a5ea8" stop-opacity=".08"/><stop offset="1" stop-color="#2a5ea8" stop-opacity="0"/></linearGradient></defs>'
       f'<path fill="url(#sky-verlauf)" fill-rule="evenodd" d="{d}"/></svg>')
OUT.write_text(svg)
print(f"{len(konturen)} Umrisse, viewBox {BREITE} x {hoehe:.0f}, {len(svg)} Zeichen")
