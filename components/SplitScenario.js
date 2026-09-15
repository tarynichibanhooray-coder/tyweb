'use client';
import { useEffect, useRef } from 'react';
import { splitText, undoSplit } from '../utils/splitText';
import gsap from 'gsap';

export default function SplitScenario({ text = '', preset = 'calm' }) {
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

    // visual presets
    const config = {
      calm: { y: 0, opacity: 1, duration: 0.5, stagger: 0.02, rotation: 0 },
      chaotic: { y: -8, opacity: 1, duration: 0.6, stagger: 0.01, rotation: () => (Math.random() - 0.5) * 60 },
      outline: { y: 0, opacity: 1, duration: 0.5, stagger: 0.02, rotation: 0 }
    }[preset] || { y:0, opacity:1, duration:0.5, stagger:0.02, rotation:0 };

    // entrance
    gsap.set(chars, { y: 20, opacity: 0, rotation: 0, transformOrigin: '50% 50%' });
    gsap.to(chars, { y: config.y, opacity: config.opacity, rotation: config.rotation, duration: config.duration, ease: 'power3.out', stagger: { each: config.stagger, from: 'center' } });

    // subtle idle jitter for calm/chaotic
    const idle = gsap.to(chars, { y: '+=2', rotation: '+=2', duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: { each: 0.015, from: 'center' }, paused: preset === 'outline' });
    if (preset === 'chaotic') idle.timeScale(2);

    // pointer interactions: on pointermove, push letters away
    function onMove(e) {
      const bounds = outRef.current.getBoundingClientRect();
      const mx = e.clientX - bounds.left;
      const my = e.clientY - bounds.top;
      chars.forEach((el) => {
        const r = el.getBoundingClientRect();
        const cx = (r.left + r.right) / 2 - bounds.left;
        const cy = (r.top + r.bottom) / 2 - bounds.top;
        const dx = cx - mx;
        const dy = cy - my;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < 120) {
          gsap.to(el, { x: (dx/dist)*20, y: (dy/dist)*20, rotation: (dx/dist)*10, duration: 0.4, ease: 'power3.out' });
        } else {
          gsap.to(el, { x: 0, y: 0, rotation: 0, duration: 0.6, ease: 'power3.out' });
        }
      });
    }

    function onClick() {
      // explode letters outward then reassemble
      const tl = gsap.timeline();
      tl.to(chars, { x: () => (Math.random()-0.5) * 400, y: () => (Math.random()-0.5) * 300, rotation: () => (Math.random()-0.5)*720, opacity: 0, duration: 0.9, stagger: 0.01, ease: 'power4.out' });
      tl.to(chars, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.9, stagger: { each: 0.01, from: 'center' }, ease: 'power4.out' }, '+=0.15');
    }

    outRef.current.addEventListener('pointermove', onMove);
    outRef.current.addEventListener('click', onClick);

    return () => {
      outRef.current && outRef.current.removeEventListener('pointermove', onMove);
      outRef.current && outRef.current.removeEventListener('click', onClick);
      idle.kill();
    };
  }, [text, preset]);

  return (
    <div style={{minHeight:260,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div ref={outRef} className="split-output" style={{fontSize:64,lineHeight:1,fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',color:'#061226',padding:12,display:'inline-block'}}>{text}</div>
    </div>
  );
}
