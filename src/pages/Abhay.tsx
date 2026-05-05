import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Chess, Square } from "chess.js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import abhayImg from "@/assets/ai-abhay.png";
import ChessBoard from "@/components/ChessBoard";
import { getBestMove } from "@/lib/chessAI";
import { CHECKERS_OPPONENTS } from "@/data/checkersOpponents";
import { TTT_OPPONENTS } from "@/data/tttOpponents";
import { isAbhayUnlocked, hasBeatenAbhay, markAbhayBeaten, type GameKey } from "@/lib/beaten";
import { addCrowns } from "@/lib/crowns";
import { SFX } from "@/lib/sfx";
import { checkTTTWinner } from "@/lib/tttChaos";
import NotesWall from "@/components/abhay/NotesWall";
import { toast } from "sonner";

const CHESS_REQUIRED = ["arthur", "austen", "william", "edward", "arthur-awakened", "capybara-god"];
const REQUIRED: Record<GameKey, string[]> = {
  chess: CHESS_REQUIRED,
  checkers: CHECKERS_OPPONENTS.map((o) => o.id),
  tictactoe: TTT_OPPONENTS.map((o) => o.id),
};

const TIMER_SECONDS = 20 * 60;

// ============ TIC TAC TOE (3x3, sharp) ============
type Mark = "X" | "O" | null;
function tttBest(board: Mark[]): number {
  // perfect-ish: try win, block, center, corner, random
  for (const m of ["O", "X"] as Mark[]) {
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      const t = [...board];
      t[i] = m;
      if (checkTTTWinner(t, 3).winner === m) return i;
    }
  }
  if (!board[4]) return 4;
  const corners = [0, 2, 6, 8].filter((i) => !board[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
  return empty[Math.floor(Math.random() * empty.length)];
}

// ============ CHECKERS (8x8, simple but functional) ============
type CCell = 0 | 1 | 2 | 3 | 4;
type CBoard = CCell[][];
const isPlayerC = (v: CCell) => v === 1 || v === 3;
const isAIC = (v: CCell) => v === 2 || v === 4;
const isKingC = (v: CCell) => v === 3 || v === 4;
const ownerC = (v: CCell) => (isPlayerC(v) ? "p" : isAIC(v) ? "a" : null);
const dirsC = (v: CCell): [number, number][] => {
  if (isKingC(v)) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  if (v === 1) return [[-1, -1], [-1, 1]];
  if (v === 2) return [[1, -1], [1, 1]];
  return [];
};
function initialCheckers(): CBoard {
  const b: CBoard = Array.from({ length: 8 }, () => Array(8).fill(0) as CCell[]);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = 2;
  for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = 1;
  return b;
}
interface CMove { from: [number, number]; to: [number, number]; captures: [number, number][]; }
function jumpsC(b: CBoard, r: number, c: number, piece: CCell): CMove[] {
  const out: CMove[] = [];
  const dfs = (board: CBoard, cr: number, cc: number, cap: [number, number][]) => {
    let extended = false;
    for (const [dr, dc] of dirsC(piece)) {
      const mr = cr + dr, mc = cc + dc, lr = cr + 2 * dr, lc = cc + 2 * dc;
      if (lr < 0 || lr > 7 || lc < 0 || lc > 7) continue;
      const mid = board[mr][mc];
      if (!mid || ownerC(mid) === ownerC(piece)) continue;
      if (board[lr][lc] !== 0) continue;
      if (cap.some(([x, y]) => x === mr && y === mc)) continue;
      const nb = board.map((row) => row.slice()) as CBoard;
      nb[cr][cc] = 0; nb[mr][mc] = 0; nb[lr][lc] = piece;
      extended = true;
      dfs(nb, lr, lc, [...cap, [mr, mc]]);
    }
    if (!extended && cap.length) out.push({ from: [r, c], to: [cr, cc], captures: cap });
  };
  dfs(b, r, c, []);
  return out;
}
function simpleC(b: CBoard, r: number, c: number, piece: CCell): CMove[] {
  const out: CMove[] = [];
  for (const [dr, dc] of dirsC(piece)) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr][nc] === 0) {
      out.push({ from: [r, c], to: [nr, nc], captures: [] });
    }
  }
  return out;
}
function allMovesC(b: CBoard, side: "p" | "a"): CMove[] {
  const j: CMove[] = [], s: CMove[] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const v = b[r][c];
    if (!v || ownerC(v) !== side) continue;
    j.push(...jumpsC(b, r, c, v));
    s.push(...simpleC(b, r, c, v));
  }
  return j.length ? j : s;
}
function applyC(b: CBoard, m: CMove): CBoard {
  const nb = b.map((row) => row.slice()) as CBoard;
  const [fr, fc] = m.from, [tr, tc] = m.to;
  let p = nb[fr][fc];
  nb[fr][fc] = 0;
  for (const [cr, cc] of m.captures) nb[cr][cc] = 0;
  if (p === 1 && tr === 0) p = 3;
  if (p === 2 && tr === 7) p = 4;
  nb[tr][tc] = p;
  return nb;
}
function aiPickC(b: CBoard): CMove | null {
  const moves = allMovesC(b, "a");
  if (!moves.length) return null;
  // Prefer captures
  const best = moves.sort((a, b) => b.captures.length - a.captures.length);
  return best[0];
}

