// Direct reference: the "NOISE_TYPE_WAVES" technical-sample print — a dense
// monospace wall of one repeated sentence (left half reading forward, right
// half mirrored back toward the centre) with an open negative-space shape
// carved out of the middle, characters smearing where they meet its edge.
// Here the carved-out shape is a woman's silhouette that moves between a
// set of distinct poses (arms raised, hands on hips, a wave, a step...),
// holding each for a few seconds, with a subtle drift on top, while every
// column of characters keeps flowing downward at a slightly staggered
// phase, so rows ripple but stay readable.
import { createNoise2D } from 'simplex-noise';

const HEIGHT = 520;
const ACCENT = '#d0623a';
const FLOW_ROWS_PER_SEC = 1.1;
const EDGE = 0.035; // band (in figure units) outside the silhouette where characters smear
const POSE_HOLD_S = 4; // seconds each pose is held
const POSE_MOVE_S = 2.5; // seconds to move into the next pose

// Keyframe poses: elbow/hand and knee/ankle positions in figure units
// (shoulders sit at x ±0.15, y 0.31; hips at x ±0.075, y 0.62).
const POSES = [
  { // relaxed, arms down
    lE: [-0.18, 0.46], lH: [-0.17, 0.6], rE: [0.18, 0.46], rH: [0.17, 0.6],
    lK: [-0.075, 0.79], lA: [-0.06, 0.96], rK: [0.075, 0.79], rA: [0.06, 0.96],
  },
  { // hands on hips, feet apart
    lE: [-0.27, 0.42], lH: [-0.15, 0.54], rE: [0.27, 0.42], rH: [0.15, 0.54],
    lK: [-0.095, 0.79], lA: [-0.11, 0.96], rK: [0.095, 0.79], rA: [0.11, 0.96],
  },
  { // both arms raised overhead
    lE: [-0.2, 0.2], lH: [-0.08, 0.05], rE: [0.2, 0.2], rH: [0.08, 0.05],
    lK: [-0.07, 0.79], lA: [-0.05, 0.96], rK: [0.07, 0.79], rA: [0.05, 0.96],
  },
  { // waving: right arm up, left hand on hip, weight on left leg
    lE: [-0.27, 0.42], lH: [-0.15, 0.54], rE: [0.26, 0.22], rH: [0.28, 0.08],
    lK: [-0.08, 0.79], lA: [-0.07, 0.96], rK: [0.055, 0.78], rA: [0.11, 0.96],
  },
  { // arms out to the sides, wide stance
    lE: [-0.29, 0.34], lH: [-0.4, 0.3], rE: [0.29, 0.34], rH: [0.4, 0.3],
    lK: [-0.13, 0.79], lA: [-0.18, 0.96], rK: [0.13, 0.79], rA: [0.18, 0.96],
  },
  { // mid-step, arms swinging
    lE: [-0.15, 0.45], lH: [-0.1, 0.58], rE: [0.2, 0.45], rH: [0.25, 0.57],
    lK: [-0.11, 0.78], lA: [-0.17, 0.95], rK: [0.06, 0.8], rA: [0.05, 0.96],
  },
];

function lerpPose(a, b, s) {
  const out = {};
  for (const key of Object.keys(a)) {
    out[key] = [a[key][0] + (b[key][0] - a[key][0]) * s, a[key][1] + (b[key][1] - a[key][1]) * s];
  }
  return out;
}

function smoothstep(p) {
  return p * p * (3 - 2 * p);
}

function smin(a, b, k) {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b + (a - b) * h - k * h * (1 - h);
}

function circle(x, y, cx, cy, r) {
  return Math.hypot(x - cx, y - cy) - r;
}

function ellipse(x, y, cx, cy, rx, ry) {
  // Approximate distance, good enough near the boundary.
  const k = Math.hypot((x - cx) / rx, (y - cy) / ry);
  return (k - 1) * Math.min(rx, ry);
}

