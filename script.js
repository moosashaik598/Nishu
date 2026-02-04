(() => {
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // Feb 06, 1997 00:00:00 (local time)
  const BIRTH_START = new Date(1997, 1, 6, 0, 0, 0, 0).getTime();

  const hoursValueEl = document.getElementById("hoursValue");
  const secondsValueEl = document.getElementById("secondsValue");

  const ritualLabel = document.getElementById("ritualLabel");
  const ritualHint = document.getElementById("ritualHint");
  const countdownValueEl = document.getElementById("countdownValue");
  const whisperEl = document.getElementById("whisper");
  const fadeOverlay = document.getElementById("fadeOverlay");

  // Helpers
  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  function formatInt(n){ return Math.floor(n).toLocaleString(undefined); }
  function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

  async function fadeGlowOn(ms = 900){
    if (prefersReducedMotion){ fadeOverlay.classList.add("is-on"); return; }
    fadeOverlay.style.transitionDuration = `${ms}ms`;
    fadeOverlay.classList.add("is-on");
    await wait(ms);
  }
  async function fadeGlowOff(ms = 900){
    if (prefersReducedMotion){ fadeOverlay.classList.remove("is-on"); return; }
    fadeOverlay.style.transitionDuration = `${ms}ms`;
    fadeOverlay.classList.remove("is-on");
    await wait(ms);
  }

  // Smooth counters (always visible)
  const counterState = {
    displayHours: 0,
    displaySeconds: 0,
    lastT: performance.now()
  };

  function updateCounters(nowPerf){
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

  // Universe breathing (subtle)
  let breathPhase = 0;
  function updateBreath(dt){
    if (prefersReducedMotion){
      document.documentElement.style.setProperty("--bgBreath", "0");
      return;
    }
    breathPhase += dt * 0.35;
    const b = (Math.sin(breathPhase) + 1) / 2;
    document.documentElement.style.setProperty("--bgBreath", String(b));
  }

  /* Celebrating stars canvas */
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d", { alpha: true });

  let stars = [];
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  function resizeCanvas(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }
  const rand = (min, max) => min + Math.random() * (max - min);

  function makeStar(){
    const w = canvas.width, h = canvas.height;
    const palette = [
      "rgba(167,139,250,0.70)",
      "rgba(56,189,248,0.65)",
      "rgba(255,122,182,0.60)",
      "rgba(255,179,138,0.55)",
      "rgba(255,211,138,0.55)"
    ];
    return {
      x: rand(0, w),
      y: rand(0, h),
      r: rand(0.9, 2.4) * dpr,
      vy: rand(6, 18) * dpr,
      tw: rand(0.6, 1.2),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.15, 0.45),
      hue: palette[(Math.random() * palette.length) | 0]
    };
  }

  function initStars(count){
    stars = [];
    for (let i = 0; i < count; i++) stars.push(makeStar());
  }

  function drawStar(s, t){
    const tw = prefersReducedMotion ? 0 : (0.15 * Math.sin(s.phase + t * s.tw));
    const a = clamp01(s.alpha + tw);

    // tiny sparkle diamond
    ctx.beginPath();
    ctx.fillStyle = s.hue.replace(/0\.\d+\)/, `${a})`);
    const r = s.r;
    ctx.moveTo(s.x, s.y - r);
    ctx.lineTo(s.x + r * 0.55, s.y);
    ctx.lineTo(s.x, s.y + r);
    ctx.lineTo(s.x - r * 0.55, s.y);
    ctx.closePath();
    ctx.fill();

    // soft halo
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${a * 0.12})`;
    ctx.arc(s.x, s.y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function updateStars(dt, t){
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < stars.length; i++){
      const s = stars[i];

      if (!prefersReducedMotion){
        s.y -= s.vy * dt;
        s.x += Math.sin((s.phase + t * 0.25)) * 0.15 * dpr;
      }

      if (s.y < -30 * dpr){
        stars[i] = makeStar();
        stars[i].y = h + rand(0, 40 * dpr);
      }

      drawStar(s, t);
    }
  }

  /* Countdown ritual: starts after 5s */
  async function startCountdownRitual(){
    ritualHint.textContent = "A gentle 28‑second ritual begins soon.";
    await wait(5000);

    ritualLabel.textContent = "The universe is counting down to your moment…";
    ritualHint.textContent = "Breathe. Watch the light gather.";

    const secondsTotal = 28;
    const start = performance.now();
    const end = start + secondsTotal * 1000;

    while (performance.now() < end){
      const now = performance.now();
      const remainingMs = Math.max(0, end - now);
      const remaining = Math.ceil(remainingMs / 1000);
      countdownValueEl.textContent = String(remaining);

      // romantic “near the end” hush: slightly stronger breath
      if (!prefersReducedMotion && remaining <= 6){
        const pulse = (Math.sin((end - now) / 120) + 1) / 2;
        document.documentElement.style.setProperty("--bgBreath", String(0.3 + pulse * 0.7));
      }

      await wait(prefersReducedMotion ? 250 : 70);
    }

    countdownValueEl.textContent = "0";
    ritualLabel.textContent = "And then…";
    ritualHint.textContent = "Time smiled.";

    await fadeGlowOn(prefersReducedMotion ? 200 : 700);
    whisperEl.hidden = false;
    await wait(prefersReducedMotion ? 200 : 450);
    await fadeGlowOff(prefersReducedMotion ? 200 : 900);
  }

  // Main loop
  let last = performance.now();
  function loop(t){
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;

    updateCounters(t);
    updateBreath(dt);
    updateStars(dt, t / 1000);

    requestAnimationFrame(loop);
  }

  function onResize(){
    resizeCanvas();
    const area = window.innerWidth * window.innerHeight;
    const target = prefersReducedMotion ? 0 : Math.max(60, Math.min(140, Math.round(area / 14000)));
    initStars(target);
  }

  window.addEventListener("resize", onResize, { passive:true });

  // Boot
  resizeCanvas();
  initStars(prefersReducedMotion ? 0 : 95);
  requestAnimationFrame(loop);
  startCountdownRitual().catch(console.error);
})();
