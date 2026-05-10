import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GameRunner, { type GameSpec } from "@/components/community/GameRunner";
import AdRender, { type AdSpec } from "@/components/community/AdRender";

type Mode = "ai" | "manual";
type Kind = "game" | "ad";

const TEMPLATES = [
  { id: "clicker",  label: "🎯 Tap the target", hint: "Click the right emoji before time runs out." },
  { id: "reaction", label: "⚡ Reaction time",   hint: "Wait for green, tap fast." },
  { id: "quiz",     label: "❓ Quiz",            hint: "Multiple-choice questions." },
  { id: "memory",   label: "🧠 Memory match",   hint: "Flip pairs of emojis." },
  { id: "dodge",    label: "🌵 Dodger",          hint: "Catch coins, dodge hazards." },
] as const;

const STARTER_GAME: Record<string, GameSpec> = {
  clicker:  { template: "clicker",  title: "Catch the Capy", description: "Tap only the capybaras!", theme: { bg: "#0f172a", fg: "#fff", accent: "#fb923c", emoji: "🦫" }, config: { target: "🦫", duration: 20, goal: 12, decoyEmojis: ["🐻","🦝","🐹"] } },
  reaction: { template: "reaction", title: "Capy Reflex",     description: "Tap when it goes green.", theme: { bg: "#1e293b", fg: "#fff", emoji: "⚡" }, config: { rounds: 5, minDelay: 800, maxDelay: 2500 } },
  quiz:     { template: "quiz",     title: "Capy Trivia",     description: "How well do you know capybaras?", theme: { bg: "#0f172a", fg: "#fff", emoji: "❓" }, config: { questions: [
    { q: "Capybaras are the world's largest…", choices: ["Rodent","Bear","Otter","Beaver"], answer: 0 },
    { q: "Capybaras love…", choices: ["Lava","Water","Snow","Sand"], answer: 1 },
    { q: "What's Arthur best at?", choices: ["Chess","Losing chess","Math","Cooking"], answer: 1 },
  ] } },
  memory:   { template: "memory",   title: "Capy Memory",     description: "Match the pairs.", theme: { bg: "#0f172a", fg: "#fff", emoji: "🧠" }, config: { pairs: 6, emojis: ["🦫","🐻","🦝","🦔","🐹","🦊"] } },
  dodge:    { template: "dodge",    title: "Capy Dodger",     description: "Catch coins, avoid cacti.", theme: { bg: "#0f172a", fg: "#fff", emoji: "🌵" }, config: { duration: 30, spawnRate: 700, playerEmoji: "🦫", hazardEmoji: "🌵", coinEmoji: "🪙" } },
};

const STARTER_AD: AdSpec = {
  headline: "CapyCola — now with extra capy",
  tagline: "Tastes like victory and slight regret.",
  bg: "#7c2d12", fg: "#fff", emoji: "🥤🦫", fakeBrand: "CapyCola™",
  smallPrint: "Side effects may include spontaneous chess losses.",
};

