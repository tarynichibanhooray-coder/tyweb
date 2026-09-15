-- supabase/migrations/001_create_sentences.sql

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.sentences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Basic length check using char_length. NOTE: this is a pragmatic guard; for strict grapheme-cluster enforcement
-- consider validating/normalizing on the server and/or using ICU/grapheme functions in Postgres.
ALTER TABLE public.sentences
  ADD CONSTRAINT sentences_text_length CHECK (char_length(text) <= 60);
