import { useState, useCallback, useEffect } from "react";
import { Chess, Square } from "chess.js";
import ChessBoard from "@/components/ChessBoard";
import GameInfo from "@/components/GameInfo";
import { getBestMove } from "@/lib/chessAI";

const Index = () => {
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [, setTick] = useState(0);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [resigned, setResigned] = useState<"w" | "b" | null>(null);

  const handleMove = useCallback(
    (from: Square, to: Square) => {
      if (aiThinking) return false;
      if (aiEnabled && game.turn() === "b") return false; // block manual moves for AI side
      try {
        const piece = game.get(from);
        const isPromotion =
          piece?.type === "p" &&
          ((piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1"));
        const result = game.move({ from, to, promotion: isPromotion ? "q" : undefined });
        if (result) {
          setMoveHistory((prev) => [...prev, result.san]);
          setTick((t) => t + 1);
          return true;
        }
      } catch {
        // invalid
      }
      return false;
    },
    [game, aiThinking, aiEnabled]
  );

  // AI makes a move when it's black's turn
  useEffect(() => {
    if (!aiEnabled || game.turn() !== "b" || game.isGameOver() || resigned) return;

    setAiThinking(true);
    const timeout = setTimeout(() => {
      const move = getBestMove(game, 3);
      if (move) {
        const result = game.move(move);
        if (result) {
          setMoveHistory((prev) => [...prev, result.san]);
          setTick((t) => t + 1);
        }
      }
      setAiThinking(false);
    }, 300); // small delay for UX

    return () => clearTimeout(timeout);
  }, [game, aiEnabled, moveHistory, resigned]);

  const handleReset = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setResigned(null);
  };

  const handleUndo = () => {
    if (aiEnabled) {
      // Undo both AI and player move
      game.undo();
      game.undo();
      setMoveHistory((prev) => prev.slice(0, -2));
    } else {
      game.undo();
      setMoveHistory((prev) => prev.slice(0, -1));
    }
    setTick((t) => t + 1);
  };

  const handleResign = () => {
    setResigned(game.turn());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
        ♚ Chess
      </h1>
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative">
          <ChessBoard game={game} onMove={handleMove} />
          {aiThinking && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/10 rounded-lg">
              <span className="bg-card px-4 py-2 rounded-lg shadow-lg text-foreground font-semibold animate-pulse">
                AI is thinking...
              </span>
            </div>
          )}
        </div>
        <GameInfo
          game={game}
          moveHistory={moveHistory}
          onReset={handleReset}
          onUndo={handleUndo}
          onResign={handleResign}
          resigned={resigned}
          aiEnabled={aiEnabled}
          onToggleAI={() => {
            setAiEnabled((v) => !v);
            handleReset();
          }}
          aiThinking={aiThinking}
        />
      </div>
    </div>
  );
};

export default Index;