export default function Create() {
  const nav = useNavigate();
  const [kind, setKind] = useState<Kind>("game");
  const [mode, setMode] = useState<Mode>("ai");
  const [author, setAuthor] = useState(localStorage.getItem("capy_author") || "");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [template, setTemplate] = useState<GameSpec["template"]>("clicker");
  const [spec, setSpec] = useState<any>(STARTER_GAME.clicker);
  const [json, setJson] = useState(JSON.stringify(STARTER_GAME.clicker, null, 2));
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (author) localStorage.setItem("capy_author", author); }, [author]);

  function pickTemplate(t: GameSpec["template"]) {
    setTemplate(t);
    const s = STARTER_GAME[t];
    setSpec(s); setJson(JSON.stringify(s, null, 2));
    if (!title) setTitle(s.title);
  }

  function switchKind(k: Kind) {
    setKind(k);
    if (k === "ad") { setSpec(STARTER_AD); setJson(JSON.stringify(STARTER_AD, null, 2)); if (!title) setTitle(STARTER_AD.headline); }
    else { pickTemplate(template); }
  }

  async function generate() {
    if (!aiPrompt.trim()) { toast.error("Type what you want first!"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-creation", {
        body: { type: kind, prompt: aiPrompt },
      });
      if (error) throw error;
      const c = data?.content;
      if (!c) throw new Error("No content");
      setSpec(c); setJson(JSON.stringify(c, null, 2));
      if (kind === "game" && c.title) setTitle(c.title);
      if (kind === "ad" && c.headline) setTitle(c.headline);
      toast.success("Generated! Tweak it or publish 👇");
    } catch (e: any) {
      toast.error(e.message || "AI failed");
    } finally { setBusy(false); }
  }

  function applyManualJson() {
    try { const p = JSON.parse(json); setSpec(p); toast.success("Applied!"); }
    catch { toast.error("Invalid JSON"); }
  }

  async function publish() {
    if (!title.trim()) { toast.error("Need a title"); return; }
    if (!author.trim()) { toast.error("Need a name"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.from("community_creations").insert({
        type: kind,
        title: title.slice(0, 80),
        description: desc.slice(0, 500),
        author_name: author.slice(0, 40),
        content: spec,
      }).select().single();
      if (error) throw error;
      toast.success("Published to the arcade! 🎉");
      if (kind === "game") nav(`/play/${data.id}`); else nav("/");
    } catch (e: any) {
      toast.error(e.message || "Publish failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        <header className="flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-accent">← Arcade</Link>
          <h1 className="text-2xl sm:text-3xl font-black">🛠 Build a {kind}</h1>
          <span className="w-12" />
        </header>

        {/* Kind toggle */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant={kind === "game" ? "default" : "outline"} onClick={() => switchKind("game")}>🎮 Game</Button>
          <Button variant={kind === "ad" ? "default" : "outline"} onClick={() => switchKind("ad")}>📺 Ad</Button>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant={mode === "ai" ? "default" : "outline"} onClick={() => setMode("ai")}>🤖 AI helper</Button>
          <Button variant={mode === "manual" ? "default" : "outline"} onClick={() => setMode("manual")}>✋ Build it myself</Button>
        </div>

        {/* AI mode */}
        {mode === "ai" && (
          <div className="rounded-2xl border-2 border-border p-4 space-y-3 bg-card">
            <Label>Tell the capybara what to make</Label>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={kind === "game"
                ? "e.g. a memory game with chess pieces and Arthur faces"
                : "e.g. an ad for Abhay's teddy bear disco gym"}
              rows={3}
            />
            <Button onClick={generate} disabled={busy} className="w-full">{busy ? "Capybara thinking…" : "✨ Generate"}</Button>
          </div>
        )}

        {/* Manual mode */}
        {mode === "manual" && kind === "game" && (
          <div className="rounded-2xl border-2 border-border p-4 space-y-3 bg-card">
            <Label>Pick a template</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pickTemplate(t.id as GameSpec["template"])}
                  className={`text-left p-3 rounded-lg border-2 transition ${template === t.id ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"}`}
                >
                  <div className="font-bold text-sm">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.hint}</div>
                </button>
              ))}
            </div>
            <Label className="pt-2">Advanced (edit the JSON spec)</Label>
            <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={10} className="font-mono text-xs" />
            <Button variant="outline" onClick={applyManualJson} className="w-full">Apply JSON to preview</Button>
          </div>
        )}

        {mode === "manual" && kind === "ad" && (
          <div className="rounded-2xl border-2 border-border p-4 space-y-3 bg-card">
            <Label>Edit the ad (JSON)</Label>
            <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={10} className="font-mono text-xs" />
            <Button variant="outline" onClick={applyManualJson} className="w-full">Apply JSON to preview</Button>
          </div>
        )}

        {/* Preview */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Live preview</div>
          {kind === "game"
            ? <GameRunner spec={spec as GameSpec} />
            : <AdRender ad={spec as AdSpec} />}
        </div>

        {/* Publish */}
        <div className="rounded-2xl border-2 border-accent p-4 space-y-3 bg-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
            </div>
            <div>
              <Label>Your name</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={40} placeholder="Anonymous Capybara" />
            </div>
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={2} />
          </div>
          <Button onClick={publish} disabled={busy} className="w-full">{busy ? "Publishing…" : "🚀 Publish to the arcade"}</Button>
          <p className="text-[10px] text-muted-foreground text-center">Everyone in the arcade will see this. Be silly, be kind.</p>
        </div>
      </div>
    </div>
  );
}
