import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import bearBg from "@/assets/bear-background.jpg";

interface Game {
  id: string;
  title: string;
  emoji: string;
  tagline: string;
  path: string;
  available: boolean;
  accent: string;
}

const GAMES: Game[] = [
  {
    id: "chess",
    title: "Chaos Chess",
    emoji: "♛",
    tagline: "Beat clueless Arthur, an awakened secret boss & gamble pieces for chaos.",
    path: "/chess",
    available: true,
    accent: "from-accent/30 to-primary/20",
  },
  {
    id: "tictactoe",
    title: "Tic-Tac-Toe",
    emoji: "⭕",
    tagline: "Quick 3-in-a-row matches against the AI.",
    path: "/tictactoe",
    available: true,
    accent: "from-primary/30 to-accent/10",
  },
  {
    id: "checkers",
    title: "Checkers",
    emoji: "🔴",
    tagline: "Random-image pieces. Win = 500 👑.",
    path: "/checkers",
    available: true,
    accent: "from-destructive/30 to-accent/10",
  },
];

import { loadCrowns, subscribeCrowns } from "@/lib/crowns";
import { VIDEOS } from "@/lib/videos";
import VideoCard from "@/components/VideoCard";

const GamesHub = () => {
  const [crowns, setCrowns] = useState(loadCrowns);
  useEffect(() => subscribeCrowns(setCrowns), []);
  const featured = VIDEOS[0];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <img src={bearBg} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 sm:py-14">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-3 py-1 mb-4">
            <span className="text-xs sm:text-sm font-bold text-accent">👑 {crowns} crowns</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-foreground tracking-tight">
            Game Arcade
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-xl mx-auto">
            Pick a game. Earn crowns. Unlock the oily ones.
          </p>
        </header>

        {/* Games grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {GAMES.map((game) => {
            const inner = (
              <div
                className={`relative h-full rounded-2xl border-2 ${
                  game.available
                    ? "border-border hover:border-accent cursor-pointer hover:scale-[1.02]"
                    : "border-border/40 cursor-not-allowed"
                } bg-gradient-to-br ${game.accent} bg-card p-6 sm:p-8 shadow-lg transition-all duration-200 overflow-hidden`}
              >
                <div className="absolute top-3 right-3">
                  {game.available ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                      Play
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                </div>
                <div className="text-6xl sm:text-7xl mb-4">{game.emoji}</div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground mb-1">{game.title}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{game.tagline}</p>
              </div>
            );
            return game.available ? (
              <Link key={game.id} to={game.path} className="block">{inner}</Link>
            ) : (
              <div key={game.id}>{inner}</div>
            );
          })}
        </div>

        {/* Featured video */}
        {featured && (
          <section className="mt-12">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">🎬 Featured Video</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">A clip from the Arcade vault.</p>
              </div>
              <Link to="/videos" className="text-xs sm:text-sm font-bold text-accent hover:underline">
                See all →
              </Link>
            </div>
            <VideoCard video={featured} compact />
          </section>
        )}

        <footer className="text-center mt-10 text-[10px] text-muted-foreground">
          Oliver Ware is not a certified bear. 🐻
        </footer>
      </div>
    </div>
  );
};

export default GamesHub;
