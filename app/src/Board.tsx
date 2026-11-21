import { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw, MainMenu, restoreElements } from "@excalidraw/excalidraw";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import { loadDrawing, saveDrawing, type BoardStyle, type DrawingData, type DrawingMeta } from "./storage";
import { STYLE_DEFAULTS } from "./boardStyle";
import CleanToolbar from "./CleanToolbar";

const SAVE_DEBOUNCE_MS = 500;

type ActiveToolType = AppState["activeTool"]["type"];

interface BoardProps {
  drawingId: string;
  name: string;
  theme: "light" | "dark";
  boardStyle: BoardStyle;
  onApi: (api: ExcalidrawImperativeAPI | null) => void;
  onSaved: (meta: DrawingMeta[]) => void;
  onThemeChange: (theme: "light" | "dark") => void;
}

/**
 * Wraps <Excalidraw> for one drawing. The parent renders it with key={drawingId},
 * so switching drawings unmounts this component (flushing any pending save)
 * and mounts a fresh canvas with the other drawing's data.
 */
export default function Board({
  drawingId,
  name,
  theme,
  boardStyle,
  onApi,
  onSaved,
  onThemeChange,
}: BoardProps) {
  const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null>(null);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveToolType>("selection");
  const activeToolRef = useRef<ActiveToolType>("selection");
  const pending = useRef<DrawingData | null>(null);
  const timer = useRef<number | undefined>(undefined);
  // Excalidraw fires onChange once on mount with the initial scene; skip saving that.
  const lastSceneJson = useRef<string | null>(null);

  // Keep latest callbacks in refs so the debounced/unmount logic never goes stale.
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;
  const onThemeChangeRef = useRef(onThemeChange);
  onThemeChangeRef.current = onThemeChange;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const lastReportedTheme = useRef<"light" | "dark" | null>(null);
  const boardStyleRef = useRef(boardStyle);
  boardStyleRef.current = boardStyle;

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    const data = pending.current;
    pending.current = null;
    if (!data) return;
    void saveDrawing(drawingId, data).then((meta) => {
      if (meta) onSavedRef.current(meta);
    });
  }, [drawingId]);

  // Load the drawing before mounting the canvas so initialData is ready.
  useEffect(() => {
    let cancelled = false;
    void loadDrawing(drawingId).then((data) => {
      if (cancelled) return;
      const elements = restoreElements(data?.elements ?? [], null);
      lastSceneJson.current = null;
      const hasView = data?.appState?.scrollX !== undefined;
      setInitialData({
        elements,
        // Clean mode forces its defaults; sketch mode keeps whatever the drawing last used.
        appState: {
          ...(data?.appState ?? {}),
          ...(boardStyleRef.current === "clean" ? STYLE_DEFAULTS.clean : {}),
          theme: themeRef.current,
        },
        files: data?.files ?? {},
        scrollToContent: !hasView && elements.length > 0,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [drawingId]);

  // Switching style on an open board: swap the defaults for new elements (no remount).
  const appliedStyle = useRef(boardStyle);
  useEffect(() => {
    if (!api || appliedStyle.current === boardStyle) return;
    appliedStyle.current = boardStyle;
    api.updateScene({ appState: STYLE_DEFAULTS[boardStyle] });
    if (boardStyle === "clean") api.setActiveTool({ type: "selection" });
  }, [api, boardStyle]);

  // Flush pending save when switching drawings / unmounting, and before the tab closes.
  useEffect(() => {
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [flush]);

  const handleChange = useCallback(
    (elements: readonly OrderedExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      // Propagate theme only when Excalidraw's own theme changed (user used its built-in toggle).
      // Comparing against our prop instead would ping-pong: onChange can still report the old
      // theme right after we pass a new one in.
      if (appState.activeTool.type !== activeToolRef.current) {
        activeToolRef.current = appState.activeTool.type;
        setActiveTool(appState.activeTool.type);
      }

      const prevTheme = lastReportedTheme.current;
      lastReportedTheme.current = appState.theme;
      if (prevTheme !== null && appState.theme !== prevTheme && appState.theme !== themeRef.current) {
        onThemeChangeRef.current(appState.theme);
      }

      // Only save when something persisted actually changed (cheap signature, not the full JSON).
      let sig = `${appState.scrollX}|${appState.scrollY}|${appState.zoom.value}|${appState.viewBackgroundColor}|${Object.keys(files).length}`;
      for (const el of elements) sig += `|${el.id}:${el.version}`;
      if (lastSceneJson.current === null) {
        lastSceneJson.current = sig; // initial onChange after mount
        return;
      }
      if (sig === lastSceneJson.current) return;
      lastSceneJson.current = sig;

      pending.current = { elements, appState, files };
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  const handleApi = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      setApi(api);
      onApi(api);
    },
    [onApi],
  );
  useEffect(() => () => onApi(null), [onApi]);

  if (!initialData) return <div className="board-loading">Loading…</div>;

  return (
    <div className={`board board-${boardStyle}`}>
      <Excalidraw
        initialData={initialData}
        theme={theme}
        name={name}
        excalidrawAPI={handleApi}
        onChange={handleChange}
      >
        {menu}
      </Excalidraw>
      {boardStyle === "clean" && api && <CleanToolbar api={api} activeTool={activeTool} />}
    </div>
  );
}

/** Same as the default menu, minus Excalidraw's social links. Created once (stable element). */
const menu = (
  <MainMenu>
    <MainMenu.DefaultItems.LoadScene />
    <MainMenu.DefaultItems.SaveToActiveFile />
    <MainMenu.DefaultItems.Export />
    <MainMenu.DefaultItems.SaveAsImage />
    <MainMenu.DefaultItems.SearchMenu />
    <MainMenu.DefaultItems.Help />
    <MainMenu.DefaultItems.ClearCanvas />
    <MainMenu.Separator />
    <MainMenu.DefaultItems.ToggleTheme />
    <MainMenu.DefaultItems.ChangeCanvasBackground />
  </MainMenu>
);
