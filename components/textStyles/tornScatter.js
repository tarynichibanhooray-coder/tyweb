// Direct reference: the "SOBRE" erasure-poem collage — irregular torn
// paper scraps scattered at non-linear positions across a grainy black
// canvas, each scrap sized to its own phrase, torn edges continuously
// morphed by flubber, real grain on both the scraps and the canvas.
import * as flubber from 'flubber';
import gsap from 'gsap';
import { grainDataUrl } from './util/noiseTexture';

const SVG_NS = 'http://www.w3.org/2000/svg';

function tornPath() {
  const stepsX = 5;
  const pts = [];
  for (let i = 0; i <= stepsX; i++) pts.push([i / stepsX, 0.08 + Math.random() * 0.2]);
  for (let i = stepsX; i >= 0; i--) pts.push([i / stepsX, 0.8 + Math.random() * 0.2]);
  return `M${pts.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join('L')}Z`;
}

// Chunk the sentence into 2-3 word phrases — the reference groups words
// into scraps, not one scrap per word or one scrap for the whole line.
function chunkPhrase(text) {
  const words = text.split(' ').filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; ) {
    const n = 1 + Math.floor(Math.random() * 2);
    chunks.push(words.slice(i, i + n).join(' '));
    i += n;
  }
  return chunks.length ? chunks : [text];
}

export function mount(el, text) {
  el.textContent = '';
  el.style.position = 'relative';
  el.style.width = '100%';
  el.style.minHeight = '220px';
  el.style.backgroundImage = `url(${grainDataUrl()})`;
  el.style.backgroundBlendMode = 'overlay';
  el.style.backgroundSize = '128px 128px';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  const defs = document.createElementNS(SVG_NS, 'defs');
  svg.appendChild(defs);
  el.appendChild(svg);

  const chunks = chunkPhrase(text);
  const timelines = [];
  // Loose top-to-bottom flow with drifting left/right, like the reference —
  // not a grid, not a single row. Pixel increments, not percentages, so the
  // container's height (derived from this same cursor) doesn't create a
  // circular dependency with each scrap's own position.
  const rowHeight = 44;
  let cursorY = 12;
  chunks.forEach((chunk, i) => {
    const left = 6 + Math.random() * 50;
    const top = cursorY;
    cursorY += rowHeight * (0.75 + Math.random() * 0.6);

    const wrap = document.createElement('div');
    wrap.textContent = chunk;
    wrap.style.position = 'absolute';
    wrap.style.left = `${left}%`;
    wrap.style.top = `${top}px`;
    wrap.style.padding = '0.3em 0.5em';
    wrap.style.background = `#e9ddc4 url(${grainDataUrl()})`;
    wrap.style.backgroundBlendMode = 'multiply';
    wrap.style.color = '#18130d';
    wrap.style.fontFamily = 'Georgia, "Times New Roman", serif';
    wrap.style.fontSize = '0.6em';
    wrap.style.boxShadow = '0 3px 8px rgba(0,0,0,0.5)';
    wrap.style.whiteSpace = 'nowrap';

    const id = `scatter-clip-${Math.random().toString(36).slice(2)}`;
    const clipPath = document.createElementNS(SVG_NS, 'clipPath');
    clipPath.setAttribute('id', id);
    clipPath.setAttribute('clipPathUnits', 'objectBoundingBox');
    const path = document.createElementNS(SVG_NS, 'path');
    const initial = tornPath();
    path.setAttribute('d', initial);
    clipPath.appendChild(path);
    defs.appendChild(clipPath);
    wrap.style.clipPath = `url(#${id})`;

    el.appendChild(wrap);

    // Arrives from somewhere else — a random direction and rotation, like
    // it was just tossed onto the wall — rather than simply appearing
    // already scattered. Staggered per scrap so they land one after another.
    const entranceDelay = i * 0.18;
    const entranceDuration = 0.85 + Math.random() * 0.4;
    const fromAngle = Math.random() * Math.PI * 2;
    const fromDistance = 260 + Math.random() * 160;
    gsap.from(wrap, {
      x: Math.cos(fromAngle) * fromDistance,
      y: Math.sin(fromAngle) * fromDistance,
      rotate: (Math.random() - 0.5) * 220,
      opacity: 0,
      duration: entranceDuration,
      delay: entranceDelay,
      ease: 'back.out(1.3)',
    });

    const shapes = [initial, tornPath(), tornPath()];
    const tl = gsap.timeline({ repeat: -1, delay: i * 0.3 });
    for (let s = 0; s < shapes.length; s++) {
      const interpolator = flubber.interpolate(shapes[s], shapes[(s + 1) % shapes.length], { maxSegmentLength: 2 });
      const proxy = { t: 0 };
      tl.to(proxy, {
        t: 1,
        duration: 4 + Math.random() * 2,
        ease: 'sine.inOut',
        onUpdate: () => path.setAttribute('d', interpolator(proxy.t)),
      });
    }
    // A faint continuous tremble, like paper lifting slightly off the wall —
    // starts only once the entrance has landed, so the two tweens don't
    // fight over the same rotate property mid-flight.
    gsap.to(wrap, {
      rotate: (Math.random() - 0.5) * 4,
      duration: 3 + Math.random() * 2,
      delay: entranceDelay + entranceDuration,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    timelines.push(tl);
  });

  el.style.minHeight = `${Math.max(220, cursorY + rowHeight)}px`;

  return () => {
    timelines.forEach((tl) => tl.kill());
    gsap.killTweensOf(el.querySelectorAll('div'));
    svg.remove();
    el.textContent = '';
  };
}
