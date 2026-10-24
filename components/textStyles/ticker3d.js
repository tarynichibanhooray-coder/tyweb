// Direct reference: brik.space "3d ticker" — a flat text ribbon extruded
// along a spiral path in real 3D (lit geometry, not a 2D approximation).
// Genuinely different from every other style here: this is the only one
// using a real 3D engine (three.js) rather than SVG/canvas/CSS transforms.
import * as THREE from 'three';

const PALETTE = ['#ff4d8d', '#3fa7ff', '#39ff14'];

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

function buildTextTexture(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const segmentWidth = 340;
  const repeats = Math.ceil(canvas.width / segmentWidth) + 1;
  ctx.font = '700 64px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  // Letters drawn one at a time with extra tracking for legibility (canvas
  // letterSpacing isn't supported everywhere), then squeezed horizontally
  // to fit the segment if needed, as fillText's maxWidth did before.
  const letterSpacing = 8;
  const chars = [...text.toUpperCase()];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const textWidth = widths.reduce((a, b) => a + b, 0) + letterSpacing * (chars.length - 1);
  const fit = Math.min(1, (segmentWidth - 20) / textWidth);

  for (let i = 0; i < repeats; i++) {
    const x = i * segmentWidth;
    ctx.fillStyle = color;
    ctx.fillRect(x, 0, segmentWidth, canvas.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.save();
    ctx.translate(x + 14, canvas.height / 2);
    ctx.scale(fit, 1);
    let cx = 0;
    chars.forEach((ch, j) => {
      ctx.fillText(ch, cx, 0);
      cx += widths[j] + letterSpacing;
    });
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Rectangular-section ribbon swept along the curve. Built by hand instead of
// ExtrudeGeometry because ExtrudeGeometry's side-wall UVs come from world
// coordinates, which clamps the texture to its blank edge rows (no text).
// Here u runs along the path by arc length (scaled to keep the canvas aspect)
// and v runs across the ribbon's width.
function buildRibbonGeometry(curve, steps, halfWidth, halfThickness) {
  const { normals, binormals } = curve.computeFrenetFrames(steps, false);
  const length = curve.getLength();
  const uPerUnit = 128 / 2048 / (halfWidth * 2); // canvas height / width / ribbon width

  const positions = [];
  const uvs = [];
  const indices = [];
  const p = new THREE.Vector3();
  const corner = new THREE.Vector3();

  // Each face: [width offset sign, thickness offset sign] for its two edges,
  // in the same winding order.
  const faces = [
    { a: [-1, 1], b: [1, 1], material: 0 }, // front (+binormal)
    { a: [1, -1], b: [-1, -1], material: 1 }, // back (-binormal)
    { a: [1, 1], b: [1, -1], material: 0 }, // outer edge
    { a: [-1, -1], b: [-1, 1], material: 1 }, // inner edge
  ];
  const groups = [];

  for (const face of faces) {
    const base = positions.length / 3;
    groups.push([indices.length, steps * 6, face.material]);
    for (let i = 0; i <= steps; i++) {
      curve.getPointAt(i / steps, p);
      // Negated (with v flipped below) so the text reads upright, not rotated 180°.
      const u = -((length * i) / steps) * uPerUnit;
      [face.a, face.b].forEach(([w, t], side) => {
        corner
          .copy(p)
          .addScaledVector(normals[i], w * halfWidth)
          .addScaledVector(binormals[i], t * halfThickness);
        positions.push(corner.x, corner.y, corner.z);
        uvs.push(u, 1 - side);
      });
    }
    for (let i = 0; i < steps; i++) {
      const a = base + i * 2;
      indices.push(a, a + 2, a + 3, a, a + 3, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  // Material 0 = front side's colour, 1 = back side's colour.
  groups.forEach(([start, count, material]) => geometry.addGroup(start, count, material));
  geometry.computeVertexNormals();
  return geometry;
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
  const geometry = buildRibbonGeometry(curve, 220, 0.9, 0.12);
  // One solid colour per side of the ribbon: two different palette colours,
  // picked fresh each time the style mounts.
  const frontIdx = Math.floor(Math.random() * PALETTE.length);
  const backIdx = (frontIdx + 1 + Math.floor(Math.random() * (PALETTE.length - 1))) % PALETTE.length;
  const textures = [frontIdx, backIdx].map((idx) => {
    const tex = buildTextTexture(text || '...', PALETTE[idx]);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  });
  const materials = textures.map((map) => new THREE.MeshStandardMaterial({
    map,
    roughness: 0.35,
    metalness: 0.15,
    side: THREE.DoubleSide,
  }));
  const ribbon = new THREE.Mesh(geometry, materials);
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
    ribbon.rotation.y -= 0.006;
    ribbon.rotation.x = Math.sin(Date.now() * 0.0004) * 0.15;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    geometry.dispose();
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    renderer.dispose();
    el.textContent = '';
  };
}
