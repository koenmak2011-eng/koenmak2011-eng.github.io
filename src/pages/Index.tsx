import { useState, useCallback } from "react";
import { Chess, Square } from "chess.js";
import ChessBoard from "@/components/ChessBoard";
import GameInfo from "@/components/GameInfo";

const Index = () => {
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [, setTick] = useState(0); // force re-render

  const handleMove = useCallback(
    (from: Square, to: Square) => {
      try {
        // Check if it's a pawn promotion
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
        // invalid move
      }
      return false;
    },
    [game]
  );

  const handleReset = () => {
    setGame(new Chess());
    setMoveHistory([]);
  };

  const handleUndo = () => {
    game.undo();
    setMoveHistory((prev) => prev.slice(0, -1));
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
        ♚ Chess
      </h1>
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <ChessBoard game={game} onMove={handleMove} />
        <GameInfo game={game} moveHistory={moveHistory} onReset={handleReset} onUndo={handleUndo} />
      </div>
    </div>
  );
};

export default Index;
