import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SFX } from "@/lib/sfx";
import { addCrowns, loadCrowns, subscribeCrowns } from "@/lib/crowns";
import { CHECKERS_OPPONENTS, type CheckersOpponent } from "@/data/checkersOpponents";
import GenericAIPicker from "@/components/GenericAIPicker";
import AiSongPlayer from "@/components/AiSongPlayer";
import TopHat from "@/components/TopHat";
import { addBeaten, loadBeaten, subscribeBeaten } from "@/lib/beaten";
import { rollCheckersChaos, type CheckersChaosResult } from "@/lib/checkersChaos";

type Cell = 0 | 1 | 2 | 3 | 4;
type Board = Cell[][];

type Mode = "menu" | "ai-pick" | "ai" | "local";

const isPlayer = (v: Cell) => v === 1 || v === 3;
const isAI = (v: Cell) => v === 2 || v === 4;
const isKing = (v: Cell) => v === 3 || v === 4;
const ownerOf = (v: Cell): "p" | "a" | null =>
  v === 1 || v === 3 ? "p" : v === 2 || v === 4 ? "a" : null;

interface Move {
  from: [number, number];
  to: [number, number];
  captures: [number, number][];
  path: [number, number][];
}

function pieceDirs(v: Cell): [number, number][] {
  if (isKing(v)) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  if (v === 1) return [[-1, -1], [-1, 1]];
  if (v === 2) return [[1, -1], [1, 1]];
  return [];
}

function initialBoard(size: number): Board {
  const b: Board = Array.from({ length: size }, () => Array(size).fill(0) as Cell[]);
  const rows = size === 8 ? 3 : size >= 10 ? 4 : 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < size; c++) if ((r + c) % 2 === 1) b[r][c] = 2;
  }
  for (let r = size - rows; r < size; r++) {
    for (let c = 0; c < size; c++) if ((r + c) % 2 === 1) b[r][c] = 1;
  }
  return b;
}

const inBoundsBuilder = (size: number) => (r: number, c: number) =>
  r >= 0 && r < size && c >= 0 && c < size;

function getJumpsFrom(
  b: Board,
  size: number,
  r: number,
  c: number,
  piece: Cell,
  giants: Record<string, true>,
): Move[] {
  const inBounds = inBoundsBuilder(size);
  const results: Move[] = [];
  const isBlocked = (r0: number, c0: number) => {
    // a giant blocks (r,c)..(r+1,c+1) — treat all 4 squares as occupied
    for (const key of Object.keys(giants)) {
      const [gr, gc] = key.split(",").map(Number);
      if (r0 >= gr && r0 <= gr + 1 && c0 >= gc && c0 <= gc + 1) {
        // Only block if it's not the piece originating from here
        if (!(r === gr && c === gc)) return true;
      }
    }
    return false;
  };
  const dfs = (
    board: Board,
    cr: number,
    cc: number,
    captured: [number, number][],
    path: [number, number][],
  ) => {
    let extended = false;
    for (const [dr, dc] of pieceDirs(piece)) {
      const mr = cr + dr;
      const mc = cc + dc;
      const lr = cr + 2 * dr;
      const lc = cc + 2 * dc;
      if (!inBounds(lr, lc)) continue;
      const mid = board[mr]?.[mc];
      if (mid === undefined || mid === 0) continue;
      if (ownerOf(mid) === ownerOf(piece)) continue;
      if (board[lr][lc] !== 0) continue;
      if (isBlocked(lr, lc)) continue;
      if (captured.some(([x, y]) => x === mr && y === mc)) continue;
      const nb = board.map((row) => row.slice()) as Board;
      nb[cr][cc] = 0;
      nb[mr][mc] = 0;
      nb[lr][lc] = piece;
      extended = true;
      dfs(nb, lr, lc, [...captured, [mr, mc]], [...path, [lr, lc]]);
    }
    if (!extended && captured.length > 0) {
      results.push({ from: [r, c], to: [cr, cc], captures: captured, path });
    }
  };
  dfs(b, r, c, [], []);
  return results;
}

