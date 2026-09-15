// Direct reference: MNKY Koko — letters flowing along an organic contour
// instead of a straight baseline. Native SVG <textPath> does the flow.
// The curve is an OPEN path, and flubber's interpolate always closes a
// shape with a trailing Z — wrong tool here (it's built for closed-blob
// morphing, which is what it's used for elsewhere in this codebase).
// simplex-noise drives each control point continuously instead, and a
// quadratic-through-midpoints pass turns the points into a smooth curve.
import { createNoise2D } from 'simplex-noise';

const SVG_NS = 'http://www.w3.org/2000/svg';
const H = 200;
const CONTROL_COUNT = 6;
const APPROX_CHAR_WIDTH_RATIO = 0.62; // rough average glyph width as a fraction of font-size

function smoothPathFromPoints(pts) {
  if (pts.length < 3) return `M${pts.map((p) => p.join(',')).join('L')}`;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` T${last[0].toFixed(1)},${last[1].toFixed(1)}`;
  return d;
}

export function mount(el, text) {
  el.textContent = '';
  el.style.display = 'block';
  el.style.width = '100%';

  let W = Math.max(240, el.getBoundingClientRect().width || 400);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '200');
  svg.style.overflow = 'visible';

  const defs = document.createElementNS(SVG_NS, 'defs');
  const pathId = `flow-path-${Math.random().toString(36).slice(2)}`;
  const pathEl = document.createElementNS(SVG_NS, 'path');
  pathEl.setAttribute('id', pathId);
  pathEl.setAttribute('fill', 'none');
  defs.appendChild(pathEl);

  // Neon-glow filter: a doubled-up blurred copy merged behind the sharp
  // text for bloom. Blur radius and text opacity both get driven by noise
  // each frame below, so the glow breathes irregularly instead of sitting
  // at a fixed intensity.
  const filterId = `glow-${Math.random().toString(36).slice(2)}`;
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', filterId);
  filter.setAttribute('x', '-60%');
  filter.setAttribute('y', '-60%');
  filter.setAttribute('width', '220%');
  filter.setAttribute('height', '220%');
  const feGaussianBlur = document.createElementNS(SVG_NS, 'feGaussianBlur');
  feGaussianBlur.setAttribute('stdDeviation', '3');
  feGaussianBlur.setAttribute('result', 'blur');
  const feMerge = document.createElementNS(SVG_NS, 'feMerge');
  ['blur', 'blur', 'SourceGraphic'].forEach((ref) => {
    const node = document.createElementNS(SVG_NS, 'feMergeNode');
    node.setAttribute('in', ref);
    feMerge.appendChild(node);
  });
  filter.appendChild(feGaussianBlur);
  filter.appendChild(feMerge);
  defs.appendChild(filter);
  svg.appendChild(defs);

  // Fit the sentence to the actual available width instead of a fixed
  // font-size — a long sentence on a narrow mobile box would otherwise
  // run past the visible curve and get clipped by the container.
  function fitFontSize(width) {
    return Math.max(12, Math.min(22, (width * 0.85) / Math.max(1, text.length) / APPROX_CHAR_WIDTH_RATIO));
  }

  const textEl = document.createElementNS(SVG_NS, 'text');
  textEl.setAttribute('font-size', fitFontSize(W).toFixed(1));
  textEl.setAttribute('font-family', 'system-ui, sans-serif');
  textEl.setAttribute('fill', '#00eaff');
  textEl.setAttribute('filter', `url(#${filterId})`);
  const textPath = document.createElementNS(SVG_NS, 'textPath');
  textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathId}`);
  textPath.textContent = text;
  textEl.appendChild(textPath);
  svg.appendChild(textEl);

  el.appendChild(svg);

  function resize() {
    W = Math.max(240, el.getBoundingClientRect().width || 400);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    textEl.setAttribute('font-size', fitFontSize(W).toFixed(1));
  }
  window.addEventListener('resize', resize);

  const noise = createNoise2D();
  const start = performance.now();
  let raf = requestAnimationFrame(tick);

  function tick(now) {
    const t = (now - start) / 1000;
    const pts = [];
    for (let i = 0; i <= CONTROL_COUNT; i++) {
      const x = (W / CONTROL_COUNT) * i;
      const y = H / 2 + noise(i * 0.8, t * 0.08) * 70;
      pts.push([x, y]);
    }
    pathEl.setAttribute('d', smoothPathFromPoints(pts));
    // Drift the text's start offset slowly along the path too.
    const offsetPct = 4 + (noise(50, t * 0.05) + 1) * 12;
    textPath.setAttribute('startOffset', `${offsetPct.toFixed(1)}%`);

    // Vacillating glow: irregular, not a clean sine — two noise samples at
    // different rates combined so the flicker doesn't read as mechanical.
    const flicker = (noise(80, t * 0.5) + noise(120, t * 1.3) * 0.5) / 1.5; // roughly -1..1
    const opacity = 0.55 + (flicker + 1) / 2 * 0.45; // 0.55..1
    const glowRadius = 2 + (flicker + 1) / 2 * 6; // 2..8
    textEl.setAttribute('opacity', opacity.toFixed(2));
    feGaussianBlur.setAttribute('stdDeviation', glowRadius.toFixed(2));

    raf = requestAnimationFrame(tick);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    el.textContent = '';
  };
}
