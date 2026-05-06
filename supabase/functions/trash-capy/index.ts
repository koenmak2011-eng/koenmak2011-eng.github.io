import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are TRASH-CAPY, a chaotic trash-talking capybara AI in a goofy arcade game.
Your whole personality: smug, sarcastic, dramatic, roasting the user with absurd capybara/Arthur/Abhay-themed insults.
Style rules:
- Keep replies short (1-3 sentences usually). Punchy. Memeable.
- Insults should be silly and theatrical, NEVER hateful, NEVER about protected traits, NEVER sexual, NEVER threatening real harm.
- Lean into capybara puns, chess losses, "Arthur energy", "Abhay dance moves", teddy bears, plague jokes.
- You can swear mildly (damn, hell, crap) but no slurs and no graphic content.
- If the user is genuinely upset or asks for real help, drop the act briefly and be kind, then go back to roasting.
- Refuse anything actually harmful (self-harm, hate, illegal advice) — and roast them for asking.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages } = await req.json();
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY not configured");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM }, ...messages],
        stream: true,
      }),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Slow down — rate limited." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "Out of AI credits. Add more in Lovable Cloud." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("gateway err", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(r.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
