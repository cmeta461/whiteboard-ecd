import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

/**
 * Shapes Excalidraw doesn't have natively. They're inserted as closed `line` elements
 * (polygons), which Excalidraw fills with the background colour when the path loops.
 */
export type ExtraShape = "parallelogram" | "triangle" | "star" | "heart" | "cloud" | "blockArrow";

type Pt = [number, number];

const S = 140;

function shapePoints(kind: ExtraShape): Pt[] {
  switch (kind) {
    case "triangle":
      return [[S / 2, 0], [S, S], [0, S], [S / 2, 0]];
    case "parallelogram": {
      const w = S * 1.3;
      const h = S * 0.7;
      return [[w * 0.22, 0], [w, 0], [w * 0.78, h], [0, h], [w * 0.22, 0]];
    }
    case "blockArrow": {
      const w = S * 1.3;
      const h = S * 0.8;
      return [
        [0, h * 0.3], [w * 0.6, h * 0.3], [w * 0.6, 0], [w, h * 0.5],
        [w * 0.6, h], [w * 0.6, h * 0.7], [0, h * 0.7], [0, h * 0.3],
      ];
    }
    case "star": {
      const pts: Pt[] = [];
      const R = S / 2;
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? R : R * 0.42;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push([R + r * Math.cos(a), R + r * Math.sin(a)]);
      }
      pts.push(pts[0]);
      return pts;
    }
    case "heart": {
      const pts: Pt[] = [];
      const k = S / 34;
      for (let i = 0; i <= 72; i++) {
        const t = (i / 72) * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3;
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        pts.push([(x + 16) * k, (y + 17) * k]);
      }
      return pts;
    }
    case "cloud": {
      const pts: Pt[] = [];
      const R = S / 2;
      for (let i = 0; i <= 90; i++) {
        const t = (i / 90) * Math.PI * 2;
        const r = R * (0.78 + 0.22 * Math.abs(Math.sin(2.5 * t)));
        pts.push([R * 1.3 + r * 1.3 * Math.cos(t), R + r * 0.8 * Math.sin(t)]);
      }
      return pts;
    }
  }
}

/** Drop an extra shape in the middle of the visible canvas and select it. */
export function insertExtraShape(api: ExcalidrawImperativeAPI, kind: ExtraShape) {
  const raw = shapePoints(kind);
  const minX = Math.min(...raw.map((p) => p[0]));
  const minY = Math.min(...raw.map((p) => p[1]));
  const points = raw.map(([x, y]) => [x - minX, y - minY] as Pt);
  const width = Math.max(...points.map((p) => p[0]));
  const height = Math.max(...points.map((p) => p[1]));

  const { scrollX, scrollY, zoom, width: vw, height: vh } = api.getAppState();
  const cx = -scrollX + vw / 2 / zoom.value;
  const cy = -scrollY + vh / 2 / zoom.value;

  const [el] = convertToExcalidrawElements([
    {
      type: "line",
      x: cx - width / 2,
      y: cy - height / 2,
      width,
      height,
      points,
      strokeColor: "#1e1e1e",
      backgroundColor: "#dbe8ff",
      fillStyle: "solid",
      strokeWidth: 1,
      roughness: 0,
      roundness: null,
    },
  ]);
  api.setActiveTool({ type: "selection" });
  api.updateScene({
    elements: [...api.getSceneElements(), el],
    appState: { selectedElementIds: { [el.id]: true } },
  });
}

/** Small SVG path (24x24 viewBox) used for the shape flyout icons. */
export const EXTRA_SHAPE_ICONS: Record<ExtraShape, string> = {
  parallelogram: "M7 6h13l-3 12H4z",
  triangle: "M12 4l9 16H3z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  heart: "M12 20s-8-5-8-11a4.5 4.5 0 018-2.7A4.5 4.5 0 0120 9c0 6-8 11-8 11z",
  cloud: "M7 18a4 4 0 01-.5-8A5.5 5.5 0 0117 8.5a4 4 0 010 9.5z",
  blockArrow: "M4 9h9V5l7 7-7 7v-4H4z",
};
