export type DiseaseTypeId =
  | "bacteria"
  | "virus"
  | "fungus"
  | "parasite"
  | "prion"
  | "nano"
  | "bio";

export interface DiseaseType {
  id: DiseaseTypeId;
  name: string;
  emoji: string;
  tagline: string;
  // gameplay modifiers
  startingDna: number;
  baseInfectivity: number;   // multiplier
  baseSeverity: number;
  baseLethality: number;
  cureSpeedMod: number;      // <1 = slower cure
  mutationRate: number;      // chance per tick of free random evolution
  unlockBeatType?: DiseaseTypeId; // beat this type to unlock
  notes: string;
}

export type ClimateId = "hot" | "cold" | "humid" | "arid";
export type WealthId = "rich" | "poor";

export interface Country {
  id: string;
  name: string;
  emoji: string;
  population: number;
  climate: ClimateId;
  wealth: WealthId;
  hasAirport: boolean;
  hasSeaport: boolean;
  borders: string[]; // country ids
  // runtime
  infected: number;
  dead: number;
  cured: number;
  airportOpen: boolean;
  seaportOpen: boolean;
  bordersOpen: boolean;
  awareness: number; // 0..1 — has gov noticed?
}

export type EvolutionCategory = "transmission" | "symptom" | "ability";

export interface Evolution {
  id: string;
  name: string;
  category: EvolutionCategory;
  cost: number;        // DNA cost
  description: string;
  // effects (additive)
  infectivity?: number;
  severity?: number;
  lethality?: number;
  // climate/wealth resistances (additive 0..1)
  hot?: number;
  cold?: number;
  humid?: number;
  arid?: number;
  rich?: number;
  poor?: number;
  drugResist?: number; // slows cure
  requires?: string[]; // ids of evolutions needed
  // special
  devolveOnly?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
}
