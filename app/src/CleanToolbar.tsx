import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AppState, ExcalidrawImperativeAPI, ToolType } from "@excalidraw/excalidraw/types";
import { STICKY_COLORS, addStickyNote } from "./boardStyle";
import { EXTRA_SHAPE_ICONS, insertExtraShape, type ExtraShape } from "./shapes";
import ColorPopover from "./ColorPopover";

interface CleanToolbarProps {
  api: ExcalidrawImperativeAPI;
  activeTool: AppState["activeTool"]["type"];
}

const Icon = ({ children, size = 20 }: { children: ReactNode; size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const icons = {
  plus: (
    <Icon size={22}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  ),
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
  text: (
    <Icon>
      <path d="M5 6V4h14v2M12 4v16M9 20h6" />
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
  connector: (
    <Icon>
      <path d="M5 19v-4a4 4 0 014-4h6a4 4 0 004-4V5M16 3l4 2-2 4" />
    </Icon>
  ),
  shapes: (
    <Icon>
      <rect x="3.5" y="3.5" width="11" height="11" rx="2" />
      <circle cx="15.5" cy="15.5" r="5" />
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
  more: (
    <Icon>
      <circle cx="5.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.2" fill="currentColor" />
    </Icon>
  ),
  // Illustrated (coloured) icons for the drawing tools, like the Zoom toolbar.
  sticky: (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
      <rect x="5" y="9" width="19" height="19" rx="2" fill="#bff0c3" transform="rotate(8 14 18)" />
      <rect x="6" y="6" width="19" height="19" rx="2" fill="#fff59a" transform="rotate(-6 15 15)" />
      <path d="M6 6h19v19H6z" fill="#fff9b8" opacity="0" />
    </svg>
  ),
  pen: (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
      <path d="M3 14.5h13l6 1.5-6 1.5H3z" fill="#e4e4e8" />
      <path d="M16 14.5l9 1.5-9 1.5z" fill="#9a9aa4" />
      <rect x="3" y="13.5" width="3" height="5" rx="1" fill="#222" />
      <rect x="26" y="15" width="4" height="2" rx="1" fill="#222" />
    </svg>
  ),
  highlighter: (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
      <path d="M4 11l10-2 6 3 0 8-6 3-10-2z" fill="#f3ee2a" />
      <path d="M20 12l8 1v6l-8 1z" fill="#c9c51d" />
      <path d="M8 10l1 12" stroke="#d9d422" strokeWidth="1.5" />
    </svg>
  ),
  eraser: (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
      <rect x="4" y="11" width="18" height="10" rx="2" fill="#e9b774" />
      <rect x="18" y="11" width="10" height="10" rx="2" fill="#e5483f" />
      <path d="M8 12v8M12 12v8" stroke="#c99650" strokeWidth="1" />
    </svg>
  ),
};

const BASIC_SHAPES = ["rectangle", "diamond", "ellipse"] as const;
type BasicShape = (typeof BASIC_SHAPES)[number];
const EXTRA_SHAPES: ExtraShape[] = ["parallelogram", "triangle", "star", "heart", "cloud"];

type Flyout = "shapes" | "sticky" | "pen" | "more" | "insert" | null;
type PenMode = "pen" | "highlighter";

const PEN_DEFAULTS: Record<PenMode, { color: string; weight: number; opacity: number }> = {
  pen: { color: "#000000", weight: 2, opacity: 100 },
  highlighter: { color: "#fff200", weight: 10, opacity: 50 },
};

/**
 * Zoom-style left toolbar for "clean" mode: a blue + button above a floating pill of tools.
 * It drives Excalidraw through its imperative API; Excalidraw's own toolbar is hidden by CSS.
 */
export default function CleanToolbar({ api, activeTool }: CleanToolbarProps) {
  const [flyout, setFlyout] = useState<Flyout>(null);
  const [lastShape, setLastShape] = useState<BasicShape>("rectangle");
  const [stickyColor, setStickyColor] = useState<string>(STICKY_COLORS[0]);
  const [penMode, setPenMode] = useState<PenMode>("pen");
  const [pens, setPens] = useState(PEN_DEFAULTS);
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

  const applyPen = (mode: PenMode, p = pens[mode]) => {
    api.setActiveTool({ type: "freedraw" });
    api.updateScene({
      appState: {
        currentItemStrokeColor: p.color,
        currentItemStrokeWidth: p.weight,
        currentItemOpacity: p.opacity,
      },
    });
  };

  const clickPen = (mode: PenMode) => {
    const again = activeTool === "freedraw" && penMode === mode;
    setPenMode(mode);
    applyPen(mode);
    setFlyout(again && flyout !== "pen" ? "pen" : null);
  };

  const patchPen = (patch: Partial<(typeof PEN_DEFAULTS)["pen"]>) => {
    const next = { ...pens[penMode], ...patch };
    setPens({ ...pens, [penMode]: next });
    applyPen(penMode, next);
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

  const art = (label: string, icon: ReactNode, active: boolean, onClick: () => void, shortcut?: string) => (
    <button
      type="button"
      className={`ct-btn ct-art${active ? " active" : ""}`}
      title={shortcut ? `${label} — ${shortcut}` : label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
    </button>
  );

  const basicActive = (BASIC_SHAPES as readonly string[]).includes(activeTool);
  const shownShape = basicActive ? (activeTool as BasicShape) : lastShape;
  const penActive = activeTool === "freedraw";

  return (
    <div
      className="clean-toolbar-wrap"
      ref={rootRef}
      onPointerDown={(e) => e.stopPropagation()}
      // Don't let toolbar buttons take keyboard focus: Excalidraw's shortcuts (Enter, Delete, V/R/T…)
      // listen on the document and would otherwise re-click the focused button.
      onMouseDown={(e) => {
        if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
      }}
    >
      <div className="ct-group">
        <button
          type="button"
          className="ct-plus"
          title="Insert"
          aria-label="Insert"
          onClick={() => setFlyout(flyout === "insert" ? null : "insert")}
        >
          {icons.plus}
        </button>
        {flyout === "insert" && (
          <div className="ct-flyout ct-menu">
            <button type="button" onClick={() => (addStickyNote(api, stickyColor), setFlyout(null))}>
              Sticky note
            </button>
            <button type="button" onClick={() => use("rectangle")}>
              Rectangle
            </button>
            <button type="button" onClick={() => use("ellipse")}>
              Ellipse
            </button>
            <button type="button" onClick={() => use("text")}>
              Text
            </button>
            <button type="button" onClick={() => use("image")}>
              Image
            </button>
          </div>
        )}
      </div>

      <div className="clean-toolbar">
        {tool("selection", "Select", icons.selection, "V")}
        {tool("hand", "Pan", icons.hand, "H")}
        <div className="ct-sep" />

        <div className="ct-group">
          {art("Sticky note", icons.sticky, false, () => addStickyNote(api, stickyColor))}
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
              <span className="ct-hint">Double-click a note to type</span>
            </div>
          )}
        </div>

        <div className="ct-group">
          {art("Pen", icons.pen, penActive && penMode === "pen", () => clickPen("pen"), "P")}
          {flyout === "pen" && penMode === "pen" && (
            <ColorPopover
              className="ct-flyout-pop"
              color={pens.pen.color}
              weight={pens.pen.weight}
              onColor={(color) => patchPen({ color })}
              onWeight={(weight) => patchPen({ weight })}
            />
          )}
        </div>

        <div className="ct-group">
          {art("Highlighter", icons.highlighter, penActive && penMode === "highlighter", () => clickPen("highlighter"))}
          {flyout === "pen" && penMode === "highlighter" && (
            <ColorPopover
              className="ct-flyout-pop"
              color={pens.highlighter.color}
              weight={pens.highlighter.weight}
              onColor={(color) => patchPen({ color })}
              onWeight={(weight) => patchPen({ weight })}
            />
          )}
        </div>

        {art("Eraser", icons.eraser, activeTool === "eraser", () => use("eraser"), "E")}
        <div className="ct-sep" />

        <div className="ct-group">
          <button
            type="button"
            className={`ct-btn${basicActive || flyout === "shapes" ? " active" : ""}`}
            title="Shapes"
            aria-label="Shapes"
            onClick={() => setFlyout(flyout === "shapes" ? null : "shapes")}
          >
            {icons.shapes}
          </button>
          {flyout === "shapes" && (
            <div className="ct-flyout-pop shapes-pop">
              <div className="shape-grid">
                {BASIC_SHAPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`ct-btn${shownShape === s && basicActive ? " active" : ""}`}
                    title={s}
                    aria-label={s}
                    onClick={() => {
                      setLastShape(s);
                      use(s);
                    }}
                  >
                    {icons[s]}
                  </button>
                ))}
                {EXTRA_SHAPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="ct-btn"
                    title={s}
                    aria-label={s}
                    onClick={() => {
                      insertExtraShape(api, s);
                      setFlyout(null);
                    }}
                  >
                    <Icon>
                      <path d={EXTRA_SHAPE_ICONS[s]} />
                    </Icon>
                  </button>
                ))}
                {tool("line", "Line", icons.line, "L")}
                {tool("arrow", "Arrow", icons.arrow, "A")}
                <button
                  type="button"
                  className="ct-btn"
                  title="Block arrow"
                  aria-label="Block arrow"
                  onClick={() => {
                    insertExtraShape(api, "blockArrow");
                    setFlyout(null);
                  }}
                >
                  <Icon>
                    <path d={EXTRA_SHAPE_ICONS.blockArrow} />
                  </Icon>
                </button>
              </div>
            </div>
          )}
        </div>

        {tool("arrow", "Connector", icons.connector, "A")}
        {tool("text", "Text", icons.text, "T")}

        <div className="ct-group">
          <button
            type="button"
            className={`ct-btn${flyout === "more" ? " open" : ""}`}
            title="More"
            aria-label="More tools"
            onClick={() => setFlyout(flyout === "more" ? null : "more")}
          >
            {icons.more}
          </button>
          {flyout === "more" && (
            <div className="ct-flyout ct-menu">
              <button type="button" onClick={() => use("image")}>
                Insert image
              </button>
              <button type="button" onClick={() => use("laser")}>
                Laser pointer
              </button>
              <button type="button" onClick={() => use("frame")}>
                Frame
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
