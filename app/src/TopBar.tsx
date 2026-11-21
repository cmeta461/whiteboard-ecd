import type { BoardStyle } from "./storage";

interface TopBarProps {
  name: string;
  boardStyle: BoardStyle;
  onStyleChange: (style: BoardStyle) => void;
}

const OPTIONS: { value: BoardStyle; label: string; hint: string }[] = [
  { value: "sketch", label: "Sketch", hint: "Excalidraw-style hand-drawn whiteboard" },
  { value: "clean", label: "Clean (Zoom-style)", hint: "Crisp shapes, left toolbar and sticky notes" },
];

export default function TopBar({ name, boardStyle, onStyleChange }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-name" title={name}>
        {name}
      </div>
      <div className="segmented" role="radiogroup" aria-label="Whiteboard style">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={boardStyle === o.value}
            className={boardStyle === o.value ? "active" : ""}
            title={o.hint}
            onClick={() => onStyleChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="topbar-spacer" />
    </header>
  );
}
