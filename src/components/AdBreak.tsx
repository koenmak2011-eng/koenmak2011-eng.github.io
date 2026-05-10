import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ad1 from "@/assets/ads/ad-capy-trick.jpg";
import ad2 from "@/assets/ads/ad-arthur-lost.jpg";
import ad3 from "@/assets/ads/ad-abhay-dance.jpg";
import ad4 from "@/assets/ads/ad-capy-pharma.jpg";

const ADS = [
  { src: ad1, tag: "CapyCorp™ — chess pieces sold separately" },
  { src: ad2, tag: "Arthur Recovery Hotline · 1-800-LOST" },
  { src: ad3, tag: "Abhay's Teddy Disco — every Friday in your nightmares" },
  { src: ad4, tag: "Side effects: pandemic. Consult your nearest capybara." },
];

interface Props {
  open: boolean;
  onClose: () => void;
  durationMs?: number;
}

const AdBreak = ({ open, onClose, durationMs = 4000 }: Props) => {
  const [ad] = useState(() => ADS[Math.floor(Math.random() * ADS.length)]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-3">
        <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          ▶ Sponsored break
        </div>
        <img
          src={ad.src}
          alt="Sponsored ad"
          className="w-full rounded-2xl border-2 border-accent shadow-2xl"
          width={768}
          height={512}
        />
        <p className="text-center text-xs text-muted-foreground italic">{ad.tag}</p>
        <div className="flex justify-center">
          <Button onClick={onClose} variant="default">Skip ad ✕</Button>
        </div>
      </div>
    </div>
  );
};

export default AdBreak;
