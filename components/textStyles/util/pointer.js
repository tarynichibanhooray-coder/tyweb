// Shared cursor/touch tracking for the text styles. Each style calls
// trackPointer(el) in mount, sample() once per animation frame, and
// dispose() in its cleanup. Everything eases, so a style that multiplies
// its effect by `presence` returns to its normal behaviour on its own
// about a second after the pointer leaves (or the finger lifts).
//
// Uses pointer events only, without touch-action: none, so on touch it
// reacts while the finger is down and never blocks page scrolling.

const PRESENCE_IN_MS = 150; // how quickly an effect comes in
const PRESENCE_OUT_MS = 900; // how slowly it fades back out
const VELOCITY_DECAY_MS = 250; // velocity eases to zero once movement stops
const TAP_MAX_MS = 300;
const TAP_MAX_PX = 10;

export function trackPointer(el) {
  const s = {
    x: 0, // position in px relative to el's top-left
    y: 0,
    w: 1, // el's size at the last event
    h: 1,
    inside: false,
    down: false,
    presence: 0, // 0..1, eased toward 1 while inside/touching
    vx: 0, // px/sec, smoothed
    vy: 0,
    speed: 0,
  };
  let last = null;
  let downAt = null;
  let tap = null;
  let lastSample = performance.now();

  function locate(e) {
    const r = el.getBoundingClientRect();
    s.w = r.width || 1;
    s.h = r.height || 1;
    s.x = e.clientX - r.left;
    s.y = e.clientY - r.top;
  }

  function onMove(e) {
    locate(e);
    const t = performance.now();
    if (last) {
      const dt = Math.max(8, t - last.t) / 1000;
      s.vx = s.vx * 0.5 + ((s.x - last.x) / dt) * 0.5;
      s.vy = s.vy * 0.5 + ((s.y - last.y) / dt) * 0.5;
    }
    last = { x: s.x, y: s.y, t };
    s.inside = true;
  }

  function onDown(e) {
    locate(e);
    s.down = true;
    s.inside = true;
    last = { x: s.x, y: s.y, t: performance.now() };
    downAt = { ...last };
  }

  function onUp(e) {
    locate(e);
    const t = performance.now();
    if (downAt && t - downAt.t < TAP_MAX_MS && Math.hypot(s.x - downAt.x, s.y - downAt.y) < TAP_MAX_PX) {
      tap = { x: s.x, y: s.y };
    }
    downAt = null;
    s.down = false;
    if (e.pointerType !== 'mouse') s.inside = false; // a lifted finger isn't "hovering"
  }

  function onLeave() {
    s.inside = false;
    s.down = false;
    downAt = null;
    last = null;
  }

  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('pointercancel', onLeave);

  return {
    // Call once per frame; returns the eased state.
    sample() {
      const now = performance.now();
      const dt = Math.min(100, now - lastSample);
      lastSample = now;
      const target = s.inside || s.down ? 1 : 0;
      const tau = target > s.presence ? PRESENCE_IN_MS : PRESENCE_OUT_MS;
      s.presence += (target - s.presence) * (1 - Math.exp(-dt / tau));
      const decay = Math.exp(-dt / VELOCITY_DECAY_MS);
      s.vx *= decay;
      s.vy *= decay;
      s.speed = Math.hypot(s.vx, s.vy);
      return s;
    },
    // Returns the last tap ({x, y} in px) once, then null until the next.
    takeTap() {
      const t = tap;
      tap = null;
      return t;
    },
    dispose() {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointercancel', onLeave);
    },
  };
}
