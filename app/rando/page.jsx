'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabaseClient.browser';
import { MIN_DISPLAY_DURATION_MS, MAX_SENTENCE_LENGTH } from '../../lib/randoConfig';

function mergeSentences(prev, incoming) {
  const byId = new Map(prev.map((s) => [s.id, s]));
  for (const row of incoming) {
    byId.set(row.id, { id: row.id, text: row.text, created_at: row.created_at });
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
}

// Each sentence's on-screen start time: its own arrival, unless the previous
// sentence's minimum-display slot hasn't ended yet — in which case it queues
// behind it. Purely a function of the (shared) sentence list, so every client
// computes the identical schedule without any per-client anchor.
function computeSchedule(sentences) {
  const schedule = [];
  let prevEnd = -Infinity;
  for (const s of sentences) {
    const start = Math.max(new Date(s.created_at).getTime(), prevEnd);
    schedule.push(start);
    prevEnd = start + MIN_DISPLAY_DURATION_MS;
  }
  return schedule;
}

export default function RandoPage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [sentences, setSentences] = useState([]); // full ordered history, oldest first
  const [now, setNow] = useState(() => Date.now());

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('sentences')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1000);
    if (error) {
      console.error('supabase fetch error', error);
      return;
    }
    setSentences((prev) => mergeSentences(prev, data || []));
  }, [supabase]);

  // initial history
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Subscribe to realtime inserts. A websocket push is the steady state, but
  // pushes only cover events that arrive while the channel is actually
  // connected — a drop (sleep, wifi blip, a backgrounded tab's heartbeat
  // timing out) silently loses whatever was inserted during the gap unless
  // we resync on reconnect. `hadDrop` tracks whether the channel has left
  // SUBSCRIBED since we last resynced, so we only refetch when there's
  // actually a gap to close, not on every push.
  useEffect(() => {
    const hadDrop = { current: false };

    const channel = supabase
      .channel('public:sentences')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sentences' },
        (payload) => {
          const row = payload?.new;
          if (!row) return;
          setSentences((prev) => mergeSentences(prev, [row]));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (hadDrop.current) {
            hadDrop.current = false;
            fetchHistory();
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          hadDrop.current = true;
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchHistory]);

  // Safety net: the browser's own online/offline signal can beat the
  // realtime heartbeat to detecting a drop, so resync there too.
  useEffect(() => {
    window.addEventListener('online', fetchHistory);
    return () => window.removeEventListener('online', fetchHistory);
  }, [fetchHistory]);

  // Shared clock tick. Forces a re-render every second so the derived active
  // slot (below) is re-evaluated against the current wall clock — the same
  // schedule + the same now means every client lands on the same sentence.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const schedule = useMemo(() => computeSchedule(sentences), [sentences]);
  let activeIndex = -1;
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i] <= now) activeIndex = i;
    else break;
  }
  // Clock-skew guard: if this client's clock reads slightly behind the
  // server's (so even the first slot looks like it hasn't started), still
  // show the earliest pending sentence rather than a blank state.
  if (activeIndex === -1 && sentences.length > 0) activeIndex = 0;
  const active = activeIndex >= 0 ? sentences[activeIndex] : null;
  const queueLength = sentences.length > 0 ? sentences.length - activeIndex - 1 : 0;

  // Submission
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    setError(null);
    const trimmed = (input || '').trim();
    if (!trimmed) return setError('empty');
    // Basic grapheme-length check on client for UX
    if (Array.from(trimmed).length > MAX_SENTENCE_LENGTH) return setError('too_long');
    setSubmitting(true);
    try {
      const res = await fetch('/api/rando/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || 'server_error');
      } else {
        setInput('');
        // Do not push to sentences here; rely on realtime subscription for canonical order
      }
    } catch (err) {
      console.error(err);
      setError('network');
    } finally {
      setSubmitting(false);
    }
  }

  const activeText = active ? active.text : '';

  return (
    <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', color: '#111' }}>
      <h1>Rando — shared realtime sentences</h1>
      <div style={{ marginBottom: 16 }}>
        <div style={{ borderRadius: 12, background: '#111', color: '#fff', padding: 24, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 'clamp(18px, 4vw, 48px)', textAlign: 'center' }}>
            {activeText || 'No sentences yet — submit one!'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Enter a sentence (max ${MAX_SENTENCE_LENGTH} characters)`}
          maxLength={MAX_SENTENCE_LENGTH}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', width: 420 }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
        <button onClick={submit} disabled={submitting} style={{ padding: '8px 12px', borderRadius: 8 }}>
          Submit
        </button>
      </div>

      <div style={{ marginTop: 12, color: '#666' }}>
        {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}
        <div>Queue length: {queueLength}</div>
        <div style={{ marginTop: 8 }}>Each sentence displays for a minimum of {MIN_DISPLAY_DURATION_MS / 1000} seconds.</div>
      </div>
    </div>
  );
}
