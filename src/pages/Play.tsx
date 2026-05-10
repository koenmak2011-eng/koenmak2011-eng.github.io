import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import GameRunner, { type GameSpec } from "@/components/community/GameRunner";
import { Button } from "@/components/ui/button";
import { addCrowns } from "@/lib/crowns";
import { toast } from "sonner";

export default function Play() {
  const { id } = useParams();
  const [row, setRow] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [won, setWon] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("community_creations").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error) setErr(error.message); else setRow(data);
      if (data) supabase.from("community_creations").update({ plays: (data.plays ?? 0) + 1 }).eq("id", id).then(() => {});
    });
  }, [id]);

  async function like() {
    if (!row) return;
    await supabase.from("community_creations").update({ likes: (row.likes ?? 0) + 1 }).eq("id", row.id);
    setRow({ ...row, likes: (row.likes ?? 0) + 1 });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-accent">← Arcade</Link>
          <Link to="/create" className="text-xs text-accent hover:underline">+ Build your own</Link>
        </div>
        {err && <p className="text-destructive">{err}</p>}
        {!row && !err && <p className="text-muted-foreground">Loading…</p>}
        {row && (
          <>
            <header className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">by {row.author_name}</p>
              <h1 className="text-3xl font-black">{row.title}</h1>
              {row.description && <p className="text-sm text-muted-foreground mt-1">{row.description}</p>}
            </header>
            <GameRunner
              spec={row.content as GameSpec}
              onWin={(s) => { if (won) return; setWon(true); const reward = 50 + Math.floor((s || 0) / 2); addCrowns(reward); toast.success(`+${reward} 👑`); }}
            />
            <div className="flex gap-2 justify-center text-sm">
              <Button variant="outline" size="sm" onClick={like}>❤️ {row.likes ?? 0}</Button>
              <span className="px-3 py-1 text-xs text-muted-foreground self-center">▶️ {row.plays ?? 0} plays</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
