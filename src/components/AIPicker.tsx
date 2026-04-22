import { AI_OPPONENTS, AIOpponent } from "@/data/aiOpponents";

interface AIPickerProps {
  onSelect: (opponent: AIOpponent) => void;
  onBack: () => void;
}

const eloColor = (elo: number) => {
  if (elo <= 600) return "text-board-move";
  if (elo <= 1000) return "text-accent";
  if (elo <= 1400) return "text-primary";
  if (elo <= 1800) return "text-destructive";
  return "text-destructive";
};

const AIPicker = ({ onSelect, onBack }: AIPickerProps) => {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground">Choose Your Opponent</h2>
      <p className="text-muted-foreground text-sm">Each foe grows fiercer. Choose wisely.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {AI_OPPONENTS.map((opp) => (
          <button
            key={opp.id}
            onClick={() => onSelect(opp)}
            className="group bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-3 hover:border-accent hover:shadow-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-secondary group-hover:border-accent transition-colors shadow-lg">
              <img
                src={opp.image}
                alt={opp.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-foreground text-lg leading-tight">{opp.name}</h3>
              <p className="text-xs text-muted-foreground italic">{opp.title}</p>
              <p className={`text-sm font-bold mt-1 ${eloColor(opp.elo)}`}>
                ELO {opp.elo}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center leading-snug">
              {opp.description}
            </p>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4 transition-colors mt-2"
      >
        ← Back to menu
      </button>
    </div>
  );
};

export default AIPicker;
