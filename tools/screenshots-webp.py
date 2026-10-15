"""Macht aus den Screenshots in tools/berichte/screenshots die WebP-Momentaufnahmen in screenshots/ (im README eingebunden).

    node tools/pruefung/screenshots.js        # erst aufnehmen (Server muss laufen)
    python3 -I tools/screenshots-webp.py      # dann umwandeln

Die ganzseitige Mobilfassung der Startseite wird auf halbe Größe (390 px breit) verkleinert, alles andere bleibt in
Originalgröße. Von der Kontaktseite /anfrage: Desktop ganz (Formular vollständig), mobil der erste Bildschirm.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
QUELLE = ROOT / "tools" / "berichte" / "screenshots"
ZIEL = ROOT / "screenshots"

for name, halb in (("startseite-1440-oben", False), ("startseite-1440", False), ("startseite-390-oben", False), ("startseite-390", True),
                   ("anfrage-1440", False), ("anfrage-390-oben", False)):
    bild = Image.open(QUELLE / f"{name}.png").convert("RGB")
    if halb:
        bild = bild.resize((bild.width // 2, bild.height // 2), Image.LANCZOS)
    bild.save(ZIEL / f"{name}.webp", quality=72, method=6)
    print(f"screenshots/{name}.webp {bild.size[0]} x {bild.size[1]}")