// Capsule whose radius tapers from r1 at a to r2 at b (Inigo Quilez's
// round cone, in 2D) — used for the limbs so thighs narrow to ankles.
function roundCone(x, y, ax, ay, bx, by, r1, r2) {
  const bax = bx - ax, bay = by - ay;
  const l2 = bax * bax + bay * bay;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pax = x - ax, pay = y - ay;
  const yy = pax * bax + pay * bay;
  const z = yy - l2;
  const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy;
  const x2 = qx * qx + qy * qy;
  const y2 = yy * yy * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
}

function capsule(x, y, ax, ay, bx, by, r) {
  const px = x - ax, py = y - ay, dx = bx - ax, dy = by - ay;
  const h = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - dx * h, py - dy * h) - r;
}

// Signed distance to the figure (negative inside). x is centred on the
// figure in height units, y runs 0 (top) .. 1 (bottom). `p` is the pose.
function figure(x, y, p) {
  // Body: a half-width profile down a gently swaying spine.
  const spineX = p.sway * Math.sin(y * Math.PI * 1.4 + 0.6);
  const prof = [
    [0.27, 0.0], [0.29, 0.045], [0.31, 0.16], [0.4, 0.13], [0.49, 0.095],
    [0.6, 0.145 + p.hip], [0.65, 0.14 + p.hip],
  ];
  let body = Infinity;
  if (y >= prof[0][0] && y <= prof[prof.length - 1][0]) {
    let i = 0;
    while (y > prof[i + 1][0]) i++;
    const [y0, w0] = prof[i];
    const [y1, w1] = prof[i + 1];
    const s = (y - y0) / (y1 - y0);
    const hw = w0 + (w1 - w0) * s * s * (3 - 2 * s);
    body = Math.abs(x - spineX) - hw;
  } else {
    const [edgeY, edgeW] = y < prof[0][0] ? prof[0] : prof[prof.length - 1];
    body = Math.max(Math.abs(y - edgeY), Math.abs(x - spineX) - edgeW);
  }

  const headX = p.headX;
  const head = ellipse(x, y, headX, 0.14, 0.062, 0.078);
  const neck = capsule(x, y, headX * 0.6, 0.2, 0, 0.29, 0.03);
  // Long hair falling behind the head, swinging with the pose.
  const hair = capsule(x, y, headX + 0.01, 0.12, headX + p.hair, 0.36, 0.06);

  // Arms: shoulder -> elbow -> hand, from the current (blended) pose.
  const sh = 0.31;
  const { lE, lH, rE, rH, lK, lA, rK, rA } = p.joints;
  const armL = Math.min(
    capsule(x, y, -0.15, sh, lE[0], lE[1], 0.032),
    capsule(x, y, lE[0], lE[1], lH[0], lH[1], 0.027),
  );
  const armR = Math.min(
    capsule(x, y, 0.15, sh, rE[0], rE[1], 0.032),
    capsule(x, y, rE[0], rE[1], rH[0], rH[1], 0.027),
  );

  // Legs: hip -> knee -> ankle, tapering.
  const legs = [[-1, lK, lA], [1, rK, rA]].map(([side, knee, ankle]) => Math.min(
    roundCone(x, y, side * 0.075, 0.62, knee[0], knee[1], 0.07, 0.047),
    roundCone(x, y, knee[0], knee[1], ankle[0], ankle[1], 0.047, 0.026),
  ));

  let d = smin(body, neck, 0.03);
  d = smin(d, legs[0], 0.03);
  d = smin(d, legs[1], 0.03);
  d = smin(d, head, 0.02);
  d = smin(d, hair, 0.04);
  d = smin(d, armL, 0.025);
  d = smin(d, armR, 0.025);
  return d;
}

