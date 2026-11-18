# Sketchboard

A whiteboard website for hand-drawn style diagrams. It embeds the open-source
[Excalidraw](https://github.com/excalidraw/excalidraw) canvas (MIT) and adds a drawings list,
autosave, import/export and a light/dark theme. **No account, API key or backend is needed**, and
once it is installed it runs fully offline.

## Features

- Rectangles, ellipses, diamonds, arrows, lines, freehand, text and images
- Multiple drawings in a sidebar: create, rename, delete, switch (each has its own link, `#/d/<id>`)
- Autosave: drawings are stored in your browser and are still there after a reload
- Import `.excalidraw` / `.json` files; export `.excalidraw`, PNG and SVG
- Light and dark mode

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer (includes `npm`)
- A modern browser (Chrome, Edge, Firefox, Safari)
- Internet **only for the one-time install** (step 2 below)

## Run it

```bash
git clone https://github.com/cmeta461/whiteboard-ecd.git
cd whiteboard-ecd/app
npm install        # one-time, needs internet
npm run dev
```

Open the address printed in the terminal (normally http://localhost:5173).

## Run it offline

After the one-time `npm install`, **no internet connection is needed**. The handwriting fonts are
copied from the installed package into `app/public/fonts` automatically each time you start the
app, so nothing is fetched from a CDN.

Either of these works with the network turned off:

| Mode | Commands | Address |
| --- | --- | --- |
| Development | `npm run dev` | http://localhost:5173 |
| Production build | `npm run build` then `npm run preview` | http://localhost:4173 |

Run these from the `app/` folder. The addresses are the Vite defaults; if a port is busy, Vite
prints the one it actually used.

To keep a copy that does not need Node at all, run `npm run build` once and serve the `app/dist`
folder with any static file server. Opening `dist/index.html` by double-clicking will **not**
work, because browsers block module scripts on `file://` pages.

## Where your drawings are stored

Drawings live in your browser's IndexedDB, **separately for each address** (host and port). That
means:

- Opening the app on a different port (for example 5174 instead of 5173) shows an empty list.
  Your drawings are still under the original address.
- Clearing site data or using a private window removes them.

Use **Export → .excalidraw** in the sidebar to back up a drawing, and **Import** to restore it.

## Troubleshooting

- **`npm run dev` says `copy-fonts: ... not found`**: run `npm install` first, while online.
- **Text appears in a plain font**: check that `app/public/fonts` exists (it is created by the
  `copy-fonts` step when you run `npm run dev` or `npm run build`), then reload the page.
- **Blank white page**: open the browser console (F12) and check for errors, then make sure you
  are using the address from the terminal rather than a file path.

## Project layout

```
app/
  src/App.tsx          startup, routing, sidebar actions
  src/Board.tsx        wraps the Excalidraw canvas and debounced autosave
  src/Sidebar.tsx      drawings list, import/export, theme toggle
  src/storage.ts       IndexedDB storage for drawings and settings
  src/exporters.ts     .excalidraw / PNG / SVG export and file import
  scripts/copy-fonts.mjs   copies Excalidraw fonts into public/fonts (runs before dev/build)
```

## Credits

The canvas is [Excalidraw](https://github.com/excalidraw/excalidraw), used under the MIT license.
Sketchboard is an independent project and is not affiliated with Excalidraw.

Sketchboard's own code is MIT licensed ([LICENSE](LICENSE)). Licenses and copyright notices for
the libraries it uses are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

If you fork or publish this project:

- Don't commit `app/dist` or `app/public/fonts`. They are build output and are gitignored.
- Don't use the Excalidraw name or logo as your own branding, or imply your copy is the official
  Excalidraw.
- Keep `THIRD_PARTY_NOTICES.md` with any build you distribute.
