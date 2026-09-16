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

// Scrap i's new top is randomized within its own band of the vertical
// range, band 0 topmost — guarantees scrap i always lands above scrap
// i+1 with zero coordination between scraps. Each has its own repeat
// cycle length (from its own random departOffset/returnOffset stagger),
// so by the second cycle they're no longer in phase with each other —
// a shared "one computes, the rest read" approach breaks the moment
// that's no longer true. This has no cross-scrap dependency at all.
function bandedTop(index, count, minTop, maxTop) {
  const bandHeight = (maxTop - minTop) / count;
  return minTop + index * bandHeight + Math.random() * bandHeight;
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
  // Every scrap exits via the exact same edge — a single shared direction,
  // not per-scrap variance — so it reads as one gust sweeping all of them
  // off together, rather than each drifting its own way.
  const WIND_DIR = Math.random() < 0.5 ? 1 : -1; // 1 = off the right edge, -1 = off the left
  const containerWidth = () => el.getBoundingClientRect().width || 600;
  // Shared by every scrap, not randomized per-scrap, so they depart and
  // return together instead of drifting out of sync over repeats.
  const FLIGHT_START_DELAY = 4; // comfortably after every scrap's entrance has finished
  const BLOW_DURATION = 1.4;
  const BEAT = 2; // pause once all are gone, before any of them start back
  const RETURN_DURATION = 1.2;
  const HOLD_DURATION = 10 + Math.random() * 5; // 10-15s landed before the next blow-off
  // A natural stagger, not a synchronized start — but the ordering
  // guarantees still hold: these are worst-case landmarks computed from
  // the stagger's own max, so even the last scrap to leave has finished
  // departing before the beat starts, and the beat has fully elapsed
  // before the first scrap starts back.
  const DEPART_STAGGER_MAX = 0.6;
  const RETURN_STAGGER_MAX = 0.6;
  const ALL_GONE_AT = DEPART_STAGGER_MAX + BLOW_DURATION;
  const BEAT_END_AT = ALL_GONE_AT + BEAT;
  // Loose top-to-bottom flow with drifting left/right, like the reference —
  // not a grid, not a single row. Pixel increments, not percentages, so the
  // container's height (derived from this same cursor) doesn't create a
  // circular dependency with each scrap's own position.
  const rowHeight = 44;
  let cursorY = 12;
  const maxTopEstimate = 12 + Math.max(1, chunks.length) * rowHeight;
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
    // fight over the same rotate property mid-flight. Killed (not paused)
    // before each blow-off and a fresh one spawned after landing — pausing
    // and resuming the same instance let it snap back to its own internal
    // progress on resume, ignoring the rotate=0 set mid-flight, which was
    // the odd little pre-blow-off movement.
    function spawnIdleWobble() {
      return gsap.to(wrap, {
        rotate: (Math.random() - 0.5) * 4,
        duration: 3 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
    let idleWobble = gsap.to(wrap, {
      rotate: (Math.random() - 0.5) * 4,
      duration: 3 + Math.random() * 2,
      delay: entranceDelay + entranceDuration,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // Blows off the same edge as every other scrap, but not at the same
    // instant — a small random stagger per scrap, like a real gust catching
    // pieces of paper one after another. It still waits until every scrap
    // (even the latest to leave) is actually gone before the beat starts,
    // and the beat has fully elapsed before the first one starts back —
    // ALL_GONE_AT/BEAT_END_AT are the worst-case landmarks for that, not
    // per-scrap-relative, since each scrap's own timing now differs.
    // Rotation snaps to 0 while still offscreen and invisible — not
    // animated — so there is never any spin visible during the return.
    let pendingTarget = { left, top };
    const departOffset = Math.random() * DEPART_STAGGER_MAX;
    const returnOffset = Math.random() * RETURN_STAGGER_MAX;

    const flightTl = gsap.timeline({
      repeat: -1,
      delay: FLIGHT_START_DELAY,
      repeatDelay: HOLD_DURATION,
    });
    flightTl
      // Killed a beat before the sweep actually starts (not at the exact
      // same instant), and position/rotation are explicitly pinned to
      // their known resting values — not just rotate — so the sweep tween
      // can never start from a stale or slightly-off leftover value,
      // which was the small, sometimes-backwards flick right at departure.
      .call(() => {
        idleWobble.kill();
        gsap.set(wrap, {
          x: ((pendingTarget.left - left) / 100) * containerWidth(),
          y: pendingTarget.top - top,
          rotate: 0,
        });
      }, null, Math.max(0, departOffset - 0.3))
      .to(wrap, {
        // Pure horizontal sweep, same direction for every scrap, far
        // enough past the container width to fully clear it regardless
        // of this scrap's own starting position.
        x: () => WIND_DIR * (containerWidth() + 200),
        y: 0,
        rotate: () => `+=${180 + Math.random() * 180}`,
        duration: BLOW_DURATION,
        ease: 'power2.in',
      }, departOffset)
      .call(() => {
        pendingTarget = {
          left: 6 + Math.random() * 50,
          top: bandedTop(i, chunks.length, 12, maxTopEstimate),
        };
        gsap.set(wrap, { rotate: 0 }); // upright again before it's ever visible on the way back
      }, null, ALL_GONE_AT)
      .to(wrap, {
        // Re-enters from the same offscreen position it exited from,
        // straight to the new spot — no rotate property, so nothing spins.
        x: () => ((pendingTarget.left - left) / 100) * containerWidth(),
        y: () => pendingTarget.top - top,
        duration: RETURN_DURATION,
        ease: 'power2.out',
      }, BEAT_END_AT + returnOffset)
      .call(() => { idleWobble = spawnIdleWobble(); });

    timelines.push(tl, flightTl);
  });

  el.style.minHeight = `${Math.max(220, cursorY + rowHeight)}px`;

  return () => {
    timelines.forEach((tl) => tl.kill());
    gsap.killTweensOf(el.querySelectorAll('div'));
    svg.remove();
    el.textContent = '';
  };
}
