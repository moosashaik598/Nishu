/**
 * =========================
 * Customization
 * =========================
 * Change START_DATE to adjust the "since" date.
 * Change COUNTDOWN_SECONDS to adjust countdown length & star count (kept at 28 by requirement).
 * Change FINAL_TEXT to adjust the final name (keep letters uppercase for best look).
 */
const START_DATE = new Date(1997, 1, 6, 0, 0, 0); // Feb 06 1997 00:00:00 (local time)
const COUNTDOWN_SECONDS = 28;
const FINAL_TEXT = "TAMMANNA"; // requested formation text
// =========================

const elHours = document.getElementById("hours");
const elSeconds = document.getElementById("seconds");
const elCountdown = document.getElementById("countdown");
const starfield = document.getElementById("starfield");

const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

let stars = []; // { el, x, y }
let countdownStartNowMs = 0;
let nextStarIndexToAdd = 0;
let morphStarted = false;

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function updateSinceTimer(){
  // Accurate & drift-free based on Date.now() difference
  const diffMs = Date.now() - START_DATE.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const totalHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  elSeconds.textContent = totalSeconds.toString();
  elHours.textContent = totalHours.toString();
}

function stageRect(){
  // Use the starfield rect as our coordinate system
  return starfield.getBoundingClientRect();
}

function createStarAt(x, y){
  const star = document.createElement("div");
  star.className = "star is-born";
  // Store in CSS vars for initial animation position
  star.style.setProperty("--x", `${x}px`);
  star.style.setProperty("--y", `${y}px`);
  // Also set the actual transform so reduced motion still places correctly
  star.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${prefersReducedMotion ? 1 : 0.2})`;
  star.style.opacity = prefersReducedMotion ? "1" : "0";

  // Slight per-star twinkle offset
  star.style.animationDelay = prefersReducedMotion ? "0ms" : `${Math.round(Math.random() * 400)}ms, ${Math.round(Math.random() * 1200)}ms`;

  starfield.appendChild(star);

  const obj = { el: star, x, y };
  stars.push(obj);

  // Cleanup: ensure we never exceed the requested count
  if (stars.length > COUNTDOWN_SECONDS){
    const extra = stars.splice(COUNTDOWN_SECONDS);
    extra.forEach(s => s.el.remove());
  }
}

function addOneStar(){
  if (nextStarIndexToAdd >= COUNTDOWN_SECONDS) return;
  const rect = stageRect();

  // Place stars in a calm, premium spread around center area (not edges)
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  const angle = Math.random() * Math.PI * 2;
  const radiusX = (Math.min(rect.width, 900) * 0.28) * (0.35 + Math.random() * 0.65);
  const radiusY = (Math.min(rect.height, 700) * 0.22) * (0.35 + Math.random() * 0.65);

  const x = clamp(cx + Math.cos(angle) * radiusX + (Math.random() - 0.5) * 30, 10, rect.width - 26);
  const y = clamp(cy + Math.sin(angle) * radiusY + (Math.random() - 0.5) * 30, 10, rect.height - 26);

  createStarAt(x, y);
  nextStarIndexToAdd++;
}

function setCountdownValue(secondsLeft){
  elCountdown.textContent = String(secondsLeft);
}

function startCountdown(){
  countdownStartNowMs = Date.now();
  setCountdownValue(COUNTDOWN_SECONDS);

  // We add 1 star each second, total 28.
  // We do NOT add on t=0; first add happens after 1 second elapsed (secondsLeft becomes 27).
  const tick = () => {
    const elapsedSec = Math.floor((Date.now() - countdownStartNowMs) / 1000);
    const secondsLeft = clamp(COUNTDOWN_SECONDS - elapsedSec, 0, COUNTDOWN_SECONDS);

    setCountdownValue(secondsLeft);

    // Ensure exactly one star is added per elapsed second, up to 28 total.
    // When elapsedSec = 1 -> add 1 star; ... elapsedSec = 28 -> add 28th star.
    while (nextStarIndexToAdd < Math.min(elapsedSec, COUNTDOWN_SECONDS)) {
      addOneStar();
    }

    if (secondsLeft === 0 && !morphStarted){
      morphStarted = true;

      // Ensure we've created all stars by the time we morph
      while (nextStarIndexToAdd < COUNTDOWN_SECONDS) addOneStar();

      // Begin morph on next frame for smoothness
      requestAnimationFrame(() => morphStarsToText());
      return;
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

/**
 * Option A (preferred): SVG path sampling
 * We create an SVG <text>, get its outline via <textPath> equivalent is not available,
 * so we convert text to a path by using <text> + <path> is not feasible without fonts.
 *
 * Practical approach (still Option A-ish, using SVGGeometry):
 * We render the text as an SVG <text>, then measure it and build a rounded-rectangle-ish
 * "stroke path" for each glyph isn't possible. So instead:
 * We use Canvas pixel sampling (Option B) for reliability across browsers/fonts.
 *
 * NOTE: Requirement allows Option B. We implement Option B for clean 28 points.
 */
function sampleTextPointsCanvas(pointCount){
  const rect = stageRect();
  const w = Math.max(320, Math.floor(rect.width));
  const h = Math.max(240, Math.floor(rect.height));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // Oversample for crisp point selection
  const scale = 2;
  canvas.width = w * scale;
  canvas.height = h * scale;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw text in the center
  const fontSize = Math.floor(Math.min(w * 0.16, 130)) * scale; // responsive
  ctx.font = `800 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Slight glow fill to thicken the sample region
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.shadowColor = "rgba(255,255,255,0.55)";
  ctx.shadowBlur = 18 * scale;

  const x = (canvas.width / 2);
  const y = (canvas.height / 2) + (fontSize * 0.02);
  ctx.fillText(FINAL_TEXT, x, y);

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;

  // Collect candidate pixels from the text region.
  const candidates = [];
  // Scan with step to reduce size but keep distribution
  const step = Math.max(2, Math.floor(fontSize / 40));
  for (let yy = 0; yy < canvas.height; yy += step){
    for (let xx = 0; xx < canvas.width; xx += step){
      const idx = (yy * canvas.width + xx) * 4;
      const a = data[idx + 3];
      if (a > 30){
        candidates.push({ x: xx, y: yy });
      }
    }
  }

  // If something went wrong, fallback to a simple line
  if (candidates.length < pointCount){
    const pts = [];
    for (let i = 0; i < pointCount; i++){
      const t = pointCount === 1 ? 0.5 : i / (pointCount - 1);
      pts.push({ x: w * (0.2 + 0.6 * t), y: h * 0.5 });
    }
    return pts;
  }

  // Choose well-distributed points: spread across X buckets, with mild Y variation
  const buckets = pointCount;
  const minX = Math.min(...candidates.map(p => p.x));
  const maxX = Math.max(...candidates.map(p => p.x));
  const spanX = Math.max(1, maxX - minX);

  const bucketLists = Array.from({ length: buckets }, () => []);
  for (const p of candidates){
    const nx = (p.x - minX) / spanX;
    const bi = clamp(Math.floor(nx * buckets), 0, buckets - 1);
    bucketLists[bi].push(p);
  }

  const chosen = [];
  for (let i = 0; i < buckets; i++){  
    const list = bucketLists[i].length ? bucketLists[i] : candidates;
    const pick = list[Math.floor(Math.random() * list.length)];
    chosen.push(pick);
  }

  const pts = chosen.map(p => ({
    x: p.x / scale,
    y: p.y / scale
  }));

  const cx = w / 2;
  const cy = h / 2;
  const compact = 0.88;
  return pts.map(p => ({
    x: cx + (p.x - cx) * compact,
    y: cy + (p.y - cy) * compact
  }));
}

