import { useRef, useState } from "react";
import ConfirmPopover from "./ConfirmPopover";
import type { DrawingMeta } from "./storage";

interface SidebarProps {
  drawings: DrawingMeta[];
  currentId: string | null;
  theme: "light" | "dark";
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onImport: (file: File) => void;
  onExport: (kind: "json" | "png" | "svg") => void;
  onToggleTheme: () => void;
  onCollapse: () => void;
  error: string | null;
}

function relativeTime(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function Sidebar(props: SidebarProps) {
  const { drawings, currentId, theme } = props;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const startRename = (d: DrawingMeta) => {
    setEditingId(d.id);
    setDraftName(d.name);
  };
  const commitRename = () => {
    if (editingId && draftName.trim()) props.onRename(editingId, draftName.trim());
    setEditingId(null);
  };

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div className="brand">
          <img src="/favicon.svg" alt="" width={22} height={22} />
          <span>Sketchboard</span>
        </div>
        <button type="button" className="icon-btn" title="Hide sidebar" onClick={props.onCollapse}>
          «
        </button>
      </header>

      <div className="sidebar-actions">
        <button type="button" className="btn btn-primary" onClick={props.onCreate}>
          + New drawing
        </button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          Import
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".excalidraw,.json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) props.onImport(file);
            e.target.value = "";
          }}
        />
      </div>
      {props.error && <div className="sidebar-error">{props.error}</div>}

      <ul className="drawing-list">
        {drawings.map((d) => (
          <li
            key={d.id}
            className={`drawing-item${d.id === currentId ? " active" : ""}`}
            onClick={() => editingId !== d.id && props.onSelect(d.id)}
          >
            {editingId === d.id ? (
              <input
                className="rename-input"
                value={draftName}
                autoFocus
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="drawing-text" onDoubleClick={() => startRename(d)}>
                <span className="drawing-name">{d.name}</span>
                <span className="drawing-time">{relativeTime(d.updatedAt)}</span>
              </div>
            )}
            <div className="drawing-tools" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="icon-btn" title="Rename" onClick={() => startRename(d)}>
                ✎
              </button>
              <button type="button" className="icon-btn" title="Delete" onClick={() => setConfirmId(d.id)}>
                🗑
              </button>
            </div>
            {confirmId === d.id && (
              <div onClick={(e) => e.stopPropagation()}>
                <ConfirmPopover
                  message={`Delete “${d.name}”? This can't be undone.`}
                  onCancel={() => setConfirmId(null)}
                  onConfirm={() => {
                    setConfirmId(null);
                    props.onDelete(d.id);
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      <footer className="sidebar-footer">
        <div className="export-row">
          <span>Export</span>
          <button type="button" className="btn btn-sm" onClick={() => props.onExport("json")}>
            .excalidraw
          </button>
          <button type="button" className="btn btn-sm" onClick={() => props.onExport("png")}>
            PNG
          </button>
          <button type="button" className="btn btn-sm" onClick={() => props.onExport("svg")}>
            SVG
          </button>
        </div>
        <button type="button" className="btn btn-block" onClick={props.onToggleTheme}>
          {theme === "light" ? "☾ Dark mode" : "☀ Light mode"}
        </button>
        <p className="credit">
          Canvas powered by{" "}
          <a href="https://github.com/excalidraw/excalidraw" target="_blank" rel="noreferrer">
            Excalidraw
          </a>{" "}
          (MIT)
        </p>
      </footer>
    </aside>
  );
}
