import { useEffect, useState } from "react";

interface Props {
  event: { emoji: string; name: string; text: string } | null;
}

// Map event name to a visual style
function getStyle(name: string) {
  const n = name.toLowerCase();
  if (n.includes("nuke") || n.includes("nuclear")) return "nuke";
  if (n.includes("bite") || n.includes("board bite")) return "bite";
  if (n.includes("pterodactyl") || n.includes("nab")) return "pterodactyl";
  if (n.includes("jet") || n.includes("bomb") || n.includes("fighter")) return "jet";
  if (n.includes("oil") || n.includes("flood") || n.includes("capybara")) return "oil";
  if (n.includes("headphone") || n.includes("blast")) return "headphones";
  if (n.includes("math")) return "maths";
  return "generic";
}

const ChaosOverlay = ({ event }: Props) => {
  const [active, setActive] = useState<typeof event>(null);

  useEffect(() => {
    if (!event) return;
    setActive(event);
    const t = setTimeout(() => setActive(null), 2200);
    return () => clearTimeout(t);
  }, [event]);

  if (!active) return null;
  const style = getStyle(active.name);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Screen flash / shake background */}
      <div
        className={`absolute inset-0 ${
          style === "nuke" ? "animate-flash-white" : "animate-flash-red"
        }`}
      />

      {/* Per-event visual */}
      {style === "nuke" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-yellow-200 animate-nuke-bloom shadow-[0_0_120px_60px_rgba(255,200,0,0.9)]" />
          <div className="absolute text-7xl sm:text-9xl animate-rise-up">☢️</div>
        </div>
      )}

      {style === "bite" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[12rem] sm:text-[18rem] animate-bite-chomp drop-shadow-2xl">🦷</div>
        </div>
      )}

      {style === "pterodactyl" && (
        <div className="absolute inset-0 flex items-center" style={{ top: "30%" }}>
          <div className="text-7xl sm:text-9xl animate-fly-across drop-shadow-2xl">🦅</div>
        </div>
      )}

      {style === "jet" && (
        <>
          <div className="absolute inset-0 animate-shake" />
          <div className="absolute inset-0 flex items-start justify-start">
            <div className="text-7xl sm:text-9xl animate-swoop-down drop-shadow-2xl">✈️</div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl sm:text-[10rem] animate-rise-up">💥</div>
          </div>
        </>
      )}

      {style === "oil" && (
        <div className="absolute inset-0">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 text-5xl animate-oil-drip"
              style={{ left: `${(i * 7) % 100}%`, animationDelay: `${i * 0.08}s` }}
            >
              🛢️
            </div>
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl animate-rise-up">🦫</div>
          </div>
        </div>
      )}

      {style === "headphones" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-8xl sm:text-[10rem] animate-headphone-pulse drop-shadow-2xl">🎧</div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl animate-float-up"
              style={{
                left: `${20 + i * 8}%`,
                top: `${40 + (i % 3) * 10}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              🎵
            </div>
          ))}
        </div>
      )}

      {style === "maths" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-8xl animate-rise-up">🧮</div>
          {["π", "√", "∑", "∫", "x²", "+", "="].map((s, i) => (
            <div
              key={i}
              className="absolute text-5xl font-bold text-accent animate-float-up"
              style={{
                left: `${15 + i * 11}%`,
                top: `${30 + (i % 3) * 15}%`,
                animationDelay: `${i * 0.12}s`,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}

      {style === "generic" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-9xl animate-rise-up">{active.emoji}</div>
        </div>
      )}

      {/* Banner text */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center px-4">
        <div className="bg-destructive text-destructive-foreground px-6 py-3 rounded-xl font-black text-xl sm:text-3xl shadow-2xl animate-rise-up text-center">
          {active.emoji} {active.name} {active.emoji}
        </div>
      </div>
    </div>
  );
};

export default ChaosOverlay;