function morphStarsToText(){
  const rect = stageRect();
  const targets = sampleTextPointsCanvas(COUNTDOWN_SECONDS);

  // Safety: ensure exact 28
  targets.length = COUNTDOWN_SECONDS;

  targets.sort((a,b) => a.x - b.x);
  for (let i = 0; i < targets.length - 1; i += 3){
    const j = i + Math.floor(Math.random() * Math.min(3, targets.length - i));
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }

  stars = stars.slice(0, COUNTDOWN_SECONDS);

  stars.forEach((s, i) => {
    const t = targets[i] ?? { x: rect.width/2, y: rect.height/2 };

    if (prefersReducedMotion){
      s.el.classList.remove("is-born");
      s.el.classList.add("is-morphing");
      s.el.style.opacity = "1";
      s.el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(1)`;
      return;
    }

    s.el.classList.remove("is-born");
    s.el.classList.add("is-morphing");

    const delay = 40 + i * 28; // stagger
    s.el.style.transitionDelay = `${delay}ms`;

    s.el.style.opacity = "1";
    s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) scale(1.03)`;

    window.setTimeout(() => {
      s.el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(1.0)`;
    }, Math.max(0, delay - 10));
  });
}

function onResize(){
  if (morphStarted){
    const targets = sampleTextPointsCanvas(COUNTDOWN_SECONDS);
    targets.length = COUNTDOWN_SECONDS;
    stars.slice(0, COUNTDOWN_SECONDS).forEach((s, i) => {
      const t = targets[i];
      if (!t) return;
      s.el.style.transitionDelay = "0ms";
      s.el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(1)`;
    });
  }
}

/* ===== Boot ===== */
function boot(){
  const loop = () => {
    updateSinceTimer();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  startCountdown();

  window.addEventListener("resize", () => {
    requestAnimationFrame(onResize);
  }, { passive: true });
}

boot();