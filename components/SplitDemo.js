'use client';
import { useEffect, useRef, useState } from 'react';
import { splitText, undoSplit } from '../utils/splitText';
import gsap from 'gsap';
import '../styles/split-demo.css';

export default function SplitDemo({ initial = 'KINETIC TYPOGRAPHY' }) {
  const outRef = useRef(null);
  const inputRef = useRef(null);
  const splitRef = useRef(null);
  const [text, setText] = useState(initial);

  useEffect(() => {
    let cleanup;
    function doSplit() {
      // Clean previous
      if (splitRef.current) undoSplit(splitRef.current);
      const res = splitText(outRef.current, { by: 'char', spanClass: 'st-char' });
      splitRef.current = res;

      const chars = res.pieces || [];
      gsap.killTweensOf(chars);
      gsap.set(chars, { y: 12, opacity: 0, rotation: 0 });
      const tl = gsap.timeline();
      tl.to(chars, {
        y: 0,
        opacity: 1,
        rotation: 0,
        duration: 0.45,
        ease: 'power3.out',
        stagger: { each: 0.03, from: 'center' },
      });

      cleanup = () => {
        tl.kill();
      };
    }

    doSplit();
    return () => cleanup && cleanup();
  }, [text]);

  useEffect(() => {
    const el = inputRef.current;
    let timeout = null;
    function onInput(e) {
      const v = e.target.value || '';
      clearTimeout(timeout);
      // immediate set for perceived responsiveness
      setText(v);
      // small debounce to avoid heavy reflows on fast typing
      timeout = setTimeout(() => {
        setText(v);
      }, 60);
    }
    el && el.addEventListener('input', onInput);
    return () => el && el.removeEventListener('input', onInput);
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: 960 }}>
      <input
        ref={inputRef}
        defaultValue={text}
        placeholder="Type here..."
        aria-label="Type text"
        style={{
          width: '100%',
          padding: 12,
          fontSize: 18,
          marginBottom: 16,
          borderRadius: 8,
          border: '1px solid rgba(0,0,0,0.12)',
        }}
      />
      <div
        ref={outRef}
        id="split-output"
        style={{
          fontSize: 44,
          lineHeight: 1,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          color: '#061226',
          background: '#f6f8fb',
          padding: 24,
          borderRadius: 8,
        }}
      >
        {text}
      </div>
    </div>
  );
}
