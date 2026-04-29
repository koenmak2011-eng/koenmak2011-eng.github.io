import { useEffect, useState } from "react";
import { ensureAmericaPlaying, isAmericaActive, deactivateAmerica } from "@/lib/anthem";

// Mounts at the app root level (or each page); re-asserts anthem playback
// after navigation, and shows a subtle banner with a "stop" button.
const AmericaBanner = () => {
  const [active, setActive] = useState(isAmericaActive());

  useEffect(() => {
    const tick = () => {
      ensureAmericaPlaying();
      setActive(isAmericaActive());
    };
    tick();
    const t = setInterval(tick, 2000);
    return () => clearInterval(t);
  }, []);

  if (!active) return null;
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 bg-card border-2 border-destructive rounded-full px-3 py-1 shadow-lg flex items-center gap-2 text-[11px] font-black">
      <span>🇺🇸</span>
      <span className="text-destructive uppercase tracking-wider">America Mode</span>
      <button
        onClick={() => {
          deactivateAmerica();
          setActive(false);
        }}
        className="ml-1 text-muted-foreground hover:text-foreground"
        title="Stop the anthem"
      >
        ✕
      </button>
    </div>
  );
};

export default AmericaBanner;
