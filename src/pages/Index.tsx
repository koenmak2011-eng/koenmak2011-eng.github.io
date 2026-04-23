import { useState, useCallback, useEffect } from "react";
import { Chess, Square } from "chess.js";
import ChessBoard from "@/components/ChessBoard";
import GameInfo from "@/components/GameInfo";
import MainMenu from "@/components/MainMenu";
import AIPicker from "@/components/AIPicker";
import { getBestMove, type AIMoveResult } from "@/lib/chessAI";
import { rollChaosEvent } from "@/lib/chaosEvents";
import { AIOpponent } from "@/data/aiOpponents";
import { type GameMode } from "@/components/MainMenu";

function pickRemark(opponent: AIOpponent | null, game: Chess, lastMoveWasCapture: boolean): string | null {
  if (!opponent) return null;
  const r = opponent.remarks;
  
  // Evaluate material to determine winning/losing
  const board = game.board();
  let material = 0;
  const vals: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  for (const row of board) for (const sq of row) {
    if (sq) material += (sq.color === 'b' ? 1 : -1) * (vals[sq.type] || 0);
  }

  if (game.isCheck()) return r.onCheck[Math.floor(Math.random() * r.onCheck.length)];
  if (lastMoveWasCapture) return r.onCapture[Math.floor(Math.random() * r.onCapture.length)];
  if (material < -3) return r.onLosing[Math.floor(Math.random() * r.onLosing.length)];
  if (material > 3) return r.onWinning[Math.floor(Math.random() * r.onWinning.length)];
  return r.onMove[Math.floor(Math.random() * r.onMove.length)];
}

