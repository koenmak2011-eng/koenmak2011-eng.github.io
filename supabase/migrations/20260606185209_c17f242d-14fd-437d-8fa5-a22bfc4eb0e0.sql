
CREATE TABLE public.online_chess_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fen text NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves jsonb NOT NULL DEFAULT '[]'::jsonb,
  white_id text,
  black_id text,
  status text NOT NULL DEFAULT 'waiting',
  winner text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.online_chess_games TO anon, authenticated;
GRANT ALL ON public.online_chess_games TO service_role;

ALTER TABLE public.online_chess_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view online games" ON public.online_chess_games FOR SELECT USING (true);
CREATE POLICY "anyone can create online games" ON public.online_chess_games FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update online games" ON public.online_chess_games FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE public.online_chess_games REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_chess_games;
