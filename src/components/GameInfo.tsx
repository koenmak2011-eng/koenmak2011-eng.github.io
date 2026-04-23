import { Chess } from "chess.js";
import { Button } from "@/components/ui/button";
import { AIOpponent } from "@/data/aiOpponents";
import { PLAYER_CHAOS_OPTIONS, getPlayerMaterial } from "@/lib/playerChaos";

interface GameInfoProps {
  game: Chess;
  moveHistory: string[];
  onReset: () => void;
  onUndo: () => void;
  onResign: () => void;
  resigned: "w" | "b" | null;
  aiEnabled: boolean;
  aiOpponent: AIOpponent | null;
  onBackToMenu: () => void;
  aiThinking: boolean;
  chaosCredits: number;
  chaosActiveTurns: number;
  onPlayerChaos: (optionId: string) => void;
}

const GameInfo = ({
  game,
  moveHistory,
  onReset,
  onUndo,
  onResign,
  resigned,
  aiEnabled,
  aiOpponent,
  onBackToMenu,
  aiThinking,
  chaosCredits,
  chaosActiveTurns,
  onPlayerChaos,
}: GameInfoProps) => {
  const turn = game.turn() === "w" ? "White" : "Black";
  const isCheck = game.isCheck();
  const isCheckmate = game.isCheckmate();
  const isDraw = game.isDraw();
  const isStalemate = game.isStalemate();
  const gameOver = isCheckmate || isDraw || isStalemate || !!resigned;
  const playerMaterial = getPlayerMaterial(game);

  let status = `${turn} to move`;
  if (resigned) {
    const loser = resigned === "w" ? "White" : "Black";
    const winner = resigned === "w" ? "Black" : "White";
    status = `${loser} resigned. ${winner} wins!`;
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
    <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-xs">
      <div className="bg-card rounded-lg p-3 sm:p-4 shadow-lg border border-border">
        <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">Status</h2>
        <p
          className={`text-xs sm:text-sm font-semibold ${
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
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">You play as White</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={onUndo} variant="secondary" className="flex-1 text-xs sm:text-sm h-8 sm:h-10" disabled={moveHistory.length === 0 || aiThinking || gameOver}>
          Undo
        </Button>
        <Button onClick={onReset} variant="default" className="flex-1 text-xs sm:text-sm h-8 sm:h-10">
          Rematch
        </Button>
      </div>

      {!gameOver && (
        <Button onClick={onResign} variant="destructive" className="text-xs sm:text-sm h-8 sm:h-10" disabled={aiThinking || moveHistory.length === 0}>
          🏳️ Resign
        </Button>
      )}

      {/* Player Chaos Gambling */}
      {aiEnabled && !gameOver && game.turn() === "w" && (
        <div className="bg-card rounded-lg p-2 sm:p-3 shadow-lg border-2 border-accent/30">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs sm:text-sm font-black text-foreground">🎰 CHAOS SHOP</h2>
            {chaosActiveTurns > 0 && (
              <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
                {chaosActiveTurns} turns active
              </span>
            )}
            {chaosCredits > 0 && (
              <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
                {chaosCredits} credits
              </span>
            )}
          </div>
          <p className="text-[9px] text-muted-foreground mb-2">Sacrifice material for chaos! (mat: {playerMaterial}pts)</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PLAYER_CHAOS_OPTIONS.map((opt) => {
              const canAfford = playerMaterial >= opt.materialCost;
              return (
                <button
                  key={opt.id}
                  onClick={() => canAfford && !aiThinking && onPlayerChaos(opt.id)}
                  disabled={!canAfford || aiThinking}
                  className={`text-left p-1.5 rounded-lg border text-[9px] sm:text-[10px] transition-all ${
                    canAfford
                      ? "border-accent/40 bg-accent/5 hover:bg-accent/15 hover:scale-[1.02] cursor-pointer"
                      : "border-border opacity-40 cursor-not-allowed"
                  }`}
                  title={opt.description}
                >
                  <span className="font-black">{opt.emoji} {opt.name}</span>
                  <br />
                  <span className="text-muted-foreground">Cost: {opt.materialCost}pts</span>
                  {opt.credits > 0 && <span className="text-primary ml-1">+{opt.credits}💎</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button onClick={onBackToMenu} variant="outline" className="text-xs sm:text-sm h-8 sm:h-10">
        ← Main Menu
      </Button>

      <div className="bg-card rounded-lg p-3 sm:p-4 shadow-lg border border-border max-h-36 sm:max-h-48 overflow-y-auto">
        <h2 className="text-xs sm:text-sm font-bold text-foreground mb-2">Moves</h2>
        <div className="text-[9px] sm:text-xs text-muted-foreground space-y-0.5">
          {moveHistory.map((move, i) =>
            i % 2 === 0 ? (
              <div key={i} className="flex gap-2">
                <span className="text-foreground/40 w-4 sm:w-5">{Math.floor(i / 2) + 1}.</span>
                <span className="flex-1 font-mono">{move}</span>
                {moveHistory[i + 1] && <span className="flex-1 font-mono">{moveHistory[i + 1]}</span>}
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
