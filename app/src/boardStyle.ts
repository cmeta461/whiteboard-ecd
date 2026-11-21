import { FONT_FAMILY, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { AppState, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { BoardStyle } from "./storage";

type StyleDefaults = Pick<
  AppState,
  | "currentItemRoughness"
  | "currentItemFontFamily"
  | "currentItemStrokeWidth"
  | "currentItemFillStyle"
  | "currentItemRoundness"
  | "viewBackgroundColor"
>;

/**
 * Defaults for *new* elements in each style. Existing elements keep whatever
 * they were drawn with, so a drawing can be opened in either style safely.
 */
export const STYLE_DEFAULTS: Record<BoardStyle, StyleDefaults> = {
  // Clean, Zoom-like whiteboard: crisp lines, sans-serif text, solid fills, rounded corners.
  clean: {
    currentItemRoughness: 0,
    currentItemFontFamily: FONT_FAMILY.Helvetica,
    currentItemStrokeWidth: 1,
    currentItemFillStyle: "solid",
    currentItemRoundness: "round",
    // Transparent so the CSS dot-grid behind the canvas shows through.
    viewBackgroundColor: "transparent",
  },
  // Stock Excalidraw hand-drawn look.
  sketch: {
    currentItemRoughness: 1,
    currentItemFontFamily: FONT_FAMILY.Excalifont,
    currentItemStrokeWidth: 2,
    currentItemFillStyle: "hachure",
    currentItemRoundness: "round",
    viewBackgroundColor: "#ffffff",
  },
};

export const STICKY_COLORS = ["#ffd09b", "#fff3a0", "#ffc9de", "#c8f0d0", "#cfe3ff"] as const;

/** Elements currently selected on the canvas. */
export function getSelected(api: ExcalidrawImperativeAPI) {
  const ids = api.getAppState().selectedElementIds;
  return api.getSceneElements().filter((el) => ids[el.id]);
}

/** Patch every selected element (plain props only - not size-affecting text props). */
export function patchSelected(
  api: ExcalidrawImperativeAPI,
  patch: (el: ReturnType<typeof getSelected>[number]) => Record<string, unknown>,
) {
  const ids = api.getAppState().selectedElementIds;
  const next = api.getSceneElements().map((el) =>
    ids[el.id]
      ? ({
          ...el,
          ...patch(el),
          version: el.version + 1,
          versionNonce: (Math.random() * 2 ** 31) | 0,
          updated: Date.now(),
        } as typeof el)
      : el,
  );
  api.updateScene({ elements: next });
}

/** Fire a keyboard shortcut at Excalidraw (it listens on `document`). Used for undo/redo, font size. */
export function sendShortcut(key: string, opts: { shift?: boolean } = {}) {
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      code: key.length === 1 && /[a-z]/i.test(key) ? `Key${key.toUpperCase()}` : undefined,
      ctrlKey: true,
      metaKey: true,
      shiftKey: !!opts.shift,
      bubbles: true,
      cancelable: true,
    }),
  );
}

const STICKY_SIZE = 200;

/** Drop a sticky note in the middle of the visible canvas and select it. */
export function addStickyNote(api: ExcalidrawImperativeAPI, color: string = STICKY_COLORS[0]) {
  const { scrollX, scrollY, zoom, width, height } = api.getAppState();
  const cx = -scrollX + width / 2 / zoom.value;
  const cy = -scrollY + height / 2 / zoom.value;
  // Small random nudge so repeated clicks don't stack notes exactly on top of each other.
  const jitter = () => Math.round((Math.random() - 0.5) * 40);

  const [note] = convertToExcalidrawElements([
    {
      type: "rectangle",
      x: cx - STICKY_SIZE / 2 + jitter(),
      y: cy - STICKY_SIZE / 2 + jitter(),
      width: STICKY_SIZE,
      height: STICKY_SIZE,
      backgroundColor: color,
      fillStyle: "solid",
      strokeColor: "transparent",
      strokeWidth: 1,
      roughness: 0,
      roundness: { type: 3 }, // ROUNDNESS.ADAPTIVE_RADIUS
    },
  ]);

  api.setActiveTool({ type: "selection" });
  api.updateScene({
    elements: [...api.getSceneElements(), note],
    appState: { selectedElementIds: { [note.id]: true } },
  });
  return note;
}
