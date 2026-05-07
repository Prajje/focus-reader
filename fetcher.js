const PROXY = "https://api.allorigins.win/raw?url=";

export async function fetchPage(url) {
  const res = await fetch(PROXY + encodeURIComponent(url));
  if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
  const html = await res.text();
  if (!html.trim()) throw new Error("Empty response");
  return injectBase(html, url);
}

function injectBase(html, url) {
  const baseTag = `<base href="${escapeAttr(url)}">`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => m + baseTag);
  }
  return baseTag + html;
}

function escapeAttr(s) {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