export function mount(el, text) {
  el.textContent = '';
  el.style.position = 'relative';
  el.style.width = '100%';
  el.style.minHeight = `${HEIGHT}px`;

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = `${HEIGHT}px`;
  canvas.style.display = 'block';
  el.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const stream = `${(text || '...').trim() || '...'} `;
  const L = stream.length;
  const ink = getComputedStyle(el).color || '#fff';
  const noise = createNoise2D();

  function resize() {
    const rect = el.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, rect.width) * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Pose order: random, never the same pose twice in a row, grown lazily.
  const poseOrder = [0];
  const poseAt = (i) => {
    while (poseOrder.length <= i) {
      let next;
      do next = Math.floor(Math.random() * POSES.length);
      while (next === poseOrder[poseOrder.length - 1]);
      poseOrder.push(next);
    }
    return POSES[poseOrder[i]];
  };

  const start = performance.now();
  let raf = requestAnimationFrame(tick);

  function tick(now) {
    // rAF timestamps can be slightly earlier than performance.now() at mount;
    // clamp so the first frame never computes a negative pose index.
    const tRaw = Math.max(0, (now - start) / 1000);
    const t = tRaw * 0.08;
    const w = Math.max(1, el.getBoundingClientRect().width);
    const h = HEIGHT;
    ctx.clearRect(0, 0, w, h);

    const fontSize = Math.max(8, Math.min(13, w / 58));
    const cellW = fontSize * 0.62;
    const cellH = fontSize * 1.15;
    const cols = Math.floor(w / cellW);
    const rows = Math.ceil(h / cellH) + 1;
    const xPad = (w - cols * cellW) / 2;
    ctx.font = `500 ${fontSize}px ui-monospace, Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Hold a keyframe pose, then ease into the next; small noise drift on
    // spine, hips, head and hair keeps her alive while holding.
    const seg = POSE_HOLD_S + POSE_MOVE_S;
    const segIndex = Math.floor(tRaw / seg);
    const into = tRaw - segIndex * seg - POSE_HOLD_S;
    const blend = into <= 0 ? 0 : smoothstep(into / POSE_MOVE_S);
    const pose = {
      sway: noise(1, t) * 0.035,
      hip: noise(2, t) * 0.03,
      headX: noise(4, t) * 0.03,
      hair: noise(5, t * 1.3) * 0.07,
      joints: lerpPose(poseAt(segIndex), poseAt(segIndex + 1), blend),
    };
    const figScale = 0.92; // figure height as a fraction of the canvas
    const figTop = (1 - figScale) / 2;

    for (let c = 0; c < cols; c++) {
      // Each column falls at the same speed but a staggered phase, so rows
      // ripple instead of moving as one rigid block.
      const stagger = (noise(c * 0.13, 50) + 1) * 0.45;
      const scroll = tRaw * FLOW_ROWS_PER_SEC + stagger;
      const frac = scroll % 1;
      const mirrored = c >= cols / 2;
      const cc = mirrored ? cols - 1 - c : c;
      const cx = xPad + (c + 0.5) * cellW;

      for (let r = -1; r < rows; r++) {
        const y = (r + frac) * cellH;
        if (y < -cellH || y > h + cellH) continue;
        const k = r - Math.floor(scroll); // which text row this cell carries
        const ch = stream[((cc + k * 3) % L + L) % L];
        if (ch === ' ') continue;

        const fx = (cx - w / 2) / (h * figScale);
        const fy = (y / h - figTop) / figScale;
        const d = figure(fx, fy, pose);
        if (d < 0) continue; // inside the silhouette: open space

        const accentRow = ((k % 9) + 9) % 9 === 4;
        ctx.fillStyle = accentRow ? ACCENT : ink;
        if (d < EDGE) {
          // Smear: characters at the edge stretch vertically and fade, like
          // ink dragged along the contour.
          const e = 1 - d / EDGE;
          ctx.globalAlpha = 0.35 + 0.5 * (1 - e);
          ctx.save();
          ctx.translate(cx, y);
          ctx.scale(1, 1 + e * 1.6);
          ctx.fillText(ch, 0, 0);
          ctx.restore();
        } else {
          ctx.globalAlpha = accentRow ? 0.9 : 0.85;
          ctx.fillText(ch, cx, y);
        }
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
