// Direct reference: the Andreion de Castro / Sufjan Stevens lyric piece —
// words scattered in space at different depths, some sharp, some soft,
// drifting like a slow-motion depth-of-field pull rather than sitting on
// one flat plane. Reading order needs to be visible at a glance AND needs
// to be where the eye is actually drawn — so two things carry sentence
// order together: the grid position (serpentine, sentence-adjacent words
// are grid-adjacent) and a "focus wave" that sweeps peak sharpness/size
// through the words one at a time, in order, on a loop. Without the
// second part, each word's prominence was independently random, so the
// eye would land on a bright word out of sequence even though its
// position was correct.
import { createNoise2D } from 'simplex-noise';

const STAGGER_MS = 260;
const FADE_IN_MS = 550;
const MARGIN_PCT = 14;
const MS_PER_WORD_FOCUS = 1400; // how long the focus wave dwells on each word

function smoothstep(p) {
  return p * p * (3 - 2 * p);
}

function serpentinePositions(n) {
  const cols = Math.max(2, Math.ceil(Math.sqrt(n * 1.6)));
  const rows = Math.ceil(n / cols);
  const cellW = (100 - 2 * MARGIN_PCT) / cols;
  const cellH = (100 - 2 * MARGIN_PCT) / rows;
  const positions = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const colInRow = i % cols;
    const col = row % 2 === 1 ? cols - 1 - colInRow : colInRow; // reverse alternate rows
    const cx = MARGIN_PCT + cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.22;
    const cy = MARGIN_PCT + cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.22;
    positions.push([cx, cy]);
  }
  return positions;
}

export function mount(el, text) {
  el.textContent = '';
  el.style.position = 'relative';
  el.style.width = '100%';
  el.style.minHeight = '220px';
  el.style.perspective = '600px';

  const words = text.split(' ').filter(Boolean);
  const noise = createNoise2D();
  const positions = serpentinePositions(words.length);
  const spans = words.map((w, i) => {
    const span = document.createElement('span');
    span.textContent = w;
    span.style.position = 'absolute';
    // Centered anchor keeps any word fully inside the box regardless of
    // its own width or the viewport's, unlike anchoring by left edge.
    span.style.left = `${positions[i][0]}%`;
    span.style.top = `${positions[i][1]}%`;
    span.style.whiteSpace = 'nowrap';
    span.style.color = '#39ff14';
    span.style.willChange = 'transform, filter, opacity';
    el.appendChild(span);
    return span;
  });

  const start = performance.now();
  let raf = requestAnimationFrame(tick);

  const n = words.length;

  function tick(now) {
    const elapsedMs = now - start;
    const t = (elapsedMs / 1000) * 0.15;
    // Continuously advancing pointer into the word list — where the focus
    // wave currently sits. Wraps around and loops for as long as this
    // sentence stays on screen.
    const focus = (elapsedMs / MS_PER_WORD_FOCUS) % n;

    spans.forEach((span, i) => {
      // Pops in on its own turn, in sentence order.
      const revealAt = i * STAGGER_MS;
      const appear = smoothstep(Math.min(1, Math.max(0, (elapsedMs - revealAt) / FADE_IN_MS)));

      // Circular distance from the current focus (wraps n-1 -> 0), so
      // prominence sweeps through the sentence in order instead of each
      // word having its own independent, unsynchronized depth. A Gaussian
      // falloff (not a hard cutoff) means every word gets a distinct
      // brightness based on exactly how far it is from the focus, instead
      // of everything past a fixed radius collapsing to the same flat floor.
      let dist = Math.abs(i - focus);
      dist = Math.min(dist, n - dist);
      const sigma = Math.max(1, n / 5);
      const focusGlow = Math.exp(-(dist * dist) / (2 * sigma * sigma));
      // Background words shouldn't converge to the same dim value once
      // they're far from the focus — each has its own independent,
      // fairly strong ambient brightness (its own noise stream, slower
      // drift) so away from the sweep they still visibly differ from
      // each other, not just from the focused word.
      const ambient = (noise(i * 0.9, t * 0.4) + 1) / 2;
      const depth01 = Math.max(focusGlow, ambient * 0.5);

      const x = noise(i * 0.9 + 200, t) * 8;
      const y = noise(i * 0.9 + 400, t) * 6;
      const blur = (1 - depth01) * 5;
      const scale = (0.4 + appear * 0.6) * (0.75 + depth01 * 0.45);
      const opacity = (0.22 + depth01 * 0.78) * appear;
      const glow = 2 + depth01 * 8;

      span.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(2)})`;
      span.style.filter = `blur(${blur.toFixed(2)}px) drop-shadow(0 0 ${glow.toFixed(1)}px #39ff14)`;
      span.style.opacity = opacity.toFixed(2);
      span.style.zIndex = String(Math.round(depth01 * 100));
    });
    raf = requestAnimationFrame(tick);
  }

  return () => {
    cancelAnimationFrame(raf);
    el.textContent = '';
  };
}
