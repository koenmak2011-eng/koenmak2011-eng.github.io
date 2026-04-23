import { AI_OPPONENTS, AIOpponent } from "@/data/aiOpponents";

interface AIPickerProps {
  onSelect: (opponent: AIOpponent) => void;
  onBack: () => void;
  beatenIds: string[];
  crowns: number;
}

const eloColor = (elo: number) => {
  if (elo <= 300) return "text-muted-foreground";
  if (elo <= 800) return "text-board-move";
  if (elo <= 1400) return "text-accent";
  if (elo <= 2000) return "text-primary";
  return "text-destructive";
};

const tiltClasses = [
  "rotate-[-2deg]",
  "rotate-[1.5deg]",
  "rotate-[-1deg]",
  "rotate-[2deg]",
  "rotate-[-1.5deg]",
  "rotate-[1deg]",
];

const borderMeme = [
  "border-dashed",
  "border-dotted",
  "border-double",
  "border-dashed",
  "border-dotted",
  "border-double",
];

const AIPicker = ({ onSelect, onBack, beatenIds, crowns }: AIPickerProps) => {
  const nonSecretIds = AI_OPPONENTS.filter(o => !o.locked).map(o => o.id);
  const allNonSecretBeaten = nonSecretIds.every(id => beatenIds.includes(id));

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-3xl px-2 sm:px-4">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">
          ⚔️ PICK YOUR VICTIM ⚔️
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 italic">
          (or the one who will destroy you, depends on your skill tbh)
        </p>
        <div className="mt-2 inline-flex items-center gap-2 bg-card/80 backdrop-blur px-3 py-1 rounded-full border border-border">
          <span>👑</span>
          <span className="font-black text-foreground">{crowns}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 w-full">
        {AI_OPPONENTS.map((opp, i) => {
          const isLockedByBeaten = opp.locked && !allNonSecretBeaten;
          const isLockedByCrowns = opp.lockedByCrowns ? crowns < opp.lockedByCrowns : false;
          const isLocked = isLockedByBeaten || isLockedByCrowns;
          const isBeaten = beatenIds.includes(opp.id);

          return (
            <button
              key={opp.id}
              onClick={() => !isLocked && onSelect(opp)}
              disabled={isLocked}
              className={`
                group relative bg-card border-2 ${borderMeme[i % borderMeme.length]} border-border rounded-xl sm:rounded-2xl p-3 sm:p-5 
                flex flex-col items-center gap-2 sm:gap-3 
                transition-all duration-300 
                ${isLocked
                  ? "opacity-50 cursor-not-allowed grayscale"
                  : "hover:border-accent hover:shadow-2xl hover:scale-105 hover:rotate-0 active:scale-95"
                }
                ${tiltClasses[i % tiltClasses.length]}
              `}
            >
              {isBeaten && (
                <div className="absolute -top-2 -left-2 bg-green-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-border shadow z-10">
                  ✓ BEATEN
                </div>
              )}

              <div className={`absolute -top-2 -right-2 bg-secondary text-[9px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-border shadow ${eloColor(opp.elo)}`}>
                {isLocked ? "???" : `${opp.elo} ELO`}
              </div>

              {/* Crown reward badge */}
              {!isLocked && (
                <div className="absolute top-6 sm:top-8 -right-1 text-[9px] font-bold text-foreground/60">
                  👑 {opp.crownReward}
                </div>
              )}

              <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 border-secondary group-hover:border-accent transition-all shadow-xl group-hover:shadow-accent/30 rotate-[-3deg] group-hover:rotate-0">
                {isLocked ? (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-2xl sm:text-4xl">
                    {isLockedByCrowns ? "👑" : "🔒"}
                  </div>
                ) : (
                  <img
                    src={opp.image}
                    alt={opp.name}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="text-center">
                <h3 className="font-black text-foreground text-sm sm:text-xl leading-tight uppercase tracking-wide">
                  {isLocked ? "???" : opp.name}
                </h3>
                <p className="text-[9px] sm:text-xs text-accent font-bold italic">
                  {isLockedByCrowns
                    ? `~ ${opp.lockedByCrowns} 👑 to unlock ~`
                    : isLockedByBeaten
                    ? "~ Beat everyone to unlock ~"
                    : `~ ${opp.title} ~`}
                </p>
              </div>

              <p className="text-[9px] sm:text-xs text-muted-foreground text-center leading-relaxed hidden sm:block">
                {isLocked ? "A mysterious challenger awaits..." : opp.description}
              </p>

              {!isLocked && (
                <p className="text-[9px] sm:text-[11px] text-foreground/60 italic text-center font-medium hidden sm:block">
                  {opp.quote}
                </p>
              )}

              <span className={`mt-auto text-[9px] sm:text-xs font-black uppercase px-2 sm:px-4 py-1 sm:py-2 rounded-lg tracking-widest ${
                isLocked
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
              }`}>
                {isLocked ? "LOCKED 🔒" : "FIGHT →"}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4 transition-colors mt-2"
      >
        ← nah take me back
      </button>
    </div>
  );
};

export default AIPicker;
