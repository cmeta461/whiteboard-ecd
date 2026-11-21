import { useCallback, useEffect, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import Board from "./Board";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import {
  createDrawing,
  deleteDrawing,
  getSettings,
  listDrawings,
  renameDrawing,
  setSettings,
  type BoardStyle,
  type DrawingMeta,
  type Settings,
} from "./storage";
import { exportJSON, exportPNG, exportSVG, importFile } from "./exporters";

const idFromHash = () => /^#\/d\/([\w-]+)$/.exec(window.location.hash)?.[1] ?? null;
const goTo = (id: string) => {
  if (idFromHash() !== id) window.location.hash = `#/d/${id}`;
};

// Run startup once (React StrictMode runs effects twice in dev — avoid creating two drawings).
let startup: Promise<{ settings: Settings; drawings: DrawingMeta[]; id: string }> | null = null;
function init() {
  startup ??= (async () => {
    const settings = await getSettings();
    let drawings = await listDrawings();
    if (drawings.length === 0) {
      await createDrawing("Untitled");
      drawings = await listDrawings();
    }
    const wanted = idFromHash() ?? settings.lastOpenId;
    const id = drawings.some((d) => d.id === wanted) ? wanted! : drawings[0].id;
    return { settings, drawings, id };
  })();
  return startup;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [drawings, setDrawings] = useState<DrawingMeta[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [boardStyle, setBoardStyle] = useState<BoardStyle>("sketch");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const drawingsRef = useRef(drawings);
  drawingsRef.current = drawings;

  useEffect(() => {
    void init().then(({ settings, drawings, id }) => {
      setDrawings(drawings);
      setTheme(settings.theme);
      setBoardStyle(settings.boardStyle);
      setSidebarOpen(settings.sidebarOpen);
      setCurrentId(id);
      goTo(id);
      setReady(true);
    });
  }, []);

  // Hash routing: #/d/<id>
  useEffect(() => {
    const onHash = () => {
      const id = idFromHash();
      if (id && drawingsRef.current.some((d) => d.id === id)) setCurrentId(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (currentId) void setSettings({ lastOpenId: currentId });
  }, [currentId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Auto-dismiss sidebar errors.
  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(null), 6000);
    return () => window.clearTimeout(t);
  }, [error]);

  const select = useCallback((id: string) => {
    setCurrentId(id);
    goTo(id);
  }, []);

  const changeTheme = useCallback((next: "light" | "dark") => {
    setTheme(next);
    void setSettings({ theme: next });
  }, []);

  const changeBoardStyle = useCallback((next: BoardStyle) => {
    setBoardStyle(next);
    void setSettings({ boardStyle: next });
  }, []);

  const toggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    void setSettings({ sidebarOpen: open });
  };

  const handleCreate = async () => {
    const d = await createDrawing(`Untitled ${drawings.length + 1}`);
    setDrawings(await listDrawings());
    select(d.id);
  };

  const handleRename = async (id: string, name: string) => setDrawings(await renameDrawing(id, name));

  const handleDelete = async (id: string) => {
    let remaining = await deleteDrawing(id);
    if (remaining.length === 0) {
      await createDrawing("Untitled");
      remaining = await listDrawings();
    }
    setDrawings(remaining);
    if (id === currentId) select(remaining[0].id);
  };

  const handleImport = async (file: File) => {
    setError(null);
    try {
      const { name, data } = await importFile(file);
      const d = await createDrawing(name, data);
      setDrawings(await listDrawings());
      select(d.id);
    } catch (err) {
      console.error(err);
      setError(`Couldn't import “${file.name}” — not a valid drawing file.`);
    }
  };

  const handleExport = async (kind: "json" | "png" | "svg") => {
    const api = apiRef.current;
    const name = drawings.find((d) => d.id === currentId)?.name ?? "drawing";
    if (!api) return;
    try {
      if (kind === "json") exportJSON(api, name);
      else if (kind === "png") await exportPNG(api, name);
      else await exportSVG(api, name);
    } catch (err) {
      console.error(err);
      setError("Export failed — see console for details.");
    }
  };

  const onApi = useCallback((api: ExcalidrawImperativeAPI | null) => {
    apiRef.current = api;
  }, []);

  if (!ready || !currentId) return <div className="board-loading">Loading…</div>;
  const current = drawings.find((d) => d.id === currentId);

  return (
    <div className={`app theme-${theme} style-${boardStyle}`}>
      <TopBar name={current?.name ?? "Untitled"} boardStyle={boardStyle} onStyleChange={changeBoardStyle} />
      <div className="layout">
        {sidebarOpen ? (
          <Sidebar
            drawings={drawings}
            currentId={currentId}
            theme={theme}
            error={error}
            onSelect={select}
            onCreate={handleCreate}
            onRename={handleRename}
            onDelete={handleDelete}
            onImport={handleImport}
            onExport={handleExport}
            onToggleTheme={() => changeTheme(theme === "light" ? "dark" : "light")}
            onCollapse={() => toggleSidebar(false)}
          />
        ) : (
          <button
            type="button"
            className="sidebar-open-btn"
            title="Show drawings"
            onClick={() => toggleSidebar(true)}
          >
            »
          </button>
        )}
        <main className="canvas-wrap">
          <Board
            key={currentId}
            drawingId={currentId}
            name={current?.name ?? "Untitled"}
            theme={theme}
            boardStyle={boardStyle}
            onApi={onApi}
            onSaved={setDrawings}
            onThemeChange={changeTheme}
          />
        </main>
      </div>
    </div>
  );
}
