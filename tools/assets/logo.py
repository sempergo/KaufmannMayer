"""Erzeugt aus dem Original-Logo der alten Wix-Seite die Bilddateien der Website.

    python3 -I tools/assets/logo.py

Quelle: quellen/logo-wix-original.jpg (786 x 613 px, JPEG, weisser Grund),
geladen von https://static.wixstatic.com/media/4166e8_4d72d9020c0f451b9509d870510bda9e~mv2.jpg

Das Original ist gestapelt (Haus oben, Schriftzug unten); in einer Kopfzeile
waere der Schriftzug kaum 7 px hoch. Deshalb stehen Haus und Schriftzug
nebeneinander (horizontales Lockup), beide Teile unverändert. Zwei Fassungen:
- hell: Original auf weissem Grund – für die weisse Navigationsleiste,
- dunkel: das Haus auf weisser, abgerundeter Kachel (wie ein App-Icon), der
  Schriftzug freigestellt ("KAUFMANN &" weiss, "MAYER" orange) – für den
  dunkelblauen Footer.
Sobald das Logo als Vektor vorliegt, ersetzt es diese Dateien.

Ausgabe nach site/img/ und site/:
  logo-hell-{1,2,3}x.{avif,webp}, logo-hell-2x.png       Navigation
  logo-dunkel-{1,2,3}x.{avif,webp}, logo-dunkel-2x.png   Footer
  favicon.ico, apple-touch-icon.png
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "quellen" / "logo-wix-original.jpg"
IMG = ROOT / "site" / "img"
SITE = ROOT / "site"

# Begrenzungen im Original (ermittelt über Pixel heller als 225)
EMBLEM = (60, 18, 755, 489)
WORTMARKE = (33, 537, 763, 590)

CSS_HOEHE = 44          # Höhe des Lockups (CSS-Pixel)
SCHRIFT_ANTEIL = 0.30   # Höhe des Schriftzugs relativ zur Kachel
ABSTAND_ANTEIL = 0.30   # Abstand Kachel -> Schriftzug relativ zur Kachel
WEISS = (255, 255, 255)
ORANGE = (236, 116, 18)


def kachel(hoehe):
    """Haus auf weisser Kachel mit runden Ecken, transparent drumherum."""
    src = Image.open(SRC).convert("RGB")
    emblem = src.crop(EMBLEM)
    s = 4  # Überabtastung für glatte Ecken
    seite = hoehe * s
    rand = round(seite * 0.12)
    innen = seite - 2 * rand
    eb = innen
    eh = round(emblem.height * eb / emblem.width)
    emblem = emblem.resize((eb, eh), Image.LANCZOS)
    tile = Image.new("RGBA", (seite, seite), (0, 0, 0, 0))
    maske = Image.new("L", (seite, seite), 0)
    ImageDraw.Draw(maske).rounded_rectangle((0, 0, seite - 1, seite - 1), radius=round(seite * 0.24), fill=255)
    weiss = Image.new("RGBA", (seite, seite), WEISS + (255,))
    tile.paste(weiss, (0, 0), maske)
    tile.paste(emblem, (rand, (seite - eh) // 2))
    tile.putalpha(maske)
    return tile.resize((hoehe, hoehe), Image.LANCZOS)


def wortmarke(hoehe):
    """Schriftzug freigestellt: dunkle Buchstaben werden weiss, orange bleibt orange."""
    w = Image.open(SRC).convert("RGB").crop(WORTMARKE)
    out = Image.new("RGBA", w.size, (0, 0, 0, 0))
    px, po = w.load(), out.load()
    for x in range(w.width):
        for y in range(w.height):
            r, g, b = px[x, y]
            if r - b > 90 and r > 150:              # orange: Deckkraft über den Blaukanal
                a = (255 - b) / (255 - 12)
                po[x, y] = ORANGE + (round(255 * min(1, max(0, a))),)
            else:                                   # grau/schiefer: Deckkraft über die Helligkeit
                l = 0.299 * r + 0.587 * g + 0.114 * b
                a = (255 - l) / (255 - 46)
                po[x, y] = WEISS + (round(255 * min(1, max(0, a))),)
    b = round(w.width * hoehe / w.height)
    return out.resize((b, hoehe), Image.LANCZOS)


def lockup_hell(hoehe):
    """Original auf weissem Grund: Haus links, Schriftzug rechts."""
    src = Image.open(SRC).convert("RGB")
    emblem, wort = src.crop(EMBLEM), src.crop(WORTMARKE)
    eb = round(emblem.width * hoehe / emblem.height)
    emblem = emblem.resize((eb, hoehe), Image.LANCZOS)
    wh = round(hoehe * 0.32)
    wort = wort.resize((round(wort.width * wh / wort.height), wh), Image.LANCZOS)
    gap = round(hoehe * 0.2)
    out = Image.new("RGB", (eb + gap + wort.width, hoehe), "white")
    out.paste(emblem, (0, 0))
    out.paste(wort, (eb + gap, round(hoehe * 0.6 - wh / 2)))
    return out


def lockup_dunkel(hoehe):
    k = kachel(hoehe)
    wm = wortmarke(round(hoehe * SCHRIFT_ANTEIL))
    gap = round(hoehe * ABSTAND_ANTEIL)
    out = Image.new("RGBA", (k.width + gap + wm.width, hoehe), (0, 0, 0, 0))
    out.paste(k, (0, 0), k)
    out.paste(wm, (k.width + gap, round((hoehe - wm.height) / 2)), wm)
    return out


def main():
    IMG.mkdir(parents=True, exist_ok=True)
    for name, bau in (("hell", lockup_hell), ("dunkel", lockup_dunkel)):
        for f in (1, 2, 3):
            im = bau(CSS_HOEHE * f)
            im.save(IMG / f"logo-{name}-{f}x.avif", quality=80)
            im.save(IMG / f"logo-{name}-{f}x.webp", quality=90, method=6)
            if f == 2:
                im.save(IMG / f"logo-{name}-2x.png", optimize=True)
            print(f"logo-{name}-{f}x", im.size)

    # Favicon und Touch-Icon: das Haus auf weisser Kachel
    k = kachel(180)
    hinter = Image.new("RGB", k.size, (14, 27, 45))
    hinter.paste(k, (0, 0), k)
    hinter.save(SITE / "apple-touch-icon.png", optimize=True)
    kachel(48).save(SITE / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("favicon.ico, apple-touch-icon.png")


if __name__ == "__main__":
    main()
