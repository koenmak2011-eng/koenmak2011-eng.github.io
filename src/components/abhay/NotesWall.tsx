import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PixelCanvas, { emptyArt } from "./PixelCanvas";
import { toast } from "sonner";

interface Note {
  id: string;
  nickname: string;
  message: string;
  pixel_art: (string | null)[] | null;
  created_at: string;
}

interface Props {
  canPost?: boolean;
}

const NotesWall = ({ canPost = false }: Props) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState(() => localStorage.getItem("abhay-nick") || "");
  const [message, setMessage] = useState("");
  const [art, setArt] = useState<(string | null)[]>(() => emptyArt());
  const [includeArt, setIncludeArt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("abhay_notes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!mounted) return;
      if (error) toast.error("Couldn't load wall: " + error.message);
      else setNotes((data as any) || []);
      setLoading(false);
    })();

    const channel = supabase
      .channel("abhay-notes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "abhay_notes" },
        (payload) => {
          setNotes((prev) => [payload.new as Note, ...prev].slice(0, 100));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Word counter (max 100 words, per spec)
  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;
  const tooManyWords = wordCount > 100;

  const submit = async () => {
    if (!nickname.trim() || !message.trim()) {
      toast.error("Need a nickname and a message");
      return;
    }
    if (tooManyWords) {
      toast.error("100 words max");
      return;
    }
    setSubmitting(true);
    localStorage.setItem("abhay-nick", nickname.trim());
    const { error } = await supabase.from("abhay_notes").insert({
      nickname: nickname.trim().slice(0, 24),
      message: message.trim().slice(0, 600),
      pixel_art: includeArt ? art : null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't post: " + error.message);
      return;
    }
    toast.success("Note posted to the wall.");
    setMessage("");
    setArt(emptyArt());
    setIncludeArt(false);
  };

  return (
    <div className="space-y-4">
      {canPost && (
        <div className="border-2 border-accent bg-accent/5 rounded-2xl p-4 space-y-3">
          <h3 className="font-black text-lg">🏆 Leave your mark</h3>
          <Input
            placeholder="Your name (max 24 chars)"
            maxLength={24}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <Textarea
            placeholder="Your message — max 100 words. Anything goes."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <div className="flex justify-between text-[10px]">
            <span className={tooManyWords ? "text-destructive font-bold" : "text-muted-foreground"}>
              {wordCount}/100 words
            </span>
            <button
              type="button"
              onClick={() => setIncludeArt((v) => !v)}
              className="font-bold text-accent hover:underline"
            >
              {includeArt ? "✕ remove pixel art" : "+ add 16x16 pixel art"}
            </button>
          </div>
          {includeArt && (
            <div className="flex justify-center">
              <PixelCanvas value={art} onChange={setArt} />
            </div>
          )}
          <Button onClick={submit} disabled={submitting || tooManyWords} className="w-full">
            {submitting ? "Posting..." : "📌 Post to the wall"}
          </Button>
        </div>
      )}

      <div>
        <h3 className="font-black mb-2 text-sm">📜 The Wall ({notes.length})</h3>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No one has beaten Abhay yet. Be the first.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {notes.map((n) => (
              <div key={n.id} className="bg-card border border-border rounded-xl p-3 break-words">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="font-black text-sm truncate">{n.nickname}</span>
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs whitespace-pre-wrap mb-2">{n.message}</p>
                {n.pixel_art && Array.isArray(n.pixel_art) && (
                  <div className="flex justify-center">
                    <PixelCanvas value={n.pixel_art} onChange={() => {}} readOnly cellPx={10} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesWall;
