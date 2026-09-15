// lib/supabaseClient.browser.js
import { createClient } from '@supabase/supabase-js';

let client = null;

export function getBrowserSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // In dev this may be intentionally missing; throw a helpful error for debugging.
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  client = createClient(url, anon);
  return client;
}
