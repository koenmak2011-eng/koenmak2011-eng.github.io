import { useEffect, useState } from "react";

type Outcome = "win" | "lose" | "draw" | null;

interface Props {
  outcome: Outcome;
  crownReward?: number;
  totalCrowns?: number;
  opponentName?: string;
  onDismiss?: () => void;
}

const GameEndOverlay = ({ outcome, crownReward, totalCrowns, opponentName, onDismiss }: Props) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (outcome) setShow(true);
  }, [outcome]);

  if (!outcome || !show) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/40 backdrop-blur-sm cursor-pointer animate-in fade-in duration-300"
      onClick={() => {
        setShow(false);
        onDismiss?.();
      }}
    >
      {outcome === "win" && (
        <>
          {/* Confetti */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-3xl animate-confetti-fall"
              style={{
                left: `${(i * 3.3) % 100}%`,
                animationDelay: `${(i % 10) * 0.15}s`,
              }}
            >
              {["🎉", "👑", "✨", "🏆", "⭐"][i % 5]}
            </div>
          ))}
          <div className="bg-card border-4 border-accent rounded-2xl p-8 sm:p-12 text-center shadow-2xl animate-win-burst max-w-md mx-4">
            <div className="text-7xl sm:text-8xl mb-3">👑</div>
            <h2 className="text-4xl sm:text-5xl font-black text-accent mb-2">VICTORY!</h2>
            {opponentName && (
              <p className="text-base sm:text-lg font-black text-foreground mb-2">
                You beat {opponentName}
              </p>
            )}
            {crownReward !== undefined && (
              <p className="text-lg sm:text-xl font-bold text-foreground">
                +{crownReward} Crowns
              </p>
            )}
            {totalCrowns !== undefined && (
              <p className="text-sm text-muted-foreground mt-1">Total: {totalCrowns} 👑</p>
            )}
            <p className="text-xs text-muted-foreground mt-4">tap to dismiss</p>
          </div>
        </>
      )}

      {outcome === "lose" && (
        <div className="bg-card border-4 border-destructive rounded-2xl p-8 sm:p-12 text-center shadow-2xl animate-lose-fade max-w-md mx-4">
          <div className="text-7xl sm:text-8xl mb-3 animate-wiggle inline-block">💀</div>
          <h2 className="text-4xl sm:text-5xl font-black text-destructive mb-2">DEFEATED</h2>
          <p className="text-base text-muted-foreground">Better luck next time...</p>
          <p className="text-xs text-muted-foreground mt-4">tap to dismiss</p>
        </div>
      )}

      {outcome === "draw" && (
        <div className="bg-card border-4 border-primary rounded-2xl p-8 sm:p-12 text-center shadow-2xl animate-draw-slide max-w-md mx-4">
          <div className="text-7xl sm:text-8xl mb-3">🤝</div>
          <h2 className="text-4xl sm:text-5xl font-black text-primary mb-2">DRAW</h2>
          <p className="text-base text-muted-foreground">A balanced battle.</p>
          <p className="text-xs text-muted-foreground mt-4">tap to dismiss</p>
        </div>
      )}
    </div>
  );
};

export default GameEndOverlay;
