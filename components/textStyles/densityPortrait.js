// Direct reference: the "Overload / Decimal" poster — a field of one
// repeated word, tiled so densely that local variation in size/weight
// forms a larger figurative image, like ASCII art built from real words.
// There's no target image to trace here, so the "brightness field" is a
// slowly evolving simplex-noise surface instead — an organic cloud of the
// sentence's own words, denser and larger where the noise peaks, sparse
// and faint in the troughs, continuously drifting.
import { createNoise2D } from 'simplex-noise';

export function mount(el, text) {
  el.textContent = '';
  el.style.position = 'relative';
  el.style.width = '100%';
  el.style.minHeight = '260px';

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '260px';
  canvas.style.display = 'block';
  el.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const word = (text || '...').trim() || '...';
  const noise = createNoise2D();
  const cols = 22;
  const rows = 9;

  function resize() {
    const rect = el.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, rect.width) * dpr;
    canvas.height = 260 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const start = performance.now();
  let raf = requestAnimationFrame(tick);

  function tick(now) {
    const tRaw = (now - start) / 1000;
    const t = tRaw * 0.072;
    const rect = el.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = 260;
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#39ff14';

    // Mostly dense and chaotic, but every ~15.6s the threshold pulses up —
    // fewer, larger, more separated words survive that cutoff. The power
    // here controls how long that sparse state holds (not how often it
    // happens, which is the period above) — an explicit attack/hold/release
    // envelope instead of a sine power: a sine power can't give both a
    // smooth ramp AND a real hold at peak, since narrowing the peak (to
    // keep it brief) also sharpens the transition into it. This eases in,
    // actually holds at full clarity for a stretch, then eases back out.
    const period = 15.6;
    const phase = (tRaw % period) / period; // 0..1
    const rampIn = 0.12, hold = 0.22, rampOut = 0.12;
    const smoothstep = (x) => x * x * (3 - 2 * x);
    let clarity;
    if (phase < rampIn) {
      clarity = smoothstep(phase / rampIn);
    } else if (phase < rampIn + hold) {
      clarity = 1;
    } else if (phase < rampIn + hold + rampOut) {
      clarity = 1 - smoothstep((phase - rampIn - hold) / rampOut);
    } else {
      clarity = 0;
    }
    const threshold = 0.42 + clarity * 0.48; // baseline 15% less dense than 0.32 (68% pass rate -> 58%)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = c / cols;
        const ny = r / rows;
        const n = noise(nx * 3 + t, ny * 3 + t * 0.7); // -1..1
        const brightness = (n + 1) / 2; // 0..1
        if (brightness < threshold) continue; // troughs stay empty, like the poster's negative space
        const size = 8 + brightness * 20;
        // Steep contrast: cells just past the threshold stay near-invisible
        // background noise, and only the brightest cells read strongly —
        // normalized against the current passing range, not raw brightness.
        const norm = (brightness - threshold) / (1 - threshold);
        ctx.globalAlpha = 0.06 + Math.pow(norm, 1.6) * 0.94;
        ctx.font = `${size.toFixed(1)}px system-ui, sans-serif`;
        const x = (c + 0.5) * (w / cols);
        const y = (r + 0.5) * (h / rows);
        ctx.fillText(word, x, y);
      }
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(tick);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    el.textContent = '';
  };
}
