/* =========================
   Cinematic Birthday Surprise
   - Only vanilla JS
   - Smooth count-up feel (no flicker)
   - Accurate time using Date.now()
   - Respects prefers-reduced-motion
   ========================= */

(() => {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // --- Dates / accuracy ---
  // Birth start: Feb 06, 1997 00:00:00 (local time as requested; change to UTC if needed)
  const BIRTH_START = new Date(1997, 1, 6, 0, 0, 0, 0).getTime();

  // --- DOM ---
  const app = document.getElementById("app");
  const fadeOverlay = document.getElementById("fadeOverlay");

  const sceneOpening = document.getElementById("sceneOpening");
  const sceneCountdown = document.getElementById("sceneCountdown");
  const sceneReveal = document.getElementById("sceneReveal");
  const sceneVideo = document.getElementById("sceneVideo");

  const hoursValueEl = document.getElementById("hoursValue");
  const secondsValueEl = document.getElementById("secondsValue");

  const countdownValueEl = document.getElementById("countdownValue");

  const letterEl = document.getElementById("letter");
  const ctaWrap = document.getElementById("ctaWrap");
  const surpriseBtn = document.getElementById("surpriseBtn");

  const videoEl = document.getElementById("surpriseVideo");
  const videoHint = document.getElementById("videoHint");

  // --- Helpers ---
  const clamp01 = (n) => Math.max(0, Math.min(1, n));

  function formatInt(n) {
    // Keep it classy; simple grouping
    return Math.floor(n).toLocaleString(undefined);
  }

  function setScene(sceneName) {
    app.dataset.scene = sceneName;

    // Hide all, then show chosen
    sceneOpening.hidden = sceneName !== "opening";
    sceneCountdown.hidden = sceneName !== "countdown";
    sceneReveal.hidden = sceneName !== "reveal";
    sceneVideo.hidden = sceneName !== "video";
  }

  async function fadeToBlack(durationMs = 900) {
    if (prefersReducedMotion) {
      fadeOverlay.classList.add("is-on");
      return;
    }
    fadeOverlay.style.transitionDuration = `${durationMs}ms`;
    fadeOverlay.classList.add("is-on");
    await wait(durationMs);
  }

  async function fadeFromBlack(durationMs = 900) {
    if (prefersReducedMotion) {
      fadeOverlay.classList.remove("is-on");
      return;
    }
    fadeOverlay.style.transitionDuration = `${durationMs}ms`;
    fadeOverlay.classList.remove("is-on");
    await wait(durationMs);
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // Smooth number animation without flicker:
  // We compute the target each tick and ease the displayed value toward it.
  const state = {
    displayHours: 0,
    displaySeconds: 0,
    lastTick: performance.now()
  };

  function updateLifeCounters(nowPerf) {
    const dt = Math.min(0.05, (nowPerf - state.lastTick) / 1000); // cap dt
    state.lastTick = nowPerf;

    const now = Date.now();
    const livedMs = Math.max(0, now - BIRTH_START);
    const targetSeconds = livedMs / 1000;
    const targetHours = livedMs / (1000 * 60 * 60);

    // Easing factor: faster convergence but stable (no jumpy flicker)
    const ease = prefersReducedMotion ? 1 : (1 - Math.pow(0.001, dt)); // frame-rate independent

    state.displaySeconds += (targetSeconds - state.displaySeconds) * ease;
    state.displayHours += (targetHours - state.displayHours) * ease;

    // Update DOM
    secondsValueEl.textContent = formatInt(state.displaySeconds);
    hoursValueEl.textContent = formatInt(state.displayHours);
  }

  // Background transformation driver (countdown)
  function setBackgroundShift(progress01) {
    const p = clamp01(progress01);
    document.documentElement.style.setProperty("--bgShift", String(p));
    document.documentElement.style.setProperty("--glowBoost", String(p));
  }

  // --- Flow ---
  async function start() {
    setScene("opening");
    await fadeFromBlack(700);

    // Let opening breathe briefly while counters animate
    await wait(prefersReducedMotion ? 300 : 1200);

    await runCountdown(28);

    await transitionToReveal();

    await revealLetter();

    enableSurprise();
  }

  async function runCountdown(secondsTotal) {
    setScene("countdown");

    const startTime = performance.now();
    const endTime = startTime + secondsTotal * 1000;

    // Initialize visuals
    countdownValueEl.textContent = String(secondsTotal);
    setBackgroundShift(0);

    while (performance.now() < endTime) {
      const now = performance.now();
      const remainingMs = Math.max(0, endTime - now);
      const remaining = Math.ceil(remainingMs / 1000);

      countdownValueEl.textContent = String(remaining);

      const progress = 1 - (remainingMs / (secondsTotal * 1000));
      setBackgroundShift(progress);

      // cinematic cadence
      await wait(prefersReducedMotion ? 250 : 80);
    }

    countdownValueEl.textContent = "0";
    setBackgroundShift(1);

    // Gentle fade-out
    await fadeToBlack(prefersReducedMotion ? 200 : 900);
    await wait(120);
    await fadeFromBlack(prefersReducedMotion ? 200 : 900);
  }

  async function transitionToReveal() {
    setScene("reveal");
    // A subtle camera-like motion is handled by CSS animations on the title/panel.
    // Add a tiny staged delay for cinematic entrance.
    await wait(prefersReducedMotion ? 0 : 350);
  }

  async function revealLetter() {
    // Lines injected for clean sequential animation (fade-slide).
    const lines = [
      "My Dearest Nishu",
      "On this special day, I want you to know how much you mean to me.",
      "Every moment with you is a treasure, and every day with you is a gift.",
      "You light up my world with your smile,",
      "warm my heart with your laughter,",
      "and make every day brighter just by being you.",
      "Happy Birthday to the most amazing person in my life!",
      "",
      "With all my love,",
      "Forever Yours"
    ];

    letterEl.innerHTML = "";
    const lineEls = lines.map((t, idx) => {
      const p = document.createElement("p");
      p.className = "letterLine" + (idx >= lines.length - 2 ? " signature" : "");
      p.textContent = t;
      letterEl.appendChild(p);
      return p;
    });

    // Reveal line-by-line
    const baseDelay = prefersReducedMotion ? 40 : 520;
    for (let i = 0; i < lineEls.length; i++) {
      // Keep empty lines as spacing without animation pause
      if (lines[i] === "") {
        lineEls[i].classList.add("is-visible");
        await wait(prefersReducedMotion ? 10 : 120);
        continue;
      }

      lineEls[i].classList.add("is-visible");
      await wait(baseDelay);
    }

    // Small pause before CTA
    await wait(prefersReducedMotion ? 80 : 500);
    ctaWrap.hidden = false;
  }

  function enableSurprise() {
    surpriseBtn.addEventListener("click", async () => {
      // Transition to black, then video scene
      await fadeToBlack(prefersReducedMotion ? 200 : 900);
      setScene("video");

      // Attempt autoplay (may require user gesture — we have it)
      // Hide controls initially for a cinematic feel, then show controls after start.
      videoEl.controls = false;

      // Some browsers need the video to be muted to autoplay; we won't force it.
      // If playback fails, show a minimal "Tap to start".
      try {
        await videoEl.play();
        videoEl.classList.add("is-visible");
        await fadeFromBlack(prefersReducedMotion ? 200 : 900);

        // After it begins, allow user control
        await wait(600);
        videoEl.controls = true;
      } catch (e) {
        // Fallback: show hint button
        videoHint.hidden = false;
        await fadeFromBlack(prefersReducedMotion ? 200 : 900);

        videoHint.addEventListener("click", async () => {
          videoHint.hidden = true;
          try {
            await videoEl.play();
            videoEl.classList.add("is-visible");
            await wait(400);
            videoEl.controls = true;
          } catch (_) {
            // If still blocked, show controls so the user can start manually
            videoEl.controls = true;
          }
        }, { once: true });
      }
    }, { once: true });
  }

  // --- RAF loop for counters (only relevant in opening scene; safe globally) ---
  function rafLoop(t) {
    // Always update counters; opening scene uses them, but harmless elsewhere.
    updateLifeCounters(t);

    // If user is in countdown, background shift is managed in runCountdown loop.
    requestAnimationFrame(rafLoop);
  }

  // Start
  requestAnimationFrame(rafLoop);
  start().catch(console.error);
})();
