import type { Country, DiseaseType, Evolution } from "./types";
import { COUNTRIES, EVOLUTIONS } from "./data";

export interface DiseaseStats {
  infectivity: number;
  severity: number;
  lethality: number;
  drugResist: number;
  climateRes: { hot: number; cold: number; humid: number; arid: number };
  wealthRes: { rich: number; poor: number };
}

export function computeStats(type: DiseaseType, evolved: Set<string>): DiseaseStats {
  const stats: DiseaseStats = {
    infectivity: type.baseInfectivity,
    severity: type.baseSeverity,
    lethality: type.baseLethality,
    drugResist: 0,
    climateRes: { hot: 0, cold: 0, humid: 0, arid: 0 },
    wealthRes: { rich: 0, poor: 0 },
  };
  for (const id of evolved) {
    const e = EVOLUTIONS.find((x) => x.id === id);
    if (!e) continue;
    stats.infectivity += e.infectivity || 0;
    stats.severity += e.severity || 0;
    stats.lethality += e.lethality || 0;
    stats.drugResist += e.drugResist || 0;
    stats.climateRes.hot += e.hot || 0;
    stats.climateRes.cold += e.cold || 0;
    stats.climateRes.humid += e.humid || 0;
    stats.climateRes.arid += e.arid || 0;
    stats.wealthRes.rich += e.rich || 0;
    stats.wealthRes.poor += e.poor || 0;
  }
  return stats;
}

export interface PlagueState {
  typeId: string;
  diseaseName: string;
  evolved: string[];        // evolution ids
  dna: number;
  countries: Country[];
  day: number;
  cureProgress: number;     // 0..1
  globalAwareness: number;  // 0..1, drives cure speed-up & gov actions
  newsTicker: { day: number; text: string }[];
  achievements: string[];
  patientZero?: string;     // country id
  ended?: "win" | "lose-cure" | "lose-extinct" | null;
  paused: boolean;
  speed: 1 | 2 | 4;
}

export function makeInitialState(type: DiseaseType, name: string): PlagueState {
  return {
    typeId: type.id,
    diseaseName: name,
    evolved: [],
    dna: type.startingDna,
    countries: COUNTRIES.map((c) => ({ ...c })),
    day: 0,
    cureProgress: type.id === "nano" ? 0.05 : 0,
    globalAwareness: 0,
    newsTicker: [{ day: 0, text: `🦠 New strain "${name}" detected somewhere on Earth.` }],
    achievements: [],
    paused: true,
    speed: 1,
    ended: null,
  };
}

export function infectStart(state: PlagueState, countryId: string): PlagueState {
  const next = { ...state, countries: state.countries.map((c) => ({ ...c })) };
  const c = next.countries.find((x) => x.id === countryId);
  if (!c) return state;
  c.infected = Math.max(1, Math.floor(c.population * 0.000001));
  next.patientZero = countryId;
  next.paused = false;
  next.newsTicker = [
    ...next.newsTicker,
    { day: 0, text: `📍 Patient Zero confirmed in ${c.name}.` },
  ];
  next.achievements = pushAch(next.achievements, "patient_zero");
  return next;
}

const FUNNY_NEWS = [
  "🥒 Cucumber prices fall 0.4%. Unrelated.",
  "🐻 Oliver Ware insists he is not a certified bear.",
  "🦫 Capybara seen at the WHO press conference.",
  "🎩 Edward claims his top hat protects against all known plagues.",
  "🥤 Daniel sponsored by Coca-Cola, refuses to comment.",
  "♟️ Arthur loses chess match. Cure delayed by sadness.",
  "📺 Reality TV: 'Married At First Plague' debuts.",
  "🪦 Funeral homes report 'a vibe shift'.",
  "🍔 McDonald's hiring. Apply now.",
  "🐔 KFC denies link to outbreak. Strongly. Several times.",
];

