// small, robust plain-JS splitter (chars or words), Unicode-safe
export function splitText(el, { by = 'char', spanClass = 'st-char' } = {}) {
  if (!el) return null;
  const original = el.textContent;
  const pieces = [];

  // capture current child nodes and clear
  const nodes = Array.from(el.childNodes);
  el.innerHTML = '';

  function makeSpan(text) {
    const s = document.createElement('span');
    s.className = spanClass;
    s.textContent = text;
    s.style.display = 'inline-block';
    s.style.whiteSpace = 'pre'; // preserve spacing
    return s;
  }

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.nodeValue;
      if (by === 'word') {
        const parts = txt.split(/(\s+)/);
        parts.forEach((p) => {
          if (p === '') return;
          if (/^\s+$/.test(p)) {
            el.appendChild(document.createTextNode(p));
          } else {
            const s = makeSpan(p);
            el.appendChild(s);
            pieces.push(s);
          }
        });
      } else {
        Array.from(txt).forEach((ch) => {
          if (ch === '') return;
          if (ch === ' ') {
            el.appendChild(document.createTextNode(' '));
          } else {
            const s = makeSpan(ch);
            el.appendChild(s);
            pieces.push(s);
          }
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      el.appendChild(node);
    }
  });

  return { wrapper: el, pieces, original };
}

export function undoSplit(result) {
  if (!result) return;
  const { wrapper, original } = result;
  wrapper.textContent = original;
}
