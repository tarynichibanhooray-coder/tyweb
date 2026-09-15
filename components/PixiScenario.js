'use client';
import { useEffect, useRef } from 'react';

export default function PixiScenario({ text = '' }) {
  const containerRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let resizeHandler = null;

    async function init() {
      if (!mounted || !containerRef.current) return;
      let mod;
      try {
        mod = await import('pixi.js');
      } catch (err) {
        console.error('Failed to import pixi.js', err);
        return;
      }
      const PIXI = (mod && (mod.default ?? mod)) || mod;
      const Application = (PIXI && (PIXI.Application ?? PIXI.default?.Application));
      if (!Application) {
        console.error('PIXI.Application not found on imported module', PIXI);
        return;
      }

      // create app
      let app;
      try {
        app = new Application({
          width: containerRef.current.clientWidth || 800,
          height: 240,
          backgroundAlpha: 0,
          resolution: Math.min(window.devicePixelRatio || 1, 1.5),
          antialias: true,
        });
      } catch (e) {
        console.error('Failed to create PIXI.Application', e);
        return;
      }
      appRef.current = app;

      // robust view selection (app.view may be undefined in some builds)
      const view = app.view || (app.renderer && app.renderer.view) || document.createElement('canvas');
      if (view && !containerRef.current.contains(view)) {
        containerRef.current.appendChild(view);
      }

      const style = new PIXI.TextStyle({
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: 64,
        fill: 0x061226,
      });
      const pixiText = new PIXI.Text(text, style);
      pixiText.anchor.set(0.5);
      pixiText.x = (app.view?.width || containerRef.current.clientWidth || 800) / 2;
      pixiText.y = (app.view?.height || 240) / 2;
      app.stage.addChild(pixiText);

      app.ticker.add(() => {
        pixiText.y = (app.view?.height || 240) / 2 + Math.sin(performance.now() / 500) * 6;
      });

      if (view) {
        view.style.touchAction = 'manipulation';
        view.addEventListener('pointerdown', () => {
          pixiText.scale.set(0.98);
          setTimeout(() => pixiText.scale.set(1), 120);
        });
      }

      resizeHandler = () => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        if (app.renderer && typeof app.renderer.resize === 'function') {
          app.renderer.resize(w, 240);
        }
        pixiText.x = (app.view?.width || w) / 2;
        pixiText.y = (app.view?.height || 240) / 2;
      };
      window.addEventListener('resize', resizeHandler);
    }

    init();

    return () => {
      mounted = false;
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true });
        } catch (e) {
          // ignore
        }
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (appRef.current && appRef.current.stage && appRef.current.stage.children.length) {
      const child = appRef.current.stage.children[0];
      if (child && typeof child.text !== 'undefined') child.text = text;
    }
  }, [text]);

  return (
    <div ref={containerRef} style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
  );
}
