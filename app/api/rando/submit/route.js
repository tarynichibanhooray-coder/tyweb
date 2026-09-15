// app/api/rando/submit/route.js
import { NextResponse } from 'next/server';
import createServerSupabaseClient from '../../../lib/supabaseClient.server';
import { countGraphemes } from '../../../lib/grapheme';
import rateLimiter from '../../../lib/rateLimiter';
import { MAX_SENTENCE_LENGTH } from '../../../lib/randoConfig';

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    if (!rateLimiter.allow(ip)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const text = (body?.text || '').toString().trim();

    if (!text) return NextResponse.json({ error: 'empty' }, { status: 400 });

    if (countGraphemes(text) > MAX_SENTENCE_LENGTH) {
      return NextResponse.json({ error: 'too_long' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('sentences')
      .insert([{ text }]);

    if (error) {
      console.error('supabase insert error', error);
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('unexpected error in /api/rando/submit', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
