'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as flubber from 'flubber';

export default function SvgScenario({ text = '', preset = 'calm' }) {
  const svgRef = useRef(null);
  const lastTextRef = useRef('');

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    svg.appendChild(g);

    const fontSize = 64;
    const xStart = 50;
    let x = xStart;

    const textEl = document.createElementNS(ns, 'text');
    textEl.setAttribute('x', xStart);
    textEl.setAttribute('y', 120);
    textEl.setAttribute('font-size', fontSize);
    textEl.setAttribute('font-family', 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif');
    textEl.setAttribute('fill', 'none');
    textEl.setAttribute('stroke', '#061226');
    textEl.setAttribute('stroke-width', '2');
    svg.appendChild(textEl);

    const chars = Array.from(text || '');
    const tspans = [];
    chars.forEach((ch, i) => {
      const tspan = document.createElementNS(ns, 'tspan');
      tspan.setAttribute('dy', '0');
      tspan.setAttribute('x', x);
      tspan.setAttribute('class', 'svg-char');
      tspan.textContent = ch;
      textEl.appendChild(tspan);
      tspans.push(tspan);
      x += fontSize * 0.55;
    });

    // stroke-draw reveal
    tspans.forEach((t, i) => {
      const len = 50;
      t.style.strokeDasharray = len;
      t.style.strokeDashoffset = String(len);
      t.style.transition = 'stroke-dashoffset 0.6s cubic-bezier(.22,.9,.18,1)';
      setTimeout(() => { t.style.strokeDashoffset = '0'; }, i * 30);
      t.style.transformOrigin = '50% 50%';
      t.style.transition += ', transform 0.4s ease';
    });

    // hover to scale and glow
    tspans.forEach((t) => {
      t.addEventListener('mouseenter', () => {
        t.style.transform = 'scale(1.18)';
        t.style.filter = 'drop-shadow(0 6px 6px rgba(6,18,38,0.12))';
      });
      t.addEventListener('mouseleave', () => {
        t.style.transform = '';
        t.style.filter = '';
      });
    });

    // morph example: if previous text has same length, morph paths for first/last letters
    if (lastTextRef.current && lastTextRef.current.length === text.length && text.length > 1) {
      try {
        const shapesPrev = tspans.map((t) => t.textContent);
        // simple visual morph: pulse scale on change
        gsap.fromTo(tspans, { scale: 0.9, opacity: 0.6 }, { scale: 1, opacity: 1, duration: 0.6, stagger: 0.02, ease:'power3.out' });
      } catch (e) {
        // ignore
      }
    }

    // subtle animated gradient stroke by translating a mask rect
    const defs = document.createElementNS(ns, 'defs');
    const linear = document.createElementNS(ns, 'linearGradient');
    linear.setAttribute('id', 'g1');
    linear.setAttribute('x1', '0%'); linear.setAttribute('y1', '0%'); linear.setAttribute('x2', '100%'); linear.setAttribute('y2', '0%');
    const stop1 = document.createElementNS(ns, 'stop'); stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#061226');
    const stop2 = document.createElementNS(ns, 'stop'); stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#1e90ff');
    linear.appendChild(stop1); linear.appendChild(stop2); defs.appendChild(linear); svg.appendChild(defs);
    textEl.setAttribute('stroke', 'url(#g1)');

    lastTextRef.current = text;

  }, [text, preset]);

  return (
    <div style={{minHeight:260,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <svg ref={svgRef} width="100%" height="160" viewBox="0 0 1000 160" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
  );
}
