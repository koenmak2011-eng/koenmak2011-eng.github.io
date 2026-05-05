import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SFX } from "@/lib/sfx";
import { addCrowns, loadCrowns, subscribeCrowns } from "@/lib/crowns";
import { TTT_OPPONENTS, type TTTOpponent } from "@/data/tttOpponents";
import GenericAIPicker from "@/components/GenericAIPicker";
import AiSongPlayer from "@/components/AiSongPlayer";
import TopHat from "@/components/TopHat";
import { addBeaten, loadBeaten, subscribeBeaten } from "@/lib/beaten";
import { rollTTTChaos, checkTTTWinner, type Mark, type TTTChaosResult } from "@/lib/tttChaos";

type Mode = "menu" | "ai-pick" | "ai" | "local";

// AI move: minimax for skill==1, mixed with random for lower skill
function aiBestMove(board: Mark[], size: number, mark: Mark): number {
  const target = size <= 4 ? 3 : 4;
  // Try win, then block, then center, then random — heuristic baseline
  const opponent: Mark = mark === "X" ? "O" : "X";
  // Look for immediate win/block by checking each empty
  for (const m of [mark, opponent]) {
    for (let i = 0; i < board.length; i++) {
      if (board[i]) continue;
      const test = [...board];
      test[i] = m;
      if (checkTTTWinner(test, size).winner === m) return i;
    }
  }
  const center = Math.floor(size / 2) * size + Math.floor(size / 2);
  if (!board[center]) return center;
  // Prefer corners
  const corners = [0, size - 1, size * (size - 1), size * size - 1].filter((i) => !board[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
  return empty[Math.floor(Math.random() * empty.length)];
}

function aiMove(board: Mark[], size: number, mark: Mark, skill: number): number {
  if (Math.random() < skill) return aiBestMove(board, size, mark);
  // Random fallback
  const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
  return empty[Math.floor(Math.random() * empty.length)];
}

const TicTacToe = () => {
  const [mode, setMode] = useState<Mode>("menu");
  const [size, setSize] = useState(3);
  const [board, setBoard] = useState<Mark[]>(() => Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [crowns, setCrowns] = useState(loadCrowns);
  const [awarded, setAwarded] = useState(false);
  const [opponent, setOpponent] = useState<TTTOpponent | null>(null);
  const [chaosMsg, setChaosMsg] = useState<TTTChaosResult | null>(null);
  const [beatenIds, setBeatenIds] = useState<string[]>(() => loadBeaten("tictactoe"));

  useEffect(() => subscribeCrowns(setCrowns), []);
  useEffect(() => subscribeBeaten(() => setBeatenIds(loadBeaten("tictactoe"))), []);

  const { winner, line } = useMemo(() => checkTTTWinner(board, size), [board, size]);
  const isDraw = !winner && board.every((c) => c !== null);
  const gameOver = !!winner || isDraw;

  // AI turn
  useEffect(() => {
    if (mode !== "ai" || !opponent) return;
    if (turn !== "O" || gameOver) return;
    const t = setTimeout(() => {
      // Maybe roll chaos
      const chaos = rollTTTChaos(board, size, opponent.id);
      let curBoard = board;
      let curSize = size;
      if (chaos) {
        SFX.chaos();
        setChaosMsg(chaos);
        setTimeout(() => setChaosMsg(null), 3500);
        if (chaos.newBoard) {
          curBoard = chaos.newBoard;
          setBoard(chaos.newBoard);
        }
        if (chaos.newSize) {
          curSize = chaos.newSize;
          setSize(chaos.newSize);
        }
      }
      const move = aiMove(curBoard, curSize, "O", opponent.skill);
      const next = [...curBoard];
      next[move] = "O";
      setBoard(next);
      setTurn("X");
      SFX.move();
    }, 450);
    return () => clearTimeout(t);
  }, [turn, board, size, gameOver, mode, opponent]);

  // Score + crowns on game end
  useEffect(() => {
    if (awarded || mode !== "ai" || !opponent) return;
    if (winner === "X") {
      addCrowns(opponent.crownReward);
      const updated = addBeaten("tictactoe", opponent.id);
      setBeatenIds(updated);
      SFX.win();
      SFX.crown();
      setAwarded(true);
    } else if (winner === "O") {
      SFX.lose();
      setAwarded(true);
    } else if (isDraw) {
      setAwarded(true);
    }
  }, [winner, isDraw, awarded, mode, opponent]);

  const handleClick = (i: number) => {
    if (board[i] || gameOver) return;
    if (mode === "ai" && turn !== "X") return;
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    setTurn(turn === "X" ? "O" : "X");
    SFX.select();
  };

  const reset = (newSize = 3) => {
    setSize(newSize);
    setBoard(Array(newSize * newSize).fill(null));
    setTurn("X");
    setAwarded(false);
    setChaosMsg(null);
  };

  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6">
        <h1 className="text-4xl sm:text-6xl font-black text-foreground">⭕ Tic-Tac-Toe</h1>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={() => setMode("ai-pick")} className="h-14">🤖 Play vs AI</Button>
          <Button
            onClick={() => {
              setOpponent(null);
              reset(3);
              setMode("local");
            }}
            variant="secondary"
            className="h-14"
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
          opponents={TTT_OPPONENTS}
          beatenIds={beatenIds}
          crowns={crowns}
          title="⭕ PICK YOUR TTT RIVAL"
          onSelect={(opp) => {
            setOpponent(opp);
            reset(3);
            setMode("ai");
          }}
          onBack={() => setMode("menu")}
        />
      </div>
    );
  }

  const lineSet = new Set(line ?? []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
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
            <h1 className="text-lg sm:text-2xl font-black leading-tight">vs {opponent.name}</h1>
            <p className="text-[11px] text-muted-foreground">ELO {opponent.elo} · {opponent.title}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 text-xs flex-wrap justify-center">
        <span className="bg-accent/15 text-accent px-3 py-1 rounded-full font-bold">👑 {crowns}</span>
        <span className="bg-secondary px-3 py-1 rounded-full font-bold">{size}x{size} (need {size <= 4 ? 3 : 4})</span>
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
        className="grid gap-2 bg-primary/20 p-2 rounded-2xl shadow-2xl"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {board.map((cell, i) => {
          const cellSize = size === 3 ? 96 : size === 4 ? 76 : 60;
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={!!cell || gameOver || (mode === "ai" && turn !== "X")}
              style={{ width: cellSize, height: cellSize }}
              className={`rounded-xl font-black flex items-center justify-center transition-all ${
                lineSet.has(i)
                  ? "bg-accent/30 ring-4 ring-accent scale-105"
                  : "bg-card hover:bg-accent/10"
              } ${cell === "X" ? "text-accent" : cell === "O" ? "text-primary" : ""}`}
            >
              <span style={{ fontSize: cellSize * 0.55 }}>{cell}</span>
            </button>
          );
        })}
      </div>

      <div className="text-center min-h-[2rem] space-y-1">
        {winner === "X" && <p className="text-2xl font-black text-accent animate-rise-up">🏆 You win!</p>}
        {winner === "O" && <p className="text-2xl font-black text-destructive animate-rise-up">💀 AI wins!</p>}
        {isDraw && <p className="text-2xl font-black text-primary animate-rise-up">🤝 Draw!</p>}
        {opponent && winner === "X" && (
          <p className="text-sm font-bold text-accent">+{opponent.crownReward} 👑 (Total: {crowns})</p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        <Button onClick={() => reset(3)}>New Game</Button>
        <Button onClick={() => { setMode("menu"); reset(3); setOpponent(null); }} variant="outline">
          ← Menu
        </Button>
        {mode === "ai" && !gameOver && (
          <Button
            variant="destructive"
            className="text-xs"
            onClick={() => {
              const target = size <= 4 ? 3 : 4;
              const next = [...board];
              for (let i = 0; i < target; i++) next[i] = "X";
              setBoard(next);
            }}
          >
            🧪 DEV: Instant Win
          </Button>
        )}
      </div>

      <AiSongPlayer show={mode === "ai" && !gameOver} />
    </div>
  );
};

export default TicTacToe;
