'use client';
import { useEffect, useRef, useState } from 'react';
import { STYLES } from './textStyles';

// UTC calendar day, not local time or load time — every viewer computes
// the same index regardless of timezone or when they opened the page,
// same shared-derivation principle as the sentence scheduling.
function dailyStyleIndex(date = new Date()) {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayNumber = Math.floor(utcMidnight / 86400000);
  return dayNumber % STYLES.length;
}

export default function DailyStyleText({ text = '', className, style }) {
  const containerRef = useRef(null);
  const [styleIndex, setStyleIndex] = useState(dailyStyleIndex);

  // Catch the rollover if the page is left open across a UTC midnight.
  useEffect(() => {
    const id = setInterval(() => {
      const next = dailyStyleIndex();
      setStyleIndex((prev) => (prev === next ? prev : next));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cleanup = STYLES[styleIndex].mount(el, text);
    return cleanup;
  }, [text, styleIndex]);

  return <div ref={containerRef} className={className} style={style} />;
}
