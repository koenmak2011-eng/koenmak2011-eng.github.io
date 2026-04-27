import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SFX } from "@/lib/sfx";
import { addCrowns, loadCrowns, subscribeCrowns } from "@/lib/crowns";

const WIN_REWARD = 1;
const DRAW_REWARD = 0;

type Cell = "X" | "O" | null;
type Board = Cell[];

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(b: Board): { winner: Cell; line: number[] | null } {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a], line };
  }
  return { winner: null, line: null };
}

function aiMove(b: Board): number {
  // Try to win, then block, else center, else random
  for (const mark of ["O", "X"] as const) {
    for (const line of LINES) {
      const cells = line.map(i => b[i]);
      const empty = line.find(i => !b[i]);
      if (empty !== undefined && cells.filter(c => c === mark).length === 2 && cells.filter(c => c === null).length === 1) {
        return empty;
      }
    }
  }
  if (!b[4]) return 4;
  const corners = [0, 2, 6, 8].filter(i => !b[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  const empty = b.map((c, i) => c === null ? i : -1).filter(i => i >= 0);
  return empty[Math.floor(Math.random() * empty.length)];
}

const TicTacToe = () => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });
  const [crowns, setCrowns] = useState(loadCrowns);
  const [awarded, setAwarded] = useState(false);
  const [lastReward, setLastReward] = useState<number | null>(null);
  useEffect(() => subscribeCrowns(setCrowns), []);

  const { winner, line } = checkWinner(board);
  const isDraw = !winner && board.every(c => c !== null);
  const gameOver = !!winner || isDraw;

  // AI turn
  useEffect(() => {
    if (turn === "O" && !gameOver) {
      const t = setTimeout(() => {
        const move = aiMove(board);
        const next = [...board];
        next[move] = "O";
        setBoard(next);
        setTurn("X");
        SFX.move();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [turn, board, gameOver]);

  // Score + crowns on game end (once per game)
  useEffect(() => {
    if (awarded) return;
    if (winner === "X") {
      setScore(s => ({ ...s, wins: s.wins + 1 }));
      addCrowns(WIN_REWARD);
      setLastReward(WIN_REWARD);
      setAwarded(true);
      SFX.win();
      SFX.crown();
    } else if (winner === "O") {
      setScore(s => ({ ...s, losses: s.losses + 1 }));
      setAwarded(true);
      SFX.lose();
    } else if (isDraw) {
      setScore(s => ({ ...s, draws: s.draws + 1 }));
      if (DRAW_REWARD > 0) { addCrowns(DRAW_REWARD); setLastReward(DRAW_REWARD); }
      setAwarded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, isDraw]);

  const handleClick = (i: number) => {
    if (board[i] || gameOver || turn !== "X") return;
    const next = [...board];
    next[i] = "X";
    setBoard(next);
    setTurn("O");
    SFX.select();
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setAwarded(false);
    setLastReward(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6">
      <div className="text-center">
        <h1 className="text-3xl sm:text-5xl font-black text-foreground">Tic-Tac-Toe</h1>
        <p className="text-sm text-muted-foreground mt-1">
          You: <span className="font-bold text-accent">X</span> · AI: <span className="font-bold text-primary">O</span>
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-3 py-1 rounded-full">
          <span className="text-sm font-bold text-accent">👑 {crowns} crowns</span>
        </div>
      </div>

      <div className="flex gap-4 text-xs sm:text-sm">
        <span className="bg-accent/15 text-accent px-3 py-1 rounded-full font-bold">Wins: {score.wins}</span>
        <span className="bg-destructive/15 text-destructive px-3 py-1 rounded-full font-bold">Losses: {score.losses}</span>
        <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full font-bold">Draws: {score.draws}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-primary/20 p-2 rounded-2xl shadow-2xl">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!!cell || gameOver || turn !== "X"}
            className={`w-20 h-20 sm:w-28 sm:h-28 rounded-xl text-5xl sm:text-7xl font-black flex items-center justify-center transition-all ${
              line?.includes(i)
                ? "bg-accent/30 ring-4 ring-accent scale-105"
                : "bg-card hover:bg-accent/10"
            } ${cell === "X" ? "text-accent" : cell === "O" ? "text-primary" : ""}`}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="text-center min-h-[2rem]">
        {winner === "X" && <p className="text-2xl font-black text-accent animate-rise-up">🏆 You win!</p>}
        {winner === "O" && <p className="text-2xl font-black text-destructive animate-rise-up">💀 AI wins!</p>}
        {isDraw && <p className="text-2xl font-black text-primary animate-rise-up">🤝 Draw!</p>}
        {!gameOver && turn === "O" && <p className="text-sm text-muted-foreground animate-pulse">AI is thinking...</p>}
      </div>

      <div className="flex gap-2">
        <Button onClick={reset} variant="default">New Game</Button>
        <Link to="/"><Button variant="outline">← Arcade</Button></Link>
      </div>
    </div>
  );
};

export default TicTacToe;
