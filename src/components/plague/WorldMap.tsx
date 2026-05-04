import { memo, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import type { Country } from "@/lib/plague/types";

const GEO_URL = "/countries-110m.json";

interface Props {
  countries: Country[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** When true, disables zoom/drag (useful in pickStart). */
  staticMap?: boolean;
}

// Map topojson feature names → our slugified ids (matches countries.generated.ts)
function nameToId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function colorFor(c: Country | undefined): string {
  if (!c) return "hsl(var(--muted))";
  const inf = c.infected / Math.max(1, c.population);
  const dead = c.dead / Math.max(1, c.population);
  if (dead > 0.001) {
    // dark red gradient
    const t = Math.min(1, dead * 3);
    return `hsl(0 70% ${Math.max(15, 35 - t * 20)}%)`;
  }
  if (inf > 0) {
    // orange→red heat
    const t = Math.min(1, inf * 8);
    const hue = 45 - t * 45; // 45 (yellow) → 0 (red)
    return `hsl(${hue} 85% ${55 - t * 15}%)`;
  }
  return "hsl(var(--card))";
}

export const WorldMap = memo(function WorldMap({ countries, selectedId, onSelect, staticMap }: Props) {
  const byId = useMemo(() => {
    const m = new Map<string, Country>();
    countries.forEach((c) => m.set(c.id, c));
    return m;
  }, [countries]);

  const map = (
    <Geographies geography={GEO_URL}>
      {({ geographies }) =>
        geographies.map((geo) => {
          const id = nameToId(geo.properties.name);
          const c = byId.get(id);
          const fill = colorFor(c);
          const isSelected = selectedId === id;
          return (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              onClick={() => c && onSelect?.(id)}
              style={{
                default: {
                  fill,
                  stroke: isSelected ? "hsl(var(--accent))" : "hsl(var(--border))",
                  strokeWidth: isSelected ? 1.2 : 0.4,
                  outline: "none",
                  cursor: c ? "pointer" : "default",
                },
                hover: {
                  fill: c ? "hsl(var(--accent) / 0.7)" : fill,
                  stroke: "hsl(var(--accent))",
                  strokeWidth: 1,
                  outline: "none",
                },
                pressed: { fill, outline: "none" },
              }}
            />
          );
        })
      }
    </Geographies>
  );

  return (
    <div className="w-full h-full bg-background rounded-lg overflow-hidden">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 155 }}
        width={900}
        height={460}
        style={{ width: "100%", height: "100%" }}
      >
        {staticMap ? map : <ZoomableGroup minZoom={1} maxZoom={6}>{map}</ZoomableGroup>}
      </ComposableMap>
    </div>
  );
});
