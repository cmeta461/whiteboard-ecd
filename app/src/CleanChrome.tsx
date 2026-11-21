import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { BoardStyle } from "./storage";
import { sendShortcut } from "./boardStyle";

interface CleanChromeProps {
  api: ExcalidrawImperativeAPI | null;
  name: string;
  theme: "light" | "dark";
  sidebarOpen: boolean;
  onRename: (name: string) => void;
  onStyleChange: (style: BoardStyle) => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onExport: (kind: "json" | "png" | "svg") => void;
}

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

/** Closes `open` menus when clicking elsewhere / pressing Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close();
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open, close]);
  return ref;
}

/**
 * Zoom-Whiteboard-style floating chrome for "clean" mode: name/menu pill (top-left),
 * export pill (top-right), undo/redo pill (bottom-left), zoom pill (bottom-right).
 */
export default function CleanChrome({
  api,
  name,
  theme,
  sidebarOpen,
  onRename,
  onStyleChange,
  onToggleSidebar,
  onToggleTheme,
  onExport,
}: CleanChromeProps) {
  const [menu, setMenu] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);
  const [zoom, setZoomValue] = useState(1);
  const [draft, setDraft] = useState(name);
  const menuRef = useDismiss(menu, () => setMenu(false));
  const exportRef = useDismiss(exportMenu, () => setExportMenu(false));

  useEffect(() => setDraft(name), [name]);

  // Track zoom for the % readout.
  useEffect(() => {
    if (!api) return;
    setZoomValue(api.getAppState().zoom.value);
    return api.onChange((_els, appState) => setZoomValue(appState.zoom.value));
  }, [api]);

  const setZoom = (factor: number | "reset") => {
    if (!api) return;
    const s = api.getAppState();
    const old = s.zoom.value;
    const next = Math.min(30, Math.max(0.1, factor === "reset" ? 1 : old * factor));
    const cx = s.width / 2;
    const cy = s.height / 2;
    api.updateScene({
      appState: {
        zoom: { value: next as typeof s.zoom.value },
        scrollX: s.scrollX + cx / next - cx / old,
        scrollY: s.scrollY + cy / next - cy / old,
      },
    });
  };

  const commitName = () => {
    const next = draft.trim();
    if (next && next !== name) onRename(next);
    else setDraft(name);
  };

  return (
    <>
      <div className="cc-pill cc-topleft" ref={menuRef}>
        <input
          className="cc-name"
          value={draft}
          aria-label="Board name"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setDraft(name);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <span className="cc-icon" title="Saved on this device">
          <Svg>
            <path d="M7 18a4 4 0 01-.4-8A5.5 5.5 0 0117 8.5a4 4 0 01.5 9.5z" />
            <path d="M9.5 13l2 2 3.5-3.5" />
          </Svg>
        </span>
        <button type="button" className="cc-btn" title="Menu" aria-label="Menu" onClick={() => setMenu(!menu)}>
          <Svg>
            <path d="M5 7h14M5 12h14M5 17h14" />
          </Svg>
        </button>
        {menu && (
          <div className="cc-menu cc-menu-left">
            <button type="button" onClick={() => (onToggleSidebar(), setMenu(false))}>
              {sidebarOpen ? "Hide drawings" : "Show drawings"}
            </button>
            <button type="button" onClick={() => (onToggleTheme(), setMenu(false))}>
              {theme === "light" ? "Dark theme" : "Light theme"}
            </button>
          </div>
        )}
      </div>

      <div className="cc-pill cc-topcenter">
        <div className="segmented" role="radiogroup" aria-label="Whiteboard style">
          <button type="button" role="radio" aria-checked={false} title="Excalidraw hand-drawn style" onClick={() => onStyleChange("sketch")}>
            Excalidraw
          </button>
          <button type="button" role="radio" aria-checked className="active" title="Zoom-style whiteboard">
            Zoom
          </button>
        </div>
      </div>

      <div className="cc-pill cc-topright" ref={exportRef}>
        <button type="button" className="cc-share" onClick={() => setExportMenu(!exportMenu)}>
          Export
        </button>
        {exportMenu && (
          <div className="cc-menu cc-menu-right">
            <button type="button" onClick={() => (onExport("png"), setExportMenu(false))}>
              PNG image
            </button>
            <button type="button" onClick={() => (onExport("svg"), setExportMenu(false))}>
              SVG image
            </button>
            <button type="button" onClick={() => (onExport("json"), setExportMenu(false))}>
              Drawing file (.excalidraw)
            </button>
          </div>
        )}
      </div>

      <div className="cc-pill cc-bottomleft" onMouseDown={(e) => e.preventDefault()}>
        <button type="button" className="cc-btn" title="Undo" aria-label="Undo" onClick={() => sendShortcut("z")}>
          <Svg>
            <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" />
          </Svg>
        </button>
        <button type="button" className="cc-btn" title="Redo" aria-label="Redo" onClick={() => sendShortcut("z", { shift: true })}>
          <Svg>
            <path d="M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3" />
          </Svg>
        </button>
      </div>

      <div className="cc-pill cc-bottomright" onMouseDown={(e) => e.preventDefault()}>
        <button type="button" className="cc-btn" title="Zoom out" aria-label="Zoom out" onClick={() => setZoom(1 / 1.25)}>
          <Svg>
            <path d="M6 12h12" />
          </Svg>
        </button>
        <button type="button" className="cc-zoom" title="Reset to 100%" onClick={() => setZoom("reset")}>
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" className="cc-btn" title="Zoom in" aria-label="Zoom in" onClick={() => setZoom(1.25)}>
          <Svg>
            <path d="M12 6v12M6 12h12" />
          </Svg>
        </button>
        <span className="cc-sep" />
        <button
          type="button"
          className="cc-btn"
          title="Fit to content"
          aria-label="Fit to content"
          onClick={() => api?.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.85, animate: true })}
        >
          <Svg>
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </Svg>
        </button>
      </div>
    </>
  );
}
