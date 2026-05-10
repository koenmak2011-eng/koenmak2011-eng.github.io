// Tiny game runtime that interprets community-submitted game specs.
// Five templates: clicker, reaction, quiz, memory, dodge. Kid-simple, but flexible.
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type GameSpec = {
  template: "clicker" | "reaction" | "quiz" | "memory" | "dodge";
  title: string;
  description?: string;
  theme?: { bg?: string; fg?: string; accent?: string; emoji?: string };
  config: any;
};

export default function GameRunner({ spec, onWin }: { spec: GameSpec; onWin?: (score: number) => void }) {
  const theme = spec.theme || {};
  const style = {
    background: theme.bg || "hsl(var(--card))",
    color: theme.fg || "hsl(var(--foreground))",
  } as React.CSSProperties;
  return (
    <div className="rounded-2xl border-2 border-border p-4 sm:p-6" style={style}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">{theme.emoji || "🎮"}</span>
        <div>
          <h2 className="text-xl font-black">{spec.title}</h2>
          {spec.description && <p className="text-xs opacity-80">{spec.description}</p>}
        </div>
      </div>
      {spec.template === "clicker" && <Clicker spec={spec} onWin={onWin} />}
      {spec.template === "reaction" && <Reaction spec={spec} onWin={onWin} />}
      {spec.template === "quiz" && <Quiz spec={spec} onWin={onWin} />}
      {spec.template === "memory" && <Memory spec={spec} onWin={onWin} />}
      {spec.template === "dodge" && <Dodge spec={spec} onWin={onWin} />}
    </div>
  );
}

