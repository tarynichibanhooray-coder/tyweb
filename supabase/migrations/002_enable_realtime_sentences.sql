-- supabase/migrations/002_enable_realtime_sentences.sql

-- Add the sentences table to the supabase_realtime publication so that
-- postgres_changes (INSERT) events are actually broadcast to subscribed
-- clients. Without this, realtime channels join successfully but never
-- receive change events for this table.
ALTER PUBLICATION supabase_realtime ADD TABLE public.sentences;
