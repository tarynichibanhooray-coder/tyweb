import { createClient } from '@supabase/supabase-js';

export default function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  }

  // Use the service role key server-side only
  return createClient(url, key, {
    // avoid persisting sessions on server
    auth: { persistSession: false },
  });
}
