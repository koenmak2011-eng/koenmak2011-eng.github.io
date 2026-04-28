import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SFX } from "@/lib/sfx";
import { addCrowns, loadCrowns, subscribeCrowns } from "@/lib/crowns";

const WIN_REWARD = 500;

// 0 = empty, 1 = player man, 2 = AI man, 3 = player king, 4 = AI king
type Cell = 0 | 1 | 2 | 3 | 4;
type Board = Cell[][]; // 8x8, board[row][col]

const SIZE = 8;

// Random image seeds (picsum) — picked once per mount so each game has a fresh look
function useRandomPieceImages() {
  return useMemo(() => {
    const rand = () => Math.floor(Math.random() * 100000);
    return {
      player: `https://picsum.photos/seed/p${rand()}/120/120`,
      ai: `https://picsum.photos/seed/a${rand()}/120/120`,
      playerKing: `https://picsum.photos/seed/pk${rand()}/120/120`,
      aiKing: `https://picsum.photos/seed/ak${rand()}/120/120`,
    };
  }, []);
}

function initialBoard(): Board {
  const b: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0) as Cell[]);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) b[r][c] = 2; // AI top
    }
  }
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) b[r][c] = 1; // Player bottom
    }
  }
  return b;
}

const isPlayer = (v: Cell) => v === 1 || v === 3;
const isAI = (v: Cell) => v === 2 || v === 4;
const isKing = (v: Cell) => v === 3 || v === 4;
const ownerOf = (v: Cell): "p" | "a" | null =>
  v === 1 || v === 3 ? "p" : v === 2 || v === 4 ? "a" : null;

const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

interface Move {
  from: [number, number];
  to: [number, number];
  captures: [number, number][]; // captured piece coords (for multi-jump)
  path: [number, number][]; // landing squares
}

function pieceDirs(v: Cell): [number, number][] {
  if (isKing(v)) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  if (v === 1) return [[-1, -1], [-1, 1]]; // player moves up
  if (v === 2) return [[1, -1], [1, 1]]; // AI moves down
  return [];
}

function getJumpsFrom(b: Board, r: number, c: number, piece: Cell): Move[] {
  const results: Move[] = [];
  const dfs = (
    board: Board,
    cr: number,
    cc: number,
    captured: [number, number][],
    path: [number, number][],
  ) => {
    const dirs = pieceDirs(piece);
    let extended = false;
    for (const [dr, dc] of dirs) {
      const mr = cr + dr;
      const mc = cc + dc;
      const lr = cr + 2 * dr;
      const lc = cc + 2 * dc;
      if (!inBounds(lr, lc)) continue;
      const mid = board[mr]?.[mc];
      if (mid === undefined || mid === 0) continue;
      if (ownerOf(mid) === ownerOf(piece)) continue;
      if (board[lr][lc] !== 0) continue;
      if (captured.some(([x, y]) => x === mr && y === mc)) continue;
      // simulate
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

function getSimpleMoves(b: Board, r: number, c: number, piece: Cell): Move[] {
  const moves: Move[] = [];
  for (const [dr, dc] of pieceDirs(piece)) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && b[nr][nc] === 0) {
      moves.push({ from: [r, c], to: [nr, nc], captures: [], path: [[nr, nc]] });
    }
  }
  return moves;
}

function getAllMoves(b: Board, side: "p" | "a"): Move[] {
  const jumps: Move[] = [];
  const simple: Move[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = b[r][c];
      if (v === 0) continue;
      if (ownerOf(v) !== side) continue;
      jumps.push(...getJumpsFrom(b, r, c, v));
      simple.push(...getSimpleMoves(b, r, c, v));
    }
  }
  // Forced capture rule
  return jumps.length > 0 ? jumps : simple;
}

function applyMove(b: Board, move: Move): Board {
  const nb = b.map((row) => row.slice()) as Board;
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  let piece = nb[fr][fc];
  nb[fr][fc] = 0;
  for (const [cr, cc] of move.captures) nb[cr][cc] = 0;
  // King promotion
  if (piece === 1 && tr === 0) piece = 3;
  if (piece === 2 && tr === SIZE - 1) piece = 4;
  nb[tr][tc] = piece;
  return nb;
}

function evaluateBoard(b: Board): number {
  // higher = better for AI
  let score = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = b[r][c];
      if (v === 1) score -= 1;
      else if (v === 3) score -= 2;
      else if (v === 2) score += 1 + r * 0.05;
      else if (v === 4) score += 2;
    }
  }
  return score;
}

