'use client';
import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import '../styles/split-demo.css';

const SplitScenario = dynamic(() => import('./SplitScenario'), { ssr: false });
const SvgScenario = dynamic(() => import('./SvgScenario'), { ssr: false });
const CanvasParticles = dynamic(() => import('./CanvasParticles'), { ssr: false });
const GsapGridDemo = dynamic(() => import('./GsapGridDemo'), { ssr: false });

const SCENARIOS = [
  { id: 'dom', label: 'DOM (GSAP)' },
  { id: 'svg', label: 'SVG' },
  { id: 'canvas', label: 'Canvas Particles' },
  { id: 'gsap-blocks', label: 'GSAP Blocks' }
];

const PRESETS = [
  { id: 'calm', label: 'Calm' },
  { id: 'chaotic', label: 'Chaotic' },
  { id: 'outline', label: 'Outline' }
];

export default function DemoHost() {
  const [text, setText] = useState('KINETIC TYPOGRAPHY');
  const [scenario, setScenario] = useState('dom');
  const [preset, setPreset] = useState('calm');

  useEffect(() => {
    function onKey(e) {
      if (e.key >= '1' && e.key <= String(SCENARIOS.length)) {
        const idx = Number(e.key) - 1;
        setScenario(SCENARIOS[idx].id);
      }
      // presets: q,w,e
      if (e.key === 'q') setPreset('calm');
      if (e.key === 'w') setPreset('chaotic');
      if (e.key === 'e') setPreset('outline');
      if (e.key === ' ') { /* re-trigger animation by toggling text briefly */
        setText((t) => t + ' ');
        setTimeout(() => setText((t) => t.trim()), 40);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{width:'100%',maxWidth:1000}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:12}}>
        <div style={{display:'flex',gap:12}}>
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => setScenario(s.id)} aria-pressed={scenario===s.id}
              className={"seg-btn" + (scenario===s.id? ' active':'' )}>
              {s.label}
            </button>
          ))}
        </div>

        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => setPreset(p.id)} className={"mini-btn" + (preset===p.id? ' active':'')}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:12}}>
        <input aria-label="Type text" value={text} onChange={e => setText(e.target.value)}
          style={{width:'100%',padding:12,borderRadius:8,border:'1px solid rgba(0,0,0,0.08)',fontSize:18}}/>
      </div>

      <div style={{background:'#fff',padding:20,borderRadius:12,border:'1px solid rgba(0,0,0,0.04)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <small style={{color:'#6b7280'}}>Shortcuts: 1/2/3/4 switch scenarios • Q/W/E presets • Space retrigger</small>
          <small style={{color:'#6b7280'}}>Preset: {preset}</small>
        </div>
        <Suspense fallback={<div style={{height:360,display:'flex',alignItems:'center',justifyContent:'center'}}>Loading...</div>}>
          {scenario === 'dom' && <SplitScenario text={text} preset={preset} />}
          {scenario === 'svg' && <SvgScenario text={text} preset={preset} />}
          {scenario === 'canvas' && <CanvasParticles text={text} preset={preset} />}
          {scenario === 'gsap-blocks' && <GsapGridDemo text={text} preset={preset} />}
        </Suspense>
      </div>

    </div>
  );
}
