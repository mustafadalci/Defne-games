# Spelletjes van Defne

Rekenspelletjes in eenvoudig Nederlands (groep 3/4): **Pizzeria Defne**, **Klas van Defne**, **Voetbalkaarten** en **Defne ve Nisan'ın Şehri** (een stad om in rond te lopen met Misem de stokstaart).

- `index.html` – startpagina met alle spellen
- `pizza.html`, `klas.html`, `voetbal.html`, `stad.html`, `stad3d.html` – de spellen
- `stad-kern.js`, `stad.css` – wat de 2D- en 3D-stad delen (kamers, kleding, Misem, lopen)
- `vendor/three.module.min.js` – Three.js r160 (MIT, zie `vendor/three-LICENSE`) voor de 3D-stad
- `sommen.js` – gedeelde sommen (tot 20 / 30 / 50) en het antwoordtoetsenbord
- `sw.js`, `pwa.js`, `manifest.webmanifest` – offline spelen en installeren als app

## Online zetten (GitHub Pages)

Settings → Pages → *Deploy from a branch* → `master` / `(root)` → Save.

## Offline spelen

Open de site één keer met internet. Daarna werkt alles zonder internet.
Op iPad/iPhone: Safari → Deel → *Zet op beginscherm*. Op Android: Chrome → ⋮ → *App installeren*.

Na een wijziging aan de bestanden: verhoog `VERSION` in `sw.js`.

## Foto's van de voetballers

Zet een foto per speler in `photos/` (liefst staand, gezicht bovenin, ca. 400×500 px):
`haaland.jpg`, `messi.jpg`, `benzema.jpg`, `salah.jpg`, `mbappe.jpg`, `kenan.jpg`, `arda.jpg`, `vandijk.jpg`, `bellingham.jpg`, `vinicius.jpg`, `kane.jpg`, `neymar.jpg` enz. (zie `PLAYERS` in `voetbal.html`),
`ronaldo.jpg`, `nico.jpg`, `yamal.jpg`. Zonder foto toont de kaart een shirt.
Deze site is openbaar: gebruik foto's met een vrije licentie (bijv. Wikimedia Commons) en vermeld de makers.
