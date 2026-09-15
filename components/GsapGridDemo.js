'use client';
import { useEffect, useRef, useState } from 'react';

export default function GsapGridDemo({ text = '', preset = 'calm' }) {
  const containerRef = useRef(null);
  const tweenRef = useRef(null);
  const [cells, setCells] = useState([]);
  const [cols, setCols] = useState(40);
  const [rows, setRows] = useState(12);
  const [yoyoEnabled, setYoyoEnabled] = useState(false); // local toggle, default off

  // generate grid cells from the sampled text
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const rect = container.getBoundingClientRect();
      const cssW = Math.max(300, rect.width || 600);
      const cssH = Math.max(120, rect.height || 240);
      const c = Math.max(8, Math.min(80, Math.floor(cssW / 14)));
      const r = Math.max(6, Math.min(40, Math.floor(cssH / 20)));
      return { cssW, cssH, c, r };
    }

    const { cssW, cssH, c, r } = measure();
    setCols(c); setRows(r);

    const off = document.createElement('canvas');
    const offCtx = off.getContext && off.getContext('2d');
    if (!offCtx) {
      const fallback = new Array(c * r).fill(0).map(() => ({ inside: Math.random() < 0.15 }));
      setCells(fallback);
      return;
    }

    const W = c * 10;
    const H = r * 10;
    off.width = W;
    off.height = H;
    offCtx.clearRect(0, 0, W, H);

    let displayText = (text && text.trim().length > 0) ? text.trim() : 'go';
    displayText = displayText.slice(0, 12);

    const fontSize = Math.floor(H * 0.7);
    offCtx.font = `bold ${fontSize}px system-ui, sans-serif`;
    offCtx.fillStyle = '#000';
    offCtx.textBaseline = 'middle';
    offCtx.textAlign = 'center';
    offCtx.fillText(displayText, W / 2, H / 2);

    let img;
    try {
      img = offCtx.getImageData(0, 0, W, H).data;
    } catch (e) {
      img = null;
    }

    const pts = [];
    if (img) {
      for (let row = 0; row < r; row++) {
        for (let col = 0; col < c; col++) {
          const cx = Math.floor((col + 0.5) / c * W);
          const cy = Math.floor((row + 0.5) / r * H);
          const idx = (cy * W + cx) * 4;
          const alpha = img[idx + 3];
          const lum = img[idx] + img[idx + 1] + img[idx + 2];
          const inside = alpha > 10 || lum > 30;
          pts.push({ inside });
        }
      }
    } else {
      for (let i = 0; i < c * r; i++) pts.push({ inside: Math.random() < 0.15 });
    }

    setCells(pts);
  }, [text, preset]);

  // run GSAP animation after cells have rendered; recreate when yoyoEnabled changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!cells || cells.length === 0) return;

    // ensure DOM paint
    const t = setTimeout(() => {
      import('gsap').then((mod) => {
        const gsap = (mod && (mod.gsap || mod.default)) || mod;
        if (!gsap) {
          console.error('GSAP import succeeded but no gsap export found');
          return;
        }

        // kill previous tween
        if (tweenRef.current) {
          try { tweenRef.current.kill(); } catch (e) {}
          tweenRef.current = null;
        }

        const boxes = Array.from(container.querySelectorAll('.box'));
        if (!boxes || boxes.length === 0) {
          console.warn('GSAP grid: no .box elements found');
          return;
        }

        boxes.forEach(b => { b.style.willChange = 'transform'; b.style.transform = 'translateY(0px)'; });

        // Use stagger config with grid:'auto' primary, fallback to explicit grid
        let staggerGrid = 'auto';
        try {
          tweenRef.current = gsap.to(boxes, {
            y: 100,
            duration: 0.9,
            ease: 'power2.inOut',
            stagger: {
              each: 0.1,
              from: 'center',
              grid: staggerGrid
            },
            repeat: -1,
            repeatDelay: 0,
            yoyo: !!yoyoEnabled
          });
        } catch (err) {
          console.warn('GSAP stagger grid:auto failed, falling back to explicit grid', err);
          try {
            tweenRef.current = gsap.to(boxes, {
              y: 100,
              duration: 0.9,
              ease: 'power2.inOut',
              stagger: {
                each: 0.1,
                from: 'center',
                grid: [cols, rows]
              },
              repeat: -1,
              repeatDelay: 0,
              yoyo: !!yoyoEnabled
            });
          } catch (err2) {
            console.error('GSAP stagger fallback failed', err2);
          }
        }

        console.info('GSAP grid animation started', { count: boxes.length, cols, rows, yoyoEnabled });
      }).catch((err) => {
        console.error('Failed to import GSAP', err);
      });
    }, 40);

    return () => {
      clearTimeout(t);
      if (tweenRef.current) {
        try { tweenRef.current.kill(); } catch (e) {}
        tweenRef.current = null;
      }
    };
  }, [cells, cols, rows, yoyoEnabled]);

  return (
    <div style={{minHeight:260,display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:8}}>
        <label style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:13,color:'#374151'}}>
          <input type="checkbox" checked={yoyoEnabled} onChange={e => setYoyoEnabled(e.target.checked)} />
          <span>Enable yoyo</span>
        </label>
      </div>

      <div style={{minHeight:240,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',boxSizing:'border-box'}}>
        <div
          ref={containerRef}
          className="gsap-grid"
          style={{
            width:'100%',
            maxWidth:'100%',
            height:240,
            display:'grid',
            gridTemplateColumns:`repeat(${cols}, minmax(0, 1fr))`,
            gridAutoRows:'1fr',
            gap:6,
            background:'#fff',
            padding:8,
            borderRadius:8,
            boxSizing:'border-box',
            overflow:'hidden'
          }}
        >
          {cells.length === 0 ? (
            <div style={{gridColumn:`1 / -1`,display:'flex',alignItems:'center',justifyContent:'center'}}>Preparing grid…</div>
          ) : (
            cells.map((c,i) => (
              <div
                key={i}
                className={"box" + (c.inside ? ' inside' : '')}
                style={{width:'100%',aspectRatio:'1 / 1',background: c.inside ? '#000' : 'rgb(220,40,60)',borderRadius:4}}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
