import { Button } from "@/components/ui/button";
import bearBg from "@/assets/bear-background.jpg";

export type GameMode = "menu" | "ai-pick" | "ai" | "local" | "online";

interface MainMenuProps {
  onSelectMode: (mode: GameMode) => void;
  crowns: number;
}

const MainMenu = ({ onSelectMode, crowns }: MainMenuProps) => {
  return (
    <div className="relative flex flex-col items-center gap-6 w-full max-w-md px-4">
      {/* Background bear */}
      <div className="absolute inset-0 -z-10 opacity-15 pointer-events-none overflow-hidden rounded-3xl">
        <img src={bearBg} alt="" className="w-full h-full object-cover" loading="lazy" width={1920} height={1080} />
      </div>

      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-2">
          ♚ Chess
        </h1>
        <p className="text-muted-foreground text-lg">Choose your battle</p>
        {/* Crown counter */}
        <div className="mt-3 inline-flex items-center gap-2 bg-card/80 backdrop-blur px-4 py-2 rounded-full border border-border shadow">
          <span className="text-xl">👑</span>
          <span className="font-black text-foreground text-lg">{crowns}</span>
          <span className="text-xs text-muted-foreground">crowns</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <Button
          onClick={() => onSelectMode("ai-pick")}
          className="h-16 sm:h-20 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
          variant="default"
        >
          <span className="text-xl sm:text-2xl mr-3">🤖</span>
          Play vs AI
        </Button>

        <Button
          onClick={() => onSelectMode("local")}
          className="h-16 sm:h-20 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
          variant="secondary"
        >
          <span className="text-xl sm:text-2xl mr-3">👥</span>
          Same Device (2 Players)
        </Button>

        <Button
          onClick={() => onSelectMode("online")}
          className="h-16 sm:h-20 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform opacity-60 cursor-not-allowed"
          variant="outline"
          disabled
        >
          <span className="text-xl sm:text-2xl mr-3">🌐</span>
          Online (Coming Soon)
        </Button>
      </div>

      {/* Bear sign text */}
      <p className="text-[10px] text-muted-foreground/50 italic mt-2">
        Oliver Ware is NOT a certified bear 🐻
      </p>
    </div>
  );
};

export default MainMenu;
