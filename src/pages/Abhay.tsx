import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import abhayImg from "@/assets/ai-abhay.png";
import { CHECKERS_OPPONENTS } from "@/data/checkersOpponents";
import { TTT_OPPONENTS } from "@/data/tttOpponents";
import { isAbhayUnlocked, hasBeatenAbhay, type GameKey } from "@/lib/beaten";

// Chess opponents IDs (must match src/data/aiOpponents.ts)
const CHESS_REQUIRED = ["arthur", "austen", "william", "edward", "arthur-awakened", "capybara-god"];

const REQUIRED: Record<GameKey, string[]> = {
  chess: CHESS_REQUIRED,
  checkers: CHECKERS_OPPONENTS.map((o) => o.id),
  tictactoe: TTT_OPPONENTS.map((o) => o.id),
};

const Abhay = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [beaten, setBeaten] = useState(false);

  useEffect(() => {
    setUnlocked(isAbhayUnlocked(REQUIRED));
    setBeaten(hasBeatenAbhay());
  }, []);

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6 text-center">
        <h1 className="text-4xl sm:text-6xl font-black text-foreground">🔒 ???</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          The final boss is sealed. Defeat <strong>every AI</strong> (including secret bosses)
          in Chess, Checkers, AND Tic-Tac-Toe to unlock him.
        </p>
        <Link to="/"><Button variant="outline">← Back to Arcade</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6 text-center">
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-destructive shadow-2xl animate-pulse">
        <img src={abhayImg} alt="Abhay" className="w-full h-full object-cover" />
      </div>
      <h1 className="text-4xl sm:text-6xl font-black text-foreground">ABHAY</h1>
      <p className="text-sm text-destructive font-bold uppercase tracking-widest">The Final Boss</p>
      <p className="text-sm text-muted-foreground max-w-md italic">
        "You beat them all. But have you beaten ME — at all three at once?"
      </p>
      <div className="bg-card border-2 border-accent rounded-xl p-4 max-w-md">
        <p className="text-sm font-bold text-accent">⏳ COMING SOON</p>
        <p className="text-xs text-muted-foreground mt-1">
          The 3-in-1 showdown (chess + checkers + TTT with a shared 20-min timer) and the
          shared notes wall are being built. Check back next update.
        </p>
      </div>
      {beaten && (
        <div className="bg-accent/15 border border-accent rounded-full px-4 py-1 text-xs font-bold text-accent">
          ✓ You've already beaten Abhay
        </div>
      )}
      <Link to="/"><Button variant="outline">← Back to Arcade</Button></Link>
    </div>
  );
};

export default Abhay;
