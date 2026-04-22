import { Chess } from "chess.js";
import { Button } from "@/components/ui/button";

interface GameInfoProps {
  game: Chess;
  moveHistory: string[];
  onReset: () => void;
  onUndo: () => void;
  onResign: () => void;
  resigned: "w" | "b" | null;
  aiEnabled: boolean;
  onToggleAI: () => void;
  aiThinking: boolean;
}

const GameInfo = ({
  game,
  moveHistory,
  onReset,
  onUndo,
  onResign,
  resigned,
  aiEnabled,
  onToggleAI,
  aiThinking,
}: GameInfoProps) => {
  const turn = game.turn() === "w" ? "White" : "Black";
  const isCheck = game.isCheck();
  const isCheckmate = game.isCheckmate();
  const isDraw = game.isDraw();
  const isStalemate = game.isStalemate();
  const gameOver = isCheckmate || isDraw || isStalemate || !!resigned;

  let status = `${turn} to move`;
  if (resigned) {
    const winner = resigned === "w" ? "Black" : "White";
    status = `${resigned === "w" ? "White" : "Black"} resigned. ${winner} wins!`;
  } else if (isCheckmate) {
    status = `Checkmate! ${turn === "White" ? "Black" : "White"} wins!`;
  } else if (isStalemate) {
    status = "Stalemate! It's a draw.";
  } else if (isDraw) {
    status = "Draw!";
  } else if (isCheck) {
    status = `${turn} is in check!`;
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      {/* Mode toggle */}
      <div className="bg-card rounded-lg p-3 shadow-lg border border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {aiEnabled ? "🤖 vs AI" : "👥 2 Players"}
        </span>
        <Button onClick={onToggleAI} variant="outline" size="sm">
          {aiEnabled ? "Play 2P" : "Play vs AI"}
        </Button>
      </div>

      <div className="bg-card rounded-lg p-4 shadow-lg border border-border">
        <h2 className="text-lg font-bold text-foreground mb-2">Status</h2>
        <p
          className={`text-sm font-semibold ${
            isCheckmate || resigned
              ? "text-destructive"
              : isCheck
              ? "text-accent"
              : "text-muted-foreground"
          }`}
        >
          {status}
        </p>
        {aiEnabled && !gameOver && (
          <p className="text-xs text-muted-foreground mt-1">You play as White</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onUndo}
          variant="secondary"
          className="flex-1"
          disabled={moveHistory.length === 0 || aiThinking || gameOver}
        >
          Undo
        </Button>
        <Button onClick={onReset} variant="default" className="flex-1">
          New Game
        </Button>
      </div>

      {/* Resign button */}
      {!gameOver && (
        <Button
          onClick={onResign}
          variant="destructive"
          disabled={aiThinking || moveHistory.length === 0}
        >
          🏳️ Resign
        </Button>
      )}

      <div className="bg-card rounded-lg p-4 shadow-lg border border-border max-h-64 overflow-y-auto">
        <h2 className="text-lg font-bold text-foreground mb-2">Moves</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {moveHistory.map((move, i) =>
            i % 2 === 0 ? (
              <div key={i} className="col-span-2 flex gap-2">
                <span className="text-foreground/50 w-6">
                  {Math.floor(i / 2) + 1}.
                </span>
                <span className="flex-1 font-mono">{move}</span>
                {moveHistory[i + 1] && (
                  <span className="flex-1 font-mono">{moveHistory[i + 1]}</span>
                )}
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
