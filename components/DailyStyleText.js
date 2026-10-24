'use client';
import { useEffect, useRef, useState } from 'react';
import { STYLES } from './textStyles';
import { STYLE_ROTATION_MS } from '../lib/randoConfig';

// Wall-clock slot, not time since page load — every viewer computes the
// same index at the same moment, same shared-derivation principle as the
// sentence scheduling. Slots cycle through STYLES in order.
function styleIndexAt(now = Date.now()) {
  return Math.floor(now / STYLE_ROTATION_MS) % STYLES.length;
}

export default function DailyStyleText({ text = '', className, style }) {
  const containerRef = useRef(null);
  const [styleIndex, setStyleIndex] = useState(() => styleIndexAt());

  // Wake exactly at the next slot boundary rather than polling, so the
  // switch lands on time.
  useEffect(() => {
    let id;
    const schedule = () => {
      const now = Date.now();
      id = setTimeout(() => {
        setStyleIndex(styleIndexAt());
        schedule();
      }, STYLE_ROTATION_MS - (now % STYLE_ROTATION_MS) + 50);
    };
    schedule();
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cleanup = STYLES[styleIndex].mount(el, text);
    return cleanup;
  }, [text, styleIndex]);

  // Keyed by style so each slot gets a fresh element — styles set inline
  // CSS on their container (backgrounds, perspective, min-height) that
  // would otherwise leak into the next style.
  return <div key={styleIndex} ref={containerRef} className={className} style={style} />;
}
