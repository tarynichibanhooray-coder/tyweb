'use client';
import { useEffect, useRef } from 'react';

export default function PixiScenario({ text = '' }) {
  const containerRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const PIXI = await import('pixi.js');
      if (!mounted) return;
      const Application = PIXI.Application;
      const app = new Application({
        width: containerRef.current.clientWidth,
        height: 240,
        backgroundAlpha: 0,
        resolution: Math.min(window.devicePixelRatio || 1, 1.5),
        antialias: true,
      });
      appRef.current = app;
      containerRef.current.appendChild(app.view);

      const style = new PIXI.TextStyle({
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: 64,
        fill: 0x061226,
      });
      const pixiText = new PIXI.Text(text, style);
      pixiText.anchor.set(0.5);
      pixiText.x = app.view.width/2; pixiText.y = app.view.height/2;
      app.stage.addChild(pixiText);

      // simple floating animation
      app.ticker.add((dt) => {
        pixiText.y = app.view.height/2 + Math.sin(performance.now()/500) * 6;
      });

      // simple pointer interaction: scale on pointerdown
      app.view.style.touchAction = 'manipulation';
      app.view.addEventListener('pointerdown', () => {
        pixiText.scale.set(0.98);
        setTimeout(() => pixiText.scale.set(1), 120);
      });

      // resize handler
      function onResize() {
        app.renderer.resize(containerRef.current.clientWidth, 240);
        pixiText.x = app.view.width/2;
        pixiText.y = app.view.height/2;
      }
      window.addEventListener('resize', onResize);

    }
    init();
    return () => {
      mounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  // update text content when prop changes
  useEffect(() => {
    if (appRef.current && appRef.current.stage.children.length) {
      const child = appRef.current.stage.children[0];
      if (child && child.text !== undefined) child.text = text;
    }
  }, [text]);

  return (
    <div ref={containerRef} style={{minHeight:260,display:'flex',alignItems:'center',justifyContent:'center'}} />
  );
}
