import { useState } from "react";

// Small draggable-style corner YT player that loops the AI battle theme.
// Browsers block unmuted autoplay → starts muted, with a one-tap unmute.
// Only mounted while a player is in an active AI match.

const VIDEO_ID = "pNp0SFWS6xY";

interface Props {
  show: boolean;
}

const AiSongPlayer = ({ show }: Props) => {
  const [muted, setMuted] = useState(true);
  const [hidden, setHidden] = useState(false);

  if (!show || hidden) return null;

  const src = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&loop=1&playlist=${VIDEO_ID}&controls=0&modestbranding=1&playsinline=1&mute=${muted ? 1 : 0}`;

  return (
    <div className="fixed bottom-3 left-3 z-40 w-44 sm:w-56 bg-card border-2 border-accent rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 bg-accent/15">
        <span className="text-[10px] font-black text-accent uppercase tracking-wider">
          ♪ Battle Theme
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMuted((m) => !m)}
            className="text-xs font-bold hover:text-accent"
            aria-label={muted ? "Unmute" : "Mute"}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={() => setHidden(true)}
            className="text-xs font-bold hover:text-destructive"
            aria-label="Close player"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="aspect-video bg-black">
        {/* key forces reload on mute toggle */}
        <iframe
          key={muted ? "m" : "u"}
          src={src}
          title="Battle theme"
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          frameBorder={0}
        />
      </div>
      {muted && (
        <button
          onClick={() => setMuted(false)}
          className="w-full text-[10px] font-bold py-1 bg-accent text-accent-foreground hover:opacity-90"
        >
          ▶ TAP TO UNMUTE
        </button>
      )}
    </div>
  );
};

export default AiSongPlayer;
