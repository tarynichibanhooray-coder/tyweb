// lib/supabaseClient.server.js
import { createClient } from '@supabase/supabase-js';

let serverSupabase = null;

export default function createServerSupabaseClient() {
  if (serverSupabase) return serverSupabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase server env vars. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  serverSupabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  return serverSupabase;
}
