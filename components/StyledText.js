'use client';
import { useEffect, useRef } from 'react';
import { STYLES } from './textStyles';

// Like DailyStyleText, but pinned to an explicit style rather than picking
// one by day — used by the /rando/preview comparison page.
export default function StyledText({ text = '', styleName, className, style }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const entry = STYLES.find((s) => s.name === styleName) || STYLES[0];
    return entry.mount(el, text);
  }, [text, styleName]);

  return <div ref={containerRef} className={className} style={style} />;
}
