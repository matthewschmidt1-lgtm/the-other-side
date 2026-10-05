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

  /* ---------- the opening choice: the visitor picks the direction ---------- */
  var DEMOS = {
    someone: { obs: "Say they agreed in the meeting, then did nothing.", ask: "What explains it?", head: "The same behavior fits all four.", rows: [
      ["They disagreed and didn't say so", "Agreement came fast, with no questions. They raise it later, with someone else."],
      ["They agreed and are overloaded", "Other commitments are slipping too. They apologize when asked."],
      ["They thought it was someone else's job", "They are surprised when you follow up."],
      ["They're waiting to see if you meant it", "They move as soon as you ask a second time."]] },
    thing: { obs: "Say the launch fell flat.", ask: "What explains it?", head: "The same result fits all four.", rows: [
      ["The product was wrong", "The people who tried it didn't come back."],
      ["The timing was wrong", "People liked it and had no room for it yet."],
      ["The right people never saw it", "The few who found it stayed."],
      ["It worked, and you measured too early", "The numbers are small and still climbing."]] },
    future: { obs: "Say it has grown fast for three years.", ask: "What happens next?", head: "The same trend fits all four.", rows: [
      ["It keeps going", "The cause behind it is still in place, and you can name it."],
      ["It slows", "Each year's gain was harder to get than the last."],
      ["It was a one-off", "It began with an event that won't repeat."],
      ["It reverses", "The people who drove it are starting to leave."]] },
    belief: { obs: "Say most people believe something you are sure is false.", ask: "Why do they?", head: "The same disagreement fits all four.", rows: [
      ["They have facts you don't", "They can name something specific you hadn't heard."],
      ["They trust different sources", "Their evidence is who said it. So is yours."],
      ["Changing their mind would cost them", "The belief is tied to people or work they would lose."],
      ["You are the one who is wrong", "Your own reasons turn out to be secondhand."]] },
    self: { obs: "Say you have done it again.", ask: "Why?", head: "The same habit fits all four.", rows: [
      ["You notice too late", "You can describe the moment only afterwards."],
      ["It pays you in a way you haven't admitted", "Something gets easier every time you do it."],
      ["The situation makes it nearly unavoidable", "Other people in your position do it too."],
      ["By your own values, it isn't a mistake", "You would choose it again with full information."]] }
  };
  var dirs = [].slice.call(document.querySelectorAll(".choice.dir"));
  var exs = [].slice.call(document.querySelectorAll(".choice.ex"));
  var live = document.getElementById("live");
  var obs = document.getElementById("turn-obs");
  var headEl = document.getElementById("h-turn");
  var reveal = document.getElementById("reveal");
  var rows = [].slice.call(document.querySelectorAll("#fits > div"));
  var current = DEMOS.someone;
  dirs.forEach(function (b) {
    b.addEventListener("click", function () {
      current = DEMOS[b.getAttribute("data-c")];
      dirs.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      obs.textContent = current.obs;
      document.getElementById("turn-ask").textContent = current.ask;
      headEl.textContent = current.head;
      exs.forEach(function (x, i) { x.setAttribute("aria-pressed", "false"); x.lastElementChild.textContent = current.rows[i][0]; });
      rows.forEach(function (r, i) { r.classList.remove("picked"); r.children[0].textContent = current.rows[i][0]; r.children[1].textContent = current.rows[i][1]; });
      reveal.classList.add("wait");
      live.textContent = "Example: " + current.obs + " " + current.ask;
      var c = b.getAttribute("data-c");
      [].forEach.call(document.querySelectorAll(".go-session"), function (l) { l.setAttribute("href", "session/#" + c); });
    });
  });
  exs.forEach(function (b, n) {
    b.addEventListener("click", function () {
      exs.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      rows.forEach(function (r, i) { r.classList.toggle("picked", i === n); });
      reveal.classList.remove("wait");
      live.textContent = current.head + " Your explanation may be right, but the observation is compatible with every one of these.";
      reveal.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
      request();
    });
  });

})();
