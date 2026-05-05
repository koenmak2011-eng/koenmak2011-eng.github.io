import { useState } from "react";

const PALETTE = ["transparent", "#000000", "#ffffff", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#ec4899", "#fde047"];
const SIZE = 16;

interface Props {
  value: (string | null)[];
  onChange: (next: (string | null)[]) => void;
  readOnly?: boolean;
  cellPx?: number;
}

export const emptyArt = (): (string | null)[] => Array(SIZE * SIZE).fill(null);

const PixelCanvas = ({ value, onChange, readOnly, cellPx = 18 }: Props) => {
  const [color, setColor] = useState("#000000");
  const [drawing, setDrawing] = useState(false);

  const paint = (i: number) => {
    if (readOnly) return;
    const next = value.slice();
    next[i] = color === "transparent" ? null : color;
    onChange(next);
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <div
        className="grid bg-muted/40 p-1 rounded-md select-none"
        style={{ gridTemplateColumns: `repeat(${SIZE}, ${cellPx}px)` }}
        onMouseLeave={() => setDrawing(false)}
        onMouseUp={() => setDrawing(false)}
      >
        {value.map((c, i) => (
          <div
            key={i}
            onMouseDown={() => { setDrawing(true); paint(i); }}
            onMouseEnter={() => drawing && paint(i)}
            onClick={() => paint(i)}
            className="border border-border/30"
            style={{
              width: cellPx,
              height: cellPx,
              background: c ?? "hsl(var(--background))",
              cursor: readOnly ? "default" : "crosshair",
            }}
          />
        ))}
      </div>
      {!readOnly && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {PALETTE.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setColor(p)}
              title={p === "transparent" ? "eraser" : p}
              className={`w-6 h-6 rounded border-2 ${color === p ? "border-accent ring-2 ring-accent" : "border-border"}`}
              style={{
                background: p === "transparent"
                  ? "repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 50% / 8px 8px"
                  : p,
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => onChange(emptyArt())}
            className="text-[10px] px-2 py-1 rounded bg-destructive/20 text-destructive font-bold"
          >
            clear
          </button>
        </div>
      )}
    </div>
  );
};

export default PixelCanvas;
