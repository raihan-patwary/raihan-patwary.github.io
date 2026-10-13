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
  const menuBtn = $(".menu-btn");
  const links = $(".nav-links");
  if (menuBtn && links) {
    menuBtn.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- light / dark ---------- */
  const themeBtn = $(".theme-btn");
  const root = document.documentElement;
  const saved = store.get("theme");
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  const isDark = () => root.getAttribute("data-theme") === "dark" ||
    (!root.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const paintThemeBtn = () => {
    if (!themeBtn) return;
    themeBtn.textContent = isDark() ? "☀" : "☾";
    themeBtn.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
  };
  const swapThemedImages = () => {
    $$("img[data-light][data-dark]").forEach(img => { img.src = isDark() ? img.dataset.dark : img.dataset.light; });
  };
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store.set("theme", next);
      paintThemeBtn(); swapThemedImages();
    });
  }
  paintThemeBtn(); swapThemedImages();

  /* ---------- figure lightbox ---------- */
  const figs = $$("figure.fig img");
  if (figs.length) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Figure viewer");
    lb.innerHTML = '<button class="lb-close" aria-label="Close">×</button>' +
      '<button class="lb-prev" aria-label="Previous figure">‹</button>' +
      '<img alt=""><p></p>' +
      '<button class="lb-next" aria-label="Next figure">›</button>';
    document.body.appendChild(lb);
    let i = 0, lastFocus = null;
    const show = n => {
      i = (n + figs.length) % figs.length;
      const src = figs[i];
      $("img", lb).src = src.currentSrc || src.src;
      $("img", lb).alt = src.alt;
      const cap = src.closest("figure").querySelector("figcaption");
      $("p", lb).textContent = cap ? cap.textContent : src.alt;
    };
    const close = () => { lb.classList.remove("open"); if (lastFocus) lastFocus.focus(); };
    figs.forEach((img, n) => {
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Enlarge: " + img.alt);
      const open = () => { lastFocus = img; show(n); lb.classList.add("open"); $(".lb-close", lb).focus(); };
      img.addEventListener("click", open);
      img.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", () => show(i - 1));
    $(".lb-next", lb).addEventListener("click", () => show(i + 1));
    lb.addEventListener("click", e => { if (e.target === lb) close(); });
    document.addEventListener("keydown", e => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });
  }

  /* ---------- code tabs + copy ---------- */
  $$(".code-tabs").forEach(box => {
    const tabs = $$('[role="tab"]', box);
    const panels = $$('[role="tabpanel"]', box);
    const select = t => {
      tabs.forEach(x => { const on = x === t; x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; });
      panels.forEach(p => { p.hidden = p.id !== t.getAttribute("aria-controls"); });
    };
    tabs.forEach((t, n) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", e => {
        if (e.key === "ArrowRight") { tabs[(n + 1) % tabs.length].focus(); select(tabs[(n + 1) % tabs.length]); }
        if (e.key === "ArrowLeft") { tabs[(n - 1 + tabs.length) % tabs.length].focus(); select(tabs[(n - 1 + tabs.length) % tabs.length]); }
      });
    });
  });
  $$(".copy").forEach(btn => {
    btn.addEventListener("click", async () => {
      const code = btn.parentElement.querySelector("pre").innerText;
      try { await navigator.clipboard.writeText(code); btn.textContent = "Copied"; }
      catch (e) { btn.textContent = "Select and copy"; }
      setTimeout(() => { btn.textContent = "Copy"; }, 1600);
    });
  });

  /* ---------- project filter ---------- */
  const chips = $$(".chip[data-filter]");
  if (chips.length) {
    const cards = $$("[data-tags]");
    const count = $(".filter-count");
    const apply = f => {
      let n = 0;
      cards.forEach(c => { const on = f === "all" || c.dataset.tags.split(" ").includes(f); c.hidden = !on; if (on) n++; });
      chips.forEach(ch => ch.setAttribute("aria-pressed", String(ch.dataset.filter === f)));
      if (count) count.textContent = n + (n === 1 ? " project" : " projects");
    };
    chips.forEach(ch => ch.addEventListener("click", () => apply(ch.dataset.filter)));
    apply("all");
  }

  /* ---------- split demo: why photos of one animal must stay together ---------- */
  const demo = $("#split-demo");
  if (demo) {
    const herd = $(".herd", demo);
    const out = $(".demo-out", demo);
    const N = 10, PHOTOS = 4, TEST_FRAC = 0.2;
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const shuffle = a => { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
    const cows = Array.from({ length: N }, (_, c) => ({ id: "Cow " + (c + 1) }));
    herd.innerHTML = cows.map((c, n) =>
      `<div class="cow" data-cow="${n}"><div class="cow-name"><span>${c.id}</span><span class="flag"></span></div>` +
      `<div class="photos">${Array.from({ length: PHOTOS }, (_, p) => `<div class="photo train" data-p="${p}">${p + 1}</div>`).join("")}</div></div>`
    ).join("");
    const paint = isTest => {
      let leaky = 0, testPhotos = 0;
      $$(".cow", herd).forEach((el, c) => {
        let t = 0;
        $$(".photo", el).forEach((ph, p) => {
          const on = isTest(c, p);
          ph.className = "photo " + (on ? "test" : "train");
          ph.title = on ? "test photo" : "training photo";
          if (on) { t++; testPhotos++; }
        });
        const leak = t > 0 && t < PHOTOS;
        el.classList.toggle("leak", leak);
        $(".flag", el).textContent = leak ? "seen" : "";
        if (leak) leaky++;
      });
      return { leaky, testPhotos };
    };
    const randomSplit = () => {
      const all = shuffle(Array.from({ length: N * PHOTOS }, (_, k) => k));
      const test = new Set(all.slice(0, Math.round(N * PHOTOS * TEST_FRAC)));
      const r = paint((c, p) => test.has(c * PHOTOS + p));
      out.className = "demo-out bad";
      out.innerHTML = `<b>Random photo split:</b> ${r.leaky} of ${N} cows have photos on <i>both</i> sides. ` +
        `The model is tested on cows it has already seen from another angle, so its score looks better than it will be on a new farm.`;
    };
    const animalSplit = () => {
      const test = new Set(shuffle(Array.from({ length: N }, (_, k) => k)).slice(0, Math.round(N * TEST_FRAC)));
      paint(c => test.has(c));
      out.className = "demo-out good";
      out.innerHTML = `<b>Split by animal:</b> all four photos of a cow stay together. Every test cow is new to the model, ` +
        `which is the situation a farmer would face. This is how every model in my thesis is tested.`;
    };
    $("[data-split=random]", demo).addEventListener("click", randomSplit);
    $("[data-split=animal]", demo).addEventListener("click", animalSplit);
    randomSplit();
  }

  /* ---------- least-squares playground (with BAM!) ---------- */
  const pg = $("#ls-playground");
  if (pg) {
    const svg = $("svg", pg);
    const NS = "http://www.w3.org/2000/svg";
    const W = 600, H = 400, PAD = 40;
    const gPts = $("#pts", svg), gRes = $("#res", svg), line = $("#fit", svg);
    const bam = $(".bam", pg);
    const elSlope = $("#st-slope"), elR2 = $("#st-r2"), elN = $("#st-n"), msg = $("#pg-msg");
    let pts = [[90, 300], [170, 270], [250, 235], [330, 215], [410, 160]];
    let best = 0, bamTimer = null;

    const toSvg = e => {
      const r = svg.getBoundingClientRect();
      const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
      return [Math.min(W - PAD, Math.max(PAD, x)), Math.min(H - PAD, Math.max(PAD, y))];
    };
    const fit = () => {
      const n = pts.length;
      if (n < 2) return null;
      const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
      let sxy = 0, sxx = 0, syy = 0;
      pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
      if (sxx === 0) return null;
      const b = sxy / sxx, a = my - b * mx;
      const ssr = pts.reduce((s, [x, y]) => s + (y - (a + b * x)) ** 2, 0);
      return { a, b, r2: syy === 0 ? 1 : 1 - ssr / syy };
    };
    const shout = text => {
      bam.textContent = text;
      bam.classList.add("show");
      clearTimeout(bamTimer);
      bamTimer = setTimeout(() => bam.classList.remove("show"), 1100);
    };
    const draw = () => {
      gPts.innerHTML = ""; gRes.innerHTML = "";
      const f = fit();
      pts.forEach(([x, y], k) => {
        if (f) {
          const l = document.createElementNS(NS, "line");
          l.setAttribute("x1", x); l.setAttribute("x2", x); l.setAttribute("y1", y); l.setAttribute("y2", f.a + f.b * x);
          l.setAttribute("class", "resid"); gRes.appendChild(l);
        }
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 8);
        c.setAttribute("class", "pt"); c.dataset.k = k; gPts.appendChild(c);
      });
      elN.textContent = pts.length;
      if (!f) { line.setAttribute("visibility", "hidden"); elSlope.textContent = "–"; elR2.textContent = "–"; msg.textContent = "Add at least two points."; return; }
      line.setAttribute("visibility", "visible");
      line.setAttribute("x1", PAD); line.setAttribute("y1", f.a + f.b * PAD);
      line.setAttribute("x2", W - PAD); line.setAttribute("y2", f.a + f.b * (W - PAD));
      elSlope.textContent = (-f.b).toFixed(2);   // screen y grows downward, so flip the sign
      elR2.textContent = f.r2.toFixed(2);
      if (pts.length >= 5 && f.r2 >= 0.97 && best < 2) { shout("DOUBLE BAM!!"); best = 2; }
      else if (pts.length >= 4 && f.r2 >= 0.9 && best < 1) { shout("BAM!"); best = 1; }
      if (f.r2 < 0.85) best = 0;
      msg.textContent = f.r2 >= 0.9 ? "The line explains most of the spread. Now drag one point far away and watch R² drop." :
        f.r2 >= 0.5 ? "The residuals (dashed) are the bits the line cannot explain. Shrink them to raise R²." :
        "Lots of scatter: a straight line explains little here. Try lining the points up.";
    };

    let drag = null, moved = false;
    svg.addEventListener("pointerdown", e => {
      const t = e.target;
      moved = false;
      if (t.classList && t.classList.contains("pt")) { drag = +t.dataset.k; svg.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    svg.addEventListener("pointermove", e => { if (drag === null) return; moved = true; pts[drag] = toSvg(e); draw(); });
    svg.addEventListener("pointerup", e => {
      if (drag !== null) {
        if (!moved) { pts.splice(drag, 1); best = 0; draw(); }   // a tap on a point removes it
        drag = null; return;
      }
      if (pts.length < 30) { pts.push(toSvg(e)); draw(); }
    });
    $("#pg-reset").addEventListener("click", () => { pts = []; best = 0; draw(); });
    $("#pg-random").addEventListener("click", () => {
      best = 0;
      const slope = -(0.3 + Math.random() * 0.5), noise = 10 + Math.random() * 60;
      pts = Array.from({ length: 9 }, (_, k) => {
        const x = 70 + k * 58;
        const y = 330 + slope * (x - 70) + (Math.random() - 0.5) * 2 * noise;
        return [x, Math.min(H - PAD, Math.max(PAD, y))];
      });
      draw();
    });
    draw();
  }
})();