export function tick(state: PlagueState, type: DiseaseType): PlagueState {
  if (state.paused || state.ended) return state;
  const next: PlagueState = {
    ...state,
    countries: state.countries.map((c) => ({ ...c })),
    newsTicker: state.newsTicker.slice(-30),
  };
  next.day += 1;
  const stats = computeStats(type, new Set(next.evolved));

  let totalInfected = 0;
  let totalDead = 0;
  let totalAlive = 0;
  let infectedCountries = 0;

  // Local spread + deaths + cures
  for (const c of next.countries) {
    const alive = c.population - c.dead;
    totalAlive += alive;
    if (c.infected > 0 || c.dead > 0) infectedCountries++;
    if (c.infected > 0) {
      // climate / wealth modifier
      const climateMod = 1 + (stats.climateRes[c.climate] || 0);
      const wealthMod = 1 + (stats.wealthRes[c.wealth] || 0);
      const infectivity = Math.max(0.05, stats.infectivity) * climateMod * wealthMod;

      const susceptible = Math.max(0, alive - c.infected - c.cured);
      const newInfected = Math.min(
        susceptible,
        Math.floor(c.infected * infectivity * 0.0009 + infectivity * 50),
      );
      c.infected += newInfected;

      // deaths from lethality + severity
      const deathRate = stats.lethality * 0.00015 * (1 + stats.severity * 0.05);
      const newDead = Math.min(c.infected, Math.floor(c.infected * deathRate));
      c.infected -= newDead;
      c.dead += newDead;

      // awareness rises with severity & deaths
      const awarenessGain = stats.severity * 0.0008 + (newDead / Math.max(1, c.population)) * 200;
      c.awareness = Math.min(1, c.awareness + awarenessGain);

      // government actions when aware
      if (c.awareness > 0.3 && Math.random() < 0.05) c.airportOpen = false;
      if (c.awareness > 0.45 && Math.random() < 0.04) c.seaportOpen = false;
      if (c.awareness > 0.6 && Math.random() < 0.03) c.bordersOpen = false;

      // cure contribution from rich/aware countries
      const cureContribution =
        (c.wealth === "rich" ? 0.00012 : 0.00003) *
        c.awareness *
        type.cureSpeedMod *
        (1 - Math.min(0.85, stats.drugResist));
      next.cureProgress = Math.min(1, next.cureProgress + cureContribution);
    }
    totalInfected += c.infected;
    totalDead += c.dead;
  }

  // Global spread via airports / seaports / borders
  for (const src of next.countries) {
    if (src.infected < 50) continue;
    const infRatio = src.infected / Math.max(1, src.population);
    // airports
    if (src.airportOpen && stats.infectivity > 0.2 && Math.random() < 0.18 * infRatio + 0.01) {
      const targets = next.countries.filter((c) => c.id !== src.id && c.hasAirport && c.airportOpen && c.infected === 0);
      if (targets.length) {
        const t = targets[Math.floor(Math.random() * targets.length)];
        t.infected = 1;
        next.newsTicker.push({ day: next.day, text: `✈️ ${next.diseaseName} reaches ${t.name}.` });
      }
    }
    if (src.seaportOpen && Math.random() < 0.10 * infRatio + 0.005) {
      const targets = next.countries.filter((c) => c.id !== src.id && c.hasSeaport && c.seaportOpen && c.infected === 0);
      if (targets.length) {
        const t = targets[Math.floor(Math.random() * targets.length)];
        t.infected = 1;
        next.newsTicker.push({ day: next.day, text: `🚢 ${next.diseaseName} arrives in ${t.name}.` });
      }
    }
    if (src.bordersOpen && Math.random() < 0.20 * infRatio + 0.01) {
      const targets = src.borders
        .map((id) => next.countries.find((c) => c.id === id))
        .filter((c): c is Country => !!c && c.bordersOpen && c.infected === 0);
      if (targets.length) {
        const t = targets[Math.floor(Math.random() * targets.length)];
        t.infected = 1;
        next.newsTicker.push({ day: next.day, text: `🚧 ${next.diseaseName} crosses border into ${t.name}.` });
      }
    }
  }

  // Global awareness
  next.globalAwareness = Math.min(
    1,
    next.countries.reduce((sum, c) => sum + c.awareness, 0) / next.countries.length,
  );

  // DNA generation: from new infections + bubbles
  const dnaGain = 1 + Math.floor(infectedCountries / 6) + (Math.random() < 0.15 ? 1 : 0);
  next.dna += dnaGain;

  // Random funny news
  if (Math.random() < 0.04) {
    next.newsTicker.push({ day: next.day, text: FUNNY_NEWS[Math.floor(Math.random() * FUNNY_NEWS.length)] });
  }

  // Auto-mutation (free random evolutions for some types)
  if (Math.random() < type.mutationRate) {
    const candidates = EVOLUTIONS.filter(
      (e) => !next.evolved.includes(e.id) && (!e.requires || e.requires.every((r) => next.evolved.includes(r))),
    );
    if (candidates.length) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      next.evolved.push(pick.id);
      next.newsTicker.push({ day: next.day, text: `🧬 Auto-mutation: ${pick.name}.` });
    }
  }

  // Achievements
  if (totalDead > 0) next.achievements = pushAch(next.achievements, "first_blood");
  if (infectedCountries >= 10) next.achievements = pushAch(next.achievements, "globetrotter");
  const grn = next.countries.find((c) => c.id === "greenland");
  const ice = next.countries.find((c) => c.id === "iceland");
  if (grn && ice && grn.infected > 0 && ice.infected > 0) {
    next.achievements = pushAch(next.achievements, "frozen_strain");
  }

  // Win/lose checks
  if (next.cureProgress >= 1) {
    next.ended = "lose-cure";
    next.paused = true;
    next.achievements = pushAch(next.achievements, "cure_loser");
    next.newsTicker.push({ day: next.day, text: `💊 The cure has been distributed worldwide. You lose.` });
  } else if (totalAlive - totalDead <= 0 && totalDead > 0) {
    // shouldn't happen due to math, but defensive
    next.ended = "win";
    next.paused = true;
    next.newsTicker.push({ day: next.day, text: `💀 Humanity has been wiped out.` });
  } else {
    const totalPop = next.countries.reduce((s, c) => s + c.population, 0);
    if (totalDead >= totalPop * 0.999 && totalInfected === 0) {
      next.ended = "win";
      next.paused = true;
      next.achievements = pushAch(next.achievements, "extinction");
      if (next.day < 200) next.achievements = pushAch(next.achievements, "speedrun");
      if (!next.evolved.some((id) => EVOLUTIONS.find((e) => e.id === id)?.category === "symptom")) {
        next.achievements = pushAch(next.achievements, "silent_killer");
      }
      next.newsTicker.push({ day: next.day, text: `💀 Humanity has been wiped out by ${next.diseaseName}.` });
    }
    // win when all infected are dead with no susceptibles left? simpler: dead >= 99.9%
    if (totalDead >= totalPop * 0.999) {
      next.ended = "win";
      next.paused = true;
      next.achievements = pushAch(next.achievements, "extinction");
      if (next.day < 200) next.achievements = pushAch(next.achievements, "speedrun");
      if (!next.evolved.some((id) => EVOLUTIONS.find((e) => e.id === id)?.category === "symptom")) {
        next.achievements = pushAch(next.achievements, "silent_killer");
      }
    }
  }

  return next;
}

