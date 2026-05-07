const PROXY = "https://api.codetabs.com/v1/proxy?quest=";
const TIMEOUT_MS = 15000;

export async function fetchPage(url, onProgress) {
  let html = await tryDirect(url, onProgress);
  if (html === null) html = await tryProxy(url, onProgress);
  if (looksLikeBotWall(html)) {
    throw new Error("this site is behind bot protection (Cloudflare) and can't be reformatted");
  }
  return injectBase(html, url);
}

function looksLikeBotWall(html) {
  const head = html.slice(0, 8000).toLowerCase();
  return (
    head.includes("enable javascript and cookies to continue") ||
    head.includes("cf-browser-verification") ||
    head.includes("cf-challenge") ||
    head.includes("cf-mitigated") ||
    head.includes("just a moment") ||
    head.includes("checking your browser")
  );
}

async function tryDirect(url, onProgress) {
  onProgress?.("trying direct fetch…");
  try {
    const res = await fetchWithTimeout(url, TIMEOUT_MS);
    if (!res.ok) return null;
    const html = await res.text();
    return html.trim() ? html : null;
  } catch {
    return null;
  }
}

async function tryProxy(url, onProgress) {
  onProgress?.("blocked by CORS — routing through proxy…");
  const res = await fetchWithTimeout(PROXY + encodeURIComponent(url), TIMEOUT_MS);
  if (!res.ok) throw new Error(`proxy returned ${res.status}`);
  const html = await res.text();
  if (!html.trim()) throw new Error("empty response from proxy");
  return html;
}

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
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
