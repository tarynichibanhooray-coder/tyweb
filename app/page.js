import dynamic from 'next/dynamic';

const KineticPlaceholder = dynamic(() => import('../components/KineticPlaceholder'), { ssr: false });

export default function Page() {
  return (
    <main style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',minHeight:'100vh',padding:'40px',gap:24}}>
      <h1 style={{margin:0,fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'}}>tyweb</h1>
      <p style={{maxWidth:640,textAlign:'center'}}>Minimal Next.js scaffold for tyweb. This is a client-only placeholder for future kinetic typography components.</p>
      <KineticPlaceholder />
    </main>
  );
}
