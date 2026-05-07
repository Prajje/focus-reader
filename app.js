import { fetchPage } from "./fetcher.js";
import { applyBionic, applySpaced } from "./transforms.js";

const form = document.getElementById("urlForm");
const input = document.getElementById("urlInput");
const btn = document.getElementById("convertBtn");
const frameHost = document.querySelector("main");
const status = document.getElementById("status");
const modeButtons = [...document.querySelectorAll(".mode")];

let originalHtml = null;
let mode = "original";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = input.value.trim();
  if (!url) return;
  setStatus("fetching…");
  btn.disabled = true;
  try {
    originalHtml = await fetchPage(url, setStatus);
    setStatus("rendering…");
    await renderMode(mode);
    setStatus("");
  } catch (err) {
    setStatus(err.message || "failed to fetch", true);
    originalHtml = null;
  } finally {
    btn.disabled = false;
  }
});

modeButtons.forEach((b) => {
  b.addEventListener("click", () => {
    if (b.dataset.mode === mode) return;
    mode = b.dataset.mode;
    modeButtons.forEach((m) => {
      const active = m.dataset.mode === mode;
      m.classList.toggle("is-active", active);
      m.setAttribute("aria-checked", String(active));
    });
    if (originalHtml) renderMode(mode);
  });
});

function renderMode(mode) {
  return new Promise((resolve) => {
    if (!originalHtml) return resolve();
    const frame = document.createElement("iframe");
    frame.id = "frame";
    frame.title = "Reformatted page";
    frame.setAttribute("sandbox", "allow-same-origin");
    frame.addEventListener("load", () => {
      const doc = frame.contentDocument;
      if (!doc) return resolve();
      try {
        if (mode === "bionic") applyBionic(doc);
        else if (mode === "spaced") applySpaced(doc);
      } catch (err) {
        console.error("transform failed", err);
      }
      resolve();
    }, { once: true });
    frameHost.replaceChildren(frame);
    frame.srcdoc = originalHtml;
  });
}

function setStatus(text, isError = false) {
  status.textContent = text;
  status.classList.toggle("error", isError);
}
