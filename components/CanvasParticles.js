'use client';
import { useEffect, useRef } from 'react';

export default function CanvasParticles({ text = '', preset = 'calm' }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const pointerRef = useRef({ x: -9999, y: -9999, down: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      canvas.width = Math.floor(canvas.clientWidth * DPR);
      canvas.height = Math.floor(canvas.clientHeight * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // draw text to offscreen canvas and sample
    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d');
    const w = 600, h = 200;
    off.width = w; off.height = h;
    offCtx.clearRect(0,0,w,h);
    offCtx.font = 'bold 96px system-ui, sans-serif';
    offCtx.fillStyle = '#000';
    offCtx.textBaseline = 'middle';
    offCtx.textAlign = 'center';
    offCtx.fillText(text || '', w/2, h/2);

    const img = offCtx.getImageData(0,0,w,h).data;
    const points = [];
    const step = preset === 'chaotic' ? 4 : 6;
    for (let y=0;y<h;y+=step){
      for (let x=0;x<w;x+=step){
        const idx = (y*w + x)*4;
        if (img[idx] > 128) {
          points.push({x: x/w*canvas.clientWidth, y: y/h*canvas.clientHeight});
        }
      }
    }

    particlesRef.current = points.map(p => ({ x: p.x, y: p.y, ox: p.x, oy: p.y, vx: 0, vy: 0 }));

    function render() {
      ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);

      // draw connections
      if (preset !== 'outline') {
        ctx.strokeStyle = 'rgba(6,18,38,0.08)';
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

        // color ramp
        const c = Math.min(255, 30 + Math.abs(Math.sin((pt.x+pt.y)/50))*220);
        ctx.fillStyle = `rgb(${c},${60},${160})`;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, preset==='chaotic' ? 2.2 : 1.6, 0, Math.PI*2); ctx.fill();
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
      cancelAnimationFrame(rafRef.current);
    };
  }, [text, preset]);

  return (
    <div style={{minHeight:260,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <canvas ref={canvasRef} style={{width:'100%',height:240,maxWidth:900,background:'#fbfcfe',borderRadius:8}} />
    </div>
  );
}
