import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AdRender, { type AdSpec } from "@/components/community/AdRender";
import ad1 from "@/assets/ads/ad-capy-trick.jpg";
import ad2 from "@/assets/ads/ad-arthur-lost.jpg";
import ad3 from "@/assets/ads/ad-abhay-dance.jpg";
import ad4 from "@/assets/ads/ad-capy-pharma.jpg";

const BUILTIN = [
  { src: ad1, tag: "CapyCorp™ — chess pieces sold separately" },
  { src: ad2, tag: "Arthur Recovery Hotline · 1-800-LOST" },
  { src: ad3, tag: "Abhay's Teddy Disco — every Friday in your nightmares" },
  { src: ad4, tag: "Side effects: pandemic. Consult your nearest capybara." },
];

interface Props { open: boolean; onClose: () => void; }

const AdBreak = ({ open, onClose }: Props) => {
  const [communityAd, setCommunityAd] = useState<{ ad: AdSpec; author: string } | null>(null);
  const [builtin] = useState(() => BUILTIN[Math.floor(Math.random() * BUILTIN.length)]);
  const [useCommunity, setUseCommunity] = useState(false);

  useEffect(() => {
    if (!open) return;
    // 60% chance to try a community ad
    if (Math.random() < 0.6) {
      supabase
        .from("community_creations")
        .select("content, author_name")
        .eq("type", "ad")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => {
          if (data && data.length) {
            const pick = data[Math.floor(Math.random() * data.length)];
            setCommunityAd({ ad: pick.content as AdSpec, author: pick.author_name });
            setUseCommunity(true);
          }
        });
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-3">
        <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          ▶ Sponsored break {useCommunity && communityAd && `· by ${communityAd.author}`}
        </div>
        {useCommunity && communityAd ? (
          <AdRender ad={communityAd.ad} />
        ) : (
          <>
            <img src={builtin.src} alt="Sponsored ad" className="w-full rounded-2xl border-2 border-accent shadow-2xl" width={768} height={512} />
            <p className="text-center text-xs text-muted-foreground italic">{builtin.tag}</p>
          </>
        )}
        <div className="flex justify-center">
          <Button onClick={onClose} variant="default">Skip ad ✕</Button>
        </div>
      </div>
    </div>
  );
};

export default AdBreak;
