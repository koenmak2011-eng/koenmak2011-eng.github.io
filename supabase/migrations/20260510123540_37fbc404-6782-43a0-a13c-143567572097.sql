CREATE TABLE public.community_creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('game','ad')),
  title text NOT NULL,
  description text,
  author_name text NOT NULL DEFAULT 'Anonymous Capybara',
  content jsonb NOT NULL,
  thumbnail_url text,
  plays integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creations"
  ON public.community_creations FOR SELECT USING (true);

CREATE POLICY "Anyone can create creations"
  ON public.community_creations FOR INSERT WITH CHECK (
    char_length(title) BETWEEN 1 AND 80
    AND char_length(coalesce(description,'')) <= 500
    AND char_length(author_name) BETWEEN 1 AND 40
  );

CREATE POLICY "Anyone can bump counters"
  ON public.community_creations FOR UPDATE USING (true)
  WITH CHECK (true);

CREATE INDEX idx_community_creations_type_created ON public.community_creations (type, created_at DESC);