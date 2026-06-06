import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Chess, Square } from "chess.js";
import { supabase } from "@/integrations/supabase/client";
import ChessBoard from "@/components/ChessBoard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SFX } from "@/lib/sfx";

function getPlayerId(): string {
  let id = localStorage.getItem("online-chess-pid");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("online-chess-pid", id);
  }
  return id;
}

type Row = {
  id: string;
  fen: string;
  moves: string[];
  white_id: string | null;
  black_id: string | null;
  status: string;
  winner: string | null;
};

export default function OnlineChess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pid = useRef(getPlayerId()).current;
  const [row, setRow] = useState<Row | null>(null);
  const [game, setGame] = useState(new Chess());
  const [err, setErr] = useState<string | null>(null);
  const [, force] = useState(0);

  // Lobby: create a new game
  const createGame = async () => {
    const { data, error } = await supabase
      .from("online_chess_games")
      .insert({ white_id: pid, status: "waiting" })
      .select()
      .single();
    if (error) return toast.error(error.message);
    navigate(`/online/${data.id}`);
  };

  // Quick match: join an existing waiting game, else create one
  const quickMatch = async () => {
    // Find waiting games created in last 10 min, not by me
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: waitingGames } = await supabase
      .from("online_chess_games")
      .select("*")
      .eq("status", "waiting")
      .is("black_id", null)
      .neq("white_id", pid)
      .gt("created_at", tenMinAgo)
      .order("created_at", { ascending: true })
      .limit(5);

    if (waitingGames && waitingGames.length > 0) {
      // Try to claim one (race-safe via conditional update)
      for (const g of waitingGames) {
        const { data: claimed } = await supabase
          .from("online_chess_games")
          .update({ black_id: pid, status: "active" })
          .eq("id", g.id)
          .is("black_id", null)
          .select()
          .single();
        if (claimed) {
          toast.success("Opponent found!");
          navigate(`/online/${claimed.id}`);
          return;
        }
      }
    }

    // No one waiting — create and wait
    toast.message("No one waiting. Created a new game — sit tight!");
    await createGame();
  };


  // Load + subscribe
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const apply = (r: Row) => {
      if (cancelled) return;
      setRow(r);
      const g = new Chess();
      try {
        if (r.fen) g.load(r.fen);
      } catch {
        // ignore
      }
      setGame(g);
      force((n) => n + 1);
    };

    supabase
      .from("online_chess_games")
      .select("*")
      .eq("id", id)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setErr(error?.message || "Game not found");
          return;
        }
        const r = data as Row;
        // Auto-join as black if slot open and we're not white
        if (!r.black_id && r.white_id && r.white_id !== pid) {
          const { data: upd } = await supabase
            .from("online_chess_games")
            .update({ black_id: pid, status: "active" })
            .eq("id", id)
            .select()
            .single();
          if (upd) {
            apply(upd as Row);
            return;
          }
        }
        // Auto-claim white if both slots open (rare)
        if (!r.white_id) {
          const { data: upd } = await supabase
            .from("online_chess_games")
            .update({ white_id: pid })
            .eq("id", id)
            .select()
            .single();
          if (upd) {
            apply(upd as Row);
            return;
          }
        }
        apply(r);
      });

    const ch = supabase
      .channel(`online-chess-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "online_chess_games", filter: `id=eq.${id}` },
        (payload) => apply(payload.new as Row),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [id, pid]);

  const role: "white" | "black" | "spectator" = row
    ? row.white_id === pid
      ? "white"
      : row.black_id === pid
        ? "black"
        : "spectator"
    : "spectator";

  const myTurn = row && role !== "spectator" && row.status === "active" && (
    (game.turn() === "w" && role === "white") || (game.turn() === "b" && role === "black")
  );

  const handleMove = useCallback(
    (from: Square, to: Square) => {
      if (!row || !myTurn) return false;
      const probe = new Chess(game.fen());
      const piece = probe.get(from);
      const isPromotion =
        piece?.type === "p" &&
        ((piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1"));
      let result;
      try {
        result = probe.move({ from, to, promotion: isPromotion ? "q" : undefined });
      } catch {
        return false;
      }
      if (!result) return false;
      if (result.captured) SFX.capture();
      else SFX.move();
      if (probe.isCheck()) SFX.check();

      const newFen = probe.fen();
      const newMoves = [...(row.moves || []), result.san];
      let status = row.status;
      let winner: string | null = row.winner;
      if (probe.isCheckmate()) {
        status = "finished";
        winner = probe.turn() === "w" ? "black" : "white";
        SFX.checkmate();
      } else if (probe.isDraw() || probe.isStalemate()) {
        status = "finished";
        winner = "draw";
      }

      // Optimistic
      setGame(probe);
      setRow({ ...row, fen: newFen, moves: newMoves, status, winner });

      supabase
        .from("online_chess_games")
        .update({ fen: newFen, moves: newMoves, status, winner, updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .then(({ error }) => {
          if (error) toast.error("Sync failed: " + error.message);
        });

      return true;
    },
    [row, game, myTurn],
  );

  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied! Send it to a friend.");
    } catch {
      toast.message(url);
    }
  };

  // ---------- LOBBY ----------
  if (!id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div>
            <h1 className="text-4xl font-black mb-2">🌐 Online Chess</h1>
            <p className="text-muted-foreground">
              Get matched with a random player, or create a private match and share the link with a friend.
            </p>
          </div>
          <Button onClick={quickMatch} className="w-full h-16 text-lg font-bold">
            ⚡ Quick Match (Random Opponent)
          </Button>
          <Button onClick={createGame} variant="secondary" className="w-full h-14 text-base font-bold">
            🔗 Create Private Game
          </Button>
          <Link to="/chess">
            <Button variant="ghost" className="w-full">← Back to Chess Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
        <div>
          <p className="text-destructive font-bold mb-4">{err}</p>
          <Link to="/online"><Button>New Game</Button></Link>
        </div>
      </div>
    );
  }

  if (!row) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading game…</div>;
  }

  const waiting = row.status === "waiting";
  const flipped = role === "black";
  const turnLabel = game.turn() === "w" ? "White" : "Black";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-3 sm:p-4 gap-3">
      <div className="w-full max-w-xl flex items-center justify-between">
        <Link to="/chess" className="text-xs text-muted-foreground hover:text-accent">← Chess</Link>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Online Match</span>
        <Button size="sm" variant="outline" onClick={copyLink}>🔗 Share Link</Button>
      </div>

      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-black">
          {role === "white" ? "♔ You are White" : role === "black" ? "♚ You are Black" : "👁 Spectating"}
        </h1>
        {waiting && (
          <p className="text-sm text-accent font-bold mt-1 animate-pulse">
            Waiting for opponent… share the link!
          </p>
        )}
        {!waiting && row.status === "active" && (
          <p className="text-sm text-muted-foreground mt-1">
            {myTurn ? "Your turn" : `${turnLabel} to move`}
          </p>
        )}
        {row.status === "finished" && (
          <p className="text-base font-bold text-accent mt-1">
            {row.winner === "draw" ? "Draw!" : `${row.winner === "white" ? "White" : "Black"} wins!`}
          </p>
        )}
      </div>

      <div className={`${myTurn ? "" : "opacity-95"}`}>
        <ChessBoard game={game} onMove={handleMove} flipped={flipped} />
      </div>

      <div className="w-full max-w-xl bg-card border border-border rounded-lg p-3">
        <p className="text-xs font-bold text-muted-foreground mb-1">Moves</p>
        <p className="text-xs text-foreground break-words leading-relaxed">
          {row.moves.length ? row.moves.map((m, i) => `${i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ""} ${m}`).join(" ") : "—"}
        </p>
      </div>

      {waiting && (
        <Button onClick={copyLink} className="font-bold">📋 Copy invite link</Button>
      )}
    </div>
  );
}
