'use client';
import dynamic from 'next/dynamic';

const DemoHost = dynamic(() => import('../components/DemoHost'), { ssr: false });

export default function Page() {
  return (
    <main style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',minHeight:'100vh',padding:'24px',gap:20}}>
      <h1 style={{margin:0,fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'}}>tyweb</h1>
      <p style={{maxWidth:760,textAlign:'center'}}>A compact demo site showcasing multiple kinetic typography scenarios. Switch modes, type live text, and tap to trigger effects.</p>
      <DemoHost />
    </main>
  );
}