// ---------- CLICKER ----------
function Clicker({ spec, onWin }: { spec: GameSpec; onWin?: (n: number) => void }) {
  const c = spec.config || {};
  const target = c.target || "🦫";
  const decoys: string[] = c.decoyEmojis?.length ? c.decoyEmojis : ["🐻", "🦝", "🦔", "🐹"];
  const goal = Math.max(1, c.goal ?? 15);
  const dur = Math.max(5, Math.min(60, c.duration ?? 20));
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(dur);
  const [items, setItems] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);
  const [done, setDone] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setTime((s) => Math.max(0, s - 1)), 1000);
    const sp = setInterval(() => {
      idRef.current++;
      const isTarget = Math.random() < 0.55;
      setItems((prev) => [
        ...prev.slice(-12),
        {
          id: idRef.current,
          emoji: isTarget ? target : decoys[Math.floor(Math.random() * decoys.length)],
          x: Math.random() * 80 + 5,
          y: Math.random() * 70 + 10,
        },
      ]);
    }, 700);
    return () => { clearInterval(t); clearInterval(sp); };
  }, [done, target, decoys]);

  useEffect(() => {
    if (time === 0 || score >= goal) {
      setDone(true);
      if (score >= goal) onWin?.(score);
    }
  }, [time, score, goal, onWin]);

  return (
    <div>
      <div className="flex justify-between text-sm font-bold mb-2">
        <span>⏱ {time}s</span><span>🎯 {score}/{goal}</span>
      </div>
      <div className="relative h-72 rounded-xl border border-border/50 bg-background/30 overflow-hidden">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => {
              if (done) return;
              if (it.emoji === target) setScore((s) => s + 1);
              else setScore((s) => Math.max(0, s - 1));
              setItems((p) => p.filter((x) => x.id !== it.id));
            }}
            className="absolute text-3xl hover:scale-125 transition-transform"
            style={{ left: `${it.x}%`, top: `${it.y}%` }}
          >{it.emoji}</button>
        ))}
        {done && (
          <div className="absolute inset-0 grid place-items-center bg-background/80 text-center">
            <div>
              <p className="text-2xl font-black">{score >= goal ? "🏆 Win!" : "💀 Time's up"}</p>
              <p className="text-sm">Score: {score}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- REACTION ----------
function Reaction({ spec, onWin }: { spec: GameSpec; onWin?: (n: number) => void }) {
  const c = spec.config || {};
  const rounds = Math.max(1, Math.min(10, c.rounds ?? 5));
  const minD = Math.max(300, c.minDelay ?? 800);
  const maxD = Math.max(minD + 200, c.maxDelay ?? 2500);
  const [phase, setPhase] = useState<"wait" | "go" | "tooSoon">("wait");
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const startRef = useRef(0);
  const timer = useRef<number | null>(null);

  function arm() {
    setPhase("wait");
    const d = minD + Math.random() * (maxD - minD);
    timer.current = window.setTimeout(() => { startRef.current = performance.now(); setPhase("go"); }, d);
  }
  useEffect(() => { if (round < rounds) arm(); return () => { if (timer.current) clearTimeout(timer.current); }; }, [round]);

  const done = round >= rounds;
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  useEffect(() => { if (done) onWin?.(avg ? Math.max(0, 1000 - avg) : 0); }, [done]);

  return (
    <div>
      <div className="text-sm font-bold mb-2">Round {Math.min(round + 1, rounds)} / {rounds}</div>
      <button
        disabled={done}
        onClick={() => {
          if (done) return;
          if (phase === "wait") { if (timer.current) clearTimeout(timer.current); setPhase("tooSoon"); setTimeout(() => setRound((r) => r + 1), 800); }
          else if (phase === "go") { const t = performance.now() - startRef.current; setTimes((p) => [...p, t]); setRound((r) => r + 1); }
        }}
        className={`w-full h-56 rounded-xl text-xl font-black transition-colors ${
          done ? "bg-muted" : phase === "go" ? "bg-emerald-500 text-black" : phase === "tooSoon" ? "bg-destructive text-destructive-foreground" : "bg-amber-500/80 text-black"
        }`}
      >
        {done ? `🏆 Avg ${avg}ms` : phase === "go" ? "TAP NOW!" : phase === "tooSoon" ? "Too soon! 😬" : "Wait for green…"}
      </button>
      {!!times.length && <p className="text-xs mt-2 opacity-80">Last: {Math.round(times.at(-1)!)}ms</p>}
    </div>
  );
}

// ---------- QUIZ ----------
function Quiz({ spec, onWin }: { spec: GameSpec; onWin?: (n: number) => void }) {
  const qs: { q: string; choices: string[]; answer: number }[] = spec.config?.questions || [];
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const done = i >= qs.length;
  useEffect(() => { if (done) onWin?.(score); }, [done]);
  if (!qs.length) return <p className="text-sm">No questions provided.</p>;
  if (done) return <p className="text-2xl font-black text-center py-8">🏆 {score} / {qs.length}</p>;
  const q = qs[i];
  return (
    <div>
      <p className="text-sm font-bold mb-3">Q{i + 1}. {q.q}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {q.choices.map((c, idx) => (
          <Button key={idx} variant="outline" onClick={() => { if (idx === q.answer) setScore((s) => s + 1); setI((p) => p + 1); }}>
            {c}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ---------- MEMORY ----------
function Memory({ spec, onWin }: { spec: GameSpec; onWin?: (n: number) => void }) {
  const pairs = Math.max(2, Math.min(12, spec.config?.pairs ?? 6));
  const pool: string[] = spec.config?.emojis?.length ? spec.config.emojis : ["🦫","🐻","🦝","🦔","🐹","🦊","🐼","🐯","🦁","🐸","🐵","🐔"];
  const cards = useMemo(() => {
    const picks = pool.slice(0, pairs);
    const arr = [...picks, ...picks].map((e, i) => ({ id: i, emoji: e })).sort(() => Math.random() - 0.5);
    return arr;
  }, [pairs, pool.join("")]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const done = matched.size === pairs;
  useEffect(() => { if (done) onWin?.(Math.max(0, 200 - moves * 5)); }, [done]);

  function flip(id: number) {
    if (open.includes(id) || matched.has(cards[id].emoji)) return;
    const next = [...open, id];
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (cards[a].emoji === cards[b].emoji) {
        setMatched((s) => new Set(s).add(cards[a].emoji));
        setOpen([]);
      } else {
        setOpen(next);
        setTimeout(() => setOpen([]), 700);
      }
    } else setOpen(next);
  }

  return (
    <div>
      <div className="text-sm font-bold mb-2">Moves: {moves} {done && "· 🏆"}</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cards.length))}, minmax(0,1fr))` }}>
        {cards.map((c, i) => {
          const show = open.includes(i) || matched.has(c.emoji);
          return (
            <button key={i} onClick={() => flip(i)} className={`aspect-square rounded-lg text-3xl border-2 transition ${show ? "bg-accent/30 border-accent" : "bg-background/40 border-border"}`}>
              {show ? c.emoji : "❓"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- DODGE ----------
function Dodge({ spec, onWin }: { spec: GameSpec; onWin?: (n: number) => void }) {
  const c = spec.config || {};
  const dur = Math.max(10, Math.min(120, c.duration ?? 30));
  const spawn = Math.max(250, Math.min(1500, c.spawnRate ?? 700));
  const player = c.playerEmoji || "🦫";
  const hazard = c.hazardEmoji || "🌵";
  const coin = c.coinEmoji || "🪙";
  const [pos, setPos] = useState(50);
  const [time, setTime] = useState(dur);
  const [coins, setCoins] = useState(0);
  const [hits, setHits] = useState(0);
  const [items, setItems] = useState<{ id: number; x: number; y: number; kind: "h" | "c" }[]>([]);
  const idRef = useRef(0);
  const done = time === 0 || hits >= 3;

  useEffect(() => {
    if (done) { if (hits < 3) onWin?.(coins * 10); return; }
    const t = setInterval(() => setTime((s) => Math.max(0, s - 1)), 1000);
    const sp = setInterval(() => {
      idRef.current++;
      setItems((p) => [...p, { id: idRef.current, x: Math.random() * 90 + 5, y: 0, kind: Math.random() < 0.7 ? "h" : "c" }]);
    }, spawn);
    const mv = setInterval(() => {
      setItems((p) => p
        .map((it) => ({ ...it, y: it.y + 4 }))
        .filter((it) => {
          if (it.y > 95) return false;
          if (it.y > 80 && Math.abs(it.x - pos) < 8) {
            if (it.kind === "h") setHits((h) => h + 1); else setCoins((cc) => cc + 1);
            return false;
          }
          return true;
        }));
    }, 60);
    return () => { clearInterval(t); clearInterval(sp); clearInterval(mv); };
  }, [done, spawn, pos]);

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 6));
      if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 6));
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  return (
    <div>
      <div className="flex justify-between text-sm font-bold mb-2">
        <span>⏱ {time}s</span><span>{coin} {coins}</span><span>❤️ {3 - hits}</span>
      </div>
      <div
        className="relative h-72 rounded-xl border border-border/50 bg-background/30 overflow-hidden touch-none select-none"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos(((e.clientX - r.left) / r.width) * 100);
        }}
      >
        {items.map((it) => (
          <div key={it.id} className="absolute text-2xl" style={{ left: `${it.x}%`, top: `${it.y}%` }}>
            {it.kind === "h" ? hazard : coin}
          </div>
        ))}
        <div className="absolute text-3xl" style={{ left: `${pos}%`, bottom: 6, transform: "translateX(-50%)" }}>{player}</div>
        {done && (
          <div className="absolute inset-0 grid place-items-center bg-background/80 text-center">
            <div>
              <p className="text-2xl font-black">{hits < 3 ? "🏆 Survived!" : "💥 KO"}</p>
              <p className="text-sm">Coins: {coins}</p>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs mt-2 opacity-70">Move with arrow keys or drag/tap inside the box.</p>
    </div>
  );
}
