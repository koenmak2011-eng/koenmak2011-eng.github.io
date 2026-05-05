
CREATE TABLE public.abhay_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 24),
  message TEXT NOT NULL CHECK (char_length(message) <= 600),
  pixel_art JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.abhay_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read abhay notes"
  ON public.abhay_notes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can post abhay notes"
  ON public.abhay_notes FOR INSERT
  WITH CHECK (true);

CREATE INDEX abhay_notes_created_at_idx ON public.abhay_notes (created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.abhay_notes;
