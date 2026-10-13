/* Md Raihan Patwary: small interactions. Every page works without this file. */
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  /* ---------- mobile menu ---------- */
  const menuBtn = $(".menu-btn"), links = $(".nav-links");
  if (menuBtn && links) {
    menuBtn.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- sun / moon switch ---------- */
  const root = document.documentElement;
  const toggle = $(".theme-toggle");
  const saved = store.get("theme");
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  const isDark = () => root.getAttribute("data-theme") === "dark" ||
    (!root.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const paint = () => {
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(isDark()));
      toggle.setAttribute("aria-label", isDark() ? "Dark mode on. Switch to light mode" : "Light mode on. Switch to dark mode");
    }
    $$("img[data-light][data-dark]").forEach(img => { img.src = isDark() ? img.dataset.dark : img.dataset.light; });
  };
  if (toggle) toggle.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next); store.set("theme", next); paint();
  });
  paint();

  /* ---------- figure viewer ---------- */
  const figs = $$("figure.fig img");
  if (figs.length) {
    const lb = document.createElement("div");
    lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
    lb.innerHTML = '<button class="lb-close" aria-label="Close">×</button><img alt=""><p></p>';
    document.body.appendChild(lb);
    let last = null;
    const close = () => { lb.classList.remove("open"); if (last) last.focus(); };
    figs.forEach(img => {
      img.tabIndex = 0; img.setAttribute("role", "button"); img.setAttribute("aria-label", "Enlarge: " + img.alt);
      const open = () => {
        last = img; $("img", lb).src = img.currentSrc || img.src; $("img", lb).alt = img.alt;
        const cap = img.closest("figure").querySelector("figcaption");
        $("p", lb).textContent = cap ? cap.textContent : "";
        lb.classList.add("open"); $(".lb-close", lb).focus();
      };
      img.addEventListener("click", open);
      img.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    $(".lb-close", lb).addEventListener("click", close);
    lb.addEventListener("click", e => { if (e.target === lb) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && lb.classList.contains("open")) close(); });
  }

  /* ---------- Lab Rescue game ---------- */
  const game = $("#lab-game");
  if (!game) return;
  const NS = "http://www.w3.org/2000/svg";
  const svg = $("svg", game);
  const gPts = $("#pts", svg), fit = $("#fitline", svg), robot = $("#robot", svg), flask = $("#flask", svg);
  const bubbles = $("#bubbles", svg), burst = $("#burst", svg), burstText = $("#burst-text", svg), burstSub = $("#burst-sub", svg), pred = $("#pred", svg);
  const say = $(".game-say", game), count = $(".count", game);
  const runBtn = $("#g-run", game), modelBtn = $("#g-model", game), resetBtn = $("#g-reset", game);
  const sliderRow = $(".slider-row", game), slider = $("#g-size", game), predOut = $("#g-pred", game);
  const X = x => 380 + x * 3.4, Y = y => 300 - y * 2.1;            // data units -> picture
  const lines = [
    "Weighed 12 larvae. Three escaped.", "The broiler pecked my notebook.", "Spilled the feed sample. Again.",
    "Is that a cow or a very large larva?", "Forgot to label the jar.", "Measured the same cow twice. Oops.",
    "The NIR says... something?", "Excel crashed. Starting over.", "Supervisor walked in. Look busy!",
    "Mealworm count: 47. Or 74?", "Coffee in the sample tray. Science!", "Pen 7 ate all the feed. Suspicious."
  ];
  let pts = [], fitted = null, doubled = false, said = -1;

  const pick = () => { let k; do { k = Math.floor(Math.random() * lines.length); } while (k === said); said = k; return lines[k]; };
  const drop = (circle, y1) => {
    const t0 = performance.now(), y0 = 40;
    const step = t => {
      const p = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - p, 3);
      circle.setAttribute("cy", y0 + (y1 - y0) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const leastSquares = () => {
    const n = pts.length, mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    pts.forEach(p => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; });
    const b = sxy / sxx, a = my - b * mx;
    const ssr = pts.reduce((s, p) => s + (p.y - a - b * p.x) ** 2, 0);
    return { a, b, mx, my, r2: 1 - ssr / syy };
  };
  const showBurst = (text, sub = "") => {
    burstText.textContent = text; burstSub.textContent = sub;
    burst.style.display = "inline"; burst.classList.remove("burst"); void burst.getBBox(); burst.classList.add("burst");
  };
  const status = () => {
    count.textContent = pts.length + (pts.length === 1 ? " data point" : " data points");
    modelBtn.disabled = pts.length < 6 || !!fitted;
    runBtn.disabled = !!fitted;
  };

  runBtn.addEventListener("click", () => {
    if (pts.length >= 14) { say.textContent = "That's plenty of data. Time to call the ML model!"; return; }
    const x = 8 + Math.random() * 84;
    const oops = Math.random() < 0.18;
    const y = Math.max(4, Math.min(116, 22 + 0.85 * x + (oops ? (Math.random() < .5 ? -1 : 1) * (30 + Math.random() * 20) : (Math.random() - .5) * 26)));
    pts.push({ x, y });
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", X(x)); c.setAttribute("cy", 40); c.setAttribute("r", 7);
    c.setAttribute("class", oops ? "pt oops" : "pt");
    gPts.appendChild(c); drop(c, Y(y));
    flask.classList.remove("wobble"); void flask.getBBox(); flask.classList.add("wobble");
    for (let k = 0; k < 3; k++) {
      const b = document.createElementNS(NS, "circle");
      b.setAttribute("cx", 196 + k * 9 - 9); b.setAttribute("cy", 196); b.setAttribute("r", 4 + k);
      b.setAttribute("class", "bub"); b.style.animationDelay = (k * 0.12) + "s";
      bubbles.appendChild(b); setTimeout(() => b.remove(), 1300);
    }
    say.textContent = (oops ? "Oops! " : "") + pick() + (pts.length === 5 ? "  (One more and the ML model can help.)" : "");
    status();
  });

  modelBtn.addEventListener("click", () => {
    fitted = leastSquares();
    robot.style.transform = "translate(0px, 0px)";
    const t0 = performance.now(), { a, b, my } = fitted;
    const draw = t => {
      const p = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - p, 3);
      const bb = b * e;
      const a2 = my - bb * fitted.mx;                                 // rotate around the mean point
      fit.setAttribute("x1", X(0)); fit.setAttribute("y1", Y(a2));
      fit.setAttribute("x2", X(100)); fit.setAttribute("y2", Y(a2 + bb * 100));
      fit.style.display = "inline";
      if (p < 1) requestAnimationFrame(draw);
      else {
        showBurst("BAM!", "R² = " + fitted.r2.toFixed(2));
        say.textContent = "The ML model drew one line through all that mess. It explains " + Math.round(fitted.r2 * 100) +
          "% of the spread. Now ask it about an animal nobody has weighed yet.";
        sliderRow.classList.add("on");
      }
    };
    requestAnimationFrame(draw);
    status();
  });

  slider.addEventListener("input", () => {
    if (!fitted) return;
    const x = +slider.value, y = fitted.a + fitted.b * x;
    predOut.textContent = Math.round(y * 3) + " kg";                 // one picture unit = 3 kg, for fun
    pred.style.display = "inline";
    $("circle", pred).setAttribute("cx", X(x)); $("circle", pred).setAttribute("cy", Y(y));
    $("#pred-v", pred).setAttribute("x1", X(x)); $("#pred-v", pred).setAttribute("x2", X(x)); $("#pred-v", pred).setAttribute("y2", Y(y));
    $("#pred-h", pred).setAttribute("y1", Y(y)); $("#pred-h", pred).setAttribute("y2", Y(y)); $("#pred-h", pred).setAttribute("x2", X(x));
    if (!doubled) { doubled = true; showBurst("DOUBLE", "BAM!!"); say.textContent = "A weight before anyone finds the scale. That is why I learned machine learning."; }
  });

  resetBtn.addEventListener("click", () => {
    pts = []; fitted = null; doubled = false;
    gPts.innerHTML = ""; fit.style.display = "none"; burst.style.display = "none"; pred.style.display = "none";
    robot.style.transform = "translate(420px, 0px)"; sliderRow.classList.remove("on");
    say.textContent = "A fresh day in the lab. Press 'Run an experiment'.";
    status();
  });
  status();
})();
