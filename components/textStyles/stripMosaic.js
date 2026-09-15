// Direct reference: Ellen Bell's "About Love" document collage — dense,
// overlapping horizontal strips of cut text in different paper tones.
// We only have one sentence (not many source documents), so each strip
// crops a different, independently-drifting window of the same sentence —
// the overlap and tonal variation is what reads as "cut from many sources"
// even though it's one source repeated.
import gsap from 'gsap';
import { grainDataUrl } from './util/noiseTexture';

const TONES = ['#efe6d0', '#e3d5b8', '#d8cdb9', '#efe8dd', '#d3c7ad'];

export function mount(el, text) {
  el.textContent = '';
  el.style.position = 'relative';
  el.style.width = '100%';

  const stripCount = 7;
  const words = text.split(' ').filter(Boolean);
  const strips = [];

  for (let i = 0; i < stripCount; i++) {
    const strip = document.createElement('div');
    const tone = TONES[i % TONES.length];
    strip.style.position = 'relative';
    strip.style.background = `${tone} url(${grainDataUrl()})`;
    strip.style.backgroundBlendMode = 'multiply';
    strip.style.color = '#161208';
    strip.style.fontFamily = 'Georgia, "Times New Roman", serif';
    strip.style.fontSize = '0.55em';
    strip.style.whiteSpace = 'nowrap';
    strip.style.overflow = 'hidden';
    strip.style.padding = '0.15em 0.3em';
    strip.style.marginTop = i === 0 ? '0' : '-0.35em';
    strip.style.transform = `rotate(${(Math.random() - 0.5) * 1.6}deg)`;
    strip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.35)';
    strip.style.zIndex = String(i);
    // Repeat the sentence so a panning window always has content, then
    // crop with a fixed-width viewport and slide the offset slowly.
    strip.textContent = `${text}    ${text}    ${text}`;
    el.appendChild(strip);
    strips.push({ el: strip });
  }

  // Each strip's crop window drifts independently and slowly, so the
  // overlapping fragments never quite repeat in sync with each other.
  strips.forEach(({ el: strip }) => {
    strip.style.overflowX = 'hidden';
    const state = { x: Math.random() * 200 };
    gsap.to(state, {
      x: `+=${400 + Math.random() * 200}`,
      duration: 30 + Math.random() * 20,
      repeat: -1,
      ease: 'none',
      onUpdate: () => { strip.scrollLeft = state.x; },
    });
  });

  return () => {
    gsap.killTweensOf(strips.map((s) => s.el));
    el.textContent = '';
  };
}
