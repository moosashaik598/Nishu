[CONTENT OMITTED FOR BREVITY]
(() => {
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // Feb 06, 1997 00:00:00 local time
  const BIRTH_START = new Date(1997, 1, 6, 0, 0, 0, 0).getTime();

  // DOM
  const hoursValueEl = document.getElementById("hoursValue");
  const secondsValueEl = document.getElementById("secondsValue");
  const ritualLabel = document.getElementById("ritualLabel");
  const ritualHint = document.getElementById("ritualHint");
  const countEl = document.getElementById("countdownValue");
  const whisperEl = document.getElementById("whisper"); // not used now (overlay replaces), but kept if needed
  const flashEl = document.getElementById("flash");
  const finalOverlay = document.getElementById("finalOverlay");
  const surpriseBtn = document.getElementById("surpriseBtn");

  // Helpers
  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const formatInt = (n) => Math.floor(n).toLocaleString(undefined);

  // Smooth counters (no flicker)
  const counterState = {
    displayHours: 0,
    displaySeconds: 0,
    lastT: performance.now()
  };

  function updateCounters(nowPerf) {
    const dt = Math.min(0.05, (nowPerf - counterState.lastT) / 1000);
    counterState.lastT = nowPerf;

    const livedMs = Math.max(0, Date.now() - BIRTH_START);
    const targetSeconds = livedMs / 1000;
    const targetHours = livedMs / (1000 * 60 * 60);

    const ease = prefersReducedMotion ? 1 : (1 - Math.pow(0.001, dt));
    counterState.displaySeconds += (targetSeconds - counterState.displaySeconds) * ease;
    counterState.displayHours += (targetHours - counterState.displayHours) * ease;

    secondsValueEl.textContent = formatInt(counterState.displaySeconds);
    hoursValueEl.textContent = formatInt(counterState.displayHours);
  }

  // Background breathing + ritual progress -> CSS vars
  let breathPhase = 0;
  let ritualProgress = 0;

  function updateCosmos(dt) {
    if (!prefersReducedMotion) {
      breathPhase += dt * 0.35;
      const breath = (Math.sin(breathPhase) + 1) / 2;
      document.documentElement.style.setProperty("--breath", String(breath));
    } else {
      document.documentElement.style.setProperty("--breath", "0");
    }

    document.documentElement.style.setProperty("--ritual", String(ritualProgress));
    document.documentElement.style.setProperty("--zoom", String(ritualProgress * 0.8));
  }

  /* ===== Celebrating stars canvas ===== */
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d", { alpha: true });

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let stars = [];
  const rand = (min, max) => min + Math.random() * (max - min);

  function resizeCanvas() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }

  function makeStar() {
    const w = canvas.width, h = canvas.height;
    const palette = [
      [167,139,250], // lav
      [56,189,248],  // sky
      [255,122,182], // pink
      [255,179,138], // peach
      [255,211,138]  // gold
    ];
    const [r, g, b] = palette[(Math.random() * palette.length) | 0];

    return {
      x: rand(0, w),
      y: rand(0, h),
      r: rand(0.8, 2.3) * dpr,
      vy: rand(6, 18) * dpr,
      tw: rand(0.6, 1.2),
      phase: rand(0, Math.PI * 2),
      a: rand(0.12, 0.44),
      rgb: { r, g, b }
    };
  }

  function initStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) stars.push(makeStar());
  }

  function drawStar(s, t, cx, cy) {
    const tw = prefersReducedMotion ? 0 : 0.16 * Math.sin(s.phase + t * s.tw);
    const a = clamp01(s.a + tw);

    const r = s.r;
    ctx.beginPath();
    ctx.fillStyle = `rgba(${s.rgb.r},${s.rgb.g},${s.rgb.b},${a})`;
    ctx.moveTo(s.x, s.y - r);
    ctx.lineTo(s.x + r * 0.55, s.y);
    ctx.lineTo(s.x, s.y + r);
    ctx.lineTo(s.x - r * 0.55, s.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${a * 0.10})`;
    ctx.arc(s.x, s.y, r * 2.6, 0, Math.PI * 2);
    ctx.fill();

    // during ritual: subtle convergence toward center
    if (!prefersReducedMotion && ritualProgress > 0) {
      const pull = ritualProgress * 0.006;
      s.x = lerp(s.x, cx, pull);
      s.y = lerp(s.y, cy, pull);
    }
  }

  function updateStars(dt, t) {
    const w = canvas.width, h = canvas.height;
    const cx = w * 0.5;
    const cy = h * 0.46;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      if (!prefersReducedMotion) {
        s.y -= s.vy * dt;
        s.x += Math.sin(s.phase + t * 0.25) * 0.18 * dpr;
      }

      if (s.y < -30 * dpr) {
        stars[i] = makeStar();
        stars[i].y = h + rand(0, 40 * dpr);
      }

      drawStar(s, t, cx, cy);
    }
  }

  /* ===== Ritual: count UP from 0 -> 28 (starts after 5s) ===== */
  async function startRitual() {
    // Best message sequence (romantic, minimal, powerful)
    const messages = [
      "In 5 seconds, we begin your 28.",
      "Every star is arriving…",
      "Light is aligning…",
      "Time is smiling…",
      "Love is counting with the universe."
    ];

    ritualLabel.textContent = "The universe is counting up…";
    countEl.textContent = "0";
    ritualHint.textContent = messages[0];

    // show subtle hint changes while waiting
    for (let i = 1; i < messages.length; i++) {
      await wait(1000);
      ritualHint.textContent = messages[i];
    }

    // Ensure total wait ~5s
    await wait(1000);

    ritualLabel.textContent = "Each second… a wish.";
    ritualHint.textContent = "0 to 28 — because today, you become 28.";

    const total = 28;
    const start = performance.now();
    const duration = total * 1000;

    while (true) {
      const now = performance.now();
      const elapsed = now - start;
      const p = clamp01(elapsed / duration);
      ritualProgress = p;

      const value = Math.min(total, Math.floor(p * total));
      countEl.textContent = String(value);

      if (value >= total) break;

      await wait(prefersReducedMotion ? 200 : 50);
    }

    // Finish exactly at 28
    countEl.textContent = "28";
    ritualProgress = 1;

    // Soft burst + overlay
    flashEl.classList.add("is-on");
    await wait(prefersReducedMotion ? 200 : 650);
    flashEl.classList.remove("is-on");

    // Show overlay message
    finalOverlay.hidden = false;
  }

  // Surprise button behavior (placeholder)
  surpriseBtn?.addEventListener("click", () => {
    // You can hook this to the video surprise flow if you want.
    // For now, we just softly acknowledge the tap.
    surpriseBtn.textContent = "Opening…";
    surpriseBtn.disabled = true;
    setTimeout(() => {
      // You can redirect, reveal video, etc.
      // Example: window.location.href = "surprise.html";
    }, 600);
  });

  // RAF loop
  let last = performance.now();
  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;

    updateCounters(t);
    updateCosmos(dt);
    updateStars(dt, t / 1000);

    requestAnimationFrame(loop);
  }

  function onResize() {
    resizeCanvas();
    const area = window.innerWidth * window.innerHeight;
    const count = prefersReducedMotion ? 0 : Math.max(70, Math.min(170, Math.round(area / 12000)));
    initStars(count);
  }

  window.addEventListener("resize", onResize, { passive: true });

  // Boot
  onResize();
  requestAnimationFrame(loop);
  startRitual().catch(console.error);
})();
