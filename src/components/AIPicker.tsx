import { AI_OPPONENTS, AIOpponent } from "@/data/aiOpponents";

interface AIPickerProps {
  onSelect: (opponent: AIOpponent) => void;
  onBack: () => void;
}

const eloColor = (elo: number) => {
  if (elo <= 300) return "text-muted-foreground";
  if (elo <= 600) return "text-board-move";
  if (elo <= 1000) return "text-accent";
  if (elo <= 1400) return "text-primary";
  if (elo <= 1800) return "text-destructive";
  return "text-destructive";
};

const tiltClasses = [
  "rotate-[-2deg]",
  "rotate-[1.5deg]",
  "rotate-[-1deg]",
  "rotate-[2deg]",
  "rotate-[-1.5deg]",
  "rotate-[0.5deg]",
];

const borderMeme = [
  "border-dashed",
  "border-dotted",
  "border-double",
  "border-dashed",
  "border-dotted",
  "border-double",
];

const AIPicker = ({ onSelect, onBack }: AIPickerProps) => {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl px-4">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
          ⚔️ PICK YOUR VICTIM ⚔️
        </h2>
        <p className="text-muted-foreground text-sm mt-1 italic">
          (or the one who will destroy you, depends on your skill tbh)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
        {AI_OPPONENTS.map((opp, i) => (
          <button
            key={opp.id}
            onClick={() => onSelect(opp)}
            className={`
              group bg-card border-2 ${borderMeme[i % borderMeme.length]} border-border rounded-2xl p-5 
              flex flex-col items-center gap-3 
              hover:border-accent hover:shadow-2xl transition-all duration-300 
              hover:scale-105 hover:rotate-0 active:scale-95
              ${tiltClasses[i % tiltClasses.length]}
            `}
          >
            {/* ELO badge */}
            <div className={`absolute -top-2 -right-2 bg-secondary text-xs font-black px-2 py-1 rounded-full border border-border shadow ${eloColor(opp.elo)}`}>
              {opp.elo} ELO
            </div>

            {/* Avatar */}
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-secondary group-hover:border-accent transition-all shadow-xl group-hover:shadow-accent/30 rotate-[-3deg] group-hover:rotate-0">
              <img
                src={opp.image}
                alt={opp.name}
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name */}
            <div className="text-center">
              <h3 className="font-black text-foreground text-xl leading-tight uppercase tracking-wide">
                {opp.name}
              </h3>
              <p className="text-xs text-accent font-bold italic">~ {opp.title} ~</p>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {opp.description}
            </p>

            {/* Quote */}
            <p className="text-[11px] text-foreground/60 italic text-center font-medium">
              {opp.quote}
            </p>

            {/* Fight button */}
            <span className="mt-auto bg-primary text-primary-foreground text-xs font-black uppercase px-4 py-2 rounded-lg group-hover:bg-accent group-hover:text-accent-foreground transition-colors tracking-widest">
              FIGHT →
            </span>
          </button>
        ))}
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
