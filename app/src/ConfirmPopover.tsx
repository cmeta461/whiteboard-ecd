import { useEffect, useRef } from "react";

interface ConfirmPopoverProps {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small inline confirm (used instead of window.confirm). */
export default function ConfirmPopover({ message, confirmLabel = "Delete", onConfirm, onCancel }: ConfirmPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [onCancel]);

  return (
    <div className="confirm" ref={ref} role="alertdialog">
      <p>{message}</p>
      <div className="confirm-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} autoFocus>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
