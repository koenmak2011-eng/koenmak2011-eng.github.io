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
import { PLAYER_CHAOS_OPTIONS, payMaterialCost } from "@/lib/playerChaos";
import { SFX } from "@/lib/sfx";
import bearBg from "@/assets/bear-background.jpg";

function pickRemark(opponent: AIOpponent | null, game: Chess, lastMoveWasCapture: boolean): string | null {
  if (!opponent) return null;
  const r = opponent.remarks;
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

function loadCrowns(): number {
  try { return parseInt(localStorage.getItem("chess-crowns") || "0", 10) || 0; } catch { return 0; }
}
function saveCrowns(c: number) { localStorage.setItem("chess-crowns", String(c)); }

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
  const [crowns, setCrowns] = useState(loadCrowns);
  const [chaosCredits, setChaosCredits] = useState(0);
  const [chaosActiveTurns, setChaosActiveTurns] = useState(0);
  const [playerChaosMsg, setPlayerChaosMsg] = useState<string | null>(null);
  const [beatenIds, setBeatenIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("chess-beaten") || "[]"); } catch { return []; }
  });
  const [gameAwarded, setGameAwarded] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  const aiEnabled = mode === "ai";

  // Track wins — award crowns exactly once per game
  useEffect(() => {
    if (!aiEnabled || !aiOpponent || gameAwarded) return;

    const checkmate = game.isCheckmate();
    // In chess.js, turn() returns the side who is TO MOVE — i.e. the side that lost on checkmate
    const playerWonByMate = checkmate && game.turn() === "b";
    const aiWonByMate = checkmate && game.turn() === "w";
    // resigned holds the colour that resigned
    const playerResigned = resigned === "w";
    const aiResigned = resigned === "b";

    const playerWon = playerWonByMate || aiResigned;
    const playerLost = aiWonByMate || playerResigned;

    if (playerWon) {
      setGameAwarded(true);
      setGameEnded(true);
      if (!beatenIds.includes(aiOpponent.id)) {
        const updated = [...beatenIds, aiOpponent.id];
        setBeatenIds(updated);
        localStorage.setItem("chess-beaten", JSON.stringify(updated));
      }
      setCrowns(prev => {
        const next = prev + aiOpponent.crownReward;
        saveCrowns(next);
        return next;
      });
      SFX.crown();
      SFX.win();
    } else if (playerLost) {
      setGameAwarded(true);
      setGameEnded(true);
      SFX.lose();
    }
  }, [game, resigned, aiEnabled, aiOpponent, beatenIds, gameAwarded]);

  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setResigned(null);
    setAiRemark(null);
    setAiConfidence(null);
    setAiWasBlunder(false);
    setChaosMessage(null);
    setChaosCredits(0);
    setChaosActiveTurns(0);
    setPlayerChaosMsg(null);
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
          if (result.captured) SFX.capture();
          else SFX.move();
          if (game.isCheck()) SFX.check();
          if (game.isCheckmate()) SFX.checkmate();
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

  // AI turn
  useEffect(() => {
    if (!aiEnabled || game.turn() !== "b" || game.isGameOver() || resigned || !aiOpponent) return;

    setAiThinking(true);
    setChaosMessage(null);
    setPlayerChaosMsg(null);

    // Apply player chaos if active
    if (chaosActiveTurns > 0) {
      setChaosActiveTurns(t => t - 1);
    }

    const timeout = setTimeout(() => {
      const chaos = rollChaosEvent(game, aiOpponent.id);
      if (chaos) {
        if (aiOpponent.id === "arthur-awakened" || aiOpponent.id === "capybara-god") SFX.nuke();
        else SFX.chaos();
        setChaosMessage({ emoji: chaos.event.emoji, name: chaos.event.name, text: chaos.message });
        setAiRemark(null);
        setAiConfidence(null);
        setTick((t) => t + 1);
        if (!game.isGameOver()) {
          const chaosTimeout = setTimeout(() => {
            const aiResult = getBestMove(game, aiOpponent.depth, aiOpponent.elo);
            if (aiResult) {
              const result = game.move(aiResult.move);
              if (result) {
                if (result.captured) SFX.capture();
                else SFX.move();
                if (game.isCheck()) SFX.check();
                setMoveHistory((prev) => [...prev, result.san]);
                setTick((t) => t + 1);
              }
            }
            setAiThinking(false);
          }, 1500);
          return () => clearTimeout(chaosTimeout);
        } else {
          setAiThinking(false);
        }
      } else {
        const aiResult = getBestMove(game, aiOpponent.depth, aiOpponent.elo);
        if (aiResult) {
          const result = game.move(aiResult.move);
          if (result) {
            if (result.captured) SFX.capture();
            else SFX.move();
            if (game.isCheck()) SFX.check();
            setMoveHistory((prev) => [...prev, result.san]);
            setTick((t) => t + 1);
            const wasCapture = !!result.captured;
            const remark = pickRemark(aiOpponent, game, wasCapture);
            setAiRemark(remark);
            if (remark) SFX.remark();
            setAiConfidence(aiResult.confidence);
            setAiWasBlunder(aiResult.wasBlunder);
          }
        }
        setAiThinking(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [game, aiEnabled, moveHistory, resigned, aiOpponent, chaosActiveTurns]);

  const handlePlayerChaos = (optionId: string) => {
    const opt = PLAYER_CHAOS_OPTIONS.find(o => o.id === optionId);
    if (!opt) return;
    SFX.gambling();
    const paid = payMaterialCost(game, opt.materialCost);
    if (!paid) return;
    const msg = opt.execute(game);
    SFX.playerChaos();
    setPlayerChaosMsg(msg);
    setChaosActiveTurns(t => t + opt.turnsGranted);
    setChaosCredits(c => c + opt.credits);
    setTick(t => t + 1);
    setTimeout(() => setPlayerChaosMsg(null), 3000);
  };

  const handleReset = () => resetGame();
  const handleUndo = () => {
    if (aiEnabled) { game.undo(); game.undo(); setMoveHistory(p => p.slice(0, -2)); }
    else { game.undo(); setMoveHistory(p => p.slice(0, -1)); }
    setAiRemark(null); setAiConfidence(null); setAiWasBlunder(false);
    setTick(t => t + 1);
  };
  const handleResign = () => setResigned(game.turn());
  const handleBackToMenu = () => { setMode("menu"); resetGame(); setAiOpponent(null); };

  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
          <img src={bearBg} alt="" className="w-full h-full object-cover" />
        </div>
        <MainMenu onSelectMode={setMode} crowns={crowns} />
      </div>
    );
  }

  if (mode === "ai-pick") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-2 sm:p-4">
        <AIPicker
          beatenIds={beatenIds}
          crowns={crowns}
          onSelect={(opp) => { setAiOpponent(opp); resetGame(); setMode("ai"); }}
          onBack={() => setMode("menu")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 gap-2 sm:gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        {aiEnabled && aiOpponent && (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-accent shadow">
              <img src={aiOpponent.image} alt={aiOpponent.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-tight">
                vs {aiOpponent.name}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">ELO {aiOpponent.elo} · {aiOpponent.title}</p>
            </div>
          </div>
        )}
        {!aiEnabled && (
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">♚ Local Match</h1>
        )}
      </div>

      {/* Chaos event banner */}
      {chaosMessage && (
        <div className="animate-in fade-in zoom-in-95 duration-500 max-w-sm sm:max-w-md w-full">
          <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-3 sm:p-4 text-center shadow-2xl">
            <p className="text-lg sm:text-2xl font-black text-destructive mb-1">
              {chaosMessage.emoji} {chaosMessage.name} {chaosMessage.emoji}
            </p>
            <p className="text-xs sm:text-sm text-foreground font-medium">{chaosMessage.text}</p>
          </div>
        </div>
      )}

      {/* Player chaos message */}
      {playerChaosMsg && (
        <div className="animate-in fade-in zoom-in-95 duration-300 max-w-sm w-full">
          <div className="bg-accent/10 border-2 border-accent rounded-xl p-3 text-center shadow-xl">
            <p className="text-sm font-bold text-accent">{playerChaosMsg}</p>
          </div>
        </div>
      )}

      {/* AI speech bubble */}
      {aiEnabled && aiOpponent && (aiRemark || aiConfidence !== null) && (
        <div className="flex items-start gap-2 max-w-xs sm:max-w-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-accent shrink-0">
            <img src={aiOpponent.image} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="bg-card border border-border rounded-xl rounded-tl-none px-2 sm:px-3 py-1.5 sm:py-2 shadow-lg space-y-1">
            {aiRemark && <p className="text-xs sm:text-sm text-foreground italic">{aiRemark}</p>}
            {aiConfidence !== null && (
              <div className="flex items-center gap-2">
                <div className="w-20 sm:w-24 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      aiWasBlunder ? "bg-destructive" : aiConfidence > 70 ? "bg-accent" : aiConfidence > 40 ? "bg-primary" : "bg-muted-foreground"
                    }`}
                    style={{ width: `${aiConfidence}%` }}
                  />
                </div>
                <span className={`text-[9px] sm:text-[10px] font-bold ${aiWasBlunder ? "text-destructive" : "text-muted-foreground"}`}>
                  {aiWasBlunder ? "YOLO 🎲" : `${aiConfidence}%`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center md:items-start gap-3 sm:gap-6">
        <div className="relative">
          <ChessBoard game={game} onMove={handleMove} />
          {aiThinking && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/10 rounded-lg">
              <span className="bg-card px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-lg text-foreground font-semibold animate-pulse text-sm sm:text-base">
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
          chaosCredits={chaosCredits}
          chaosActiveTurns={chaosActiveTurns}
          onPlayerChaos={handlePlayerChaos}
        />
      </div>

      {/* Crown reward toast on game over */}
      {aiEnabled && aiOpponent && (game.isCheckmate() && game.turn() === "b") && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-accent/20 border border-accent rounded-xl px-4 py-2 text-center">
          <p className="text-sm font-bold text-accent">👑 +{aiOpponent.crownReward} Crowns!</p>
        </div>
      )}
    </div>
  );
};

export default Index;
