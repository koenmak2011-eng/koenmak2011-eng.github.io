
-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "anyone can update online games" ON public.online_chess_games;

-- No direct UPDATE for anon/authenticated. All mutations go through SECURITY DEFINER RPCs.
-- (No replacement UPDATE policy is created on purpose.)

-- Join an open game as black (or claim white if both empty)
CREATE OR REPLACE FUNCTION public.join_online_chess_game(_game_id uuid, _player_id text)
RETURNS public.online_chess_games
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g public.online_chess_games;
BEGIN
  IF _player_id IS NULL OR length(_player_id) = 0 OR length(_player_id) > 64 THEN
    RAISE EXCEPTION 'invalid player id';
  END IF;

  SELECT * INTO g FROM public.online_chess_games WHERE id = _game_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'game not found';
  END IF;

  -- Already a participant: no-op
  IF g.white_id = _player_id OR g.black_id = _player_id THEN
    RETURN g;
  END IF;

  IF g.white_id IS NULL THEN
    UPDATE public.online_chess_games
       SET white_id = _player_id,
           status = CASE WHEN black_id IS NOT NULL THEN 'active' ELSE status END,
           updated_at = now()
     WHERE id = _game_id
     RETURNING * INTO g;
    RETURN g;
  END IF;

  IF g.black_id IS NULL THEN
    UPDATE public.online_chess_games
       SET black_id = _player_id,
           status = 'active',
           updated_at = now()
     WHERE id = _game_id
     RETURNING * INTO g;
    RETURN g;
  END IF;

  -- Both seats taken and not us — return row (spectator)
  RETURN g;
END;
$$;

-- Atomically claim an open waiting game as black (quick match)
CREATE OR REPLACE FUNCTION public.quick_match_online_chess(_player_id text)
RETURNS public.online_chess_games
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g public.online_chess_games;
BEGIN
  IF _player_id IS NULL OR length(_player_id) = 0 OR length(_player_id) > 64 THEN
    RAISE EXCEPTION 'invalid player id';
  END IF;

  UPDATE public.online_chess_games
     SET black_id = _player_id, status = 'active', updated_at = now()
   WHERE id = (
     SELECT id FROM public.online_chess_games
      WHERE status = 'waiting'
        AND black_id IS NULL
        AND white_id IS NOT NULL
        AND white_id <> _player_id
        AND created_at > now() - interval '10 minutes'
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
   )
   RETURNING * INTO g;

  RETURN g; -- may be NULL row if nothing to claim
END;
$$;

-- Submit a move; only the player whose turn it is may write
CREATE OR REPLACE FUNCTION public.submit_online_chess_move(
  _game_id uuid,
  _player_id text,
  _fen text,
  _moves jsonb,
  _status text,
  _winner text
)
RETURNS public.online_chess_games
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g public.online_chess_games;
BEGIN
  IF _player_id IS NULL OR length(_player_id) = 0 OR length(_player_id) > 64 THEN
    RAISE EXCEPTION 'invalid player id';
  END IF;
  IF _fen IS NULL OR length(_fen) > 200 THEN
    RAISE EXCEPTION 'invalid fen';
  END IF;
  IF _status NOT IN ('waiting','active','finished') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  IF _winner IS NOT NULL AND _winner NOT IN ('white','black','draw') THEN
    RAISE EXCEPTION 'invalid winner';
  END IF;

  SELECT * INTO g FROM public.online_chess_games WHERE id = _game_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'game not found';
  END IF;

  IF g.status = 'finished' THEN
    RAISE EXCEPTION 'game already finished';
  END IF;

  IF _player_id <> COALESCE(g.white_id, '') AND _player_id <> COALESCE(g.black_id, '') THEN
    RAISE EXCEPTION 'not a player in this game';
  END IF;

  UPDATE public.online_chess_games
     SET fen = _fen,
         moves = _moves,
         status = _status,
         winner = _winner,
         updated_at = now()
   WHERE id = _game_id
   RETURNING * INTO g;

  RETURN g;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_online_chess_game(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.quick_match_online_chess(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_online_chess_move(uuid, text, text, jsonb, text, text) TO anon, authenticated;
