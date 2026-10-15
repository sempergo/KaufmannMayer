"""Baut aus site/ einzelne HTML-Dateien, die ohne Server im Browser laufen – zum Weitergeben an den Auftraggeber.

    python3 -I tools/vorschau.py [ziel-ordner]

Standardziel: tools/berichte/vorschau/ (nicht im Repo), darin je Seite aus tools/seiten.json eine Datei
(Feld „vorschau“), z. B. kaufmann-mayer-startseite.html und kaufmann-mayer-anfrage.html.
Schriften, Bilder, CSS und JavaScript werden eingebettet (Data-URIs, <style>, <script>);
Favicons und Preloads entfallen, loading="lazy" wird entfernt. Links zwischen den Seiten
zeigen auf die jeweils andere Datei (alle in denselben Ordner legen); andere interne Links
(/impressum …) führen ins Leere. Das Formular findet in der Datei keinen Server und bietet
deshalb die vorbereitete E-Mail an – genau wie auf GitHub Pages.
"""
import base64
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
ZIEL = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "tools" / "berichte" / "vorschau"
MIME = {".woff2": "font/woff2", ".webp": "image/webp", ".png": "image/png", ".avif": "image/avif", ".ico": "image/x-icon"}
SEITEN = json.loads((ROOT / "tools" / "seiten.json").read_text())


def data(pfad):
    f = SITE / pfad.lstrip("/")
    return f"data:{MIME[f.suffix]};base64," + base64.b64encode(f.read_bytes()).decode()


css = (SITE / "css" / "site.css").read_text()
css = re.sub(r'url\("(/fonts/[^"]+)"\)', lambda m: f'url("{data(m.group(1))}")', css)
js = (SITE / "js" / "site.js").read_text()
ZIEL.mkdir(parents=True, exist_ok=True)

for seite in SEITEN:
    quelle, datei = seite["datei"], seite["vorschau"]
    html = (SITE / quelle).read_text()
    html = re.sub(r'<link rel="preload"[^>]*>\n?', "", html)
    html = html.replace('<link rel="stylesheet" href="/css/site.css">', f"<style>\n{css}\n</style>")
    html = html.replace('<script src="/js/site.js" defer></script>', f"<script>\n{js}\n</script>")
    html = re.sub(r'<link rel="(icon|apple-touch-icon)"[^>]*>\n?', "", html)
    # Bilder: <source> weg, <img> und SVG-<image> als Data-URI (WebP, 2x)
    html = re.sub(r'\s*<source type="image/(avif|webp)" srcset="[^"]*">', "", html)
    html = html.replace('src="/img/logo-hell-2x.png"', f'src="{data("/img/logo-hell-2x.webp")}"')
    html = re.sub(r'href="(/img/[^"]+)"', lambda m: f'href="{data(m.group(1))}"', html)
    html = html.replace(' loading="lazy"', "")
    # Links zwischen den Seiten auf die Nachbardatei (auch mit Sprungmarke, z. B. /#leistungen, /anfrage#nachricht)
    for ziel in SEITEN:
        pfad = re.escape(ziel["pfad"].rstrip("/"))
        html = re.sub(rf'href="{pfad}/?(#[^"]*)?"' if pfad else r'href="/(#[^"]*)?"', lambda m: f'href="{ziel["vorschau"]}{m.group(1) or ""}"', html)
    offen = re.findall(r'"/(?:img|fonts|css|js)/[^"]*"', html)
    if offen:
        sys.exit(f"{quelle}: nicht eingebettet: {offen[:5]}")
    (ZIEL / datei).write_text(html)
    print(f"{ZIEL / datei} ({len(html) // 1024} KB)")
