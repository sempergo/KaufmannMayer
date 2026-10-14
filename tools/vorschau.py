"""Baut aus site/ eine einzelne HTML-Datei, die ohne Server im Browser läuft – zum Weitergeben an den Auftraggeber.

    python3 -I tools/vorschau.py [ziel.html]

Standardziel: tools/berichte/vorschau/kaufmann-mayer-startseite.html (nicht im Repo).
Schriften, Bilder, CSS und JavaScript werden eingebettet (Data-URIs, <style>, <script>);
Favicons und Preloads entfallen, loading="lazy" wird entfernt. Interne Links (/anfrage …)
führen in der Datei ins Leere – das ist gewollt, es geht um die Ansicht der Startseite.
"""
import base64
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
ZIEL = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "tools" / "berichte" / "vorschau" / "kaufmann-mayer-startseite.html"
MIME = {".woff2": "font/woff2", ".webp": "image/webp", ".png": "image/png", ".avif": "image/avif", ".ico": "image/x-icon"}


def data(pfad):
    f = SITE / pfad.lstrip("/")
    return f"data:{MIME[f.suffix]};base64," + base64.b64encode(f.read_bytes()).decode()


html = (SITE / "index.html").read_text()
css = (SITE / "css" / "site.css").read_text()
css = re.sub(r'url\("(/fonts/[^"]+)"\)', lambda m: f'url("{data(m.group(1))}")', css)
js = (SITE / "js" / "site.js").read_text()

html = re.sub(r'<link rel="preload"[^>]*>\n?', "", html)
html = html.replace('<link rel="stylesheet" href="/css/site.css">', f"<style>\n{css}\n</style>")
html = html.replace('<script src="/js/site.js" defer></script>', f"<script>\n{js}\n</script>")
html = re.sub(r'<link rel="(icon|apple-touch-icon)"[^>]*>\n?', "", html)
# Bilder: <source> weg, <img> und SVG-<image> als Data-URI (WebP, 2x)
html = re.sub(r'\s*<source type="image/(avif|webp)" srcset="[^"]*">', "", html)
html = html.replace('src="/img/logo-hell-2x.png"', f'src="{data("/img/logo-hell-2x.webp")}"')
html = re.sub(r'href="(/img/[^"]+)"', lambda m: f'href="{data(m.group(1))}"', html)
html = html.replace(' loading="lazy"', "")
offen = re.findall(r'"/(?:img|fonts|css|js)/[^"]*"', html)
if offen:
    sys.exit(f"Nicht eingebettet: {offen[:5]}")
ZIEL.parent.mkdir(parents=True, exist_ok=True)
ZIEL.write_text(html)
print(f"{ZIEL} ({len(html) // 1024} KB)")
