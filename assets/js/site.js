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
})();
