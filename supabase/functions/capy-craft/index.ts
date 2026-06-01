import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You combine two things into one new thing, in the chaotic universe of "Infinite Capy Craft" — a neal.fun-style infinite crafting game.

Rules:
- Output STRICT JSON: { "name": "...", "emoji": "..." }
- "name" is 1-3 words, Title Case, the resulting concept of combining the two inputs.
- "emoji" is exactly one emoji that best represents the result.
- Be creative, playful, sometimes absurd. Capybaras, memes, science, mythology, food, technology, pop culture all welcome.
- Same inputs MUST always produce the same output — be deterministic and obvious where possible (Water + Fire = Steam, Earth + Water = Mud).
- Never refuse. Never explain. JSON only.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { a, b } = await req.json();
    if (!a || !b) throw new Error("missing a/b");
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Canonical order so (a,b) == (b,a)
    const [x, y] = [a, b].sort((p: any, q: any) => p.name.localeCompare(q.name));
    const prompt = `Combine "${x.emoji} ${x.name}" + "${y.emoji} ${y.name}". Respond with JSON only.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "Out of AI credits" }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
    if (!r.ok) {
      console.error("gateway err", r.status, await r.text());
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { parsed = {}; }
    const name = (parsed.name || "Mystery").toString().slice(0, 40);
    const emoji = (parsed.emoji || "✨").toString().slice(0, 8);
    return new Response(JSON.stringify({ name, emoji }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
