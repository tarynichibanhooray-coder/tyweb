// Shared grain generator: a small tileable noise pattern rendered once to a
// canvas and reused as a CSS background-image data URI. Real photographed
// paper/canvas has grain; flat CSS color never reads as physical material,
// so every style below that needs to feel like paper or canvas uses this.
let cached = null;

export function grainDataUrl() {
  if (cached) return cached;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = 200 + Math.floor(Math.random() * 55);
    imageData.data[i] = v;
    imageData.data[i + 1] = v;
    imageData.data[i + 2] = v;
    imageData.data[i + 3] = Math.random() * 60;
  }
  ctx.putImageData(imageData, 0, 0);
  cached = canvas.toDataURL();
  return cached;
}
