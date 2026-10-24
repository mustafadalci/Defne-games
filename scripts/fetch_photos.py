"""Downloads a free-licensed photo of each player from Wikipedia/Wikimedia Commons.

Uses the infobox image of the player's English Wikipedia article (free images only),
crops it to a 400x500 card photo and records the author and licence in photos/credits.json.
Run by .github/workflows/photos.yml.
"""
import io
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

PLAYERS = {
    "haaland": "Erling Haaland",
    "messi": "Lionel Messi",
    "benzema": "Karim Benzema",
    "salah": "Mohamed Salah",
    "mbappe": "Kylian Mbappé",
    "kenan": "Kenan Yıldız",
    "arda": "Arda Güler",
    "ronaldo": "Cristiano Ronaldo",
    "nico": "Nico Williams",
    "yamal": "Lamine Yamal",
}
UA = {"User-Agent": "DefneGames/1.0 (https://github.com/mustafadalci/Defne-games; family maths game)"}
OUT = Path(__file__).resolve().parent.parent / "photos"
W, H = 400, 500


def get_json(url, params):
    with urllib.request.urlopen(urllib.request.Request(url + "?" + urllib.parse.urlencode(params), headers=UA), timeout=30) as r:
        return json.load(r)


def strip_html(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


def main():
    OUT.mkdir(exist_ok=True)
    credits = []
    for pid, title in PLAYERS.items():
        page = next(iter(get_json("https://en.wikipedia.org/w/api.php", {
            "action": "query", "format": "json", "redirects": 1, "titles": title,
            "prop": "pageimages", "piprop": "name", "pilicense": "free"})["query"]["pages"].values()))
        name = page.get("pageimage")
        if not name:
            print(f"{pid}: no free infobox image, skipped")
            continue
        info = next(iter(get_json("https://commons.wikimedia.org/w/api.php", {
            "action": "query", "format": "json", "titles": "File:" + name,
            "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 800})["query"]["pages"].values()))["imageinfo"][0]
        meta = info.get("extmetadata", {})
        with urllib.request.urlopen(urllib.request.Request(info["thumburl"], headers=UA), timeout=60) as r:
            img = Image.open(io.BytesIO(r.read())).convert("RGB")
        # Cover-crop to 4:5, keeping the top of the picture (where the face is).
        scale = max(W / img.width, H / img.height)
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
        left = (img.width - W) // 2
        top = round((img.height - H) * 0.2)
        img.crop((left, top, left + W, top + H)).save(OUT / f"{pid}.jpg", quality=82, optimize=True, progressive=True)
        credits.append({
            "id": pid,
            "player": title,
            "author": strip_html(meta.get("Artist", {}).get("value")) or "onbekend",
            "license": strip_html(meta.get("LicenseShortName", {}).get("value")),
            "source": info["descriptionurl"],
        })
        print(f"{pid}: {name}")
    (OUT / "credits.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
