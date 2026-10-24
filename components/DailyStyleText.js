'use client';
import { useEffect, useRef, useState } from 'react';
import { STYLES } from './textStyles';
import { STYLE_ROTATION_MS } from '../lib/randoConfig';

// Wall-clock slot, not time since page load — every viewer computes the
// same index at the same moment, same shared-derivation principle as the
// sentence scheduling. Slots cycle through STYLES in order.
function styleIndexAt(now = Date.now()) {
  return Math.floor(now / STYLE_ROTATION_MS) % STYLES.length;
}

// Transition between styles: the outgoing one dissolves like mist — it
// softens, brightens and drifts slightly toward the viewer as it fades —
// while the incoming one condenses out of the same haze a beat later.
// Only opacity/filter/transform, so it stays cheap over canvas and WebGL.
const OUT_MS = 1600;
const IN_DELAY_MS = 700;
const IN_MS = 1800;
const EASE_OUT = 'cubic-bezier(0.4, 0, 0.6, 1)';
const EASE_IN = 'cubic-bezier(0.2, 0.6, 0.2, 1)';

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function transition(ms, ease, delay = 0) {
  return ['opacity', 'filter', 'transform'].map((p) => `${p} ${ms}ms ${ease} ${delay}ms`).join(', ');
}

// One mounted style, in three nested elements:
// - placement: in flow while current; once leaving, absolutely centred over
//   the incoming layer (not animated, so it never slides)
// - visual: the haze transition itself
// - mount target: what the style draws into, so the style's own inline
//   transforms/filters never fight the transition's
function StyleLayer({ styleIndex, text, leaving, className, style }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return STYLES[styleIndex].mount(el, text);
  }, [styleIndex, text]);

  // Start hazy, then flip to clear after a frame so the transition runs.
  useEffect(() => {
    let id2;
    const id = requestAnimationFrame(() => { id2 = requestAnimationFrame(() => setShown(true)); });
    return () => { cancelAnimationFrame(id); cancelAnimationFrame(id2); };
  }, []);

  const reduced = prefersReducedMotion();
  let visual;
  if (leaving) {
    visual = {
      opacity: 0,
      filter: reduced ? 'none' : 'blur(14px) brightness(1.7)',
      transform: reduced ? 'none' : 'scale(1.05)',
      transition: transition(OUT_MS, EASE_OUT),
    };
  } else if (shown) {
    visual = {
      opacity: 1,
      filter: reduced ? 'none' : 'blur(0px) brightness(1)',
      transform: 'scale(1)',
      transition: transition(IN_MS, EASE_IN, IN_DELAY_MS),
    };
  } else {
    visual = {
      opacity: 0,
      filter: reduced ? 'none' : 'blur(14px) brightness(1.7)',
      transform: reduced ? 'scale(1)' : 'scale(0.97)',
    };
  }

  const placement = leaving
    ? { position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }
    : null;

  return (
    <div style={placement}>
      <div className={className} style={{ ...style, willChange: 'opacity, filter, transform', ...visual }}>
        <div ref={ref} />
      </div>
    </div>
  );
}

export default function DailyStyleText({ text = '', className, style }) {
  // One flat, keyed list: [...leaving, current]. Keeping every layer in the
  // same list is what lets a layer switch from current to leaving without
  // React remounting it (which would restart the style mid-fade).
  const [layers, setLayers] = useState(() => [{ id: 0, styleIndex: styleIndexAt(), leaving: false }]);
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const textRef = useRef(text);
  textRef.current = text;

  // Wake exactly at the next slot boundary rather than polling, so the
  // switch lands on time.
  useEffect(() => {
    let id;
    const removals = [];
    const schedule = () => {
      const now = Date.now();
      id = setTimeout(() => {
        const next = styleIndexAt();
        const cur = layersRef.current[layersRef.current.length - 1];
        if (cur.styleIndex !== next) {
          // Outgoing layer keeps the text it had, so it doesn't remount
          // mid-fade if a new sentence arrives during the transition.
          setLayers((ls) => [
            ...ls.map((l) => (l.id === cur.id ? { ...l, leaving: true, text: textRef.current } : l)),
            { id: cur.id + 1, styleIndex: next, leaving: false },
          ]);
          removals.push(setTimeout(() => setLayers((ls) => ls.filter((l) => l.id !== cur.id)), OUT_MS + 100));
        }
        schedule();
      }, STYLE_ROTATION_MS - (now % STYLE_ROTATION_MS) + 50);
    };
    schedule();
    return () => {
      clearTimeout(id);
      removals.forEach(clearTimeout);
    };
  }, []);

  // Each layer is keyed by its own id so every slot gets a fresh element —
  // styles set inline CSS on their container (backgrounds, perspective,
  // min-height) that would otherwise leak into the next style.
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {layers.map((l) => (
        <StyleLayer
          key={l.id}
          styleIndex={l.styleIndex}
          text={l.leaving ? l.text : text}
          leaving={l.leaving}
          className={className}
          style={style}
        />
      ))}
    </div>
  );
}
