# Rando realtime installation

This document describes how to set up and test the Rando realtime sentence installation added in feature/rando-realtime.

Overview
- /rando is a public page where anyone may submit a short sentence (<= 60 chars).
- Submissions are persisted to Supabase Postgres (table: public.sentences).
- Supabase Realtime broadcasts inserts; clients subscribe and maintain an application-level queue/state.
- No authentication is required for submission in this initial version.

Database migration
1. Ensure you have a Supabase project.
2. Run the SQL in supabase/migrations/001_create_sentences.sql using the Supabase SQL editor, or use the CLI:

   # requires supabase CLI installed and logged in
   npm run supabase:migrate

Environment variables
Create a local .env (or set in Vercel) with these values (do not commit secrets):

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

Running locally

1. npm install
2. npm run dev
3. Open http://localhost:3000/rando in two windows
4. Submit a sentence in one window — it should appear in the other via realtime subscription

Notes & TODOs
- Rate limiter is an in-memory fixed-window limiter (lib/rateLimiter.js). TODO: replace with a cross-instance store for production.
- DB enforces char_length(text) <= 60. Server-side validation uses grapheme-aware counting where possible; TODO: consider stricter DB-side grapheme enforcement if necessary.
- Do not commit SUPABASE_SERVICE_ROLE_KEY; set it as a server-only environment variable in Vercel.


