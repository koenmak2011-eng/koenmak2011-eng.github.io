import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { addCrowns, loadCrowns, subscribeCrowns } from "@/lib/crowns";
import { SFX } from "@/lib/sfx";
import heroImg from "@/assets/capy-dash-hero.jpg";
import AdBreak from "@/components/AdBreak";

// ====== Types & storage ======
type Skin = { id: string; name: string; color: string; cost: number; emoji: string };
const SKINS: Skin[] = [
  { id: "default", name: "Capy Cube", color: "#f59e0b", cost: 0, emoji: "🟧" },
  { id: "neon", name: "Neon Pop", color: "#22d3ee", cost: 50, emoji: "🟦" },
  { id: "lime", name: "Toxic Lime", color: "#a3e635", cost: 100, emoji: "🟩" },
  { id: "hot", name: "Hot Pink", color: "#ec4899", cost: 200, emoji: "🟪" },
  { id: "gold", name: "Gold Capy", color: "#facc15", cost: 500, emoji: "🟨" },
];

type Level = { id: string; name: string; speed: number; gap: [number, number]; bg: string; reward: number };
const LEVELS: Level[] = [
  { id: "stereo", name: "Stereo Capy", speed: 5.5, gap: [180, 260], bg: "from-fuchsia-600 to-indigo-700", reward: 30 },
  { id: "back-on-track", name: "Back on Crack", speed: 6.5, gap: [160, 240], bg: "from-amber-500 to-rose-600", reward: 60 },
  { id: "polargeist", name: "Polar Capy", speed: 7.5, gap: [140, 220], bg: "from-cyan-500 to-blue-700", reward: 100 },
  { id: "dry-out", name: "Wet Capy", speed: 8.5, gap: [130, 210], bg: "from-emerald-500 to-teal-700", reward: 160 },
  { id: "base-after-base", name: "Base Capy", speed: 9.5, gap: [120, 200], bg: "from-purple-600 to-pink-700", reward: 240 },
];

const DEATH_QUIPS = [
  "Skill issue.",
  "Spike said hello.",
  "Capy go splat.",
  "So close. Not really.",
  "Did you mean to jump?",
  "The spike won this round.",
  "Touch grass — gently this time.",
  "Even Arthur saw that coming.",
  "Abhay is laughing at you.",
];

const LS_SKIN = "capydash:skin";
const LS_OWNED = "capydash:owned";
const LS_BEST = "capydash:best";
const LS_ATTEMPTS = "capydash:attempts";

function loadOwned(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_OWNED) || '["default"]'); } catch { return ["default"]; }
}
function saveOwned(o: string[]) { localStorage.setItem(LS_OWNED, JSON.stringify(o)); }
function loadSelectedSkin(): string { return localStorage.getItem(LS_SKIN) || "default"; }
function loadBest(levelId: string): number { return Number(localStorage.getItem(`${LS_BEST}:${levelId}`) || 0); }
function saveBest(levelId: string, pct: number) {
  if (pct > loadBest(levelId)) localStorage.setItem(`${LS_BEST}:${levelId}`, String(pct));
}
function loadAttempts(levelId: string, mode: "normal" | "practice"): number {
  return Number(localStorage.getItem(`${LS_ATTEMPTS}:${mode}:${levelId}`) || 0);
}
function bumpAttempts(levelId: string, mode: "normal" | "practice"): number {
  const n = loadAttempts(levelId, mode) + 1;
  localStorage.setItem(`${LS_ATTEMPTS}:${mode}:${levelId}`, String(n));
  return n;
}

// ====== Game ======
const W = 800, H = 360;
const GROUND_Y = 300;
const CUBE = 32;
const GRAVITY = 0.9;
const JUMP_V = -14;
const RUN_FRAMES = 60 * 30; // 30 seconds = "completion"
const CHECKPOINT_EVERY = 60 * 5; // every 5s of progress

