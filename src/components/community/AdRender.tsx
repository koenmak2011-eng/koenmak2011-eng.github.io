export type AdSpec = {
  headline: string;
  tagline?: string;
  bg?: string;
  fg?: string;
  emoji?: string;
  fakeBrand?: string;
  smallPrint?: string;
};

export default function AdRender({ ad }: { ad: AdSpec }) {
  return (
    <div
      className="rounded-2xl border-2 border-accent shadow-2xl p-6 text-center"
      style={{ background: ad.bg || "#1a1a2e", color: ad.fg || "#fff" }}
    >
      <div className="text-5xl mb-2">{ad.emoji || "📺"}</div>
      <p className="text-[10px] uppercase tracking-widest opacity-70">{ad.fakeBrand || "CapyCorp™"}</p>
      <h3 className="text-2xl font-black mt-1">{ad.headline}</h3>
      {ad.tagline && <p className="text-sm mt-2 opacity-90">{ad.tagline}</p>}
      {ad.smallPrint && <p className="text-[9px] mt-3 opacity-50 italic">{ad.smallPrint}</p>}
    </div>
  );
}
