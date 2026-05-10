import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GAME_SYSTEM = `You design tiny browser arcade games as JSON for the "Capybara Arcade" community builder.
Output ONLY valid JSON matching this schema (no markdown, no prose):
{
  "template": "clicker" | "reaction" | "quiz" | "memory" | "dodge",
  "title": string,
  "description": string,
  "theme": { "bg": "#hex", "fg": "#hex", "accent": "#hex", "emoji": "single emoji" },
  "config": object  // template-specific
}

Template configs:
- clicker: { "target": "emoji", "duration": seconds (5-60), "goal": clicks needed, "decoyEmojis": [emoji,...] }
- reaction: { "rounds": 1-10, "minDelay": ms, "maxDelay": ms }
- quiz: { "questions": [ { "q": str, "choices": [4 strings], "answer": 0-3 } ] (3-8 items) }
- memory: { "pairs": 4-12, "emojis": [emoji,...] (>= pairs distinct) }
- dodge: { "duration": 10-90, "spawnRate": ms (300-1500), "playerEmoji": emoji, "hazardEmoji": emoji, "coinEmoji": emoji }

Lean into goofy capybara/Arthur/Abhay/teddy bear humor. Be creative, kid-friendly silly, no profanity.`;

const AD_SYSTEM = `You design fake comedic "sponsored ads" for the Capybara Arcade.
Output ONLY valid JSON:
{
  "headline": string (max 60 chars),
  "tagline": string (max 120 chars),
  "bg": "#hex",
  "fg": "#hex",
  "emoji": "1-3 emojis",
  "fakeBrand": string (max 30 chars),
  "smallPrint": string (max 140 chars, parody disclaimer)
}
Tone: absurd infomercial / capybara cult / Arthur losing chess / Abhay teddy disco / pandemic parody. Kid-friendly silly.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { type, prompt } = await req.json();
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY missing");
    if (type !== "game" && type !== "ad") throw new Error("bad type");
    const sys = type === "game" ? GAME_SYSTEM : AD_SYSTEM;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: String(prompt || "surprise me").slice(0, 600) },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "Out of AI credits" }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      console.error("gateway", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
    return new Response(JSON.stringify({ content: parsed }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
