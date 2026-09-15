// lib/grapheme.js
// Count user-perceived characters (grapheme clusters). Uses Intl.Segmenter when available.
export function countGraphemes(s) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(seg.segment(s)).length;
    } catch (e) {
      // fallthrough to fallback
    }
  }
  // Fallback: Array.from handles many astral symbols and combining marks reasonably well.
  return Array.from(s).length;
}
