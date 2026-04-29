// Generic AI roster picker reused by Checkers & TTT (chess has its own
// fancier one; this is a slimmed cousin).

interface OpponentLike {
  id: string;
  name: string;
  title: string;
  elo: number;
  image: string;
  description: string;
  quote: string;
  locked?: boolean;
  lockedByCrowns?: number;
  crownReward: number;
}

interface Props<T extends OpponentLike> {
  opponents: T[];
  onSelect: (o: T) => void;
  onBack: () => void;
  beatenIds: string[];
  crowns: number;
  title: string;
}

const eloColor = (elo: number) => {
  if (elo <= 300) return "text-muted-foreground";
  if (elo <= 800) return "text-board-move";
  if (elo <= 1400) return "text-accent";
  if (elo <= 2000) return "text-primary";
  return "text-destructive";
};

function GenericAIPicker<T extends OpponentLike>({
  opponents,
  onSelect,
  onBack,
  beatenIds,
  crowns,
  title,
}: Props<T>) {
  const nonSecretIds = opponents.filter((o) => !o.locked).map((o) => o.id);
  const allNonSecretBeaten = nonSecretIds.every((id) => beatenIds.includes(id));

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-3xl px-2 sm:px-4">
      <div className="text-center">
        <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">{title}</h2>
        <div className="mt-2 inline-flex items-center gap-2 bg-card/80 backdrop-blur px-3 py-1 rounded-full border border-border">
          <span>👑</span>
          <span className="font-black text-foreground">{crowns}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 w-full">
        {opponents.map((opp) => {
          const isLockedByCrowns = opp.lockedByCrowns ? crowns < opp.lockedByCrowns : false;
          const isLockedByBeaten = opp.locked && !opp.lockedByCrowns && !allNonSecretBeaten;
          const isLocked = isLockedByBeaten || isLockedByCrowns;
          const isBeaten = beatenIds.includes(opp.id);

          return (
            <button
              key={opp.id}
              onClick={() => !isLocked && onSelect(opp)}
              disabled={isLocked}
              className={`group relative bg-card border-2 border-border rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col items-center gap-2 sm:gap-3 transition-all duration-300 ${
                isLocked
                  ? "opacity-50 cursor-not-allowed grayscale"
                  : "hover:border-accent hover:shadow-2xl hover:scale-105 active:scale-95"
              }`}
            >
              {isBeaten && (
                <div className="absolute -top-2 -left-2 bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-border shadow z-10">
                  ✓ BEATEN
                </div>
              )}
              <div
                className={`absolute -top-2 -right-2 bg-secondary text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full border border-border shadow ${eloColor(
                  opp.elo,
                )}`}
              >
                {isLocked ? "???" : `${opp.elo} ELO`}
              </div>
              <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-secondary group-hover:border-accent shadow-xl">
                {isLocked ? (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-2xl sm:text-4xl">
                    {isLockedByCrowns ? "👑" : "🔒"}
                  </div>
                ) : (
                  <img src={opp.image} alt={opp.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-black text-foreground text-sm sm:text-xl uppercase tracking-wide leading-tight">
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
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-relaxed hidden sm:block">
                {isLocked ? "A mysterious challenger awaits..." : opp.description}
              </p>
              <span
                className={`mt-auto text-[9px] sm:text-xs font-black uppercase px-2 sm:px-4 py-1 sm:py-2 rounded-lg tracking-widest ${
                  isLocked
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground group-hover:bg-accent group-hover:text-accent-foreground"
                }`}
              >
                {isLocked ? "LOCKED 🔒" : `FIGHT → +${opp.crownReward}👑`}
              </span>
            </button>
          );
        })}
      </div>
      <button
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4 mt-2"
      >
        ← back
      </button>
    </div>
  );
}

export default GenericAIPicker;
