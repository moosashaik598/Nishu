(() => {
  // Slide 1 timer start date (Feb 06, 1997)
  const START_DATE = new Date(1997, 1, 6, 0, 0, 0);

  const hoursEl = document.getElementById("hours");
  const secondsEl = document.getElementById("seconds");
  const statsEl = document.getElementById("stats");
  const hintEl = document.getElementById("hint");

  const slides = Array.from(document.querySelectorAll(".slide"));
  const downArrow = document.getElementById("downArrow");

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  let index = 0;
  let wheelLock = false;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function setActive(i) {
    index = clamp(i, 0, slides.length - 1);
    slides.forEach((s, n) => s.classList.toggle("is-active", n === index));

    if (index === 0) revealSlide1();

    if (index === 1) startSlide2FX();
    else stopSlide2FX();

    if (index === 2) startSlide3FX();
    else stopSlide3FX();

    const video = document.getElementById("surpriseVideo");
    if (video && index !== 2) { try { video.pause(); } catch {} }
  }

  function next() { setActive(index + 1); }
  function prev() { setActive(index - 1); }

  downArrow?.addEventListener("click", next);

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const act = btn.getAttribute("data-action");
    if (act === "next") next();
    if (act === "prev") prev();
  });

  window.addEventListener("wheel", (e) => {
    if (wheelLock) return;
    wheelLock = true;
    const dir = Math.sign(e.deltaY);
    if (dir > 0) next();
    if (dir < 0) prev();
    setTimeout(() => (wheelLock = false), reduceMotion ? 80 : 520);
  }, { passive: true });

  // Touch swipe
  let touchY = null;
  window.addEventListener("touchstart", (e) => {
    touchY = e.touches?.[0]?.clientY ?? null;
  }, { passive: true });

  window.addEventListener("touchend", (e) => {
    if (touchY == null) return;
    const endY = e.changedTouches?.[0]?.clientY ?? touchY;
    const dy = touchY - endY;
    touchY = null;
    if (Math.abs(dy) < 40) return;
    if (dy > 0) next();
    else prev();
  }, { passive: true });

  // Keyboard
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") next();
    if (e.key === "ArrowUp" || e.key === "PageUp") prev();
  });

  function revealSlide1() {
    if (!statsEl || !hintEl) return;
    statsEl.classList.remove("is-visible");
    hintEl.classList.remove("is-visible");

    if (reduceMotion) {
      statsEl.classList.add("is-visible");
      hintEl.classList.add("is-visible");
      return;
    }

    setTimeout(() => { if (index === 0) statsEl.classList.add("is-visible"); }, 900);
    setTimeout(() => { if (index === 0) hintEl.classList.add("is-visible"); }, 1700);
  }

  function tick() {
    const diffMs = Math.max(0, Date.now() - START_DATE.getTime());
    if (hoursEl) hoursEl.textContent = String(Math.floor(diffMs / 3600000));
    if (secondsEl) secondsEl.textContent = String(Math.floor(diffMs / 1000));
  }

  // ===== Slide 2 FX =====
  const heartsRoot = document.getElementById("hearts");
  const sparklesRoot = document.getElementById("sparkles");
  const balloonsRoot = document.getElementById("balloons");
  let slide2Running = false;

  const heartColors = [
    "rgba(255,105,180,.92)",
    "rgba(255,160,220,.92)",
    "rgba(210,180,255,.92)",
    "rgba(255,210,170,.92)",
    "rgba(140,200,255,.92)"
  ];

  const balloonGradients = [
    "linear-gradient(180deg, rgba(255,160,220,.92), rgba(255,160,220,.26))",
    "linear-gradient(180deg, rgba(210,180,255,.92), rgba(210,180,255,.22))",
    "linear-gradient(180deg, rgba(140,200,255,.92), rgba(140,200,255,.22))",
    "linear-gradient(180deg, rgba(255,225,170,.92), rgba(255,225,170,.22))"
  ];

  function startSlide2FX() {
    if (slide2Running) return;
    slide2Running = true;

    if (!heartsRoot || !sparklesRoot || !balloonsRoot) return;
    heartsRoot.innerHTML = "";
    sparklesRoot.innerHTML = "";
    balloonsRoot.innerHTML = "";

    if (reduceMotion) return;

    for (let i = 0; i < 60; i++) {
      const h = document.createElement("i");
      h.className = "heart";
      h.style.setProperty("--x", `${rand(2, 98).toFixed(2)}%`);
      h.style.setProperty("--sz", `${rand(10, 26).toFixed(0)}px`);
      h.style.setProperty("--c", pick(heartColors));
      h.style.setProperty("--dur", `${rand(5.8, 10.8).toFixed(1)}s`);
      h.style.setProperty("--d", `${rand(0, 3.8).toFixed(2)}s`);
      h.style.setProperty("--dx", `${rand(-40, 40).toFixed(0)}px`);
      heartsRoot.appendChild(h);
    }

    for (let i = 0; i < 95; i++) {
      const s = document.createElement("i");
      s.className = "spark";
      s.style.setProperty("--x", `${rand(0, 100).toFixed(2)}%`);
      s.style.setProperty("--y", `${rand(0, 100).toFixed(2)}%`);
      s.style.setProperty("--sz", `${rand(1.4, 3.4).toFixed(1)}px`);
      s.style.setProperty("--o", `${rand(0.25, 0.8).toFixed(2)}`);
      s.style.setProperty("--tw", `${rand(2.8, 6.8).toFixed(1)}s`);
      s.style.setProperty("--d", `${rand(0, 3.2).toFixed(2)}s`);
      sparklesRoot.appendChild(s);
    }

    for (let i = 0; i < 14; i++) {
      const b = document.createElement("i");
      b.className = "balloon";
      b.style.setProperty("--x", `${rand(6, 94).toFixed(2)}%`);
      b.style.setProperty("--w", `${rand(52, 108).toFixed(0)}px`);
      b.style.setProperty("--rot", `${rand(-12, 12).toFixed(1)}deg`);
      b.style.setProperty("--dur", `${rand(8.2, 15.2).toFixed(1)}s`);
      b.style.setProperty("--d", `${rand(0, 4.0).toFixed(2)}s`);
      b.style.setProperty("--sx", `${rand(-40, 40).toFixed(0)}px`);
      b.style.setProperty("--grad", pick(balloonGradients));
      balloonsRoot.appendChild(b);
    }
  }

  function stopSlide2FX() {
    slide2Running = false;
    if (heartsRoot) heartsRoot.innerHTML = "";
    if (sparklesRoot) sparklesRoot.innerHTML = "";
    if (balloonsRoot) balloonsRoot.innerHTML = "";
  }

  // ===== Slide 3 FX =====
  const ribbons3Root = document.getElementById("ribbons3");
  const fireworks3Root = document.getElementById("fireworks3");
  const balloons3Root = document.getElementById("balloons3");
  let slide3Running = false;

  const fwColors = ["#2f7cff", "#9b59ff", "#ff4fd8", "#ff8a00", "#00b894", "#ffd36a"];

  function startSlide3FX() {
    if (slide3Running) return;
    slide3Running = true;

    if (!ribbons3Root || !fireworks3Root || !balloons3Root) return;
    ribbons3Root.innerHTML = "";
    fireworks3Root.innerHTML = "";
    balloons3Root.innerHTML = "";

    if (reduceMotion) return;

    // Ribbons
    for (let i = 0; i < 10; i++) {
      const r = document.createElement("i");
      r.className = "ribbon";
      r.style.setProperty("--x", `${rand(5, 95).toFixed(2)}%`);
      r.style.setProperty("--w", `${rand(10, 22).toFixed(0)}px`);
      r.style.setProperty("--rot", `${rand(-14, 14).toFixed(1)}deg`);
      r.style.setProperty("--dur", `${rand(5.5, 9.5).toFixed(1)}s`);
      r.style.setProperty("--d", `${rand(0, 2.5).toFixed(2)}s`);
      r.style.setProperty("--c", pick(fwColors));
      ribbons3Root.appendChild(r);
    }

    // Fireworks
    for (let i = 0; i < 12; i++) {
      const fw = document.createElement("i");
      fw.className = "fw";
      fw.style.setProperty("--x", `${rand(8, 92).toFixed(2)}%`);
      fw.style.setProperty("--y", `${rand(12, 58).toFixed(2)}%`);
      fw.style.setProperty("--dur", `${rand(3.2, 5.2).toFixed(1)}s`);
      fw.style.setProperty("--d", `${rand(0, 3.8).toFixed(2)}s`);
      fw.style.setProperty("--c", pick(fwColors));
      fireworks3Root.appendChild(fw);
    }

    // Soft balloons in the back
    for (let i = 0; i < 8; i++) {
      const b = document.createElement("i");
      b.className = "balloon";
      b.style.setProperty("--x", `${rand(8, 92).toFixed(2)}%`);
      b.style.setProperty("--w", `${rand(44, 86).toFixed(0)}px`);
      b.style.setProperty("--rot", `${rand(-10, 10).toFixed(1)}deg`);
      b.style.setProperty("--dur", `${rand(10.5, 18.0).toFixed(1)}s`);
      b.style.setProperty("--d", `${rand(0, 4.0).toFixed(2)}s`);
      b.style.setProperty("--sx", `${rand(-26, 26).toFixed(0)}px`);
      b.style.setProperty("--grad", pick(balloonGradients));
      balloons3Root.appendChild(b);
    }
  }

  function stopSlide3FX() {
    slide3Running = false;
    if (ribbons3Root) ribbons3Root.innerHTML = "";
    if (fireworks3Root) fireworks3Root.innerHTML = "";
    if (balloons3Root) balloons3Root.innerHTML = "";
  }

  // Init
  setActive(0);
  tick();
  setInterval(tick, 1000);
})();