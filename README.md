# Spelletjes van Defne

Rekenspelletjes in eenvoudig Nederlands (groep 3/4): **Pizzeria Defne** en **Klas van Defne**.

- `index.html` – startpagina met beide spellen
- `pizza.html`, `klas.html` – de spellen
- `sommen.js` – gedeelde sommen (tot 20 / 30 / 50) en het antwoordtoetsenbord
- `sw.js`, `pwa.js`, `manifest.webmanifest` – offline spelen en installeren als app

## Online zetten (GitHub Pages)

Settings → Pages → *Deploy from a branch* → `master` / `(root)` → Save.

## Offline spelen

Open de site één keer met internet. Daarna werkt alles zonder internet.
Op iPad/iPhone: Safari → Deel → *Zet op beginscherm*. Op Android: Chrome → ⋮ → *App installeren*.

Na een wijziging aan de bestanden: verhoog `VERSION` in `sw.js`.
