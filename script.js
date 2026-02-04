/**
 * =========================
 * Customization
 * =========================
 * START_DATE: since date (local time)
 * COUNTDOWN_SECONDS: countdown length + total stars
 * FINAL_TEXT: final name
 */
const START_DATE = new Date(1997, 1, 6, 0, 0, 0);
const COUNTDOWN_SECONDS = 28;
const FINAL_TEXT = "Tamanna";
// =========================

const elHours = document.getElementById("hours");
const elSeconds = document.getElementById("seconds");
const elCountdown = document.getElementById("countdown");
const starfield = document.getElementById("starfield");

const surpriseBtn = document.getElementById("surpriseBtn");
const overlay = document.getElementById("overlay");
const modal = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");

const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

let stars = [];
let countdownStartMs = 0;
let nextStarToAdd = 0;
let morphed = false;

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function stageRect(){ return starfield.getBoundingClientRect(); }

function updateSinceTimer(){
  const diffMs = Date.now() - START_DATE.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const totalHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  elSeconds.textContent = String(totalSeconds);
  elHours.textContent = String(totalHours);
}

function createStarAt(x, y){
  const el = document.createElement("div");
  el.className = "star is-born";
  el.style.setProperty("--x", `${x}px`);
  el.style.setProperty("--y", `${y}px`);
  el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${prefersReducedMotion ? 1 : 0.16})`;
  el.style.opacity = prefersReducedMotion ? "1" : "0";
  starfield.appendChild(el);

  stars.push({ el, x, y });
  if (stars.length > COUNTDOWN_SECONDS){
    stars.splice(COUNTDOWN_SECONDS).forEach(s => s.el.remove());
  }
}

function addOneStar(){
  if (nextStarToAdd >= COUNTDOWN_SECONDS) return;

  const r = stageRect();
  const cx = r.width / 2;
  const cy = r.height / 2;

  const angle = Math.random() * Math.PI * 2;
  const radiusX = (Math.min(r.width, 980) * 0.30) * (0.35 + Math.random() * 0.65);
  const radiusY = (Math.min(r.height, 760) * 0.24) * (0.35 + Math.random() * 0.65);

  const x = clamp(cx + Math.cos(angle) * radiusX + (Math.random() - 0.5) * 26, 10, r.width - 38);
  const y = clamp(cy + Math.sin(angle) * radiusY + (Math.random() - 0.5) * 26, 10, r.height - 38);

  createStarAt(x, y);
  nextStarToAdd++;
}

function setCountdown(v){
  elCountdown.textContent = String(v);
}

function startCountdown(){
  countdownStartMs = Date.now();
  setCountdown(COUNTDOWN_SECONDS);

  const tick = () => {
    const elapsed = Math.floor((Date.now() - countdownStartMs) / 1000);
    const left = clamp(COUNTDOWN_SECONDS - elapsed, 0, COUNTDOWN_SECONDS);
    setCountdown(left);

    while (nextStarToAdd < Math.min(elapsed, COUNTDOWN_SECONDS)) addOneStar();

    if (left === 0 && !morphed){
      morphed = true;
      while (nextStarToAdd < COUNTDOWN_SECONDS) addOneStar();
      requestAnimationFrame(morphStarsToText);
      return;
    }
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

/* Canvas sampling for 28 target points */
function sampleTextPointsCanvas(pointCount){
  const rect = stageRect();
  const w = Math.max(320, Math.floor(rect.width));
  const h = Math.max(240, Math.floor(rect.height));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const scale = 2;
  canvas.width = w * scale;
  canvas.height = h * scale;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const fontSize = Math.floor(Math.min(w * 0.18, 160)) * scale;
  ctx.font = `900 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.shadowColor = "rgba(255,255,255,0.55)";
  ctx.shadowBlur = 20 * scale;

  const x = canvas.width / 2;
  const y = canvas.height * 0.44;
  ctx.fillText(FINAL_TEXT, x, y);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;

  const candidates = [];
  const step = Math.max(2, Math.floor(fontSize / 44));
  const bandTop = Math.floor(canvas.height * 0.20);
  const bandBottom = Math.floor(canvas.height * 0.70);

  for (let yy = bandTop; yy < bandBottom; yy += step){
    for (let xx = 0; xx < canvas.width; xx += step){
      const idx = (yy * canvas.width + xx) * 4;
      if (data[idx + 3] > 30) candidates.push({ x: xx, y: yy });
    }
  }

  if (candidates.length < pointCount){
    return Array.from({ length: pointCount }, (_, i) => {
      const t = pointCount === 1 ? 0.5 : i / (pointCount - 1);
      return { x: w * (0.2 + 0.6 * t), y: h * 0.44 };
    });
  }

  const minX = Math.min(...candidates.map(p => p.x));
  const maxX = Math.max(...candidates.map(p => p.x));
  const spanX = Math.max(1, maxX - minX);

  const buckets = Array.from({ length: pointCount }, () => []);
  for (const p of candidates){
    const nx = (p.x - minX) / spanX;
    const bi = clamp(Math.floor(nx * pointCount), 0, pointCount - 1);
    buckets[bi].push(p);
  }

  const chosen = buckets.map(list => {
    const src = list.length ? list : candidates;
    return src[Math.floor(Math.random() * src.length)];
  });

  const pts = chosen.map(p => ({ x: p.x / scale, y: p.y / scale }));

  const cx = w / 2;
  const cy = h * 0.44;
  const compact = 0.92;
  return pts.map(p => ({
    x: cx + (p.x - cx) * compact,
    y: cy + (p.y - cy) * compact
  }));
}

function morphStarsToText(){
  const rect = stageRect();
  const targets = sampleTextPointsCanvas(COUNTDOWN_SECONDS).slice(0, COUNTDOWN_SECONDS);
  targets.sort((a,b) => a.x - b.x);

  stars.slice(0, COUNTDOWN_SECONDS).forEach((s, i) => {
    const t = targets[i] ?? { x: rect.width/2, y: rect.height*0.44 };

    s.el.classList.remove("is-born");
    s.el.classList.add("is-morphing");
    s.el.style.opacity = "1";

    if (prefersReducedMotion){
      s.el.style.transitionDelay = "0ms";
      s.el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(1)`;
      return;
    }

    const delay = 60 + i * 30;
    s.el.style.transitionDelay = `${delay}ms`;
    s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) scale(1.06)`;

    setTimeout(() => {
      s.el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(1.0)`;
    }, Math.max(0, delay - 10));
  });

  // Show the button after morph completes
  const revealAfterMs = prefersReducedMotion ? 0 : (60 + (COUNTDOWN_SECONDS - 1) * 30 + 1200);
  setTimeout(() => { surpriseBtn.hidden = false; }, revealAfterMs);
}

/* Modal open/close (your overlay/modal are in index.html) */
function openModal(){
  overlay.hidden = false;
  modal.hidden = false;
  closeModalBtn?.focus?.();
}
function closeModal(){
  modal.hidden = true;
  overlay.hidden = true;
  surpriseBtn?.focus?.();
}

surpriseBtn?.addEventListener("click", openModal);
closeModalBtn?.addEventListener("click", closeModal);
overlay?.addEventListener("click", closeModal);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeModal();
});

function boot(){
  const loop = () => { updateSinceTimer(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  startCountdown();
}
boot();
