import { useEffect, useRef } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const STEP = 24; // scene units between dots

/** Dotted canvas background that pans and zooms with the scene (sits behind a transparent canvas). */
export default function DotGrid({ api }: { api: ExcalidrawImperativeAPI | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (scrollX: number, scrollY: number, zoom: number) => {
      const el = ref.current;
      if (!el) return;
      const size = STEP * zoom;
      el.style.backgroundSize = `${size}px ${size}px`;
      el.style.backgroundPosition = `${scrollX * zoom}px ${scrollY * zoom}px`;
    };
    if (!api) {
      apply(0, 0, 1);
      return;
    }
    const s = api.getAppState();
    apply(s.scrollX, s.scrollY, s.zoom.value);
    return api.onChange((_e, a) => apply(a.scrollX, a.scrollY, a.zoom.value));
  }, [api]);

  return <div className="dot-grid" ref={ref} aria-hidden="true" />;
}
