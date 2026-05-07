const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA", "INPUT",
  "NOSCRIPT", "SVG", "MATH", "IFRAME", "OBJECT",
]);

const SPACED_STYLE_ID = "focus-reader-spaced-style";
const SPACED_CSS = `
  html, body { background: #fafaf7 !important; }
  body, p, li, blockquote, article, section, main, div {
    line-height: 2 !important;
    letter-spacing: 0.01em !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif !important;
  }
  p, li, blockquote { max-width: 64ch !important; }
  body { font-size: 1.1rem !important; color: #1a1a1a !important; }
  b.bionic { font-weight: 700; }
`;

export function applyBionic(doc) {
  walkText(doc.body, (node) => {
    const frag = bionicFragment(doc, node.nodeValue);
    if (frag) node.parentNode.replaceChild(frag, node);
  });
}

export function applySpaced(doc) {
  if (doc.getElementById(SPACED_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = SPACED_STYLE_ID;
  style.textContent = SPACED_CSS;
  (doc.head || doc.documentElement).appendChild(style);
}

function walkText(root, fn) {
  if (!root) return;
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        let p = node.parentNode;
        while (p && p.nodeType === 1) {
          if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
          if (p.isContentEditable) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );
  const targets = [];
  let n;
  while ((n = walker.nextNode())) targets.push(n);
  targets.forEach(fn);
}

function bionicFragment(doc, text) {
  const frag = doc.createDocumentFragment();
  const parts = text.split(/(\s+)/);
  let touched = false;
  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      frag.appendChild(doc.createTextNode(part));
      continue;
    }
    const wordMatch = part.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}']+)([^\p{L}\p{N}]*)$/u);
    if (!wordMatch) {
      frag.appendChild(doc.createTextNode(part));
      continue;
    }
    const [, lead, word, trail] = wordMatch;
    if (lead) frag.appendChild(doc.createTextNode(lead));
    const cut = prefixLength(word.length);
    const b = doc.createElement("b");
    b.className = "bionic";
    b.textContent = word.slice(0, cut);
    frag.appendChild(b);
    if (cut < word.length) frag.appendChild(doc.createTextNode(word.slice(cut)));
    if (trail) frag.appendChild(doc.createTextNode(trail));
    touched = true;
  }
  return touched ? frag : null;
}

function prefixLength(len) {
  if (len <= 3) return 1;
  if (len <= 6) return 2;
  if (len <= 9) return 3;
  return 4;
}
