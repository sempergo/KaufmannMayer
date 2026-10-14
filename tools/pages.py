"""Baut site/ für GitHub Pages um.

    python3 tools/pages.py /KaufmannMayer     (Unterpfad, liefert actions/configure-pages)

GitHub Pages zeigt die Seite unter einem Unterpfad (https://sempergo.github.io/KaufmannMayer/),
die Website verweist aber mit Wurzelpfaden (/css/…, /img/…, /fonts/…, /). Das Skript kopiert site/
nach _pages/, setzt den Unterpfad vor alle Wurzelpfade in HTML (href, src, srcset) und CSS (url()),
und sperrt die Kopie für Suchmaschinen (noindex, robots.txt) – sie ist eine Vorschau und soll der
echten Domain keine Konkurrenz machen. _headers (nur Cloudflare) entfällt; ohne sie gilt dort keine CSP.
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUELLE, ZIEL = ROOT / "site", ROOT / "_pages"
basis = (sys.argv[1] if len(sys.argv) > 1 else "").rstrip("/")


def html(text):
    text = re.sub(r'((?:href|src)=")/(?!/)', lambda m: f"{m.group(1)}{basis}/", text)
    text = re.sub(r'srcset="[^"]*"', lambda m: re.sub(r'(srcset="|,\s*)/(?!/)', lambda n: f"{n.group(1)}{basis}/", m.group(0)), text)
    if 'name="robots"' not in text:
        text = text.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex">', 1)
    return text


shutil.rmtree(ZIEL, ignore_errors=True)
shutil.copytree(QUELLE, ZIEL)
(ZIEL / "_headers").unlink(missing_ok=True)
for f in ZIEL.rglob("*.html"):
    f.write_text(html(f.read_text()))
for f in ZIEL.rglob("*.css"):
    f.write_text(re.sub(r'url\("/(?!/)', f'url("{basis}/', f.read_text()))
(ZIEL / "robots.txt").write_text("User-agent: *\nDisallow: /\n")
(ZIEL / ".nojekyll").write_text("")
print(f"_pages/ gebaut, Unterpfad „{basis or '/'}“")
