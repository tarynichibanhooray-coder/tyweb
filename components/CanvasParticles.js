'use client';
import { useEffect, useRef } from 'react';

export default function CanvasParticles({ text = '', preset = 'calm' }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const pointerRef = useRef({ x: -9999, y: -9999, down: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;

    // measure CSS size reliably
    function measure() {
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width || canvas.clientWidth || 600;
      const cssH = rect.height || canvas.clientHeight || 240;
      return { cssW, cssH };
    }

    let { cssW, cssH } = measure();

    let DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      const m = measure();
      cssW = m.cssW; cssH = m.cssH;
      canvas.width = Math.max(1, Math.floor(cssW * DPR));
      canvas.height = Math.max(1, Math.floor(cssH * DPR));
      // make drawing use CSS pixels
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // draw text to offscreen canvas and sample. Use a reasonable sampling texture size
    const off = document.createElement('canvas');
    const offCtx = off.getContext && off.getContext('2d');
    if (!offCtx) {
      // fallback: create some simple particles
      particlesRef.current = [{ x: cssW / 2, y: cssH / 2, ox: cssW / 2, oy: cssH / 2, vx: 0, vy: 0, inside: true }];
    } else {
      const w = Math.max(240, Math.floor(cssW));
      const h = Math.max(96, Math.floor(cssH));
      off.width = w; off.height = h;
      offCtx.clearRect(0,0,w,h);
      // force the displayed word to 'stop'
      const displayText = 'stop';
      // adjust font size relative to offscreen height
      const fontSize = Math.max(24, Math.floor(h * 0.45));
      offCtx.font = `bold ${fontSize}px system-ui, sans-serif`;
      offCtx.fillStyle = '#000';
      offCtx.textBaseline = 'middle';
      offCtx.textAlign = 'center';
      offCtx.fillText(displayText, w/2, h/2);

      let img;
      try {
        img = offCtx.getImageData(0,0,w,h).data;
      } catch (e) {
        img = null;
      }

      const textPoints = [];
      if (img) {
        const step = preset === 'chaotic' ? 4 : 6;
        for (let y=0;y<h;y+=step){
          for (let x=0;x<w;x+=step){
            const idx = (y*w + x)*4;
            if (img[idx] > 128) {
              // map to CSS pixels space
              textPoints.push({x: x/w*cssW, y: y/h*cssH});
            }
          }
        }
      }

      // fallback if sampling produced nothing
      if (textPoints.length === 0) {
        // create a small centered word-shaped fallback: a few clustered points
        for (let i=0;i<120;i++){
          textPoints.push({ x: cssW/2 + (Math.random()-0.5)*120, y: cssH/2 + (Math.random()-0.5)*48 });
        }
      }

      // create ambient red dots around the canvas, avoiding overlapping text points
      const ambient = [];
      const ambientCount = Math.max(200, Math.floor((cssW*cssH)/8000));
      const minDist = 14; // minimum distance from text points
      for (let i=0;i<ambientCount;i++){
        let tries = 0;
        while (tries < 8) {
          const rx = Math.random()*cssW;
          const ry = Math.random()*cssH;
          // check distance to nearest text point
          let ok = true;
          for (let j=0;j<3;j++){ // sample up to 3 text points to avoid heavy loops
            const tp = textPoints[Math.floor(Math.random()*textPoints.length)];
            const dx = tp.x - rx; const dy = tp.y - ry;
            if (Math.hypot(dx,dy) < minDist) { ok = false; break; }
          }
          if (ok) { ambient.push({ x: rx, y: ry }); break; }
          tries++;
        }
      }

      const pts = [];
      // text (black) particles
      textPoints.forEach(p => pts.push({ x: p.x, y: p.y, ox: p.x, oy: p.y, vx: 0, vy: 0, inside: true }));
      // ambient (red) particles
      ambient.forEach(p => pts.push({ x: p.x, y: p.y, ox: p.x, oy: p.y, vx: 0, vy: 0, inside: false }));

      particlesRef.current = pts;
    }

    // cancel any existing RAF
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function render() {
      // clear using CSS size
      ctx.clearRect(0,0,cssW,cssH);

      // draw connections (optional: draw only among ambient to avoid clutter)
      if (preset !== 'outline') {
        ctx.strokeStyle = 'rgba(6,18,38,0.06)';
        for (let i=0;i<particlesRef.current.length;i++){
          const a = particlesRef.current[i];
          for (let j=i+1;j<i+6 && j<particlesRef.current.length;j++){
            const b = particlesRef.current[j];
            const dx = a.x - b.x; const dy = a.y - b.y; const d = Math.hypot(dx,dy);
            if (d < 40) {
              ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
            }
          }
        }
      }

      particlesRef.current.forEach(pt => {
        // pointer interaction: repulse or attract
        const dx = pt.x - pointerRef.current.x;
        const dy = pt.y - pointerRef.current.y;
        const dist = Math.max(1, Math.hypot(dx,dy));
        const force = pointerRef.current.down ? (preset === 'chaotic' ? -600 : -300) : (preset === 'calm' ? 0 : -80);
        const fx = (dx / dist) * (force / dist);
        const fy = (dy / dist) * (force / dist);

        pt.vx += fx + (pt.ox - pt.x) * 0.02;
        pt.vy += fy + (pt.oy - pt.y) * 0.02;

        pt.vx *= 0.88; pt.vy *= 0.88;
        pt.x += pt.vx; pt.y += pt.vy;

        // color: black for text, red for ambient
        if (pt.inside) {
          ctx.fillStyle = '#000000';
          const r = 2.6;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI*2); ctx.fill();
        } else {
          ctx.fillStyle = 'rgb(220,40,60)';
          const r = preset==='chaotic' ? 2.2 : 1.6;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI*2); ctx.fill();
        }
      });

      rafRef.current = requestAnimationFrame(render);
    }
    render();

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
  }, [text, preset]);

  return (
    <div style={{minHeight:260,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <canvas ref={canvasRef} style={{width:'100%',height:240,maxWidth:900,background:'#fbfcfe',borderRadius:8}} />
    </div>
  );
}
