import { createClient } from '@supabase/supabase-js';

/**
 * Returns a singleton Supabase client for the browser.
 * Exports a named function getBrowserSupabase which your app imports.
 * Also exposes window.supabase for quick debugging.
 */
export function getBrowserSupabase() {
  if (typeof window === 'undefined') {
    // If called on the server, return null so server code doesn't try to use browser client.
    return null;
  }

  if (!window.__supabase_browser) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment');
    }

    window.__supabase_browser = createClient(url, key);
    // expose for debugging in DevTools
    window.supabase = window.__supabase_browser;
  }

  return window.__supabase_browser;
}

// Default export for compatibility if some files import default
export default getBrowserSupabase;
