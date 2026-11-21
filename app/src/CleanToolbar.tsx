import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AppState, ExcalidrawImperativeAPI, ToolType } from "@excalidraw/excalidraw/types";
import { STICKY_COLORS, addStickyNote } from "./boardStyle";

interface CleanToolbarProps {
  api: ExcalidrawImperativeAPI;
  activeTool: AppState["activeTool"]["type"];
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const icons = {
  selection: (
    <Icon>
      <path d="M5 3l14 8-6 1.5L10 19z" />
    </Icon>
  ),
  hand: (
    <Icon>
      <path d="M8 13V5.5a1.5 1.5 0 013 0V11m0-6.5a1.5 1.5 0 013 0V11m0-5a1.5 1.5 0 013 0v7a7 7 0 01-7 7h-.5a6 6 0 01-5-2.7L3.3 14a1.5 1.5 0 012.4-1.8L8 15" />
    </Icon>
  ),
  freedraw: (
    <Icon>
      <path d="M4 20l4-1L19.5 7.5a2.1 2.1 0 00-3-3L5 16z" />
      <path d="M14.5 6.5l3 3" />
    </Icon>
  ),
  text: (
    <Icon>
      <path d="M5 6V4h14v2M12 4v16M9 20h6" />
    </Icon>
  ),
  sticky: (
    <Icon>
      <path d="M5 4h14v10l-6 6H5z" />
      <path d="M13 20v-6h6" />
    </Icon>
  ),
  rectangle: (
    <Icon>
      <rect x="4" y="5" width="16" height="14" rx="2" />
    </Icon>
  ),
  ellipse: (
    <Icon>
      <circle cx="12" cy="12" r="8" />
    </Icon>
  ),
  diamond: (
    <Icon>
      <path d="M12 3l9 9-9 9-9-9z" />
    </Icon>
  ),
  arrow: (
    <Icon>
      <path d="M5 19L19 5M10 5h9v9" />
    </Icon>
  ),
  line: (
    <Icon>
      <path d="M5 19L19 5" />
    </Icon>
  ),
  eraser: (
    <Icon>
      <path d="M8 20h12M5.5 14.5l8-8a2 2 0 012.8 0l2.2 2.2a2 2 0 010 2.8L12 18H8z" />
    </Icon>
  ),
  image: (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 16l-5-5-9 8" />
    </Icon>
  ),
  laser: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </Icon>
  ),
};

const SHAPES = ["rectangle", "ellipse", "diamond"] as const;
type Shape = (typeof SHAPES)[number];
const SHAPE_LABELS: Record<Shape, string> = {
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  diamond: "Diamond",
};

/**
 * Zoom-style vertical toolbar shown in "clean" mode. It drives Excalidraw through
 * its imperative API; Excalidraw's own top toolbar is hidden with CSS in this mode.
 */
export default function CleanToolbar({ api, activeTool }: CleanToolbarProps) {
  const [flyout, setFlyout] = useState<"shapes" | "sticky" | null>(null);
  const [lastShape, setLastShape] = useState<Shape>("rectangle");
  const [stickyColor, setStickyColor] = useState<string>(STICKY_COLORS[0]);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close flyouts on outside click / Escape.
  useEffect(() => {
    if (!flyout) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setFlyout(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFlyout(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [flyout]);

  const use = (type: ToolType) => {
    api.setActiveTool({ type });
    setFlyout(null);
  };

  const tool = (type: ToolType, label: string, icon: ReactNode, shortcut?: string) => (
    <button
      key={type}
      type="button"
      className={`ct-btn${activeTool === type ? " active" : ""}`}
      title={shortcut ? `${label} — ${shortcut}` : label}
      aria-label={label}
      aria-pressed={activeTool === type}
      onClick={() => use(type)}
    >
      {icon}
    </button>
  );

  const shapeActive = (SHAPES as readonly string[]).includes(activeTool);
  const shownShape = shapeActive ? (activeTool as Shape) : lastShape;

  return (
    <div
      className="clean-toolbar"
      ref={rootRef}
      onPointerDown={(e) => e.stopPropagation()}
      // Don't let toolbar buttons take keyboard focus: Excalidraw's shortcuts (Enter to edit a
      // selected sticky, Delete, V/R/T…) listen on the document and would otherwise re-click the button.
      onMouseDown={(e) => e.preventDefault()}
    >
      {tool("selection", "Select", icons.selection, "V")}
      {tool("hand", "Pan", icons.hand, "H")}
      <div className="ct-sep" />
      {tool("freedraw", "Pen", icons.freedraw, "P")}
      {tool("text", "Text", icons.text, "T")}

      <div className="ct-group">
        <button
          type="button"
          className={`ct-btn${flyout === "sticky" ? " open" : ""}`}
          title="Sticky note"
          aria-label="Sticky note"
          onClick={() => addStickyNote(api, stickyColor)}
          onContextMenu={(e) => {
            e.preventDefault();
            setFlyout(flyout === "sticky" ? null : "sticky");
          }}
        >
          {icons.sticky}
          <span className="ct-swatch-dot" style={{ background: stickyColor }} />
        </button>
        <button
          type="button"
          className="ct-more"
          aria-label="Sticky note colour"
          title="Sticky note colour"
          onClick={() => setFlyout(flyout === "sticky" ? null : "sticky")}
        />
        {flyout === "sticky" && (
          <div className="ct-flyout ct-colors">
            {STICKY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`ct-color${c === stickyColor ? " active" : ""}`}
                style={{ background: c }}
                aria-label={`Add ${c} sticky note`}
                onClick={() => {
                  setStickyColor(c);
                  addStickyNote(api, c);
                  setFlyout(null);
                }}
              />
            ))}
            <span className="ct-hint">Select a note and press Enter to type</span>
          </div>
        )}
      </div>

      <div className="ct-group">
        <button
          type="button"
          className={`ct-btn${shapeActive ? " active" : ""}`}
          title={`${SHAPE_LABELS[shownShape]} (click ▸ for more shapes)`}
          aria-label={SHAPE_LABELS[shownShape]}
          onClick={() => use(shownShape)}
        >
          {icons[shownShape]}
        </button>
        <button
          type="button"
          className="ct-more"
          aria-label="More shapes"
          title="More shapes"
          onClick={() => setFlyout(flyout === "shapes" ? null : "shapes")}
        />
        {flyout === "shapes" && (
          <div className="ct-flyout">
            {SHAPES.map((s) => (
              <button
                key={s}
                type="button"
                className={`ct-btn${activeTool === s ? " active" : ""}`}
                title={SHAPE_LABELS[s]}
                aria-label={SHAPE_LABELS[s]}
                onClick={() => {
                  setLastShape(s);
                  use(s);
                }}
              >
                {icons[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {tool("arrow", "Connector arrow", icons.arrow, "A")}
      {tool("line", "Line", icons.line, "L")}
      <div className="ct-sep" />
      {tool("eraser", "Eraser", icons.eraser, "E")}
      {tool("image", "Insert image", icons.image)}
      {tool("laser", "Laser pointer", icons.laser, "K")}
    </div>
  );
}
