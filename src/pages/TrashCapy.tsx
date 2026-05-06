import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "assistant"; content: string };

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trash-capy`;

const TrashCapy = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Oh look, another challenger. Try not to embarrass yourself like Arthur. Speak, peasant. 🦫" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setLoading(true);

    try {
      const resp = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      if (resp.status === 429) { setError("Slow down — rate limited."); setLoading(false); return; }
      if (resp.status === 402) { setError("Out of AI credits. Top up in Lovable Cloud."); setLoading(false); return; }
      if (!resp.ok || !resp.body) { setError("Capy choked. Try again."); setLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistant = "";
      let done = false;

      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((p) => p.map((m, i) => i === p.length - 1 ? { ...m, content: assistant } : m));
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e) {
      setError("Connection died. Capy fled.");
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9 }), 50);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4">
      <div className="w-full max-w-2xl flex flex-col gap-3 h-[90vh]">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black">🦫 Trash-Capy</h1>
          <Link to="/"><Button variant="ghost" size="sm">← Arcade</Button></Link>
        </header>
        <p className="text-[11px] text-muted-foreground">
          A chaotic AI capybara that roasts you. Theatrical, not actually mean.
        </p>

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-card border border-border rounded-2xl p-3 space-y-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {m.content || (loading && i === messages.length - 1 ? "..." : "")}
              </div>
            </div>
          ))}
        </div>

        {error && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded p-2">{error}</div>}

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Say something stupid to a capybara..."
            disabled={loading}
          />
          <Button onClick={send} disabled={loading || !input.trim()}>Send</Button>
        </div>
      </div>
    </div>
  );
};

export default TrashCapy;
