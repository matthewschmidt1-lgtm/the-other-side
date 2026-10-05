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
    person: { obs: "Say they agreed in the meeting, then did nothing.", head: "The same behavior fits all four.", rows: [
      ["They disagreed and didn't say so", "Agreement came fast, with no questions. They raise it later, with someone else."],
      ["They agreed and are overloaded", "Other commitments are slipping too. They apologize when asked."],
      ["They thought it was someone else's job", "They are surprised when you follow up."],
      ["They're waiting to see if you meant it", "They move as soon as you ask a second time."]] },
    rel: { obs: "Say they have gone quiet.", head: "The silence fits all four.", rows: [
      ["Upset with you", "Cool with you, normal with everyone else. It began at a point you could name."],
      ["Overwhelmed", "Quiet with most people. Replies come late, short and apologetic."],
      ["Losing interest", "You start every exchange. Little is offered back."],
      ["Keeping something from you", "Fine in company or by message. It is time alone with you that falls through."]] },
    thing: { obs: "Say the launch fell flat.", head: "The same result fits all four.", rows: [
      ["The product was wrong", "The people who tried it didn't come back."],
      ["The timing was wrong", "People liked it and had no room for it yet."],
      ["The right people never saw it", "The few who found it stayed."],
      ["It worked, and you measured too early", "The numbers are small and still climbing."]] },
    belief: { obs: "Say they believe something you are sure is false.", head: "The same disagreement fits all four.", rows: [
      ["They have facts you don't", "They can name something specific you hadn't heard."],
      ["They trust different sources", "Their evidence is who said it. So is yours."],
      ["Changing their mind would cost them", "The belief is tied to people or work they would lose."],
      ["You are the one who is wrong", "Your own reasons turn out to be secondhand."]] },
    self: { obs: "Say you have done it again.", head: "The same mistake fits all four.", rows: [
      ["You notice too late", "You can describe the moment only afterwards."],
      ["It pays you in a way you haven't admitted", "Something gets easier every time you do it."],
      ["The situation makes it nearly unavoidable", "Other people in your position do it too."],
      ["By your own values, it isn't a mistake", "You would choose it again with full information."]] }
  };
  var choices = [].slice.call(document.querySelectorAll(".choice"));
  var pickLabel = document.getElementById("turn-pick");
  var live = document.getElementById("live");
  var obs = document.getElementById("turn-obs");
  var headEl = document.getElementById("h-turn");
  var rows = [].slice.call(document.querySelectorAll("#fits > div"));
  choices.forEach(function (b) {
    b.addEventListener("click", function () {
      var d = DEMOS[b.getAttribute("data-c")];
      var text = b.lastElementChild.textContent;
      choices.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      pickLabel.textContent = "You chose: " + text;
      obs.textContent = d.obs;
      headEl.textContent = d.head;
      rows.forEach(function (r, i) { r.children[0].textContent = d.rows[i][0]; r.children[1].textContent = d.rows[i][1]; });
      live.textContent = "You chose: " + text + ". " + d.obs + " " + d.head;
      document.getElementById("cta-note").textContent = b.getAttribute("data-c") === "rel"
        ? "This is the direction you chose."
        : "The direction you chose isn't open yet. This one is.";
      turn.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
    });
  });


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
