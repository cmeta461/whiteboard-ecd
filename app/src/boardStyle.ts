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
  },
  // Stock Excalidraw hand-drawn look.
  sketch: {
    currentItemRoughness: 1,
    currentItemFontFamily: FONT_FAMILY.Excalifont,
    currentItemStrokeWidth: 2,
    currentItemFillStyle: "hachure",
    currentItemRoundness: "round",
  },
};

export const STICKY_COLORS = ["#fff3a0", "#ffd6a5", "#ffc9de", "#c8f0d0", "#cfe3ff"] as const;

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
