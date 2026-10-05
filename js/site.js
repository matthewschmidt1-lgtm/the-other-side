(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var crossing = document.getElementById("crossing");
  var turn = document.getElementById("turn");

  /* ---------- the light: one scroll reader, two variables ---------- */
  var ticking = false;
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var max = Math.max(1, root.scrollHeight - vh);
    var p = clamp(window.scrollY / max);
    var light = p * p * (3 - 2 * p);
    var r = crossing.getBoundingClientRect();
    var cross = clamp(-r.top / Math.max(1, r.height - vh));
    if (reduce.matches) {
      light = Math.round(light * 4) / 4;
      cross = cross > 0.5 ? 1 : 0;
    }
    root.style.setProperty("--light", light.toFixed(4));
    root.style.setProperty("--cross", cross.toFixed(4));
    if (cross > 0.5) root.setAttribute("data-side", "far"); else root.removeAttribute("data-side");
    document.body.classList.toggle("past-turn", turn.getBoundingClientRect().top < vh * 0.5);
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  update();

  /* ---------- the opening choice ---------- */
  var choices = [].slice.call(document.querySelectorAll(".choice"));
  var pickLabel = document.getElementById("turn-pick");
  var live = document.getElementById("live");
  var rows = [].slice.call(document.querySelectorAll(".fits > div"));
  choices.forEach(function (b) {
    b.addEventListener("click", function () {
      var c = b.getAttribute("data-c");
      var text = b.lastElementChild.textContent;
      choices.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      rows.forEach(function (r) { r.classList.toggle("picked", r.getAttribute("data-c") === c); });
      pickLabel.textContent = "You chose: " + text;
      live.textContent = "You chose: " + text + " The silence fits all four.";
      turn.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---------- the instrument ---------- */
  var gauge = document.getElementById("gauge");
  var val = document.getElementById("g-val");
  var steps = [].slice.call(document.querySelectorAll(".step"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        steps.forEach(function (s) { s.classList.toggle("on", s === e.target); });
        gauge.style.setProperty("--g", e.target.getAttribute("data-g"));
        val.textContent = e.target.getAttribute("data-v");
      });
    }, { rootMargin: "-48% 0px -48% 0px" });
    steps.forEach(function (s) { io.observe(s); });
  } else {
    steps.forEach(function (s) { s.classList.add("on"); });
  }
})();
