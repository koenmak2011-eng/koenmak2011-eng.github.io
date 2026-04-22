import { Button } from "@/components/ui/button";

export type GameMode = "menu" | "ai-pick" | "ai" | "local" | "online";

interface MainMenuProps {
  onSelectMode: (mode: GameMode) => void;
}

const MainMenu = ({ onSelectMode }: MainMenuProps) => {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md px-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-2">
          ♚ Chess
        </h1>
        <p className="text-muted-foreground text-lg">Choose your battle</p>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <Button
          onClick={() => onSelectMode("ai-pick")}
          className="h-20 text-lg font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
          variant="default"
        >
          <span className="text-2xl mr-3">🤖</span>
          Play vs AI
        </Button>

        <Button
          onClick={() => onSelectMode("local")}
          className="h-20 text-lg font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
          variant="secondary"
        >
          <span className="text-2xl mr-3">👥</span>
          Same Device (2 Players)
        </Button>

        <Button
          onClick={() => onSelectMode("online")}
          className="h-20 text-lg font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform opacity-60 cursor-not-allowed"
          variant="outline"
          disabled
        >
          <span className="text-2xl mr-3">🌐</span>
          Online (Coming Soon)
        </Button>
      </div>
    </div>
  );
};

export default MainMenu;
