'use client';
import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import '../styles/split-demo.css';

const SplitScenario = dynamic(() => import('./SplitScenario'), { ssr: false });
const SvgScenario = dynamic(() => import('./SvgScenario'), { ssr: false });
const CanvasParticles = dynamic(() => import('./CanvasParticles'), { ssr: false });

const SCENARIOS = [
  { id: 'dom', label: 'DOM (GSAP)' },
  { id: 'svg', label: 'SVG' },
  { id: 'canvas', label: 'Canvas Particles' }
];

export default function DemoHost() {
  const [text, setText] = useState('KINETIC TYPOGRAPHY');
  const [scenario, setScenario] = useState('dom');

  useEffect(() => {
    // basic keyboard shortcuts: 1..3 switch scenarios
    function onKey(e) {
      if (e.key >= '1' && e.key <= '3') {
        const idx = Number(e.key) - 1;
        setScenario(SCENARIOS[idx].id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{width:'100%',maxWidth:1000}}>
      <div style={{display:'flex',gap:12,marginBottom:12}}>
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => setScenario(s.id)} aria-pressed={scenario===s.id}
            style={{padding:'8px 12px',borderRadius:8,border:'1px solid rgba(0,0,0,0.08)',background:scenario===s.id? '#061226':'#fff',color:scenario===s.id? '#fff':'#061226'}}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{marginBottom:12}}>
        <input aria-label="Type text" value={text} onChange={e => setText(e.target.value)}
          style={{width:'100%',padding:12,borderRadius:8,border:'1px solid rgba(0,0,0,0.08)',fontSize:18}}/>
      </div>

      <div style={{background:'#fff',padding:20,borderRadius:12,border:'1px solid rgba(0,0,0,0.04)'}}>
        <Suspense fallback={<div style={{height:320,display:'flex',alignItems:'center',justifyContent:'center'}}>Loading...</div>}>
          {scenario === 'dom' && <SplitScenario text={text} />}
          {scenario === 'svg' && <SvgScenario text={text} />}
          {scenario === 'canvas' && <CanvasParticles text={text} />}
        </Suspense>
      </div>

    </div>
  );
}
