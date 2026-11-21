// Direct reference: Ellen Bell's "About Love" document collage — dense,
// overlapping horizontal strips of cut text in different paper tones.
// We only have one sentence (not many source documents), so each strip
// crops a different window of the same sentence, each panning at its own
// rate and direction (some left, some right) —
// the overlap and tonal variation is what reads as "cut from many sources"
// even though it's one source repeated.
import gsap from 'gsap';
import { grainDataUrl } from './util/noiseTexture';
import { trackPointer } from './util/pointer';

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
    // One copy of the sentence is measured to get the loop period, then
    // enough copies are added that a panning window always has content.
    const copy = document.createElement('span');
    copy.textContent = `${text}\u00a0\u00a0\u00a0\u00a0`;
    strip.appendChild(copy);
    el.appendChild(strip);
    const period = Math.max(1, copy.offsetWidth);
    const copies = Math.ceil((strip.clientWidth || 600) / period) + 2;
    for (let c = 1; c < copies; c++) strip.appendChild(copy.cloneNode(true));
    // Every strip pans at its own speed, some leftward, some rightward.
    const speed = 10 + Math.random() * 40; // px/sec
    const dir = Math.random() < 0.5 ? 1 : -1;
    strips.push({ el: strip, period, x: Math.random() * period, v: speed * dir });
  }
  // Guarantee a mix of directions even if the coin flips all agreed.
  if (strips.every((s) => Math.sign(s.v) === Math.sign(strips[0].v))) {
    strips[Math.floor(Math.random() * strips.length)].v *= -1;
  }

  // Pointer interaction: the strip under the cursor/finger is dragged along
  // with its horizontal movement, while the other strips slow almost to a
  // stop, like a hand resting on the paper.
  const pointer = trackPointer(el);
  strips.forEach((s) => { s.boost = 0; });

  // Wrapping the offset by one sentence-period makes the loop seamless in
  // either direction (scrollLeft can't go negative on its own).
  const pan = (time, deltaMs) => {
    const p = pointer.sample();
    // Topmost strip containing the pointer (later strips overlap earlier).
    let under = null;
    if (p.presence > 0.01) {
      strips.forEach((s) => {
        if (p.y >= s.el.offsetTop && p.y <= s.el.offsetTop + s.el.offsetHeight) under = s;
      });
    }
    strips.forEach((s) => {
      // Content moves right as scrollLeft drops, so follow the pointer with -vx.
      const target = s === under ? -p.vx * 0.9 * p.presence : 0;
      s.boost += (target - s.boost) * 0.15;
      const slow = s === under ? 1 : 1 - 0.85 * p.presence;
      const v = s.v * slow + s.boost;
      s.x = (((s.x + (v * deltaMs) / 1000) % s.period) + s.period) % s.period;
      s.el.scrollLeft = s.x;
    });
  };
  gsap.ticker.add(pan);

  return () => {
    gsap.ticker.remove(pan);
    pointer.dispose();
    el.textContent = '';
  };
}
