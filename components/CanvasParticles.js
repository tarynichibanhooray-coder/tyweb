'use client';
import { useEffect, useRef } from 'react';

export default function CanvasParticles({ text = '', preset = 'calm' }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const pointerRef = useRef({ x: -9999, y: -9999, down: false });
  const sizeRef = useRef({ w: 600, h: 240 });

  // Build targets by drawing text into an offscreen canvas and sampling pixels
  function buildTargets(displayText, cssW, cssH) {
    const off = document.createElement('canvas');
    const offCtx = off.getContext && off.getContext('2d');
    if (!offCtx) return [];

    // sampling parameters
    const sample = Math.max(3, Math.round(cssW / 120));
    const W = Math.max(240, Math.round(cssW / sample));
    const H = Math.max(80, Math.round(cssH / sample));
    off.width = W; off.height = H;
    offCtx.clearRect(0, 0, W, H);

    const fontSize = Math.floor(H * 0.7);
    offCtx.font = `bold ${fontSize}px system-ui, sans-serif`;
    offCtx.fillStyle = '#000';
    offCtx.textBaseline = 'middle';
    offCtx.textAlign = 'center';
    offCtx.fillText(displayText, W / 2, H / 2);

    let img;
    try { img = offCtx.getImageData(0, 0, W, H).data; } catch (e) { img = null; }

    const targets = [];
    if (img) {
      const step = preset === 'chaotic' ? 3 : 4;
      for (let yy = 0; yy < H; yy += step) {
        for (let xx = 0; xx < W; xx += step) {
          const idx = (yy * W + xx) * 4;
          const alpha = img[idx + 3];
          const lum = img[idx] + img[idx + 1] + img[idx + 2];
          const inside = alpha > 10 || lum > 30;
          if (inside) {
            const cx = (xx / W) * cssW;
            const cy = (yy / H) * cssH;
            targets.push({ x: cx, y: cy, inside });
          }
        }
      }
    }

    return targets;
  }

  // Refill or update particle pool to match targets
  function refillParticles(targets, cssW, cssH) {
    const current = particlesRef.current || [];
    const maxParticles = Math.min(1200, Math.max(80, targets.length));
    let chosen = targets;
    if (targets.length > maxParticles) {
      chosen = [];
      const step = Math.ceil(targets.length / maxParticles);
      for (let i = 0; i < targets.length; i += step) chosen.push(targets[i]);
    }

    const out = [];
    for (let i = 0; i < chosen.length; i++) {
      const t = chosen[i];
      const color = t.inside ? '#000000' : 'rgb(220,40,60)';
      if (current[i]) {
        // reuse particle but retarget
        current[i].tx = t.x;
        current[i].ty = t.y;
        current[i].inside = t.inside;
        current[i].color = color;
        out.push(current[i]);
      } else {
        // spawn near random positions for nicer animation
        out.push({
          x: Math.random() * cssW,
          y: Math.random() * cssH,
          tx: t.x,
          ty: t.y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          inside: t.inside,
          color,
          size: t.inside ? 2.6 : (preset === 'chaotic' ? 2.2 : 1.6)
        });
      }
    }

    particlesRef.current = out;
  }

  // Setup and main effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;

    function measure() {
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width || canvas.clientWidth || 600;
      const cssH = rect.height || canvas.clientHeight || 240;
      return { cssW, cssH };
    }

    let { cssW, cssH } = measure();
    sizeRef.current = { w: cssW, h: cssH };

    let DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      const m = measure();
      cssW = m.cssW; cssH = m.cssH;
      sizeRef.current = { w: cssW, h: cssH };
      canvas.width = Math.max(1, Math.floor(cssW * DPR));
      canvas.height = Math.max(1, Math.floor(cssH * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // rebuild targets on resize to keep layout
      const displayText = (text && text.trim().length > 0) ? text.trim().slice(0, 12) : 'stop';
      const targets = buildTargets(displayText, cssW, cssH);
      refillParticles(targets, cssW, cssH);
    }

    resize();
    window.addEventListener('resize', resize);

    // initial targets
    const displayText = (text && text.trim().length > 0) ? text.trim().slice(0, 12) : 'stop';
    const initialTargets = buildTargets(displayText, cssW, cssH);
    // if no targets found, fall back to 'stop'
    if (!initialTargets || initialTargets.length === 0) {
      const fallback = buildTargets('stop', cssW, cssH);
      refillParticles(fallback, cssW, cssH);
    } else {
      refillParticles(initialTargets, cssW, cssH);
    }

    // animation parameters tuned to match previous feel
    const SPRING = 0.02; // spring strength
    const DAMP = 0.88; // damping

    function render() {
      ctx.clearRect(0, 0, cssW, cssH);

      const particles = particlesRef.current;
      // draw subtle connections (same visual as before)
      if (preset !== 'outline') {
        ctx.strokeStyle = 'rgba(6,18,38,0.06)';
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          for (let j = i + 1; j < i + 6 && j < particles.length; j++) {
            const b = particles[j];
            const dx = a.x - b.x; const dy = a.y - b.y; const d = Math.hypot(dx, dy);
            if (d < 40) {
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];

        // pointer interaction: repulse/attract
        const dx = pt.x - pointerRef.current.x;
        const dy = pt.y - pointerRef.current.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const force = pointerRef.current.down ? (preset === 'chaotic' ? -600 : -300) : (preset === 'calm' ? 0 : -80);
        const fx = (dx / dist) * (force / dist);
        const fy = (dy / dist) * (force / dist);

        // spring to target
        const tx = pt.tx !== undefined ? pt.tx : pt.ox || (cssW / 2);
        const ty = pt.ty !== undefined ? pt.ty : pt.oy || (cssH / 2);
        const sx = tx - pt.x;
        const sy = ty - pt.y;

        pt.vx += fx + sx * SPRING;
        pt.vy += fy + sy * SPRING;
        pt.vx *= DAMP; pt.vy *= DAMP;
        pt.x += pt.vx; pt.y += pt.vy;

        // draw
        if (pt.inside) {
          ctx.fillStyle = '#000000';
          const r = 2.6;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = 'rgb(220,40,60)';
          const r = preset === 'chaotic' ? 2.2 : 1.6;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    }

    // start loop
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.x = e.clientX - rect.left;
      pointerRef.current.y = e.clientY - rect.top;
    }
    function onDown(e) { pointerRef.current.down = true; onMove(e); }
    function onUp() { pointerRef.current.down = false; }

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []); // mount once

  // React to text prop changes directly (replace brittle CustomEvent approach)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(300, rect.width || 600);
    const cssH = Math.max(120, rect.height || 240);
    const displayText = (text && text.trim().length > 0) ? text.trim().slice(0, 12) : 'stop';
    const targets = buildTargets(displayText, cssW, cssH);
    if (!targets || targets.length === 0) {
      const fallback = buildTargets('stop', cssW, cssH);
      refillParticles(fallback, cssW, cssH);
    } else {
      refillParticles(targets, cssW, cssH);
    }
  }, [text, preset]);

  return (
    <div style={{minHeight:260,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <canvas ref={canvasRef} style={{width:'100%',height:240,maxWidth:900,background:'#fbfcfe',borderRadius:8}} />
    </div>
  );
}