function getSimpleMoves(
  b: Board,
  size: number,
  r: number,
  c: number,
  piece: Cell,
  giants: Record<string, true>,
): Move[] {
  const inBounds = inBoundsBuilder(size);
  const moves: Move[] = [];
  const isBlocked = (r0: number, c0: number) => {
    for (const key of Object.keys(giants)) {
      const [gr, gc] = key.split(",").map(Number);
      if (r0 >= gr && r0 <= gr + 1 && c0 >= gc && c0 <= gc + 1) {
        if (!(r === gr && c === gc)) return true;
      }
    }
    return false;
  };
  for (const [dr, dc] of pieceDirs(piece)) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && b[nr][nc] === 0 && !isBlocked(nr, nc)) {
      moves.push({ from: [r, c], to: [nr, nc], captures: [], path: [[nr, nc]] });
    }
  }
  return moves;
}

function getAllMoves(b: Board, size: number, side: "p" | "a", giants: Record<string, true>): Move[] {
  const jumps: Move[] = [];
  const simple: Move[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = b[r][c];
      if (v === 0 || ownerOf(v) !== side) continue;
      jumps.push(...getJumpsFrom(b, size, r, c, v, giants));
      simple.push(...getSimpleMoves(b, size, r, c, v, giants));
    }
  }
  return jumps.length > 0 ? jumps : simple;
}

function applyMove(b: Board, size: number, move: Move): Board {
  const nb = b.map((row) => row.slice()) as Board;
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  let piece = nb[fr][fc];
  nb[fr][fc] = 0;
  for (const [cr, cc] of move.captures) nb[cr][cc] = 0;
  if (piece === 1 && tr === 0) piece = 3;
  if (piece === 2 && tr === size - 1) piece = 4;
  nb[tr][tc] = piece;
  return nb;
}

function evaluate(b: Board): number {
  let s = 0;
  for (const row of b) for (const v of row) {
    if (v === 1) s -= 1;
    else if (v === 3) s -= 2;
    else if (v === 2) s += 1;
    else if (v === 4) s += 2;
  }
  return s;
}

