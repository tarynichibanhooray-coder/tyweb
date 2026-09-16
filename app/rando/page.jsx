'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getBrowserSupabase } from '../../lib/supabaseClient.browser';
import { MIN_DISPLAY_DURATION_MS, MAX_SENTENCE_LENGTH } from '../../lib/randoConfig';
import StyledText from '../../components/StyledText';
import { detectLanguage, getStrings } from '../../lib/i18n';

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

  // Submission
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  // Detected post-mount, not during initial render — navigator isn't
  // available on the server, so reading it during render would mismatch
  // the server-rendered (English) HTML against the client's first paint.
  const [langCode, setLangCode] = useState('en');
  useEffect(() => {
    setLangCode(detectLanguage());
  }, []);
  const strings = useMemo(() => getStrings(langCode), [langCode]);

  const ERROR_MESSAGES = {
    empty: strings.errorEmpty,
    too_long: strings.errorTooLong,
    server_error: strings.errorServer,
    network: strings.errorNetwork,
  };

  async function handleShare() {
    const shareData = { title: 'Rando', text: 'A shared, ever-changing sentence.', url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareStatus(strings.copiedLink);
        setTimeout(() => setShareStatus(null), 1800);
      }
    } catch (err) {
      // user cancelled the native share sheet — nothing to surface
    }
  }

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
    <div
      style={{
        height: '100vh',
        boxSizing: 'border-box',
        background: '#000',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div style={{ height: '70vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <StyledText
          text={activeText || strings.emptyState}
          styleName="text-on-path"
          style={{ fontSize: 'clamp(18px, 4vw, 48px)', textAlign: 'center' }}
        />
      </div>

      <div style={{ position: 'fixed', bottom: 40, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!showComposer ? (
            <button
              onClick={() => setShowComposer(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '8px 16px',
                transition: 'color 0.25s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.95)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              {strings.writeTrigger}
            </button>
          ) : (
            <>
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={strings.placeholder(MAX_SENTENCE_LENGTH)}
                maxLength={MAX_SENTENCE_LENGTH}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  width: 360,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                  if (e.key === 'Escape') setShowComposer(false);
                }}
              />
              <button
                onClick={submit}
                disabled={submitting}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {strings.submit}
              </button>
            </>
          )}
          <button
            onClick={handleShare}
            aria-label={strings.share}
            title={strings.share}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              padding: 0,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              transition: 'color 0.2s ease, background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
              <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
            </svg>
          </button>
        </div>
        {shareStatus && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{shareStatus}</div>}
        {error && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{ERROR_MESSAGES[error] || strings.errorServer}</div>}
      </div>
    </div>
  );
}
