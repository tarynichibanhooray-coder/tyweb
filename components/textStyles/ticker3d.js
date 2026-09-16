// Direct reference: brik.space "3d ticker" — a flat text ribbon extruded
// along a spiral path in real 3D (lit geometry, not a 2D approximation).
// Genuinely different from every other style here: this is the only one
// using a real 3D engine (three.js) rather than SVG/canvas/CSS transforms.
import * as THREE from 'three';

const PALETTE = ['#f2c744', '#ff4d8d', '#3fa7ff', '#39ff14'];

// A spiral in 3D space, parametrized 0..1 — the ribbon is extruded along
// this curve.
class SpiralCurve extends THREE.Curve {
  constructor(turns, startRadius, endRadius, height) {
    super();
    this.turns = turns;
    this.startRadius = startRadius;
    this.endRadius = endRadius;
    this.height = height;
  }
  getPoint(t, target = new THREE.Vector3()) {
    const angle = t * Math.PI * 2 * this.turns;
    const radius = this.startRadius + (this.endRadius - this.startRadius) * t;
    const y = this.height * t - this.height / 2;
    return target.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  }
}

function buildTextTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const segmentWidth = 340;
  const repeats = Math.ceil(canvas.width / segmentWidth) + 1;
  ctx.font = '700 64px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  for (let i = 0; i < repeats; i++) {
    const x = i * segmentWidth;
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.fillRect(x, 0, segmentWidth, canvas.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillText(text.toUpperCase(), x + 14, canvas.height / 2, segmentWidth - 20);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function mount(el, text) {
  el.textContent = '';
  el.style.display = 'block';
  el.style.width = '100%';
  el.style.height = '100%';

  const width = Math.max(240, el.getBoundingClientRect().width || 400);
  const height = Math.max(240, el.getBoundingClientRect().height || 400);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0.5, 9);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  el.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 6, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x66ccff, 1.4, 20);
  rim.position.set(-5, -3, 4);
  scene.add(rim);

  const curve = new SpiralCurve(2.4, 1.1, 2.4, 5);
  const shape = new THREE.Shape();
  shape.moveTo(-0.9, -0.12);
  shape.lineTo(0.9, -0.12);
  shape.lineTo(0.9, 0.12);
  shape.lineTo(-0.9, 0.12);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    steps: 220,
    extrudePath: curve,
    bevelEnabled: false,
  });
  const texture = buildTextTexture(text || '...');
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(3, 1);

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.35,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });
  const ribbon = new THREE.Mesh(geometry, material);
  scene.add(ribbon);

  function resize() {
    const w = Math.max(240, el.getBoundingClientRect().width || 400);
    const h = Math.max(240, el.getBoundingClientRect().height || 400);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  let raf = requestAnimationFrame(tick);
  function tick() {
    ribbon.rotation.y += 0.006;
    ribbon.rotation.x = Math.sin(Date.now() * 0.0004) * 0.15;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    geometry.dispose();
    material.dispose();
    texture.dispose();
    renderer.dispose();
    el.textContent = '';
  };
}
