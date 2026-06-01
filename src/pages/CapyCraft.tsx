import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Element = { id: string; name: string; emoji: string; discovered?: boolean };
type Board = { uid: string; el: Element; x: number; y: number };

const STARTERS: Element[] = [
  { id: "water", name: "Water", emoji: "💧" },
  { id: "fire", name: "Fire", emoji: "🔥" },
  { id: "earth", name: "Earth", emoji: "🌍" },
  { id: "wind", name: "Wind", emoji: "🌬️" },
  { id: "capybara", name: "Capybara", emoji: "🦫" },
];

const STORAGE_KEY = "capycraft:v1";
const keyOf = (a: Element, b: Element) => [a.id, b.id].sort().join("+");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export default function CapyCraft() {
  const initial = loadState();
  const [elements, setElements] = useState<Element[]>(initial?.elements ?? STARTERS);
  const [recipes, setRecipes] = useState<Record<string, Element>>(initial?.recipes ?? {});
  const [board, setBoard] = useState<Board[]>([]);
  const [dragging, setDragging] = useState<{ uid?: string; el: Element; ox: number; oy: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [lastDiscovery, setLastDiscovery] = useState<Element | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const uidRef = useRef(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ elements, recipes }));
  }, [elements, recipes]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      setPos({ x: e.clientX - dragging.ox, y: e.clientY - dragging.oy });
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      const rect = boardRef.current?.getBoundingClientRect();
      if (rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        dropOnBoard(dragging, x, y);
      } else if (dragging.uid) {
        // dragged off board → remove
        setBoard((b) => b.filter((i) => i.uid !== dragging.uid));
      }
      setDragging(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, board]);

  function dropOnBoard(drag: NonNullable<typeof dragging>, x: number, y: number) {
    // Find any board item we overlap with
    const target = board.find((it) => it.uid !== drag.uid && Math.hypot(it.x - x, it.y - y) < 55);
    if (target) {
      combine(drag, target, x, y);
      return;
    }
    if (drag.uid) {
      setBoard((b) => b.map((i) => (i.uid === drag.uid ? { ...i, x, y } : i)));
    } else {
      uidRef.current++;
      setBoard((b) => [...b, { uid: `u${uidRef.current}`, el: drag.el, x, y }]);
    }
  }

  async function combine(drag: NonNullable<typeof dragging>, target: Board, x: number, y: number) {
    const a = drag.el, b = target.el;
    const k = keyOf(a, b);
    const cached = recipes[k];

    const placeholderUid = `u${++uidRef.current}`;
    setBoard((bd) => {
      const without = bd.filter((i) => i.uid !== target.uid && i.uid !== drag.uid);
      return [...without, { uid: placeholderUid, el: { id: "__pending", name: "...", emoji: "✨" }, x, y }];
    });

    let result: Element;
    if (cached) {
      result = cached;
    } else {
      setBusy(true);
      try {
        const { data, error } = await supabase.functions.invoke("capy-craft", { body: { a, b } });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        const name = (data as any).name as string;
        const emoji = (data as any).emoji as string;
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `r${Date.now()}`;
        result = { id, name, emoji };
      } catch (e: any) {
        toast({ title: "Combine failed", description: e.message ?? "Try again", variant: "destructive" });
        setBoard((bd) => bd.filter((i) => i.uid !== placeholderUid));
        setBusy(false);
        return;
      }
      setBusy(false);
    }

    // Update recipes + discoveries
    setRecipes((r) => ({ ...r, [k]: result }));
    setElements((els) => {
      if (els.some((e) => e.id === result.id)) return els;
      setLastDiscovery({ ...result, discovered: true });
      setTimeout(() => setLastDiscovery(null), 2400);
      return [...els, { ...result, discovered: true }];
    });
    setBoard((bd) => bd.map((i) => (i.uid === placeholderUid ? { ...i, el: result } : i)));
  }

  function startDragFromSidebar(e: React.PointerEvent, el: Element) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragging({ el, ox: rect.width / 2, oy: rect.height / 2 });
    setPos({ x: e.clientX - rect.width / 2, y: e.clientY - rect.height / 2 });
  }
  function startDragFromBoard(e: React.PointerEvent, item: Board) {
    e.stopPropagation();
    setDragging({ uid: item.uid, el: item.el, ox: 40, oy: 24 });
    setPos({ x: e.clientX - 40, y: e.clientY - 24 });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? elements.filter((e) => e.name.toLowerCase().includes(q)) : elements;
    return [...list].sort((a, b) => Number(!!b.discovered) - Number(!!a.discovered));
  }, [elements, search]);

  function reset() {
    if (!confirm("Wipe all discoveries?")) return;
    setElements(STARTERS);
    setRecipes({});
    setBoard([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const discoveredCount = elements.filter((e) => !STARTERS.find((s) => s.id === e.id)).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-accent">← Arcade</Link>
          <h1 className="text-lg sm:text-2xl font-black">🧪 Infinite Capy Craft</h1>
        </div>
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="font-bold text-accent">{discoveredCount} discovered</span>
          <button onClick={reset} className="text-muted-foreground hover:text-destructive font-bold">Reset</button>
        </div>
      </header>

      <div className="flex-1 flex flex-col-reverse sm:flex-row min-h-0">
        {/* Board */}
        <div
          ref={boardRef}
          className="relative flex-1 bg-gradient-to-br from-background via-card to-background overflow-hidden touch-none select-none"
        >
          {board.length === 0 && (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground text-center px-6">
              <div>
                <p className="text-4xl mb-2">✨</p>
                <p className="font-bold text-sm sm:text-base">Drag elements from the sidebar.</p>
                <p className="text-xs">Drop one on top of another to combine.</p>
              </div>
            </div>
          )}
          {board.map((it) => (
            <button
              key={it.uid}
              onPointerDown={(e) => startDragFromBoard(e, it)}
              style={{ left: it.x, top: it.y, transform: "translate(-50%,-50%)" }}
              className={`absolute px-3 py-2 rounded-xl border-2 bg-card shadow-md flex items-center gap-2 font-bold text-sm hover:scale-105 transition ${
                it.el.id === "__pending" ? "border-accent animate-pulse" : "border-border hover:border-accent"
              }`}
            >
              <span className="text-xl">{it.el.emoji}</span>
              <span>{it.el.name}</span>
            </button>
          ))}
          {lastDiscovery && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-2 rounded-full font-black shadow-lg animate-bounce">
              🎉 New: {lastDiscovery.emoji} {lastDiscovery.name}
            </div>
          )}
          {busy && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              brewing…
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-border bg-card/60 backdrop-blur flex flex-col max-h-[45vh] sm:max-h-none">
          <div className="p-3 border-b border-border">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search elements…"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-wrap gap-2 content-start">
            {filtered.map((el) => (
              <div
                key={el.id}
                onPointerDown={(e) => startDragFromSidebar(e, el)}
                className={`px-3 py-2 rounded-xl border-2 bg-background flex items-center gap-2 font-bold text-sm cursor-grab active:cursor-grabbing hover:scale-105 transition ${
                  el.discovered ? "border-accent/60" : "border-border"
                }`}
              >
                <span className="text-lg">{el.emoji}</span>
                <span>{el.name}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground">No matches.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Floating drag preview */}
      {dragging && (
        <div
          style={{ left: pos.x, top: pos.y }}
          className="fixed pointer-events-none z-50 px-3 py-2 rounded-xl border-2 border-accent bg-card shadow-2xl flex items-center gap-2 font-bold text-sm scale-110"
        >
          <span className="text-xl">{dragging.el.emoji}</span>
          <span>{dragging.el.name}</span>
        </div>
      )}
    </div>
  );
}