const Index = () => {
  const [mode, setMode] = useState<GameMode>("menu");
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [, setTick] = useState(0);
  const [aiOpponent, setAiOpponent] = useState<AIOpponent | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [resigned, setResigned] = useState<"w" | "b" | null>(null);
  const [aiRemark, setAiRemark] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiWasBlunder, setAiWasBlunder] = useState(false);
  const [chaosMessage, setChaosMessage] = useState<{ emoji: string; name: string; text: string } | null>(null);
  const [beatenIds, setBeatenIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("chess-beaten") || "[]"); } catch { return []; }
  });

  const aiEnabled = mode === "ai";

  // Track wins against AI
  useEffect(() => {
    if (!aiEnabled || !aiOpponent) return;
    const playerWon =
      (game.isCheckmate() && game.turn() === "b") ||
      (resigned === "b");
    if (playerWon && !beatenIds.includes(aiOpponent.id)) {
      const updated = [...beatenIds, aiOpponent.id];
      setBeatenIds(updated);
      localStorage.setItem("chess-beaten", JSON.stringify(updated));
    }
  }, [game, resigned, aiEnabled, aiOpponent, beatenIds]);

  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setResigned(null);
    setAiRemark(null);
    setAiConfidence(null);
    setAiWasBlunder(false);
    setChaosMessage(null);
  };

  const handleMove = useCallback(
    (from: Square, to: Square) => {
      if (aiThinking) return false;
      if (aiEnabled && game.turn() === "b") return false;
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

  useEffect(() => {
    if (!aiEnabled || game.turn() !== "b" || game.isGameOver() || resigned || !aiOpponent) return;

    setAiThinking(true);
    setChaosMessage(null);
    const timeout = setTimeout(() => {
      // Roll for chaos event BEFORE the normal move
      const chaos = rollChaosEvent(game, aiOpponent.id);
      if (chaos) {
        setChaosMessage({ emoji: chaos.event.emoji, name: chaos.event.name, text: chaos.message });
        setAiRemark(null);
        setAiConfidence(null);
        setTick((t) => t + 1);
        // After chaos, still try to make a normal move if game isn't over
        if (!game.isGameOver()) {
          const chaosTimeout = setTimeout(() => {
            const aiResult = getBestMove(game, aiOpponent.depth, aiOpponent.elo);
            if (aiResult) {
              const result = game.move(aiResult.move);
              if (result) {
                setMoveHistory((prev) => [...prev, result.san]);
                setTick((t) => t + 1);
              }
            }
            setAiThinking(false);
          }, 1500); // delay after chaos for dramatic effect
          return () => clearTimeout(chaosTimeout);
        } else {
          setAiThinking(false);
        }
      } else {
        const aiResult = getBestMove(game, aiOpponent.depth, aiOpponent.elo);
        if (aiResult) {
          const result = game.move(aiResult.move);
          if (result) {
            setMoveHistory((prev) => [...prev, result.san]);
            setTick((t) => t + 1);
            const wasCapture = !!result.captured;
            setAiRemark(pickRemark(aiOpponent, game, wasCapture));
            setAiConfidence(aiResult.confidence);
            setAiWasBlunder(aiResult.wasBlunder);
          }
        }
        setAiThinking(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [game, aiEnabled, moveHistory, resigned, aiOpponent]);

  const handleReset = () => resetGame();

  const handleUndo = () => {
    if (aiEnabled) {
      game.undo();
      game.undo();
      setMoveHistory((prev) => prev.slice(0, -2));
    } else {
      game.undo();
      setMoveHistory((prev) => prev.slice(0, -1));
    }
    setAiRemark(null);
    setAiConfidence(null);
    setAiWasBlunder(false);
    setTick((t) => t + 1);
  };

  const handleResign = () => setResigned(game.turn());

  const handleBackToMenu = () => {
    setMode("menu");
    resetGame();
    setAiOpponent(null);
  };

  // Menu screen
  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <MainMenu onSelectMode={setMode} />
      </div>
    );
  }

  // AI picker screen
  if (mode === "ai-pick") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AIPicker
          beatenIds={beatenIds}
          onSelect={(opp) => {
            setAiOpponent(opp);
            resetGame();
            setMode("ai");
          }}
          onBack={() => setMode("menu")}
        />
      </div>
    );
  }

  // Game screen (ai or local)
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
      {/* Header with opponent info */}
      <div className="flex items-center gap-3">
        {aiEnabled && aiOpponent && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent shadow">
              <img src={aiOpponent.image} alt={aiOpponent.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                vs {aiOpponent.name}
              </h1>
              <p className="text-xs text-muted-foreground">ELO {aiOpponent.elo} · {aiOpponent.title}</p>
            </div>
          </div>
        )}
        {!aiEnabled && (
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">♚ Local Match</h1>
        )}
      </div>

      {/* AI speech bubble */}
      {aiEnabled && aiOpponent && (aiRemark || aiConfidence !== null) && (
        <div className="flex items-start gap-2 max-w-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-accent shrink-0">
            <img src={aiOpponent.image} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="bg-card border border-border rounded-xl rounded-tl-none px-3 py-2 shadow-lg space-y-1.5">
            {aiRemark && <p className="text-sm text-foreground italic">{aiRemark}</p>}
            {aiConfidence !== null && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      aiWasBlunder ? "bg-destructive" : aiConfidence > 70 ? "bg-accent" : aiConfidence > 40 ? "bg-primary" : "bg-muted-foreground"
                    }`}
                    style={{ width: `${aiConfidence}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold ${
                  aiWasBlunder ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {aiWasBlunder ? "YOLO 🎲" : `${aiConfidence}%`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative">
          <ChessBoard game={game} onMove={handleMove} />
          {aiThinking && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/10 rounded-lg">
              <span className="bg-card px-4 py-2 rounded-lg shadow-lg text-foreground font-semibold animate-pulse">
                {aiOpponent?.name} is thinking...
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
          aiOpponent={aiOpponent}
          onBackToMenu={handleBackToMenu}
          aiThinking={aiThinking}
        />
      </div>
    </div>
  );
};

export default Index;