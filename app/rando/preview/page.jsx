'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { getBrowserSupabase } from '../../../lib/supabaseClient.browser';
import StyledText from '../../../components/StyledText';
import { STYLES } from '../../../components/textStyles';

// Side-by-side comparison of all rotation styles at once. Not part of the
// daily-rotation product page (/rando) — this is a review tool.
export default function RandoStylePreview() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [text, setText] = useState('The quick brown fox jumps');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('sentences')
        .select('text')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data[0]?.text) setText(data[0].text);
    })();
  }, [supabase]);

  return (
    <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', color: '#111' }}>
      <h1>Rando style preview</h1>
      <p style={{ color: '#666' }}>
        All five rotation styles shown at once, using the same sentence, for comparison.
        In production (/rando) only one plays per day.
      </p>

      {STYLES.map(({ name }) => (
        <div key={name} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4, fontFamily: 'monospace' }}>{name}</div>
          <div style={{ borderRadius: 12, background: '#111', color: '#fff', padding: 24, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StyledText
              text={text}
              styleName={name}
              style={{ fontSize: 'clamp(16px, 3vw, 36px)', textAlign: 'center' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
