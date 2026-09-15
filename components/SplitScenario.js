'use client';
import { useEffect, useRef } from 'react';
import { splitText, undoSplit } from '../utils/splitText';
import gsap from 'gsap';

export default function SplitScenario({ text = '' }) {
  const outRef = useRef(null);
  const splitRef = useRef(null);

  useEffect(() => {
    if (!outRef.current) return;
    if (splitRef.current) undoSplit(splitRef.current);
    outRef.current.textContent = text;
    const res = splitText(outRef.current, { by: 'char', spanClass: 'st-char' });
    splitRef.current = res;

    const chars = res.pieces || [];
    gsap.killTweensOf(chars);
    gsap.set(chars, { y: 10, opacity: 0, rotation: 0 });
    const tl = gsap.timeline();
    tl.to(chars, {
      y: 0,
      opacity: 1,
      rotation: 0,
      duration: 0.45,
      ease: 'power3.out',
      stagger: { each: 0.02, from: 'center' },
    });

    return () => {
      tl.kill();
    };
  }, [text]);

  return (
    <div style={{minHeight:260,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div ref={outRef} style={{fontSize:64,lineHeight:1,fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',color:'#061226'}}>{text}</div>
    </div>
  );
}