function pushAch(list: string[], id: string): string[] {
  return list.includes(id) ? list : [...list, id];
}

export function canEvolve(state: PlagueState, evo: Evolution): { ok: boolean; reason?: string } {
  if (state.evolved.includes(evo.id)) return { ok: false, reason: "Already evolved" };
  if (state.dna < evo.cost) return { ok: false, reason: "Not enough DNA" };
  if (evo.requires && !evo.requires.every((r) => state.evolved.includes(r))) {
    return { ok: false, reason: "Requires earlier evolutions" };
  }
  return { ok: true };
}

export function evolve(state: PlagueState, evo: Evolution): PlagueState {
  if (!canEvolve(state, evo).ok) return state;
  return {
    ...state,
    dna: state.dna - evo.cost,
    evolved: [...state.evolved, evo.id],
    newsTicker: [...state.newsTicker, { day: state.day, text: `🧬 Evolved: ${evo.name}` }].slice(-50),
  };
}

export function devolve(state: PlagueState, evoId: string): PlagueState {
  if (!state.evolved.includes(evoId)) return state;
  const evo = EVOLUTIONS.find((e) => e.id === evoId);
  // can't devolve if something requires it
  const blockers = EVOLUTIONS.filter((e) => state.evolved.includes(e.id) && e.requires?.includes(evoId));
  if (blockers.length) return state;
  return {
    ...state,
    evolved: state.evolved.filter((id) => id !== evoId),
    dna: state.dna + Math.floor((evo?.cost || 0) * 0.5),
    newsTicker: [...state.newsTicker, { day: state.day, text: `🧬 Devolved: ${evo?.name}` }].slice(-50),
  };
}

const SAVE_KEY = "plague-save";
export function saveGame(state: PlagueState) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}
export function loadGame(): PlagueState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlagueState;
    // Schema check: country list size must match current COUNTRIES (catches old 25-country saves)
    if (!parsed.countries || parsed.countries.length !== COUNTRIES.length) {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
}
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }

const TYPE_WIN_KEY = "plague-types-won";
export function loadWonTypes(): string[] {
  try { return JSON.parse(localStorage.getItem(TYPE_WIN_KEY) || "[]"); } catch { return []; }
}
export function markTypeWon(typeId: string) {
  const cur = loadWonTypes();
  if (!cur.includes(typeId)) {
    cur.push(typeId);
    localStorage.setItem(TYPE_WIN_KEY, JSON.stringify(cur));
  }
}

const ACH_KEY = "plague-achievements";
export function loadAchievements(): string[] {
  try { return JSON.parse(localStorage.getItem(ACH_KEY) || "[]"); } catch { return []; }
}
export function mergeAchievements(ids: string[]) {
  const cur = new Set(loadAchievements());
  ids.forEach((id) => cur.add(id));
  localStorage.setItem(ACH_KEY, JSON.stringify([...cur]));
}
