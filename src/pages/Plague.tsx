import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DISEASE_TYPES, EVOLUTIONS, ACHIEVEMENTS } from "@/lib/plague/data";
import {
  PlagueState,
  canEvolve,
  clearSave,
  computeStats,
  devolve,
  evolve,
  infectStart,
  loadAchievements,
  loadGame,
  loadWonTypes,
  makeInitialState,
  markTypeWon,
  mergeAchievements,
  saveGame,
  tick,
} from "@/lib/plague/engine";
import { addCrowns } from "@/lib/crowns";
import type { DiseaseType, EvolutionCategory } from "@/lib/plague/types";
import { WorldMap } from "@/components/plague/WorldMap";
import { toast } from "sonner";

type Phase = "menu" | "pickType" | "pickStart" | "play";

const Plague = () => {
  const [phase, setPhase] = useState<Phase>("menu");
  const [type, setType] = useState<DiseaseType | null>(null);
  const [name, setName] = useState("Capybara-19");
  const [state, setState] = useState<PlagueState | null>(null);
  const [tab, setTab] = useState<EvolutionCategory>("transmission");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const tickRef = useRef<number | null>(null);
  const wonTypes = loadWonTypes();
  const allAch = loadAchievements();

  // Tick loop
  useEffect(() => {
    if (!state || !type || state.paused || state.ended) return;
    const ms = 700 / state.speed;
    tickRef.current = window.setInterval(() => {
      setState((s) => (s ? tick(s, type) : s));
    }, ms);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [state?.paused, state?.speed, state?.ended, type]);

  // Autosave
  useEffect(() => { if (state) saveGame(state); }, [state]);

  // End handling
  useEffect(() => {
    if (!state || !state.ended) return;
    mergeAchievements(state.achievements);
    if (state.ended === "win") {
      markTypeWon(state.typeId);
      const reward = 250 + Math.max(0, 400 - state.day);
      addCrowns(reward);
      toast.success(`💀 Humanity ended in ${state.day} days. +${reward} 👑`);
      // strain master?
      if (loadWonTypes().length === DISEASE_TYPES.length) {
        mergeAchievements(["all_types"]);
      }
    } else if (state.ended === "lose-cure") {
      toast.error("💊 The cure won. Humanity survived. Mid.");
    }
  }, [state?.ended]);

  function startNew(t: DiseaseType) {
    setType(t);
    setState(makeInitialState(t, name || `${t.name}-X`));
    setPhase("pickStart");
  }

  function pickStartCountry(id: string) {
    if (!state) return;
    setState(infectStart(state, id));
    setPhase("play");
  }

  function resume() {
    const saved = loadGame();
    if (!saved) return;
    const t = DISEASE_TYPES.find((d) => d.id === saved.typeId);
    if (!t) return;
    setType(t);
    setState({ ...saved, paused: true });
    setPhase(saved.patientZero ? "play" : "pickStart");
  }

  function quit() {
    if (state) saveGame(state);
    setPhase("menu");
  }

  function fullReset() {
    clearSave();
    setState(null);
    setType(null);
    setPhase("menu");
  }

  // ===== MENU =====
  if (phase === "menu") {
    const saved = loadGame();
    return (
      <Shell>
        <h1 className="text-5xl sm:text-6xl font-black text-center mb-2">☣️ Capybara Inc.</h1>
        <p className="text-center text-muted-foreground mb-8">Evolve a plague. End humanity. Mildly inconvenience the WHO.</p>
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <Button onClick={() => setPhase("pickType")} size="lg" className="text-lg">🦠 New Plague</Button>
          {saved && <Button onClick={resume} variant="secondary" size="lg">📂 Continue ({saved.diseaseName} · day {saved.day})</Button>}
          {saved && <Button onClick={fullReset} variant="destructive" size="sm">🗑 Delete save</Button>}
          <Link to="/" className="text-center text-sm text-muted-foreground hover:text-accent mt-4">← Back to Arcade</Link>
        </div>
        <Achievements />
      </Shell>
    );
  }

  // ===== TYPE PICKER =====
  if (phase === "pickType") {
    return (
      <Shell>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setPhase("menu")} className="text-sm text-muted-foreground hover:text-accent">← back</button>
          <h2 className="text-2xl sm:text-3xl font-black">Pick your strain</h2>
          <div className="w-12" />
        </div>
        <div className="mb-4">
          <label className="text-xs uppercase font-bold text-muted-foreground">Disease name</label>
          <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 30))} className="mt-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DISEASE_TYPES.map((t) => {
            const unlocked = !t.unlockBeatType || wonTypes.includes(t.unlockBeatType);
            return (
              <button
                key={t.id}
                onClick={() => unlocked && startNew(t)}
                disabled={!unlocked}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${
                  unlocked ? "border-border hover:border-accent hover:scale-[1.02] cursor-pointer bg-card" : "border-border/40 bg-muted/30 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{t.emoji}</span>
                  <div>
                    <div className="font-black text-lg">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.tagline}</div>
                  </div>
                  {wonTypes.includes(t.id) && <span className="ml-auto text-accent text-xs font-bold">✓ won</span>}
                </div>
                <div className="text-[11px] text-muted-foreground italic mt-2">{t.notes}</div>
                {!unlocked && (
                  <div className="text-[10px] mt-2 text-destructive font-bold">
                    🔒 Beat {DISEASE_TYPES.find((x) => x.id === t.unlockBeatType)?.name} first
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Shell>
    );
  }

  // ===== PICK STARTING COUNTRY =====
  if (phase === "pickStart" && state) {
    return (
      <Shell>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setPhase("pickType")} className="text-sm text-muted-foreground hover:text-accent">← back</button>
          <h2 className="text-2xl sm:text-3xl font-black">Patient Zero?</h2>
          <div className="w-12" />
        </div>
        <p className="text-center text-sm text-muted-foreground mb-4">Click a country on the map — that's where {state.diseaseName} begins.</p>
        <div className="bg-card border border-border rounded-xl p-2 mb-3">
          <WorldMap
            countries={state.countries}
            selectedId={selectedCountry}
            onSelect={(id) => setSelectedCountry(id)}
          />
        </div>
        {selectedCountry && (() => {
          const c = state.countries.find((x) => x.id === selectedCountry);
          if (!c) return null;
          return (
            <div className="flex items-center justify-between gap-3 bg-card border border-border rounded-xl p-3">
              <div>
                <div className="font-black text-lg">{c.emoji} {c.name}</div>
                <div className="text-xs text-muted-foreground">Pop {fmt(c.population)} · {c.climate} · {c.wealth}</div>
              </div>
              <Button onClick={() => pickStartCountry(c.id)}>Start here →</Button>
            </div>
          );
        })()}
      </Shell>
    );
  }

  // ===== PLAY =====
  if (phase === "play" && state && type) {
    const stats = computeStats(type, new Set(state.evolved));
    const totalPop = state.countries.reduce((s, c) => s + c.population, 0);
    const totalInf = state.countries.reduce((s, c) => s + c.infected, 0);
    const totalDead = state.countries.reduce((s, c) => s + c.dead, 0);
    const infectedCountries = state.countries.filter((c) => c.infected > 0 || c.dead > 0).length;
    const evosByCat = EVOLUTIONS.filter((e) => e.category === tab);

    return (
      <Shell wide>
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{type.emoji}</span>
            <div>
              <div className="font-black text-sm sm:text-base">{state.diseaseName}</div>
              <div className="text-[10px] text-muted-foreground">{type.name}</div>
            </div>
          </div>
          <div className="flex flex-col text-xs"><span className="text-muted-foreground">Day</span><span className="font-black text-base">{state.day}</span></div>
          <div className="flex flex-col text-xs"><span className="text-muted-foreground">DNA</span><span className="font-black text-base text-accent">🧬 {state.dna}</span></div>
          <div className="flex flex-col text-xs"><span className="text-muted-foreground">Infected</span><span className="font-black text-base">{fmt(totalInf)}</span></div>
          <div className="flex flex-col text-xs"><span className="text-muted-foreground">Dead</span><span className="font-black text-base text-destructive">{fmt(totalDead)}</span></div>
          <div className="flex flex-col text-xs"><span className="text-muted-foreground">Countries</span><span className="font-black text-base">{infectedCountries}/{state.countries.length}</span></div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setState({ ...state, paused: !state.paused })}>
              {state.paused ? "▶ Play" : "⏸ Pause"}
            </Button>
            {[1, 2, 4].map((s) => (
              <Button key={s} size="sm" variant={state.speed === s ? "default" : "outline"} onClick={() => setState({ ...state, speed: s as 1 | 2 | 4 })}>{s}x</Button>
            ))}
            <Button size="sm" variant="outline" onClick={quit}>Quit</Button>
          </div>
        </div>

        {/* Cure / awareness */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="flex justify-between text-xs mb-1"><span className="font-bold">💊 Cure progress</span><span>{Math.floor(state.cureProgress * 100)}%</span></div>
            <Progress value={state.cureProgress * 100} className="h-3" />
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="flex justify-between text-xs mb-1"><span className="font-bold">🌍 Global awareness</span><span>{Math.floor(state.globalAwareness * 100)}%</span></div>
            <Progress value={state.globalAwareness * 100} className="h-3" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT: countries */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-3">
            <h3 className="font-black mb-2 text-sm">🌍 Countries</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {state.countries.map((c) => {
                const infRatio = c.infected / Math.max(1, c.population);
                const deadRatio = c.dead / Math.max(1, c.population);
                const heat = Math.min(1, infRatio + deadRatio);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCountry(c.id === selectedCountry ? null : c.id)}
                    className={`text-left p-2 rounded-lg border-2 transition-all ${
                      selectedCountry === c.id ? "border-accent" : "border-border hover:border-accent/50"
                    }`}
                    style={{ background: `linear-gradient(90deg, hsl(var(--destructive) / ${heat * 0.4}) 0%, hsl(var(--card)) 100%)` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{c.emoji}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {c.airportOpen ? "✈️" : "🚫"}{c.seaportOpen ? "🚢" : "🚫"}{c.bordersOpen ? "🚧" : "🚫"}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold truncate">{c.name}</div>
                    <div className="text-[9px] text-muted-foreground">{c.climate}·{c.wealth}</div>
                    <div className="mt-1 h-1.5 w-full rounded bg-muted overflow-hidden flex">
                      <div className="bg-accent" style={{ width: `${infRatio * 100}%` }} />
                      <div className="bg-destructive" style={{ width: `${deadRatio * 100}%` }} />
                    </div>
                    {selectedCountry === c.id && (
                      <div className="text-[10px] mt-1 text-foreground space-y-0.5">
                        <div>Pop: {fmt(c.population)}</div>
                        <div>Infected: {fmt(c.infected)}</div>
                        <div>Dead: {fmt(c.dead)}</div>
                        <div>Awareness: {Math.floor(c.awareness * 100)}%</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: evolution + news */}
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-xl p-3">
              <h3 className="font-black mb-2 text-sm">🧬 Evolution</h3>
              <div className="flex gap-1 mb-2">
                {(["transmission", "symptom", "ability"] as EvolutionCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTab(cat)}
                    className={`flex-1 text-[10px] sm:text-xs py-1.5 rounded-lg font-bold capitalize ${
                      tab === cat ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >{cat}</button>
                ))}
              </div>
              <div className="space-y-1.5 max-h-[44vh] overflow-y-auto pr-1">
                {evosByCat.map((evo) => {
                  const owned = state.evolved.includes(evo.id);
                  const check = canEvolve(state, evo);
                  return (
                    <div key={evo.id} className={`p-2 rounded-lg border ${owned ? "border-accent bg-accent/10" : "border-border"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{evo.name}</div>
                          <div className="text-[10px] text-muted-foreground">{evo.description}</div>
                          {evo.requires && <div className="text-[9px] text-muted-foreground">needs: {evo.requires.join(", ")}</div>}
                        </div>
                        {owned ? (
                          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setState(devolve(state, evo.id))}>
                            Devolve
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!check.ok}
                            className="h-7 text-[10px]"
                            onClick={() => setState(evolve(state, evo))}
                          >🧬 {evo.cost}</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-3">
              <h3 className="font-black mb-2 text-sm">📊 Stats</h3>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <Stat label="Infect" value={stats.infectivity.toFixed(2)} />
                <Stat label="Severity" value={stats.severity.toFixed(2)} />
                <Stat label="Lethal" value={stats.lethality.toFixed(2)} />
                <Stat label="DrugRes" value={`${Math.floor(stats.drugResist * 100)}%`} />
                <Stat label="Hot" value={stats.climateRes.hot.toFixed(2)} />
                <Stat label="Cold" value={stats.climateRes.cold.toFixed(2)} />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-3">
              <h3 className="font-black mb-2 text-sm">📰 News</h3>
              <div className="text-[10px] space-y-1 max-h-40 overflow-y-auto">
                {[...state.newsTicker].reverse().map((n, i) => (
                  <div key={i}><span className="text-muted-foreground">D{n.day}:</span> {n.text}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* End overlay */}
        {state.ended && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-card border-2 border-accent rounded-2xl p-6 text-center">
              <div className="text-6xl mb-3">{state.ended === "win" ? "💀" : "💊"}</div>
              <h2 className="text-3xl font-black mb-2">
                {state.ended === "win" ? "Humanity ended." : "The cure won."}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {state.diseaseName} · {state.day} days · {fmt(totalDead)} dead
              </p>
              {state.achievements.length > 0 && (
                <div className="mb-4 text-xs">
                  🏆 Achievements: {state.achievements.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.emoji).join(" ")}
                </div>
              )}
              <div className="flex gap-2 justify-center">
                <Button onClick={() => { clearSave(); setPhase("pickType"); setState(null); setType(null); }}>New Plague</Button>
                <Button variant="outline" onClick={() => { clearSave(); setPhase("menu"); setState(null); setType(null); }}>Menu</Button>
              </div>
            </div>
          </div>
        )}
      </Shell>
    );
  }

  return null;
};

const Shell = ({ children, wide }: { children: React.ReactNode; wide?: boolean }) => (
  <div className="min-h-screen bg-background">
    <div className={`mx-auto px-3 sm:px-6 py-4 sm:py-6 ${wide ? "max-w-7xl" : "max-w-3xl"}`}>{children}</div>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted/40 rounded p-1.5 text-center">
    <div className="text-muted-foreground text-[9px] uppercase">{label}</div>
    <div className="font-black text-foreground">{value}</div>
  </div>
);

const Achievements = () => {
  const owned = new Set(loadAchievements());
  return (
    <div className="mt-10 max-w-2xl mx-auto">
      <h3 className="text-sm font-black mb-2 text-center">🏆 Achievements ({owned.size}/{ACHIEVEMENTS.length})</h3>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} className={`p-2 rounded-lg border text-center ${owned.has(a.id) ? "border-accent bg-accent/10" : "border-border opacity-50"}`} title={a.description}>
            <div className="text-xl">{a.emoji}</div>
            <div className="text-[9px] font-bold mt-0.5">{a.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

function fmt(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

export default Plague;