function pickAIMove(b: Board): Move | null {
  const moves = getAllMoves(b, "a");
  if (moves.length === 0) return null;
  // Score each move, pick best with light randomness
  let best = -Infinity;
  let bestMoves: Move[] = [];
  for (const m of moves) {
    const nb = applyMove(b, m);
    const s = evaluateBoard(nb) + m.captures.length * 3 + Math.random() * 0.4;
    if (s > best) {
      best = s;
      bestMoves = [m];
    } else if (s === best) {
      bestMoves.push(m);
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

const Checkers = () => {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [turn, setTurn] = useState<"p" | "a">("p");
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [crowns, setCrowns] = useState(loadCrowns);
  const [winner, setWinner] = useState<"p" | "a" | null>(null);
  const [awarded, setAwarded] = useState(false);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [score, setScore] = useState({ wins: 0, losses: 0 });
  const images = useRandomPieceImages();

  useEffect(() => subscribeCrowns(setCrowns), []);

  const playerMoves = useMemo(
    () => (turn === "p" && !winner ? getAllMoves(board, "p") : []),
    [board, turn, winner],
  );

  const movesFromSelected = useMemo(() => {
    if (!selected) return [];
    return playerMoves.filter((m) => m.from[0] === selected[0] && m.from[1] === selected[1]);
  }, [playerMoves, selected]);

  // Detect game over
  useEffect(() => {
    if (winner) return;
    const pMoves = getAllMoves(board, "p");
    const aMoves = getAllMoves(board, "a");
    if (turn === "p" && pMoves.length === 0) setWinner("a");
    else if (turn === "a" && aMoves.length === 0) setWinner("p");
  }, [board, turn, winner]);

  // Award + sound on game end
  useEffect(() => {
    if (!winner || awarded) return;
    if (winner === "p") {
      addCrowns(WIN_REWARD);
      setLastReward(WIN_REWARD);
      setScore((s) => ({ ...s, wins: s.wins + 1 }));
      SFX.win();
      SFX.crown();
    } else {
      setScore((s) => ({ ...s, losses: s.losses + 1 }));
      SFX.lose();
    }
    setAwarded(true);
  }, [winner, awarded]);

  // AI turn
  useEffect(() => {
    if (turn !== "a" || winner) return;
    const t = setTimeout(() => {
      const move = pickAIMove(board);
      if (!move) return; // game-over effect will catch it
      setBoard((b) => applyMove(b, move));
      setTurn("p");
      SFX.move();
    }, 500);
    return () => clearTimeout(t);
  }, [turn, board, winner]);

  const handleClick = (r: number, c: number) => {
    if (turn !== "p" || winner) return;
    const v = board[r][c];
    if (selected) {
      const move = movesFromSelected.find((m) => m.to[0] === r && m.to[1] === c);
      if (move) {
        setBoard((b) => applyMove(b, move));
        setSelected(null);
        setTurn("a");
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

  const reset = () => {
    setBoard(initialBoard());
    setTurn("p");
    setSelected(null);
    setWinner(null);
    setAwarded(false);
    setLastReward(null);
  };

  const validTargets = new Set(movesFromSelected.map((m) => `${m.to[0]},${m.to[1]}`));

  const pieceImg = (v: Cell) => {
    if (v === 1) return images.player;
    if (v === 2) return images.ai;
    if (v === 3) return images.playerKing;
    if (v === 4) return images.aiKing;
    return null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
      <div className="text-center">
        <h1 className="text-3xl sm:text-5xl font-black text-foreground">Checkers</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Capture all AI pieces to win <span className="font-bold text-accent">500 👑</span>
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-3 py-1 rounded-full">
          <span className="text-sm font-bold text-accent">👑 {crowns} crowns</span>
        </div>
      </div>

      <div className="flex gap-3 text-xs sm:text-sm">
        <span className="bg-accent/15 text-accent px-3 py-1 rounded-full font-bold">Wins: {score.wins}</span>
        <span className="bg-destructive/15 text-destructive px-3 py-1 rounded-full font-bold">Losses: {score.losses}</span>
        <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full font-bold">
          {winner ? "Game over" : turn === "p" ? "Your turn" : "AI thinking..."}
        </span>
      </div>

      <div className="grid grid-cols-8 gap-0 bg-primary/20 p-2 rounded-2xl shadow-2xl">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const dark = (r + c) % 2 === 1;
            const isSel = selected && selected[0] === r && selected[1] === c;
            const isTarget = validTargets.has(`${r},${c}`);
            const img = pieceImg(cell);
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                disabled={turn !== "p" || !!winner}
                className={`w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center transition-all relative ${
                  dark ? "bg-foreground/80" : "bg-card"
                } ${isSel ? "ring-4 ring-accent z-10" : ""} ${
                  isTarget ? "ring-2 ring-accent/70" : ""
                }`}
              >
                {img && (
                  <img
                    src={img}
                    alt={isAI(cell) ? "AI piece" : "Player piece"}
                    className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border-2 ${
                      isPlayer(cell) ? "border-accent" : "border-destructive"
                    } ${isKing(cell) ? "ring-2 ring-yellow-400" : ""}`}
                    draggable={false}
                  />
                )}
                {isKing(cell) && (
                  <span className="absolute -top-1 -right-1 text-[10px]">👑</span>
                )}
                {isTarget && !img && (
                  <span className="w-3 h-3 rounded-full bg-accent/70" />
                )}
              </button>
            );
          }),
        )}
      </div>

      <div className="text-center min-h-[2.5rem] space-y-1">
        {winner === "p" && <p className="text-2xl font-black text-accent animate-rise-up">🏆 You win!</p>}
        {winner === "a" && <p className="text-2xl font-black text-destructive animate-rise-up">💀 AI wins!</p>}
        {lastReward !== null && lastReward > 0 && (
          <p className="text-sm font-bold text-accent animate-rise-up">
            +{lastReward} 👑 (Total: {crowns})
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={reset} variant="default">New Game</Button>
        <Link to="/"><Button variant="outline">← Arcade</Button></Link>
      </div>
    </div>
  );
};

export default Checkers;
