// app/rando/page.jsx
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabaseClient.browser';
import { MIN_DISPLAY_DURATION_MS, MAX_SENTENCE_LENGTH } from '../../lib/randoConfig';

// Map DB rows to RandoEvent
function toEvent(row) {
  return { type: 'sentence.created', sentence: { id: row.id, text: row.text, created_at: row.created_at } };
}

export default function RandoPage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [queue, setQueue] = useState([]); // array of sentence objects
  const [active, setActive] = useState(null); // { sentence, activatedAt }
  const timerRef = useRef(null);

  // fetch initial history
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('sentences')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1000);
        if (error) {
          console.error('supabase fetch error', error);
          return;
        }
        if (!mounted) return;
        if (!data || data.length === 0) {
          setQueue([]);
          setActive(null);
          return;
        }
        // Make the first (oldest) active, rest queued
        const [first, ...rest] = data;
        setActive({ sentence: first, activatedAt: Date.now() });
        setQueue(rest);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { mounted = false; };
  }, [supabase]);

  // subscribe to realtime inserts
  useEffect(() => {
    const channel = supabase
      .channel('public:sentences')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sentences' }, (payload) => {
        const row = payload.new;
        const sentence = { id: row.id, text: row.text, created_at: row.created_at };
        setQueue((q) => {
          // append preserving order
          return [...q, sentence];
        });
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Activation / queue processing
  useEffect(() => {
    // Helper to try activating next if eligible
    function tryAdvance() {
      if (!active && queue.length > 0) {
        const next = queue[0];
        setQueue((q) => q.slice(1));
        setActive({ sentence: next, activatedAt: Date.now() });
        return;
      }
      if (active && queue.length > 0) {
        const elapsed = Date.now() - active.activatedAt;
        if (elapsed >= MIN_DISPLAY_DURATION_MS) {
          const next = queue[0];
          setQueue((q) => q.slice(1));
          setActive({ sentence: next, activatedAt: Date.now() });
        }
      }
    }

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Poll every second to check transitions; this keeps logic simple and deterministic.
    timerRef.current = setInterval(tryAdvance, 1000);
    // Also run once immediately
    tryAdvance();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active, queue]);

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
        // Do not push to queue here; rely on realtime subscription for canonical order
      }
    } catch (err) {
      console.error(err);
      setError('network');
    } finally {
      setSubmitting(false);
    }
  }

  const activeText = active ? active.sentence.text : '';

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
        <div>Queue length: {queue.length}</div>
        <div style={{ marginTop: 8 }}>Each sentence displays for a minimum of {MIN_DISPLAY_DURATION_MS / 1000} seconds.</div>
      </div>
    </div>
  );
}