interface Obstacle { x: number; w: number; h: number; type: "spike" | "block"; }
interface Coin { x: number; y: number; taken: boolean; }

const CapyDash = () => {
  type Phase = "menu" | "shop" | "level-pick" | "play" | "end";
  const [phase, setPhase] = useState<Phase>("menu");
  const [crowns, setCrowns] = useState(loadCrowns);
  const [owned, setOwned] = useState<string[]>(loadOwned);
  const [skin, setSkin] = useState<string>(loadSelectedSkin);
  const [level, setLevel] = useState<Level>(LEVELS[0]);
  const [mode, setMode] = useState<"normal" | "practice">("normal");
  const [adOpen, setAdOpen] = useState(false);
  const [endStats, setEndStats] = useState<{ pct: number; coins: number; reward: number; completed: boolean; quip: string; attempts: number; deathX?: number } | null>(null);
  // Live HUD state
  const [hud, setHud] = useState({ attempts: 0, checkpoint: 0 });

  useEffect(() => subscribeCrowns(setCrowns), []);
  useEffect(() => { localStorage.setItem(LS_SKIN, skin); }, [skin]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    y: GROUND_Y - CUBE,
    vy: 0,
    onGround: true,
    rotation: 0,
    frame: 0,
    startFrame: 0, // for practice respawn
    obstacles: [] as Obstacle[],
    coins: [] as Coin[],
    coinsCollected: 0,
    dead: false,
    lastCheckpoint: 0, // frame index of last checkpoint reached
    flashFrames: 0,
  });

  const skinColor = SKINS.find((s) => s.id === skin)?.color ?? "#f59e0b";

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.onGround && !s.dead) {
      s.vy = JUMP_V;
      s.onGround = false;
      SFX.select();
    }
  }, []);

  // Keyboard / touch
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, jump]);

  // Game loop
  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const startAttempt = bumpAttempts(level.id, mode);
    setHud({ attempts: startAttempt, checkpoint: 0 });

    // Reset
    stateRef.current = {
      y: GROUND_Y - CUBE, vy: 0, onGround: true, rotation: 0,
      frame: 0, startFrame: 0, obstacles: [], coins: [], coinsCollected: 0,
      dead: false, lastCheckpoint: 0, flashFrames: 0,
    };

    const speed = level.speed;
    let nextSpawn = 60;

    const finish = (completed: boolean) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const s = stateRef.current;
      const pct = Math.min(100, Math.floor((s.frame / RUN_FRAMES) * 100));
      const attempts = loadAttempts(level.id, mode);
      const quip = DEATH_QUIPS[Math.floor(Math.random() * DEATH_QUIPS.length)];

      if (mode === "practice") {
        // Practice: don't save best, no rewards, no ad. Just show a brief end & let them retry from checkpoint.
        setEndStats({ pct, coins: s.coinsCollected, reward: 0, completed, quip, attempts, deathX: 100 });
        setPhase("end");
        return;
      }

      saveBest(level.id, pct);
      const coinReward = s.coinsCollected * 5;
      const completionReward = completed ? level.reward : Math.floor(level.reward * (pct / 100) * 0.3);
      const total = coinReward + completionReward;
      if (total > 0) addCrowns(total);
      setEndStats({ pct, coins: s.coinsCollected, reward: total, completed, quip, attempts });
      if (completed) SFX.win(); else SFX.lose();
      setAdOpen(true);
      setPhase("end");
    };

    const respawnFromCheckpoint = () => {
      const s = stateRef.current;
      // restart attempt from last checkpoint frame
      const cp = s.lastCheckpoint;
      const attempts = bumpAttempts(level.id, mode);
      setHud({ attempts, checkpoint: Math.floor((cp / RUN_FRAMES) * 100) });
      stateRef.current = {
        y: GROUND_Y - CUBE, vy: 0, onGround: true, rotation: 0,
        frame: cp, startFrame: cp, obstacles: [], coins: [], coinsCollected: s.coinsCollected,
        dead: false, lastCheckpoint: cp, flashFrames: 18,
      };
      nextSpawn = 30;
      rafRef.current = requestAnimationFrame(tick);
    };

    const tick = () => {
      const s = stateRef.current;
      s.frame++;

      // physics
      s.vy += GRAVITY;
      s.y += s.vy;
      if (s.y >= GROUND_Y - CUBE) {
        s.y = GROUND_Y - CUBE;
        s.vy = 0;
        s.onGround = true;
        s.rotation = 0;
      } else {
        s.rotation += 0.18;
      }

      // checkpoint tracking (practice mode only banks them)
      if (mode === "practice" && s.frame - s.lastCheckpoint >= CHECKPOINT_EVERY) {
        s.lastCheckpoint = s.frame;
        setHud((h) => ({ ...h, checkpoint: Math.floor((s.frame / RUN_FRAMES) * 100) }));
        s.flashFrames = 12;
      }

      // spawn obstacles
      nextSpawn--;
      if (nextSpawn <= 0) {
        const isSpike = Math.random() < 0.65;
        const w = isSpike ? 26 : 36;
        const h = isSpike ? 28 : 32 + Math.floor(Math.random() * 24);
        s.obstacles.push({ x: W + 20, w, h, type: isSpike ? "spike" : "block" });
        if (Math.random() < 0.55) {
          s.coins.push({ x: W + 20 + w / 2, y: GROUND_Y - CUBE - 50 - Math.random() * 40, taken: false });
        }
        const [minG, maxG] = level.gap;
        nextSpawn = Math.floor(minG + Math.random() * (maxG - minG)) / Math.max(1, speed / 5);
      }

      // move + cull
      s.obstacles.forEach((o) => (o.x -= speed));
      s.coins.forEach((c) => (c.x -= speed));
      s.obstacles = s.obstacles.filter((o) => o.x + o.w > -10);
      s.coins = s.coins.filter((c) => c.x > -20);

      // collisions
      const px = 100, py = s.y, pw = CUBE, ph = CUBE;
      let killer: Obstacle | null = null;
      for (const o of s.obstacles) {
        const oy = GROUND_Y - o.h;
        if (px < o.x + o.w && px + pw > o.x && py < oy + o.h && py + ph > oy) {
          s.dead = true;
          killer = o;
          break;
        }
      }
      for (const c of s.coins) {
        if (c.taken) continue;
        const dx = c.x - (px + pw / 2);
        const dy = c.y - (py + ph / 2);
        if (dx * dx + dy * dy < 24 * 24) {
          c.taken = true;
          s.coinsCollected++;
        }
      }

      // ===== draw =====
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0b1024";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      const off = (s.frame * speed) % 40;
      for (let x = -off; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // checkpoint flash
      if (s.flashFrames > 0) {
        ctx.fillStyle = `rgba(34,197,94,${0.18 * (s.flashFrames / 18)})`;
        ctx.fillRect(0, 0, W, H);
        s.flashFrames--;
      }

      // ground
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.strokeStyle = skinColor;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();

      // coins
      ctx.fillStyle = "#facc15";
      for (const c of s.coins) {
        if (c.taken) continue;
        ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill();
      }

      // obstacles
      for (const o of s.obstacles) {
        const oy = GROUND_Y - o.h;
        if (o.type === "spike") {
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.moveTo(o.x, GROUND_Y);
          ctx.lineTo(o.x + o.w / 2, oy);
          ctx.lineTo(o.x + o.w, GROUND_Y);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = "#64748b";
          ctx.fillRect(o.x, oy, o.w, o.h);
          ctx.strokeStyle = "#fff";
          ctx.strokeRect(o.x, oy, o.w, o.h);
        }
      }

      // cube
      ctx.save();
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(s.rotation);
      ctx.fillStyle = skinColor;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
      ctx.fillStyle = "#0b1024";
      ctx.fillRect(-4, -8, 6, 6);
      ctx.restore();

      // death burst
      if (s.dead && killer) {
        ctx.fillStyle = "rgba(239,68,68,0.35)";
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + ph / 2, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.strokeRect(killer.x - 2, GROUND_Y - killer.h - 2, killer.w + 4, killer.h + 4);
      }

      // progress bar
      const pct = Math.min(1, s.frame / RUN_FRAMES);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(20, 16, W - 40, 8);
      ctx.fillStyle = skinColor;
      ctx.fillRect(20, 16, (W - 40) * pct, 8);
      // checkpoint marker on bar
      if (mode === "practice" && s.lastCheckpoint > 0) {
        const cpx = 20 + (W - 40) * (s.lastCheckpoint / RUN_FRAMES);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(cpx - 2, 12, 4, 16);
      }
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${Math.floor(pct * 100)}%   🪙 ${s.coinsCollected}   ATT ${loadAttempts(level.id, mode)}${mode === "practice" ? "  PRACTICE" : ""}`, 20, 40);

      if (s.dead) {
        if (mode === "practice") {
          // brief pause then auto-respawn from checkpoint
          setTimeout(respawnFromCheckpoint, 450);
          return;
        }
        return finish(false);
      }
      if (s.frame >= RUN_FRAMES) return finish(true);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, level, skinColor, mode]);

  // ====== Renders ======
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6">
        <img src={heroImg} alt="Capy Dash" className="w-64 h-auto rounded-2xl border-2 border-accent shadow-2xl" />
        <h1 className="text-4xl sm:text-6xl font-black text-foreground">🟧 Capy Dash</h1>
        <p className="text-sm text-muted-foreground max-w-sm text-center">
          Tap / SPACE to jump. Don't touch the spikes. Grab coins. Survive 30 seconds to clear a level.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={() => setPhase("level-pick")} className="h-14 text-lg">▶ Play</Button>
          <Button onClick={() => setPhase("shop")} variant="secondary" className="h-12">🛒 Cube Shop</Button>
          <Link to="/"><Button variant="ghost" className="w-full">← Arcade</Button></Link>
        </div>
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-3 py-1 rounded-full">
          <span className="text-sm font-bold text-accent">👑 {crowns}</span>
        </div>
      </div>
    );
  }

  if (phase === "shop") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black">🛒 Cube Shop</h1>
            <span className="bg-accent/15 text-accent px-3 py-1 rounded-full font-bold">👑 {crowns}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SKINS.map((s) => {
              const isOwned = owned.includes(s.id);
              const isSelected = skin === s.id;
              const canBuy = !isOwned && crowns >= s.cost;
              return (
                <div key={s.id} className={`p-4 rounded-xl border-2 ${isSelected ? "border-accent bg-accent/10" : "border-border bg-card"}`}>
                  <div className="w-16 h-16 mx-auto rounded-lg" style={{ background: s.color, border: "2px solid rgba(0,0,0,0.4)" }} />
                  <div className="text-center mt-2 font-bold text-sm">{s.name}</div>
                  <div className="text-center text-xs text-muted-foreground mb-2">
                    {isOwned ? "Owned" : `${s.cost} 👑`}
                  </div>
                  {isOwned ? (
                    <Button size="sm" className="w-full" variant={isSelected ? "default" : "secondary"} onClick={() => setSkin(s.id)}>
                      {isSelected ? "Equipped" : "Equip"}
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full" disabled={!canBuy} onClick={() => {
                      addCrowns(-s.cost);
                      const next = [...owned, s.id];
                      setOwned(next); saveOwned(next); setSkin(s.id);
                    }}>
                      {canBuy ? "Buy" : "Locked"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <Button onClick={() => setPhase("menu")} variant="outline" className="w-full">← Back</Button>
        </div>
      </div>
    );
  }

  if (phase === "level-pick") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl font-black text-center">Pick a Level</h1>
          <p className="text-center text-xs text-muted-foreground">
            Choose <span className="text-accent font-bold">Normal</span> for crowns &amp; best %, or <span className="text-emerald-500 font-bold">Practice</span> for green checkpoints &amp; instant respawn.
          </p>
          {LEVELS.map((l) => {
            const best = loadBest(l.id);
            const att = loadAttempts(l.id, "normal");
            return (
              <div key={l.id} className={`rounded-xl border-2 border-border bg-gradient-to-r ${l.bg} text-white p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-black text-lg">{l.name}</div>
                    <div className="text-xs opacity-80">Speed {l.speed} · Reward {l.reward} 👑 · {att} attempts</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black">{best}%</div>
                    <div className="text-[10px] opacity-80">best</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={() => { setLevel(l); setMode("normal"); setPhase("play"); }}>
                    ▶ Normal
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setLevel(l); setMode("practice"); setPhase("play"); }}>
                    🟢 Practice
                  </Button>
                </div>
              </div>
            );
          })}
          <Button onClick={() => setPhase("menu")} variant="outline" className="w-full">← Back</Button>
        </div>
      </div>
    );
  }

  if (phase === "play") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-3">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">{level.name} · tap or SPACE to jump</span>
          <span className={`px-2 py-0.5 rounded-full font-bold ${mode === "practice" ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/40" : "bg-accent/15 text-accent border border-accent/40"}`}>
            {mode === "practice" ? "🟢 PRACTICE" : "⚡ NORMAL"}
          </span>
          <span className="bg-card border border-border px-2 py-0.5 rounded-full font-mono">ATT {hud.attempts}</span>
          {mode === "practice" && (
            <span className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
              CP {hud.checkpoint}%
            </span>
          )}
        </div>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={jump}
          className="max-w-full rounded-xl border-2 border-accent shadow-2xl touch-none"
          style={{ aspectRatio: `${W}/${H}` }}
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setPhase("level-pick"); }}>Quit</Button>
          {mode === "practice" && (
            <Button variant="secondary" size="sm" onClick={() => {
              // reset run from start
              if (rafRef.current) cancelAnimationFrame(rafRef.current);
              setPhase("level-pick");
              setTimeout(() => setPhase("play"), 30);
            }}>Restart</Button>
          )}
        </div>
      </div>
    );
  }

  // end
  const completed = endStats?.completed;
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
      <div className="text-6xl">{completed ? "🏆" : "💀"}</div>
      <h1 className="text-3xl font-black">{completed ? "Cleared!" : "Splat."}</h1>
      {!completed && (
        <p className="text-sm italic text-muted-foreground max-w-xs text-center">"{endStats?.quip}"</p>
      )}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-card border border-border rounded-lg px-4 py-2">
          <div className="text-2xl font-black">{endStats?.pct}%</div>
          <div className="text-[10px] uppercase text-muted-foreground">progress</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-2">
          <div className="text-2xl font-black">🪙 {endStats?.coins}</div>
          <div className="text-[10px] uppercase text-muted-foreground">coins</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-2">
          <div className="text-2xl font-black">{endStats?.attempts}</div>
          <div className="text-[10px] uppercase text-muted-foreground">attempts</div>
        </div>
      </div>
      {mode === "normal" && endStats?.reward ? (
        <p className="text-sm text-accent font-bold">+{endStats.reward} 👑 earned</p>
      ) : null}
      <div className="flex gap-2">
        <Button onClick={() => setPhase("play")}>Retry</Button>
        <Button variant="secondary" onClick={() => setPhase("level-pick")}>Levels</Button>
        <Button variant="outline" onClick={() => setPhase("menu")}>Menu</Button>
      </div>
      <AdBreak open={adOpen} onClose={() => setAdOpen(false)} />
    </div>
  );
};

export default CapyDash;
