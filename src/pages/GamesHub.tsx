import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  {
    id: "plague",
    title: "Capybara Inc.",
    emoji: "☣️",
    tagline: "Evolve a plague. End humanity. 7 strains, 25 countries, achievements.",
    path: "/plague",
    available: true,
    accent: "from-destructive/40 to-primary/10",
  },
  {
    id: "capydash",
    title: "Capy Dash",
    emoji: "🟧",
    tagline: "One-button cube jumper. 5 levels, coin shop, neon spikes.",
    path: "/capydash",
    available: true,
    accent: "from-fuchsia-600/30 to-cyan-500/20",
  },
  {
    id: "trashcapy",
    title: "Trash-Capy AI",
    emoji: "🦫",
    tagline: "Chat a chaotic capybara that roasts you in real time.",
    path: "/trashcapy",
    available: true,
    accent: "from-amber-500/30 to-rose-600/10",
  },
];

import { loadCrowns, subscribeCrowns } from "@/lib/crowns";
import { VIDEOS } from "@/lib/videos";
import VideoCard from "@/components/VideoCard";
import { isAbhayUnlocked, subscribeBeaten, type GameKey } from "@/lib/beaten";
import { CHECKERS_OPPONENTS } from "@/data/checkersOpponents";
import { TTT_OPPONENTS } from "@/data/tttOpponents";
import abhayImg from "@/assets/ai-abhay.png";

const CHESS_REQUIRED = ["arthur", "austen", "william", "edward", "arthur-awakened", "capybara-god"];
const ABHAY_REQ: Record<GameKey, string[]> = {
  chess: CHESS_REQUIRED,
  checkers: CHECKERS_OPPONENTS.map((o) => o.id),
  tictactoe: TTT_OPPONENTS.map((o) => o.id),
};

const GamesHub = () => {
  const [crowns, setCrowns] = useState(loadCrowns);
  const [showSecretVideo, setShowSecretVideo] = useState(false);
  const [abhayReady, setAbhayReady] = useState(() => isAbhayUnlocked(ABHAY_REQ));
  useEffect(() => subscribeCrowns(setCrowns), []);
  useEffect(() => subscribeBeaten(() => setAbhayReady(isAbhayUnlocked(ABHAY_REQ))), []);
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

        {/* Final boss tile (visible always; locked state if not unlocked) */}
        <Link
          to="/abhay"
          className={`mt-6 block rounded-2xl border-2 p-6 transition-all relative overflow-hidden ${
            abhayReady
              ? "border-destructive bg-gradient-to-br from-destructive/30 to-accent/20 hover:scale-[1.01] animate-pulse"
              : "border-border/40 bg-card cursor-pointer opacity-70 hover:opacity-100"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-destructive shrink-0">
              {abhayReady ? (
                <img src={abhayImg} alt="Abhay" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-3xl">🔒</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                {abhayReady ? "ABHAY — Final Boss" : "??? — Sealed"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {abhayReady
                  ? "Three games. One timer. Twenty minutes. Win or vanish."
                  : "Defeat every AI in Chess, Checkers, and Tic-Tac-Toe to unlock."}
              </p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              abhayReady ? "bg-destructive/30 text-destructive" : "bg-muted text-muted-foreground"
            }`}>
              {abhayReady ? "Fight!" : "Locked"}
            </span>
          </div>
        </Link>

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
          <button
            onClick={() => setShowSecretVideo(true)}
            className="hover:text-accent transition-colors cursor-pointer"
          >
            Oliver Ware is not a certified bear. 🐻
          </button>
        </footer>
      </div>

      {showSecretVideo && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4"
          onClick={() => setShowSecretVideo(false)}
        >
          <div className="relative w-full max-w-md aspect-[9/16]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowSecretVideo(false)}
              className="absolute -top-10 right-0 text-foreground hover:text-accent text-sm font-bold"
            >
              ✕ close
            </button>
            <iframe
              src="https://www.youtube.com/embed/W2Fr1qxq9D4?autoplay=1"
              className="w-full h-full rounded-2xl border-2 border-accent shadow-2xl"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Secret video"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesHub;
