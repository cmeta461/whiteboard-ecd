import {
  exportToBlob,
  exportToSvg,
  loadFromBlob,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { pickAppState, type DrawingData } from "./storage";

function safeName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]+/g, "_") || "drawing";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function currentScene(api: ExcalidrawImperativeAPI) {
  const appState = api.getAppState();
  return {
    elements: api.getSceneElements(),
    // Clean mode uses a transparent canvas; exports need a real background.
    appState:
      appState.viewBackgroundColor === "transparent"
        ? { ...appState, viewBackgroundColor: "#ffffff" }
        : appState,
    files: api.getFiles(),
  };
}

export function exportJSON(api: ExcalidrawImperativeAPI, name: string) {
  const { elements, appState, files } = currentScene(api);
  const json = serializeAsJSON(elements, appState, files, "local");
  downloadBlob(new Blob([json], { type: "application/json" }), `${safeName(name)}.excalidraw`);
}

export async function exportPNG(api: ExcalidrawImperativeAPI, name: string) {
  const { elements, appState, files } = currentScene(api);
  if (elements.length === 0) return;
  const blob = await exportToBlob({
    elements,
    appState: { ...appState, exportBackground: true },
    files,
    mimeType: "image/png",
  });
  downloadBlob(blob, `${safeName(name)}.png`);
}

export async function exportSVG(api: ExcalidrawImperativeAPI, name: string) {
  const { elements, appState, files } = currentScene(api);
  if (elements.length === 0) return;
  const svg = await exportToSvg({
    elements,
    appState: { ...appState, exportBackground: true },
    files,
  });
  const text = new XMLSerializer().serializeToString(svg);
  downloadBlob(new Blob([text], { type: "image/svg+xml" }), `${safeName(name)}.svg`);
}

/** Parse an .excalidraw / .json file into storable drawing data. Throws on invalid files. */
export async function importFile(file: File): Promise<{ name: string; data: DrawingData }> {
  const scene = await loadFromBlob(file, null, null);
  return {
    name: file.name.replace(/\.(excalidraw|json)$/i, "") || "Imported",
    data: {
      elements: scene.elements,
      appState: pickAppState(scene.appState),
      files: scene.files,
    },
  };
}
