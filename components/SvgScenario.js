'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Very small SVG-based visual: per-letter tspan transforms + stroke reveal
export default function SvgScenario({ text = '' }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // Clear
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    svg.appendChild(g);

    const fontSize = 64;
    const xStart = 50;
    let x = xStart;

    // create <text> with tspans for each char to have independent transforms
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
    chars.forEach((ch, i) => {
      const tspan = document.createElementNS(ns, 'tspan');
      tspan.setAttribute('dy', '0');
      tspan.setAttribute('x', x);
      tspan.setAttribute('class', 'svg-char');
      tspan.textContent = ch;
      textEl.appendChild(tspan);
      // approximate advance (simple): use fixed width
      x += fontSize * 0.55;
    });

    // Animate: stroke-dashoffset reveal + slight translate
    const tspans = Array.from(svg.querySelectorAll('.svg-char'));
    tspans.forEach((t) => {
      // wrap each char in a group to animate transforms
      const bbox = { width: 1 };
      // set initial transform
      t.style.transformBox = 'fill-box';
      t.style.transformOrigin = '50% 50%';
    });

    gsap.fromTo(tspans, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.03, ease: 'power3.out' });

  }, [text]);

  return (
    <div style={{minHeight:260,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <svg ref={svgRef} width="100%" height="160" viewBox="0 0 1000 160" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
  );
}
