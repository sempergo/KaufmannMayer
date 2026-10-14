"""Erzeugt aus dem Original-Logo der alten Wix-Seite die Bilddateien der Website.

    python3 -I tools/assets/logo.py

Quelle: quellen/logo-wix-original.jpg (786 x 613 px, JPEG, weisser Grund),
geladen von https://static.wixstatic.com/media/4166e8_4d72d9020c0f451b9509d870510bda9e~mv2.jpg

Das Original ist gestapelt (Haus oben, Schriftzug unten). In einer Kopfzeile
waere der Schriftzug darin kaum 7 px hoch. Deshalb setzt das Skript Haus und
Schriftzug nebeneinander (horizontales Lockup) - beide Teile unveraendert, nur
neu angeordnet. Sobald das Logo als Vektor vorliegt, ersetzt es diese Dateien.

Ausgabe nach site/img/ und site/:
  logo-quer-{1,2,3}x.{avif,webp}, logo-quer-2x.png   Kopfzeile und Footer
  favicon.ico, apple-touch-icon.png
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "quellen" / "logo-wix-original.jpg"
IMG = ROOT / "site" / "img"
SITE = ROOT / "site"

# Begrenzungen im Original (ermittelt ueber Pixel heller als 225)
EMBLEM = (60, 18, 755, 489)
WORTMARKE = (33, 537, 763, 590)

CSS_HOEHE = 44          # Hoehe des Lockups in der Kopfzeile (CSS-Pixel)
SCHRIFT_ANTEIL = 0.32   # Hoehe des Schriftzugs relativ zum Haus
ABSTAND_ANTEIL = 0.20   # Abstand Haus -> Schriftzug relativ zum Haus
MITTE_ANTEIL = 0.60     # Schriftzug mittig auf den Hauskoerper (unter dem Dach)


def lockup(hoehe):
    src = Image.open(SRC).convert("RGB")
    emblem = src.crop(EMBLEM)
    wort = src.crop(WORTMARKE)
    eb = round(emblem.width * hoehe / emblem.height)
    emblem = emblem.resize((eb, hoehe), Image.LANCZOS)
    wh = round(hoehe * SCHRIFT_ANTEIL)
    wb = round(wort.width * wh / wort.height)
    wort = wort.resize((wb, wh), Image.LANCZOS)
    gap = round(hoehe * ABSTAND_ANTEIL)
    out = Image.new("RGB", (eb + gap + wb, hoehe), "white")
    out.paste(emblem, (0, 0))
    out.paste(wort, (eb + gap, round(hoehe * MITTE_ANTEIL - wh / 2)))
    return out


def main():
    IMG.mkdir(parents=True, exist_ok=True)
    for f in (1, 2, 3):
        im = lockup(CSS_HOEHE * f)
        im.save(IMG / f"logo-quer-{f}x.avif", quality=72)
        im.save(IMG / f"logo-quer-{f}x.webp", quality=88, method=6)
        if f == 2:
            im.save(IMG / "logo-quer-2x.png", optimize=True)
        print(f"logo-quer-{f}x", im.size)

    # Favicon und Touch-Icon: Haus quadratisch auf Weiss
    src = Image.open(SRC).convert("RGB")
    emblem = src.crop(EMBLEM)
    seite = round(emblem.width * 1.08)
    quad = Image.new("RGB", (seite, seite), "white")
    quad.paste(emblem, ((seite - emblem.width) // 2, (seite - emblem.height) // 2))
    quad.resize((180, 180), Image.LANCZOS).save(SITE / "apple-touch-icon.png", optimize=True)
    quad.resize((48, 48), Image.LANCZOS).save(SITE / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("favicon.ico, apple-touch-icon.png")


if __name__ == "__main__":
    main()
