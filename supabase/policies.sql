ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_select ON public.sentences
  FOR SELECT USING (true);

CREATE POLICY allow_insert ON public.sentences
  FOR INSERT WITH CHECK (true);