// ============ MAIN PAGE ============
const Abhay = () => {
  const [unlocked] = useState(() => isAbhayUnlocked(REQUIRED));
  const [beatenBefore, setBeatenBefore] = useState(() => hasBeatenAbhay());
  const [phase, setPhase] = useState<"intro" | "fight" | "won" | "lost">("intro");
  const [tab, setTab] = useState("chess");
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);

  // Chess
  const [chess] = useState(() => new Chess());
  const [chessTick, setChessTick] = useState(0);
  const [chessThinking, setChessThinking] = useState(false);
  const [chessWon, setChessWon] = useState<"p" | "a" | null>(null);

  // Checkers
  const [cBoard, setCBoard] = useState<CBoard>(() => initialCheckers());
  const [cTurn, setCTurn] = useState<"p" | "a">("p");
  const [cSel, setCSel] = useState<[number, number] | null>(null);
  const [cWon, setCWon] = useState<"p" | "a" | null>(null);

  // TTT
  const [tBoard, setTBoard] = useState<Mark[]>(() => Array(9).fill(null));
  const [tTurn, setTTurn] = useState<"X" | "O">("X");
  const [tWon, setTWon] = useState<"X" | "O" | "draw" | null>(null);

  const wins = (chessWon === "p" ? 1 : 0) + (cWon === "p" ? 1 : 0) + (tWon === "X" ? 1 : 0);
  const losses = (chessWon === "a" ? 1 : 0) + (cWon === "a" ? 1 : 0) + (tWon === "O" ? 1 : 0);

  // Win/lose detection — best-of-3, must win 2
  useEffect(() => {
    if (phase !== "fight") return;
    if (wins >= 2) {
      setPhase("won");
      if (!beatenBefore) {
        markAbhayBeaten();
        setBeatenBefore(true);
        addCrowns(2000);
        SFX.crown();
        SFX.win();
        toast.success("👑 +2000 crowns! You beat the boss.");
      } else {
        SFX.win();
      }
    } else if (losses >= 2 || secondsLeft <= 0) {
      setPhase("lost");
      SFX.lose();
    }
  }, [wins, losses, secondsLeft, phase, beatenBefore]);

  // Timer
  useEffect(() => {
    if (phase !== "fight") return;
    const i = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, [phase]);

  // ===== CHESS AI =====
  useEffect(() => {
    if (phase !== "fight" || chessWon || chess.turn() !== "b") return;
    setChessThinking(true);
    const t = setTimeout(() => {
      const r = getBestMove(chess, 3, 1800);
      if (r) {
        chess.move(r.move);
        setChessTick((x) => x + 1);
      }
      setChessThinking(false);
    }, 400);
    return () => clearTimeout(t);
  }, [chessTick, chess, chessWon, phase]);

  // Chess end check
  useEffect(() => {
    if (chessWon || phase !== "fight") return;
    if (chess.isCheckmate()) {
      setChessWon(chess.turn() === "w" ? "a" : "p");
    } else if (chess.isDraw() || chess.isStalemate()) {
      setChessWon("a"); // boss "wins" draw — pressure!
    }
  }, [chessTick, chess, chessWon, phase]);

  const handleChessMove = (from: Square, to: Square) => {
    if (phase !== "fight" || chessWon || chessThinking || chess.turn() !== "w") return false;
    try {
      const piece = chess.get(from);
      const isPromo = piece?.type === "p" && ((piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1"));
      const r = chess.move({ from, to, promotion: isPromo ? "q" : undefined });
      if (r) {
        SFX.move();
        setChessTick((x) => x + 1);
        return true;
      }
    } catch {}
    return false;
  };

  // ===== CHECKERS AI =====
  useEffect(() => {
    if (phase !== "fight" || cWon || cTurn !== "a") return;
    const t = setTimeout(() => {
      const m = aiPickC(cBoard);
      if (m) {
        setCBoard((b) => applyC(b, m));
        SFX.move();
      }
      setCTurn("p");
    }, 500);
    return () => clearTimeout(t);
  }, [cTurn, cBoard, cWon, phase]);

  // Checkers end check
  useEffect(() => {
    if (cWon || phase !== "fight") return;
    const p = allMovesC(cBoard, "p");
    const a = allMovesC(cBoard, "a");
    if (cTurn === "p" && p.length === 0) setCWon("a");
    else if (cTurn === "a" && a.length === 0) setCWon("p");
  }, [cBoard, cTurn, cWon, phase]);

  const cMoves = useMemo(() => (cTurn === "p" && !cWon ? allMovesC(cBoard, "p") : []), [cBoard, cTurn, cWon]);
  const cFromSel = useMemo(
    () => (cSel ? cMoves.filter((m) => m.from[0] === cSel[0] && m.from[1] === cSel[1]) : []),
    [cMoves, cSel],
  );
  const cTargets = new Set(cFromSel.map((m) => `${m.to[0]},${m.to[1]}`));
  const handleCheckersClick = (r: number, c: number) => {
    if (phase !== "fight" || cWon || cTurn !== "p") return;
    if (cSel) {
      const m = cFromSel.find((x) => x.to[0] === r && x.to[1] === c);
      if (m) {
        setCBoard((b) => applyC(b, m));
        setCSel(null);
        setCTurn("a");
        SFX.move();
        return;
      }
    }
    const v = cBoard[r][c];
    if (ownerC(v) === "p" && cMoves.some((m) => m.from[0] === r && m.from[1] === c)) {
      setCSel([r, c]);
      SFX.select();
    } else setCSel(null);
  };

  // ===== TTT =====
  useEffect(() => {
    if (phase !== "fight" || tWon || tTurn !== "O") return;
    const t = setTimeout(() => {
      const i = tttBest(tBoard);
      const next = [...tBoard];
      next[i] = "O";
      setTBoard(next);
      setTTurn("X");
      SFX.move();
    }, 400);
    return () => clearTimeout(t);
  }, [tTurn, tBoard, tWon, phase]);

  useEffect(() => {
    if (tWon || phase !== "fight") return;
    const { winner } = checkTTTWinner(tBoard, 3);
    if (winner) setTWon(winner);
    else if (tBoard.every((c) => c !== null)) setTWon("draw"); // draw = boss wins
  }, [tBoard, tWon, phase]);

  // After draw counts as boss point
  useEffect(() => {
    if (tWon === "draw") setTWon("O");
  }, [tWon]);

  const handleTTTClick = (i: number) => {
    if (phase !== "fight" || tWon || tBoard[i] || tTurn !== "X") return;
    const next = [...tBoard];
    next[i] = "X";
    setTBoard(next);
    setTTurn("O");
    SFX.select();
  };

  const startFight = () => {
    setPhase("fight");
    setSecondsLeft(TIMER_SECONDS);
  };

  // ===== RENDER =====
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6 text-center">
        <h1 className="text-4xl sm:text-6xl font-black">🔒 ???</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          The final boss is sealed. Defeat <strong>every AI</strong> (including secret bosses)
          in Chess, Checkers, AND Tic-Tac-Toe to unlock him.
        </p>
        <Link to="/"><Button variant="outline">← Back to Arcade</Button></Link>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6 text-center">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-destructive shadow-2xl animate-pulse">
          <img src={abhayImg} alt="Abhay" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-4xl sm:text-6xl font-black">ABHAY</h1>
        <p className="text-xs text-destructive font-bold uppercase tracking-widest">The Final Boss</p>
        <p className="text-sm text-muted-foreground max-w-md italic">
          "Three games. One timer. Win two of three before time runs out — or vanish."
        </p>
        <div className="bg-card border-2 border-accent rounded-xl p-4 max-w-sm text-left text-xs space-y-1">
          <p>⏱️ <strong>20:00</strong> shared timer across all three boards</p>
          <p>♟️ Chess vs ELO ~1800</p>
          <p>🔴 8x8 Checkers</p>
          <p>⭕ Tic-Tac-Toe (draw = his win)</p>
          <p>🏆 Win 2 of 3 → <strong>+2000 👑</strong> + sign the wall</p>
        </div>
        <div className="flex gap-2">
          <Button size="lg" variant="destructive" onClick={startFight}>
            🥊 Begin the Showdown
          </Button>
          <Link to="/"><Button variant="outline" size="lg">← Arcade</Button></Link>
        </div>
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-accent font-bold">📜 View the wall</summary>
          <div className="mt-3 max-w-2xl">
            <NotesWall canPost={false} />
          </div>
        </details>
      </div>
    );
  }

  if (phase === "won" || phase === "lost") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className={`text-center p-6 rounded-2xl border-2 ${phase === "won" ? "border-accent bg-accent/10" : "border-destructive bg-destructive/10"}`}>
            <div className="text-6xl mb-2">{phase === "won" ? "👑" : "💀"}</div>
            <h1 className="text-3xl font-black">{phase === "won" ? "YOU BEAT ABHAY" : "ABHAY WINS"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Score {wins} - {losses} · {Math.floor((TIMER_SECONDS - secondsLeft) / 60)}m used
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Button onClick={() => window.location.reload()}>Rematch</Button>
              <Link to="/"><Button variant="outline">← Arcade</Button></Link>
            </div>
          </div>
          <NotesWall canPost={phase === "won"} />
        </div>
      </div>
    );
  }

  // ===== FIGHT =====
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const lowTime = secondsLeft < 60;

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-5xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-destructive shrink-0">
            <img src={abhayImg} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-lg leading-tight">ABHAY · 3-in-1</h1>
            <p className="text-[10px] text-muted-foreground">Win 2 of 3 to claim the wall.</p>
          </div>
          <div className="text-right">
            <div className={`font-black text-2xl tabular-nums ${lowTime ? "text-destructive animate-pulse" : "text-accent"}`}>
              {mm}:{ss}
            </div>
            <div className="text-[10px] text-muted-foreground">Score {wins}-{losses}</div>
          </div>
        </div>

        {/* Per-game status pills */}
        <div className="flex gap-2 text-[10px] flex-wrap">
          <Pill label="♟️ Chess" state={chessWon === "p" ? "won" : chessWon === "a" ? "lost" : "live"} />
          <Pill label="🔴 Checkers" state={cWon === "p" ? "won" : cWon === "a" ? "lost" : "live"} />
          <Pill label="⭕ TTT" state={tWon === "X" ? "won" : tWon === "O" ? "lost" : "live"} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="chess">♟️ Chess</TabsTrigger>
            <TabsTrigger value="checkers">🔴 Checkers</TabsTrigger>
            <TabsTrigger value="ttt">⭕ TTT</TabsTrigger>
          </TabsList>

          <TabsContent value="chess" className="flex flex-col items-center gap-2 mt-3">
            <ChessBoard game={chess} onMove={handleChessMove} />
            {chessThinking && <p className="text-xs text-muted-foreground animate-pulse">Abhay is thinking...</p>}
            {chessWon && <p className={`font-black ${chessWon === "p" ? "text-accent" : "text-destructive"}`}>
              {chessWon === "p" ? "✅ You won this board" : "💀 He took this board"}
            </p>}
          </TabsContent>

          <TabsContent value="checkers" className="mt-3">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {cWon ? (cWon === "p" ? "✅ You won checkers" : "💀 He took checkers") : cTurn === "p" ? "Your turn" : "Abhay's turn"}
              </p>
              <div className="grid gap-0 bg-primary/20 p-2 rounded-2xl shadow-2xl"
                style={{ gridTemplateColumns: "repeat(8, 44px)" }}>
                {cBoard.map((row, r) =>
                  row.map((cell, c) => {
                    const dark = (r + c) % 2 === 1;
                    const sel = cSel && cSel[0] === r && cSel[1] === c;
                    const target = cTargets.has(`${r},${c}`);
                    return (
                      <button key={`${r}-${c}`} onClick={() => handleCheckersClick(r, c)}
                        className={`w-11 h-11 flex items-center justify-center transition-all ${
                          dark ? "bg-foreground/80" : "bg-card"
                        } ${sel ? "ring-4 ring-accent z-10" : ""} ${target ? "ring-2 ring-accent/70" : ""}`}>
                        {cell !== 0 && (
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                            isPlayerC(cell) ? "bg-red-600 border-red-300" : "bg-zinc-900 border-zinc-400"
                          } ${isKingC(cell) ? "ring-2 ring-yellow-400" : ""}`}>
                            {isKingC(cell) && <span className="text-[10px]">👑</span>}
                          </div>
                        )}
                        {target && cell === 0 && <span className="w-2 h-2 rounded-full bg-accent/70" />}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ttt" className="mt-3">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {tWon ? (tWon === "X" ? "✅ You won TTT" : "💀 He took TTT (draws count for him)") : tTurn === "X" ? "Your turn" : "Abhay's turn"}
              </p>
              <div className="grid grid-cols-3 gap-2 bg-primary/20 p-2 rounded-2xl">
                {tBoard.map((cell, i) => (
                  <button key={i} onClick={() => handleTTTClick(i)}
                    className={`w-20 h-20 rounded-xl font-black flex items-center justify-center text-4xl ${
                      cell === "X" ? "bg-accent/20 text-accent" : cell === "O" ? "bg-destructive/20 text-destructive" : "bg-card hover:bg-accent/10"
                    }`}>
                    {cell}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <Link to="/"><Button variant="ghost" size="sm" className="text-xs">← forfeit and run</Button></Link>
        </div>
      </div>
    </div>
  );
};

const Pill = ({ label, state }: { label: string; state: "live" | "won" | "lost" }) => (
  <span className={`px-2 py-1 rounded-full font-bold ${
    state === "won" ? "bg-accent/20 text-accent" :
    state === "lost" ? "bg-destructive/20 text-destructive" :
    "bg-muted text-muted-foreground"
  }`}>
    {label} {state === "won" ? "✓" : state === "lost" ? "✗" : "·"}
  </span>
);

export default Abhay;
