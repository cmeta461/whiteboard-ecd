/** Standard palette, 4 columns x 6 rows (matches the Zoom-style colour picker). */
export const PALETTE = [
  "#ffffff", "#ececec", "#d4d4d4", "#919191",
  "#555555", "#000000", "#0b72c7", "#00b050",
  "#ffff00", "#ff8c00", "#ff0000", "#7030a0",
  "#00b0f0", "#92d050", "#e6ff3d", "#ffc000",
  "#ff33aa", "#ee00ee", "#b3e5ff", "#ccffa3",
  "#f2ffbf", "#ffe0a3", "#ffb3e0", "#f5b3ff",
] as const;

interface ColorPopoverProps {
  color: string;
  onColor: (c: string) => void;
  weight?: number;
  onWeight?: (w: number) => void;
  className?: string;
}

export default function ColorPopover({ color, onColor, weight, onWeight, className }: ColorPopoverProps) {
  return (
    <div
      className={`color-popover ${className ?? ""}`}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        // Keep focus where it is (e.g. in a text box being edited), except for the colour/range inputs.
        if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
      }}
    >
      <div className="cp-title">Standard colors</div>
      <div className="cp-grid">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            className={`cp-swatch${c.toLowerCase() === color.toLowerCase() ? " active" : ""}`}
            style={{ background: c }}
            aria-label={`Colour ${c}`}
            onClick={() => onColor(c)}
          />
        ))}
      </div>
      <div className="cp-title">Custom colors</div>
      <label className="cp-custom" title="Pick a custom colour">
        <span>+</span>
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#000000"} onChange={(e) => onColor(e.target.value)} />
      </label>
      {onWeight && weight !== undefined && (
        <>
          <div className="cp-title">Weight</div>
          <input
            className="cp-range"
            type="range"
            min={1}
            max={16}
            step={1}
            value={weight}
            onChange={(e) => onWeight(Number(e.target.value))}
          />
        </>
      )}
    </div>
  );
}
