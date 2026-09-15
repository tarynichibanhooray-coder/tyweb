// lib/rateLimiter.js
// Very small in-memory fixed-window rate limiter. NOT global across serverless instances.
// TODO: Replace with a cross-instance store (Upstash/Redis/Cloudflare KV) for production.

const WINDOW_MS = 60_000; // 1 minute window
const MAX_PER_WINDOW = 10; // allow 10 submissions per IP per window

const map = new Map();

function allow(ip) {
  const now = Date.now();
  const entry = map.get(ip);
  if (!entry) {
    map.set(ip, { count: 1, start: now });
    return true;
  }
  if (now - entry.start > WINDOW_MS) {
    map.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

export default { allow };
