'use client';
import { useEffect, useRef } from 'react';

export default function CanvasParticles({ text = '', preset = 'calm' }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const sizeRef = useRef({ w: 600, h: 240 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(300, rect.width || 600);
      const h = Math.max(120, rect.height || 240);
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let running = true;
    resize();

    // particle constructor
    function makeParticle(x, y, color) {
      return {
        x: Math.random() * sizeRef.current.w,
        y: Math.random() * sizeRef.current.h,
        tx: x,
        ty: y,
        vx: 0,
        vy: 0,
        color,
        size: Math.max(2, Math.round(Math.min(6, Math.random() * 4 + 1)))
      };
    }

    function buildTargetsFromText(displayText) {
      const { w, h } = sizeRef.current;
      const off = document.createElement('canvas');
      const offCtx = off.getContext && off.getContext('2d');
      if (!offCtx) return [];

      // sample resolution depends on width
      const sample = Math.max(6, Math.round(w / 80));
      const W = Math.max(200, Math.round(w / sample));
      const H = Math.max(60, Math.round(h / sample));
      off.width = W;
      off.height = H;
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
        for (let yy = 0; yy < H; yy++) {
          for (let xx = 0; xx < W; xx++) {
            const idx = (yy * W + xx) * 4;
            const alpha = img[idx + 3];
            const lum = img[idx] + img[idx + 1] + img[idx + 2];
            const inside = alpha > 10 || lum > 30;
            if (inside) {
              // map back to canvas coords
              const cx = (xx / W) * w;
              const cy = (yy / H) * h;
              targets.push({ x: cx, y: cy, inside });
            }
          }
        }
      }

      return { targets, sample };
    }

    function refillParticles(targets) {
      const p = particlesRef.current;
      // ensure we have at least as many particles as targets (cap particles)
      const maxParticles = Math.min(1200, Math.max(80, targets.length));
      // if too many targets, sample them
      let chosen = targets;
      if (targets.length > maxParticles) {
        chosen = [];
        const step = Math.ceil(targets.length / maxParticles);
        for (let i = 0; i < targets.length; i += step) chosen.push(targets[i]);
      }

      // create or reuse particles
      const out = [];
      for (let i = 0; i < chosen.length; i++) {
        const t = chosen[i];
        const color = t.inside ? '#000' : 'rgb(220,40,60)';
        if (p[i]) {
          p[i].tx = t.x;
          p[i].ty = t.y;
          p[i].color = color;
          out.push(p[i]);
        } else {
          out.push(makeParticle(t.x, t.y, color));
        }
      }

      particlesRef.current = out;
    }

    // main animation loop
    function tick() {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      // update particles
      const p = particlesRef.current;
      for (let i = 0; i < p.length; i++) {
        const pt = p[i];
        // spring to target
        const dx = pt.tx - pt.x;
        const dy = pt.ty - pt.y;
        pt.vx += dx * 0.06;
        pt.vy += dy * 0.06;
        pt.vx *= 0.88;
        pt.vy *= 0.88;
        pt.x += pt.vx;
        pt.y += pt.vy;

        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (pt.inside ? 1 : 0.9), 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    function startForText(displayText) {
      const { targets } = buildTargetsFromText(displayText);
      if (!targets || targets.length === 0) {
        // fallback: random particles
        const arr = new Array(200).fill(0).map(() => ({ x: Math.random() * sizeRef.current.w, y: Math.random() * sizeRef.current.h, inside: false }));
        refillParticles(arr);
      } else {
        refillParticles(targets);
      }

      // ensure we stop previous loop
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }

    // initial run
    startForText(text && text.trim().length > 0 ? text.trim().slice(0, 12) : 'go');

    // handle resize
    const onResize = () => {
      resize();
      // rebuild particles for current text
      startForText(text && text.trim().length > 0 ? text.trim().slice(0, 12) : 'go');
    };
    window.addEventListener('resize', onResize);

    return () => {
      running = false;
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []); // only mount once

  // react to text changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // rebuild targets based on text
    const displayText = (text && text.trim().length > 0) ? text.trim().slice(0, 12) : 'go';
    // small delay to allow resize/paint
    setTimeout(() => {
      // build targets by reusing the internal functions via creating a temporary offscreen run
      const event = new CustomEvent('canvasParticles:updateText', { detail: { text: displayText } });
      window.dispatchEvent(event);
    }, 20);
  }, [text]);

  // listen for the custom event to rebuild (internal communication)
  useEffect(() => {
    function onUpdate(e) {
      const newText = (e && e.detail && e.detail.text) ? e.detail.text : '';
      // rebuild inside the same effect used for mount by calling startForText via dispatching a small inline function
      // For simplicity, reuse the same logic by creating an offscreen canvas here
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // very similar buildTargetsFromText but inline to avoid refactoring complexity
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(300, rect.width || 600);
      const h = Math.max(120, rect.height || 240);

      const off = document.createElement('canvas');
      const offCtx = off.getContext && off.getContext('2d');
      if (!offCtx) return;

      const sample = Math.max(6, Math.round(w / 80));
      const W = Math.max(200, Math.round(w / sample));
      const H = Math.max(60, Math.round(h / sample));
      off.width = W; off.height = H;
      offCtx.clearRect(0, 0, W, H);

      const fontSize = Math.floor(H * 0.7);
      offCtx.font = `bold ${fontSize}px system-ui, sans-serif`;
      offCtx.fillStyle = '#000';
      offCtx.textBaseline = 'middle';
      offCtx.textAlign = 'center';
      offCtx.fillText(newText, W / 2, H / 2);

      let img;
      try { img = offCtx.getImageData(0, 0, W, H).data; } catch (e) { img = null; }

      const targets = [];
      if (img) {
        for (let yy = 0; yy < H; yy++) {
          for (let xx = 0; xx < W; xx++) {
            const idx = (yy * W + xx) * 4;
            const alpha = img[idx + 3];
            const lum = img[idx] + img[idx + 1] + img[idx + 2];
            const inside = alpha > 10 || lum > 30;
            if (inside) {
              const cx = (xx / W) * w;
              const cy = (yy / H) * h;
              targets.push({ x: cx, y: cy, inside });
            }
          }
        }
      }

      // refill particles
      const p = particlesRef.current || [];
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
        const color = t.inside ? '#000' : 'rgb(220,40,60)';
        if (p[i]) {
          p[i].tx = t.x;
          p[i].ty = t.y;
          p[i].color = color;
          p[i].inside = t.inside;
          out.push(p[i]);
        } else {
          out.push({
            x: Math.random() * w,
            y: Math.random() * h,
            tx: t.x,
            ty: t.y,
            vx: 0,
            vy: 0,
            color,
            size: Math.max(2, Math.round(Math.min(6, Math.random() * 4 + 1))),
            inside: t.inside
          });
        }
      }

      particlesRef.current = out;
    }

    window.addEventListener('canvasParticles:updateText', onUpdate);
    return () => window.removeEventListener('canvasParticles:updateText', onUpdate);
  }, []);

  return (
    <div style={{width:'100%',height:240,maxWidth:900,background:'#fff',padding:8,borderRadius:8,boxSizing:'border-box',overflow:'hidden'}}>
      <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}} />
    </div>
  );
}
