'use client';
import { useEffect } from 'react';

export default function KineticPlaceholder() {
  useEffect(() => {
    // placeholder for client-side initialization (e.g., Pixi, Canvas)
  }, []);

  return (
    <div id="kinetic-placeholder" style={{width:'100%',maxWidth:960,height:320,display:'flex',alignItems:'center',justifyContent:'center',background:'#061226',color:'#fff',borderRadius:12}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:20,fontWeight:700}}>Kinetic Placeholder</div>
        <div style={{fontSize:13,opacity:0.8}}>Client-only component (for Pixi/Canvas)</div>
      </div>
    </div>
  );
}
