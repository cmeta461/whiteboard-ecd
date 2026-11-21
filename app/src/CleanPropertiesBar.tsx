import { useEffect, useState, type ReactNode } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import ColorPopover from "./ColorPopover";
import { getSelected, patchSelected, sendShortcut } from "./boardStyle";

interface Props {
  api: ExcalidrawImperativeAPI;
}

interface View {
  left: number;
  top: number;
  hasText: boolean;
  hasShape: boolean;
  fill: string;
  stroke: string;
  width: number;
  fontSize: number;
  align: string;
}

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const BAR_HEIGHT = 48;

/** Floating, Zoom-style contextual bar above the current selection. */
export default function CleanPropertiesBar({ api }: Props) {
  const [view, setView] = useState<View | null>(null);
  const [popover, setPopover] = useState<"fill" | "stroke" | null>(null);

  useEffect(() => {
    const compute = () => {
      const s = api.getAppState();
      const selected = getSelected(api).filter((e) => !e.isDeleted);
      // Hide while dragging/drawing so the bar doesn't chase the pointer.
      if (selected.length === 0 || s.newElement || s.selectedElementsAreBeingDragged || s.resizingElement) {
        setView(null);
        return;
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const el of selected) {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
      }
      const z = s.zoom.value;
      const sx = (minX + s.scrollX) * z;
      const sy = (minY + s.scrollY) * z;
      const ex = (maxX + s.scrollX) * z;
      const ey = (maxY + s.scrollY) * z;
      const first = selected[0];
      const text = selected.find((e) => e.type === "text") as { fontSize: number; textAlign: string } | undefined;
      const above = sy - BAR_HEIGHT - 14;
      setView({
        left: Math.max(70, Math.min((sx + ex) / 2, s.width - 160)),
        top: above > 70 ? above : Math.min(ey + 14, s.height - 120),
        hasText: !!text,
        hasShape: selected.some((e) => e.type !== "text"),
        fill: first.backgroundColor,
        stroke: first.strokeColor,
        width: first.strokeWidth,
        fontSize: text?.fontSize ?? 20,
        align: text?.textAlign ?? "left",
      });
    };
    compute();
    return api.onChange(compute);
  }, [api]);

  useEffect(() => {
    if (!view) setPopover(null);
  }, [view]);

  if (!view) return null;

  const isTransparent = view.fill === "transparent";
  const setStroke = (c: string) => patchSelected(api, () => ({ strokeColor: c }));
  const setFill = (c: string) => patchSelected(api, (el) => (el.type === "text" ? {} : { backgroundColor: c, fillStyle: "solid" }));

  return (
    <div
      className="props-bar"
      style={{ left: view.left, top: view.top }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
      }}
    >
      {view.hasShape && (
        <div className="pb-group">
          <button
            type="button"
            className="pb-btn"
            title="Fill colour"
            aria-label="Fill colour"
            onClick={() => setPopover(popover === "fill" ? null : "fill")}
          >
            <span className={`pb-chip${isTransparent ? " empty" : ""}`} style={{ background: isTransparent ? undefined : view.fill }} />
          </button>
          {popover === "fill" && (
            <div className="pb-pop">
              <ColorPopover color={view.fill} onColor={setFill} />
              <button type="button" className="pb-nofill" onClick={() => setFill("transparent")}>
                No fill
              </button>
            </div>
          )}
        </div>
      )}

      <div className="pb-group">
        <button
          type="button"
          className="pb-btn"
          title={view.hasText ? "Text colour" : "Outline colour"}
          aria-label="Stroke colour"
          onClick={() => setPopover(popover === "stroke" ? null : "stroke")}
        >
          {view.hasText && !view.hasShape ? (
            <span className="pb-a" style={{ borderBottomColor: view.stroke }}>
              A
            </span>
          ) : (
            <span className="pb-chip ring" style={{ borderColor: view.stroke }} />
          )}
        </button>
        {popover === "stroke" && (
          <div className="pb-pop">
            <ColorPopover
              color={view.stroke}
              onColor={setStroke}
              weight={view.hasShape ? view.width : undefined}
              onWeight={view.hasShape ? (w) => patchSelected(api, () => ({ strokeWidth: w })) : undefined}
            />
          </div>
        )}
      </div>

      {view.hasText && (
        <>
          <span className="pb-sep" />
          <button type="button" className="pb-btn" title="Smaller text" aria-label="Smaller text" onClick={() => sendShortcut("<", { shift: true })}>
            <Svg>
              <path d="M6 12h12" />
            </Svg>
          </button>
          <span className="pb-size">{Math.round(view.fontSize)}</span>
          <button type="button" className="pb-btn" title="Larger text" aria-label="Larger text" onClick={() => sendShortcut(">", { shift: true })}>
            <Svg>
              <path d="M12 6v12M6 12h12" />
            </Svg>
          </button>
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              className={`pb-btn${view.align === a ? " active" : ""}`}
              title={`Align ${a}`}
              aria-label={`Align ${a}`}
              onClick={() => patchSelected(api, (el) => (el.type === "text" ? { textAlign: a } : {}))}
            >
              <Svg>
                {a === "left" && <path d="M4 7h16M4 12h10M4 17h14" />}
                {a === "center" && <path d="M4 7h16M7 12h10M5 17h14" />}
                {a === "right" && <path d="M4 7h16M10 12h10M6 17h14" />}
              </Svg>
            </button>
          ))}
        </>
      )}

      <span className="pb-sep" />
      <button
        type="button"
        className="pb-btn"
        title="Duplicate"
        aria-label="Duplicate"
        onClick={() => {
          // Ctrl+D is Excalidraw's duplicate shortcut.
          sendShortcut("d");
        }}
      >
        <Svg>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
        </Svg>
      </button>
      <button
        type="button"
        className="pb-btn"
        title="Delete"
        aria-label="Delete"
        onClick={() => {
          patchSelected(api, () => ({ isDeleted: true }));
          api.updateScene({ appState: { selectedElementIds: {} } });
        }}
      >
        <Svg>
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
        </Svg>
      </button>
    </div>
  );
}
