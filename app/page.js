'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Press_Start_2P } from 'next/font/google';

const pixelFont = Press_Start_2P({ weight: '400', subsets: ['latin'] });

const tiles = [
  {
    href: 'https://vignettes-nq5s.onrender.com/scene-machine.html',
    external: true,
    background: '#0a0f0a',
    border: '#39ff14',
    content: (
      <>
        <div className={pixelFont.className} style={{ color: '#f5d020', fontSize: 15, lineHeight: 1.6, textShadow: '2px 2px 0 #7a5c00' }}>
          8-BIT SCENE
          <br />
          MACHINE
        </div>
        <div className={pixelFont.className} style={{ color: '#b06bff', fontSize: 8, marginTop: 14 }}>
          &#9658; PIXELATE YOUR MEMORIES &#9668;
        </div>
      </>
    ),
  },
  {
    href: 'https://inthistimebefore.onrender.com/',
    external: true,
    background: '#0c0d10',
    border: 'rgba(255,255,255,0.12)',
    // Real share thumbnail pulled from the site's own og:image, not a
    // styled approximation.
    image: '/gallery/in-this-time-before.png',
    imageAlt: 'In This Time Before',
  },
  {
    href: '/rando',
    external: false,
    background: '#000',
    border: 'rgba(0,234,255,0.35)',
    content: (
      <>
        <div style={{ color: '#00eaff', fontSize: 22, fontFamily: 'system-ui, sans-serif', textShadow: '0 0 12px rgba(0,234,255,0.8)' }}>
          rando
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 14, fontFamily: 'system-ui, sans-serif' }}>
          a shared, ever-changing sentence
        </div>
      </>
    ),
  },
];

export default function Page() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gridAutoRows: '240px',
          gap: 24,
          width: '100%',
          maxWidth: 1000,
        }}
      >
        {tiles.map((tile) => {
          const props = tile.external
            ? { href: tile.href, target: '_blank', rel: 'noopener noreferrer' }
            : { href: tile.href };
          const Tag = tile.external ? 'a' : Link;
          return (
            <Tag
              key={tile.href}
              {...props}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                height: '100%',
                minHeight: 0,
                boxSizing: 'border-box',
                borderRadius: 12,
                border: `1px solid ${tile.border}`,
                background: tile.background,
                textDecoration: 'none',
                padding: tile.image ? 0 : 24,
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = `0 0 24px ${tile.border}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {tile.image ? (
                <Image src={tile.image} alt={tile.imageAlt || ''} fill style={{ objectFit: 'cover' }} />
              ) : (
                tile.content
              )}
            </Tag>
          );
        })}
      </div>
    </main>
  );
}
