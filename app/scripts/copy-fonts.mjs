// Copies Excalidraw's fonts into public/fonts so the app works offline
// (see window.EXCALIDRAW_ASSET_PATH in src/main.tsx). Runs before dev/build.
import { cpSync, existsSync, rmSync } from "node:fs";

const src = "node_modules/@excalidraw/excalidraw/dist/prod/fonts";
const dest = "public/fonts";

if (!existsSync(src)) {
  console.error(`copy-fonts: ${src} not found — run npm install first`);
  process.exit(1);
}
rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log("copy-fonts: copied Excalidraw fonts to public/fonts");