function minimax(
  b: Board,
  size: number,
  giants: Record<string, true>,
  depth: number,
  alpha: number,
  beta: number,
  isMax: boolean,
): { score: number; move: Move | null } {
  if (depth === 0) return { score: evaluate(b), move: null };
  const side: "p" | "a" = isMax ? "a" : "p";
  const moves = getAllMoves(b, size, side, giants);
  if (moves.length === 0) return { score: isMax ? -9999 : 9999, move: null };
  let bestMove: Move | null = null;
  if (isMax) {
    let best = -Infinity;
    for (const m of moves) {
      const nb = applyMove(b, size, m);
      const { score } = minimax(nb, size, giants, depth - 1, alpha, beta, false);
      const adj = score + m.captures.length * 0.5;
      if (adj > best) {
        best = adj;
        bestMove = m;
      }
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return { score: best, move: bestMove };
  } else {
    let best = Infinity;
    for (const m of moves) {
      const nb = applyMove(b, size, m);
      const { score } = minimax(nb, size, giants, depth - 1, alpha, beta, true);
      const adj = score - m.captures.length * 0.5;
      if (adj < best) {
        best = adj;
        bestMove = m;
      }
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return { score: best, move: bestMove };
  }
}

function pickAIMoveSmart(
  b: Board,
  size: number,
  giants: Record<string, true>,
  depth: number,
): Move | null {
  const { move } = minimax(b, size, giants, depth, -Infinity, Infinity, true);
  return move;
}

const Checkers = () => {
  const [mode, setMode] = useState<Mode>("menu");
  const [size, setSize] = useState(8);
  const [board, setBoard] = useState<Board>(() => initialBoard(8));
  const [giants, setGiants] = useState<Record<string, true>>({});
  const [turn, setTurn] = useState<"p" | "a">("p");
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [crowns, setCrowns] = useState(loadCrowns);
  const [winner, setWinner] = useState<"p" | "a" | null>(null);
  const [awarded, setAwarded] = useState(false);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [opponent, setOpponent] = useState<CheckersOpponent | null>(null);
  const [chaosMsg, setChaosMsg] = useState<CheckersChaosResult | null>(null);
  const [beatenIds, setBeatenIds] = useState<string[]>(() => loadBeaten("checkers"));
  const [aiThinking, setAiThinking] = useState(false);

  useEffect(() => subscribeCrowns(setCrowns), []);
  useEffect(() => subscribeBeaten(() => setBeatenIds(loadBeaten("checkers"))), []);

  const playerMoves = useMemo(
    () => (turn === "p" && !winner ? getAllMoves(board, size, "p", giants) : []),
    [board, size, turn, winner, giants],
  );

  const movesFromSelected = useMemo(() => {
    if (!selected) return [];
    return playerMoves.filter((m) => m.from[0] === selected[0] && m.from[1] === selected[1]);
  }, [playerMoves, selected]);

  // Detect game over
  useEffect(() => {
    if (winner) return;
    const pMoves = getAllMoves(board, size, "p", giants);
    const aMoves = getAllMoves(board, size, "a", giants);
    if (turn === "p" && pMoves.length === 0) setWinner("a");
    else if (turn === "a" && aMoves.length === 0) setWinner("p");
  }, [board, size, turn, winner, giants]);

  // Award + sound on game end
  useEffect(() => {
    if (!winner || awarded) return;
    if (winner === "p") {
      const reward = opponent?.crownReward ?? 500;
      addCrowns(reward);
      setLastReward(reward);
      if (opponent) {
        const updated = addBeaten("checkers", opponent.id);
        setBeatenIds(updated);
      }
      SFX.win();
      SFX.crown();
    } else {
      SFX.lose();
    }
    setAwarded(true);
  }, [winner, awarded, opponent]);

  // AI turn
  useEffect(() => {
    if (turn !== "a" || winner || mode !== "ai" || !opponent) return;
    setAiThinking(true);
    const t = setTimeout(() => {
      // Roll chaos
      const chaos = rollCheckersChaos(board, size, giants, opponent.id);
      if (chaos) {
        SFX.chaos();
        setChaosMsg(chaos);
        setTimeout(() => setChaosMsg(null), 3500);
        if (chaos.newSize) setSize(chaos.newSize);
        if (chaos.newBoard) setBoard(chaos.newBoard as Board);
        if (chaos.newGiants) setGiants(chaos.newGiants);
      }
      const move = pickAIMoveSmart(
        chaos?.newBoard ? (chaos.newBoard as Board) : board,
        chaos?.newSize ?? size,
        chaos?.newGiants ?? giants,
        opponent.depth,
      );
      if (move) {
        setBoard((b) => applyMove(b, chaos?.newSize ?? size, move));
        SFX.move();
      }
      setTurn("p");
      setAiThinking(false);
    }, 600);
    return () => clearTimeout(t);
  }, [turn, board, size, giants, winner, mode, opponent]);

  const handleClick = (r: number, c: number) => {
    if (turn !== "p" || winner) return;
    const v = board[r][c];
    if (selected) {
      const move = movesFromSelected.find((m) => m.to[0] === r && m.to[1] === c);
      if (move) {
        setBoard((b) => applyMove(b, size, move));
        setSelected(null);
        if (mode === "ai") setTurn("a");
        else setTurn(turn === "p" ? "a" : "p"); // local toggle (basic)
        SFX.move();
        return;
      }
      if (ownerOf(v) === "p") {
        setSelected([r, c]);
        SFX.select();
        return;
      }
      setSelected(null);
      return;
    }
    if (ownerOf(v) === "p" && playerMoves.some((m) => m.from[0] === r && m.from[1] === c)) {
      setSelected([r, c]);
      SFX.select();
    }
  };

  const reset = (newSize = size) => {
    setSize(newSize);
    setBoard(initialBoard(newSize));
    setGiants({});
    setTurn("p");
    setSelected(null);
    setWinner(null);
    setAwarded(false);
    setLastReward(null);
    setChaosMsg(null);
  };

  // === RENDER MODES ===

  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6">
        <h1 className="text-4xl sm:text-6xl font-black text-foreground">🔴 Checkers</h1>
        <p className="text-sm text-muted-foreground">Pick a mode</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={() => setMode("ai-pick")} className="h-14 text-base">🤖 Play vs AI</Button>
          <Button
            onClick={() => {
              setOpponent(null);
              reset(8);
              setMode("local");
            }}
            variant="secondary"
            className="h-14 text-base"
          >
            👥 Same Device (2P)
          </Button>
          <Link to="/"><Button variant="ghost" className="w-full">← Arcade</Button></Link>
        </div>
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-3 py-1 rounded-full">
          <span className="text-sm font-bold text-accent">👑 {crowns}</span>
        </div>
      </div>
    );
  }

  if (mode === "ai-pick") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
        <GenericAIPicker
          opponents={CHECKERS_OPPONENTS}
          beatenIds={beatenIds}
          crowns={crowns}
          title="🔴 PICK YOUR CHECKERS RIVAL"
          onSelect={(opp) => {
            setOpponent(opp);
            reset(8);
            setMode("ai");
          }}
          onBack={() => setMode("menu")}
        />
      </div>
    );
  }

  const validTargets = new Set(movesFromSelected.map((m) => `${m.to[0]},${m.to[1]}`));
  const isGiant = (r: number, c: number) => !!giants[`${r},${c}`];
  const cellSizePx = size <= 8 ? 56 : size <= 10 ? 44 : 36;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start sm:justify-center p-3 gap-3">
      {opponent && mode === "ai" && (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-accent">
            <img src={opponent.image} alt={opponent.name} className="w-full h-full object-cover" />
            {opponent.id === "edward-tophat" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <TopHat size={28} />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-foreground leading-tight">
              vs {opponent.name}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              ELO {opponent.elo} · {opponent.title}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 text-xs flex-wrap justify-center">
        <span className="bg-accent/15 text-accent px-3 py-1 rounded-full font-bold">👑 {crowns}</span>
        <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full font-bold">
          {winner ? "Game over" : turn === "p" ? "Your turn" : aiThinking ? "AI thinking..." : "AI turn"}
        </span>
        <span className="bg-secondary px-3 py-1 rounded-full font-bold">{size}x{size}</span>
      </div>

      {chaosMsg && (
        <div className="animate-in fade-in zoom-in-95 duration-300 max-w-md bg-destructive/10 border-2 border-destructive rounded-xl p-3 text-center">
          <p className="text-lg font-black text-destructive">
            {chaosMsg.emoji} {chaosMsg.name} {chaosMsg.emoji}
          </p>
          <p className="text-xs text-foreground">{chaosMsg.message}</p>
        </div>
      )}

      <div
        className="grid gap-0 bg-primary/20 p-2 rounded-2xl shadow-2xl"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const dark = (r + c) % 2 === 1;
            const isSel = selected && selected[0] === r && selected[1] === c;
            const isTarget = validTargets.has(`${r},${c}`);
            const giant = isGiant(r, c);
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                disabled={turn !== "p" || !!winner}
                className={`flex items-center justify-center transition-all relative ${
                  dark ? "bg-foreground/80" : "bg-card"
                } ${isSel ? "ring-4 ring-accent z-10" : ""} ${isTarget ? "ring-2 ring-accent/70" : ""}`}
                style={{ width: cellSizePx, height: cellSizePx }}
              >
                {cell !== 0 && (
                  <div
                    className={`rounded-full border-2 flex items-center justify-center ${
                      isPlayer(cell) ? "bg-red-600 border-red-300" : "bg-zinc-900 border-zinc-400"
                    } ${isKing(cell) ? "ring-2 ring-yellow-400" : ""}`}
                    style={{
                      width: giant ? cellSizePx * 1.8 : cellSizePx * 0.75,
                      height: giant ? cellSizePx * 1.8 : cellSizePx * 0.75,
                      position: giant ? "absolute" : "relative",
                      top: giant ? 4 : undefined,
                      left: giant ? 4 : undefined,
                      zIndex: giant ? 5 : 1,
                    }}
                  >
                    {isKing(cell) && <span className="text-xs">👑</span>}
                  </div>
                )}
                {isTarget && cell === 0 && <span className="w-3 h-3 rounded-full bg-accent/70" />}
              </button>
            );
          }),
        )}
      </div>

      <div className="text-center min-h-[2.5rem] space-y-1">
        {winner === "p" && <p className="text-2xl font-black text-accent animate-rise-up">🏆 You win!</p>}
        {winner === "a" && <p className="text-2xl font-black text-destructive animate-rise-up">💀 AI wins!</p>}
        {lastReward !== null && lastReward > 0 && (
          <p className="text-sm font-bold text-accent">+{lastReward} 👑 (Total: {crowns})</p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        <Button onClick={() => reset(8)}>New Game</Button>
        <Button onClick={() => { setMode("menu"); reset(8); setOpponent(null); }} variant="outline">
          ← Menu
        </Button>
        {mode === "ai" && !winner && (
          <Button
            variant="destructive"
            onClick={() => setWinner("p")}
            className="text-xs"
          >
            🧪 DEV: Instant Win
          </Button>
        )}
      </div>

      <AiSongPlayer show={mode === "ai" && !winner} />
    </div>
  );
};

export default Checkers;
