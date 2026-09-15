'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Canvas particle breakup: rasterize text to offscreen canvas, sample pixels, animate points
export default function CanvasParticles({ text = '' }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

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

    // draw text to small offscreen canvas and sample
    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d');
    const w = 500, h = 200;
    off.width = w; off.height = h;
    offCtx.fillStyle = '#000';
    offCtx.fillRect(0,0,w,h);
    offCtx.font = 'bold 96px system-ui, sans-serif';
    offCtx.fillStyle = '#fff';
    offCtx.textBaseline = 'middle';
    offCtx.textAlign = 'center';
    offCtx.fillText(text || '', w/2, h/2);

    const img = offCtx.getImageData(0,0,w,h).data;
    const points = [];
    const step = 6; // sampling step
    for (let y=0;y<h;y+=step){
      for (let x=0;x<w;x+=step){
        const idx = (y*w + x)*4;
        if (img[idx] > 128) {
          points.push({x: x/w*canvas.clientWidth, y: y/h*canvas.clientHeight});
        }
      }
    }

    // create particles from points
    particlesRef.current = points.map(p => ({ x: p.x, y: p.y, ox: p.x, oy: p.y, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4 }));

    function render() {
      ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
      ctx.fillStyle = '#061226';
      particlesRef.current.forEach(pt => {
        // simple physics
        pt.vx *= 0.98; pt.vy *= 0.98;
        pt.x += pt.vx; pt.y += pt.vy;
        // spring back
        pt.vx += (pt.ox - pt.x) * 0.02;
        pt.vy += (pt.oy - pt.y) * 0.02;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.6, 0, Math.PI*2);
        ctx.fill();
      });
      rafRef.current = requestAnimationFrame(render);
    }
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [text]);

  return (
    <div style={{minHeight:260,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <canvas ref={canvasRef} style={{width:'100%',height:240,maxWidth:900,background:'#f6f8fb',borderRadius:8}} />
    </div>
  );
}
